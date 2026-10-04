(() => {
const { C, REMOTE, call, usd, fmt, esc, payouts } = AF, $ = id => document.getElementById(id);
let token = sessionStorage.getItem("af_admin"), data = null, run = [];
if (!token) location.replace("app.html");

$("form").onsubmit = async e => {
  e.preventDefault(); $("authMsg").textContent = "Please wait…";
  const r = await call("adminLogin", { user: $("user").value.trim(), password: $("pw").value });
  if (!r.ok) return $("authMsg").textContent = r.error;
  token = r.token; sessionStorage.setItem("af_admin", token); load();
};
$("logout").onclick = e => { e.preventDefault(); sessionStorage.removeItem("af_admin"); location.href = "app.html"; };
$("filter").onchange = () => render();

async function load() {
  const r = await call("adminData", { token });
  if (!r.ok) { sessionStorage.removeItem("af_admin"); location.replace("app.html"); return; }
  data = r; $("auth").classList.add("hide"); $("dash").classList.remove("hide"); $("logout").classList.remove("hide"); render();
}
async function setStatus(id, status) {
  const r = await call("adminSet", { token, id, status }); if (r.ok) { data = r; render(); } else alert(r.error);
}
function render() {
  const { members, deposits } = data, name = e => (members.find(m => m.email === e) || {}).name || e;
  const conf = deposits.filter(d => d.status === "Confirmed"), f = $("filter").value;
  $("aMem").textContent = members.length; $("aInv").textContent = usd(conf.reduce((s, d) => s + d.amount, 0));
  $("aPend").textContent = deposits.filter(d => d.status === "Pending").length;

  $("depRows").innerHTML = deposits.filter(d => !f || d.status === f).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).map(d => `<tr>
    <td>${fmt(d.createdAt)}</td><td>${esc(name(d.email))}</td><td>${esc(d.network)}</td><td>${usd(d.amount)}</td><td title="${esc(d.txid)}">${esc(String(d.txid).slice(0, 16))}…</td>
    <td><span class="pill ${esc(d.status)}">${esc(d.status)}</span></td>
    <td class="acts">${d.status === "Pending" ? `<button class="btn sm" data-id="${esc(d.id)}" data-s="Confirmed">Confirm</button><button class="btn sm red" data-id="${esc(d.id)}" data-s="Rejected">Reject</button>` : ""}</td></tr>`).join("") || `<tr><td colspan=7>No deposits.</td></tr>`;
  document.querySelectorAll("[data-s]").forEach(b => b.onclick = () => setStatus(b.dataset.id, b.dataset.s));

  // Next payout run = the upcoming 1st of month; includes referral bonuses not yet implied elsewhere (shown for info).
  const n = new Date(), nextKey = `${new Date(n.getFullYear(), n.getMonth() + 1, 1).getFullYear()}-${String(new Date(n.getFullYear(), n.getMonth() + 1, 1).getMonth() + 1).padStart(2, "0")}-01`;
  run = members.map(m => {
    const mine = deposits.filter(d => d.email === m.email), p = payouts(mine, 3).find(x => x.date === nextKey);
    const bonus = members.filter(x => x.referredBy === m.code).reduce((s, x) => s + AF.refBonus({ deposits }, x.email), 0);
    return { name: m.name, email: m.email, interest: p ? p.amount : 0, bonus };
  }).filter(r => r.interest || r.bonus);
  const total = run.reduce((s, r) => s + r.interest + r.bonus, 0);
  $("aNext").textContent = usd(total); $("aNextD").textContent = "Next payout run · " + nextKey;
  $("payRows").innerHTML = run.map(r => `<tr><td>${esc(r.name)}</td><td>${esc(r.email)}</td><td>${usd(r.interest)}</td><td>${usd(r.bonus)}</td><td><b>${usd(r.interest + r.bonus)}</b></td></tr>`).join("") || `<tr><td colspan=5>Nothing scheduled.</td></tr>`;

  $("memRows").innerHTML = members.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.email)}</td><td>${esc(m.phone || "-")}</td><td>${esc(m.country || "-")}</td><td>${esc(m.nationality || "-")}</td><td title="${esc(m.wallet || "")}">${esc(m.wallet ? m.walletNetwork + " " + m.wallet.slice(0, 8) + "…" : "-")}</td><td>${esc(m.code)}</td><td>${esc(m.referredBy || "-")}</td>
    <td>${usd(conf.filter(d => d.email === m.email).reduce((s, d) => s + d.amount, 0))}</td><td>${m.createdAt ? fmt(m.createdAt) : "-"}</td></tr>`).join("") || `<tr><td colspan=10>No members.</td></tr>`;
}
$("csv").onclick = () => {
  const q = v => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Name", "Email", "Interest", "Referral bonus", "Total"], ...run.map(r => [r.name, r.email, r.interest.toFixed(2), r.bonus.toFixed(2), (r.interest + r.bonus).toFixed(2)])];
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([rows.map(r => r.map(q).join(",")).join("\n")], { type: "text/csv" })); a.download = "payout-run.csv"; a.click();
};
if (token) load();
})();
