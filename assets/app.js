(() => {
const { C, REMOTE, call, usd, fmt, esc, proRata, payouts } = AF, $ = id => document.getElementById(id);
let mode = "login", session = null, state = null, filter = "all";
const STRATS = [["Gold Trading", 35, "#4cc9f0"], ["Oil Trading", 25, "#5ff2da"], ["Crypto Arbitrage", 25, "#1f8fff"], ["Exchange Fees", 15, "#1668c9"]];

const setMode = m => {
  mode = m; $("regOnly").classList.toggle("hide", m !== "register"); $("agreeRow").classList.toggle("hide", m !== "register"); $("auth").classList.toggle("wideauth", m === "register");
  $("tLogin").classList.toggle("on", m === "login"); $("tReg").classList.toggle("on", m === "register");
  $("go").textContent = m === "login" ? "Login" : "Create account";
};
$("tLogin").onclick = () => setMode("login"); $("tReg").onclick = () => setMode("register");
const qs = new URLSearchParams(location.search);
if (qs.get("mode") === "register") setMode("register");
if (qs.get("ref")) { setMode("register"); $("ref").value = qs.get("ref"); }

$("countries").innerHTML = "Afghanistan,Australia,Austria,Bangladesh,Belgium,Brazil,Cambodia,Canada,China,Denmark,Egypt,France,Germany,Hong Kong,India,Indonesia,Ireland,Italy,Japan,Laos,Malaysia,Myanmar,Nepal,Netherlands,New Zealand,Norway,Pakistan,Philippines,Russia,Saudi Arabia,Singapore,South Africa,South Korea,Spain,Sri Lanka,Sweden,Switzerland,Taiwan,Thailand,Turkey,United Arab Emirates,United Kingdom,United States,Vietnam".split(",").map(c => `<option value="${c}">`).join("");

$("form").onsubmit = async e => {
  e.preventDefault(); $("authMsg").textContent = "Please wait…";
  const body = { email: $("email").value.trim(), password: $("pw").value };
  if (mode === "register") {
    const v = id => $(id).value.trim();
    Object.assign(body, { name: v("name"), dob: v("dob"), nationality: v("nat"), occupation: v("occ"), phone: v("phone"), country: v("country"), address: v("addr"), city: v("city"), postal: v("zip"), idType: v("idt"), idNumber: v("idn"), walletNetwork: v("wnet"), wallet: v("wallet"), ref: v("ref") });
    const miss = [["name", "full name"], ["dob", "date of birth"], ["nationality", "nationality"], ["phone", "phone number"], ["country", "country of residence"], ["address", "address"], ["city", "city"], ["idNumber", "ID number"], ["wallet", "USDT wallet address"]].find(([k]) => !body[k]);
    const age = (Date.now() - new Date(body.dob)) / 31557600000;
    const err = miss ? "Please enter your " + miss[1] + "." : !(age >= 18) ? "You must be 18 or older to register." : !/^\+?[0-9 ()-]{7,20}$/.test(body.phone) ? "Please enter a valid phone number." : body.wallet.length < 20 ? "Please enter a valid USDT wallet address." : !$("agree").checked ? "Please accept the terms to continue." : "";
    if (err) { $("authMsg").textContent = err; return; }
  }
  if (mode === "register" && !/^\S+@\S+\.\S+$/.test(body.email)) { $("authMsg").textContent = "Please enter a valid email address."; return; }
  let r = await call(mode, body);
  if (!r.ok && mode === "login") {
    const a = await call("adminLogin", { user: body.email, password: body.password });
    if (a.ok) { sessionStorage.setItem("af_admin", a.token); location.href = "admin.html"; return; }
  }
  if (!r.ok) { $("authMsg").textContent = r.error; return; }
  localStorage.setItem("af_token", r.member.token); render(r);
};
$("logout").onclick = () => { localStorage.removeItem("af_token"); location.href = "app.html"; };

function show(view) {
  document.querySelectorAll("[data-pane]").forEach(p => p.classList.toggle("hide", p.dataset.pane !== view));
  document.querySelectorAll(".rb[data-view]").forEach(b => b.classList.toggle("on", b.dataset.view === view));
}
document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => show(b.dataset.view));
document.querySelectorAll("#pills button").forEach(b => b.onclick = () => {
  filter = b.dataset.f; document.querySelectorAll("#pills button").forEach(x => x.classList.toggle("on", x === b)); if (state) renderTx();
});
$("q").oninput = () => state && renderTx();

function updatePreview() {
  const a = +$("amt").value, n = new Date();
  $("preview").textContent = a >= C.MIN_DEPOSIT
    ? `If confirmed today: first payout on ${fmt(new Date(n.getFullYear(), n.getMonth() + 1, 2))} ≈ ${usd(a * C.rateFor(a) * proRata(n))} (pro-rated at ${AF.tierLabel(a)}), then ${usd(a * C.rateFor(a))} monthly.` : "";
}
$("amt").oninput = updatePreview;
const showAddr = () => $("addr").textContent = C.ADDRESSES[$("net").value];
$("net").onchange = showAddr; showAddr();
$("dep").onclick = async () => {
  const amount = +$("amt").value, txid = $("txid").value.trim();
  if (!(amount >= C.MIN_DEPOSIT)) return $("depMsg").textContent = "Minimum deposit is $" + C.MIN_DEPOSIT;
  if (!txid) return $("depMsg").textContent = "Enter the transaction hash.";
  const r = await call("deposit", { token: session.token, amount, network: $("net").value, txid });
  if (!r.ok) return $("depMsg").textContent = r.error;
  $("depMsg").textContent = "Deposit submitted — pending admin confirmation."; $("amt").value = $("txid").value = ""; updatePreview(); render(r); show("history");
};
$("copyRef").onclick = () => {
  const link = location.origin + location.pathname + "?ref=" + session.code;
  (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => $("copyRef").textContent = "Copied!", () => prompt("Copy your link:", link));
};

function renderBars(pay, invested) {
  const n = new Date(), months = [];
  for (let i = 1; i <= 6; i++) months.push(new Date(n.getFullYear(), n.getMonth() + i, 1));
  const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  const vals = months.map(d => (pay.find(p => p.date === key(d)) || { amount: 0 }).amount);
  const max = Math.max(...vals, 0.01), hi = vals.findIndex(v => v > 0);
  $("bars").innerHTML = months.map((d, i) => {
    const h = invested ? Math.max(18, vals[i] / max * 82) : 22 + (i % 3) * 8;
    return `<div class="bar ${i === hi ? "hl" : ""}">${i === hi ? `<span class="tip">+${usd(vals[i])}</span>` : ""}<div class="col" style="height:${h}%"></div><small>${d.toLocaleString("en", { month: "short" })}</small></div>`;
  }).join("");
}
function renderDonut(invested) {
  const R = 78, Cc = 2 * Math.PI * R, gap = 16; let off = 0, svg = "";
  STRATS.forEach(([, pct, col]) => {
    const len = Math.max(0, pct / 100 * Cc - gap);
    svg += `<circle cx="100" cy="100" r="${R}" stroke="${col}" stroke-dasharray="${len} ${Cc}" stroke-dashoffset="${-off}"/>`; off += pct / 100 * Cc;
  });
  $("donut").innerHTML = svg;
  $("dTotal").textContent = usd(invested).replace(".00", "");
  $("legend").innerHTML = STRATS.map(([n, pct, col]) => `<li><i style="background:${col}"></i><div>${n}<small>${usd(invested * pct / 100)} · ${pct}%</small></div></li>`).join("");
}
function renderWave(pay) {
  const v = pay.slice(0, 6).map(p => p.amount), pts = v.length > 1 ? v : [0, 1, 0.4, 1, 0.5, 0.9], max = Math.max(...pts, 0.01);
  const xy = pts.map((a, i) => [i / (pts.length - 1) * 200, 70 - a / max * 55]);
  let d = `M${xy[0][0]},${xy[0][1]}`; for (let i = 1; i < xy.length; i++) { const mx = (xy[i - 1][0] + xy[i][0]) / 2; d += ` C${mx},${xy[i - 1][1]} ${mx},${xy[i][1]} ${xy[i][0]},${xy[i][1]}`; }
  $("wave").innerHTML = `<defs><linearGradient id="wg"><stop offset="0" stop-color="#1f8fff"/><stop offset="1" stop-color="#7fd4ff"/></linearGradient></defs><path d="${d}"/>`;
}

function txItems() {
  const { deposits, referrals } = state, items = [];
  deposits.forEach(d => items.push({ t: "deposit", icon: "down", label: `Deposit · ${d.network}`, sub: `${fmt(d.createdAt)} · ${d.status}`, amt: usd(d.amount), pos: false, ts: d.createdAt }));
  state.pay.forEach(p => items.push({ t: "payout", icon: "up", label: "Interest payout", sub: `${p.date} · ${p.paid ? "Paid" : "Scheduled"}`, amt: "+" + usd(p.amount), pos: true, ts: p.date }));
  referrals.filter(r => r.bonus > 0).forEach(r => items.push({ t: "referral", icon: "gift", label: `Referral · ${r.name}`, sub: "5% of friend's deposits", amt: "+" + usd(r.bonus), pos: true, ts: "0" }));
  return items.sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
}
function renderTx() {
  const q = $("q").value.trim().toLowerCase();
  const list = txItems().filter(i => (filter === "all" || i.t === filter) && (!q || (i.label + i.sub).toLowerCase().includes(q)));
  $("txs").innerHTML = list.map(i => `<li><span class="txi ${i.pos ? "" : "out"}"><i data-i="${i.icon}"></i></span><div>${esc(i.label)}<small>${esc(i.sub)}</small></div><b class="${i.pos ? "pos" : ""}">${esc(i.amt)}</b></li>`).join("") || `<li><div>No transactions yet.<small>Make your first USDT deposit to start earning.</small></div></li>`;
  renderIcons($("txs"));
}

function render(r) {
  session = r.member;
  const conf = r.deposits.filter(d => d.status === "Confirmed"), pay = payouts(r.deposits, 7);
  state = { ...r, pay };
  const invested = conf.reduce((s, d) => s + d.amount, 0), q = r.referrals.filter(x => x.bonus > 0).length, refTotal = r.referrals.reduce((s, x) => s + x.bonus, 0), next = pay.find(p => !p.paid);

  $("auth").classList.add("hide"); $("dash").classList.remove("hide");
  $("searchBox").classList.remove("hide"); $("hiBox").classList.remove("hide");
  $("who").textContent = r.member.name.split(" ")[0]; $("av").textContent = r.member.name.trim()[0].toUpperCase();
  $("sInv").textContent = usd(invested);
  $("sPaid").textContent = usd(pay.filter(p => p.paid).reduce((s, p) => s + p.amount, 0));
  $("sRef").textContent = usd(refTotal); $("refCount").textContent = `${q} friend${q === 1 ? "" : "s"} qualified`;
  $("rateBadge").textContent = "1.5% – 2.5% / mo";
  $("nextD").textContent = next ? `Next ${next.date} · ${usd(next.amount)}` : "No payout scheduled";
  $("cardCode").textContent = "Referral code · " + r.member.code; $("myCode").textContent = r.member.code;
  renderBars(pay, invested); renderDonut(invested); renderWave(pay); renderTx();

  $("depRows").innerHTML = r.deposits.map(d => `<tr><td>${fmt(d.createdAt)}</td><td>${esc(d.network)}</td><td>${usd(d.amount)}</td><td>${esc(String(d.txid).slice(0, 14))}…</td><td><span class="pill ${esc(d.status)}">${esc(d.status)}</span></td></tr>`).join("") || `<tr><td colspan=5>No deposits yet.</td></tr>`;
  $("payRows").innerHTML = pay.map(p => `<tr><td>${p.date}</td><td>${usd(p.amount)}</td><td><span class="pill ${p.paid ? "Confirmed" : "Pending"}">${p.paid ? "Paid" : "Scheduled"}</span></td></tr>`).join("") || `<tr><td colspan=3>Payouts appear once a deposit is confirmed.</td></tr>`;
  $("refRows").innerHTML = r.referrals.map(x => `<tr><td>${esc(x.name)}</td><td><span class="pill ${x.bonus > 0 ? "Confirmed" : "Pending"}">${x.bonus > 0 ? "+" + usd(x.bonus) : "Awaiting deposit"}</span></td></tr>`).join("") || `<tr><td colspan=2>Share: ${esc(location.origin + location.pathname)}?ref=${esc(r.member.code)}</td></tr>`;
  renderIcons();
}

const t = localStorage.getItem("af_token");
if (t) call("profile", { token: t }).then(r => r.ok ? render(r) : localStorage.removeItem("af_token"));
})();
