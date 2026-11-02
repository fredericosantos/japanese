/* ============ shell & navigation ============ */
const TABS = [['today', 'Today', 'today'], ['learn', 'Learn', 'learn'], ['chart', 'Chart', 'chart'], ['words', 'Words', 'words'], ['more', 'More', 'more']];
let route = 'today', sub = null;
const VALID = new Set(['today', 'learn', 'chart', 'words', 'more', 'sounds', 'lookalikes', 'practice', 'settings', 'about']);
try { const hsh = location.hash.slice(1); if (VALID.has(hsh)) { if (['sounds', 'lookalikes', 'practice', 'settings', 'about'].includes(hsh)) { route = 'more'; sub = hsh; } else route = hsh; } } catch (e) { }
try { const r = sessionStorage.getItem('lingoa-route'); if (r && !location.hash) { const [a, b] = r.split('/'); if (VALID.has(a)) { route = a; sub = b || null; } } } catch (e) { }

function go(r, s = null) { route = r; sub = s; try { sessionStorage.setItem('lingoa-route', r + (s ? '/' + s : '')); } catch (e) { } render(); window.scrollTo(0, 0); }

function shell() {
  const app = $('#app'); app.innerHTML = '';
  const syncEl = h('div', { class: 'sync', id: 'sync' }, h('i'), h('span', null, ''));
  const updSync = st => { syncEl.classList.toggle('ok', st === 'synced'); syncEl.lastChild.textContent = st === 'synced' ? 'Saved to your account' : 'Saved on this device'; };
  updSync(Sync.status); Sync.listeners = [updSync];
  const tabBtn = ([id, label, ic]) => h('button', { class: 'tab', 'data-tab': id, 'aria-current': route === id ? 'page' : null, onclick: () => go(id) }, icon(ic), h('span', null, label));
  app.append(
    h('header', { class: 'topbar' }, h('div', { class: 'topbar-in' },
      h('div', { class: 'brand' }, h('div', { class: 'brand-mark', 'aria-hidden': 'true' }, '語'), h('div', { style: { minWidth: 0 } }, h('div', { class: 'brand-name' }, 'Lingoa de Iapam'), h('div', { class: 'brand-sub' }, 'Japanese, one beat at a time'))),
      h('nav', { class: 'toptabs', 'aria-label': 'Sections' }, TABS.map(tabBtn)),
      syncEl)),
    h('main', { id: 'main' }),
    h('nav', { class: 'tabbar', 'aria-label': 'Sections' }, h('div', { class: 'tabbar-in' }, TABS.map(tabBtn))),
  );
}
function render() {
  if (!$('#main')) shell();
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-current', t.dataset.tab === route ? 'page' : 'false'));
  const m = $('#main'); m.innerHTML = '';
  const v = { today: vToday, learn: vLearn, chart: vChart, words: vWords, more: vMore }[route] || vToday;
  m.append(v());
}
function toast(msg) { const t = h('div', { class: 'toast', role: 'status' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2600); }

/* ============ recommendations ============ */
const ORDER = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8', 'h9', 'h10', 'kcheck', 'k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8', 'k9', 'k10', 'h11', 'h12', 'k11', 'k12', 'h13', 'h14', 'h15', 'k13', 'k14', 'k15', 'k16'];
function lessonLeft(l) { return l.ids.filter(id => !isIntro(id)); }
function nextLesson() {
  for (const id of ORDER) {
    if (id === 'kcheck') { if (!S.flags.kcheck) return 'kcheck'; continue; }
    const l = LESSONS.get(id); if (lessonLeft(l).length) return id;
  }
  return null;
}
function wordsReady() { return C.words.filter(w => !isIntro(w.id) && w.need.every(isIntro)); }
function kanaLearned() { return C.items.filter(i => isIntro(i.id)).length; }
function wordsLearned() { return C.words.filter(w => isIntro(w.id)).length; }
function nextDueIn() { const ds = Object.values(S.cards).map(c => c.d).filter(d => d > Date.now()); return ds.length ? Math.min(...ds) - Date.now() : null; }
function fmtDur(ms) { const m = Math.round(ms / 60000); if (m < 60) return m + ' min'; const hr = Math.round(m / 60); if (hr < 36) return hr + ' h'; return Math.round(hr / 24) + ' days'; }

/* ============ Today ============ */
function vToday() {
  const hr = new Date().getHours();
  const greet = hr < 11 ? ['おはようございます', 'ohayō gozaimasu', 'good morning'] : hr < 18 ? ['こんにちは', 'konnichiwa', 'hello'] : ['こんばんは', 'konbanwa', 'good evening'];
  const gw = WORDS.get('w:' + greet[0]);
  const due = dueList().length;
  const nl = nextLesson();
  const ready = wordsReady();
  const goal = S.settings.newPerDay, nt = newToday();
  const first = !Object.keys(S.intro).length;
  const wrap = h('div', { class: 'stack' });
  wrap.append(h('section', { class: 'hello stack', style: { gap: '4px' } },
    h('button', { class: 'btn ghost', style: { padding: 0, justifyContent: 'flex-start', minHeight: 0, color: 'var(--ink)' }, onclick: () => gw && playWord(gw), 'aria-label': 'Hear the greeting' },
      h('h1', { class: 'jp', style: { fontFamily: 'var(--f-kana)', fontWeight: 600 } }, greet[0])),
    h('p', null, greet[1] + ' · ' + greet[2] + (gw ? ' · tap to hear' : ''))));

  if (first && !S.flags.sounds) wrap.append(h('section', { class: 'card stack' },
    h('div', { class: 'eyebrow' }, 'Start here · 5 minutes'),
    h('h2', null, 'The sounds of Japanese'),
    h('p', { class: 'muted' }, 'Five vowels, one beat per kana, and a few sounds that Portuguese already gives you. Ten minutes here makes every later lesson easier.'),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => go('more', 'sounds') }, 'Listen first'), h('button', { class: 'btn ghost', onclick: () => { S.flags.sounds = Date.now(); save(); render(); } }, 'Skip for now'))));

  const grid = h('div', { class: 'today-grid' });
  // reviews
  const nd = nextDueIn();
  grid.append(h('section', { class: 'card due-card' },
    h('div', { class: 'eyebrow', style: { color: 'inherit', opacity: .8 } }, 'Reviews'),
    h('div', { class: 'row', style: { alignItems: 'baseline', gap: '12px' } }, h('span', { class: 'big tnum' }, String(due)), h('span', null, due === 1 ? 'card is due' : 'cards are due')),
    h('p', { class: 'muted small' }, due ? 'Reviewing at the right moment is what makes memories last. Do these first.' : (nd != null ? 'All caught up. The next card comes back in ' + fmtDur(nd) + '.' : 'Learn your first lesson and reviews will appear here.')),
    h('button', { class: 'btn lg', disabled: !due, onclick: () => startReview() }, icon('replay'), due ? 'Start reviews' : 'Nothing due')));
  // next lesson
  if (nl) {
    const isCheck = nl === 'kcheck'; const l = LESSONS.get(nl);
    const left = isCheck ? [] : lessonLeft(l);
    const strip = isCheck ? 'アイウエオ…' : left.map(id => ITEMS.get(id).c).join(' ');
    grid.append(h('section', { class: 'card next-card stack' },
      h('div', { class: 'eyebrow' }, isCheck ? 'Katakana check · 3 minutes' : 'Next lesson · ' + (l.s === 'h' ? 'Hiragana' : 'Katakana')),
      h('div', { class: 'kana-strip', lang: 'ja' }, strip),
      h('p', null, isCheck ? 'You know some katakana already. Show which ones, and they go straight to reviews instead of lessons.' : l.d),
      h('div', null, h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '6px' } }, h('span', { class: 'small muted' }, 'New today'), h('span', { class: 'small tnum' }, nt + ' / ' + goal)), h('div', { class: 'meter' }, h('i', { style: { width: Math.min(100, nt / goal * 100) + '%' } }))),
      h('button', { class: 'btn primary lg', onclick: () => isCheck ? startPlacement() : startLesson(nl) }, isCheck ? 'Take the check' : 'Start lesson'),
      nt >= goal ? h('p', { class: 'small muted' }, "You've reached today's new-item goal. Reviews are the best use of extra time, but you can keep going.") : null));
  } else grid.append(h('section', { class: 'card stack' }, h('div', { class: 'eyebrow' }, 'Lessons'), h('h2', null, 'All kana lessons done!'), h('p', { class: 'muted' }, 'Keep your reviews going and learn the starter words. Kanji and more words come next.')));
  wrap.append(grid);

  if (ready.length) wrap.append(h('section', { class: 'card stack' },
    h('div', { class: 'eyebrow' }, 'Words you can now read'),
    h('div', { class: 'jp', style: { fontSize: '1.5rem', lineHeight: 1.5 }, lang: 'ja' }, ready.slice(0, 6).map(w => w.k).join('　')),
    h('p', { class: 'muted small' }, ready.length + (ready.length === 1 ? ' word is' : ' words are') + ' unlocked by the kana you know' + (ready.some(w => w.tag === 'pt') ? ', including some Japanese borrowed from Portuguese.' : '.')),
    h('button', { class: 'btn', onclick: () => startWordLesson() }, 'Learn ' + Math.min(5, ready.length) + (Math.min(5, ready.length) === 1 ? ' word' : ' words'))));

  // week
  const days = []; for (let i = 6; i >= 0; i--) { const t = Date.now() - i * DAY; const k = todayKey(t); const d = S.days[k]; days.push({ k, d, wd: new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }), today: i === 0 }); }
  const streak = (() => { let n = 0; for (let i = 0; ; i++) { const d = S.days[todayKey(Date.now() - i * DAY)]; if (d && (d.r || d.n)) n++; else if (i === 0) continue; else break; } return n; })();
  const td = S.days[todayKey()] || {};
  wrap.append(h('section', { class: 'card stack' },
    h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', { class: 'eyebrow' }, 'This week'), h('span', { class: 'small muted' }, streak ? streak + '-day streak' : 'Rest days are fine')),
    h('div', { class: 'week' }, days.map(d => h('div', { class: 'day' }, h('div', { class: 'stamp' + (d.d && (d.d.r || d.d.n) ? ' done' : '') + (d.today ? ' today' : ''), title: d.k }, '済'), h('span', null, d.wd)))),
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, kanaLearned() + ''), h('span', null, 'of ' + C.items.length + ' kana')),
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, wordsLearned() + ''), h('span', null, 'of ' + C.words.length + ' words')),
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, Math.round((td.ms || 0) / 60000) + ''), h('span', null, 'min today')))));
  return wrap;
}

