export const PI_DIGITS = 1000000;
export const HORIZON = Object.freeze({mainnet:'https://api.mainnet.minepi.com',testnet:'https://api.testnet.minepi.com'});
export const T9 = Object.freeze({a:'2',b:'2',c:'2',d:'3',e:'3',f:'3',g:'4',h:'4',i:'4',j:'5',k:'5',l:'5',m:'6',n:'6',o:'6',p:'7',q:'7',r:'7',s:'7',t:'8',u:'8',v:'8',w:'9',x:'9',y:'9',z:'9'});

export function toT9(word) {
  const text = word.trim().toLowerCase();
  if (!/^[a-z]+$/.test(text)) throw new Error('Use English letters A–Z for word search.');
  return [...text].map(char => T9[char]).join('');
}

export function searchPi(digits, mode, raw) {
  const value = raw.trim();
  if (mode === 'position') {
    if (!/^[1-9]\d*$/.test(value)) throw new Error('Enter a position starting at 1.');
    const position = Number(value);
    if (!Number.isSafeInteger(position) || position > digits.length) throw new Error(`Choose a position from 1 to ${digits.length.toLocaleString()}.`);
    return {query:value, positions:[position], total:1, position};
  }
  const query = mode === 'word' ? toT9(value) : value;
  if (!/^[0-9]{1,20}$/.test(query)) throw new Error('Enter 1–20 digits (0–9).');
  const positions = [];
  let from = 0;
  let total = 0;
  while (from <= digits.length - query.length) {
    const found = digits.indexOf(query, from);
    if (found < 0) break;
    if (positions.length < 100) positions.push(found + 1);
    total += 1;
    from = found + 1;
  }
  return {query, positions, total, position:positions[0] || null};
}

export function classifyChainQuery(raw) {
  const value = raw.trim();
  if (/^[sS][A-Z2-7]{55}$/i.test(value)) throw new Error('That looks like a secret key. Never enter a wallet secret into an explorer.');
  if (/^G[A-Z2-7]{55}$/i.test(value)) return {type:'account',value:value.toUpperCase()};
  if (/^[a-f0-9]{64}$/i.test(value)) return {type:'transaction',value:value.toLowerCase()};
  if (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))) return {type:'ledger',value};
  throw new Error('Enter a public account address, 64 character transaction hash, or ledger number.');
}

export function shortHash(value, front=9, back=8) {
  if (!value || value.length <= front + back + 1) return value || '—';
  return `${value.slice(0,front)}…${value.slice(-back)}`;
}

export function piWindow(digits, position, queryLength=1, radius=42) {
  const start = Math.max(0, position - 1 - radius);
  const end = Math.min(digits.length, position - 1 + Math.max(queryLength,1) + radius);
  return {before:digits.slice(start,position-1), match:digits.slice(position-1,position-1+queryLength), after:digits.slice(position-1+queryLength,end), start:start+1};
}
