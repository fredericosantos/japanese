# Lingoa de Iapam: guide for coding agents

A Japanese course (kana, starter words, audio, spaced repetition) for Fred, a Portuguese speaker who studies in English. It is a plain HTML/CSS/JS app with no framework, built into single pages by two Python scripts. `PLAN.md` explains the learning design and the history of decisions. Read it before changing behaviour.

The name comes from the *Vocabulario da Lingoa de Iapam* (Nagasaki, 1603), the first Japanese–Portuguese dictionary. "Lingoa" is old Portuguese spelling, not a typo.

## Build

Requires Python 3 and nothing else. Both scripts resolve paths relative to themselves.

```
python3 build_content.py     # content/*.py  -> data/content.json, data/audio_manifest.json
python3 build_variants.py    # -> dist/lingoa.html, dist-pwa/, dist-offline/
```

| Output | What it is |
|---|---|
| `dist/lingoa.html` | Claude artifact version (page body only; loads Google Fonts; syncs via the artifact `db`/`user` capabilities) |
| `dist-pwa/` | Installable offline web app: service worker, manifest, icons, fonts, audio, `CNAME` = japanese.fsx.app. **This folder is what gets deployed.** |
| `dist-offline/Lingoa de Iapam.html` | A single self-contained file (audio and fonts inline) to double-click on a computer |

`window.__ENV` is `'claude' | 'pwa' | 'file'` and is set by each build.

## Deploying to japanese.fsx.app (GitHub Pages)

1. Create a public repo (for example `japanese`). Publish the **contents** of `dist-pwa/` at the root of the deployed branch: `index.html`, `sw.js`, `manifest.webmanifest`, `CNAME`, `404.html`, `audio/`, `fonts/`, `icons/`. Either commit `dist-pwa/` contents to a `gh-pages` branch, or keep sources on `main` and deploy `dist-pwa/` with a GitHub Actions Pages workflow.
2. Under Settings → Pages, set the source and the custom domain `japanese.fsx.app`, then enforce HTTPS once the certificate is issued. `.app` is HSTS-preloaded, so it only works over HTTPS.
3. DNS (Fred's side, wherever fsx.app is managed): add a `CNAME` record from `japanese` to `<github-username>.github.io`. On Cloudflare DNS, set it to "DNS only".
4. Verify: the site loads, `sw.js` registers, and after one visit it reloads with the network off.

Cloudflare Pages also works: upload `dist-pwa/`, then add the custom domain.

## Layout

```
app/core.js       data indexes, DOM helper h(), state + merge, account sync (Claude only), FSRS wrappers,
                  romaji checking, backup codes, audio engine
app/views.js      shell/tabs, Today, Learn, Chart, Words, More (Sounds, Look-alikes, Settings, About)
app/session.js    picture/stroke/trace widgets, meet cards, the quiz engine, lesson/review/placement/drill flows, boot
app/style.css     design tokens (light + dark), every component; .pic-card keeps a paper look in both themes
content/content_kana.py   92 base kana: hook, story, Portuguese note, sound note, look-alike tip, example word
content/content_rest.py   voiced kana, combinations, extended katakana, lessons, 69 words, sounds lesson, look-alike groups
data/strokes.json         KanjiVG stroke paths (CC BY-SA 3.0, credit required)
data/illus/decor_all.json picture mnemonics: SVG drawn behind/in front of the strokes, colours via f-*/s-* classes only
data/fsrs/fsrs.iife.js    ts-fsrs 5.4.2 bundled as the global FSRSLib (esbuild of fsrs-entry.js)
assets/audio/{f,m}.json   337 MP3 clips per voice, base64; keys are "k:<kana>" and "w:<word>"
assets/fonts/             subset woff2 (Klee One, Zen Kaku Gothic New, Shippori Mincho B1; OFL)
assets/icons/             app icons (tools/make_icons.py)
tests/                    unit tests (node) and Playwright walkthroughs (python)
```

## Things that must not break

- **Saved progress.** It lives in localStorage key `lingoa-iapam-v1`; in the Claude version it is also stored at db doc `data/users/<id>/progress`. Keep the state shape backward compatible. `mergeState()` merges card by card, using the most recent review (`lr`) and honouring `resetAt`.
- **Backup codes.** The format is `LDI2.` + base64url(gzip(JSON state)). `LDI1.` (uncompressed) and older plain base64 codes must keep restoring. Codes move progress between the Claude version, the PWA and the single file, so all three must read each other's codes.
- **Card ids.** These are `<itemId>|r` (reading) and `<itemId>|l` (listening). Item ids are `h:あ`, `k:ア` and `w:<word kana>`. Renaming them orphans saved progress.
- **Audio keys.** Kana clips are `k:<hiragana reading>`. Words use `w:<kanji or kana>`, built by build_content.py. If you add a word or example, you must generate its audio (see below), or the app falls back to the device's own speech voice.
- **Service worker cache.** `build_variants.py` versions the cache with a hash of the assets automatically. Always rebuild before deploying.

## Audio (only needed for new words)

The clips were made with VOICEVOX core 0.16.2: style 30 (No.7, アナウンス) for the female voice and style 11 (玄野武宏) for the male. Pre-padding is 0.15 and post-padding 0.2. Kana use speed 0.9 with vowels 1.3× longer; words use speed 0.95.

- は and へ are synthesised from katakana, because hiragana alone is read as the particles "wa" and "e".
- 日本 is synthesised from にほん.
- Credit requirement: "VOICEVOX:No.7, VOICEVOX:玄野武宏".

To regenerate:

1. Install `voicevox_core` with the onnxruntime, open_jtalk dictionary and `vvms/4.vvm` + `vvms/6.vvm` from the VOICEVOX GitHub releases into `tools/voicevox/`.
2. Run `tools/gen_audio_voicevox.py` there. It skips clips that already exist.
3. Run `python3 tools/build_audio.py` to encode 40 kbps mono MP3 into `assets/audio/`.

Check readings with VOICEVOX's audio query: it shows the kana actually synthesised.

## Tests

```
node tests/test_unit.js                 # romaji acceptance and merge/reset logic
python3 tests/test_offline.py           # PWA offline reload, single-file version, backup-code round trip
python3 tests/test_flow2.py             # full lesson/review/words/placement/drill walkthrough (Claude build + mock account)
```

The Playwright tests expect local servers: `dist-pwa` on port 8766 and `dist` on port 8765 (`python3 -m http.server`).

## Style of the content

- English UI copy, plain and direct.
- Portuguese only where it is a perfect fit, marked PT.
- Mnemonics are original: never copy Tofugu, WaniKani or other published sets.
- Polite forms (です/ます) come first, because the goals are work, JLPT, media and travel.