/* ============ Learn ============ */
function lessonRow(l, isNext) {
  const left = lessonLeft(l).length, n = l.ids.length;
  const done = left === 0;
  return h('button', { class: 'lesson-row' + (isNext ? ' next' : ''), onclick: () => done ? openLessonSheet(l) : startLesson(l.id) },
    h('span', { class: 'lk', lang: 'ja' }, l.t),
    h('span', null, h('div', { class: 'lt' }, l.d), h('div', { class: 'ld' }, done ? 'Done · tap to look again' : (left < n ? (n - left) + ' of ' + n + ' learned' : n + ' new ' + (n === 1 ? 'character' : 'characters')))),
    done ? h('span', { class: 'seal', 'aria-label': 'Completed' }, '済') : h('span', { class: 'seal part' }, (n - left) + '/' + n));
}
function vLearn() {
  const nl = nextLesson();
  const wrap = h('div', { class: 'stack' });
  wrap.append(h('div', null, h('h1', { style: { fontSize: '1.7rem' } }, 'Lessons'), h('p', { class: 'muted' }, 'Follow the order, or jump anywhere. Each lesson takes about five minutes.')));
  wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'Start here')),
    h('div', { class: 'track' }, h('button', { class: 'lesson-row', onclick: () => go('more', 'sounds') }, h('span', { class: 'lk jp' }, 'あ・い'), h('span', null, h('div', { class: 'lt' }, 'The sounds of Japanese'), h('div', { class: 'ld' }, 'Vowels, beats, pitch and the r')), S.flags.sounds ? h('span', { class: 'seal' }, '済') : h('span', { class: 'seal part' }, 'Go'))));
  wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'Hiragana'), h('span', { class: 'small muted' }, 'the everyday script')),
    h('div', { class: 'track' }, C.lessons.filter(l => l.s === 'h').map(l => lessonRow(l, l.id === nl))));
  wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'Katakana'), h('span', { class: 'small muted' }, 'foreign words and names')),
    h('div', { class: 'track' },
      h('button', { class: 'lesson-row' + (nl === 'kcheck' ? ' next' : ''), onclick: () => startPlacement() }, h('span', { class: 'lk jp' }, 'アイウ?'), h('span', null, h('div', { class: 'lt' }, 'Katakana check'), h('div', { class: 'ld' }, S.flags.kcheck ? 'Taken · tap to retake' : 'Skip the ones you already know')), S.flags.kcheck ? h('span', { class: 'seal' }, '済') : h('span', { class: 'seal part' }, '3 min')),
      C.lessons.filter(l => l.s === 'k').map(l => lessonRow(l, l.id === nl))));
  const ready = wordsReady();
  wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'Words'), h('span', { class: 'small muted tnum' }, wordsLearned() + ' / ' + C.words.length)),
    h('div', { class: 'card flat stack' }, h('p', null, ready.length ? ready.length + (ready.length === 1 ? ' word is ready: you can read every kana in it.' : ' words are ready: you can read every kana in them.') : 'Words unlock as you learn their kana. The first ones appear after the a-row and k-row.'),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', disabled: !ready.length, onclick: () => startWordLesson() }, 'Learn words'), h('button', { class: 'btn ghost', onclick: () => go('words') }, 'See all words'))));
  return wrap;
}
function openLessonSheet(l) {
  sheet(close => h('div', { class: 'stack' }, h('h2', null, l.d), h('div', { class: 'row' }, l.ids.map(id => { const it = ITEMS.get(id); return h('button', { class: 'choice', style: { width: '74px', minHeight: '74px' }, onclick: () => { close(); openItem(it); } }, it.c); })),
    h('button', { class: 'btn', onclick: () => { close(); startLesson(l.id, true); } }, 'Go through this lesson again')));
}

