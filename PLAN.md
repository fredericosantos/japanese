# Lingoa de Iapam: Japanese app plan and build notes

*For Fred, a Portuguese (Portugal) speaker. Interface in English, with Portuguese hooks only where they fit perfectly. Status: **v1 built and published** (5 Oct 2026) as the private artifact "Lingoa de Iapam": https://claude.ai/artifact/6TD7rNxinwFAzeEJdjUp9n*

**Decisions (5 Oct 2026):** knows some katakana already → katakana starts with a quick placement check, and known characters skip straight to reviews · goals are work/living, JLPT, media and travel → polite forms (です/ます) first, with words tagged by JLPT level (N5 first) · 30+ min a day → default of 10 new characters a day (adjustable), with the extra time going to listening and word practice · v1 scope confirmed: sounds intro, all kana, ~60 starter words.

---

## 1. What the research says, and what the app does with it

| # | Principle | Evidence | What the app does |
|---|-----------|----------|-------------------|
| 1 | **Spaced repetition** | Distributed practice is one of only two techniques rated "high utility" in Dunlosky et al. (2013); see also Cepeda et al.'s (2006) meta-analysis. **FSRS**, an open-source scheduler built into Anki since v23.10, predicts forgetting better than the older SM-2 algorithm. | Every character and word is scheduled with FSRS (target retention ~90%). Each day you get a review queue, then new items. |
| 2 | **Retrieval practice** (the testing effect) | Roediger & Karpicke (2006). Also rated "high utility" by Dunlosky. | You always try to recall *before* the answer is shown. No passive re-reading. You recall by typing, choosing, or hearing the sound and picking the character. |
| 3 | **Mnemonics to get it in, SRS to keep it** | The keyword method (Atkinson & Raugh, 1975). Picture-and-sound kana mnemonics: Quackenbush & Ohso, *Hiragana in 48 Minutes* (1983). Dunlosky rated mnemonics lower because the gains **fade without review**. | Each character gets a picture story when you first meet it. FSRS keeps it alive after that. Once a card is mature (interval over ~3 weeks), the mnemonic is hidden by default, so you read the character directly. |
| 4 | **Dual coding** (image + word + sound) | Paivio. Multiple memory routes to the same item. | A drawing where the character's strokes are highlighted inside the picture, a one-line story, and native audio, all together. |
| 5 | **Discrimination practice** | Interleaving and contrast help with confusable items. | After both characters of a look-alike pair are learned, dedicated "spot the difference" drills: シ/ツ, ソ/ン, ぬ/め, わ/れ/ね, る/ろ, さ/ち, は/ほ, ク/ケ/タ. |
| 6 | **Handwriting helps form; typing helps sound** | Guan et al. (2011, *J. Educ. Psych.*): handwriting strengthened character form and meaning, while typing strengthened the link to sound. The combination worked best. | Optional finger-tracing with stroke-order animation, alongside listening and typing drills. |
| 7 | **Audio first, wean off romaji** | Romaji ties Japanese sounds to English spelling habits. | Romaji appears only when you first meet a character, then disappears. Everything has audio, and some cards are listening-only. |
| 8 | **Small batches, short sessions** | Working-memory limits; consistency matters more than volume. | About 5 new characters per lesson, 10–15 min a day by default. Sessions end on a success. The streak is gentle and allows rest days. |
| 9 | **Meaningful input early** | Comprehensible input; words beat isolated symbols. | Kana are practised inside real words as soon as possible, starting with words you already know (see §2). Short readable phrases follow. |
| 10 | **Shadowing** | Studies with L2 learners show gains in prosody and fluency. | A later mode: hear a phrase, repeat it, and optionally record yourself to compare (if your browser allows the microphone). |

---

## 2. Your Portuguese advantage (where Portuguese examples appear)

**Pronunciation, where Portuguese beats English:**
- **Vowels** あいうえお are pure, like Portuguese stressed vowels, without English-style diphthongs. え sits between *ê* and *é*; お sits between *ô* and *ó*.
- **ら行 "r"** is a tap, the same sound as the single *r* in *caro* or *para*. English speakers struggle with this one; you get it for free.
- **し** is close to Portuguese *x/ch* (*chá*). **ちゃ** sounds like *tcha* in *tchau*. **にゃ/にょ** sound like *nha/nho* in *vinho*.
- **Swallowed vowels**: です sounds like "dess" and します like "shimass". European Portuguese already reduces unstressed vowels, so this will feel natural.
- **ん** at the end of a word is a bit like the nasal ending in *bom* or *sim*.

**Words Japanese took from Portuguese (16th-century Nanban trade).** These are ideal first katakana words:
パン *pão* · ボタン *botão* · コップ *copo* · タバコ *tabaco* · カステラ *pão de Castela* · ベランダ *varanda* · マント *manto* · カボチャ *Camboja* (pumpkin) · てんぷら *tempero / têmporas* · ビロード *veludo* · カルタ *carta* · シャボン *sabão* · 合羽 かっぱ *capa*

