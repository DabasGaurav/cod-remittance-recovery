/* Situations the merchant can be in. Each returns { data, today, label, note }. */
(function (root) {
  'use strict';
  const DD = root.CODData || (typeof require !== 'undefined' ? require('./data.js') : null);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const dropCrf = (d, crf) => { d.remittances = d.remittances.filter((r) => r.crf !== crf); d.lines = d.lines.filter((l) => l.crf !== crf); };
  const GAP_IDS = ['#PE-20417', '#PE-20433', '#PE-20451', '#PE-20488', '#PE-20502', '#PE-20440', '#PE-20475'];

  function payGapsIn(d, crf, date, ids = GAP_IDS) {
    for (const id of ids) {
      const sh = d.shipments.find((s) => s.orderId === id);
      const already = d.lines.filter((l) => l.awb === sh.awb).reduce((a, l) => a + l.remitted, 0);
      d.lines.push({ account: 'SR1', crf, awb: sh.awb, orderId: id, cod: sh.codAmount, remitted: sh.codAmount - already, remittanceDate: date });
    }
  }

  const SCENARIOS = {
    hero: {
      label: 'Money to claim', short: 'Today',
      note: 'Tue 13 Oct, 09:05. Shiprocket paid on Fri 9 and Mon 12 Oct. Seven orders are past Shiprocket\'s 10 working days and are unpaid or short, and one wallet charge is wrong.',
      make() { return { data: DD.build(), today: '2026-10-13' }; },
    },
    allPaid: {
      label: 'All paid', short: 'All paid',
      note: 'A normal week: every order due in the Fri 9 Oct payout was paid in full. No alert is sent.',
      make() {
        const d = DD.build();
        d.lines = d.lines.filter((l) => !(['#PE-20440', '#PE-20475'].includes(l.orderId)));
        payGapsIn(d, 'CRF26100901', '2026-10-09');
        d.wallet = d.wallet.filter((w) => w.type !== 'RTO Freight');
        d.remittances.forEach((r) => { r.total = d.lines.filter((l) => l.crf === r.crf).reduce((a, l) => a + l.remitted, 0); });
        return { data: d, today: '2026-10-13' };
      },
    },
    late: {
      label: 'Late, not yet claimable', short: 'Late',
      note: 'Sat 10 Oct. Seven orders were missing or short in the Fri 9 Oct payout, but Shiprocket still has until Mon 12 Oct (10 working days). They show as late, and no claim is made.',
      make() {
        const d = DD.build(); dropCrf(d, 'CRF26101201');
        d.reports = [{ from: '2026-09-13', to: '2026-10-09', receivedAt: '2026-10-10T07:00' }];
        return { data: d, today: '2026-10-10' };
      },
    },
    hold: {
      label: 'Payout on hold', short: 'On hold',
      note: 'Tue 13 Oct. Shiprocket\'s report covers Mon 12 Oct, but no payout was made that day although orders were due. That looks like a hold (an unpaid invoice or negative wallet), so no "not paid" claim is made.',
      make() { const d = DD.build(); dropCrf(d, 'CRF26101201'); return { data: d, today: '2026-10-13' }; },
    },
    reportMissing: {
      label: 'Report not received', short: 'No report',
      note: 'Tue 13 Oct. Shiprocket\'s daily report has not arrived since Sat 10 Oct, so the check cannot see Mon 12 Oct. Nothing is claimed until the report arrives.',
      make() {
        const d = DD.build(); dropCrf(d, 'CRF26101201');
        d.reports = [{ from: '2026-09-13', to: '2026-10-10', receivedAt: '2026-10-11T07:00' }];
        return { data: d, today: '2026-10-13' };
      },
    },
    needsLook: {
      label: 'Needs a look', short: 'Needs a look',
      note: 'One order\'s COD amount at Shiprocket differs from your Razorpay order, for example because the order was edited after dispatch. It is never claimed automatically, and you decide.',
      make() {
        const d = DD.build();
        const sh = d.shipments.find((s) => s.status === 'DELIVERED' && s.deliveredOn === '2026-10-01' && s.codAmount === 124900) || d.shipments.find((s) => s.status === 'DELIVERED' && s.deliveredOn === '2026-10-01');
        sh.codAmount += 20000; sh.flagged = true;
        return { data: d, today: '2026-10-13' };
      },
    },
    twoWeeks: {
      label: 'Two weeks later, not claimed', short: '2 weeks later',
      note: 'Tue 27 Oct. Kavya never sent the 13 Oct claim. The seven orders are still unpaid and stay on the list. Three more orders went missing from the Wed 14 Oct payout and were added. Everything else was paid on time. Nothing drops off until Shiprocket pays, or Kavya claims or marks it resolved.',
      make() {
        const d = DD.build();
        const E = root.CODEngine || require('./engine.js');
        const add = [['CRF26101401', '2026-10-14', 'SBIN526287240019'], ['CRF26101601', '2026-10-16', 'SBIN526289001127'], ['CRF26101901', '2026-10-19', 'SBIN526291550384'], ['CRF26102101', '2026-10-21', 'SBIN526293207761'], ['CRF26102301', '2026-10-23', 'SBIN526295640152'], ['CRF26102601', '2026-10-26', 'SBIN526297118830']];
        add.forEach(([crf, date, utr]) => d.remittances.push({ crf, date, utr, account: 'SR1' }));
        // a week of new deliveries (13-23 Oct) that are simply on their way
        let n = 22000;
        for (const day of ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23']) {
          for (let i = 0; i < 34; i++) {
            const id = `#PE-${n++}`; const amt = [599, 799, 899, 999, 1149, 1299, 1499][n % 7] * 100;
            d.orders.push({ id, channel: 'magic_checkout', total: amt, paidOnlineBeforeDispatch: 0, type: 'cod' });
            d.shipments.push({ orderId: id, awb: `1419${String(n).padStart(8, '0')}`, courier: 'Shiprocket', codAmount: amt, status: 'DELIVERED', deliveredOn: day, deliveredAt: '14:00', history: ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] });
          }
        }
        const pre = E.run(d, '2026-10-27');
        let skipped = 0;
        pre.rows.filter((r) => r.dueIn && r.dueIn >= '2026-10-14' && r.dueIn <= '2026-10-26' && (r.paid || 0) === 0).forEach((r) => {
          if (r.dueIn === '2026-10-14' && skipped < 3) { skipped++; return; } // three new orders go missing
          const crf = add.find((a) => a[1] === r.dueIn)[0];
          d.lines.push({ account: 'SR1', crf, awb: r.ship.awb, orderId: r.order.id, cod: r.ship.codAmount, remitted: r.ship.codAmount, remittanceDate: r.dueIn });
        });
        d.reports.push({ from: '2026-09-27', to: '2026-10-26', receivedAt: '2026-10-27T07:00' }); // coverage accumulates, like the ledger
        d.remittances.forEach((r) => { r.total = d.lines.filter((l) => l.crf === r.crf).reduce((a, l) => a + l.remitted, 0); });
        return { data: d, today: '2026-10-27' };
      },
    },
    recovered: {
      label: 'After recovery', short: 'Recovered',
      note: 'Thu 15 Oct. After the claim, Shiprocket paid the five missing orders in its Wed 14 Oct payout and reversed the ₹128 return charge. The two short-paid orders are still open, so the claim stays open for ₹750.',
      make() {
        const d = DD.build();
        d.remittances.push({ crf: 'CRF26101401', date: '2026-10-14', utr: 'SBIN526287240019', account: 'SR1' });
        payGapsIn(d, 'CRF26101401', '2026-10-14', GAP_IDS.slice(0, 5));
        // the orders that were due on Wed 14 Oct are paid too
        const E = root.CODEngine || require('./engine.js');
        const pre = E.run(d, '2026-10-15');
        pre.rows.filter((r) => r.dueIn === '2026-10-14').forEach((r) => {
          if ((r.paid || 0) === 0) d.lines.push({ account: 'SR1', crf: 'CRF26101401', awb: r.ship.awb, orderId: r.order.id, cod: r.ship.codAmount, remitted: r.ship.codAmount, remittanceDate: '2026-10-14' });
        });
        const o = d.wallet.find((w) => w.type === 'RTO Freight');
        d.wallet.push({ date: '2026-10-14', awb: o.awb, orderId: o.orderId, type: 'RTO Freight Reversed', debit: 0, credit: o.debit, ref: 'PB-89120' });
        d.reports.push({ from: '2026-09-15', to: '2026-10-14', receivedAt: '2026-10-15T07:00' });
        d.remittances.forEach((r) => { r.total = d.lines.filter((l) => l.crf === r.crf).reduce((a, l) => a + l.remitted, 0); });
        return { data: d, today: '2026-10-15', claimSentOn: '2026-10-13' };
      },
    },
  };

  const api = { SCENARIOS, GAP_IDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CODScenarios = api;
})(typeof window !== 'undefined' ? window : globalThis);
