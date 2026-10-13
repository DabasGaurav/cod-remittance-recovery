/* COD Remittance Recovery — rules engine (deterministic, no AI).
   Works in the browser (window.CODEngine) and in Node (module.exports). */
(function (root) {
  'use strict';

  // ---------- dates (all IST calendar dates as 'YYYY-MM-DD') ----------
  const D = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const S = (dt) => dt.toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return S(d); };
  const dow = (s) => D(s).getUTCDay(); // 0 Sun .. 6 Sat

  function makeCalendar(holidays) {
    const hol = new Set(holidays || []);
    const isWorking = (s) => { const w = dow(s); return w >= 1 && w <= 5 && !hol.has(s); };
    const addWorking = (s, n) => { let d = s; while (n > 0) { d = addDays(d, 1); if (isWorking(d)) n--; } return d; };
    const nextWorking = (s) => { let d = s; while (!isWorking(d)) d = addDays(d, 1); return d; };
    // Shiprocket Standard payout days: Mon / Wed / Fri; a holiday moves to the next working day
    const isPayoutSlot = (s) => [1, 3, 5].includes(dow(s));
    const firstPayoutOnOrAfter = (s) => { let d = s; while (!isPayoutSlot(d)) d = addDays(d, 1); return nextWorking(d); };
    const payoutDaysBetween = (from, to) => { // inclusive, actual (holiday-shifted) payout dates
      const out = new Set(); let d = from;
      while (d <= to) { if (isPayoutSlot(d)) out.add(nextWorking(d)); d = addDays(d, 1); }
      return [...out].filter((x) => x >= from && x <= to).sort();
    };
    return { isWorking, addWorking, nextWorking, firstPayoutOnOrAfter, payoutDaysBetween };
  }

  const PLAN_RULES = {
    standard: { label: 'Standard', payoutLagWorkingDays: 8, promiseWorkingDays: 10, feePct: 0 },
    ecod_d2: { label: 'Early COD D+2', payoutLagWorkingDays: 2, promiseWorkingDays: 10, feePct: 0.99 },
    ecod_d3: { label: 'Early COD D+3', payoutLagWorkingDays: 3, promiseWorkingDays: 10, feePct: 0.69 },
    ecod_d4: { label: 'Early COD D+4', payoutLagWorkingDays: 4, promiseWorkingDays: 10, feePct: 0.49 },
  };

  const normId = (s) => String(s || '').replace(/#/g, '').trim().toLowerCase();

  /**
   * run(data, today) -> result
   * data: { merchant, plan, holidays, orders[], shipments[], remittances[], lines[], wallet[], reports[], ownerHold }
   * All money in paise (integers).
   */
  function run(data, today) {
    const cal = makeCalendar(data.holidays);
    const plan = PLAN_RULES[data.plan || 'standard'];
    const ordersById = new Map(data.orders.map((o) => [normId(o.id), o]));
    const shipByAwb = new Map(data.shipments.map((s) => [s.awb, s]));
    const crfById = new Map(data.remittances.map((r) => [r.crf, r]));

    // ---- ledger: lines deduped on (account, AWB, CRF); only lines with a CRF + date count as paid ----
    const seen = new Set(); const ledger = [];
    for (const l of data.lines) {
      const key = `${l.account || 'SR1'}|${l.awb}|${l.crf}`;
      if (seen.has(key) || !l.crf || !crfById.has(l.crf)) continue;
      seen.add(key); ledger.push(l);
    }
    const paidByOrder = new Map(); const linesByOrder = new Map();
    for (const l of ledger) {
      const sh = shipByAwb.get(l.awb); const oid = normId(sh ? sh.orderId : l.orderId);
      paidByOrder.set(oid, (paidByOrder.get(oid) || 0) + l.remitted);
      if (!linesByOrder.has(oid)) linesByOrder.set(oid, []);
      linesByOrder.get(oid).push(l);
    }

    // ---- report coverage ----
    const covered = new Set();
    for (const r of data.reports || []) { let d = r.from; while (d <= r.to) { covered.add(d); d = addDays(d, 1); } }
    const coveredUpTo = (() => { let d = addDays(today, -1); while (covered.has(d)) d = addDays(d, -1); return addDays(d, 1); })();
    const lastCovered = [...covered].sort().pop() || null;
    const coverageOk = (from) => { let d = from; const end = addDays(today, -1); while (d <= end) { if (!covered.has(d)) return false; d = addDays(d, 1); } return true; };
    const crfDates = new Set(data.remittances.map((r) => r.date));

    // ---- per order ----
    const rows = [];
    for (const o of data.orders) {
      const sh = data.shipments.find((s) => normId(s.orderId) === normId(o.id));
      const row = { order: o, ship: sh, oid: normId(o.id) };
      // scope
      if (o.channel !== 'magic_checkout' || !sh) { row.status = 'out_of_scope'; row.reason = 'Not a Magic Checkout order shipped via Shiprocket'; rows.push(row); continue; }
      const owed = o.total - o.paidOnlineBeforeDispatch;
      row.owed = owed;
      if (owed <= 0) { row.status = 'out_of_scope'; row.reason = 'Prepaid order'; rows.push(row); continue; }
      if (o.paidViaRazorpayAfterDispatch) { row.status = 'needs_look'; row.reason = 'Paid through Razorpay after dispatch'; rows.push(row); continue; }
      if (sh.status === 'RTO_DELIVERED' || sh.status === 'LOST') { row.status = 'not_owed'; row.reason = sh.status === 'LOST' ? 'Lost shipment' : 'Returned to you (RTO)'; rows.push(row); continue; }
      if (sh.history && sh.history.includes('DELIVERED') && sh.status !== 'DELIVERED') { row.status = 'needs_look'; row.reason = 'Marked delivered, then returned'; rows.push(row); continue; }
      if (sh.status !== 'DELIVERED') { row.status = 'in_transit'; row.reason = 'Not delivered yet'; rows.push(row); continue; }
      if (Math.abs(sh.codAmount - owed) > 100) { row.status = 'needs_look'; row.reason = "Your order and Shiprocket's COD amount differ"; rows.push(row); continue; }
      if (!sh.deliveredOn) { row.status = 'needs_look'; row.reason = 'No delivery date'; rows.push(row); continue; }

      const dd = sh.deliveredOn;
      row.dueIn = cal.firstPayoutOnOrAfter(cal.addWorking(dd, plan.payoutLagWorkingDays));
      row.promiseEnds = cal.addWorking(dd, plan.promiseWorkingDays);
      row.claimableFrom = cal.addWorking(row.promiseEnds, 1);
      const nextAfterDue = cal.payoutDaysBetween(addDays(row.dueIn, 1), addDays(row.dueIn, 7))[0];
      row.nextPayout = nextAfterDue;
      const fee = Math.round(owed * plan.feePct / 100);
      row.expectedNet = owed - fee;
      const paid = paidByOrder.get(row.oid) || 0;
      row.paid = paid; row.lines = linesByOrder.get(row.oid) || [];
      row.searched = data.remittances.filter((r) => r.date >= row.dueIn).map((r) => r.crf);

      const twoReceived = crfDates.has(row.dueIn) && crfDates.has(nextAfterDue);
      const ready = today >= row.claimableFrom && twoReceived && coverageOk(dd);
      if (Math.abs(paid - row.expectedNet) <= 100) row.status = 'paid';
      else if (paid > row.expectedNet) row.status = 'paid_more';
      else if (today < row.dueIn) row.status = 'on_time';
      else if (!ready) row.status = 'waiting';
      else if (paid === 0) { row.status = 'not_remitted'; row.claim = row.expectedNet; }
      else { row.status = 'short'; row.claim = row.expectedNet - paid; }
      rows.push(row);
    }

    // ---- holds ----
    const holds = [];
    const firstDue = rows.filter((r) => r.dueIn).map((r) => r.dueIn).sort()[0];
    if (firstDue) {
      for (const day of cal.payoutDaysBetween(firstDue, addDays(today, -1))) {
        const due = rows.filter((r) => r.dueIn === day);
        if (!due.length || !covered.has(day)) continue;
        if (!crfDates.has(day)) { holds.push({ day, reason: 'no_payout', count: due.length }); continue; }
        const unpaid = due.filter((r) => ['waiting', 'not_remitted', 'short'].includes(r.status) && r.paid === 0);
        if (unpaid.length > due.length / 2) holds.push({ day, reason: 'mostly_unpaid', count: unpaid.length });
      }
    }
    if (data.ownerHold) holds.push({ day: today, reason: 'owner_reported' });
    if (holds.length) for (const r of rows) if (r.status === 'not_remitted') { r.status = 'cant_tell'; r.claim = 0; r.reason = 'Shiprocket may be holding your payout'; }

    // ---- report gaps block claims that depend on missing days ----
    const reportGap = lastCovered && lastCovered < addDays(today, -1) ? { since: lastCovered } : (!lastCovered ? { since: null } : null);

    // ---- wallet ----
    const walletIssues = [];
    for (const w of data.wallet) {
      const sh = shipByAwb.get(w.awb);
      if (w.type === 'RTO Freight' && sh && sh.status === 'DELIVERED' && !(sh.history || []).includes('RTO_INITIATED')) {
        const reversed = data.wallet.some((x) => x.awb === w.awb && x.type === 'RTO Freight Reversed');
        if (!reversed) walletIssues.push({ kind: 'rto_on_delivered', wallet: w, ship: sh, claim: w.debit });
      }
    }
    for (const sh of data.shipments.filter((s) => s.status === 'RTO_DELIVERED')) {
      const charged = data.wallet.find((x) => x.awb === sh.awb && x.type === 'COD Charge');
      const reversed = data.wallet.some((x) => x.awb === sh.awb && x.type === 'COD Charge Reversed');
      if (charged && !reversed && sh.rtoOn && today >= addDays(sh.rtoOn, 7)) walletIssues.push({ kind: 'cod_charge_not_reversed', wallet: charged, ship: sh, claim: charged.debit });
    }

    // ---- per remittance (CRF) ----
    const remittanceViews = data.remittances.slice().sort((a, b) => a.date.localeCompare(b.date)).map((r) => {
      const due = rows.filter((x) => x.dueIn === r.date);
      const lines = ledger.filter((l) => l.crf === r.crf);
      const paidTotal = lines.reduce((a, l) => a + l.remitted, 0);
      const notPaid = due.filter((x) => x.paid === 0 && ['not_remitted', 'waiting', 'cant_tell'].includes(x.status));
      const short = due.filter((x) => x.status === 'short' || (x.status === 'waiting' && x.paid > 0 && x.paid < x.expectedNet));
      return {
        ...r, dueCount: due.length, dueAmount: due.reduce((a, x) => a + x.owed, 0),
        lineCount: lines.length, paidTotal, printedTotalOk: r.total == null || r.total === paidTotal,
        notPaid, notPaidAmount: notPaid.reduce((a, x) => a + x.owed, 0),
        short, shortAmount: short.reduce((a, x) => a + (x.expectedNet - x.paid), 0),
      };
    });

    // ---- summary ----
    const by = (st) => rows.filter((r) => r.status === st);
    const claimRows = [...by('not_remitted'), ...by('short')];
    const outstanding = rows.filter((r) => ['on_time', 'waiting', 'not_remitted', 'short', 'cant_tell'].includes(r.status));
    const outstandingAmt = (r) => r.status === 'short' ? r.claim : (r.expectedNet - (r.paid || 0));
    const onTime = rows.filter((r) => r.status === 'on_time');
    const nextPayout = cal.payoutDaysBetween(today, addDays(today, 10)).find((d) => d > addDays(today, -1) && rows.some((r) => r.dueIn === d && r.status === 'on_time'));
    const claimTotal = claimRows.reduce((a, r) => a + r.claim, 0) + walletIssues.reduce((a, w) => a + w.claim, 0);
    const buckets = {};
    for (const r of by('on_time')) { (buckets[r.dueIn] = buckets[r.dueIn] || { count: 0, amount: 0 }); buckets[r.dueIn].count++; buckets[r.dueIn].amount += r.expectedNet; }

    return {
      today, plan, rows, ledger, holds, reportGap, coveredUpTo, lastCovered, walletIssues, remittanceViews, buckets,
      summary: {
        withShiprocket: outstanding.reduce((a, r) => a + outstandingAmt(r), 0),
        withShiprocketCount: outstanding.length,
        onTime: onTime.reduce((a, r) => a + r.expectedNet - (r.paid || 0), 0),
        onTimeCount: onTime.length,
        toClaimCod: claimRows.reduce((a, r) => a + r.claim, 0),
        toClaimCodCount: claimRows.length,
        claimTotal, claimOrderCount: claimRows.length + walletIssues.length,
        notRemitted: by('not_remitted'), short: by('short'), waiting: by('waiting'), needsLook: by('needs_look'), cantTell: by('cant_tell'),
        nextPayout,
      },
    };
  }

  const api = { run, makeCalendar, PLAN_RULES, addDays, normId };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CODEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