**Myth buster:** ありがとう does **not** come from *obrigado*. It comes from the native word *arigatashi* ("rare, precious"), which is attested centuries before the Portuguese arrived.

**Bonus link:** お茶 *ocha* = tea, and Portuguese *chá* = tea. Both come from Chinese.

---

## 3. Curriculum

| Stage | Content | Notes |
|-------|---------|-------|
| 0. Sounds of Japanese | 5 vowels, rhythm (morae), long vowels, small っ, ん, an intro to pitch | One short audio lesson |
| 1. Hiragana | 46 base characters, then dakuten (が, ぱ…) and combinations (きゃ…) | ~12 lessons of ~5 characters, in chart-row order; contrast drills unlock once both characters of a pair are known |
| 2. Katakana | Same structure, starting with the Portuguese loanwords, then English ones | Extra look-alike drills (シツソン) |
| 3. First words and phrases | ~300–500 high-frequency survival words and phrases | Audio, pitch-accent line, and an example sentence for each |
| 4. Kanji via components | First ~100–250 kanji, built from parts with mnemonic stories | Readings learned through words, not lists |
| 5. Reading and grammar in context | Graded mini-stories with audio; tap a word to see its meaning | Grammar is introduced inside sentences |

---

## 4. Life of a character (the lesson loop)

1. **Meet**: a large character with a stroke-order animation and audio (tap to replay, or play it slowly). The picture mnemonic shows the strokes highlighted inside the drawing, with a one-line story and a sound hook (English, or Portuguese marked **PT** when it fits better).
2. **Trace** (optional): draw it with your finger.
3. **Use**: one or two example words with audio, preferably words you might already know.
4. **Quiz**: recall straight away (character → sound, then sound → character), mixed in with earlier characters.
5. **Review**: the card joins your FSRS review queue.

You can **write your own mnemonic** for any card. Personal ones often stick better.

**Sample mnemonics** (all original, written for this app):
- **め (me)**: an eye with a curling lash. In Japanese, 目 *me* actually means "eye".
- **ぬ (nu)**: like め but with a knot at the end of the tail: noodles tied in a loop. Shown next to め as a contrast pair.
- **ら (ra)** **PT**: a little *rã* (frog) sitting up, with the small tick above as its eye.
- **き (ki)**: an old-fashioned key, with the crossbars as its teeth.
- **つ (tsu)**: a breaking wave, as in *tsunami*.
- **の (no)**: a "no entry" sign, a circle with one sweeping slash.

---

## 5. Audio

- Every character, word and sentence has audio, with autoplay on reveal (can be switched off) and a slow-speed button.
- **Source (decided at build time):**
  (a) your device's built-in Japanese voice: instant, free and offline. It sounds good on iPhone, Mac and Android.
  (b) I will also try to bundle natural-sounding clips for the kana and core words, for consistency. If that isn't feasible, the app falls back to (a).
- **Listening drills**: hear the sound and pick the kana. Later, minimal pairs: びょういん (hospital) vs びよういん (hair salon), おばさん (aunt) vs おばあさん (grandmother), きて vs きって.
- **Pitch accent** (from Stage 3): a small line over each word showing high and low pitch. It can be toggled off.

---

## 6. Daily flow and motivation

- The home screen shows "Today: 12 reviews · 5 new". Reviews come first, then new material.
- Default session cap of 10 minutes, adjustable.
- A kana chart that fills with colour as each character's memory strength grows.
- A gentle streak with rest days allowed. No points or leaderboards; the focus stays on your own progress.

---

## 7. Technical approach

- A single, mobile-first web app published as a **private page on claude.ai**, so it opens on your phone and laptop. Large tap targets, light and dark modes.
- **Progress synced to your account** (private per user), so phone and laptop share one review queue. Export/import as a backup.
- **FSRS** runs inside the page (based on the open-source ts-fsrs library).
- **Stroke-order data** from KanjiVG (CC BY-SA 3.0), credited in the app.
- An optional **"Ask Claude"** button (explain a word, make a new example sentence). It uses your Claude usage, so it is off by default.

---

## 8. Roadmap

- **v1 (next build):** Sounds intro + all hiragana + all katakana + ~60 starter words (including the Portuguese loanwords) + FSRS reviews + audio + picture mnemonics + tracing + look-alike drills + progress sync.
- **v2:** 300–500 survival words and phrases, pitch accent, listening minimal pairs.
- **v3:** Kanji through components (first 100–250) and graded readings.
- **v4:** Grammar in context, shadowing mode, Ask Claude tutor.

---

## 9. Answers from Fred

- Level: knows some katakana.
- Goals: work/living in Japan, JLPT, anime/games/media, travel.
- Time: 30+ min a day.
- v1 scope: confirmed as proposed.

---

