/* COD Remittance Recovery — prototype UI. Every figure is computed by CODEngine from the dataset. */
(function () {
  'use strict';
  const E = window.CODEngine; const SC = window.CODScenarios.SCENARIOS;
  const SCEN_DAY = { late: '2026-10-10', recovered: '2026-10-15' };
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
    scenario: 'hero', data: null, today: null, run: null, screen: 'lock', flow: 'hero',
    crf: null, claimSent: false, sentAt: null, bankQuery: false, checks: { cod: true, kyc: true },
    sideTab: 'guide', lastProof: null, payoutFilter: 'all', codOn: true,
  };
  function load(key) {
    const s = SC[key]; const m = s.make();
    st.scenario = key; st.data = m.data; st.today = m.today; st.run = E.run(m.data, m.today);
    st.claimSent = !!m.claimSentOn; st.sentAt = m.claimSentOn ? '09:06' : null; st.bankQuery = false; st.lastProof = null;
    st.payoutFilter = 'all'; st.checks = { cod: true, kyc: true }; st.codOn = true; st.alerts = { push: true, wa: true };
    const withIssue = st.run.remittanceViews.slice().reverse().find((v) => v.notPaid.length || v.short.length);
    st.crf = (withIssue || st.run.remittanceViews[st.run.remittanceViews.length - 1]).crf;
    $('#todayLabel').textContent = fdLong(st.today) + ' 2026';
  }

  // ---------- chrome helpers ----------
  const statusbar = (dark) => `<div class="statusbar" style="${dark ? 'color:#fff' : ''}"><span>${st.screen === 'lock' ? '' : clockFor()}</span><span class="icons"><svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.4A10.3 10.3 0 008 .2 10.3 10.3 0 00.7 3.2L2 4.6a8.4 8.4 0 016-2.4zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 008 3.8a6.8 6.8 0 00-4.7 1.9l1.3 1.4A4.9 4.9 0 018 5.8zm0 3.4l-2 2.1 2 1.9 2-1.9z"/></svg><svg width="27" height="12" viewBox="0 0 27 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor"/><rect x="24" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".4"/></svg></span></div>`;
  const clockFor = () => (st.scenario === 'hero' && !st.claimSent ? '09:05' : st.claimSent && st.scenario === 'hero' ? '09:06' : '09:05');
  const tabbar = (on) => `<nav class="tabbar">${[['home', 'Home', I.home], ['payouts', 'Payments', I.pay], ['products', 'Products', I.prod], ['support', 'Support', I.help], ['account', 'Account', I.acct]].map(([k, l, ic]) => `<button data-go="${k}" class="${on === k ? 'on' : ''}">${ic}${l}</button>`).join('')}</nav>`;
  const topbar = (title, backTo, extra = '') => `<div class="topbar"><button class="iconbtn" data-go="${backTo}" aria-label="Back">${I.back}</button><h2>${title}</h2>${extra}</div>`;
  const view = () => st.run.remittanceViews.find((v) => v.crf === st.crf);

  // ---------- screens ----------
  const screens = {};

  function lockNotif() {
    const s = st.run.summary;
    if (s.claimTotal > 0 && s.toClaimCodCount) return `<b>${inr(s.claimTotal)} to claim from Shiprocket</b>
          <span class="body">${plural(s.claimOrderCount, 'order')} with money missing. Your claim is ready to review.</span>`;
    if (s.claimTotal > 0) return `<b>${inr(s.claimTotal)} to claim from Shiprocket</b>
          <span class="body">${plural(st.run.walletIssues.length, 'wrong wallet charge')} (return fee on a delivered order). Your claim is ready to review.</span>`;
    return `<b>₹6,123 recovered from Shiprocket ✓</b>
          <span class="body">Your 13 Oct claim is settled: paid in the Wed 14 Oct payout, and the return charge reversed.</span>`;
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
    const r = st.run; const s = r.summary; const rows = [];
    const lastV = r.remittanceViews[r.remittanceViews.length - 1];
    if (st.scenario === 'recovered') rows.push(`<div class="rowline"><span class="dot green"></span><span class="txt"><b>Claim of ${fdShort('2026-10-13')}: ₹6,123 recovered ✓</b><small>Paid in the Wed 14 Oct payout · RTO charge reversed</small></span></div>`);
    if (r.holds.length) rows.push(`<div class="rowline click" data-go="check"><span class="dot amber"></span><span class="txt"><b>Can't tell yet: Shiprocket may be holding your payout</b><small>No payout on ${fd(r.holds[0].day)} though orders were due · check for an unpaid invoice or negative wallet</small></span><span class="chev">${I.chev}</span></div>`);
    else if (r.reportGap) rows.push(`<div class="rowline click" data-go="codsettings"><span class="dot amber"></span><span class="txt"><b>We haven't received Shiprocket's report since ${fd(r.reportGap.since)}</b><small>Check the report schedule in Shiprocket</small></span><span class="cta-sm ghost">Check</span></div>`);
    if (s.claimTotal > 0 && st.claimSent) rows.push(`<div class="rowline click" data-go="claim"><span class="dot amber"></span><span class="txt"><b>${inr(s.claimTotal)} claimed · sent today ${st.sentAt}</b><small>We'll remind you on Mon 19 Oct if it isn't settled</small></span><span class="chev">${I.chev}</span></div>`);
    else if (s.claimTotal > 0) rows.push(`<div class="rowline"><span class="dot red"></span><span class="txt"><b>${inr(s.claimTotal)} to claim · ${plural(s.claimOrderCount, 'order')}</b><small>${s.toClaimCodCount ? 'Unpaid or short past Shiprocket\'s 10 working days' + (r.walletIssues.length ? ` · ${plural(r.walletIssues.length, 'wrong wallet charge')}` : '') : 'Wrong wallet charge (return fee on a delivered order)'}</small></span><button class="cta-sm" data-go="${s.toClaimCodCount ? 'check' : 'claim'}">Review</button></div>`);
    if (s.waiting.length && !r.holds.length && !r.reportGap) { const w = s.waiting[0]; rows.push(`<div class="rowline click" data-go="check"><span class="dot amber"></span><span class="txt"><b>${plural(s.waiting.length, 'order')} late from ${fd(w.dueIn)}</b><small>Shiprocket has until ${fd(w.promiseEnds)} · we'll check again after the ${fd(w.nextPayout)} payout</small></span><span class="chev">${I.chev}</span></div>`); }
    if (s.needsLook.length) { const n = s.needsLook[0]; rows.push(`<div class="rowline click" data-act="proof" data-oid="${esc(n.order.id)}"><span class="dot violet"></span><span class="txt"><b>${plural(s.needsLook.length, 'order')} needs a look</b><small>${esc(n.order.id)}: ${esc(n.reason)}</small></span><span class="chev">${I.chev}</span></div>`); }
    if (!s.claimTotal && !r.holds.length && !r.reportGap && !s.waiting.length && st.scenario !== 'recovered' && lastV) {
      const v = r.remittanceViews.find((x) => x.date === '2026-10-09') || lastV;
      rows.push(`<div class="rowline click" data-go="check"><span class="dot green"></span><span class="txt"><b>Shiprocket paid all due ✓</b><small>${fd(v.date)} · ${inr(v.dueAmount)} · ${plural(v.dueCount, 'order')}</small></span><span class="chev">${I.chev}</span></div>`);
    }
    const nb = s.nextPayout ? `next payout ${fd(s.nextPayout)}` : 'up to date';
    rows.push(`<div class="rowline click" data-go="payouts"><span class="dot green"></span><span class="txt"><b>${inr(s.onTime)} on time</b><small>${plural(s.onTimeCount, 'order')} · ${nb}</small></span><span class="chev">${I.chev}</span></div>`);
    const rep = st.data.reports[st.data.reports.length - 1];
    return `<div class="card cod-card" id="codCard">
      <div class="cod-head"><span class="t">${I.truck} COD with Shiprocket <span class="newtag">NEW</span></span><button class="iconbtn" data-go="payouts" aria-label="All COD payouts">${I.chev}</button></div>
      <div class="amount">${inr(s.withShiprocket)}</div>
      <div class="cod-sub">Still to come on ${plural(s.withShiprocketCount, 'delivered order')}</div>
      <div style="margin-top:8px">${rows.join('')}</div>
      <div class="foot-note">Checked ${fd(st.today) === fd(rep.receivedAt.slice(0, 10)) ? 'today' : fd(rep.receivedAt.slice(0, 10))}, ${rep.receivedAt.slice(11)} · Shiprocket report to ${fdShort(rep.to)}</div>
    </div>`;
  }

  screens.home = () => `
    <div class="app">${statusbar()}
      <div class="scroll">
        <div class="hello"><span class="avatar">NH</span><span><small>Good morning</small><b>NEEL HOME</b></span></div>
        <div class="card center">
          <div class="label">Collected today</div>
          <div class="amount">₹14,260</div>
          <button class="pillbtn" data-act="toast" data-msg="Existing Razorpay screen · unchanged by this feature">View breakdown (23 payments) ⌄</button>
          <div class="split"><div><div class="label">Next settlement</div><div class="amount">₹1,12,400</div><small>Auto-settles today · HDFC Bank ••1101</small></div><div><div class="label">Account balance</div><div class="amount">₹1,12,400</div><small>After fees &amp; adjustments</small></div></div>
        </div>
        ${st.codOn ? codCard() : `<div class="card"><b>Check your COD payouts from Shiprocket</b><p class="meta" style="margin:6px 0 10px">Know after every payout if any order wasn't paid in full.</p><button class="cta-sm" data-go="setup1">Turn on</button></div>`}
        <div class="collect"><h3>Collect payments</h3>
          <div class="banner">${I.link}<span><small>Get paid on your branded Razorpay link</small>razorpay.me/@neelhome</span><button class="share" data-act="toast" data-msg="Existing Razorpay feature · unchanged by this feature">Share</button></div>
          <div class="quick"><div><span>${I.link}</span>Payment links</div><div><span>${I.page}</span>Payment pages</div><div><span>${I.grid}</span>All products</div></div>
        </div>
      </div>${tabbar('home')}
    </div>`;

  screens.check = () => {
    const v = view(); const r = st.run; const s = r.summary;
    const lateMode = v.notPaid.some((x) => x.status !== 'not_remitted') || v.short.some((x) => x.status !== 'short');
    const others = r.remittanceViews.filter((x) => x.crf !== v.crf).slice().reverse();
    const claimBtn = s.claimTotal > 0 && !st.claimSent ? `<div class="sticky-cta"><button class="btn-block" data-go="claim">See claim · ${inr(s.claimTotal)}</button></div>` : `<div class="sticky-cta"><button class="btn-block secondary" data-go="home">Back to Home</button></div>`;
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
            ${v.paidTotal > v.dueAmount - v.notPaidAmount - v.shortAmount ? `<tr><td>+ Earlier orders paid now<small>Recovered from your claim</small></td><td class="n">${v.lineCount - (v.dueCount - v.notPaid.length)}</td><td class="a">+${inr(v.paidTotal - (v.dueAmount - v.notPaidAmount - v.shortAmount))}</td></tr>` : ''}
            <tr class="tot"><td>= Paid by Shiprocket</td><td class="n">${v.lineCount}</td><td class="a">${inr(v.paidTotal)} ✓</td></tr>
          </table>
          <div class="foot-note">${v.printedTotalOk ? 'Matches the total in Shiprocket\'s report.' : 'Report total differs.'} Every amount is worked out from your Razorpay orders and Shiprocket's own data. <button class="link" data-go="how">How we check</button></div>
        </div>
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

  function claimData() {
    const s = st.run.summary;
    return { nr: s.notRemitted, sh: s.short, w: st.run.walletIssues, total: s.claimTotal, count: s.claimOrderCount, cod: s.toClaimCod };
  }
  screens.claim = () => {
    const c = claimData(); const nrAmt = c.nr.reduce((a, x) => a + x.claim, 0); const shAmt = c.sh.reduce((a, x) => a + x.claim, 0); const wAmt = c.w.reduce((a, x) => a + x.claim, 0);
    const orow = (x, sub) => `<div class="orow" data-act="proof" data-oid="${esc(x.order.id)}"><span class="o"><b>${esc(x.order.id)}</b><small>${sub}</small></span><span class="v">${inr(x.claim)}</span><span class="chev">${I.chev}</span></div>`;
    const sent = st.claimSent;
    return `<div class="app">${statusbar()}
      <div class="scroll">${topbar('Claim to Shiprocket', 'check')}
        <div class="card center"><div class="label">${!c.total ? (st.scenario === 'recovered' ? 'Claim of 13 Oct · ₹6,123 recovered ✓ · left to claim' : 'Nothing to claim') : sent ? 'Claim sent · ' + st.sentAt : 'Ready to send'}</div><div class="amount">${inr(c.total)}</div><div class="meta">${plural(c.count, 'order')} · Shiprocket account ${st.data.merchant.shiprocketAccount}</div></div>
        ${c.nr.length ? `<div class="card"><div class="grp-h">Not paid · ${plural(c.nr.length, 'order')}<span>${inr(nrAmt)}</span></div>${c.nr.map((x) => orow(x, `Delivered ${fd(x.ship.deliveredOn)} · due in ${fd(x.dueIn)} payout`)).join('')}</div>` : ''}
        ${c.sh.length ? `<div class="card"><div class="grp-h">Paid short · ${plural(c.sh.length, 'order')}<span>${inr(shAmt)}</span></div>${c.sh.map((x) => orow(x, `${x.order.type === 'partial_cod' ? `Partial COD · ${inr(x.owed)} due (${inr(x.order.paidOnlineBeforeDispatch)} paid online)` : `${inr(x.owed)} due`} · ${inr(x.paid)} paid`)).join('')}</div>` : ''}
        ${c.w.length ? `<div class="card"><div class="grp-h">Wrong wallet charge · ${plural(c.w.length, 'order')}<span>${inr(wAmt)}</span></div>${c.w.map((w) => `<div class="orow" data-act="proofw" data-awb="${w.wallet.awb}"><span class="o"><b>${esc(w.wallet.orderId)}</b><small>Return (RTO) freight on a delivered order · ${fd(w.wallet.date)}</small></span><span class="v">${inr(w.claim)}</span><span class="chev">${I.chev}</span></div>`).join('')}</div>` : ''}
        ${st.bankQuery ? `<div class="card"><div class="grp-h">Bank-credit query<span>${fd(view().date)} payout</span></div><div class="meta">Please confirm the ${inr(view().paidTotal)} credit (UTR ${last4(view().utr)}).</div></div>` : ''}
        <div class="sec">Account checks</div>
        <div class="card"><ul class="checks">
          <li><span class="tick">✓</span>Plan: ${st.run.plan.label} (D+8 working days, Mon/Wed/Fri)</li>
          <li><span class="tick">✓</span>Wallet balance positive (${inr(st.data.walletBalance)})</li>
          <li><button class="checkbox ${st.checks.cod ? '' : 'off'}" data-act="tick" data-k="cod" aria-label="COD active">✓</button>COD active on your account</li>
          <li><button class="checkbox ${st.checks.kyc ? '' : 'off'}" data-act="tick" data-k="kyc" aria-label="Bank and KYC unchanged">✓</button>Bank and KYC details unchanged</li>
        </ul></div>
        <div style="display:flex;gap:16px;justify-content:center;margin:2px 0 8px"><button class="link" data-act="csv">Download proof (CSV)</button><button class="link" data-act="copy">Copy for Shiprocket ticket</button></div>
      </div>
      <div class="sticky-cta">${sent || !c.total ? '<button class="btn-block secondary" data-go="home">Back to Home</button>' : '<button class="btn-block" data-go="email">Send claim by email</button>'}</div>
    </div>`;
  };

  function claimEmail() {
    const c = claimData(); const m = st.data.merchant; const v = st.run.remittanceViews.find((x) => x.date === '2026-10-09') || view();
    const nxt = st.run.remittanceViews.find((x) => x.date > v.date);
    const nrAmt = c.nr.reduce((a, x) => a + x.claim, 0); const shAmt = c.sh.reduce((a, x) => a + x.claim, 0); const wAmt = c.w.reduce((a, x) => a + x.claim, 0);
    const lines = [];
    lines.push('Hello Shiprocket team,', '', `Please check and settle the ${c.nr.length || c.sh.length ? 'COD amounts' : 'wallet charge'} below for our account (${m.name}, ${m.shiprocketAccount}).`, '');
    lines.push(`Account: ${[`${st.run.plan.label} plan (D+8 working days, Mon/Wed/Fri)`, 'wallet balance positive', st.checks.cod && 'COD active', st.checks.kyc && 'bank and KYC unchanged'].filter(Boolean).join(' · ')}.`, '');
    let n = 1;
    if (c.nr.length) { const ds = c.nr.map((x) => x.ship.deliveredOn).sort(); lines.push(`${n++}. Not received: ${plural(c.nr.length, 'order')}, ${inr(nrAmt)}. Delivered ${fdShort(ds[0])}–${fdShort(ds[ds.length - 1])}, due in the ${fd(c.nr[0].dueIn)} remittance, not in CRF ${last4(v.crf)} (${fdShort(v.date)})${nxt ? ` or CRF ${last4(nxt.crf)} (${fdShort(nxt.date)})` : ''}. Past 10 working days.`); }
    if (c.sh.length) lines.push(`${n++}. Remitted short: ${plural(c.sh.length, 'order')}, ${inr(shAmt)}, in CRF ${last4(v.crf)} (UTR ${last4(v.utr)}).`);
    for (const w of c.w) { const sh = w.ship; const pl = st.run.ledger.find((l) => l.awb === sh.awb); lines.push(`${n++}. Wallet: RTO freight of ${inr(w.claim)} debited on ${fdShort(w.wallet.date)} on ${w.wallet.orderId}, which was delivered on ${fdShort(sh.deliveredOn)}${pl ? ` and whose COD was remitted on ${fdShort(pl.remittanceDate)}` : ''}.`); }
    if (st.bankQuery) lines.push(`${n++}. Please confirm the ${inr(v.paidTotal)} credit for CRF ${last4(v.crf)} (UTR ${last4(v.utr)}).`);
    const ask = [nrAmt + shAmt ? `remit ${inr(nrAmt + shAmt)}` : '', wAmt ? `reverse ${inr(wAmt)}` : ''].filter(Boolean).join(' and ');
    lines.push('', `Request: please ${ask}. Order-wise proof is attached.`, '', 'Thanks,', `${m.owner}, ${m.name}`);
    return lines.join('\n');
  }
  const subjectLine = () => { const c = claimData(); return c.nr.length || c.sh.length ? 'COD remittance not received / short' : 'Wrong wallet charge'; };
  screens.email = () => {
    const c = claimData();
    return `<div class="mail">${statusbar()}
      <div class="mail-bar"><button class="iconbtn" data-go="claim" aria-label="Discard">${I.close}</button><h2>Compose</h2><button class="send" data-act="send" aria-label="Send">${I.send}</button></div>
      <div class="mail-field"><span>From</span><span>${st.data.merchant.email}</span></div>
      <div class="mail-field"><span>To</span><span>Shiprocket Support</span></div>
      <div class="mail-field"><span>Subject</span><span><b>${subjectLine()}: ${plural(c.count, 'order')}, ${inr(c.total)} · ${st.data.merchant.name}</b></span></div>
      <div class="mail-body">${esc(claimEmail())}</div>
      <div class="attach"><i>CSV</i><span><b>claim-NH-1013.csv</b><br><span class="meta">${c.nr.length + c.sh.length + c.w.length} rows · order-wise proof</span></span></div>
    </div>`;
  };

  screens.done = () => `
    <div class="app">${statusbar()}
      <div class="scroll"><div class="done">
        <div class="bigtick">✓</div>
        <h1 class="screen-title">Claim sent to Shiprocket</h1>
        <p class="screen-lede">${inr(st.run.summary.claimTotal)} · ${plural(st.run.summary.claimOrderCount, 'order')} · sent ${st.sentAt || '09:06'} from your email</p>
        <div class="card" style="text-align:left">
          <div class="rowline"><span class="dot amber"></span><span class="txt"><b>We'll remind you on Mon 19 Oct</b><small>If Shiprocket hasn't settled it by then, with a ready follow-up</small></span></div>
          <div class="rowline"><span class="dot green"></span><span class="txt"><b>Recovery is tracked automatically</b><small>We mark it recovered when these orders show up in a payout, or the wallet charge is reversed</small></span></div>
        </div>
      </div></div>
      <div class="sticky-cta"><button class="btn-block" data-go="home">Back to Home</button></div>
    </div>`;

  screens.payouts = () => {
    const r = st.run; const s = r.summary; const f = st.payoutFilter;
    const views = r.remittanceViews.slice().reverse().filter((v) => f === 'all' || (f === 'paid' && !v.notPaid.length && !v.short.length) || (f === 'short' && v.short.length) || (f === 'notpaid' && v.notPaid.length));
    const bucketRows = Object.entries(r.buckets).sort().map(([d, b], i, arr) => i < 3 ? `<div class="okline"><span>Due ${fd(d)} · ${plural(b.count, 'order')}</span><span style="color:var(--ink)">${inr(b.amount)}</span></div>` : '').join('');
    const later = Object.entries(r.buckets).sort().slice(3).reduce((a, [, b]) => ({ c: a.c + b.count, a: a.a + b.amount }), { c: 0, a: 0 });
    return `<div class="app">${statusbar()}
      <div class="scroll">
        <div class="subtabs"><button data-go="txns">Transactions</button><button data-go="settlements">Settlements</button><button class="on">COD payouts</button></div>
        <div class="card"><div class="sec" style="margin:0 0 4px">Still to come from Shiprocket</div><div class="amount md">${inr(s.withShiprocket)}</div><div class="meta">${plural(s.withShiprocketCount, 'delivered order')} · ${inr(s.toClaimCod)} of it to claim</div>
          <div style="margin-top:8px">${bucketRows}${later.c ? `<div class="okline"><span>Due later · ${plural(later.c, 'order')}</span><span style="color:var(--ink)">${inr(later.a)}</span></div>` : ''}</div></div>
        <div style="display:flex;justify-content:space-between;align-items:center"><b>Past payouts</b><span class="chip grey">Past 14 days</span></div>
        <div class="chips">${[['all', 'All'], ['paid', 'Paid'], ['short', 'Short'], ['notpaid', 'Not paid']].map(([k, l]) => `<button class="${f === k ? 'on' : ''}" data-act="pf" data-k="${k}">${l} ${k === 'all' ? r.remittanceViews.length : r.remittanceViews.filter((v) => (k === 'paid' && !v.notPaid.length && !v.short.length) || (k === 'short' && v.short.length) || (k === 'notpaid' && v.notPaid.length)).length}</button>`).join('')}</div>
        <div class="card">${views.length ? views.map((v) => `<div class="prow" data-act="crf" data-crf="${v.crf}"><span class="o"><b>${fd(v.date)} · ${inr(v.paidTotal)}</b><small>CRF ${last4(v.crf)} · ${plural(v.dueCount, 'order')} due</small></span>${v.notPaid.length || v.short.length ? `<span class="chip red">${v.notPaid.length + v.short.length} to check</span>` : '<span class="chip green">All paid</span>'}<span class="chev">${I.chev}</span></div>`).join('') : '<div class="meta" style="text-align:center;padding:16px">No payouts in this filter</div>'}</div>
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
          <div class="okline"><span>Account ${st.data.merchant.shiprocketAccount}</span><span>Connected</span></div>
          <div class="okline"><span>Plan (from your payouts)</span><span style="color:var(--ink)">${st.run.plan.label}</span></div>
          <div class="okline"><span>Daily report</span><span style="color:${st.run.reportGap ? 'var(--amber)' : 'var(--green)'}">${st.run.reportGap ? 'Not received since ' + fd(st.run.reportGap.since) : 'Received ' + fd(rep.receivedAt.slice(0, 10)) + ', ' + rep.receivedAt.slice(11)}</span></div>
          <div class="addr">cod-nh7k2q@reports.razorpay.com <button class="link" data-act="copyaddr">Copy</button></div>
          ${st.run.reportGap ? '<p class="meta" style="margin:10px 0 0">In Shiprocket: Tools → Reports → Schedule Report → Remittance Report → Daily · Last 30 days → send to the address above.</p>' : ''}
        </div>
        <div class="sec">Alerts</div>
        <div class="card"><div class="settings-row"><span class="o">Push notifications<small>When money is missing or a payout is held</small></span><button class="switch ${st.alerts.push ? '' : 'off'}" data-act="alert" data-k="push" aria-label="Push notifications" aria-pressed="${st.alerts.push}"></button></div><div class="settings-row"><span class="o">WhatsApp fallback<small>If push is off</small></span><button class="switch ${st.alerts.wa ? '' : 'off'}" data-act="alert" data-k="wa" aria-label="WhatsApp fallback" aria-pressed="${st.alerts.wa}"></button></div></div>
        <p class="meta" style="padding:0 4px">Razorpay reads your Shiprocket shipments, COD amounts and wallet statement only to run these checks. COD goes from Shiprocket to your bank, and Razorpay never holds it.</p>
      </div>${tabbar('account')}
    </div>`;
  };

  screens.how = () => {
    const d = st.data; const r = st.run;
    return `<div class="app">${statusbar()}
      <div class="scroll">${topbar('How we check', st.prevScreen && st.prevScreen !== 'how' ? st.prevScreen : 'home')}
        <p class="screen-lede">Every payout is checked line by line against your own order record. Nothing is estimated.</p>
        <div class="flow">
          <div class="two">
            <div class="node rzp"><b>Your Razorpay orders</b><small>${d.orders.filter((o) => o.type !== 'prepaid').length} COD orders · total and online advance (partial COD)</small></div>
            <div class="node sr"><b>Shiprocket shipments</b><small>${d.shipments.length} shipments · COD amount, status, delivery date</small></div>
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
        <p class="meta" style="margin-top:14px">COD goes from Shiprocket to your bank. Razorpay never holds it.</p>
      </div>
    </div>`;
  };

  // setup
  const prog = (n) => `<div class="progress">${[1, 2, 3, 4].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  screens.setup1 = () => `<div class="app">${statusbar()}<div class="scroll">${topbar('', 'home')}${prog(1)}
      <h1 class="screen-title">Check your COD payouts</h1>
      <p class="screen-lede">We'll match every Shiprocket payout with your Magic Checkout orders and tell you if any order isn't paid in full.</p>
      <div class="card"><b>We'll read from your connected Shiprocket account</b><ul class="bullets"><li>Shipments and delivery status</li><li>COD amount on each order</li><li>Wallet statement</li></ul><div class="meta">Only to run these checks. You can turn this off any time in Account → COD checks.</div></div>
      <div class="card" style="background:var(--blue-soft);border-color:#D6E1FC"><b>We never move or hold your money.</b><div class="meta">COD goes from Shiprocket straight to your bank.</div></div>
    </div><div class="sticky-cta"><button class="btn-block" data-go="setup2">Allow and continue</button></div></div>`;
  screens.setup2 = () => `<div class="app">${statusbar()}<div class="scroll">${topbar('', 'setup1')}${prog(2)}
      <h1 class="screen-title">Shiprocket connected ✓</h1>
      <p class="screen-lede">Using the Shiprocket connection from your Magic Checkout setup.</p>
      <div class="card">${['Orders', 'Tracking', 'Wallet statement', 'Wallet balance'].map((x) => `<div class="okline"><span>${x}</span><span>✓</span></div>`).join('')}</div>
      <div class="card"><b>Your Razorpay report address</b><div class="meta">Shiprocket will send its daily payout report here.</div><div class="addr">cod-nh7k2q@reports.razorpay.com <button class="link" data-act="copyaddr">Copy</button></div></div>
    </div><div class="sticky-cta"><button class="btn-block" data-go="setup3">Next</button></div></div>`;
  screens.setup3 = () => `<div class="app">${statusbar()}<div class="scroll">${topbar('', 'setup2')}${prog(3)}
      <h1 class="screen-title">Send us Shiprocket's daily report</h1>
      <p class="screen-lede">Once, in Shiprocket. About a minute.</p>
      <div class="card"><ol class="steps"><li><span>Open Shiprocket → <b>Tools → Reports → Schedule Report</b></span></li><li><span>Pick <b>Remittance Report</b></span></li><li><span>Frequency <b>Daily</b> · Date range <b>Last 30 days</b></span></li><li><span>Send to <b>Email</b> → paste your Razorpay address → <b>Save</b></span></li></ol></div>
      <div style="display:flex;gap:16px;justify-content:center"><button class="link" data-act="toast" data-msg="Opening Shiprocket">Open Shiprocket</button><button class="link" data-act="toast" data-msg="Steps sent to kavya@neelhome.in">Email me these steps</button></div>
    </div><div class="sticky-cta"><button class="btn-block" data-go="setup4">I've done this</button></div></div>`;
  screens.setup4 = () => `<div class="app">${statusbar()}<div class="scroll">${prog(4)}<div class="done" style="padding-top:30px">
      <div class="bigtick">✓</div><h1 class="screen-title">COD checks are on</h1>
      <p class="screen-lede">We checked the last 30 days: ${plural(st.run.summary.withShiprocketCount, 'order')} still to come from Shiprocket.</p>
      <div class="card" style="text-align:left"><div class="rowline"><span class="dot green"></span><span class="txt"><b>We'll alert you only when something needs you</b><small>Alerts: Push · fallback WhatsApp</small></span></div></div></div>
    </div><div class="sticky-cta"><button class="btn-block" data-act="enable">Allow notifications</button><button class="btn-block secondary" data-act="enable">Go to Home</button></div></div>`;

  screens.txns = screens.settlements = () => `<div class="app">${statusbar()}<div class="scroll">
      <div class="subtabs"><button data-go="txns" class="${st.screen === 'txns' ? 'on' : ''}">Transactions</button><button data-go="settlements" class="${st.screen === 'settlements' ? 'on' : ''}">Settlements</button><button data-go="payouts">COD payouts</button></div>
      <div class="card"><div class="sec" style="margin:0 0 4px">Next settlement</div><div class="amount md">₹1,12,400</div><div class="meta">Auto-settles today · HDFC Bank ••1101</div></div>
      <div class="meta" style="text-align:center;padding:20px">Your existing ${st.screen === 'txns' ? 'transactions' : 'settlements'} list</div>
    </div>${tabbar('payouts')}</div>`;
  screens.products = screens.support = () => `<div class="app">${statusbar()}<div class="scroll"><div class="topbar"><h2>${st.screen === 'products' ? 'Products' : 'Support'}</h2></div><div class="card"><div class="meta">Unchanged by this feature.</div></div></div>${tabbar(st.screen)}</div>`;

  // ---------- proof sheet ----------
  function proofOrder(oid) {
    const x = st.run.rows.find((r) => r.order.id === oid); if (!x) return;
    st.lastProof = x; const sh = x.ship;
    const items = [];
    if (sh.outForDeliveryAt) items.push(`<div class="ok">Out for delivery ${fdShort(sh.deliveredOn)}, ${sh.outForDeliveryAt}</div>`);
    if (sh.deliveredOn) items.push(`<div class="ok">Delivered ${fdShort(sh.deliveredOn)}${sh.deliveredAt ? ', ' + sh.deliveredAt : ''}<small>Shiprocket tracking</small></div>`);
    if (x.dueIn) items.push(`<div>Due in the ${fd(x.dueIn)} payout<small>First Mon/Wed/Fri after 8 working days (2 Oct holiday skipped)</small></div>`);
    if (x.promiseEnds) items.push(`<div>Shiprocket's 10 working days ended ${fd(x.promiseEnds)}</div>`);
    if (x.searched && x.searched.length) items.push(`<div class="${x.paid ? 'ok' : 'bad'}">Searched: ${x.searched.map((c) => { const v = st.run.remittanceViews.find((q) => q.crf === c); return `${fdShort(v.date)} (CRF ${last4(c)})`; }).join(' · ')}<small>${x.paid ? `Paid ${inr(x.paid)} of ${inr(x.owed)}` : 'Not found in any payout'}</small></div>`);
    const owedLine = x.owed != null ? `COD due ${inr(x.owed)} (Razorpay order${x.order.paidOnlineBeforeDispatch ? `: ${inr(x.order.total)} − ${inr(x.order.paidOnlineBeforeDispatch)} paid online` : ''}) · Shiprocket COD ${inr(sh.codAmount)} ${Math.abs(sh.codAmount - x.owed) <= 100 ? '✓' : '≠'}` : '';
    const chip = { not_remitted: ['red', 'Not paid'], short: ['red', 'Paid short'], paid: ['green', 'Paid'], on_time: ['green', 'On time'], waiting: ['amber', 'Late'], needs_look: ['violet', 'Needs a look'], cant_tell: ['amber', "Can't tell yet"] }[x.status] || ['grey', x.status];
    openSheet(`<div class="grab"></div><h3>${esc(x.order.id)} <span class="chip ${chip[0]}">${chip[1]}</span></h3><div class="meta">AWB (Shiprocket tracking no.) ${last4(sh.awb)}</div><p style="font-size:13px;margin:10px 0 0">${owedLine}</p>${x.status === 'needs_look' ? `<p class="meta" style="margin:6px 0 0">${esc(x.reason)}. Not claimed automatically.</p>` : ''}<div class="tl">${items.join('')}</div><button class="btn-block secondary" data-act="closesheet">Close</button>`);
    if (st.sideTab === 'rules') renderSide();
  }
  function proofWallet(awb) {
    const w = st.run.walletIssues.find((q) => q.wallet.awb === awb); if (!w) return;
    const pl = st.run.ledger.find((l) => l.awb === awb);
    openSheet(`<div class="grab"></div><h3>${esc(w.wallet.orderId)} <span class="chip red">Wrong charge</span></h3><div class="meta">AWB (tracking no.) ${last4(awb)} · wallet entry ${w.wallet.ref}</div>
      <div class="tl"><div class="ok">Delivered ${fdShort(w.ship.deliveredOn)}, ${w.ship.deliveredAt}<small>Shiprocket tracking · no return scan</small></div>${pl ? `<div class="ok">COD ${inr(pl.remitted)} paid in the ${fd(pl.remittanceDate)} payout<small>CRF ${last4(pl.crf)}</small></div>` : ''}<div class="bad">Return (RTO) freight ${inr(w.claim)} debited ${fdShort(w.wallet.date)}<small>A return charge on an order that was delivered</small></div></div>
      <button class="btn-block secondary" data-act="closesheet">Close</button>`);
  }
  function openSheet(html) { sheetEl.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`; sheetEl.hidden = false; }
  function closeSheet() { sheetEl.hidden = true; sheetEl.innerHTML = ''; }
  sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl) closeSheet(); });

  let toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 2200); }

  function downloadCsv() {
    const c = claimData(); const rows = [['order_id', 'awb', 'issue', 'delivered_on', 'cod_due', 'paid', 'claim', 'payouts_searched', 'utr', 'wallet_entry']];
    const crfs = (x) => (x.searched || []).map((q) => q).join(' ');
    for (const x of c.nr) rows.push([x.order.id, x.ship.awb, 'not_remitted', x.ship.deliveredOn, x.owed / 100, 0, x.claim / 100, crfs(x), '', '']);
    for (const x of c.sh) { const l = x.lines[0]; const v = l ? st.run.remittanceViews.find((q) => q.crf === l.crf) : null; rows.push([x.order.id, x.ship.awb, 'remitted_short', x.ship.deliveredOn, x.owed / 100, x.paid / 100, x.claim / 100, crfs(x), v ? v.utr : '', '']); }
    for (const w of c.w) rows.push([w.wallet.orderId, w.wallet.awb, 'rto_freight_on_delivered', w.ship.deliveredOn, '', '', w.claim / 100, '', '', w.wallet.ref]);
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'claim-NH-1013.csv';
    document.body.appendChild(a); a.click(); a.remove(); toast('Proof downloaded · claim-NH-1013.csv');
  }
  async function copy(text, msg) { try { await navigator.clipboard.writeText(text); } catch (e) { /* clipboard may be blocked; still confirm */ } toast(msg); }

  // ---------- routing ----------
  const FLOWS = {
    hero: [['lock', 'Push alert'], ['home', 'Home card'], ['check', 'Payout check'], ['claim', 'Claim pack'], ['email', 'Email from your account'], ['done', 'Sent']],
    setup: [['setup1', 'Turn on (consent)'], ['setup2', 'Shiprocket connected'], ['setup3', "Schedule Shiprocket's report"], ['setup4', "You're set"]],
    how: [['how', 'How we check'], ['payouts', 'COD payouts list'], ['codsettings', 'Settings and control']],
  };
  function go(screen) {
    if (screen === 'home' && st.screen === 'lock') {/* opening the push */ }
    if (screen === 'check' && !view()) return;
    // nothing to claim: the compose/sent steps fall back to the claim pack (which says so)
    if ((screen === 'email' || screen === 'done') && !st.run.summary.claimTotal) screen = 'claim';
    // jumping to "Sent" from the guide counts as sending, so Home and the claim pack agree
    if (screen === 'done' && !st.claimSent) { st.claimSent = true; st.sentAt = '09:06'; }
    st.prevScreen = st.screen; st.screen = screen; closeSheet();
    const f = Object.entries(FLOWS).find(([, list]) => list.some(([k]) => k === screen));
    if (f && !(st.flow === 'hero' && ['payouts', 'codsettings', 'how'].includes(screen) && FLOWS.hero.some(([k]) => k === st.prevScreen))) st.flow = f[0];
    render();
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
      const act = a.dataset.act;
      if (act === 'proof') proofOrder(a.dataset.oid);
      else if (act === 'proofw') proofWallet(a.dataset.awb);
      else if (act === 'closesheet') closeSheet();
      else if (act === 'crf') { st.crf = a.dataset.crf; go('check'); }
      else if (act === 'bank') { st.bankQuery = !st.bankQuery; toast(st.bankQuery ? 'Added a bank-credit query to your claim' : 'Bank-credit query removed'); render(); }
      else if (act === 'tick') { st.checks[a.dataset.k] = !st.checks[a.dataset.k]; render(); }
      else if (act === 'csv') downloadCsv();
      else if (act === 'copy') copy(`Subject: ${subjectLine()}\n\n${claimEmail()}`, 'Claim copied · paste it into a Shiprocket ticket');
      else if (act === 'copyaddr') copy('cod-nh7k2q@reports.razorpay.com', 'Address copied');
      else if (act === 'send') { st.claimSent = true; st.sentAt = '09:06'; go('done'); }
      else if (act === 'pf') { st.payoutFilter = a.dataset.k; render(); }
      else if (act === 'codtoggle') { st.codOn = !st.codOn; toast(st.codOn ? 'COD checks turned on' : 'COD checks turned off'); render(); }
      else if (act === 'enable') { st.codOn = true; go('home'); }
      else if (act === 'toast') toast(a.dataset.msg);
      else if (act === 'alert') { const k = a.dataset.k; st.alerts[k] = !st.alerts[k]; toast(`${k === 'push' ? 'Push notifications' : 'WhatsApp fallback'} turned ${st.alerts[k] ? 'on' : 'off'}`); render(); }
      return;
    }
    if (g) go(g.dataset.go);
  }

  // ---------- side panel ----------
  const GUIDE = {
    lock: ['Push alert', `It's ${fdLong('2026-10-13')}, 09:05. Overnight, Shiprocket's daily report arrived and the check ran. Seven delivered orders are past Shiprocket's own 10 working days and are unpaid or short, and one wallet charge is wrong. The founder gets one alert with the total.`],
    home: ['Home card', 'A new card under "Next settlement", the place merchants already look for money owed to them. It shows all COD still with Shiprocket, what to claim, and what is simply on its way.'],
    check: ['Payout check', "One Shiprocket payout, line by line. What was due (from the merchant's own orders), minus what's missing or short, equals exactly what Shiprocket paid. That match is what makes the claim credible."],
    claim: ['Claim pack', "Every flagged order, grouped by issue, each with its proof (tap any row). The account checks answer the questions Shiprocket's support desk asks before escalating to its Finance Desk."],
    email: ['Email from your account', "The claim opens in the founder's own email app, so Shiprocket sees it coming from its customer. The CSV attachment has one row per order. Nothing is sent without this tap."],
    done: ['Sent', 'Done in about a minute. A reminder is set for Mon 19 Oct, and recovery is matched automatically when the orders appear in a later payout or the charge is reversed.'],
    setup1: ['Turn on (consent)', "One screen that names exactly what's read. It reuses the Shiprocket connection merchants already set up for Magic Checkout's delivery tracking."],
    setup2: ['Shiprocket connected', 'Razorpay tests each Shiprocket call (orders, tracking, wallet statement, wallet balance) and gives the merchant a private report address.'],
    setup3: ["Schedule Shiprocket's report", "The only step outside Razorpay: schedule Shiprocket's daily Remittance Report to that address. After this, everything arrives on its own."],
    setup4: ["You're set", 'The first check runs right away on the last 30 days. From here, the merchant does nothing until an alert.'],
    how: ['How we check', 'The four inputs, the rules and the outputs, in plain words inside the product.'],
    payouts: ['COD payouts list', 'A third sub-tab next to Transactions and Settlements, using the same pattern: what is still to come, then every past payout with its status.'],
    codsettings: ['Settings and control', 'The merchant can see the connection, the report status and the alerts, and switch everything off at any time.'],
    account: ['Account', 'COD checks sit beside the existing settings rows.'],
  };

  function renderSide() {
    document.querySelectorAll('.side-tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === st.sideTab)));
    const r = st.run; const s = r.summary; const d = st.data;
    let h = '';
    if (st.sideTab === 'guide') {
      const flow = FLOWS[st.flow] || FLOWS.hero;
      h += `<div class="stepper">${flow.map(([k, l], i) => `<button class="${st.screen === k ? 'on' : ''}" data-side-go="${k}"><i>${i + 1}</i>${l}</button>`).join('')}</div>`;
      let g = GUIDE[st.screen] || GUIDE.home;
      if (st.screen === 'lock' && st.scenario !== 'hero') g = [g[0], SC[st.scenario].note];
      h += `<div class="explain"><b class="k">${g[0]}</b><p style="margin:6px 0 0">${g[1]}</p></div>`;
      if (st.screen === 'check' || st.screen === 'claim') {
        const v = view();
        h += `<h3>The numbers on this screen</h3><div class="tbl-wrap"><table class="tbl"><tr><th>Line</th><th class="r">Orders</th><th class="r">Amount</th></tr>
          <tr><td>Due in ${fd(v.date)} payout</td><td class="r">${v.dueCount}</td><td class="r">${inr(v.dueAmount)}</td></tr>
          <tr><td>Not paid</td><td class="r">${v.notPaid.length}</td><td class="r">−${inr(v.notPaidAmount)}</td></tr>
          <tr><td>Paid short</td><td class="r">${v.short.length}</td><td class="r">−${inr(v.shortAmount)}</td></tr>
          <tr><td><b>Paid by Shiprocket</b></td><td class="r">${v.lineCount}</td><td class="r"><b>${inr(v.paidTotal)}</b></td></tr>
          <tr><td>Claim (incl. wallet)</td><td class="r">${s.claimOrderCount}</td><td class="r">${inr(s.claimTotal)}</td></tr></table></div>`;
      }
      h += `<h3>What the brief asks, and where it is</h3><ul>
        <li><b>Merchant and goal:</b> founder-run D2C brand on Magic Checkout, about half its orders COD via Shiprocket; wants every COD rupee back.</li>
        <li><b>Today:</b> Shiprocket panel → Excel → bank app → ticket, so small brands rarely check.</li>
        <li><b>Why mobile:</b> payouts land Mon/Wed/Fri; the founder is on the packing floor; Home already shows "Next settlement".</li>
        <li><b>Under two minutes:</b> 5 taps from alert to sent (about a minute at a normal pace).</li>
        <li><b>Not built:</b> lending, customer refunds, weight disputes, prepay nudges, web dashboard, other couriers.</li>
        <li><b>Success:</b> ₹ recovered per merchant per month; payouts checked within a day; claims rejected as wrong; churn against a holdout.</li></ul>`;
    } else if (st.sideTab === 'situations') {
      h += `<p>Switch the merchant's situation. The rules engine re-runs on the new data and every screen updates.</p><div class="sit-grid">${Object.entries(SC).map(([k, v]) => `<button class="${st.scenario === k ? 'on' : ''}" data-scenario="${k}">${v.label}<small>${fd(SCEN_DAY[k] || '2026-10-13')}</small></button>`).join('')}</div>`;
      h += `<div class="explain"><b class="k">${SC[st.scenario].label}</b><p style="margin:6px 0 0">${SC[st.scenario].note}</p></div>`;
      h += `<h3>Result</h3><div class="kv"><div><b>${inr(s.withShiprocket)}</b><small>with Shiprocket</small></div><div><b>${inr(s.claimTotal)}</b><small>to claim</small></div><div><b>${s.waiting.length}</b><small>late, not yet claimable</small></div></div>`;
    } else if (st.sideTab === 'data') {
      const v = view(); const ls = r.ledger.filter((l) => l.crf === v.crf).slice(0, 6);
      h += `<h3>Inputs (live)</h3><div class="kv"><div><b>${d.orders.length}</b><small>Razorpay orders</small></div><div><b>${d.shipments.length}</b><small>Shiprocket shipments</small></div><div><b>${r.ledger.length}</b><small>payout lines</small></div><div><b>${d.remittances.length}</b><small>payouts (CRF IDs)</small></div><div><b>${d.wallet.length}</b><small>wallet entries</small></div><div><b>${d.reports.length}</b><small>${d.reports.length === 1 ? 'latest daily report (30 days)' : 'daily reports'}</small></div></div>`;
      h += `<h3>How it fits together</h3><div class="arch">
        <div class="lane"><span>Sources</span><div class="boxes"><div>Magic Checkout orders</div><div>Shiprocket API: shipments, tracking, wallet</div><div>Shiprocket daily Remittance Report → webhook / email</div></div></div>
        <div class="lane"><span>Razorpay</span><div class="boxes"><div>Logistics connector (existing)</div><div class="new">COD Recon service: ledger · rules · claims</div><div>Notifications: push, WhatsApp</div></div></div>
        <div class="lane"><span>App</span><div class="boxes"><div class="new">Home card</div><div class="new">Payout check</div><div class="new">Claim pack</div><div class="new">COD payouts tab</div></div></div>
        <div class="lane"><span>Out</span><div class="boxes"><div>Claim email + CSV → Shiprocket Finance Desk</div><div>Recovery matched from later payouts</div></div></div></div>`;
      h += `<h3>Sample: lines in the ${fd(v.date)} payout (CRF ${last4(v.crf)})</h3><div class="tbl-wrap"><table class="tbl"><tr><th>Order</th><th>AWB</th><th class="r">COD</th><th class="r">Remitted</th></tr>${ls.map((l) => `<tr><td>${esc(l.orderId)}</td><td>${last4(l.awb)}</td><td class="r">${inr(l.cod)}</td><td class="r">${inr(l.remitted)}</td></tr>`).join('')}<tr><td colspan="4" class="meta">… ${v.lineCount} lines in total · ${inr(v.paidTotal)}</td></tr></table></div>`;
    } else if (st.sideTab === 'rules') {
      h += `<p>Fixed rules, the same answer every time. Every rupee traces back to an order, a payout line or a wallet entry.</p>
        <div class="rule"><b>1 · What is owed</b>Order total − amount paid online before dispatch (partial COD). Must match Shiprocket's COD amount within ₹1, otherwise it shows as <i>Needs a look</i>.</div>
        <div class="rule"><b>2 · When it is due</b>First working Mon/Wed/Fri on or after 8 working days from delivery (Shiprocket Standard). Holidays move to the next working day.</div>
        <div class="rule"><b>3 · When it can be claimed</b>After Shiprocket's 10 working days, with the due payout and the next one both received and report days complete.</div>
        <div class="rule"><b>4 · Status</b>All payout lines for the order are added up: paid · on time · late · not paid · paid short · paid more.</div>
        <div class="rule"><b>5 · Never claim a hold</b>No payout on a payout day with orders due, or most of a payout unpaid, means "can't tell yet". No claims.</div>
        <div class="rule"><b>6 · Wallet</b>Return (RTO) freight on a delivered order, or a COD charge not reversed on a returned order, is a wrong charge.</div>
        <h3>Terms on screen</h3><ul><li><b>CRF ID:</b> Shiprocket's ID for one COD payout (COD Remittance File).</li><li><b>UTR:</b> the bank's reference for that transfer.</li><li><b>AWB:</b> the shipment's tracking number.</li><li><b>RTO:</b> return to origin, a parcel sent back to the brand.</li><li><b>Partial COD:</b> part paid online at checkout, the rest in cash at the door.</li></ul>`;
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
status           ${x.status}${x.claim ? `\nclaim            ${inr(x.claim)}` : ''}</div><p class="meta" style="margin-top:8px">Tap any order in the claim pack to trace it here.</p>`;
    }
    sideBody.innerHTML = h;
  }

  document.querySelector('.side-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; st.sideTab = b.dataset.tab; renderSide(); });
  sideBody.addEventListener('click', (e) => {
    const sg = e.target.closest('[data-side-go]'); if (sg) { go(sg.dataset.sideGo); return; }
    const sc = e.target.closest('[data-scenario]'); if (sc) { load(sc.dataset.scenario); st.screen = sc.dataset.scenario === 'hero' ? 'lock' : 'home'; st.flow = 'hero'; render(); }
  });
  document.querySelector('.play-row').addEventListener('click', (e) => {
    const b = e.target.closest('[data-play]'); if (!b) return; const p = b.dataset.play;
    if (p === 'hero') { load('hero'); st.flow = 'hero'; st.sideTab = 'guide'; st.screen = 'lock'; render(); }
    if (p === 'setup') { st.flow = 'setup'; st.sideTab = 'guide'; go('setup1'); }
    if (p === 'how') { st.flow = 'how'; st.sideTab = 'guide'; go('how'); }
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
  window.__cod = { st, go, load, render };
  load('hero'); render();
})();
