// Paste your deployed Google Apps Script Web App URL here.
// Leave empty to run in local mode (data stored in this browser only).
window.AF_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbzqozm5-Pqv8yOkrpvvvysoRgOliyzEWeVHymFlB1I456R6XzD5PH8VK8r_iuVKhcnp/exec",
  DEMO_ADMIN: { user: "admin", password: "admin123" }, // real admin creds live in Apps Script properties
  ADDRESSES: {
    TRC20: "TXXXREPLACE_WITH_YOURTRC20AddressXXXXXXXX",
    ERC20: "0xREPLACE_WITH_YOURERC20Address000000000000",
    BEP20: "0xREPLACE_WITH_YOURBEP20Address000000000000"
  },
  // Monthly rate tier by deposit amount: 100–<500 = 1.5%, 500–1,000 = 2%, >1,000 = 2.5%
  rateFor(amount) { return amount > 1000 ? 0.025 : amount >= 500 ? 0.02 : 0.015; },
  MIN_DEPOSIT: 100,
  REFERRAL_RATE: 0.05
};
