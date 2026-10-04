/* Inline SVG icon set (stroke icons). Usage: <i data-i="gold"></i> */
(() => {
const P = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18"/><path d="M5 7.5c4 2 10 2 14 0M5 16.5c4-2 10-2 14 0"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  down: '<path d="M12 4v14m-6-6l6 6 6-6"/>',
  up: '<path d="M12 20V6m-6 6l6-6 6 6"/>',
  btc: '<circle cx="12" cy="12" r="9.5"/><path d="M9.5 7.5h3.8a2.2 2.2 0 0 1 0 4.5H9.5m0 0h4.3a2.3 2.3 0 0 1 0 4.5H9.5M9.5 7.5v9M11.2 5.8v1.7M13.6 5.8v1.7M11.2 16.5v1.7M13.6 16.5v1.7"/>',
  gold: '<path d="M2 20l1.6-5h6.8l1.6 5z"/><path d="M12 20l1.6-5h6.8l1.6 5z"/><path d="M7 14l1.6-5h6.8l1.6 5z"/>',
  oil: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  arb: '<path d="M4 8h14l-3-3"/><path d="M20 16H6l3 3"/>',
  fee: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.3 0-2.4-.5-3-1.5M12 6v2m0 8v2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.5" cy="13.5" r="1.2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4m8-4v4"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M3 13h18M12 9c-3 0-5-1-5-3s3-2 5 3c2-5 5-5 5-3s-2 3-5 3z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2.4.6 4 2.3 4 5.2"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  arrow: '<path d="M5 12h14m-5-5l5 5-5 5"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9 8h4.5a2 2 0 0 1 0 4H9m0 0h5a2 2 0 0 1 0 4H9M9 6v12"/>',
  ai: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><path d="M10 14l2-4 2 4M10.8 13h2.4"/>',
  bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>'
};
window.renderIcons = (root = document) => root.querySelectorAll("i[data-i]").forEach(el => {
  if (el.firstChild) return;
  el.classList.add("ic");
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[el.dataset.i] || ""}</svg>`;
});
window.icon = n => `<i class="ic" data-i="${n}"></i>`;
document.addEventListener("DOMContentLoaded", () => renderIcons());
})();