/* ============ Chart ============ */
let chartScript = 'h';
const GOJUON = [['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'], ['た', 'ち', 'つ', 'て', 'と'], ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'], ['ま', 'み', 'む', 'め', 'も'], ['や', '', 'ゆ', '', 'よ'], ['ら', 'り', 'る', 'れ', 'ろ'], ['わ', '', '', '', 'を'], ['ん', '', '', '', '']];
const DAKU = [['が', 'ぎ', 'ぐ', 'げ', 'ご'], ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], ['だ', 'ぢ', 'づ', 'で', 'ど'], ['ば', 'び', 'ぶ', 'べ', 'ぼ'], ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ']];
const YOON = ['き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'び', 'ぴ'].map(b => ['ゃ', 'ゅ', 'ょ'].map(s => b + s));
const toK = s => [...s].map(c => { const o = c.charCodeAt(0); return o >= 0x3041 && o <= 0x3096 ? String.fromCharCode(o + 0x60) : c; }).join('');
function chartCell(ch) {
  if (!ch) return h('div', { class: 'cell blank', 'aria-hidden': 'true' });
  const c = chartScript === 'k' ? toK(ch) : ch; const it = BYCHAR.get(c); if (!it) return h('div', { class: 'cell blank' });
  const s = strength(it.id);
  return h('button', { class: 'cell s' + s, onclick: () => openItem(it), 'aria-label': c + ' ' + it.r + ', ' + ['not learned yet', 'learning', 'getting there', 'solid', 'mastered'][s] }, h('span', { class: 'k', lang: 'ja' }, c), h('span', { class: 'r' }, it.r));
}
function vChart() {
  const wrap = h('div', { class: 'stack' });
  const segBtn = (v, label) => h('button', { 'aria-pressed': chartScript === v ? 'true' : 'false', onclick: () => { chartScript = v; render(); } }, label);
  const items = C.items.filter(i => i.s === chartScript);
  const counts = [0, 0, 0, 0, 0]; items.forEach(i => counts[strength(i.id)]++);
  wrap.append(h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h1', { style: { fontSize: '1.7rem' } }, 'Kana chart'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Script' }, segBtn('h', 'Hiragana'), segBtn('k', 'Katakana'))));
  wrap.append(h('p', { class: 'muted' }, 'Each square darkens as its memory gets stronger. Tap any kana to study its picture, sound and strokes.'));
  wrap.append(h('div', { class: 'legend' }, [['heat-0', 'New'], ['heat-1', 'Learning'], ['heat-2', 'Getting there'], ['heat-3', 'Solid'], ['heat-4', 'Mastered']].map(([v, l], i) => h('span', null, h('i', { style: { background: 'var(--' + v + ')' } }), l + ' ', h('b', { class: 'tnum' }, String(counts[i]))))));
  wrap.append(h('div', { class: 'card flat' }, h('div', { class: 'chart' }, GOJUON.flat().map(chartCell))));
  wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'With marks'), h('span', { class: 'small muted' }, 'voiced sounds')), h('div', { class: 'card flat' }, h('div', { class: 'chart' }, DAKU.flat().map(chartCell))));
  wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'Combinations'), h('span', { class: 'small muted' }, 'one beat each')), h('div', { class: 'card flat' }, h('div', { class: 'chart c3' }, YOON.flat().map(chartCell))));
  if (chartScript === 'k') wrap.append(h('div', { class: 'section-title' }, h('h2', null, 'Foreign sounds')), h('div', { class: 'card flat' }, h('div', { class: 'chart c3' }, C.items.filter(i => i.g === 'ext').map(i => chartCell(i.c)))));
  return wrap;
}
function openItem(it) { sheet(close => h('div', { class: 'stack' }, meetCard(it, { inSheet: true }))); setTimeout(() => S.settings.autoplay && playItem(it), 150); }

