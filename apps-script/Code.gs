/**
 * iFlowBitt backend — Google Apps Script bound to a Google Sheet.
 * Sheets (Members, Deposits) are created automatically on first call.
 * Admin confirms a deposit by setting Status = "Confirmed" in the Deposits sheet.
 */
const MIN_DEPOSIT = 100;
const REFERRAL_RATE = 0.05;
const HEADERS = {
  Members: ['Name', 'Email', 'PasswordHash', 'Salt', 'Code', 'ReferredBy', 'Token', 'CreatedAt',
    'Phone', 'DateOfBirth', 'Nationality', 'Country', 'Address', 'City', 'Postal', 'IdType', 'IdNumber', 'Wallet', 'WalletNetwork', 'Occupation', 'AcceptedTerms'],
  Deposits: ['Id', 'Email', 'Amount', 'Network', 'TxId', 'Status', 'CreatedAt', 'ConfirmedAt']
};

function sheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(HEADERS[name]); sh.setFrozenRows(1); }
  // add any new columns to sheets created by an older version
  const have = sh.getLastColumn(), want = HEADERS[name];
  if (have < want.length) sh.getRange(1, have + 1, 1, want.length - have).setValues([want.slice(have)]);
  return sh;
}
function rows_(name) {
  const v = sheet_(name).getDataRange().getValues(), h = v.shift();
  return v.map((r, i) => { const o = { _row: i + 2 }; h.forEach((k, j) => o[k] = r[j]); return o; });
}
function hash_(pw, salt) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + pw));
}
function rand_() { return Utilities.getUuid().replace(/-/g, ''); }
function iso_(v) { return v instanceof Date ? v.toISOString() : String(v || ''); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function isAdmin_(t) { return !!t && CacheService.getScriptCache().get('admin_' + t) === '1'; }
function adminData_() {
  return {
    ok: true,
    members: rows_('Members').map(m => ({ name: m.Name, email: m.Email, code: m.Code, referredBy: m.ReferredBy, createdAt: iso_(m.CreatedAt),
      phone: m.Phone, country: m.Country, nationality: m.Nationality, wallet: m.Wallet, walletNetwork: m.WalletNetwork })),
    deposits: rows_('Deposits').map(d => ({ id: d.Id, email: d.Email, amount: Number(d.Amount), network: d.Network, txid: d.TxId, status: d.Status, createdAt: iso_(d.CreatedAt), confirmedAt: iso_(d.ConfirmedAt) }))
  };
}

function profile_(m) {
  const all = rows_('Deposits');
  const deposits = all.filter(d => d.Email === m.Email).map(d => ({
    id: d.Id, amount: Number(d.Amount), network: d.Network, txid: d.TxId, status: d.Status,
    createdAt: iso_(d.CreatedAt), confirmedAt: iso_(d.ConfirmedAt)
  }));
  const referrals = rows_('Members').filter(x => x.ReferredBy === m.Code).map(x => ({
    name: x.Name,
    bonus: all.filter(d => d.Email === x.Email && d.Status === 'Confirmed' && Number(d.Amount) >= MIN_DEPOSIT).reduce((s, d) => s + Number(d.Amount) * REFERRAL_RATE, 0)
  }));
  return { ok: true, member: { name: m.Name, email: m.Email, code: m.Code, token: m.Token }, deposits: deposits, referrals: referrals };
}

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    const members = rows_('Members');
    const byToken = () => members.find(m => b.token && m.Token === b.token);
    switch (b.action) {
      case 'register': {
        const email = String(b.email || '').toLowerCase().trim();
        if (!email || !b.password || b.password.length < 6 || !b.name) return out_({ ok: false, error: 'Invalid input' });
        if (members.some(m => m.Email === email)) return out_({ ok: false, error: 'Email already registered' });
        const need = ['dob', 'nationality', 'phone', 'country', 'address', 'city', 'idNumber', 'wallet'];
        if (need.some(k => !String(b[k] || '').trim())) return out_({ ok: false, error: 'Please complete all required fields' });
        if ((Date.now() - new Date(b.dob).getTime()) / 31557600000 < 18) return out_({ ok: false, error: 'You must be 18 or older' });
        let ref = '';
        if (b.ref) {
          ref = String(b.ref).toUpperCase();
          if (!members.some(m => m.Code === ref)) return out_({ ok: false, error: 'Invalid referral code' });
        }
        const salt = rand_(), code = rand_().slice(0, 8).toUpperCase(), token = rand_() + rand_();
        sheet_('Members').appendRow([b.name, email, hash_(b.password, salt), salt, code, ref, token, new Date().toISOString(),
          b.phone, b.dob, b.nationality, b.country, b.address, b.city, b.postal || '', b.idType || '', b.idNumber, b.wallet, b.walletNetwork || '', b.occupation || '', 'Yes']);
        return out_(profile_(rows_('Members').find(m => m.Email === email)));
      }
      case 'login': {
        const m = members.find(x => x.Email === String(b.email).toLowerCase().trim());
        if (!m || m.PasswordHash !== hash_(b.password, m.Salt)) return out_({ ok: false, error: 'Invalid email or password' });
        const token = rand_() + rand_();
        sheet_('Members').getRange(m._row, 7).setValue(token); m.Token = token;
        return out_(profile_(m));
      }
      case 'profile': {
        const m = byToken(); return out_(m ? profile_(m) : { ok: false, error: 'Session expired' });
      }
      case 'deposit': {
        const m = byToken(); if (!m) return out_({ ok: false, error: 'Session expired' });
        const amount = Number(b.amount);
        if (!(amount >= MIN_DEPOSIT)) return out_({ ok: false, error: 'Minimum deposit is $' + MIN_DEPOSIT });
        if (!b.txid || rows_('Deposits').some(d => d.TxId === b.txid)) return out_({ ok: false, error: 'Missing or duplicate TXID' });
        sheet_('Deposits').appendRow([rand_().slice(0, 8).toUpperCase(), m.Email, amount, String(b.network), String(b.txid), 'Pending', new Date().toISOString(), '']);
        return out_(profile_(m));
      }
      case 'adminLogin': {
        const props = PropertiesService.getScriptProperties();
        const u = props.getProperty('ADMIN_USER'), p = props.getProperty('ADMIN_PASS');
        if (!u || !p) return out_({ ok: false, error: 'Admin not configured in Script Properties' });
        if (b.user !== u || b.password !== p) return out_({ ok: false, error: 'Invalid admin credentials' });
        const t = rand_() + rand_(); CacheService.getScriptCache().put('admin_' + t, '1', 21600);
        return out_({ ok: true, token: t });
      }
      case 'adminData': {
        if (!isAdmin_(b.token)) return out_({ ok: false, error: 'Unauthorized' });
        return out_(adminData_());
      }
      case 'adminSet': {
        if (!isAdmin_(b.token)) return out_({ ok: false, error: 'Unauthorized' });
        if (['Confirmed', 'Rejected', 'Pending'].indexOf(b.status) < 0) return out_({ ok: false, error: 'Bad status' });
        const d = rows_('Deposits').find(x => x.Id === b.id);
        if (!d) return out_({ ok: false, error: 'Not found' });
        const sh = sheet_('Deposits');
        sh.getRange(d._row, 6).setValue(b.status);
        sh.getRange(d._row, 8).setValue(b.status === 'Confirmed' ? new Date().toISOString() : '');
        return out_(adminData_());
      }
      default: return out_({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    return out_({ ok: false, error: 'Server error' });
  } finally { lock.releaseLock(); }
}

// Optional installable "On edit" trigger: stamps ConfirmedAt when Status becomes Confirmed.
function onEditStamp(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== 'Deposits' || e.range.getColumn() !== 6) return;
  if (e.value === 'Confirmed' && !sh.getRange(e.range.getRow(), 8).getValue())
    sh.getRange(e.range.getRow(), 8).setValue(new Date().toISOString());
}