## Sources
- Dunlosky et al. (2013), *Improving Students' Learning With Effective Learning Techniques*, Psychological Science in the Public Interest. https://www.citedrive.com/en/discovery/improving-students-learning-with-effective-learning-techniques
- Guan, Liu, Chan, Ye & Perfetti (2011), *Writing strengthens orthography and alphabetic-coding strengthens phonology in learning to read Chinese*, J. Educ. Psych. https://www.lrdc.pitt.edu/perfettilab/pubpdfs/Writing%20strengthens%20Guan%20JEP.pdf
- Hatasa, *Teaching Japanese Syllabary With Visual and Verbal Mnemonics*, CALICO Journal (based on Quackenbush & Ohso, *Hiragana in 48 Minutes*). https://journal.equinoxpub.com/Calico/article/view/2050
- *List of Japanese words of Portuguese origin*, Wikipedia. https://en.wikipedia.org/wiki/List_of_Japanese_words_of_Portuguese_origin
- Open Spaced Repetition, SRS benchmark (FSRS vs SM-2). https://github.com/open-spaced-repetition/srs-benchmark
- Also: Roediger & Karpicke (2006); Cepeda et al. (2006); Atkinson & Raugh (1975).


---

## 10. v1 as built (5 Oct 2026)

**Name.** *Lingoa de Iapam*, after the *Vocabulario da Lingoa de Iapam* (Jesuits, Nagasaki, 1603), the first big Japanese–European dictionary, which was Portuguese.

**Content**
- 221 kana: 46 hiragana and 46 katakana, each with an original mnemonic and a picture; 25+25 voiced kana; 33+33 combinations; 13 extended katakana.
- 31 lessons. Recommended order: Sounds → h1–h10 → katakana check → k1–k10 → voiced → combinations.
- 69 starter words: Portuguese loanwords, everyday loanwords, polite phrases for work, and N5 core words. Words unlock once all their kana are known.
- Sounds lesson: vowels, beats, long vowels, small っ, swallowed vowels, pitch, r, fu/tsu.
- 32 look-alike groups with drills.

**Features**
- FSRS scheduling (ts-fsrs 5.4.2, 90% retention, learning steps of 1 and 10 minutes). Each kana and word has two cards: read (type the romaji, or choose) and listen (pick the kana or meaning).
- Grading is automatic: wrong → Again, slow or hinted → Hard, otherwise Good.
- Picture hints appear in reviews only until a card is mature (stability ≥ 21 days).
- Stroke-order animation (KanjiVG), finger tracing, and a "write your own story" box on every base kana.
- Kana chart shaded by memory strength.
- Progress is saved to Fred's private account storage (`data/users/<id>/progress`, a single document) and merged card by card across devices. localStorage holds a local copy, and a backup code covers export and restore.

**Audio.** VOICEVOX, with two voices so you hear more than one speaker: No.7 (アナウンス, style 30) and 玄野武宏 (style 11).
- Settings: pre-padding 0.15 and post-padding 0.2. Kana are synthesised at speed 0.9 with vowels 1.3× longer; words at speed 0.95.
- Clips are 40 kbps mono MP3, packed as `audio/f.json` and `audio/m.json` (337 clips per voice).
- は and へ are synthesised from katakana, because hiragana alone is read as the particles wa and e. 日本 is synthesised from にほん (OpenJTalk reads it as ニッポン).
- If a clip is missing, the browser's own Japanese voice is used.

**How the page is built.** It is a single HTML page.
- `window.__C` holds the content JSON, `window.__S` the KanjiVG stroke paths, and `window.__P` the picture decorations (classes `f-*` and `s-*`, drawn behind and in front of the strokes).
- Then come the inline ts-fsrs bundle and the app script (core → views → session).
- To change the app, read the artifact's index.html and edit it, or rebuild from the sources, then republish to the same URL.

## 11. Next (v2 ideas)
- 300–500 survival words and phrases with example sentences; pitch-accent lines (OpenJTalk gives the accent position).
- Listening drills with minimal pairs; a shadowing mode.
- The first 100–250 kanji, taught through their components.
- An optional "Ask Claude" button to explain a word or make a new example.


## 12. Offline version (2 Nov 2026)
- **Builds** (`build_variants.py`): the Claude artifact; an installable web app (`site/`) meant for **japanese.fsx.app** (CNAME included); and a single double-click HTML file for the computer, with audio and fonts inline.
- **Offline storage:** a service worker stores everything on the device. Fonts are subset woff2 files (Klee One, Zen Kaku Gothic New, Shippori Mincho B1, OFL), and the icon is a vermilion 語 seal on a genkō cell.
- **Progress:** each copy keeps its own on the device. Backup codes move it between copies: `LDI2.` + base64url(gzip(JSON)). Restoring merges card by card, and older plain-base64 codes are still accepted. The Claude version was republished (v2) with the same backup format.
- **Hosting:** GitHub Pages (a new repo `japanese`, plus a CNAME record `japanese` → `<user>.github.io`), or Cloudflare Pages if fsx.app's DNS is on Cloudflare. Package: `lingoa-offline-app.zip`, with a README.
- **Status on 2 Nov:** Fred's account copy still holds the 8 October progress (lessons h1–h2, 10 kana).
