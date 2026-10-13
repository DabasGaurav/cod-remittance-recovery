/* Demo merchant dataset — Neel Home (Shiprocket, Standard plan).
   Deterministic: the same dataset is built every time. Money in paise. */
(function (root) {
  'use strict';
  const R = (rupees) => Math.round(rupees * 100);

  function rng(seed) { // mulberry32
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const PRICES = [499, 549, 599, 649, 699, 749, 799, 849, 899, 949, 999, 1049, 1099, 1149, 1199, 1249, 1299, 1349, 1399, 1499, 1599, 1699, 1799, 1899, 1999];

  // n amounts (rupees) that add up exactly to total (rupees), all within 299..4999
  function amounts(n, total, rand) {
    const a = []; for (let i = 0; i < n - 1; i++) a.push(PRICES[Math.floor(rand() * PRICES.length)]);
    let s = a.reduce((x, y) => x + y, 0);
    for (let step = 0; step < 200000; step++) {
      const last = total - s;
      if (last >= 499 && last <= 2499) { a.push(last); return a; }
      const i = Math.floor(rand() * a.length);
      const pool = PRICES.filter((p) => (last < 499 ? p < a[i] : p > a[i]));
      if (!pool.length) continue;
      const p = pool[Math.floor(rand() * pool.length)]; s += p - a[i]; a[i] = p;
    }
    throw new Error(`cannot split ${total} into ${n}`);
  }

  function build() {
    const rand = rng(20261013);
    const orders = []; const shipments = []; const lines = []; const wallet = [];
    const reserved = new Set(['NH-20391', 'NH-20417', 'NH-20433', 'NH-20440', 'NH-20451', 'NH-20475', 'NH-20488', 'NH-20502']);
    let counter = 20271;
    const nextId = () => { let id; do { id = `NH-${counter++}`; } while (reserved.has(id)); return id; };
    const awbOf = () => `1418${String(Math.floor(rand() * 1e8)).padStart(8, '0')}`;
    const time = () => { const h = 10 + Math.floor(rand() * 9); const m = Math.floor(rand() * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

    function addOrder({ id, deliveredOn, owed, advance = 0, status = 'DELIVERED', awb, deliveredAt, outForDeliveryAt, history }) {
      id = id || nextId();
      const total = owed + advance;
      orders.push({ id: `#${id}`, channel: 'magic_checkout', placedOn: null, total: R(total), paidOnlineBeforeDispatch: R(advance), type: advance ? 'partial_cod' : 'cod' });
      const sh = {
        orderId: `#${id}`, awb: awb || awbOf(), courier: 'Shiprocket', codAmount: R(owed), status,
        deliveredOn: status === 'DELIVERED' ? deliveredOn : null,
        deliveredAt: status === 'DELIVERED' ? (deliveredAt || time()) : null,
        outForDeliveryAt: outForDeliveryAt || null,
        history: history || (status === 'DELIVERED' ? ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] : ['PICKED_UP', 'IN_TRANSIT']),
      };
      shipments.push(sh);
      return { id: `#${id}`, sh };
    }
    const maybeAdvance = (owed) => (rand() < 0.15 && owed >= 699 ? [100, 150, 200, 250][Math.floor(rand() * 4)] : 0);

    // group helper: n orders across given dates, adding to `total` rupees
    function group(n, total, dates, opts = {}) {
      const amts = amounts(n, total, rand); const made = [];
      amts.forEach((owed, i) => {
        const deliveredOn = dates[Math.floor((i * dates.length) / n)];
        made.push({ ...addOrder({ deliveredOn, owed, advance: maybeAdvance(owed) }), owed });
      });
      return made;
    }

    const remittances = [
      { crf: 'CRF26100501', date: '2026-10-05', utr: 'SBIN526278310288', account: 'SR1' },
      { crf: 'CRF26100701', date: '2026-10-07', utr: 'SBIN526280193342', account: 'SR1' },
      { crf: 'CRF26100901', date: '2026-10-09', utr: 'SBIN526282064471', account: 'SR1' },
      { crf: 'CRF26101201', date: '2026-10-12', utr: 'SBIN526285117308', account: 'SR1' },
    ];
    const pay = (made, crf) => made.forEach((m) => lines.push({ account: 'SR1', crf, awb: m.sh.awb, orderId: m.id, cod: m.sh.codAmount, remitted: m.sh.codAmount, remittanceDate: remittances.find((r) => r.crf === crf).date }));

    // Mon 5 Oct payout — delivered 21–22 Sep (the Fri 2 Oct slot moves to Mon 5)
    pay(group(60, 61240, ['2026-09-21', '2026-09-22']), 'CRF26100501');

    // Wed 7 Oct payout — delivered 23–24 Sep, incl. #NH-20391
    const b = group(77, 74615 - 1199, ['2026-09-23', '2026-09-24']);
    const o391 = addOrder({ id: 'NH-20391', deliveredOn: '2026-09-23', owed: 1199, deliveredAt: '16:20' });
    b.push({ ...o391, owed: 1199 });
    pay(b, 'CRF26100701');
    wallet.push({ date: '2026-10-08', awb: o391.sh.awb, orderId: o391.id, type: 'RTO Freight', debit: R(128), credit: 0, ref: 'PB-88213' });

    // Fri 9 Oct payout — delivered 25–28 Sep: 145 paid in full, 2 short, 5 not paid
    const paidFull = group(145, 147342, ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28']);
    pay(paidFull, 'CRF26100901');
    const s440 = addOrder({ id: 'NH-20440', deliveredOn: '2026-09-25', owed: 1499, deliveredAt: '12:48' });
    const s475 = addOrder({ id: 'NH-20475', deliveredOn: '2026-09-26', owed: 1299, advance: 200, deliveredAt: '15:31' });
    lines.push({ account: 'SR1', crf: 'CRF26100901', awb: s440.sh.awb, orderId: s440.id, cod: s440.sh.codAmount, remitted: R(1049), remittanceDate: '2026-10-09' });
    lines.push({ account: 'SR1', crf: 'CRF26100901', awb: s475.sh.awb, orderId: s475.id, cod: s475.sh.codAmount, remitted: R(999), remittanceDate: '2026-10-09' });
    addOrder({ id: 'NH-20417', deliveredOn: '2026-09-25', owed: 999, awb: '141826597301', outForDeliveryAt: '09:10', deliveredAt: '14:12' });
    addOrder({ id: 'NH-20433', deliveredOn: '2026-09-26', owed: 1149, deliveredAt: '11:40' });
    addOrder({ id: 'NH-20451', deliveredOn: '2026-09-26', owed: 1049, deliveredAt: '17:05' });
    addOrder({ id: 'NH-20488', deliveredOn: '2026-09-27', owed: 899, deliveredAt: '13:22' });
    addOrder({ id: 'NH-20502', deliveredOn: '2026-09-27', owed: 1149, deliveredAt: '16:48' });

    // Mon 12 Oct payout — delivered 29 Sep
    pay(group(41, 41150, ['2026-09-29']), 'CRF26101201');

    // Still to come
    group(186, 189260, ['2026-09-30', '2026-10-01', '2026-10-03', '2026-10-04']); // due Wed 14 Oct
    group(40, 40560, ['2026-10-05']);                                             // due Fri 16 Oct
    group(38, 38580, ['2026-10-06']);                                             // due Fri 16 Oct
    group(39, 39705, ['2026-10-07']);                                             // due Mon 19 Oct
    group(149, 155710, ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12']); // later

    // A returned order (COD charge reversed correctly) and two in transit
    const rto = addOrder({ deliveredOn: null, owed: 1299, status: 'RTO_DELIVERED', history: ['PICKED_UP', 'IN_TRANSIT', 'UNDELIVERED', 'RTO_INITIATED', 'RTO_DELIVERED'] });
    rto.sh.rtoOn = '2026-10-01';
    wallet.push({ date: '2026-09-24', awb: rto.sh.awb, orderId: rto.id, type: 'COD Charge', debit: R(29), credit: 0, ref: 'PB-87102' });
    wallet.push({ date: '2026-10-01', awb: rto.sh.awb, orderId: rto.id, type: 'COD Charge Reversed', debit: 0, credit: R(29), ref: 'PB-87733' });
    addOrder({ deliveredOn: null, owed: 899, status: 'IN_TRANSIT' });
    addOrder({ deliveredOn: null, owed: 1499, status: 'IN_TRANSIT' });
    // Prepaid orders (out of scope)
    for (let i = 0; i < 6; i++) { const id = nextId(); orders.push({ id: `#${id}`, channel: 'magic_checkout', total: R(999), paidOnlineBeforeDispatch: R(999), type: 'prepaid' }); shipments.push({ orderId: `#${id}`, awb: awbOf(), courier: 'Shiprocket', codAmount: 0, status: 'DELIVERED', deliveredOn: '2026-09-28', history: ['DELIVERED'] }); }

    // Printed CRF totals = sum of their lines
    for (const r of remittances) r.total = lines.filter((l) => l.crf === r.crf).reduce((a, l) => a + l.remitted, 0);

    return {
      merchant: { name: 'Neel Home', owner: 'Kavya', email: 'kavya@neelhome.in', shiprocketAccount: 'SR-118204' },
      plan: 'standard',
      holidays: ['2026-10-02'],
      orders, shipments, remittances, lines, wallet,
      reports: [{ from: '2026-09-13', to: '2026-10-12', receivedAt: '2026-10-13T07:00' }],
      walletBalance: R(4820),
      ownerHold: false,
    };
  }

  const api = { build, R };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CODData = api;
})(typeof window !== 'undefined' ? window : globalThis);
