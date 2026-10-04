/* Dark/Light theme switch — loaded in <head> so the saved theme applies before first paint */
(() => {
const root = document.documentElement, KEY = "af_theme";
const get = () => localStorage.getItem(KEY) || root.dataset.theme || "dark";
const apply = t => { root.dataset.theme = t; };
apply(get());
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
document.addEventListener("DOMContentLoaded", () => {
  const b = document.createElement("button");
  b.id = "themeToggle"; b.type = "button";
  const paint = () => { const light = get() === "light"; b.innerHTML = light ? MOON : SUN; b.title = b.ariaLabel = light ? "Switch to dark mode" : "Switch to light mode"; };
  b.onclick = () => { const t = get() === "dark" ? "light" : "dark"; localStorage.setItem(KEY, t); apply(t); paint(); document.dispatchEvent(new Event("themechange")); };
  paint(); document.body.appendChild(b);
});
window.afTheme = get;
})();
