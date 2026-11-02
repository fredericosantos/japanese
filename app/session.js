/* ============ pictures, strokes, trace ============ */
function picSvg(it, cls = 'pic') {
  const d = PICS[it.c] || {};
  const strokes = (STROKES[it.c] || []).map(p => `<path d="${p}"/>`).join('');
  return h('span', { html: `<svg class="${cls}" viewBox="0 0 109 109" role="img" aria-label="Picture for ${esc(it.c)}"><g class="back">${d.back || ''}</g><g class="kana">${strokes}</g><g class="front">${d.front || ''}</g></svg>`, style: { display: 'contents' } });
}
function picCard(it, small) {
  const note = S.notes[it.id];
  return h('div', { class: 'pic-card' },
    PICS[it.c] ? picSvg(it) : null,
    h('div', { style: { minWidth: 0 } },
      h('div', { class: 'hook', html: md(it.hook) }),
      small ? null : h('p', { class: 'story', html: md(it.story) }),
      note && note.text && !small ? h('p', { class: 'story own-text' }, 'Your story: ' + note.text) : null));
}
function glyphChars(it) { return [...it.c]; }
function strokeSvg(chars, ghost) {
  const n = chars.length; const W = 109 * (n === 1 ? 1 : 1.75);
  let out = '', nums = '';
  chars.forEach((ch, i) => {
    const ps = STROKES[ch] || []; const dx = i === 0 ? 0 : 109 * 0.75;
    out += `<g transform="translate(${dx},0)">` + ps.map((p, j) => `<path class="${ghost ? 'ghost' : 'anim'}" d="${p}" data-i="${j}"/>`).join('') + '</g>';
    if (!ghost) ps.forEach((p, j) => { const m = p.match(/M\s*([\d.]+)[ ,]([\d.]+)/); if (m) nums += `<text x="${(+m[1] + dx - 6).toFixed(1)}" y="${(+m[2] - 2).toFixed(1)}" data-n="${j}" opacity="0">${j + 1}</text>`; });
  });
  return `<svg class="strokes" viewBox="0 0 ${W} 109" aria-hidden="true">${ghost ? '' : strokeSvgGhost(chars)}${out}${nums}</svg>`;
}
function strokeSvgGhost(chars) { return chars.map((ch, i) => `<g transform="translate(${i === 0 ? 0 : 109 * 0.75},0)">` + (STROKES[ch] || []).map(p => `<path class="ghost" d="${p}"/>`).join('') + '</g>').join(''); }
function animateStrokes(cell, chars) {
  const old = cell.querySelector('svg.strokes'); if (old) old.remove();
  const glyph = cell.querySelector('.glyph'); if (glyph) glyph.style.opacity = '0';
  cell.insertAdjacentHTML('beforeend', strokeSvg(chars));
  const svg = cell.querySelector('svg.strokes');
  const paths = [...svg.querySelectorAll('path.anim')], nums = [...svg.querySelectorAll('text')];
  let t = 200; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  paths.forEach((p, i) => {
    const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = reduce ? 0 : len;
    const dur = Math.max(380, len * 9);
    if (!reduce) p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay: t, fill: 'forwards', easing: 'ease-in-out' });
    const n = nums[i]; if (n) n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: reduce ? 0 : t, fill: 'forwards' });
    t += dur + 160;
  });
  return t;
}
function tracePad(chars) {
  const n = chars.length;
  const wrap = h('div', { class: 'trace-wrap', style: n > 1 ? { aspectRatio: '1.75', width: 'min(92vw,420px)' } : null });
  const W = 109 * (n === 1 ? 1 : 1.75);
  wrap.innerHTML = `<svg class="guide" viewBox="0 0 ${W} 109" aria-hidden="true"><rect x="1" y="1" width="${W - 2}" height="107" rx="4" fill="var(--surface)" stroke="var(--guide)" stroke-width=".8"/><path d="M${W / 2} 4V105M4 54.5H${W - 4}" stroke="var(--guide)" stroke-width=".6" stroke-dasharray="2 2" fill="none" style="stroke-width:.6"/>${chars.map((ch, i) => `<g transform="translate(${i === 0 ? 0 : 109 * .75},0)">` + (STROKES[ch] || []).map(p => `<path d="${p}"/>`).join('') + '</g>').join('')}</svg>`;
  const cv = h('canvas', { 'aria-label': 'Drawing area: trace the character with your finger' });
  wrap.append(cv);
  let ctx, drawing = false, last = null, dpr = Math.max(1, window.devicePixelRatio || 1);
  const size = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(6, r.width * 0.045); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1c1f26'; };
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => { if (!ctx) size(); drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last[0], last[1], ctx.lineWidth / 2.2, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); });
  cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pos(e); ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); last = p; });
  const end = () => { drawing = false; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const clear = () => { if (ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); } };
  requestAnimationFrame(size);
  return { el: wrap, clear };
}

