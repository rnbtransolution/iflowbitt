/* TradingView widget helpers */
(() => {
const BASE = "https://s3.tradingview.com/external-embedding/embed-widget-";
function mount(el, name, cfg) {
  const box = document.createElement("div"); box.className = "tradingview-widget-container";
  const inner = document.createElement("div"); inner.className = "tradingview-widget-container__widget"; box.appendChild(inner);
  const s = document.createElement("script"); s.src = BASE + name + ".js"; s.async = true; s.text = JSON.stringify(cfg);
  box.appendChild(s); el.appendChild(box);
}
const dark = () => (window.afTheme ? afTheme() : "dark") !== "light";
const common = () => ({ colorTheme: dark() ? "dark" : "light", isTransparent: true, locale: "en" });
window.TV = {
  ticker(el) {
    mount(el, "ticker-tape", { ...common(), displayMode: "adaptive", symbols: [
      { proName: "OANDA:XAUUSD", title: "Gold" },
      { proName: "TVC:USOIL", title: "WTI Oil" }, { proName: "TVC:UKOIL", title: "Brent Oil" },
      { proName: "BINANCE:BTCUSDT", title: "BTC/USDT" }, { proName: "BINANCE:ETHUSDT", title: "ETH/USDT" }, { proName: "BINANCE:BNBUSDT", title: "BNB/USDT" },
      { proName: "KRAKEN:USDTUSD", title: "USDT / USD" }, { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
      { proName: "OANDA:XAGUSD", title: "Silver" }, { proName: "FX_IDC:EURUSD", title: "EUR/USD" }] });
  },
  mini(el, symbol) {
    mount(el, "mini-symbol-overview", { ...common(), symbol, width: "100%", height: "100%", dateRange: "1M", chartOnly: false, noTimeScale: false });
  },
  overview(el) {
    mount(el, "market-overview", { ...common(), width: "100%", height: "100%", showFloatingTooltip: true, tabs: [
      { title: "Indices", symbols: [{ s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" }, { s: "FOREXCOM:DJI", d: "Dow 30" }] },
      { title: "Commodities", symbols: [{ s: "OANDA:XAUUSD", d: "Gold" }, { s: "OANDA:XAGUSD", d: "Silver" }, { s: "TVC:USOIL", d: "WTI Crude" }, { s: "TVC:UKOIL", d: "Brent Crude" }] },
      { title: "Crypto", symbols: [{ s: "KRAKEN:USDTUSD", d: "USDT/USD" }, { s: "BINANCE:BTCUSDT", d: "BTC/USDT" }, { s: "BINANCE:ETHUSDT", d: "ETH/USDT" }, { s: "BINANCE:BNBUSDT", d: "BNB/USDT" }] }] });
  },
  chart(el, symbol) {
    mount(el, "advanced-chart", { autosize: true, symbol, interval: "60", theme: dark() ? "dark" : "light", style: "1", timezone: "Etc/UTC", hide_side_toolbar: true, allow_symbol_change: true, backgroundColor: dark() ? "rgba(7,11,22,1)" : "rgba(255,255,255,1)", gridColor: "rgba(56,150,255,.08)", support_host: "https://www.tradingview.com" });
  }
};
const renderAll = () => document.querySelectorAll("[data-tv]").forEach(el => {
  el.innerHTML = ""; const [t, s] = el.dataset.tv.split("|"); TV[t](el, s);
});
document.addEventListener("DOMContentLoaded", renderAll);
document.addEventListener("themechange", renderAll);
})();
