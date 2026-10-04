# iFlowBitt — USDT Yield Platform

Static site + Google Apps Script/Sheet backend.

## Run locally
```
cd "Crypto Investment" && python3 -m http.server 8000
```
Open http://localhost:8000. With `API_URL` empty, data is kept in browser localStorage. Use **Simulate confirm** to mimic admin approval.

## Connect Google Sheet
1. Create a Google Sheet → Extensions → Apps Script → paste `apps-script/Code.gs`.
2. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone** → copy the URL.
3. Paste it into `assets/config.js` as `API_URL`.
4. Project Settings → Script Properties → add `ADMIN_USER` and `ADMIN_PASS` (your admin login).
5. Admin logs in at `admin.html` to confirm/reject deposits, view members, and export the next payout run as CSV.
   (Editing `Status` directly in the Sheet also works; add the `onEditStamp` "On edit" trigger to stamp `ConfirmedAt`.)

## Admin (local mode)
`admin.html` — username `admin`, password `admin123` (set in `assets/config.js`, local mode only).

## Market data
TradingView widgets (ticker tape footer, mini charts, advanced chart, market overview) load from TradingView's CDN and need internet access. Edit symbols in `assets/tv.js` and the `data-tv` attributes in the HTML.

## Business rules
- Monthly interest by deposit tier: $100–<$500 = 1.5%, $500–$1,000 = 2%, >$1,000 = 2.5% (`rateFor` in `assets/config.js`). Minimum $100, paid on the 1st of the following month.
- First payout is pro-rated: `(days in month − deposit day + 1) / days in month`.
- Referral bonus: 5% of each confirmed deposit (≥ $100) made by a referred friend (`REFERRAL_RATE` in `assets/config.js`).
- Before going live: replace deposit addresses in `assets/config.js`; real use requires on-chain verification, KYC and legal/licensing review.