/* ============ meet cards ============ */
function scriptName(it) { return it.s === 'h' ? 'Hiragana' : 'Katakana'; }
function meetCard(it, opts = {}) {
  const chars = glyphChars(it);
  const combo = chars.length > 1;
  const cell = h('div', { class: 'genko' + (combo ? ' wide' : ''), style: combo ? { width: 'min(80vw,320px)' } : null }, h('span', { class: 'glyph' + (combo ? ' combo' : ''), lang: 'ja' }, it.c));
  let tr = null;
  const traceBox = h('div', { class: 'stack', hidden: true, style: { alignItems: 'center' } });
  const tools = h('div', { class: 'meet-tools' },
    h('button', { class: 'btn quiet', onclick: () => playItem(it) }, icon('play'), 'Sound'),
    h('button', { class: 'iconbtn', 'aria-label': 'Play slowly', title: 'Slowly', onclick: () => playItem(it, { slow: true }) }, icon('slow')),
    h('button', { class: 'btn quiet', onclick: () => animateStrokes(cell, chars) }, icon('brush'), 'Strokes'),
    h('button', { class: 'btn quiet', onclick: () => { traceBox.hidden = !traceBox.hidden; if (!traceBox.hidden && !tr) { tr = tracePad(chars); traceBox.prepend(tr.el); traceBox.append(h('div', { class: 'row' }, h('button', { class: 'btn quiet', onclick: () => tr.clear() }, 'Clear'), h('button', { class: 'btn ghost', onclick: () => animateStrokes(cell, chars) }, 'Show the order again'))); } } }, icon('pencil'), 'Trace'));
  const parts = [
    h('div', { class: 'meet-top' }, cell,
      h('div', { class: 'meet-name' }, h('span', { class: 'rom' }, it.r), h('span', { class: 'chip ' + (it.s === 'h' ? 'indigo' : 'shu') }, scriptName(it)), it.pt ? h('span', { class: 'chip pt' }, 'PT') : null),
      tools),
    traceBox,
  ];
  if (it.g === 'base') parts.push(picCard(it));
  else {
    const base = ITEMS.get((it.s === 'h' ? 'h:' : 'k:') + it.base);
    if (it.g === 'dakuten') parts.push(h('div', { class: 'card flat stack' }, h('div', { class: 'combo-card', lang: 'ja' }, h('span', null, it.base), h('span', { class: 'op' }, '+'), h('span', null, it.r[0] === 'p' ? '゜' : '゛'), h('span', { class: 'op' }, '='), h('span', { class: 'res' }, it.c)), mdEl('p', it.story)));
    else if (it.g === 'yoon') parts.push(h('div', { class: 'card flat stack' }, h('div', { class: 'combo-card', lang: 'ja' }, h('span', null, it.base), h('span', { class: 'op' }, '+'), h('span', { style: { fontSize: '1.5rem' } }, it.c.slice(-1)), h('span', { class: 'op' }, '='), h('span', { class: 'res' }, it.c)), mdEl('p', it.story)));
    else parts.push(h('div', { class: 'card flat stack' }, mdEl('p', it.story)));
    if (base && base.g === 'base') parts.push(h('div', { class: 'small muted' }, 'Remember ' + base.c + ':'), picCard(base, true));
  }
  if (it.pt) parts.push(h('div', { class: 'note pt' }, h('span', { class: 'lbl' }, 'Portuguese link'), h('span', { html: md(it.pt) })));
  if (it.sound) parts.push(h('div', { class: 'note sound' }, h('span', { class: 'lbl' }, 'Sound'), h('span', { html: md(it.sound) })));
  if (it.tip) parts.push(h('div', { class: 'note tip' }, h('span', { class: 'lbl' }, 'Don\'t mix it up'), h('span', { html: md(it.tip) })));
  if (it.ex) {
    const [k, j, r, m] = it.ex;
    parts.push(h('div', { class: 'example' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'In a word'), h('div', { class: 'w', lang: 'ja' }, k, j && j !== k ? h('span', { class: 'small muted', style: { marginLeft: '8px' } }, j) : null), h('div', { class: 'm' }, r + ' · ' + m)), h('button', { class: 'iconbtn', 'aria-label': 'Play ' + r, onclick: () => playEx(it.ex) }, icon('play'))));
  }
  if (it.g === 'base') {
    const note = S.notes[it.id];
    const ta = h('textarea', { id: 'own-' + it.c, placeholder: 'Write a picture or story that works for you…', maxlength: 300 }, note ? note.text : '');
    ta.addEventListener('change', () => { const v = ta.value.trim(); if (v) S.notes[it.id] = { text: v, t: Date.now() }; else delete S.notes[it.id]; save(); toast('Saved your story'); });
    parts.push(h('details', { class: 'own' }, h('summary', null, note ? 'Your own story' : 'Write your own story'), h('p', { class: 'small muted', style: { marginTop: '6px' } }, 'A story you make up yourself often sticks better than one you are given.'), ta));
  }
  return h('div', { class: 'stack' }, parts);
}
function wordMeet(w) {
  const toks = tokens(w.k).filter(t => BYCHAR.has(t));
  return h('div', { class: 'stack' },
    h('div', { class: 'meet-top' },
      h('div', { class: 'genko wide' }, h('span', { class: 'glyph word', lang: 'ja' }, w.k)),
      h('div', { class: 'meet-name', style: { flexDirection: 'column', alignItems: 'center', gap: '2px', textAlign: 'center' } }, h('span', { class: 'rom' }, w.r), h('span', { style: { fontSize: '1.1rem' } }, w.en)),
      h('div', { class: 'meet-tools' }, h('button', { class: 'btn quiet', onclick: () => playWord(w) }, icon('play'), 'Listen'), h('button', { class: 'iconbtn', 'aria-label': 'Play slowly', onclick: () => playWord(w, { slow: true }) }, icon('slow')))),
    w.pt ? h('div', { class: 'note pt' }, h('span', { class: 'lbl' }, 'From Portuguese'), h('span', { html: md(w.pt) })) : null,
    w.note ? h('div', { class: 'note sound' }, h('span', { class: 'lbl' }, 'Note'), h('span', { html: md(w.note) })) : null,
    w.j && w.j !== w.k ? h('div', { class: 'note' }, h('span', { class: 'lbl' }, 'In kanji'), h('span', { class: 'jp', lang: 'ja', style: { fontSize: '1.3rem' } }, w.j), h('span', { class: 'small muted' }, '  You will learn kanji later. For now, just notice it.')) : null,
    h('div', null, h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, 'Built from'), h('div', { class: 'row' }, toks.map(t => { const it = BYCHAR.get(t); return h('button', { class: 'chip', style: { fontSize: '1rem', padding: '6px 12px', border: 0 }, onclick: () => openItem(it) }, h('span', { class: 'jp', lang: 'ja' }, t), ' ' + it.r); }))));
}

