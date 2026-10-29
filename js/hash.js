/* Derivación de contraseña con Web Crypto y compatibilidad temporal con hashes anteriores. */
(function (T) {
'use strict';
const K = [], H0 = [];
(() => { const mw = 4294967296, comp = {}; let n = 0; for (let c = 2; n < 64; c++) { if (!comp[c]) { for (let i = 0; i < 313; i += c) comp[i] = c; if (n < 8) H0[n] = (Math.pow(c, .5) * mw) | 0; K[n++] = (Math.pow(c, 1 / 3) * mw) | 0; } } })();
const ror = (x, n) => (x >>> n) | (x << (32 - n));
function sha256(bytes) {
  const l = bytes.length, nb = ((l + 9 + 63) >> 6) << 6, buf = new Uint8Array(nb); buf.set(bytes); buf[l] = 0x80;
  const dv = new DataView(buf.buffer); dv.setUint32(nb - 8, Math.floor(l * 8 / 4294967296)); dv.setUint32(nb - 4, (l * 8) >>> 0);
  const hs = H0.slice(), w = new Array(64);
  for (let o = 0; o < nb; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4) | 0;
    for (let i = 16; i < 64; i++) { const a = w[i - 15], b = w[i - 2]; w[i] = (w[i - 16] + (ror(a, 7) ^ ror(a, 18) ^ (a >>> 3)) + w[i - 7] + (ror(b, 17) ^ ror(b, 19) ^ (b >>> 10))) | 0; }
    let a = hs[0], b = hs[1], c = hs[2], d = hs[3], e = hs[4], f = hs[5], g = hs[6], hh = hs[7];
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    hs[0] = (hs[0] + a) | 0; hs[1] = (hs[1] + b) | 0; hs[2] = (hs[2] + c) | 0; hs[3] = (hs[3] + d) | 0; hs[4] = (hs[4] + e) | 0; hs[5] = (hs[5] + f) | 0; hs[6] = (hs[6] + g) | 0; hs[7] = (hs[7] + hh) | 0;
  }
  const out = new Uint8Array(32), ov = new DataView(out.buffer); for (let i = 0; i < 8; i++) ov.setUint32(i * 4, hs[i]); return out;
}
const utf8 = s => new TextEncoder().encode(s);
const hex = u => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
const unhex = s => new Uint8Array(s.match(/../g).map(x => parseInt(x, 16)));
const IT = 310000;
function randomSalt() {
  if (!window.isSecureContext || !window.crypto || !window.crypto.subtle || !window.crypto.getRandomValues)
    throw new Error('Para crear la contraseña, abre el sitio mediante HTTPS o localhost.');
  return window.crypto.getRandomValues(new Uint8Array(16));
}
function legacyHashPw(pw, salt, iterations = 30000) {
  const p = utf8(pw); let x = new Uint8Array(salt.length + p.length); x.set(salt); x.set(p, salt.length); x = sha256(x);
  const t = new Uint8Array(32 + salt.length); for (let i = 0; i < iterations; i++) { t.set(x); t.set(salt, 32); x = sha256(t); } return hex(x);
}
async function hashPw(pw, salt) {
  if (!window.isSecureContext || !window.crypto || !window.crypto.subtle)
    throw new Error('Para crear la contraseña, abre el sitio mediante HTTPS o localhost.');
  const key = await window.crypto.subtle.importKey('raw', utf8(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await window.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: IT, hash: 'SHA-256' }, key, 256);
  return hex(new Uint8Array(bits));
}
const nextTick = () => new Promise(r => setTimeout(r, 30));
const sameStr = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
Object.assign(T, { sha256, utf8, hex, unhex, IT, hashPw, legacyHashPw, randomSalt, nextTick, sameStr });
})(window.TCG);
