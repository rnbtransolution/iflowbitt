/* Animated network/particle background + scroll reveal + count-up */
(() => {
const cv = document.createElement("canvas"); cv.id = "bg";
document.addEventListener("DOMContentLoaded", () => {
  const shell = document.createElement("div"); shell.className = "shell";
  [...document.body.childNodes].filter(n => !(n.id === "ticker" || n.tagName === "SCRIPT")).forEach(n => shell.appendChild(n));
  document.body.prepend(shell); document.body.prepend(cv);
});
const x = cv.getContext("2d"); let W, H, pts = [], mouse = { x: -999, y: -999 };
const COL = ["56,150,255","46,230,200","76,201,240"];
function size() {
  W = cv.width = innerWidth; H = cv.height = innerHeight;
  const n = Math.min(110, Math.floor(W * H / 15000));
  pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .6, c: COL[Math.random() < .7 ? 0 : Math.random() < .6 ? 1 : 2] }));
}
function frame() {
  x.clearRect(0, 0, W, H);
  for (const p of pts) {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
    const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
    if (dm < 140) { p.x += (p.x - mouse.x) / dm * .8; p.y += (p.y - mouse.y) / dm * .8; }
    x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.3); x.fillStyle = `rgba(${p.c},.85)`; x.fill();
  }
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (d < 130) { x.strokeStyle = `rgba(${a.c},${.16 * (1 - d / 130)})`; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
  }
  requestAnimationFrame(frame);
}
addEventListener("resize", size); addEventListener("mousemove", e => { mouse.x = e.clientX; mouse.y = e.clientY; });
size(); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) frame();

document.addEventListener("DOMContentLoaded", () => {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; e.target.classList.add("in"); io.unobserve(e.target);
    if (e.target.dataset.count) {
      const t = parseFloat(e.target.dataset.count), dec = (e.target.dataset.count.split(".")[1] || "").length, pre = e.target.dataset.pre || "", suf = e.target.dataset.suf || "";
      const t0 = performance.now(); (function s(n) { const k = Math.min(1, (n - t0) / 1400); e.target.textContent = pre + (t * (1 - Math.pow(1 - k, 3))).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(s); })(t0);
    }
  }), { threshold: .15 });
  document.querySelectorAll(".reveal,[data-count]").forEach(el => io.observe(el));
});
})();