/* ============ overlay ============ */
let OV = null;
function overlay(title) {
  closeOverlay();
  const prog = h('i', { style: { width: '0%' } });
  const body = h('div', { class: 'ov-in' });
  const foot = h('div', { class: 'ov-foot-in' });
  const el = h('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'ov-head' }, h('button', { class: 'iconbtn', 'aria-label': 'Close', onclick: () => { closeOverlay(); render(); } }, icon('x')), h('div', { class: 'progress', 'aria-hidden': 'true' }, prog), h('div', { class: 'title' }, title)),
    h('div', { class: 'ov-body' }, body), h('div', { class: 'ov-foot' }, foot));
  document.body.append(el); document.body.style.overflow = 'hidden';
  OV = { el, body, foot, prog, setProgress: f => { prog.style.width = Math.round(f * 100) + '%'; }, set(content, buttons) { body.innerHTML = ''; foot.innerHTML = ''; body.append(content); (buttons || []).forEach(b => b && foot.append(b)); el.querySelector('.ov-body').scrollTop = 0; } };
  return OV;
}
function closeOverlay() { if (OV) { OV.el.remove(); OV = null; document.body.style.overflow = ''; } }

/* ============ quiz engine ============ */
function distractorsKana(it, n, pool) {
  const same = C.items.filter(x => x.s === it.s && x.a !== it.a && x.c !== it.c);
  const conf = CONF.filter(g => g.includes(it.c)).flat().filter(c => c !== it.c).map(c => BYCHAR.get(c)).filter(x => x && x.a !== it.a);
  const known = same.filter(x => isIntro(x.id) && x.g === it.g);
  const row = same.filter(x => x.L === it.L);
  const out = []; const seen = new Set([it.a]);
  for (const src of [conf, (pool || []).map(id => ITEMS.get(id)).filter(Boolean), row, shuffle(known), shuffle(same.filter(x => x.g === it.g)), shuffle(same)]) for (const x of shuffle(src)) { if (out.length >= n) break; if (!seen.has(x.a)) { seen.add(x.a); out.push(x); } }
  return out;
}
function nChoices(it, pool) { const known = C.items.filter(x => x.s === it.s && (isIntro(x.id) || (pool || []).includes(x.id))).length; return Math.max(3, Math.min(5, known - 1)); }
function makeQueue(cids) { // interleave so read/listen of the same item are not adjacent
  const q = shuffle(cids);
  for (let i = 1; i < q.length; i++) if (q[i].split('|')[0] === q[i - 1].split('|')[0]) { const j = q.findIndex((x, k) => k > i && x.split('|')[0] !== q[i].split('|')[0]); if (j > 0) [q[i], q[j]] = [q[j], q[i]]; }
  return q;
}
function runQuiz({ title, cids, mode, pool, onDone }) {
  const ov = overlay(title);
  const queue = makeQueue(cids).map(cid => ({ cid, tries: 0 }));
  const total = queue.length; const graded = new Set(); let done = 0, right = 0, firstRight = 0; const t0 = Date.now(); const missed = new Set();
  const finish = () => { onDone && onDone({ total, right: firstRight, missed: [...missed], ms: Date.now() - t0 }); };
  const nextQ = () => {
    ov.setProgress(done / total);
    if (!queue.length) return finish();
    showQ(queue.shift());
  };
  const showQ = (q) => {
    const [id, kind] = q.cid.split('|'); const isW = id.startsWith('w:');
    const it = isW ? WORDS.get(id) : ITEMS.get(id);
    const started = Date.now(); let hinted = false;
    const resolve = (result, given) => { // result: 'ok' | 'long' | 'no'
      const ms = Date.now() - started; const correct = result !== 'no';
      if (!graded.has(q.cid) && mode !== 'drill') {
        graded.add(q.cid);
        let rt = !correct ? Rating.Again : (result === 'long' || hinted) ? Rating.Hard : ms > (isW ? 10000 : 7000) ? Rating.Hard : Rating.Good;
        if (mode === 'lesson' || mode === 'words') introduce(id);
        rate(q.cid, rt, ms);
        if (correct) firstRight++; else missed.add(id);
      } else if (mode === 'drill' && q.tries === 0) { if (correct) firstRight++; else missed.add(id); }
      q.tries++;
      if (correct) { done++; right++; } else { queue.splice(Math.min(queue.length, 3), 0, q); }
      return { correct, ms };
    };
    if (isW) (kind === 'r' ? qWordRead : qWordListen)(ov, it, resolve, nextQ);
    else if (kind === 'd') qDrill(ov, it, pool, resolve, nextQ);
    else (kind === 'r' ? qKanaRead : qKanaListen)(ov, it, resolve, nextQ, { pool, canHint: mode === 'review' && !mature(id), onHint: () => { hinted = true; } });
  };
  nextQ();
}
function verdict(kind, text) { return h('div', { class: 'verdict' }, icon(kind === 'ok' ? 'check' : kind === 'bad' ? 'x' : 'check'), text); }
function contBtn(nextQ, primary = true) { const b = h('button', { class: 'btn lg ' + (primary ? 'primary' : ''), onclick: () => { document.removeEventListener('keydown', b._k); nextQ(); } }, 'Continue'); b._k = e => { if (e.key === 'Enter') { e.preventDefault(); b.click(); } }; setTimeout(() => document.addEventListener('keydown', b._k), 50); setTimeout(() => b.focus({ preventScroll: true }), 30); return b; }
function autoNext(nextQ, ms = 950) { let gone = false; const go = () => { if (gone) return; gone = true; document.removeEventListener('keydown', k); nextQ(); }; const k = e => { if (e.key === 'Enter') { e.preventDefault(); go(); } }; setTimeout(() => document.addEventListener('keydown', k), 50); const t = setTimeout(go, ms); return h('button', { class: 'btn lg primary', onclick: () => { clearTimeout(t); go(); } }, 'Next'); }

