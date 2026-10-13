/* Situations the merchant can be in. Each returns { data, today, label, note }. */
(function (root) {
  'use strict';
  const DD = root.CODData || (typeof require !== 'undefined' ? require('./data.js') : null);
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const dropCrf = (d, crf) => { d.remittances = d.remittances.filter((r) => r.crf !== crf); d.lines = d.lines.filter((l) => l.crf !== crf); };
  const GAP_IDS = ['#NH-20417', '#NH-20433', '#NH-20451', '#NH-20488', '#NH-20502', '#NH-20440', '#NH-20475'];

  function payGapsIn(d, crf, date) {
    for (const id of GAP_IDS) {
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
        d.lines = d.lines.filter((l) => !(['#NH-20440', '#NH-20475'].includes(l.orderId)));
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
    recovered: {
      label: 'After recovery', short: 'Recovered',
      note: 'Thu 15 Oct. Shiprocket paid the seven orders in its Wed 14 Oct payout and reversed the ₹128 RTO charge. The claim closes on its own.',
      make() {
        const d = DD.build();
        d.remittances.push({ crf: 'CRF26101401', date: '2026-10-14', utr: 'SBIN526287240019', account: 'SR1' });
        payGapsIn(d, 'CRF26101401', '2026-10-14');
        // the orders that were due on Wed 14 Oct are paid too
        const E = root.CODEngine || require('./engine.js');
        const pre = E.run(d, '2026-10-15');
        pre.rows.filter((r) => r.dueIn === '2026-10-14').forEach((r) => {
          if ((r.paid || 0) === 0) d.lines.push({ account: 'SR1', crf: 'CRF26101401', awb: r.ship.awb, orderId: r.order.id, cod: r.ship.codAmount, remitted: r.ship.codAmount, remittanceDate: '2026-10-14' });
        });
        const o = d.wallet.find((w) => w.type === 'RTO Freight');
        d.wallet.push({ date: '2026-10-14', awb: o.awb, orderId: o.orderId, type: 'RTO Freight Reversed', debit: 0, credit: o.debit, ref: 'PB-89120' });
        d.reports = [{ from: '2026-09-15', to: '2026-10-14', receivedAt: '2026-10-15T07:00' }];
        d.remittances.forEach((r) => { r.total = d.lines.filter((l) => l.crf === r.crf).reduce((a, l) => a + l.remitted, 0); });
        return { data: d, today: '2026-10-15', claimSentOn: '2026-10-13' };
      },
    },
  };

  const api = { SCENARIOS, GAP_IDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CODScenarios = api;
})(typeof window !== 'undefined' ? window : globalThis);
