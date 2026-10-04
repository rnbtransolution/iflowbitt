/* Shared API layer: Google Apps Script (remote) or localStorage (demo) */
(() => {
const C = window.AF_CONFIG, REMOTE = !!C.API_URL;
const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();
const fmt = d => new Date(d).toISOString().slice(0, 10);
const usd = n => "$" + (+n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function remote(action, p) {
  const r = await fetch(C.API_URL, { method: "POST", body: JSON.stringify({ action, ...p }) }); // text/plain body avoids CORS preflight
  return r.json();
}
const LS = {
  get db() { return JSON.parse(localStorage.getItem("af_db") || '{"members":[],"deposits":[]}'); },
  set db(v) { localStorage.setItem("af_db", JSON.stringify(v)); }
};
const refBonus = (db, email) => db.deposits.filter(d => d.email === email && d.status === "Confirmed" && d.amount >= C.MIN_DEPOSIT).reduce((s, d) => s + d.amount * C.REFERRAL_RATE, 0);
function profile(db, m) {
  return { ok: true, member: { name: m.name, email: m.email, code: m.code, token: m.token },
    deposits: db.deposits.filter(d => d.email === m.email),
    referrals: db.members.filter(x => x.referredBy === m.code).map(x => ({ name: x.name, bonus: refBonus(db, x.email) })) };
}
const adminOk = t => t === "demo-admin-token";
const local = {
  register({ email, password, ref, ...info }) {
    const db = LS.db; email = email.toLowerCase();
    if (db.members.some(m => m.email === email)) return { ok: false, error: "Email already registered" };
    let referredBy = "";
    if (ref) { if (!db.members.some(m => m.code === ref.toUpperCase())) return { ok: false, error: "Invalid referral code" }; referredBy = ref.toUpperCase(); }
    const m = { ...info, email, password, code: uid(), referredBy, token: uid() + uid(), createdAt: new Date().toISOString() };
    db.members.push(m); LS.db = db; return profile(db, m);
  },
  login({ email, password }) {
    const db = LS.db, m = db.members.find(x => x.email === email.toLowerCase() && x.password === password);
    return m ? profile(db, m) : { ok: false, error: "Invalid email or password" };
  },
  profile({ token }) { const db = LS.db, m = db.members.find(x => x.token === token); return m ? profile(db, m) : { ok: false, error: "Session expired" }; },
  deposit({ token, amount, network, txid }) {
    const db = LS.db, m = db.members.find(x => x.token === token); if (!m) return { ok: false, error: "Session expired" };
    if (!(amount >= C.MIN_DEPOSIT)) return { ok: false, error: "Minimum deposit is $" + C.MIN_DEPOSIT };
    if (db.deposits.some(d => d.txid === txid)) return { ok: false, error: "TXID already used" };
    db.deposits.push({ id: uid(), email: m.email, amount, network, txid, status: "Pending", createdAt: new Date().toISOString(), confirmedAt: "" });
    LS.db = db; return profile(db, m);
  },
  adminLogin({ user, password }) {
    return user === C.DEMO_ADMIN.user && password === C.DEMO_ADMIN.password ? { ok: true, token: "demo-admin-token" } : { ok: false, error: "Invalid admin credentials" };
  },
  adminData({ token }) {
    if (!adminOk(token)) return { ok: false, error: "Unauthorized" };
    const db = LS.db; return { ok: true, members: db.members.map(m => ({ name: m.name, email: m.email, code: m.code, referredBy: m.referredBy, createdAt: m.createdAt })), deposits: db.deposits };
  },
  adminSet({ token, id, status }) {
    if (!adminOk(token)) return { ok: false, error: "Unauthorized" };
    const db = LS.db, d = db.deposits.find(x => x.id === id); if (!d) return { ok: false, error: "Not found" };
    d.status = status; d.confirmedAt = status === "Confirmed" ? new Date().toISOString() : ""; LS.db = db; return local.adminData({ token });
  }
};
const call = (action, p) => REMOTE ? remote(action, p) : Promise.resolve(local[action](p));

/* First payout is pro-rated: (days in month - deposit day + 1) / days in month */
function proRata(date) {
  const d = new Date(date), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return (dim - d.getDate() + 1) / dim;
}
const dkey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
// Returns [{date:'YYYY-MM-01', amount, paid}] for a list of deposits
function payouts(deposits, months = 2) {
  const now = new Date(), horizon = new Date(now.getFullYear(), now.getMonth() + months, 1), by = {};
  deposits.filter(d => d.status === "Confirmed").forEach(d => {
    const c = new Date(d.confirmedAt || d.createdAt);
    let p = new Date(c.getFullYear(), c.getMonth() + 1, 1), first = true;
    while (p <= horizon) {
      const k = dkey(p); by[k] = by[k] || { date: k, amount: 0, paid: p <= now };
      by[k].amount += d.amount * C.rateFor(d.amount) * (first ? proRata(c) : 1);
      p = new Date(p.getFullYear(), p.getMonth() + 1, 1); first = false;
    }
  });
  return Object.values(by).sort((a, b) => a.date.localeCompare(b.date));
}
const tierLabel = a => (C.rateFor(a) * 100).toFixed(1).replace(".0", "") + "%";
window.AF = { tierLabel, C, REMOTE, call, usd, fmt, esc, proRata, payouts, refBonus };
})();