function qKanaRead(ov, it, resolve, nextQ, o) {
  const chars = glyphChars(it);
  const cell = h('div', { class: 'genko' + (chars.length > 1 ? ' wide' : ''), style: chars.length > 1 ? { width: 'min(80vw,320px)' } : null }, h('span', { class: 'glyph' + (chars.length > 1 ? ' combo' : ''), lang: 'ja' }, it.c));
  const area = h('div', { class: 'stack', style: { width: '100%' } });
  const body = h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, 'How do you read this?'), cell, area);
  const after = (res) => {
    const { correct } = resolve(res);
    if (S.settings.autoplay) playItem(it);
    const fb = h('div', { class: 'feedback ' + (res === 'ok' ? 'ok' : res === 'long' ? 'meh' : 'bad') },
      verdict(res === 'no' ? 'bad' : 'ok', res === 'no' ? 'Not quite' : 'Correct'),
      h('div', { class: 'reveal' }, h('span', { class: 'k', lang: 'ja' }, it.c), h('span', { class: 'r' }, it.r), h('button', { class: 'iconbtn', 'aria-label': 'Play', onclick: () => playItem(it) }, icon('play'))));
    if (!correct && it.g === 'base') fb.append(picCard(it));
    if (!correct && it.g !== 'base') fb.append(mdEl('p', it.story));
    area.append(fb);
    ov.foot.innerHTML = ''; ov.foot.append(correct ? autoNext(nextQ) : contBtn(nextQ));
  };
  let buttons = [];
  if (S.settings.answer === 'choose') {
    const opts = shuffle([it, ...distractorsKana(it, nChoices(it, o.pool), o.pool)]);
    const grid = h('div', { class: 'choices text', style: { gridTemplateColumns: 'repeat(3,minmax(0,1fr))' } }, opts.map(x => h('button', { class: 'choice', style: { placeItems: 'center', fontFamily: 'var(--f-display)', fontSize: '1.3rem', fontWeight: 700 }, onclick: e => { grid.querySelectorAll('button').forEach(b => b.disabled = true); const ok = x.a === it.a; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); if (!ok) [...grid.children][opts.indexOf(it)].classList.add('right'); after(ok ? 'ok' : 'no'); } }, x.r)));
    area.append(grid);
    buttons = [h('button', { class: 'btn', onclick: () => { grid.querySelectorAll('button').forEach(b => b.disabled = true); after('no'); } }, "I don't know")];
  } else {
    const inp = h('input', { id: 'ans', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', placeholder: 'type in romaji', 'aria-label': 'Your answer in romaji' });
    const submit = () => { if (inp.readOnly) return; const v = inp.value.trim(); if (!v) { inp.focus(); return; } inp.readOnly = true; const ok = it.alt.map(normRomaji).includes(normRomaji(v)); inp.classList.add(ok ? 'right' : 'wrong'); after(ok ? 'ok' : 'no'); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    area.append(h('div', { class: 'answer' }, inp));
    buttons = [h('button', { class: 'btn', onclick: () => { if (inp.readOnly) return; inp.readOnly = true; after('no'); } }, "I don't know"), h('button', { class: 'btn primary', onclick: submit }, 'Check')];
    setTimeout(() => inp.focus({ preventScroll: true }), 60);
  }
  if (o.canHint && it.g === 'base' && PICS[it.c]) { const hb = h('button', { class: 'btn ghost', onclick: () => { o.onHint(); hb.replaceWith(h('div', { class: 'pic-card', style: { gridTemplateColumns: '1fr', justifyItems: 'center', maxWidth: '200px', margin: '0 auto' } }, picSvg(it))); } }, 'Show the picture (hint)'); area.append(hb); }
  ov.set(body, buttons);
}
function qKanaListen(ov, it, resolve, nextQ, o) {
  const pb = h('button', { class: 'playbig', 'aria-label': 'Play the sound again', onclick: () => { pb.classList.remove('pulse'); void pb.offsetWidth; pb.classList.add('pulse'); playItem(it); } }, icon('play'));
  const opts = shuffle([it, ...distractorsKana(it, nChoices(it, o.pool), o.pool)]);
  const area = h('div', { class: 'stack', style: { width: '100%' } });
  const grid = h('div', { class: 'choices' }, opts.map(x => h('button', { class: 'choice', lang: 'ja', onclick: e => {
    grid.querySelectorAll('button').forEach(b => b.disabled = true);
    const ok = x.a === it.a; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); [...grid.children][opts.indexOf(it)].classList.add('right');
    const { correct } = resolve(ok ? 'ok' : 'no');
    const fb = h('div', { class: 'feedback ' + (ok ? 'ok' : 'bad') }, verdict(ok ? 'ok' : 'bad', ok ? 'Correct: ' + it.r : 'That was ' + it.r + ', not ' + x.r));
    if (!ok) { if (it.g === 'base' && x.g === 'base') fb.append(h('div', { class: 'vs' }, picCard(it, true), picCard(x, true))); const tip = it.tip && it.tip.includes(x.c) ? it.tip : (x.tip && x.tip.includes(it.c) ? x.tip : null); if (tip) fb.append(h('div', { class: 'note tip', html: md(tip) })); }
    area.append(fb); ov.foot.innerHTML = ''; ov.foot.append(correct ? autoNext(nextQ) : contBtn(nextQ));
  } }, x.c)));
  area.append(grid);
  ov.set(h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, 'Which kana do you hear?'), pb, area), [h('button', { class: 'btn', onclick: () => pb.click() }, icon('replay'), 'Hear again')]);
  if (S.settings.autoplay) setTimeout(() => playItem(it), 250);
}
function qDrill(ov, it, pool, resolve, nextQ) {
  const group = (pool || []).map(c => BYCHAR.get(c)).filter(x => x && x.s === it.s && isIntro(x.id) && x.id !== it.id);
  const sameGroup = CONF.filter(g => g.includes(it.c)).flat().map(c => BYCHAR.get(c)).filter(x => x && x.id !== it.id && isIntro(x.id));
  let others = [...new Map(sameGroup.map(x => [x.id, x])).values()].slice(0, 3);
  if (others.length < 2) others = others.concat(shuffle(group.filter(x => !others.includes(x))).slice(0, 2 - others.length));
  const opts = shuffle([it, ...others]);
  const area = h('div', { class: 'stack', style: { width: '100%' } });
  const grid = h('div', { class: 'choices', style: { gridTemplateColumns: `repeat(${Math.min(opts.length, 4)},minmax(0,1fr))` } }, opts.map(x => h('button', { class: 'choice', lang: 'ja', style: { minHeight: '96px', fontSize: '2.8rem' }, onclick: e => {
    grid.querySelectorAll('button').forEach(b => b.disabled = true);
    const ok = x.id === it.id; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); [...grid.children][opts.indexOf(it)].classList.add('right');
    const { correct } = resolve(ok ? 'ok' : 'no');
    const fb = h('div', { class: 'feedback ' + (ok ? 'ok' : 'bad') }, verdict(ok ? 'ok' : 'bad', ok ? 'Yes, that is ' + it.r : 'That one is ' + x.r));
    if (!ok && it.g === 'base' && x.g === 'base') fb.append(h('div', { class: 'vs' }, picCard(it, true), picCard(x, true)));
    const tip = it.tip || x.tip; if (!ok && tip) fb.append(h('div', { class: 'note tip', html: md(tip) }));
    area.append(fb); ov.foot.innerHTML = ''; ov.foot.append(correct ? autoNext(nextQ, 800) : contBtn(nextQ));
  } }, x.c)));
  area.append(grid);
  ov.set(h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, 'Find'), h('div', { class: 'meet-name' }, h('span', { class: 'rom', style: { fontSize: '2.6rem' } }, it.r), h('button', { class: 'iconbtn', 'aria-label': 'Play', onclick: () => playItem(it) }, icon('play'))), area), []);
  if (S.settings.autoplay) setTimeout(() => playItem(it), 200);
}
function qWordRead(ov, w, resolve, nextQ) {
  const area = h('div', { class: 'stack', style: { width: '100%' } });
  const body = h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, 'Read this word'), h('div', { class: 'genko wide' }, h('span', { class: 'glyph word', lang: 'ja' }, w.k)), area);
  const after = res => {
    const { correct } = resolve(res);
    if (S.settings.autoplay) playWord(w);
    const fb = h('div', { class: 'feedback ' + (res === 'ok' ? 'ok' : res === 'long' ? 'meh' : 'bad') },
      verdict(res === 'no' ? 'bad' : 'ok', res === 'ok' ? 'Correct' : res === 'long' ? 'Almost: watch the long vowels and small っ' : 'Not quite'),
      h('div', { class: 'reveal' }, h('span', { class: 'r' }, w.r), h('span', null, w.en), h('button', { class: 'iconbtn', 'aria-label': 'Play', onclick: () => playWord(w) }, icon('play'))),
      w.note ? h('div', { class: 'small', html: md(w.note) }) : null);
    area.append(fb); ov.foot.innerHTML = ''; ov.foot.append(contBtn(nextQ));
  };
  const kana = w.say || w.k;
  if (S.settings.answer === 'choose') {
    const others = shuffle(C.words.filter(x => x.id !== w.id && Math.abs(x.k.length - w.k.length) <= 2)).slice(0, 3);
    const opts = shuffle([w, ...others]);
    const grid = h('div', { class: 'choices text' }, opts.map(x => h('button', { class: 'choice', onclick: e => { grid.querySelectorAll('button').forEach(b => b.disabled = true); const ok = x.id === w.id; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); [...grid.children][opts.indexOf(w)].classList.add('right'); after(ok ? 'ok' : 'no'); } }, x.r)));
    area.append(grid);
    ov.set(body, [h('button', { class: 'btn', onclick: () => { grid.querySelectorAll('button').forEach(b => b.disabled = true); after('no'); } }, "I don't know")]);
  } else {
    const inp = h('input', { id: 'ans', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', placeholder: 'type it in romaji', 'aria-label': 'Your answer in romaji' });
    const submit = () => { if (inp.readOnly) return; const v = inp.value.trim(); if (!v) { inp.focus(); return; } inp.readOnly = true; const res = checkRomaji(v, kana); inp.classList.add(res === 'no' ? 'wrong' : 'right'); after(res); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    area.append(h('div', { class: 'answer' }, inp));
    ov.set(body, [h('button', { class: 'btn', onclick: () => { if (inp.readOnly) return; inp.readOnly = true; after('no'); } }, "I don't know"), h('button', { class: 'btn primary', onclick: submit }, 'Check')]);
    setTimeout(() => inp.focus({ preventScroll: true }), 60);
  }
}
function qWordListen(ov, w, resolve, nextQ) {
  const pb = h('button', { class: 'playbig', 'aria-label': 'Play again', onclick: () => { pb.classList.remove('pulse'); void pb.offsetWidth; pb.classList.add('pulse'); playWord(w); } }, icon('play'));
  const others = shuffle(C.words.filter(x => x.id !== w.id && x.en !== w.en)).slice(0, 3);
  const opts = shuffle([w, ...others]);
  const area = h('div', { class: 'stack', style: { width: '100%' } });
  const grid = h('div', { class: 'choices text' }, opts.map(x => h('button', { class: 'choice', onclick: e => {
    grid.querySelectorAll('button').forEach(b => b.disabled = true);
    const ok = x.id === w.id; e.currentTarget.classList.add(ok ? 'right' : 'wrong'); [...grid.children][opts.indexOf(w)].classList.add('right');
    const { correct } = resolve(ok ? 'ok' : 'no');
    area.append(h('div', { class: 'feedback ' + (ok ? 'ok' : 'bad') }, verdict(ok ? 'ok' : 'bad', ok ? 'Correct' : 'Not quite'), h('div', { class: 'reveal' }, h('span', { class: 'k', lang: 'ja', style: { fontSize: '1.8rem' } }, w.k), h('span', null, w.r + ' · ' + w.en))));
    ov.foot.innerHTML = ''; ov.foot.append(correct ? autoNext(nextQ, 1100) : contBtn(nextQ));
  } }, x.en)));
  area.append(grid);
  ov.set(h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, 'What does it mean?'), pb, area), [h('button', { class: 'btn', onclick: () => pb.click() }, icon('replay'), 'Hear again')]);
  if (S.settings.autoplay) setTimeout(() => playWord(w), 250);
}

