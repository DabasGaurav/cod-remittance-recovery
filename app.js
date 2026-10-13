/* COD Remittance Recovery — prototype UI. Every figure is computed by CODEngine from the dataset. */
(function () {
  'use strict';
  const E = window.CODEngine; const SC = window.CODScenarios.SCENARIOS;
  const SCEN_DAY = { late: '2026-10-10', twoWeeks: '2026-10-27', recovered: '2026-10-15' };
  const $ = (s, el = document) => el.querySelector(s);
  const screenEl = $('#screen'); const sheetEl = $('#sheet'); const toastEl = $('#toast'); const sideBody = $('#sideBody');

  // ---------- formatting ----------
  const inr = (p) => '₹' + Math.round(p / 100).toLocaleString('en-IN');
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dt = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fd = (s) => { if (!s) return '—'; const d = dt(s); return `${DOW[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
  const fdShort = (s) => { const d = dt(s); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
  const fdLong = (s) => { const d = dt(s); return `${DOWL[d.getUTCDay()]} ${d.getUTCDate()} ${MONL[d.getUTCMonth()]}`; };
  const last4 = (s) => '•••' + String(s).slice(-4);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- icons ----------
  const I = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/></svg>',
    pay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
    prod: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.3M12 17v.01" stroke-linecap="round"/></svg>',
    acct: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3.2" fill="#fff"/><path d="M6.5 18c1.2-2.2 3.2-3.3 5.5-3.3s4.3 1.1 5.5 3.3" fill="#fff"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg>',
    link: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
    page: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6" stroke-linecap="round"/></svg>',
    grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
    truck: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>',
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/></svg>',
    bank: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-5 9 5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/></svg>',
  };
  const rzpIcon = '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M9.6 3h9.6l-7 18H3.5l3.6-9.4L9.6 3z" opacity=".95"/></svg>';

  // ---------- state ----------
  const st = {
    scenario: 'hero', data: null, today: null, run: null, screen: 'lock', flow: 'journey', hist: [],
    sel: new Set(), claimed: new Set(), resolved: {}, lastSent: null, reportOk: true, payoutView: 'owed', orderFilter: 'claim',
    crf: null, claimSent: false, sentAt: null, bankQuery: false, checks: { cod: true, kyc: true },
    sideTab: 'guide', lastProof: null, payoutFilter: 'all', codOn: true,
  };
  function load(key) {
    const s = SC[key]; const m = s.make();
    st.scenario = key; st.data = m.data; st.today = m.today; st.run = E.run(m.data, m.today);
    st.claimSent = !!m.claimSentOn; st.sentAt = m.claimSentOn ? '09:06' : null; st.bankQuery = false; st.lastProof = null;
    st.payoutFilter = 'all'; st.checks = { cod: true, kyc: true }; st.codOn = true; st.alerts = { push: true, wa: true };
    st.resolved = {}; st.lastSent = null; st.hist = []; st.payoutView = 'owed'; st.orderFilter = 'claim';
    const keys = allItems().map((i) => i.key);
    st.claimed = new Set(m.claimSentOn ? keys : []); st.sel = new Set(m.claimSentOn ? [] : keys);
    const withIssue = st.run.remittanceViews.slice().reverse().find((v) => v.notPaid.length || v.short.length);
    st.crf = (withIssue || st.run.remittanceViews[st.run.remittanceViews.length - 1]).crf;
    $('#todayLabel').textContent = fdLong(st.today) + ' 2026';
  }

  // ---------- claim items (orders + wallet charges) ----------
  function allItems() {
    const s = st.run.summary;
    return [...s.notRemitted.map((x) => ({ key: x.order.id, kind: 'nr', amt: x.claim, row: x })),
      ...s.short.map((x) => ({ key: x.order.id, kind: 'sh', amt: x.claim, row: x })),
      ...st.run.walletIssues.map((w) => ({ key: 'W:' + w.wallet.awb, kind: 'w', amt: w.claim, w }))];
  }
  const openItems = () => allItems().filter((i) => !st.resolved[i.key] && !st.claimed.has(i.key));
  const claimedItems = () => allItems().filter((i) => !st.resolved[i.key] && st.claimed.has(i.key));
  const selItems = () => openItems().filter((i) => st.sel.has(i.key));
  const sum = (a) => a.reduce((x, i) => x + i.amt, 0);
  const itemsLabel = (a) => plural(a.length, 'order');
  const resolvedCod = () => allItems().filter((i) => st.resolved[i.key] && i.kind !== 'w').reduce((x, i) => x + i.amt, 0);
  const resolvedCodCount = () => allItems().filter((i) => st.resolved[i.key] && i.kind !== 'w').length;
  const span = (rows) => { const ds = rows.map((x) => x.ship && x.ship.deliveredOn).filter(Boolean).sort(); if (!ds.length) return ''; return ds[0] === ds[ds.length - 1] ? fdShort(ds[0]) : `${fdShort(ds[0])}–${fdShort(ds[ds.length - 1])}`; };
  const daysBetween = (a, b) => Math.round((dt(b) - dt(a)) / 864e5);

  // ---------- chrome helpers ----------
  const statusbar = (dark) => `<div class="statusbar" style="${dark ? 'color:#fff' : ''}"><span>${st.screen === 'lock' ? '' : clockFor()}</span><span class="icons"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.4A10.3 10.3 0 008 .2 10.3 10.3 0 00.7 3.2L2 4.6a8.4 8.4 0 016-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 008 3.8a6.8 6.8 0 00-4.7 1.9l1.3 1.4A4.9 4.9 0 018 5.8zm0 3.4l-2 2.1 2 1.9 2-1.9z"/></svg><svg width="27" height="12" viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor"/><rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".4"/></svg></span></div>`;
  const clockFor = () => (st.scenario === 'hero' && !st.claimSent ? '09:05' : st.claimSent && st.scenario === 'hero' ? '09:06' : '09:05');
  const tabbar = (on) => `<nav class="tabbar">${[['home', 'Home', I.home], ['payouts', 'Payments', I.pay], ['products', 'Products', I.prod], ['support', 'Support', I.help], ['account', 'Account', I.acct]].map(([k, l, ic]) => `<button data-go="${k}" class="${on === k ? 'on' : ''}">${ic}${l}</button>`).join('')}</nav>`;
  const topbar = (title, backTo, extra = '') => `<div class="topbar"><button class="iconbtn" data-act="back" data-fallback="${backTo}" aria-label="Back">${I.back}</button><h2>${title}</h2>${extra}</div>`;
  const view = () => st.run.remittanceViews.find((v) => v.crf === st.crf);

  // ---------- screens ----------
  const screens = {};
  const ADDR = 'cod-pe7k2q@reports.razorpay.com';
  const CSVNAME = 'claim-PE-1013.csv';
  const checkedAt = () => { const rep = st.data.reports[st.data.reports.length - 1]; const [h, m] = rep.receivedAt.slice(11).split(':').map(Number); const t = h * 60 + m + 5; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  const allMatch = () => st.run.remittanceViews.every((v) => v.printedTotalOk);
  const ageOf = (x) => (x.ship && x.ship.deliveredOn ? daysBetween(x.ship.deliveredOn, st.today) : 0);
  const ageChip = (x) => { const a = ageOf(x); return a ? `<span class="chip ${a >= 21 ? 'red' : 'grey'}">${a} days</span>` : ''; };
  const ownedTotal = () => st.run.summary.withShiprocket - resolvedCod();
  const ownedCount = () => st.run.summary.withShiprocketCount - resolvedCodCount();

  function lockNotif() {
    const s = st.run.summary;
    if (st.scenario === 'recovered') return `<b>₹5,373 recovered from Shiprocket ✓</b>
          <span class="body">5 orders paid in the Wed 14 Oct payout and the return charge reversed. ₹750 (2 orders) still open.</span>`;
    if (s.claimTotal > 0 && s.toClaimCodCount) { const oldest = Math.max(...[...s.notRemitted, ...s.short].map(ageOf)); return `<b>${inr(s.claimTotal)} to claim from Shiprocket</b>
          <span class="body">${plural(s.toClaimCodCount, 'order')} unpaid or short past Shiprocket's 10 working days (oldest ${oldest} days)${st.run.walletIssues.length ? ', plus a wrong wallet charge' : ''}. Your claim is ready.</span>`; }
    return `<b>${inr(s.claimTotal)} to claim from Shiprocket</b>
          <span class="body">${plural(st.run.walletIssues.length, 'wrong wallet charge')} (return fee on a delivered order). Your claim is ready.</span>`;
  }
  screens.lock = () => {
    const s = st.run.summary;
    if (!s.claimTotal && st.scenario !== 'recovered') return `
    <div class="lock">${statusbar(true)}
      <div class="date">${fdLong(st.today)}</div>
      <div class="clock">9:05</div>
      <div class="hint" style="margin-top:auto;margin-bottom:12px">No alert today. Shiprocket paid everything due.</div>
      <button class="cta-sm ghost" data-go="home" style="margin-bottom:40px">Open Razorpay</button>
    </div>`;
    return `
    <div class="lock">${statusbar(true)}
      <div class="date">${fdLong(st.today)}</div>
      <div class="clock">9:05</div>
      <button class="notif" data-go="home" aria-label="Open notification">
        <span class="ico">${rzpIcon}</span>
        <span style="flex:1;min-width:0"><span class="top"><span>RAZORPAY</span><span>now</span></span>
          ${lockNotif()}</span>
      </button>
      <div class="hint">Tap the notification</div>
    </div>`;
  };

  function codCard() {
    const r = st.run; const s = r.summary; const extra = [];
    const open = openItems(); const openCod = open.filter((i) => i.kind !== 'w'); const openW = open.filter((i) => i.kind === 'w');
    const claimed = claimedItems();
    if (r.holds.length) extra.push(`<div class="rowline click" data-go="check"><span class="dot amber"></span><span class="txt"><b>Can't tell yet: Shiprocket may be holding your payout</b><small>No payout on ${fd(r.holds[0].day)} though orders were due · check for an unpaid invoice or negative wallet</small></span><span class="chev">${I.chev}</span></div>`);
    else if (r.reportGap) extra.push(`<div class="rowline click" data-go="codsettings"><span class="dot amber"></span><span class="txt"><b>We haven't received Shiprocket's report since ${fd(r.reportGap.since)}</b><small>Check the report schedule in Shiprocket</small></span><span class="cta-sm ghost">Check</span></div>`);
    if (s.needsLook.length) { const n = s.needsLook[0]; extra.push(`<div class="rowline click" data-act="proof" data-oid="${esc(n.order.id)}"><span class="dot violet"></span><span class="txt"><b>${plural(s.needsLook.length, 'order')} needs a look</b><small>${esc(n.order.id)}: ${esc(n.reason)}</small></span><span class="chev">${I.chev}</span></div>`); }
    const boxes = [];
    if (open.length) {
      const rows = openCod.map((i) => i.row); const oldest = rows.length ? Math.max(...rows.map(ageOf)) : 0;
      const v = r.remittanceViews.find((q) => q.notPaid.length || q.short.length);
      boxes.push(`<div class="obox red"><div class="oh"><span><b>Overdue</b> · ${plural(openCod.length, 'order')}</span><b>${inr(sum(openCod))}</b></div>
        <small>${rows.length ? `Delivered ${span(rows)} · oldest ${oldest} days · past Shiprocket's 10 working days` : ''}${openW.length ? `${rows.length ? '<br>' : ''}+ ${inr(sum(openW))} wrong wallet charge` : ''}</small>
        <div class="orow2"><button class="cta-sm" data-go="claim">Claim ${inr(sum(open))}</button>${v ? `<button class="link" data-act="crf" data-crf="${v.crf}">See the ${fd(v.date)} payout</button>` : ''}</div></div>`);
    }
    if (claimed.length) boxes.push(`<div class="obox amber click" data-go="claim"><div class="oh"><span><b>Claimed</b> · ${plural(claimed.length, 'order')}</span><b>${inr(sum(claimed))}</b></div><small>Sent ${st.scenario === 'recovered' ? 'Tue 13 Oct' : 'today ' + (st.sentAt || '09:06')} · we'll remind you on Mon 19 Oct if it isn't settled</small></div>`);
    if (st.scenario === 'recovered') boxes.push(`<div class="obox green"><div class="oh"><span><b>Recovered ✓</b> · 6 of 8</span><b>₹5,373</b></div><small>Paid in the Wed 14 Oct payout · return charge reversed</small></div>`);
    if (s.waiting.length) { const w = s.waiting[0]; boxes.push(`<div class="obox amber click" data-go="check"><div class="oh"><span><b>Late</b> · ${plural(s.waiting.length, 'order')}</span><b>${inr(s.waiting.reduce((a, x) => a + x.expectedNet - (x.paid || 0), 0))}</b></div><small>Missed the ${fd(w.dueIn)} payout · Shiprocket has until ${fd(w.promiseEnds)}, so not claimable yet</small></div>`); }
    if (s.cantTell.length) boxes.push(`<div class="obox amber"><div class="oh"><span><b>Can't tell yet</b> · ${plural(s.cantTell.length, 'order')}</span><b>${inr(s.cantTell.reduce((a, x) => a + x.expectedNet - (x.paid || 0), 0))}</b></div><small>Held back until the payout or report is back</small></div>`);
    const onRows = r.rows.filter((x) => x.status === 'on_time');
    boxes.push(`<div class="obox green click" data-act="owed" data-k="ontime"><div class="oh"><span><b>On time</b> · ${plural(s.onTimeCount, 'order')}</span><b>${inr(s.onTime)}</b></div><small>${onRows.length ? `Delivered ${span(onRows)} · ` : ''}${s.nextPayout ? `next payout ${fd(s.nextPayout)}` : 'nothing due yet'}</small></div>`);
    return `<div class="card cod-card" id="codCard">
      <div class="cod-head"><span class="t">${I.truck} COD with Shiprocket <span class="newtag">NEW</span></span><button class="iconbtn" data-go="payouts" aria-label="All COD payouts">${I.chev}</button></div>
      <div class="label" style="margin-top:6px">Shiprocket owes you</div>
      <div class="amount">${inr(ownedTotal())}</div>
      <div class="cod-sub">${plural(ownedCount(), 'delivered order')}, not yet paid</div>
      <div style="margin-top:10px">${boxes.join('')}</div>
      ${extra.length ? `<div style="margin-top:4px">${extra.join('')}</div>` : ''}
      <div class="foot-note">Checked ${checkedAt()} · ${allMatch() ? "matches Shiprocket's payout totals ✓" : "a payout total differs from Shiprocket's report"}</div>
    </div>`;
  }

  screens.home = () => `
    <div class="app">${statusbar()}
      <div class="scroll">
        <div class="hello"><span class="avatar">PE</span><span><small>Good morning</small><b>PAPAEARTH</b></span></div>
        <div class="card center">
          <div class="label">Collected today</div>
          <div class="amount">₹14,260</div>
          <button class="pillbtn" data-act="toast" data-msg="Existing Razorpay screen · unchanged by this feature">View breakdown (23 payments) ⌄</button>
          <div class="split"><div><div class="label">Next settlement</div><div class="amount">₹1,12,400</div><small>Auto-settles today · HDFC Bank ••1101</small></div><div><div class="label">Account balance</div><div class="amount">₹1,12,400</div><small>After fees &amp; adjustments</small></div></div>
        </div>
        ${st.codOn ? codCard() : `<div class="card setup-banner"><span class="newtag">NEW</span><b style="display:block;margin-top:6px">Is Shiprocket paying all your COD?</b><p class="meta" style="margin:6px 0 10px">Turn on COD checks. We match every Shiprocket payout with your orders and tell you if anything is missing. Takes 2 minutes, once.</p><button class="cta-sm" data-go="setup1">Set up</button></div>`}
        <div class="collect"><h3>Collect payments</h3>
          <div class="banner">${I.link}<span><small>Get paid on your branded Razorpay link</small>razorpay.me/@papaearth</span><button class="share" data-act="toast" data-msg="Existing Razorpay feature · unchanged by this feature">Share</button></div>
          <div class="quick"><div><span>${I.link}</span>Payment links</div><div><span>${I.page}</span>Payment pages</div><div><span>${I.grid}</span>All products</div></div>
        </div>
      </div>${tabbar('home')}
    </div>`;

  screens.check = () => {
    const v = view(); const r = st.run;
    const lateMode = v.notPaid.some((x) => x.status !== 'not_remitted') || v.short.some((x) => x.status !== 'short');
    const others = r.remittanceViews.filter((x) => x.crf !== v.crf).slice().reverse();
    const open = openItems();
    const claimBtn = open.length ? `<div class="sticky-cta"><button class="btn-block" data-go="claim">See claim · ${inr(sum(open))}</button></div>` : `<div class="sticky-cta"><button class="btn-block secondary" data-go="home">Back to Home</button></div>`;
    const orderList = (arr) => arr.map((x) => `<div class="orow" data-act="proof" data-oid="${esc(x.order.id)}"><span class="o"><b>${esc(x.order.id)}</b><small>Delivered ${fd(x.ship.deliveredOn)}${x.paid ? ` · ${inr(x.paid)} of ${inr(x.owed)} paid` : ''}</small></span><span class="v">−${inr(x.status === 'short' || x.paid ? x.owed - (x.paid || 0) : x.owed)}</span><span class="chev">${I.chev}</span></div>`).join('');
    return `<div class="app">${statusbar()}
      <div class="scroll">${topbar(`Shiprocket payout · ${fd(v.date)}`, 'home')}
        <div class="meta" style="margin:-6px 0 12px 4px">Payout ID (CRF) ${last4(v.crf)} · bank ref (UTR) ${last4(v.utr)}</div>
        <div class="card">
          <table class="wf">
            <tr><td>COD due in this payout<small>Orders delivered ${dueRange(v)}</small></td><td class="n">${v.dueCount}</td><td class="a">${inr(v.dueAmount)}</td></tr>
            ${v.notPaid.length ? `<tr class="neg"><td>${lateMode ? 'Not paid yet' : 'Not paid'}<small>${!lateMode ? 'Missing from this payout and the next' : r.holds.length ? 'Not claimed while Shiprocket may be holding payouts' : r.reportGap ? 'Not claimed until Shiprocket\'s report arrives' : 'Late · Shiprocket still within 10 working days'}</small></td><td class="n">${v.notPaid.length}</td><td class="a">−${inr(v.notPaidAmount)}</td></tr>` : ''}
            ${v.short.length ? `<tr class="neg"><td>Paid short<small>Less than the COD amount</small></td><td class="n">${v.short.length}</td><td class="a">−${inr(v.shortAmount)}</td></tr>` : ''}
            ${(() => { const gap = v.dueAmount - v.notPaidAmount - v.shortAmount - v.paidTotal; if (gap <= 0) return '';
              const pl = r.rows.filter((x) => x.dueIn === v.date && !v.notPaid.includes(x) && !v.short.includes(x) && (x.lines || []).some((l) => l.crf !== v.crf));
              const later = pl.flatMap((x) => x.lines.filter((l) => l.crf !== v.crf)).map((l) => r.remittanceViews.find((q) => q.crf === l.crf)).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date))[0];
              return `<tr class="neg"><td>Paid in a later payout<small>${later ? `Recovered in the ${fd(later.date)} payout` : 'Paid after this payout'}</small></td><td class="n">${pl.length}</td><td class="a">−${inr(gap)}</td></tr>`; })()}
            ${v.paidTotal > v.dueAmount - v.notPaidAmount - v.shortAmount ? `<tr><td>Earlier orders paid now<small>Recovered from your claim</small></td><td class="n">${v.lineCount - (v.dueCount - v.notPaid.length)}</td><td class="a">+${inr(v.paidTotal - (v.dueAmount - v.notPaidAmount - v.shortAmount))}</td></tr>` : ''}
            <tr class="tot"><td><b>Paid by Shiprocket</b></td><td class="n">${v.lineCount}</td><td class="a">${inr(v.paidTotal)} ✓</td></tr>
          </table>
          <div class="foot-note">${v.printedTotalOk ? 'Matches the total in Shiprocket\'s report.' : 'Report total differs.'} Every amount is worked out from your Razorpay orders and Shiprocket's own data. <button class="link" data-go="how">How we check</button></div>
        </div>
        ${v.notPaid.length || v.short.length ? `<div class="sec">Orders in the gap · tap for proof</div><div class="card">${orderList([...v.notPaid, ...v.short])}</div>` : ''}
        <div class="sec">Other checks</div>
        <div class="card">
          ${r.walletIssues.length ? r.walletIssues.map((w) => `<div class="rowline click" data-act="proofw" data-awb="${w.wallet.awb}"><span class="dot red"></span><span class="txt"><b>Wallet: ${w.kind === 'rto_on_delivered' ? 'return (RTO) charge on a delivered order' : 'COD charge not reversed'} · ${inr(w.claim)}</b><small>${esc(w.wallet.orderId)} · ${fd(w.wallet.date)}</small></span><span class="chev">${I.chev}</span></div>`).join('') : `<div class="rowline"><span class="dot green"></span><span class="txt"><b>Wallet charges: all correct ✓</b><small>Return (RTO) and COD charges match delivery status</small></span></div>`}
          ${others.slice(0, 3).map((o) => `<div class="rowline click" data-act="crf" data-crf="${o.crf}"><span class="dot ${o.notPaid.length || o.short.length ? 'red' : 'green'}"></span><span class="txt"><b>${fd(o.date)} payout · ${plural(o.dueCount, 'order')}</b><small>${o.notPaid.length || o.short.length ? `${o.notPaid.length + o.short.length} need attention` : `all paid ✓ · ${inr(o.paidTotal)}`}</small></span><span class="chev">${I.chev}</span></div>`).join('')}
        </div>
        <div style="text-align:center;margin-top:4px"><button class="link" data-act="bank">${st.bankQuery ? 'Bank-credit query added to your claim ✓' : 'Not in my bank?'}</button></div>
      </div>${claimBtn}
    </div>`;
  };
  function dueRange(v) {
    const ds = st.run.rows.filter((x) => x.dueIn === v.date).map((x) => x.ship.deliveredOn).sort();
    if (!ds.length) return '—'; return ds[0] === ds[ds.length - 1] ? fdShort(ds[0]) : `${fdShort(ds[0])}–${fdShort(ds[ds.length - 1])}`;
  }

  // claim content for a set of items (default: what's ticked)
  function claimData(items) {
    items = items || (selItems().length ? selItems() : claimedItems());
    const nr = items.filter((i) => i.kind === 'nr').map((i) => i.row); const sh = items.filter((i) => i.kind === 'sh').map((i) => i.row); const w = items.filter((i) => i.kind === 'w').map((i) => i.w);
    return { nr, sh, w, total: sum(items), count: items.length, items };
  }
  const RES = { settled: 'Settled with Shiprocket', elsewhere: 'Already raised elsewhere', writeoff: 'Written off' };
  screens.claim = () => {
    const open = openItems(); const sel = selItems(); const claimed = claimedItems();
    const resolved = allItems().filter((i) => st.resolved[i.key]);
    const sub = (i) => i.kind === 'nr' ? `Not paid · delivered ${fd(i.row.ship.deliveredOn)} · due ${fd(i.row.dueIn)}` : i.kind === 'sh' ? `Paid short · ${i.row.order.type === 'partial_cod' ? `partial COD, ${inr(i.row.owed)} due (${inr(i.row.order.paidOnlineBeforeDispatch)} paid online)` : `${inr(i.row.owed)} due`} · ${inr(i.row.paid)} paid` : `Return (RTO) freight on a delivered order · ${fd(i.w.wallet.date)}`;
    const oid = (i) => (i.kind === 'w' ? i.w.wallet.orderId : i.row.order.id);
    const openAct = (i) => (i.kind === 'w' ? `data-act="proofw" data-awb="${i.w.wallet.awb}"` : `data-act="proof" data-oid="${esc(i.row.order.id)}"`);
    const row = (i, tick) => `<div class="orow">${tick ? `<button class="checkbox ${st.sel.has(i.key) ? '' : 'off'}" data-act="sel" data-key="${esc(i.key)}" aria-label="Include ${esc(oid(i))}">✓</button>` : ''}<span class="o" ${openAct(i)} style="cursor:pointer"><b>${esc(oid(i))} ${i.kind !== 'w' ? ageChip(i.row) : ''}</b><small>${sub(i)}</small></span><span class="v">${inr(i.amt)}</span><span class="chev" ${openAct(i)} style="cursor:pointer">${I.chev}</span></div>`;
    const groups = [['nr', 'Not paid'], ['sh', 'Paid short'], ['w', 'Wrong wallet charge']].map(([k, l]) => { const g = open.filter((i) => i.kind === k); return g.length ? `<div class="card"><div class="grp-h">${l} · ${plural(g.length, 'order')}<span>${inr(sum(g))}</span></div>${g.map((i) => row(i, true)).join('')}</div>` : ''; }).join('');
    const allOn = open.length && sel.length === open.length;
    return `<div class="app">${statusbar()}
      <div class="scroll">${topbar('Claim to Shiprocket', 'home')}
        ${open.length ? `<div class="card center"><div class="label">Ready to send · ${sel.length} of ${open.length} selected</div><div class="amount">${inr(sum(sel))}</div><div class="meta">Shiprocket account ${st.data.merchant.shiprocketAccount} · <button class="link" data-act="selall">${allOn ? 'Untick all' : 'Tick all'}</button></div></div>${groups}`
        : `<div class="card center"><div class="label">${claimed.length ? 'Nothing new to claim' : 'Nothing to claim'}</div><div class="amount">₹0</div><div class="meta">${st.scenario === 'recovered' ? 'Claim of 13 Oct · ₹5,373 of ₹6,123 recovered' : 'Every overdue order is claimed or resolved'}</div></div>`}
        ${claimed.length ? `<div class="card"><div class="grp-h">Claimed · waiting for Shiprocket<span>${inr(sum(claimed))}</span></div>${claimed.map((i) => row(i, false)).join('')}<div class="meta" style="margin-top:6px">Leaves this list when it shows up in a payout, or when you mark it resolved.</div></div>` : ''}
        ${resolved.length ? `<div class="card"><div class="grp-h">Resolved<span>${plural(resolved.length, 'order')}</span></div>${resolved.map((i) => `<div class="orow"><span class="o" ${openAct(i)} style="cursor:pointer"><b>${esc(oid(i))}</b><small>${RES[st.resolved[i.key].how]} · ${fdShort(st.resolved[i.key].on)}</small></span><span class="v" style="color:var(--muted)">${inr(i.amt)}</span></div>`).join('')}</div>` : ''}
        ${st.bankQuery && open.length ? `<div class="card"><div class="grp-h">Bank-credit query<span>${fd(view().date)} payout</span></div><div class="meta">Please confirm the ${inr(view().paidTotal)} credit (UTR ${last4(view().utr)}).</div></div>` : ''}
        ${open.length ? `<div class="sec">Account checks</div>
        <div class="card"><ul class="checks">
          <li><span class="tick">✓</span>Plan: ${st.run.plan.label} (D+8 working days, Mon/Wed/Fri)</li>
          <li><span class="tick">✓</span>Wallet balance positive (${inr(st.data.walletBalance)})</li>
          <li><button class="checkbox ${st.checks.cod ? '' : 'off'}" data-act="tick" data-k="cod" aria-label="COD active">✓</button>COD active on your account</li>
          <li><button class="checkbox ${st.checks.kyc ? '' : 'off'}" data-act="tick" data-k="kyc" aria-label="Bank and KYC unchanged">✓</button>Bank and KYC details unchanged</li>
        </ul></div>
        <div style="display:flex;gap:16px;justify-content:center;margin:2px 0 8px"><button class="link" data-act="csv">Download proof (CSV)</button><button class="link" data-act="copy">Copy for Shiprocket ticket</button></div>` : ''}
      </div>
      <div class="sticky-cta">${open.length ? `<button class="btn-block" data-go="email" ${sel.length ? '' : 'disabled'}>${sel.length ? `Claim ${itemsLabel(sel)} · ${inr(sum(sel))}` : 'Tick at least one order'}</button>` : '<button class="btn-block secondary" data-go="home">Back to Home</button>'}</div>
    </div>`;
  };

  function claimEmail() {
    const c = claimData(); const m = st.data.merchant;
    const lines = [];
    lines.push('Hello Shiprocket team,', '', `Please check and settle the ${c.nr.length || c.sh.length ? 'COD amounts' : 'wallet charge'} below for our account (${m.name}, ${m.shiprocketAccount}).`, '');
    lines.push(`Account: ${[`${st.run.plan.label} plan (D+8 working days, Mon/Wed/Fri)`, 'wallet balance positive', st.checks.cod && 'COD active', st.checks.kyc && 'bank and KYC unchanged'].filter(Boolean).join(' · ')}.`, '');
    let n = 1;
    const nrAmt = c.nr.reduce((a, x) => a + x.claim, 0); const shAmt = c.sh.reduce((a, x) => a + x.claim, 0); const wAmt = c.w.reduce((a, x) => a + x.claim, 0);
    if (c.nr.length) {
      const byDue = {}; c.nr.forEach((x) => { (byDue[x.dueIn] = byDue[x.dueIn] || []).push(x); });
      Object.keys(byDue).sort().forEach((due) => {
        const g = byDue[due]; const ds = g.map((x) => x.ship.deliveredOn).sort(); const vs = st.run.remittanceViews.filter((q) => q.date >= due).slice(0, 2);
        lines.push(`${n++}. Not received: ${plural(g.length, 'order')}, ${inr(g.reduce((a, x) => a + x.claim, 0))} (${g.map((x) => x.order.id).join(', ')}). Delivered ${ds[0] === ds[ds.length - 1] ? fdShort(ds[0]) : `${fdShort(ds[0])}–${fdShort(ds[ds.length - 1])}`}, due in the ${fd(due)} remittance, not in ${vs.map((q) => `CRF ${last4(q.crf)} (${fdShort(q.date)})`).join(' or ')}. Past 10 working days.`);
      });
    }
    if (c.sh.length) { const l = c.sh[0].lines[0]; const v = l && st.run.remittanceViews.find((q) => q.crf === l.crf); lines.push(`${n++}. Remitted short: ${plural(c.sh.length, 'order')}, ${inr(shAmt)} (${c.sh.map((x) => x.order.id).join(', ')})${v ? `, in CRF ${last4(v.crf)} (UTR ${last4(v.utr)})` : ''}.`); }
    for (const w of c.w) { const sh = w.ship; const pl = st.run.ledger.find((l) => l.awb === sh.awb); lines.push(`${n++}. Wallet: RTO freight of ${inr(w.claim)} debited on ${fdShort(w.wallet.date)} on ${w.wallet.orderId}, which was delivered on ${fdShort(sh.deliveredOn)}${pl ? ` and whose COD was remitted on ${fdShort(pl.remittanceDate)}` : ''}.`); }
    if (st.bankQuery) { const v = view(); lines.push(`${n++}. Please confirm the ${inr(v.paidTotal)} credit for CRF ${last4(v.crf)} (UTR ${last4(v.utr)}).`); }
    const ask = [nrAmt + shAmt ? `remit ${inr(nrAmt + shAmt)}` : '', wAmt ? `reverse ${inr(wAmt)}` : ''].filter(Boolean).join(' and ');
    lines.push('', `Request: please ${ask}. Order-wise proof is attached.`, '', 'Thanks,', `${m.owner}, ${m.name}`);
    return lines.join('\n');
  }
  const subjectLine = () => { const c = claimData(); return c.nr.length || c.sh.length ? 'COD remittance not received / short' : 'Wrong wallet charge'; };
  screens.email = () => {
    const c = claimData();
    return `<div class="mail">${statusbar()}
      <div class="mail-bar"><button class="iconbtn" data-act="back" data-fallback="claim" aria-label="Discard">${I.close}</button><h2>Compose</h2><button class="send" data-act="send" aria-label="Send">${I.send}</button></div>
      <div class="mail-field"><span>From</span><span>${st.data.merchant.email}</span></div>
      <div class="mail-field"><span>To</span><span>Shiprocket Support</span></div>
      <div class="mail-field"><span>Subject</span><span><b>${subjectLine()}: ${plural(c.count, 'order')}, ${inr(c.total)} · ${st.data.merchant.name}</b></span></div>
      <div class="mail-body">${esc(claimEmail())}</div>
      <button class="attach" data-act="csv" aria-label="Download ${CSVNAME}"><i>CSV</i><span><b>${CSVNAME}</b><br><span class="meta">${c.count} rows · order-wise proof · tap to download</span></span></button>
    </div>`;
  };

  screens.done = () => {
    const ls = st.lastSent || { total: sum(claimedItems()), count: claimedItems().length, at: st.sentAt || '09:06' };
    return `
    <div class="app">${statusbar()}
      <div class="scroll"><div class="done">
        <div class="bigtick">✓</div>
        <h1 class="screen-title">Claim sent to Shiprocket</h1>
        <p class="screen-lede">${inr(ls.total)} · ${plural(ls.count, 'order')} · sent ${ls.at} from your email</p>
        <div class="card" style="text-align:left">
          <div class="rowline"><span class="dot amber"></span><span class="txt"><b>We'll remind you on Mon 19 Oct</b><small>If Shiprocket hasn't settled it by then, with a ready follow-up</small></span></div>
          <div class="rowline"><span class="dot green"></span><span class="txt"><b>Recovery is tracked automatically</b><small>We mark it recovered when these orders show up in a payout, or the wallet charge is reversed</small></span></div>
          ${openItems().length ? `<div class="rowline click" data-go="claim"><span class="dot red"></span><span class="txt"><b>${plural(openItems().length, 'order')} not claimed yet · ${inr(sum(openItems()))}</b><small>Still in your claim list</small></span><span class="chev">${I.chev}</span></div>` : ''}
        </div>
      </div></div>
      <div class="sticky-cta"><button class="btn-block" data-go="home">Back to Home</button></div>
    </div>`;
  };

  // COD payouts: two views
  const OF = [['claim', 'To claim'], ['late', 'Late'], ['ontime', 'On time'], ['claimed', 'Claimed'], ['paid', 'Paid']];
  function owedList(k) {
    const r = st.run;
    if (k === 'claim') return openItems();
    if (k === 'claimed') return allItems().filter((i) => st.claimed.has(i.key) || st.resolved[i.key]);
    const stat = { late: ['waiting', 'cant_tell'], ontime: ['on_time'], paid: ['paid', 'paid_more'] }[k];
    return r.rows.filter((x) => stat.includes(x.status)).sort((a, b) => (a.ship.deliveredOn || '').localeCompare(b.ship.deliveredOn || '')).map((x) => ({ key: x.order.id, kind: 'row', amt: k === 'paid' ? x.paid : x.expectedNet - (x.paid || 0), row: x }));
  }
  screens.payouts = () => {
    const r = st.run; const s = r.summary; const pv = st.payoutView; const k = st.orderFilter;
    let body = '';
    if (pv === 'owed') {
      const list = owedList(k); const shown = list.slice(0, 40);
      const subOf = (i) => {
        if (i.kind === 'w') return `${st.resolved[i.key] ? RES[st.resolved[i.key].how] : st.claimed.has(i.key) ? 'Claimed' : 'Wrong wallet charge'} · return freight on a delivered order`;
        const x = i.row;
        if (st.resolved[i.key]) return `${RES[st.resolved[i.key].how]} · ${fdShort(st.resolved[i.key].on)}`;
        if (st.claimed.has(i.key)) return `Claimed · ${x.status === 'short' ? 'paid short' : 'not paid'} · delivered ${fdShort(x.ship.deliveredOn)}`;
        if (x.status === 'not_remitted') return `Not paid · delivered ${fdShort(x.ship.deliveredOn)} · ${ageOf(x)} days`;
        if (x.status === 'short') return `Paid short · ${inr(x.paid)} of ${inr(x.owed)}`;
        if (x.status === 'waiting') return `Missed ${fd(x.dueIn)} · Shiprocket has until ${fd(x.promiseEnds)}`;
        if (x.status === 'cant_tell') return `Due ${fd(x.dueIn)} · held back`;
        if (x.status === 'on_time') return `Delivered ${fdShort(x.ship.deliveredOn)} · due ${fd(x.dueIn)}`;
        const l = x.lines[x.lines.length - 1]; return l ? `Paid ${fd(l.remittanceDate)} · CRF ${last4(l.crf)}` : 'Paid';
      };
      const act = (i) => (i.kind === 'w' ? `data-act="proofw" data-awb="${i.w.wallet.awb}"` : `data-act="proof" data-oid="${esc(i.row.order.id)}"`);
      const oid = (i) => (i.kind === 'w' ? i.w.wallet.orderId : i.row.order.id);
      body = `<div class="card"><div class="sec" style="margin:0 0 4px">Shiprocket owes you</div><div class="amount md">${inr(ownedTotal())}</div><div class="meta">${plural(ownedCount(), 'delivered order')}, not yet paid</div></div>
        <div class="chips">${OF.map(([kk, l]) => `<button class="${k === kk ? 'on' : ''}" data-act="of" data-k="${kk}">${l} ${owedList(kk).length}</button>`).join('')}</div>
        <div class="card">${shown.length ? shown.map((i) => `<div class="orow" ${act(i)}><span class="o"><b>${esc(oid(i))}</b><small>${subOf(i)}</small></span><span class="v">${inr(i.amt)}</span><span class="chev">${I.chev}</span></div>`).join('') + (list.length > shown.length ? `<div class="meta" style="text-align:center;padding:10px 0 2px">+ ${list.length - shown.length} more · ${inr(list.slice(40).reduce((a, i) => a + i.amt, 0))}</div>` : '') : '<div class="meta" style="text-align:center;padding:16px">No orders here</div>'}</div>
        ${k === 'claim' && list.length ? `<div class="sticky-gap"></div><button class="btn-block" data-go="claim" style="margin-bottom:12px">Claim ${inr(sum(list))}</button>` : ''}`;
    } else {
      const upcoming = Object.entries(r.buckets).sort().slice(0, 3);
      body = `${upcoming.length ? `<div class="sec">Coming up</div><div class="card">${upcoming.map(([d, b]) => `<div class="okline"><span>${fd(d)} · ${plural(b.count, 'order')}</span><span style="color:var(--ink)">${inr(b.amount)}</span></div>`).join('')}</div>` : ''}
        <div class="sec">Received from Shiprocket</div>
        <div class="card">${r.remittanceViews.slice().reverse().map((v) => `<div class="prow" data-act="crf" data-crf="${v.crf}"><span class="o"><b>${fd(v.date)} · ${inr(v.paidTotal)}</b><small>CRF ${last4(v.crf)} · UTR ${last4(v.utr)} · ${plural(v.lineCount, 'order')}</small></span>${v.notPaid.length || v.short.length ? `<span class="chip red">${v.notPaid.length + v.short.length} missing/short</span>` : '<span class="chip green">All paid</span>'}<span class="chev">${I.chev}</span></div>`).join('')}</div>`;
    }
    return `<div class="app">${statusbar()}
      <div class="scroll">
        <div class="subtabs"><button data-go="txns">Transactions</button><button data-go="settlements">Settlements</button><button class="on">COD payouts</button></div>
        <div class="seg"><button class="${pv === 'owed' ? 'on' : ''}" data-act="pv" data-k="owed">Owed to you</button><button class="${pv === 'payouts' ? 'on' : ''}" data-act="pv" data-k="payouts">Payouts</button></div>
        ${body}
      </div>${tabbar('payouts')}
    </div>`;
  };

  screens.account = () => `
    <div class="app">${statusbar()}
      <div class="scroll"><div class="topbar"><h2>Account and settings</h2></div>
        <div class="card">
          ${[[I.bank, 'Bank accounts and settlements', 'Bank account, Settlement cycle', ''], [I.truck, 'COD checks', st.codOn ? 'On · Shiprocket connected' : 'Off', 'codsettings'], [I.bell, 'Notification', 'Email, SMS, WhatsApp, COD alerts', 'codsettings']].map(([ic, t, sub, go]) => `<div class="settings-row" ${go ? `data-go="${go}"` : 'data-act="toast" data-msg="Existing Razorpay screen · unchanged by this feature"'} style="cursor:pointer"><span class="ico">${ic}</span><span class="o">${t}<small>${sub}</small></span><span class="chev">${I.chev}</span></div>`).join('')}
        </div>
      </div>${tabbar('account')}
    </div>`;

  screens.codsettings = () => {
    const rep = st.data.reports[st.data.reports.length - 1];
    return `<div class="app">${statusbar()}
      <div class="scroll">${topbar('COD checks', 'account')}
        <div class="card"><div class="settings-row"><span class="o">COD checks<small>Check every Shiprocket payout against your orders</small></span><button class="switch ${st.codOn ? '' : 'off'}" data-act="codtoggle" aria-label="Toggle COD checks"></button></div></div>
        <div class="sec">Shiprocket</div>
        <div class="card">
          <div class="okline"><span>Account ${st.data.merchant.shiprocketAccount}</span><span>Linked</span></div>
          <div class="okline"><span>Plan (from your payouts)</span><span style="color:var(--ink)">${st.run.plan.label}</span></div>
          <div class="okline"><span>Daily report</span><span style="color:${st.run.reportGap ? 'var(--amber)' : 'var(--green)'}">${st.run.reportGap ? 'Not received since ' + fd(st.run.reportGap.since) : 'Received ' + fd(rep.receivedAt.slice(0, 10)) + ', ' + rep.receivedAt.slice(11)}</span></div>
          <div class="addr">${ADDR} <button class="link" data-act="copyaddr">Copy</button></div>
          ${st.run.reportGap ? '<p class="meta" style="margin:10px 0 0">In Shiprocket: Tools → Reports → Schedule Report → Remittance Report → Daily · Last 30 days → send to the address above.</p>' : ''}
        </div>
        <div class="sec">Alerts</div>
        <div class="card"><div class="settings-row"><span class="o">Push notifications<small>When money is missing or a payout is held</small></span><button class="switch ${st.alerts.push ? '' : 'off'}" data-act="alert" data-k="push" aria-label="Push notifications" aria-pressed="${st.alerts.push}"></button></div><div class="settings-row"><span class="o">WhatsApp fallback<small>If push is off</small></span><button class="switch ${st.alerts.wa ? '' : 'off'}" data-act="alert" data-k="wa" aria-label="WhatsApp fallback" aria-pressed="${st.alerts.wa}"></button></div></div>
        <p class="meta" style="padding:0 4px">Razorpay reads your Shiprocket shipments, COD amounts and wallet statement only to run these checks. COD goes from Shiprocket to your bank, and Razorpay never holds it.</p>
      </div>${tabbar('account')}
    </div>`;
  };

  const codOrders = () => st.data.orders.filter((o) => o.type !== 'prepaid');
  screens.how = () => {
    const d = st.data; const r = st.run; const n = codOrders().length;
    return `<div class="app">${statusbar()}
      <div class="scroll">${topbar('How we check', 'home')}
        <p class="screen-lede">Every payout is checked line by line against your own order record. Nothing is estimated.</p>
        <div class="flow">
          <div class="two">
            <div class="node rzp"><b>Your Razorpay orders</b><small>${n} COD orders · total and online advance (partial COD)</small></div>
            <div class="node sr"><b>Shiprocket tracking</b><small>The same ${n} orders · COD amount, status, delivery date</small></div>
          </div>
          <div class="two">
            <div class="node sr"><b>Shiprocket payouts</b><small>${d.remittances.length} payouts · ${r.ledger.length} order lines, from the daily report</small></div>
            <div class="node sr"><b>Shiprocket wallet</b><small>Freight, return (RTO) and COD charges, order by order</small></div>
          </div>
          <div class="arrow">↓</div>
          <div class="node"><b>The check, for every delivered order</b><small>Owed = order total − amount paid online · due on the first Mon/Wed/Fri on or after 8 working days · claim only after Shiprocket's 10 working days and two payouts received · never during a held payout</small></div>
          <div class="arrow">↓</div>
          <div class="node out"><b>What you get</b><small>Paid ✓ · on time · late · not paid · paid short · wrong wallet charge → one claim with order-wise proof, sent from your email</small></div>
        </div>
        <p class="meta" style="margin-top:14px">Prepaid orders aren't checked: there's no cash to collect. COD goes from Shiprocket to your bank. Razorpay never holds it.</p>
      </div>
    </div>`;
  };

  // setup
  const prog = (n) => `<div class="progress">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const info = (k) => `<button class="infobtn" data-act="info" data-k="${k}" aria-label="Why we need this">i</button>`;
  const INFO = {
    status: ['Why we need delivery status', 'Shiprocket pays the cash for an order a fixed number of working days after it is delivered. The delivery date tells us when each order should be paid, so we know if Shiprocket is late, and we never chase money before it is due.'],
    report: ['Why we need the daily report', "Shiprocket's Remittance Report lists every order it paid in each payout. We compare it with your orders to find any order that is missing or paid short. Shiprocket sends it on its own once scheduled, so you never upload anything."],
  };
  screens.setup1 = () => `<div class="app">${statusbar()}<div class="scroll">${topbar('', 'home')}${prog(1)}
      <h1 class="screen-title">Check your COD payouts</h1>
      <p class="screen-lede">We'll match every Shiprocket payout with your Magic Checkout orders and tell you if any order isn't paid in full.</p>
      <div class="card"><b>We'll read from your Shiprocket account</b><ul class="bullets"><li>Shipments and delivery status</li><li>COD amount on each order</li><li>Wallet statement</li></ul><div class="meta">Only to run these checks. You can turn this off any time in Account → COD checks.</div></div>
      <div class="card" style="background:var(--blue-soft);border-color:#D6E1FC"><b>We never move or hold your money.</b><div class="meta">COD goes from Shiprocket straight to your bank.</div></div>
    </div><div class="sticky-cta"><button class="btn-block" data-go="setup2">Allow and continue</button></div></div>`;
  screens.setup2 = () => {
    const sh = st.data.shipments.filter((x) => x.codAmount > 0); const del = sh.filter((x) => x.status === 'DELIVERED').length;
    const tr = sh.filter((x) => x.status === 'IN_TRANSIT').length; const rto = sh.filter((x) => x.status.startsWith('RTO')).length;
    return `<div class="app">${statusbar()}<div class="scroll">${topbar('', 'setup1')}${prog(2)}
      <h1 class="screen-title">Shiprocket linked ✓ ${info('status')}</h1>
      <p class="screen-lede">We used the Shiprocket link from your Magic Checkout setup and matched your COD orders with Shiprocket tracking.</p>
      <div class="card"><div class="okline"><span>Magic Checkout COD orders</span><span style="color:var(--ink)">${codOrders().length}</span></div><div class="okline"><span>Matched with Shiprocket tracking</span><span>${sh.length} ✓</span></div><div class="meta" style="margin-top:6px">${del} delivered · ${tr} in transit · ${rto} returned (RTO)</div></div>
      <div class="card"><div class="okline"><span>Wallet statement</span><span>✓</span></div><div class="okline"><span>Plan found</span><span style="color:var(--ink)">${st.run.plan.label} · Mon/Wed/Fri payouts</span></div></div>
    </div><div class="sticky-cta"><button class="btn-block" data-go="setup3">Next</button></div></div>`;
  };
  let repTimer;
  screens.setup3 = () => {
    clearTimeout(repTimer);
    if (!st.reportOk) repTimer = setTimeout(() => { st.reportOk = true; if (st.screen === 'setup3') render(); }, 2600);
    return `<div class="app">${statusbar()}<div class="scroll">${topbar('', 'setup2')}${prog(3)}
      <h1 class="screen-title">Send us Shiprocket's daily report ${info('report')}</h1>
      <p class="screen-lede">Once, in Shiprocket. About a minute.</p>
      <div class="card"><b>Your Razorpay report address</b><div class="addr">${ADDR} <button class="link" data-act="copyaddr">Copy</button></div></div>
      <div class="card"><ol class="steps"><li><span>Open Shiprocket → <b>Tools → Reports → Schedule Report</b></span></li><li><span>Pick <b>Remittance Report</b></span></li><li><span>Frequency <b>Daily</b> · Date range <b>Last 30 days</b></span></li><li><span>Send to <b>Email</b> → paste the address above → <b>Save</b></span></li></ol>
        <div style="display:flex;gap:16px;margin-top:8px"><button class="link" data-act="toast" data-msg="Opening Shiprocket">Open Shiprocket</button><button class="link" data-act="toast" data-msg="Steps sent to ${st.data.merchant.email}">Email me these steps</button></div></div>
      <div class="card repstatus ${st.reportOk ? 'ok' : ''}">${st.reportOk ? `<span class="dot green"></span><b>First report received ✓</b><small>30 days · ${st.data.remittances.length} payouts · ${st.run.ledger.length} order lines</small>` : `<span class="spin"></span><b>Waiting for Shiprocket's first report…</b><small>Usually arrives a minute after you save</small>`}</div>
    </div><div class="sticky-cta"><button class="btn-block" data-go="setup4" ${st.reportOk ? '' : 'disabled'}>${st.reportOk ? 'Continue' : 'Waiting for the report…'}</button></div></div>`;
  };
  screens.setup4 = () => {
    const s = st.run.summary;
    return `<div class="app">${statusbar()}<div class="scroll">${prog(4)}<div class="done" style="padding-top:30px">
      <div class="bigtick">✓</div><h1 class="screen-title">COD checks are on</h1>
      <p class="screen-lede">First check done: Shiprocket owes you ${inr(s.withShiprocket)} on ${plural(s.withShiprocketCount, 'delivered order')}${s.toClaimCod ? `, ${inr(s.toClaimCod)} of it overdue` : ''}.</p>
      <div class="card" style="text-align:left"><div class="rowline"><span class="dot green"></span><span class="txt"><b>We'll alert you only when something needs you</b><small>After every payout · Push, with WhatsApp as fallback</small></span></div></div></div>
    </div><div class="sticky-cta"><button class="btn-block" data-act="enable" data-notif="1">Allow notifications</button><button class="btn-block secondary" data-act="enable">Not now</button></div></div>`;
  };

  screens.txns = screens.settlements = () => `<div class="app">${statusbar()}<div class="scroll">
      <div class="subtabs"><button data-go="txns" class="${st.screen === 'txns' ? 'on' : ''}">Transactions</button><button data-go="settlements" class="${st.screen === 'settlements' ? 'on' : ''}">Settlements</button><button data-go="payouts">COD payouts</button></div>
      <div class="card"><div class="sec" style="margin:0 0 4px">Next settlement</div><div class="amount md">₹1,12,400</div><div class="meta">Auto-settles today · HDFC Bank ••1101</div></div>
      <div class="meta" style="text-align:center;padding:20px">Your existing ${st.screen === 'txns' ? 'transactions' : 'settlements'} list</div>
    </div>${tabbar('payouts')}</div>`;
  screens.products = screens.support = () => `<div class="app">${statusbar()}<div class="scroll"><div class="topbar"><h2>${st.screen === 'products' ? 'Products' : 'Support'}</h2></div><div class="card"><div class="meta">Unchanged by this feature.</div></div></div>${tabbar(st.screen)}</div>`;

  // ---------- order sheet (any order) ----------
  function itemActions(key) {
    const it = allItems().find((i) => i.key === key); if (!it) return '';
    if (st.resolved[key]) return `<div class="meta" style="margin:10px 0 0">Resolved: ${RES[st.resolved[key].how]} (${fdShort(st.resolved[key].on)}). History kept.</div><button class="btn-block secondary" data-act="unresolve" data-key="${esc(key)}">Undo resolve</button>`;
    const claimOnly = !st.claimed.has(key) ? `<button class="btn-block" data-act="claimonly" data-key="${esc(key)}">Claim only this order · ${inr(it.amt)}</button>` : '';
    return `${claimOnly}<button class="btn-block secondary" data-act="resolve" data-key="${esc(key)}">Mark as resolved</button>`;
  }
  function proofOrder(oid) {
    const x = st.run.rows.find((r) => r.order.id === oid); if (!x) return;
    st.lastProof = x; const sh = x.ship;
    const items = [];
    items.push(`<div class="ok">Order placed on Magic Checkout<small>${inr(x.order.total)}${x.order.paidOnlineBeforeDispatch ? ` · ${inr(x.order.paidOnlineBeforeDispatch)} paid online, rest cash on delivery` : ' · cash on delivery'}</small></div>`);
    if (sh.outForDeliveryAt) items.push(`<div class="ok">Out for delivery ${fdShort(sh.deliveredOn)}, ${sh.outForDeliveryAt}</div>`);
    if (sh.deliveredOn) items.push(`<div class="ok">Delivered ${fdShort(sh.deliveredOn)}${sh.deliveredAt ? ', ' + sh.deliveredAt : ''}<small>Shiprocket tracking</small></div>`);
    else if (sh.status === 'IN_TRANSIT') items.push(`<div>In transit<small>The payout clock starts at delivery</small></div>`);
    else if (sh.status && sh.status.startsWith('RTO')) items.push(`<div>Returned to you (RTO)${sh.rtoOn ? ' ' + fdShort(sh.rtoOn) : ''}<small>No cash collected, so nothing is owed</small></div>`);
    if (x.dueIn) items.push(`<div class="${x.dueIn < st.today && !x.paid ? 'bad' : ''}">Due in the ${fd(x.dueIn)} payout<small>First Mon/Wed/Fri after 8 working days${x.dueIn >= '2026-10-05' && sh.deliveredOn <= '2026-09-22' ? ' (2 Oct holiday skipped)' : ''}</small></div>`);
    if (x.promiseEnds) items.push(`<div>Shiprocket's 10 working days ${x.promiseEnds < st.today ? 'ended' : 'end'} ${fd(x.promiseEnds)}</div>`);
    for (const l of x.lines || []) { const v = st.run.remittanceViews.find((q) => q.crf === l.crf); items.push(`<div class="${l.remitted >= (x.owed || 0) ? 'ok' : 'bad'}">Paid ${inr(l.remitted)} in the ${fd(l.remittanceDate)} payout<small>CRF ${last4(l.crf)}${v ? ` · UTR ${last4(v.utr)}` : ''}${l.remitted < (x.owed || 0) ? ` · ${inr(x.owed - l.remitted)} short` : ''}</small></div>`); }
    if (x.searched && x.searched.length && !x.paid) items.push(`<div class="bad">Not in ${x.searched.map((c) => { const v = st.run.remittanceViews.find((q) => q.crf === c); return `${fdShort(v.date)} (CRF ${last4(c)})`; }).join(' · ')}</div>`);
    if (st.claimed.has(oid)) items.push(`<div>Claimed from Shiprocket<small>Sent ${st.scenario === 'recovered' ? '13 Oct' : 'today ' + (st.sentAt || '09:06')} · waiting to be paid</small></div>`);
    if (st.resolved[oid]) items.push(`<div class="ok">Marked resolved<small>${RES[st.resolved[oid].how]}</small></div>`);
    const owedLine = x.owed != null ? `COD due ${inr(x.owed)} (Razorpay order${x.order.paidOnlineBeforeDispatch ? `: ${inr(x.order.total)} − ${inr(x.order.paidOnlineBeforeDispatch)} paid online` : ''}) · Shiprocket COD ${inr(sh.codAmount)} ${Math.abs(sh.codAmount - x.owed) <= 100 ? '✓' : '≠'}` : '';
    let chip = { not_remitted: ['red', 'Not paid'], short: ['red', 'Paid short'], paid: ['green', 'Paid'], paid_more: ['green', 'Paid'], on_time: ['green', 'On time'], waiting: ['amber', 'Late'], needs_look: ['violet', 'Needs a look'], cant_tell: ['amber', "Can't tell yet"], in_transit: ['grey', 'In transit'], not_owed: ['grey', 'Returned'] }[x.status] || ['grey', x.status];
    if (st.resolved[oid]) chip = ['grey', 'Resolved']; else if (st.claimed.has(oid)) chip = ['amber', 'Claimed'];
    openSheet(`<div class="grab"></div><h3>${esc(x.order.id)} <span class="chip ${chip[0]}">${chip[1]}</span></h3><div class="meta">AWB (Shiprocket tracking no.) ${last4(sh.awb)}</div><p style="font-size:13px;margin:10px 0 0">${owedLine}</p>${x.status === 'needs_look' ? `<p class="meta" style="margin:6px 0 0">${esc(x.reason)}. Not claimed automatically.</p>` : ''}<div class="tl">${items.join('')}</div>${itemActions(oid)}<button class="btn-block secondary" data-act="closesheet">Close</button>`);
    if (st.sideTab === 'rules') renderSide();
  }
  function proofWallet(awb) {
    const w = st.run.walletIssues.find((q) => q.wallet.awb === awb); if (!w) return;
    const pl = st.run.ledger.find((l) => l.awb === awb); const key = 'W:' + awb;
    const chip = st.resolved[key] ? ['grey', 'Resolved'] : st.claimed.has(key) ? ['amber', 'Claimed'] : ['red', 'Wrong charge'];
    openSheet(`<div class="grab"></div><h3>${esc(w.wallet.orderId)} <span class="chip ${chip[0]}">${chip[1]}</span></h3><div class="meta">AWB (tracking no.) ${last4(awb)} · wallet entry ${w.wallet.ref}</div>
      <div class="tl"><div class="ok">Delivered ${fdShort(w.ship.deliveredOn)}, ${w.ship.deliveredAt}<small>Shiprocket tracking · no return scan</small></div>${pl ? `<div class="ok">COD ${inr(pl.remitted)} paid in the ${fd(pl.remittanceDate)} payout<small>CRF ${last4(pl.crf)}</small></div>` : ''}<div class="bad">Return (RTO) freight ${inr(w.claim)} debited ${fdShort(w.wallet.date)}<small>A return charge on an order that was delivered</small></div></div>
      ${itemActions(key)}<button class="btn-block secondary" data-act="closesheet">Close</button>`);
  }
  function resolveSheet(key) {
    openSheet(`<div class="grab"></div><h3>Mark as resolved</h3><p class="meta" style="margin:4px 0 10px">It leaves your claim list. The order's history is kept.</p>
      ${Object.entries(RES).map(([k, l]) => `<button class="optrow" data-act="doresolve" data-key="${esc(key)}" data-how="${k}"><b>${k === 'writeoff' ? 'Write off' : l}</b><small>${{ settled: 'Shiprocket paid or credited it outside the payout', elsewhere: 'You already have a ticket for it', writeoff: "You've decided not to chase it" }[k]}</small></button>`).join('')}
      <button class="btn-block secondary" data-act="closesheet">Cancel</button>`);
  }
  function infoSheet(k) { const [t, b] = INFO[k]; openSheet(`<div class="grab"></div><h3>${t}</h3><p style="font-size:14px;line-height:1.5;margin:8px 0 14px">${b}</p><button class="btn-block secondary" data-act="closesheet">Got it</button>`); }
  function openSheet(html) { sheetEl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`; sheetEl.hidden = false; }
  function closeSheet() { sheetEl.hidden = true; sheetEl.innerHTML = ''; }
  sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl) closeSheet(); });

  let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2200); }

  function downloadCsv() {
    const c = claimData(); const rows = [['order_id', 'awb', 'issue', 'delivered_on', 'cod_due', 'paid', 'claim', 'payouts_searched', 'utr', 'wallet_entry']];
    const crfs = (x) => (x.searched || []).join(' ');
    for (const x of c.nr) rows.push([x.order.id, x.ship.awb, 'not_remitted', x.ship.deliveredOn, x.owed / 100, 0, x.claim / 100, crfs(x), '', '']);
    for (const x of c.sh) { const l = x.lines[0]; const v = l ? st.run.remittanceViews.find((q) => q.crf === l.crf) : null; rows.push([x.order.id, x.ship.awb, 'remitted_short', x.ship.deliveredOn, x.owed / 100, x.paid / 100, x.claim / 100, crfs(x), v ? v.utr : '', '']); }
    for (const w of c.w) rows.push([w.wallet.orderId, w.wallet.awb, 'rto_freight_on_delivered', w.ship.deliveredOn, '', '', w.claim / 100, '', '', w.wallet.ref]);
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = CSVNAME;
    document.body.appendChild(a); a.click(); a.remove(); toast('Proof downloaded · ' + CSVNAME);
  }
  async function copy(text, msg) { try { await navigator.clipboard.writeText(text); } catch (e) { /* clipboard may be blocked; still confirm */ } toast(msg); }

  function sendClaim() {
    const items = selItems(); if (!items.length) return false;
    st.lastSent = { total: sum(items), count: items.length, at: '09:06' };
    items.forEach((i) => { st.claimed.add(i.key); st.sel.delete(i.key); });
    st.claimSent = true; st.sentAt = '09:06'; return true;
  }

  // ---------- routing ----------
  const FLOWS = {
    journey: [['setup1', 'Turn on (consent)', 'One-time setup'], ['setup2', 'Shiprocket linked'], ['setup3', "Schedule Shiprocket's report"], ['setup4', "You're set"],
      ['lock', 'Push alert', 'The 2-minute job'], ['home', 'Home card'], ['check', 'Payout check'], ['claim', 'Claim pack'], ['email', 'Email from your account'], ['done', 'Sent']],
    how: [['how', 'How we check'], ['payouts', 'COD payouts'], ['codsettings', 'Settings and control']],
  };
  function go(screen, opts = {}) {
    if (screen === 'check' && !view()) return;
    if (screen === 'email' && !selItems().length) screen = 'claim';
    // jumping to "Sent" from the guide counts as sending what's ticked
    if (screen === 'done' && !opts.sent) { if (!sendClaim() && !st.lastSent) screen = 'claim'; }
    if (screen === 'setup3' && st.screen !== 'setup3') st.reportOk = false;
    if (!opts.back && screen !== st.screen) { st.hist.push(st.screen); if (st.hist.length > 40) st.hist.shift(); }
    st.screen = screen; closeSheet();
    const f = Object.entries(FLOWS).find(([, list]) => list.some(([k]) => k === screen));
    if (f && !(st.flow === 'journey' && f[0] === 'how' && opts.fromGuide !== true)) st.flow = f[0];
    render();
  }
  function back(fallback) {
    let to = st.hist.pop();
    // never go "back" into the sent screen or the compose screen after sending
    while (to && ((to === 'email' || to === 'done') && st.screen !== 'email')) to = st.hist.pop();
    go(to || fallback || 'home', { back: true, sent: true });
  }
  function render() {
    screenEl.innerHTML = (screens[st.screen] || screens.home)();
    const sc = screenEl.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
    renderSide();
  }

  screenEl.addEventListener('click', onClick); sheetEl.addEventListener('click', onClick);
  function onClick(e) {
    const g = e.target.closest('[data-go]'); const a = e.target.closest('[data-act]');
    if (a) {
      const act = a.dataset.act; const key = a.dataset.key;
      if (act === 'proof') proofOrder(a.dataset.oid);
      else if (act === 'proofw') proofWallet(a.dataset.awb);
      else if (act === 'closesheet') closeSheet();
      else if (act === 'back') back(a.dataset.fallback);
      else if (act === 'crf') { st.crf = a.dataset.crf; go('check'); }
      else if (act === 'bank') { st.bankQuery = !st.bankQuery; toast(st.bankQuery ? 'Added a bank-credit query to your claim' : 'Bank-credit query removed'); render(); }
      else if (act === 'tick') { st.checks[a.dataset.k] = !st.checks[a.dataset.k]; render(); }
      else if (act === 'sel') { st.sel.has(key) ? st.sel.delete(key) : st.sel.add(key); render(); }
      else if (act === 'selall') { const o = openItems(); const all = o.every((i) => st.sel.has(i.key)); o.forEach((i) => (all ? st.sel.delete(i.key) : st.sel.add(i.key))); render(); }
      else if (act === 'claimonly') { st.sel = new Set([key]); closeSheet(); go('claim'); toast('Only this order is ticked'); }
      else if (act === 'resolve') resolveSheet(key);
      else if (act === 'doresolve') { st.resolved[key] = { how: a.dataset.how, on: st.today }; st.sel.delete(key); closeSheet(); toast(`Marked resolved: ${RES[a.dataset.how]}`); render(); }
      else if (act === 'unresolve') { delete st.resolved[key]; if (!st.claimed.has(key)) st.sel.add(key); closeSheet(); toast('Back in your claim list'); render(); }
      else if (act === 'info') infoSheet(a.dataset.k);
      else if (act === 'csv') downloadCsv();
      else if (act === 'copy') copy(`Subject: ${subjectLine()}\n\n${claimEmail()}`, 'Claim copied · paste it into a Shiprocket ticket');
      else if (act === 'copyaddr') copy(ADDR, 'Address copied');
      else if (act === 'send') { if (sendClaim()) go('done', { sent: true }); }
      else if (act === 'pv') { st.payoutView = a.dataset.k; render(); }
      else if (act === 'of') { st.orderFilter = a.dataset.k; render(); }
      else if (act === 'owed') { st.payoutView = 'owed'; st.orderFilter = a.dataset.k; go('payouts'); }
      else if (act === 'codtoggle') { st.codOn = !st.codOn; toast(st.codOn ? 'COD checks turned on' : 'COD checks turned off'); render(); }
      else if (act === 'enable') { load(st.scenario); st.codOn = true; st.hist = ['setup4']; st.screen = 'lock'; st.flow = 'journey'; closeSheet(); render(); }
      else if (act === 'toast') toast(a.dataset.msg);
      else if (act === 'alert') { const k = a.dataset.k; st.alerts[k] = !st.alerts[k]; toast(`${k === 'push' ? 'Push notifications' : 'WhatsApp fallback'} turned ${st.alerts[k] ? 'on' : 'off'}`); render(); }
      return;
    }
    if (g && !g.disabled) go(g.dataset.go);
  }

  // ---------- side panel ----------
  const GUIDE = {
    lock: ['Push alert', "09:05. Shiprocket's daily report arrived at 07:00 and the check ran on its own. Seven delivered orders are past Shiprocket's 10 working days and unpaid or short, and one wallet charge is wrong. One alert, with the total."],
    home: ['Home card', 'A new card under "Next settlement", where merchants already look for money owed to them. One number (what Shiprocket owes), split into what is overdue and what is simply on its way.'],
    check: ['Payout check', "One Shiprocket payout, line by line. What was due (from the merchant's own orders), minus what's missing or short, is exactly what Shiprocket paid. That match makes the claim credible."],
    claim: ['Claim pack', 'Every overdue order, ticked by default; untick any to leave it out. Tap an order for its proof, to claim only that order, or to mark it resolved.'],
    email: ['Email from your account', "The claim opens in the founder's own email app, so Shiprocket hears from its own customer. The CSV has one row per order. Nothing is sent without this tap."],
    done: ['Sent', 'About a minute from the alert. A reminder is set for Mon 19 Oct, and recovery is matched automatically from later payouts.'],
    setup1: ['Turn on (consent)', "Names exactly what's read. Reuses the Shiprocket link merchants already set up for Magic Checkout."],
    setup2: ['Shiprocket linked', "Magic Checkout orders are joined to Shiprocket tracking by order ID and AWB. Delivery dates tell us when each order's cash is due."],
    setup3: ["Schedule Shiprocket's report", "The one step outside Razorpay: schedule Shiprocket's daily Remittance Report to a private Razorpay address. The screen confirms when the first report lands."],
    setup4: ["You're set", 'The first check runs on the last 30 days. From here the merchant does nothing until an alert.'],
    how: ['How we check', 'The inputs, the rules and the outputs, in plain words inside the product.'],
    payouts: ['COD payouts', '"Owed to you" filters every order by where it is in its life: to claim, late, on time, claimed, paid. "Payouts" is the plain list of Shiprocket transfers.'],
    codsettings: ['Settings and control', 'The connection, report status and alerts, all switchable off.'],
    account: ['Account', 'COD checks sit beside the existing settings rows.'],
  };

  function sampleJson(x) {
    const sh = x.ship;
    return `{ "order_id": "${x.order.id.slice(1)}", "awb_code": "${sh.awb}",
  "payment_method": "cod", "cod_amount": ${sh.codAmount / 100},
  "current_status": "${sh.status}", "delivered_date": "${sh.deliveredOn} ${sh.deliveredAt || ''}" }`;
  }
  function renderSide() {
    document.querySelectorAll('.side-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === st.sideTab)));
    const r = st.run; const s = r.summary; const d = st.data;
    let h = '';
    if (st.sideTab === 'guide') {
      const flow = FLOWS[st.flow] || FLOWS.journey;
      const btn = ([k, l], i) => `<button class="${st.screen === k ? 'on' : ''}" data-side-go="${k}"><i>${i + 1}</i>${l}</button>`;
      if (st.flow === 'journey') {
        const a = flow.slice(0, 4); const b = flow.slice(4);
        h += `<div class="stepper two-col"><div><div class="step-grp">One-time setup</div>${a.map(btn).join('')}</div><div><div class="step-grp">The 2-minute job</div>${b.map(btn).join('')}</div></div>`;
      } else h += `<div class="stepper">${flow.map(btn).join('')}</div>`;
      let g = GUIDE[st.screen] || GUIDE.home;
      if (st.screen === 'lock' && st.scenario !== 'hero') g = [g[0], SC[st.scenario].note];
      h += `<div class="explain"><b class="k">${g[0]}</b><p style="margin:6px 0 0">${g[1]}</p></div>`;
      if (st.screen === 'check') {
        const v = view();
        h += `<h3>The numbers on this screen</h3><div class="tbl-wrap"><table class="tbl"><tr><th>Line</th><th class="r">Orders</th><th class="r">Amount</th></tr>
          <tr><td>Due in ${fd(v.date)} payout</td><td class="r">${v.dueCount}</td><td class="r">${inr(v.dueAmount)}</td></tr>
          <tr><td>Not paid</td><td class="r">${v.notPaid.length}</td><td class="r">−${inr(v.notPaidAmount)}</td></tr>
          <tr><td>Paid short</td><td class="r">${v.short.length}</td><td class="r">−${inr(v.shortAmount)}</td></tr>
          <tr><td><b>Paid by Shiprocket</b></td><td class="r">${v.lineCount}</td><td class="r"><b>${inr(v.paidTotal)}</b></td></tr></table></div>`;
      }
      h += `<h3>At a glance</h3><ul>
        <li><b>For:</b> founder-run D2C brands on Magic Checkout that ship cash-on-delivery with Shiprocket.</li>
        <li><b>The problem:</b> Shiprocket pays COD in bulk transfers days later. A missing or short order is invisible unless someone matches it in Excel.</li>
        <li><b>Why on the phone:</b> payouts land Mon/Wed/Fri, wherever the founder is, and Home is where they already check money.</li>
        <li><b>What it doesn't do:</b> hold or move money, or file anything without the founder's tap.</li>
        <li><b>How we'd know it works:</b> rupees recovered per merchant each month.</li></ul>`;
    } else if (st.sideTab === 'situations') {
      h += `<p>Switch the merchant's situation. The rules engine re-runs on the new data and every screen updates.</p><div class="sit-grid">${Object.entries(SC).map(([k, v]) => `<button class="${st.scenario === k ? 'on' : ''}" data-scenario="${k}">${v.label}<small>${fd(SCEN_DAY[k] || '2026-10-13')}</small></button>`).join('')}</div>`;
      h += `<div class="explain"><b class="k">${SC[st.scenario].label}</b><p style="margin:6px 0 0">${SC[st.scenario].note}</p></div>`;
      h += `<h3>Result</h3><div class="kv"><div><b>${inr(ownedTotal())}</b><small>Shiprocket owes</small></div><div><b>${inr(sum(openItems()))}</b><small>to claim</small></div><div><b>${s.waiting.length}</b><small>late, not yet claimable</small></div></div>`;
    } else if (st.sideTab === 'data') {
      const v = r.remittanceViews.find((q) => q.date === '2026-10-09') || view(); const lsAll = r.ledger.filter((l) => l.crf === v.crf); const ls = [...lsAll.filter((l) => l.remitted < l.cod), ...lsAll.filter((l) => l.remitted >= l.cod)].slice(0, 4);
      const ex = r.rows.find((x) => x.order.id === '#PE-20417') || s.notRemitted[0] || r.rows.find((x) => x.status === 'paid');
      h += `<h3>Two accounts</h3><div class="kv two"><div><b>Razorpay account</b><small>The merchant's Magic Checkout orders: order total and any amount paid online (partial COD). Also where the alert and claim live.</small></div><div><b>Shiprocket seller account</b><small>${d.merchant.shiprocketAccount}. The API user already made for Magic Checkout, and the daily report schedule pointing to Razorpay.</small></div></div>`;
      h += `<h3>Two pipes from Shiprocket</h3><p><b>1 · Shiprocket API (JSON)</b>: orders, tracking scans, wallet statement and balance.</p><div class="trace">${esc(sampleJson(ex))}</div>
        <p style="margin-top:10px"><b>2 · Daily Remittance Report (CSV)</b>: every order paid in each payout. Daily · last 30 days · to ${ADDR}.</p>
        <div class="trace">CRF ID,AWB,Order ID,COD,Remitted,Date
${ls.map((l) => `${last4(l.crf)},${last4(l.awb)},${l.orderId.slice(1)},${l.cod / 100},${l.remitted / 100},${l.remittanceDate.slice(5)}`).join('\n')}
… ${v.lineCount} lines · ${inr(v.paidTotal)} · UTR ${last4(v.utr)}</div>`;
      if (ex) {
        const pl = ex.lines && ex.lines[0];
        h += `<h3>One order, joined: ${esc(ex.order.id)}</h3><div class="tbl-wrap"><table class="tbl"><tr><th>Source</th><th>What it says</th></tr>
          <tr><td>Razorpay order</td><td>${inr(ex.order.total)} total · ${inr(ex.order.paidOnlineBeforeDispatch)} paid online → owed ${ex.owed != null ? inr(ex.owed) : '—'}</td></tr>
          <tr><td>Shiprocket API</td><td>AWB ${last4(ex.ship.awb)} · COD ${inr(ex.ship.codAmount)} ✓ · delivered ${ex.ship.deliveredOn ? fdShort(ex.ship.deliveredOn) : '—'}</td></tr>
          <tr><td>Rules</td><td>Due ${fd(ex.dueIn)} · claimable after ${fd(ex.promiseEnds)}</td></tr>
          <tr><td>Daily report</td><td>${pl ? `Paid ${inr(pl.remitted)} in CRF ${last4(pl.crf)}` : `Not in ${(ex.searched || []).map((c) => `CRF ${last4(c)}`).join(' or ') || 'any payout'}`}</td></tr>
          <tr><td><b>Result</b></td><td><b>${{ not_remitted: 'Not paid', short: 'Paid short', paid: 'Paid', on_time: 'On time', waiting: 'Late' }[ex.status] || ex.status}${ex.claim ? ` · claim ${inr(ex.claim)}` : ''}</b></td></tr></table></div>`;
      }
      h += `<h3>Order states</h3><p>An order is either <b>fully known</b> (paid, or claimable) or still <b>pending</b> (in transit, on time, or waiting). Pending orders simply sit as "on time" until their date passes. Then they either get paid, or move to overdue.</p>
        <div class="states"><span>In transit</span>→<span>On time</span>→<span class="g">Paid</span><br><span class="pad"></span>↘<span class="a">Late</span>→<span class="r">Overdue · claim</span>→<span>Claimed</span>→<span class="g">Recovered</span> / <span>Resolved</span></div>`;
    } else if (st.sideTab === 'rawdata') {
      const v = view(); const ls = r.ledger.filter((l) => l.crf === v.crf).slice(0, 6);
      h += `<h3>Inputs (live)</h3><div class="kv"><div><b>${d.orders.length}</b><small>Razorpay orders (${codOrders().length} COD)</small></div><div><b>${d.shipments.length}</b><small>Shiprocket shipments</small></div><div><b>${r.ledger.length}</b><small>payout lines</small></div><div><b>${d.remittances.length}</b><small>payouts (CRF IDs)</small></div><div><b>${d.wallet.length}</b><small>wallet entries</small></div><div><b>${d.reports.length}</b><small>${d.reports.length === 1 ? 'daily report (30 days)' : 'daily reports'}</small></div></div>`;
      h += `<h3>How it fits together</h3><div class="arch">
        <div class="lane"><span>Sources</span><div class="boxes"><div>Magic Checkout orders</div><div>Shiprocket API: shipments, tracking, wallet</div><div>Shiprocket daily Remittance Report</div></div></div>
        <div class="lane"><span>Razorpay</span><div class="boxes"><div>Logistics connector (existing)</div><div class="new">COD Recon service: ledger · rules · claims</div><div>Notifications: push, WhatsApp</div></div></div>
        <div class="lane"><span>App</span><div class="boxes"><div class="new">Home card</div><div class="new">Payout check</div><div class="new">Claim pack</div><div class="new">COD payouts tab</div></div></div>
        <div class="lane"><span>Out</span><div class="boxes"><div>Claim email + CSV → Shiprocket Finance Desk</div><div>Recovery matched from later payouts</div></div></div></div>`;
      h += `<h3>Lines in the ${fd(v.date)} payout (CRF ${last4(v.crf)})</h3><div class="tbl-wrap"><table class="tbl"><tr><th>Order</th><th>AWB</th><th class="r">COD</th><th class="r">Remitted</th></tr>${ls.map((l) => `<tr data-oid="${esc(l.orderId)}"><td>${esc(l.orderId)}</td><td>${last4(l.awb)}</td><td class="r">${inr(l.cod)}</td><td class="r">${inr(l.remitted)}</td></tr>`).join('')}<tr><td colspan="4" class="meta">… ${v.lineCount} lines in total · ${inr(v.paidTotal)}</td></tr></table></div>`;
      h += `<h3>Status of every order</h3><div class="tbl-wrap"><table class="tbl"><tr><th>Status</th><th class="r">Orders</th></tr>${Object.entries(r.rows.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {})).map(([k, n]) => `<tr><td>${({ out_of_scope: 'prepaid (not checked)', not_owed: 'returned (RTO), nothing owed', not_remitted: 'not paid', short: 'paid short', on_time: 'on time', in_transit: 'in transit', waiting: 'late', cant_tell: "can't tell yet", needs_look: 'needs a look', paid_more: 'paid more' })[k] || k}</td><td class="r">${n}</td></tr>`).join('')}</table></div>`;
    } else if (st.sideTab === 'rules') {
      h += `<h3>How the check works</h3><ol class="algo">
        <li><b>Collect.</b> Orders from Razorpay; tracking and wallet from the Shiprocket API; payout lines from the daily report.</li>
        <li><b>Join.</b> Each Razorpay order to its Shiprocket shipment by order ID and AWB. Prepaid orders drop out.</li>
        <li><b>What is owed.</b> Order total − amount paid online before dispatch. Must match Shiprocket's COD amount within ₹1, or it shows as <i>Needs a look</i>.</li>
        <li><b>When it is due.</b> First working Mon/Wed/Fri on or after 8 working days from delivery. Holidays move to the next working day.</li>
        <li><b>What was paid.</b> Add up every payout line for the order. Lines are kept forever and de-duplicated on AWB + CRF, so overlapping reports never double-count.</li>
        <li><b>Status.</b> Paid · on time · late · not paid · paid short.</li>
        <li><b>Claim guard.</b> Only after Shiprocket's 10 working days, with the due payout and the next one received, report days complete, and no payout on hold.</li>
        <li><b>Wallet and claim.</b> Return (RTO) freight on a delivered order is a wrong charge. Everything claimable goes into one claim; later payouts mark it recovered.</li></ol>
        <h3>Terms on screen</h3><ul><li><b>CRF ID:</b> Shiprocket's ID for one COD payout.</li><li><b>UTR:</b> the bank's reference for that transfer.</li><li><b>AWB:</b> the shipment's tracking number.</li><li><b>RTO:</b> return to origin.</li><li><b>Partial COD:</b> part paid online, the rest in cash.</li></ul>`;
      const x = st.lastProof || s.notRemitted[0] || s.short[0];
      if (x) h += `<h3>Trace: ${esc(x.order.id)}</h3><div class="trace">order_total      ${inr(x.order.total)}
paid_online      ${inr(x.order.paidOnlineBeforeDispatch)}
owed             ${x.owed != null ? inr(x.owed) : '—'}
shiprocket_cod   ${inr(x.ship.codAmount)}
delivered_on     ${x.ship.deliveredOn || '—'}
due_in_payout    ${x.dueIn || '—'}
promise_ends     ${x.promiseEnds || '—'}
claimable_from   ${x.claimableFrom || '—'}
payouts_searched ${(x.searched || []).join(', ') || '—'}
paid             ${x.paid != null ? inr(x.paid) : '—'}
status           ${x.status}${x.claim ? `\nclaim            ${inr(x.claim)}` : ''}</div><p class="meta" style="margin-top:8px">Tap any order in the app to trace it here.</p>`;
    }
    sideBody.innerHTML = h;
  }

  document.querySelector('.side-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; st.sideTab = b.dataset.tab; renderSide(); });
  sideBody.addEventListener('click', (e) => {
    const sg = e.target.closest('[data-side-go]'); if (sg) { go(sg.dataset.sideGo, { fromGuide: true }); return; }
    const sc = e.target.closest('[data-scenario]'); if (sc) { load(sc.dataset.scenario); st.screen = 'lock'; st.flow = 'journey'; render(); }
  });
  document.querySelector('.play-row').addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]'); if (!b) return; const p = b.dataset.play;
    if (p === 'hero') { load('hero'); st.flow = 'journey'; st.sideTab = 'guide'; st.screen = 'lock'; render(); }
    if (p === 'setup') { st.flow = 'journey'; st.sideTab = 'guide'; go('setup1', { fromGuide: true }); }
    if (p === 'how') { st.flow = 'how'; st.sideTab = 'guide'; go('how', { fromGuide: true }); }
  });
  // narrow screens: the panel sits below the phone, so jump back to the phone after picking a step/situation
  const showPhone = () => { if (window.innerWidth <= 1040) $('#device').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  sideBody.addEventListener('click', (e) => { if (e.target.closest('[data-side-go],[data-scenario]')) showPhone(); });
  document.querySelector('.play-row').addEventListener('click', (e) => { if (e.target.closest('[data-play]')) showPhone(); });
  $('#sideToggle').addEventListener('click', () => {
    const inSide = $('#side').getBoundingClientRect().top < window.innerHeight / 2;
    if (inSide) showPhone(); else $('#side').scrollIntoView({ behavior: 'smooth' });
  });

  // expose for tests
  window.__cod = { st, go, back, load, render };
  load('hero'); st.screen = 'setup1'; render();
})();