/* ============ Words ============ */
let wordFilter = 'all';
function vWords() {
  const wrap = h('div', { class: 'stack' });
  const ready = wordsReady();
  wrap.append(h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h1', { style: { fontSize: '1.7rem' } }, 'Starter words'), h('button', { class: 'btn primary', disabled: !ready.length, onclick: () => startWordLesson() }, ready.length ? 'Learn ' + Math.min(5, ready.length) + (Math.min(5, ready.length) === 1 ? ' word' : ' words') : 'Learn more kana')));
  wrap.append(h('p', { class: 'muted' }, 'Words unlock once you know all their kana. Polite forms come first, because they are what you need at work and when travelling.'));
  const filt = [['all', 'All'], ['pt', 'From Portuguese'], ['phrase', 'Phrases'], ['core', 'Everyday'], ['loan', 'Loanwords']];
  wrap.append(h('div', { class: 'row', role: 'group', 'aria-label': 'Filter' }, filt.map(([v, l]) => h('button', { class: 'btn ' + (wordFilter === v ? 'primary' : 'quiet'), style: { minHeight: '36px', padding: '6px 14px', fontSize: '.85rem' }, onclick: () => { wordFilter = v; render(); } }, l))));
  const rank = w => isIntro(w.id) ? 1 : w.need.every(isIntro) ? 0 : 2;
  const ws = C.words.filter(w => wordFilter === 'all' || (wordFilter === 'core' ? !w.tag : wordFilter === 'pt' ? (w.tag === 'pt' || w.tag === 'place') : w.tag === wordFilter)).map((w, i) => [w, i]).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(x => x[0]);
  const list = h('div', { class: 'list' });
  for (const w of ws) {
    const unlocked = w.need.every(isIntro), known = isIntro(w.id);
    const missing = w.need.filter(id => !isIntro(id)).map(id => ITEMS.get(id).c);
    list.append(h('div', { class: 'word-row' + (unlocked ? '' : ' locked') },
      h('div', { style: { minWidth: 0 } },
        h('div', { class: 'w', lang: 'ja' }, w.k, w.j && w.j !== w.k ? h('small', { lang: 'ja' }, w.j) : null),
        h('div', { class: 'm' }, unlocked ? [h('b', null, w.r), ' · ' + w.en] : 'Needs ' + missing.join(' '), w.tag === 'pt' ? h('span', { class: 'chip pt', style: { marginLeft: '8px' } }, 'PT') : null),
        known && w.pt ? h('div', { class: 'm', html: md(w.pt) }) : null),
      unlocked ? h('button', { class: 'iconbtn', 'aria-label': 'Play ' + w.r, onclick: () => playWord(w) }, icon('play')) : h('span', { class: 'chip' }, 'Locked')));
  }
  wrap.append(list);
  return wrap;
}

/* ============ More ============ */
function vMore() {
  if (sub === 'sounds') return vSounds();
  if (sub === 'lookalikes') return vLookalikes();
  if (sub === 'practice') return vPractice();
  if (sub === 'settings') return vSettings();
  if (sub === 'about') return vAbout();
  const row = (s, t, d, k) => h('button', { class: 'lesson-row', onclick: () => go('more', s) }, h('span', { class: 'lk jp' }, k), h('span', null, h('div', { class: 'lt' }, t), h('div', { class: 'ld' }, d)), icon('next'));
  return h('div', { class: 'stack' }, h('h1', { style: { fontSize: '1.7rem' } }, 'More'),
    h('div', { class: 'track' },
      row('sounds', 'The sounds of Japanese', 'Vowels, beats, long vowels, pitch, the r', 'あ・い'),
      row('practice', 'Practice', 'Quick quiz on any kana. Match hiragana to katakana', 'あ→ア'),
      row('lookalikes', 'Look-alikes', 'Drills for シ/ツ, ソ/ン, ぬ/め and friends', 'シツ'),
      row('settings', 'Settings', 'Daily goal, voices, answers, backup', '設定'),
      row('about', 'How this app teaches', 'The research behind it, and credits', '学')));
}
function backBar(title) { return h('div', { class: 'row', style: { gap: '6px' } }, h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: () => go('more') }, icon('back')), h('h1', { style: { fontSize: '1.5rem' } }, title)); }
function vSounds() {
  const wrap = h('div', { class: 'stack' }, backBar('The sounds of Japanese'));
  wrap.append(h('p', { class: 'muted' }, 'Tap every example. Listen first, then say it out loud.'));
  for (const sec of C.sounds) {
    const card = h('section', { class: 'card stack' }, h('h2', { style: { fontSize: '1.2rem' } }, sec.title), mdEl('p', sec.body));
    for (const [k, r, g] of sec.items) {
      const key = 'w:' + k; const beats = sec.id === 'beats' ? r.split('-').length : 0;
      card.append(h('div', { class: 'snd-item' }, h('span', { class: 'k', lang: 'ja' }, k),
        h('div', { style: { minWidth: 0 } }, h('b', null, r), h('div', { class: 'small muted', html: md(g) }), beats ? h('div', { class: 'beats', 'aria-label': beats + ' beats' }, Array.from({ length: beats }, () => h('i'))) : null),
        h('div', { class: 'row', style: { gap: '6px', flexWrap: 'nowrap' } },
          h('button', { class: 'iconbtn', 'aria-label': 'Play ' + r, onclick: () => Audio_.play(key, k) }, icon('play')),
          h('button', { class: 'iconbtn', 'aria-label': 'Play ' + r + ' slowly', onclick: () => Audio_.play(key, k, { slow: true }) }, icon('slow')))));
    }
    wrap.append(card);
  }
  wrap.append(h('button', { class: 'btn primary lg', onclick: () => { S.flags.sounds = S.flags.sounds || Date.now(); save(); go('today'); toast('Nice. On to the first lesson!'); } }, S.flags.sounds ? 'Back to Today' : "I've listened. Start learning"));
  return wrap;
}
const PR = { mode: 'type', script: 'both', cats: new Set(['base', 'dakuten', 'yoon']), rows: new Set(), learned: false };
function vPractice() {
  const wrap = h('div', { class: 'stack' }); const draw = () => {
    wrap.innerHTML = ''; wrap.append(backBar('Practice'), h('p', { class: 'muted' }, 'Free practice. It never changes your reviews or progress, so quiz yourself as often as you like.'));
    const seg = (label, key, opts) => h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'eyebrow' }, label), h('div', { class: 'seg', role: 'group', 'aria-label': label, style: { alignSelf: 'flex-start', flexWrap: 'wrap' } },
      opts.map(([v, t]) => h('button', { 'aria-pressed': String(PR[key] === v), onclick: () => { PR[key] = v; if (key === 'mode' && v === 'pair') PR.cats.delete('ext'); draw(); } }, t))));
    const toggle = (set, v, t) => h('button', { class: 'chip toggle', 'aria-pressed': String(set.has(v)), onclick: () => { set.has(v) ? set.delete(v) : set.add(v); draw(); } }, t);
    const pair = PR.mode === 'pair';
    wrap.append(seg('Quiz', 'mode', [['type', 'Type the sound'], ['pair', 'Hiragana ↔ Katakana']]));
    if (!pair) wrap.append(seg('Script', 'script', [['h', 'Hiragana'], ['k', 'Katakana'], ['both', 'Both']]));
    wrap.append(h('div', { class: 'stack', style: { gap: '6px' } }, h('div', { class: 'eyebrow' }, 'Which kana'), h('div', { class: 'row', style: { flexWrap: 'wrap' } },
      toggle(PR.cats, 'base', 'Basic'), toggle(PR.cats, 'dakuten', 'Dakuten が ぱ'), toggle(PR.cats, 'yoon', 'Combinations きゃ'), !pair && PR.script !== 'h' ? toggle(PR.cats, 'ext', 'Foreign sounds ファ') : null)));
    if (PR.cats.has('base')) wrap.append(h('details', { class: 'own' }, h('summary', null, PR.rows.size ? PR.rows.size + ' rows picked' : 'Pick rows (all by default)'),
      h('div', { class: 'row', style: { flexWrap: 'wrap', marginTop: '8px' } }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => toggle(PR.rows, n, C.items.find(i => i.s === 'h' && i.g === 'base' && +i.L.slice(1) === n).c + ' row')))));
    wrap.append(h('label', { class: 'row', style: { gap: '10px' } }, h('input', { type: 'checkbox', checked: PR.learned, onchange: e => { PR.learned = e.target.checked; draw(); } }), h('span', null, 'Only kana I have learned in this app')));
    const n = practicePool(PR).length, min = pair ? 4 : 2;
    wrap.append(h('button', { class: 'btn primary lg', disabled: n < min, onclick: () => startPractice(PR) }, n < min ? 'Pick more kana' : 'Start · ' + n + ' kana'));
  }; draw(); return wrap;
}
function vLookalikes() {
  const wrap = h('div', { class: 'stack' }, backBar('Look-alikes'));
  wrap.append(h('p', { class: 'muted' }, 'Telling similar shapes apart is a skill of its own. A drill unlocks once you have learned at least two kana in a group.'));
  const ready = CONF.filter(g => g.filter(c => BYCHAR.get(c) && isIntro(BYCHAR.get(c).id)).length >= 2);
  wrap.append(h('button', { class: 'btn primary', disabled: !ready.length, onclick: () => startDrill(ready.flat()) }, 'Drill every look-alike I know'));
  for (const g of CONF) {
    const its = g.map(c => BYCHAR.get(c)).filter(Boolean);
    const n = its.filter(i => isIntro(i.id)).length;
    wrap.append(h('section', { class: 'card stack' },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('div', { class: 'row', style: { gap: '14px' } }, its.map(i => h('button', { class: 'ghost', style: { border: 0, background: 'none', padding: 0, textAlign: 'center' }, onclick: () => openItem(i) }, h('div', { class: 'jp', style: { fontSize: '2.4rem', lineHeight: 1.1 }, lang: 'ja' }, i.c), h('div', { class: 'small muted' }, i.r)))),
        h('button', { class: 'btn', disabled: n < 2, onclick: () => startDrill(g) }, n < 2 ? 'Locked' : 'Drill')),
      its.filter(i => i.tip).slice(0, 2).map(i => h('div', { class: 'note tip', html: md(i.tip) }))));
  }
  return wrap;
}
function vSettings() {
  const st = S.settings;
  const set = (k, v) => { st[k] = v; S.settingsAt = Date.now(); save(); toast('Saved'); };
  const sel = (id, k, opts) => h('select', { id, onchange: e => set(k, isNaN(+e.target.value) ? e.target.value : +e.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(st[k]) === String(v) }, l)));
  const wrap = h('div', { class: 'stack' }, backBar('Settings'));
  wrap.append(h('section', { class: 'card' },
    h('div', { class: 'set-row' }, h('label', { for: 's-new' }, 'New kana and words per day', h('div', { class: 'small muted' }, 'With 30+ minutes a day, 10 to 15 is a good pace.')), sel('s-new', 'newPerDay', [[5, '5'], [10, '10'], [15, '15'], [20, '20'], [30, '30']])),
    h('div', { class: 'set-row' }, h('label', { for: 's-voice' }, 'Voice', h('div', { class: 'small muted' }, 'Hearing more than one speaker trains your ear better.')), sel('s-voice', 'voice', [['alt', 'Both, mixed'], ['f', 'Female'], ['m', 'Male']])),
    h('div', { class: 'set-row' }, h('label', { for: 's-auto' }, 'Play sounds automatically'), sel('s-auto', 'autoplay', [[1, 'On'], [0, 'Off']])),
    h('div', { class: 'set-row' }, h('label', { for: 's-ans' }, 'Answer reading cards by', h('div', { class: 'small muted' }, 'Typing makes you recall; choosing only asks you to recognise.')), sel('s-ans', 'answer', [['type', 'Typing (best)'], ['choose', 'Choosing']]))));
  // fix autoplay boolean
  $('#s-auto', wrap).onchange = e => set('autoplay', e.target.value === '1');
  $('#s-auto', wrap).value = st.autoplay ? '1' : '0';
  wrap.append(backupSection());
  if (ENV === 'pwa') {
    const ready = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    wrap.append(h('section', { class: 'card stack' }, h('h2', { style: { fontSize: '1.15rem' } }, 'Offline'),
      h('p', { class: 'small muted' }, ready ? 'Ready. Everything, including the audio, is stored on this device, so the app works without internet.' : 'Open the app once while you are online to finish storing everything for offline use.')));
  }
  const conf = h('div', { class: 'confirm', hidden: true }, h('b', null, ENV === 'claude' ? 'Erase all progress on every device?' : 'Erase all progress in this app on this device?'), h('p', { class: 'small' }, 'This cannot be undone.'), h('div', { class: 'row' }, h('button', { class: 'btn danger', onclick: () => { const keep = S.settings; S = freshState(); S.settings = keep; S.resetAt = Date.now(); S.updatedAt = Date.now(); saveLocal(); if (Sync.ref) Sync.ref.set({ state: JSON.stringify(S), updatedAt: S.updatedAt, writer: Sync.tab, reset: true }).catch(() => { }); toast('Progress erased'); go('today'); } }, 'Erase everything'), h('button', { class: 'btn ghost', onclick: () => { conf.hidden = true; } }, 'Cancel')));
  wrap.append(h('section', { class: 'card stack' }, h('h2', { style: { fontSize: '1.15rem' } }, 'Start over'), h('button', { class: 'btn danger', onclick: () => { conf.hidden = false; } }, 'Erase progress'), conf));
  return wrap;
}
function vAbout() {
  const P = (t) => mdEl('p', t);
  return h('div', { class: 'stack' }, backBar('How this app teaches'),
    h('section', { class: 'card stack' },
      h('h2', { style: { fontSize: '1.15rem' } }, 'The method'),
      P('**Spaced repetition.** Every card is scheduled with FSRS, a modern open-source algorithm (the one built into Anki). It predicts when you are about to forget and brings the card back just before. Spacing your practice is one of the two study techniques with the strongest evidence (Dunlosky et al., 2013).'),
      P('**Recall before reveal.** You always answer before seeing the answer. Retrieving a memory strengthens it far more than re-reading (Roediger & Karpicke, 2006).'),
      P('**Pictures to learn, reviews to keep.** Each kana starts as a picture story, in the tradition of the keyword method (Atkinson & Raugh, 1975) and *Hiragana in 48 Minutes* (Quackenbush & Ohso, 1983). Mnemonic gains fade without review, so the scheduler keeps them alive, and the picture is hidden once you know a card well, so you read the kana directly.'),
      P('**Look-alike drills.** Practising confusable shapes side by side builds the fine discrimination that reading needs.'),
      P('**Write and type.** Handwriting strengthens memory for a character\'s shape; typing strengthens its sound (Guan et al., 2011). Lessons let you trace each kana with your finger.'),
      P('**Two voices, audio first.** Hearing several speakers trains your ear to the sound itself rather than one voice. Romaji appears only when you first meet a kana.')),
    h('section', { class: 'card stack' },
      h('h2', { style: { fontSize: '1.15rem' } }, 'Why “Lingoa de Iapam”?'),
      P('The first big dictionary between Japanese and a European language was Portuguese: the *Vocabulario da Lingoa de Iapam*, printed by Jesuits in Nagasaki in 1603. Portuguese traders also left words that Japanese still uses, like パン, ボタン and カステラ.')),
    h('section', { class: 'card stack' },
      h('h2', { style: { fontSize: '1.15rem' } }, 'Credits'),
      P('Stroke order: KanjiVG, by Ulrich Apel and contributors (CC BY-SA 3.0).'),
      P('Voices: VOICEVOX:No.7 and VOICEVOX:玄野武宏.'),
      P('Scheduling: ts-fsrs (MIT licence). Fonts: Klee One, Shippori Mincho B1 and Zen Kaku Gothic New (SIL Open Font Licence).'),
      P('Mnemonics, pictures and lessons were written for this app.')));
}