/* ============ flows ============ */
function doneScreen(ov, { title, line, res, primary, secondary }) {
  ov.setProgress(1);
  const pct = res && res.total ? Math.round(res.right / res.total * 100) : null;
  ov.set(h('div', { class: 'done-hero' }, h('div', { class: 'hanko', 'aria-hidden': 'true' }, '済'), h('h2', { style: { fontSize: '1.6rem' } }, title), line ? mdEl('p', line, 'muted') : null,
    res ? h('div', { class: 'stat-row', style: { width: '100%', maxWidth: '420px' } },
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, res.total + ''), h('span', null, 'cards')),
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, pct + '%'), h('span', null, 'right first time')),
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, Math.max(1, Math.round(res.ms / 60000)) + ''), h('span', null, 'min'))) : null),
    [secondary, primary]);
}
function startLesson(lid, again) {
  const l = LESSONS.get(lid); let ids = again ? l.ids.slice() : lessonLeft(l); if (!ids.length) ids = l.ids.slice();
  const items = ids.map(id => ITEMS.get(id));
  const ov = overlay(l.d);
  const total = items.length + 1; let i = -1;
  const step = () => {
    ov.setProgress((i + 1) / (total + items.length));
    if (i < 0) {
      ov.set(h('div', { class: 'stack', style: { alignItems: 'center', textAlign: 'center', paddingTop: '18px' } },
        h('div', { class: 'eyebrow' }, (l.s === 'h' ? 'Hiragana' : 'Katakana') + ' · ' + items.length + ' new'),
        h('h2', { style: { fontSize: '1.7rem' } }, l.d),
        h('div', { class: 'jp', lang: 'ja', style: { fontSize: '2.6rem', letterSpacing: '.15em', lineHeight: 1.4 } }, items.map(x => x.c).join(' ')),
        l.intro ? mdEl('p', l.intro, 'muted') : h('p', { class: 'muted' }, 'Meet each character, then test yourself straight away.'),
        newToday() >= S.settings.newPerDay ? h('p', { class: 'small', style: { color: 'var(--amber)' } }, 'You have already reached today\'s goal for new items. Learning more is fine, but more reviews will come tomorrow.') : null),
        [h('button', { class: 'btn primary lg', onclick: () => { i = 0; step(); } }, 'Start')]);
      return;
    }
    if (i < items.length) {
      const it = items[i];
      ov.set(meetCard(it), [i > 0 ? h('button', { class: 'btn', onclick: () => { i--; step(); } }, icon('back'), 'Back') : null, h('button', { class: 'btn primary lg', onclick: () => { i++; step(); } }, i === items.length - 1 ? 'Test yourself' : 'Next')]);
      if (S.settings.autoplay) setTimeout(() => playItem(it), 200);
      return;
    }
    closeOverlay();
    const cids = items.flatMap(it => cardIds(it.id));
    runQuiz({ title: l.d, cids, mode: 'lesson', pool: ids, onDone: res => {
      if (lessonLeft(l).length === 0) S.lessons[l.id] = S.lessons[l.id] || Date.now(); save();
      const nl = nextLesson();
      doneScreen(OV, { title: 'Lesson complete', line: items.map(x => x.c).join(' ') + ' are now in your reviews. They will come back just before you would forget them.', res,
        secondary: h('button', { class: 'btn', onclick: () => { closeOverlay(); go('today'); } }, 'Back to Today'),
        primary: nl && nl !== lid ? h('button', { class: 'btn primary', onclick: () => nl === 'kcheck' ? startPlacement() : startLesson(nl) }, 'Next lesson') : h('button', { class: 'btn primary', onclick: () => { closeOverlay(); go('chart'); } }, 'See your chart') });
    } });
  };
  step();
}
function startWordLesson() {
  const ws = wordsReady().slice(0, 5); if (!ws.length) return;
  const ov = overlay('New words'); let i = 0;
  const step = () => {
    ov.setProgress(i / (ws.length * 2));
    if (i < ws.length) {
      const w = ws[i];
      ov.set(wordMeet(w), [i > 0 ? h('button', { class: 'btn', onclick: () => { i--; step(); } }, icon('back'), 'Back') : null, h('button', { class: 'btn primary lg', onclick: () => { i++; step(); } }, i === ws.length - 1 ? 'Test yourself' : 'Next')]);
      if (S.settings.autoplay) setTimeout(() => playWord(w), 200); return;
    }
    closeOverlay();
    runQuiz({ title: 'New words', cids: ws.flatMap(w => cardIds(w.id)), mode: 'words', onDone: res => {
      doneScreen(OV, { title: 'Words learned', line: ws.map(w => w.k).join('、'), res,
        secondary: h('button', { class: 'btn', onclick: () => { closeOverlay(); go('today'); } }, 'Back to Today'),
        primary: wordsReady().length ? h('button', { class: 'btn primary', onclick: () => startWordLesson() }, 'More words') : null });
    } });
  };
  step();
}
function startReview() {
  const now = Date.now();
  const due = dueList(now).sort((a, b) => { const la = a[1].st === 1 || a[1].st === 3, lb = b[1].st === 1 || b[1].st === 3; return la !== lb ? (la ? -1 : 1) : a[1].d - b[1].d; });
  const MAX = 80; const cids = due.slice(0, MAX).map(x => x[0]);
  if (!cids.length) { toast('Nothing to review right now'); return; }
  runQuiz({ title: 'Reviews', cids, mode: 'review', onDone: res => {
    const left = dueList().length;
    doneScreen(OV, { title: 'Reviews done', line: res.missed.length ? 'Missed: ' + res.missed.map(id => (ITEMS.get(id) || WORDS.get(id) || {}).c || (WORDS.get(id) || {}).k).join(' ') + '. They will come back soon.' : 'Every card right first time. 見事 (*migoto*): splendid!', res,
      secondary: h('button', { class: 'btn', onclick: () => { closeOverlay(); go('today'); } }, 'Back to Today'),
      primary: left ? h('button', { class: 'btn primary', onclick: () => startReview() }, left + ' more due') : (nextLesson() ? h('button', { class: 'btn primary', onclick: () => { const nl = nextLesson(); nl === 'kcheck' ? startPlacement() : startLesson(nl); } }, 'Next lesson') : null) });
  } });
}
function startDrill(chars) {
  const its = [...new Set(chars)].map(c => BYCHAR.get(c)).filter(x => x && isIntro(x.id));
  if (its.length < 2) return;
  const cids = []; for (let k = 0; k < Math.max(10, Math.min(20, its.length * 3)); k++) cids.push(pick(its).id + '|d');
  runQuiz({ title: 'Look-alikes', cids, mode: 'drill', pool: [...new Set(chars)], onDone: res => {
    doneScreen(OV, { title: 'Drill done', line: 'Practice drills don\'t change your schedule. They sharpen your eye.', res,
      secondary: h('button', { class: 'btn', onclick: () => { closeOverlay(); go('more', 'lookalikes'); } }, 'Back'),
      primary: h('button', { class: 'btn primary', onclick: () => startDrill(chars) }, 'Again') });
  } });
}
function startPlacement() {
  const its = shuffle(C.items.filter(i => i.s === 'k' && i.g === 'base' && i.c !== 'ヲ'));
  const ov = overlay('Katakana check'); let i = -1; const known = [], unknown = [];
  const step = () => {
    ov.setProgress(Math.max(0, i) / its.length);
    if (i < 0) {
      ov.set(h('div', { class: 'stack', style: { textAlign: 'center', alignItems: 'center', paddingTop: '18px' } }, h('div', { class: 'eyebrow' }, its.length + ' characters · about 3 minutes'), h('h2', { style: { fontSize: '1.6rem' } }, 'Which katakana do you know?'),
        h('p', { class: 'muted' }, 'Type the sound of each one, or tap "Don\'t know". Characters you get right quickly skip their lesson and go straight into reviews. Don\'t guess: it is better to learn one properly.')),
        [h('button', { class: 'btn primary lg', onclick: () => { i = 0; step(); } }, 'Start the check')]);
      return;
    }
    if (i >= its.length) {
      const now = Date.now();
      for (const it of known) { introduce(it.id); rate(it.id + '|r', Rating.Easy, 2000); }
      S.flags.kcheck = now; save();
      doneScreen(ov, { title: 'Check complete', line: `You know **${known.length}** of ${its.length}. ` + (known.length ? 'They are in your reviews now, with a listening check coming up first. ' : '') + (unknown.length ? 'The other ' + unknown.length + ' will be taught in lessons.' : ''), res: null,
        secondary: h('button', { class: 'btn', onclick: () => { closeOverlay(); go('today'); } }, 'Back to Today'),
        primary: h('button', { class: 'btn primary', onclick: () => { const nl = nextLesson(); nl ? startLesson(nl) : (closeOverlay(), go('today')); } }, 'Next lesson') });
      return;
    }
    const it = its[i]; const t0 = Date.now();
    const inp = h('input', { id: 'ans', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next', placeholder: 'type in romaji', 'aria-label': 'Sound in romaji' });
    const sub = (skip) => { const ok = !skip && it.alt.map(normRomaji).includes(normRomaji(inp.value.trim())) && Date.now() - t0 < 9000; (ok ? known : unknown).push(it); i++; step(); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (inp.value.trim()) sub(false); } });
    ov.set(h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, (i + 1) + ' of ' + its.length), h('div', { class: 'genko' }, h('span', { class: 'glyph', lang: 'ja' }, it.c)), h('div', { class: 'answer' }, inp)),
      [h('button', { class: 'btn', onclick: () => sub(true) }, "Don't know"), h('button', { class: 'btn primary', onclick: () => inp.value.trim() ? sub(false) : inp.focus() }, 'Next')]);
    setTimeout(() => inp.focus({ preventScroll: true }), 50);
  };
  step();
}

