'use strict';
/* ============ data ============ */
const C = window.__C, STROKES = window.__S, PICS = window.__P;
const ENV = window.__ENV || 'claude'; // 'claude' | 'pwa' | 'file'
const ITEMS = new Map(C.items.map(i => [i.id, i]));
const BYCHAR = new Map(C.items.map(i => [i.c, i]));
const WORDS = new Map(C.words.map(w => [w.id, w]));
const LESSONS = new Map(C.lessons.map(l => [l.id, l]));
const CONF = C.confusable.map(s => [...s]);
const DAY = 86400000;
const { fsrs, createEmptyCard, generatorParameters, Rating, State } = window.FSRSLib;
const F = fsrs(generatorParameters({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true, enable_short_term: true }));

/* ============ tiny DOM helper ============ */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat(9)) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
  return el;
}
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// **bold** and *italic* mini-markdown, escaped
function md(s) { return esc(s || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>'); }
const mdEl = (tag, s, cls) => h(tag, { class: cls, html: md(s) });
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const todayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ============ icons ============ */
const I = {
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
  slow: '<path d="M3 17c0-4 3-7 7-7s6 2.5 6 5.5S13.5 19 11 19H5M16 15.5c1.5 0 3-1 3-3V9m0 0-2-2m2 2 2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10.5" cy="15" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  brush: '<path d="M14.5 4.5 19.5 9.5 11 18l-5-5zM6 13l-2.5 6.5L10 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  pencil: '<path d="M4 20l1-5L15.5 4.5a2.1 2.1 0 0 1 3 3L8 18zM13.5 6.5l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  x: '<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  next: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  today: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  learn: '<path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6v13.5" stroke="currentColor" stroke-width="2"/>',
  chart: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" fill="currentColor"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" fill="currentColor"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  words: '<path d="M5 6h14M5 12h10M5 18h7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  more: '<circle cx="6" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18" cy="12" r="1.8" fill="currentColor"/>',
  replay: '<path d="M5 12a7 7 0 1 0 2.2-5.1M5 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  ear: '<path d="M8 10a5 5 0 0 1 10 0c0 3-3 3.5-3 6.5a2.5 2.5 0 0 1-5 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M11 10a2 2 0 0 1 4 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  swap: '<path d="M7 7h11l-3-3M17 17H6l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};
const icon = (n, cls) => h('span', { class: 'ic ' + (cls || ''), 'aria-hidden': 'true', html: `<svg viewBox="0 0 24 24">${I[n]}</svg>`, style: { display: 'inline-grid', placeItems: 'center' } });

/* ============ state ============ */
const LS_KEY = 'lingoa-iapam-v1';
const DEFAULT_SETTINGS = { newPerDay: 10, voice: 'alt', autoplay: true, answer: 'type' };
function freshState() { return { v: 1, cards: {}, intro: {}, lessons: {}, days: {}, notes: {}, settings: { ...DEFAULT_SETTINGS }, settingsAt: 0, flags: {}, updatedAt: 0 }; }
let S = freshState();
try { const raw = localStorage.getItem(LS_KEY); if (raw) S = Object.assign(freshState(), JSON.parse(raw)); } catch (e) { }
S.settings = Object.assign({ ...DEFAULT_SETTINGS }, S.settings || {});

function afterReset(x, t) { // keep only what happened after a reset at time t
  const y = JSON.parse(JSON.stringify(x));
  y.cards = Object.fromEntries(Object.entries(y.cards || {}).filter(([k, c]) => (c.lr || 0) >= t));
  for (const key of ['intro', 'lessons', 'flags']) y[key] = Object.fromEntries(Object.entries(y[key] || {}).filter(([k, v]) => v >= t));
  y.notes = Object.fromEntries(Object.entries(y.notes || {}).filter(([k, v]) => (v.t || 0) >= t));
  y.days = {};
  return y;
}
function mergeState(a, b) { // union by recency, card-wise
  const ra = a.resetAt || 0, rb = b.resetAt || 0;
  if (rb > ra) a = afterReset(a, rb); else if (ra > rb) b = afterReset(b, ra);
  const out = freshState(); out.resetAt = Math.max(ra, rb);
  out.cards = { ...a.cards };
  for (const [k, c] of Object.entries(b.cards || {})) { const o = out.cards[k]; if (!o || (c.lr || 0) > (o.lr || 0) || ((c.lr || 0) === (o.lr || 0) && (c.r || 0) > (o.r || 0))) out.cards[k] = c; }
  for (const key of ['intro', 'lessons', 'flags']) { out[key] = { ...(a[key] || {}) }; for (const [k, v] of Object.entries(b[key] || {})) if (!(k in out[key]) || v < out[key][k]) out[key][k] = v; }
  out.days = { ...(a.days || {}) };
  for (const [k, d] of Object.entries(b.days || {})) { const o = out.days[k] || {}; out.days[k] = { n: Math.max(o.n || 0, d.n || 0), r: Math.max(o.r || 0, d.r || 0), c: Math.max(o.c || 0, d.c || 0), ms: Math.max(o.ms || 0, d.ms || 0) }; }
  out.notes = { ...(a.notes || {}) }; for (const [k, v] of Object.entries(b.notes || {})) if (!out.notes[k] || (v.t || 0) > (out.notes[k].t || 0)) out.notes[k] = v;
  const sNewer = (b.settingsAt || 0) > (a.settingsAt || 0);
  out.settings = Object.assign({ ...DEFAULT_SETTINGS }, sNewer ? b.settings : a.settings); out.settingsAt = Math.max(a.settingsAt || 0, b.settingsAt || 0);
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  return out;
}

const Sync = { db: null, ref: null, uid: null, status: 'local', timer: null, writing: false, again: false, tab: Math.random().toString(36).slice(2), listeners: [] };
function setSync(st) { Sync.status = st; Sync.listeners.forEach(f => f(st)); }
function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { } }
function save() { S.updatedAt = Date.now(); saveLocal(); scheduleRemote(); }
function scheduleRemote(delay = 2500) { if (!Sync.ref) return; clearTimeout(Sync.timer); Sync.timer = setTimeout(pushRemote, delay); }
async function pushRemote() {
  if (!Sync.ref) return;
  if (Sync.writing) { Sync.again = true; return; }
  Sync.writing = true;
  try { await Sync.ref.set({ state: JSON.stringify(S), updatedAt: S.updatedAt, writer: Sync.tab }); setSync('synced'); }
  catch (e) { if (e && e.code === 'unavailable') { setTimeout(pushRemote, 1500 + Math.random() * 1500); } else { console.warn('sync write failed', e); setSync('local'); } }
  finally { Sync.writing = false; if (Sync.again) { Sync.again = false; scheduleRemote(400); } }
}
function adoptRemote(body) {
  if (!body || !body.state) return false;
  let remote; try { remote = JSON.parse(body.state); } catch (e) { return false; }
  const before = JSON.stringify([S.cards, S.intro, S.lessons, S.settings, S.notes]);
  S = mergeState(S, remote); saveLocal();
  return JSON.stringify([S.cards, S.intro, S.lessons, S.settings, S.notes]) !== before;
}
async function initSync(onChange) {
  try {
    if (!window.claude || !window.claude.use) return;
    const [user, db] = await Promise.all([window.claude.use('user'), window.claude.use('db')]);
    if (!user || !db) return;
    const uid = await user.id(); if (!uid) return;
    Sync.db = db; Sync.uid = uid; Sync.ref = db.doc('data/users/' + uid + '/progress');
    const snap = await Sync.ref.get();
    if (snap.exists) { if (adoptRemote(snap.data())) onChange(); }
    setSync('synced');
    if (!snap.exists || (snap.data().updatedAt || 0) < S.updatedAt) scheduleRemote(300);
    Sync.ref.onSnapshot(s => {
      if (!s.exists || s.metadata.hasPendingWrites) return;
      const d = s.data(); if (d.writer === Sync.tab) return;
      if (adoptRemote(d)) { onChange(true); }
    }, e => console.warn('sync listener', e));
  } catch (e) { console.warn('sync unavailable', e); }
}

/* ============ backup codes ============ */
// LDI2.<base64url gzip JSON>; LDI1.<base64url JSON>; legacy: plain base64 JSON (first version)
const B64U = {
  enc(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; const bin = atob(str); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; },
};
async function makeBackup() {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  if (window.CompressionStream) {
    try { const st = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')); return 'LDI2.' + B64U.enc(new Uint8Array(await new Response(st).arrayBuffer())); } catch (e) { }
  }
  return 'LDI1.' + B64U.enc(bytes);
}
async function readBackup(code) {
  code = String(code || '').replace(/\s+/g, '');
  let json;
  if (code.startsWith('LDI2.')) { if (!window.DecompressionStream) throw new Error('old browser'); const st = new Blob([B64U.dec(code.slice(5))]).stream().pipeThrough(new DecompressionStream('gzip')); json = await new Response(st).text(); }
  else if (code.startsWith('LDI1.')) json = new TextDecoder().decode(B64U.dec(code.slice(5)));
  else json = decodeURIComponent(escape(atob(code)));
  const o = JSON.parse(json); if (!o || typeof o.cards !== 'object') throw new Error('not a backup');
  return o;
}

/* ============ cards / FSRS ============ */
const ser = c => ({ d: +c.due, s: +c.stability.toFixed(4), df: +c.difficulty.toFixed(4), st: c.state, r: c.reps, l: c.lapses, ls: c.learning_steps || 0, sd: c.scheduled_days, ed: c.elapsed_days, lr: c.last_review ? +c.last_review : 0 });
const deser = o => ({ due: new Date(o.d), stability: o.s, difficulty: o.df, state: o.st, reps: o.r, lapses: o.l, learning_steps: o.ls || 0, scheduled_days: o.sd || 0, elapsed_days: o.ed || 0, last_review: o.lr ? new Date(o.lr) : undefined });
function rate(cid, rating, ms) {
  const now = new Date();
  const card = S.cards[cid] ? deser(S.cards[cid]) : createEmptyCard(now);
  const res = F.next(card, now, rating);
  S.cards[cid] = ser(res.card);
  const dk = todayKey(); const d = S.days[dk] || (S.days[dk] = { n: 0, r: 0, c: 0, ms: 0 });
  d.r++; if (rating >= Rating.Hard) d.c++; d.ms += Math.min(ms || 0, 30000);
  save();
}
function introduce(id) { if (!S.intro[id]) { S.intro[id] = Date.now(); const dk = todayKey(); const d = S.days[dk] || (S.days[dk] = { n: 0, r: 0, c: 0, ms: 0 }); d.n++; } for (const k of [id + '|r', id + '|l']) if (!S.cards[k]) S.cards[k] = ser(createEmptyCard(new Date())); }
const isIntro = id => !!S.intro[id];
function cardIds(id) { return [id + '|r', id + '|l']; }
function strength(id) { // 0 none, 1 learning, 2 young, 3 solid, 4 mastered
  if (!isIntro(id)) return 0;
  const cs = cardIds(id).map(k => S.cards[k]).filter(Boolean);
  if (!cs.length) return 1;
  const s = Math.min(...cs.map(c => c.st === 2 ? c.s : Math.min(c.s, 0.9)));
  return s >= 21 ? 4 : s >= 7 ? 3 : s >= 1 ? 2 : 1;
}
function dueList(now = Date.now()) {
  return Object.entries(S.cards).filter(([k, c]) => c.d <= now && (ITEMS.has(k.split('|')[0]) || WORDS.has(k.split('|')[0])));
}
function newToday() { return (S.days[todayKey()] || {}).n || 0; }
function mature(id) { const c = S.cards[id + '|r']; return c && c.st === 2 && c.s >= 21; }

/* ============ romaji ============ */
const UNIT = new Map(); for (const it of C.items) UNIT.set(it.c, it.alt && it.alt.length ? it.alt : [it.r]);
const UNITS_BY_LEN = [...UNIT.keys()].sort((a, b) => b.length - a.length);
function tokens(w) { const out = []; let i = 0; while (i < w.length) { const ch = w[i]; if (ch === ' ' || ch === '　') { i++; continue; } if ('っッー'.includes(ch)) { out.push(ch); i++; continue; } const u = UNITS_BY_LEN.find(u => w.startsWith(u, i)); if (u) { out.push(u); i += u.length; } else { out.push(ch); i++; } } return out; }
function romajiSet(w, cap = 3000) {
  const t = tokens(w); let acc = [''];
  for (let i = 0; i < t.length; i++) {
    const tk = t[i]; let opts;
    if (tk === 'っ' || tk === 'ッ') { const nx = UNIT.get(t[i + 1]) || ['']; const set = new Set(); nx.forEach(r => { const c0 = r[0]; if (r.startsWith('ch')) { set.add('t'); set.add('c'); } else if (c0 && !'aiueo'.includes(c0)) set.add(c0); }); opts = [...set]; if (!opts.length) opts = ['']; }
    else if (tk === 'ー') { opts = null; }
    else if (tk === 'ん' || tk === 'ン') { const nx = (UNIT.get(t[i + 1]) || [''])[0]; opts = ['n', 'nn']; if ('bmp'.includes(nx[0] || '')) opts.push('m'); if ('aiueoy'.includes(nx[0] || '')) opts.push("n'"); }
    else opts = UNIT.get(tk) || [tk];
    if (opts === null) { acc = acc.map(s => s + (s.match(/[aiueo](?!.*[aiueo])/) || [''])[0]); continue; }
    const next = []; for (const a of acc) for (const o of opts) { next.push(a + o); if (next.length > cap) break; } acc = next;
  }
  return acc;
}
function normRomaji(s) {
  return s.toLowerCase().normalize('NFC').replace(/[āâ]/g, 'aa').replace(/[īî]/g, 'ii').replace(/[ūû]/g, 'uu').replace(/[ēê]/g, 'ee').replace(/[ōô]/g, 'oo')
    .replace(/[\s'’\-.,!?。、]/g, '').replace(/ou/g, 'oo').replace(/ei/g, 'ee');
}
const collapse = s => s.replace(/([aiueo])\1+/g, '$1').replace(/([^aiueon])\1/g, '$1');
function checkRomaji(input, kana) { // -> 'ok' | 'long' | 'no'
  const x = normRomaji(input); if (!x) return 'no';
  const set = romajiSet(kana).map(normRomaji);
  if (set.includes(x)) return 'ok';
  const cx = collapse(x); if (set.some(s => collapse(s) === cx)) return 'long';
  return 'no';
}
function displayRomaji(it) { return it.r; }

/* ============ audio ============ */
const Audio_ = {
  data: { f: null, m: null }, loading: {}, ctx: null, cache: new Map(), unlocked: false, failed: false,
  load(v) {
    if (!this.data[v] && window.__A && window.__A[v]) { this.data[v] = window.__A[v]; this.loading[v] = Promise.resolve(this.data[v]); }
    if (this.data[v] || this.loading[v]) return this.loading[v];
    this.loading[v] = fetch('audio/' + v + '.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => { this.data[v] = j; return j; }).catch(e => { console.warn('audio load', v, e); this.failed = true; this.loading[v] = null; });
    return this.loading[v];
  },
  unlock() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const b = this.ctx.createBuffer(1, 1, 22050); const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0);
      if (this.ctx.state === 'running') this.unlocked = true;
    } catch (e) { }
  },
  voiceFor(pref) { const v = pref || S.settings.voice; return v === 'alt' ? (Math.random() < .5 ? 'f' : 'm') : v; },
  async buf(v, key) {
    const ck = v + key; if (this.cache.has(ck)) return this.cache.get(ck);
    await this.load(v); const b64 = this.data[v] && this.data[v][key]; if (!b64 || !this.ctx) return null;
    const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const p = new Promise((res, rej) => this.ctx.decodeAudioData(arr.buffer, res, rej)).catch(() => null);
    this.cache.set(ck, p); return p;
  },
  async play(key, text, opts = {}) {
    const v = this.voiceFor(opts.voice); window.__lastKey = key;
    try {
      if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume();
      if (opts.slow) { await this.load(v); const b64 = this.data[v] && this.data[v][key]; if (b64) { const a = new Audio('data:audio/mpeg;base64,' + b64); a.playbackRate = 0.7; a.preservesPitch = true; a.webkitPreservesPitch = true; await a.play(); return true; } }
      const b = await this.buf(v, key);
      if (b) { const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); return true; }
      if (!this.ctx) { await this.load(v); const b64 = this.data[v] && this.data[v][key]; if (b64) { await new Audio('data:audio/mpeg;base64,' + b64).play(); return true; } }
    } catch (e) { console.warn('play', e); }
    return this.speak(text, opts.slow);
  },
  speak(text, slow) {
    try { if (!('speechSynthesis' in window) || !text) return false; const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = slow ? .6 : .85; const jv = speechSynthesis.getVoices().find(x => /ja/i.test(x.lang)); if (jv) u.voice = jv; speechSynthesis.cancel(); speechSynthesis.speak(u); return true; } catch (e) { return false; }
  },
};
const itemAudio = it => ['k:' + it.a, it.a];
const exAudio = ex => ['w:' + (ex[1] || ex[0]), ex[1] || ex[0]];
const wordAudio = w => [w.a, w.tts];
function playItem(it, opts) { const [k, t] = itemAudio(it); return Audio_.play(k, t, opts); }
function playWord(w, opts) { const [k, t] = wordAudio(w); return Audio_.play(k, t, opts); }
function playEx(ex, opts) { const [k, t] = exAudio(ex); return Audio_.play(k, t, opts); }
(() => { const evs = ['pointerup', 'touchend', 'click', 'keydown']; const fn = () => { Audio_.unlock(); if (Audio_.unlocked) evs.forEach(e => document.removeEventListener(e, fn, true)); }; evs.forEach(e => document.addEventListener(e, fn, true)); })();