function backupSection() {
  let code = '';
  const out = h('textarea', { class: 'code', id: 's-code-out', readonly: true, hidden: true, 'aria-label': 'Your backup code' });
  const inp = h('textarea', { class: 'code', id: 's-code', placeholder: 'Paste a backup code here', spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off' });
  const size = h('span', { class: 'small muted' }, 'Preparing your code…');
  makeBackup().then(c => { code = c; size.textContent = 'Code ready (' + Math.max(1, Math.round(c.length / 1024)) + ' KB of text).'; });
  const showCode = () => { out.value = code; out.hidden = false; out.focus(); out.select(); };
  const canShare = ENV !== 'claude' && typeof navigator.share === 'function';
  const intro = ENV === 'claude'
    ? (Sync.status === 'synced' ? 'Your progress is saved to your Claude account. To continue in the offline app on your computer or iPad, copy this code and paste it there.' : 'Progress is saved in this browser. Copy a backup code now and then.')
    : 'This app keeps your progress on this device. To continue somewhere else (your other device, or the Claude version), copy this code and restore it there. Restoring merges the two, so nothing is lost.';
  return h('section', { class: 'card stack' }, h('h2', { style: { fontSize: '1.15rem' } }, 'Move or back up your progress'),
    h('p', { class: 'small muted' }, intro),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onclick: () => { if (!code) { toast('One moment, the code is still being prepared'); return; } try { navigator.clipboard.writeText(code).then(() => toast('Backup code copied'), () => { showCode(); toast('Select the code below and copy it'); }); } catch (e) { showCode(); toast('Select the code below and copy it'); } } }, 'Copy backup code'),
      canShare ? h('button', { class: 'btn', onclick: () => { if (code) navigator.share({ title: 'Lingoa de Iapam progress', text: code }).catch(() => { }); } }, 'Share…') : null,
      h('button', { class: 'btn ghost', onclick: showCode }, 'Show code')),
    size, out,
    h('div', { class: 'divider' }),
    h('label', { for: 's-code', style: { fontWeight: 700 } }, 'Restore from a code'),
    inp,
    h('div', null, h('button', { class: 'btn', onclick: async () => {
      try { const o = await readBackup(inp.value); const before = kanaLearned() + wordsLearned(); S = mergeState(S, o); save(); inp.value = ''; const gained = kanaLearned() + wordsLearned() - before; toast(gained > 0 ? 'Progress merged: ' + gained + ' more kana and words' : 'Progress merged'); render(); }
      catch (e) { toast("That code didn't work. Check you copied all of it."); }
    } }, 'Restore and merge')));
}

/* ============ sheet ============ */
function sheet(build) {
  const back = h('div', { class: 'sheet-back', role: 'dialog', 'aria-modal': 'true' });
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const box = h('div', { class: 'sheet' }, h('div', { class: 'sheet-handle' }), h('div', { class: 'row', style: { justifyContent: 'flex-end', marginTop: '-6px' } }, h('button', { class: 'iconbtn', 'aria-label': 'Close', onclick: close }, icon('x'))));
  box.append(build(close));
  back.append(box); back.addEventListener('click', e => { if (e.target === back) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(back);
  return close;
}