/* ============ practice (free practice, never touches saved progress) ============ */
const TWIN = new Map(C.items.map(i => [i.s + i.a + i.g, i])); // hiragana <-> katakana counterpart, same reading
const twin = it => TWIN.get((it.s === 'h' ? 'k' : 'h') + it.a + it.g);
function practicePool(o) {
  const rowOk = i => i.g !== 'base' || !o.rows.size || o.rows.has(+i.L.slice(1));
  const pair = o.mode === 'pair';
  return C.items.filter(i => o.cats.has(i.g) && rowOk(i) && (pair ? i.s === 'h' && i.g !== 'ext' : o.script === 'both' || i.s === o.script)
    && (!o.learned || (isIntro(i.id) && (!pair || isIntro(twin(i).id)))));
}
function startPractice(o) {
  const its = practicePool(o); if (its.length < (o.mode === 'pair' ? 4 : 2)) { toast('Pick more kana to practise'); return; }
  (o.mode === 'pair' ? practicePair : practiceType)(its, o);
}
function practiceDone(ov, o, { rows, total, ms }) { // rows: [{it, ok, typed?}] for attempted cards
  ov.setProgress(1);
  const right = rows.filter(r => r.ok).length, miss = rows.filter(r => !r.ok), pct = rows.length ? Math.round(right / rows.length * 100) : 0;
  const again = (its) => () => (o.mode === 'pair' ? practicePair : practiceType)(its, o);
  ov.set(h('div', { class: 'done-hero' }, h('div', { class: 'hanko', 'aria-hidden': 'true' }, '済'), h('h2', { style: { fontSize: '1.6rem' } }, miss.length ? 'Practice done' : 'Perfect round'),
    mdEl('p', total > rows.length ? `${total - rows.length} of ${total} left unanswered. Only answered cards are scored.` : 'Practice never changes your schedule.', 'muted'),
    h('div', { class: 'stat-row', style: { width: '100%', maxWidth: '420px' } },
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, rows.length + ''), h('span', null, 'answered')),
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, pct + '%'), h('span', null, 'right')),
      h('div', { class: 'stat' }, h('b', { class: 'tnum' }, (ms >= 90000 ? Math.round(ms / 60000) + 'm' : Math.round(ms / 1000) + 's')), h('span', null, 'time'))),
    miss.length ? h('div', { class: 'stack', style: { width: '100%', maxWidth: '420px' } }, h('div', { class: 'eyebrow' }, 'To look at again'),
      h('div', { class: 'pq-miss' }, miss.map(r => h('button', { class: 'pq-m', onclick: () => openItem(r.it) }, h('span', { class: 'jp', lang: 'ja' }, r.it.c), h('span', { class: 'small' }, r.it.r), r.typed ? h('span', { class: 'small muted' }, h('s', null, r.typed)) : null)))) : null),
    [h('button', { class: 'btn', onclick: () => { closeOverlay(); go('more', 'practice'); } }, 'Setup'),
      miss.length ? h('button', { class: 'btn', onclick: again(miss.map(r => r.it)) }, 'Retry ' + miss.length + ' missed') : null,
      h('button', { class: 'btn primary', onclick: again(practicePool(o)) }, 'Again')]);
}
// Grid of cards: type the sound, Enter checks and moves on. A wrong card shows the answer and plays it.
function practiceType(its, o) {
  const ov = overlay('Practice'); const t0 = Date.now(); const res = new Map();
  const cards = shuffle(its).map(it => {
    const inp = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next', 'aria-label': 'Romaji for ' + it.c });
    const out = h('div', { class: 'pq-out' });
    return { it, inp, out, el: h('div', { class: 'pq-card' }, h('div', { class: 'pq-k', lang: 'ja' }, it.c), inp, out) };
  });
  const finish = h('button', { class: 'btn primary lg', disabled: true });
  const sync = () => { ov.setProgress(res.size / cards.length); finish.disabled = !res.size; finish.textContent = res.size + ' / ' + cards.length + ' · Finish'; };
  cards.forEach((c, i) => c.inp.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || res.has(c.it.id)) return; e.preventDefault();
    const v = c.inp.value.trim(), ok = !!v && c.it.alt.map(normRomaji).includes(normRomaji(v));
    res.set(c.it.id, { it: c.it, ok, typed: ok ? '' : v }); c.inp.readOnly = true; c.el.classList.add(ok ? 'ok' : 'no');
    c.out.append(c.it.r); if (!ok) { if (v) c.out.append(' ', h('s', null, v)); if (S.settings.autoplay) playItem(c.it); }
    sync(); const n = cards.slice(i + 1).concat(cards.slice(0, i)).find(x => !res.has(x.it.id)); if (n) n.inp.focus(); else c.inp.blur();
  }));
  finish.onclick = () => practiceDone(ov, o, { rows: [...res.values()], total: cards.length, ms: Date.now() - t0 });
  ov.set(h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'Type the sound of each kana and press Enter. Enter on an empty card reveals the answer and counts as a miss. Cards you leave alone are not scored.'), h('div', { class: 'pq-grid' }, cards.map(c => c.el))), [finish]);
  sync(); setTimeout(() => cards[0].inp.focus({ preventScroll: true }), 50);
}
// One at a time: see a kana, pick its twin in the other script. Look-alikes are used as distractors.
function practicePair(its, o) {
  const ov = overlay('Hiragana ↔ Katakana'); const t0 = Date.now(); const rows = []; const qs = shuffle(its).map(it => Math.random() < .5 ? it : twin(it));
  let i = 0;
  const step = () => {
    ov.setProgress(i / qs.length);
    if (i >= qs.length) return practiceDone(ov, o, { rows, total: qs.length, ms: Date.now() - t0 });
    const p = qs[i], ans = twin(p), script = ans.s === 'h' ? 'hiragana' : 'katakana';
    const opts = shuffle([ans, ...distractorsKana(ans, 3, its.map(x => (x.s === ans.s ? x : twin(x)).id))]); const area = h('div', { class: 'stack', style: { width: '100%' } });
    const grid = h('div', { class: 'choices', style: { gridTemplateColumns: 'repeat(2,minmax(0,1fr))' } }, opts.map(x => h('button', { class: 'choice', lang: 'ja', onclick: e => {
      grid.querySelectorAll('button').forEach(b => b.disabled = true); const ok = x.id === ans.id;
      e.currentTarget.classList.add(ok ? 'right' : 'wrong'); if (!ok) grid.children[opts.indexOf(ans)].classList.add('right');
      rows.push({ it: p, ok, typed: ok ? '' : x.c }); if (S.settings.autoplay) playItem(ans);
      area.append(h('div', { class: 'feedback ' + (ok ? 'ok' : 'bad') }, verdict(ok ? 'ok' : 'bad', ok ? 'Correct' : 'Not quite'), h('div', { class: 'reveal' }, h('span', { class: 'k', lang: 'ja' }, p.c + ' = ' + ans.c), h('span', { class: 'r' }, p.r))));
      ov.foot.innerHTML = ''; ov.foot.append(ok ? autoNext(() => { i++; step(); }) : contBtn(() => { i++; step(); }));
    } }, x.c)));
    area.append(grid);
    ov.set(h('div', { class: 'q-prompt' }, h('div', { class: 'q-label' }, 'Which ' + script + ' is this?'), h('div', { class: 'genko' + (p.c.length > 1 ? ' wide' : ''), style: p.c.length > 1 ? { width: 'min(80vw,320px)' } : null }, h('span', { class: 'glyph' + (p.c.length > 1 ? ' combo' : ''), lang: 'ja' }, p.c)), area), [h('button', { class: 'btn', onclick: () => { grid.querySelectorAll('button').forEach(b => b.disabled = true); rows.push({ it: p, ok: false, typed: '' }); grid.children[opts.indexOf(ans)].classList.add('right'); ov.foot.innerHTML = ''; ov.foot.append(contBtn(() => { i++; step(); })); } }, "I don't know")]);
  };
  step();
}

/* ============ boot ============ */
render();
initSync(fromRemote => { if (!OV) render(); else if (fromRemote) toast('Progress updated from another device'); });
setTimeout(() => { Audio_.load('f'); Audio_.load('m'); }, 600);
if (ENV !== 'claude') try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
if ('speechSynthesis' in window) try { speechSynthesis.getVoices(); } catch (e) { }
