# Changelog

## 2026-05-05 (Mobile) — Hotfix: per-match word dedup
- Bug: with vocab + audio + fillblank each pulling questions independently from the same pool, the **same headword could appear twice in a single 10-question match** (once as vocab, once as audio). Players reported "單字好像都重複".
- Fix: `generateTSLQuestions` now passes a shared `excludeLower` set through each generator step; `pickWeighted` filters that set out of the pool before sampling. 200-game smoke test: 0 duplicates.
- Affected: `backend/src/data/tslLoader.ts`. No type-shape changes, no client changes needed.

## 2026-05-05 (Mobile) — Round 4 (In-game Feedback Pt. 2)
Five more in-game UX wins:
- **Reverse overtake banner**: when another player passes you, a rose-coloured "X passed you!" banner with a ChevronDown icon now mirrors the existing green ascending banner. Light haptic buzz instead of a celebratory rank-up tone.
- **"Waiting for N more…" indicator**: backend now broadcasts ANSWER_PROGRESS after each answer. When you've locked in but the round hasn't resolved yet, a small pulsing dot + "Waiting for {n} more…" appears at the bottom.
- **Audio question telegraph**: the question card flashes a fuchsia ring on each new audio question so you don't miss "this one's a listening question" before the auto-play kicks in.
- **Self skill cast pose**: hitting a skill button briefly swaps your header avatar to the cheer1 sprite for 600ms (with a tilt-pop) so the caster gets visible feedback (until now only the receivers saw an effect).
- **Compact answer buttons during review**: AnswerButton drops to min-h-12 / smaller padding once an answer is revealed, leaving more room for the question card's definition reveal.

## 2026-05-05 (Mobile) — Round 3 (In-game Feedback)
High-leverage in-game feedback / clarity work:
- **Review pause** lengthened from 4s → 5s when any human got it wrong (reading meaning + definition + example needs the extra second)
- **Timer urgency** beefed up: at ≤ 1s the pulse is bigger and faster (`timer-pulse-final`), and a red drop-shadow halo comes in at ≤ 3s and intensifies at ≤ 1s
- **Score breakdown** in the floating popup now also shows BASE / ⚡SPEED / 🔥COMBO chips so players learn why a fast/comboed answer scored more
- **Skill effect banner** (SHAKE / FOG / TIME CUT) gets a 2-second shrinking progress bar so the receiving player can see how long it'll last
- **Combo escalation**: at ≥ 5 the score row glows orange; at ≥ 7 a fullscreen "ON FIRE!" flash fires once on each new tier crossing
- **Review-phase ETA bar** at the bottom of /game shows when the next question is coming
- **Duplicate-character disambiguation**: the live ranking bar now puts a golden ring around the character icon for "you" so two players who picked the same character can still tell which one is them

## 2026-05-05 (Mobile) — Round 2 (Polish + Char Picker Move)
- Icon consistency pass:
  - /game: 2 hand-rolled speaker SVGs → Volume2; question-type pills get Brain / Headphones / FileText; isFinal + final-round overlay get Flame; combo gets Flame above ×3; +N / WRONG feedback gets Check / X; SHAKE!/FOG!/TIME CUT! banner gets Waves / CloudFog / TimerOff
  - /result: review-toggle ▼/▲ → ChevronDown / ChevronUp
  - /words: filter pills get Layers / Star / AlertCircle / CheckCircle2 with count moved to a small tabular badge
  - Home: rules text replaced with Users / ListChecks / Clock chips; lobby empty slot's "?" → UserPlus icon; populated slot card padding tightened (px-2.5 py-2, 14×14 avatar)
  - RankingBar + RankingPanel: rank #1 shows filled Crown
  - SettingsModal: title / language / close get icons
  - AddWordModal: title / cancel / submit get icons
- **Character picker moved from home page → lobby.** Players can now change character during the wait, and other players see updates live.
  - New socket event: `CHANGE_CHAR { charIdx }`
  - `LOBBY_UPDATE` payload now includes `charIdx` per player; legacy fallback to slot index for older clients/servers
  - Home CTA simplified from "START AS {char}!" → "START!"
  - Player slots in the lobby render each player's chosen character (was previously hardcoded to slot index)
- Stale i18n cleanup: removed `home.rules`, `home.startAs`

## 2026-05-05 (Mobile) — Sync Round
- Merged Desktop Rounds 1-4 (1156-word vocab + 1250 examples + better distractors)
- Adopted Desktop's `examples.json` as the single source of truth for example sentences; removed Mobile's hand-written `vocabExamples.ts` (50 entries, now superseded)
- Dropped vestigial `exampleZh` field everywhere — Desktop's DB is English-only; if Chinese examples come back later, add them as a separate field rather than reviving this one
- Plus this round's mobile-side work that pre-dated the merge:
  - Skills simplified to one-use-each per match (replaces 3-energy cost system)
  - All 34 emoji swapped to lucide-react icons (Settings / Dices / Crown / Zap / Flame / Volume2 / Star / RotateCw / BookMarked / Target / Users / Inbox / PartyPopper etc.)
  - Home redesign: private-room buttons collapsed into one "Play with friends" → bottom sheet; study row demoted to small icon row (BookMarked + Target with badge); mode buttons gained one-line descriptions ("快速 10 題" / "答錯出局"); Practice hidden + hint until ≥4 saved words
  - New `PlayWithFriendsSheet` component; `JoinRoomModal` deleted
  - PosBadge component for n./v./adj./adv. pills next to headwords
  - ExampleBlock highlights the headword in the example sentence
  - Server-side `sanitizePlayerName` filters control / zero-width / wide-space chars, slurs (EN+ZH leetspeak tolerant), and caps grapheme length

## 2026-05-05 (Desktop) — Round 7
- NEW question types integrated into gameplay:
  - **Confusable** (易混淆): "The new policy will have a major ___ on productivity." → affect vs effect
    - Rose-colored badge, fill-in-blank UI with rose underline
    - 20 confusable pairs with TOEIC-context sentences
    - After answering, definition reveals the difference (e.g. "affect 是動詞，effect 是名詞")
  - **Collocation** (搭配): "___ a deadline" → meet/submit/file/place
    - Emerald-colored badge, shows Chinese translation below
    - 25 TOEIC collocations (make a reservation, file a complaint, etc.)
- Question mix per 10-question game: ~3 vocab + ~3 audio + ~2 definition + 1 confusable + 1 collocation
- Headword de-duplication extended to cover all 5 types
- i18n keys added (zh + en) for both new types
- Frontend: AlertTriangle + Puzzle icons from lucide-react

## 2026-05-05 (Desktop) — Round 6
- Vocab: 1243 → 1283 words (added 40 ETS TOEIC Part 5/6/7 favorites)
  - Transition words: despite, although, nevertheless, furthermore, consequently, whereas
  - Grammar-test adjectives: comprehensive, feasible, provisional, stringent, versatile
  - Business nouns: infrastructure, milestone, grievance, commodity, quota
- NEW: `learningExtras.json` with two learning datasets:
  - **20 Confusable Pairs** (affect/effect, personal/personnel, complement/compliment, etc.)
    with Chinese explanations for each pair
  - **25 TOEIC Collocations** (make a reservation, submit a proposal, meet a deadline, etc.)
    with examples — ready for future "collocation quiz" mode
- 40 TOEIC-context example sentences added for new words
- ETS core coverage: 59% → 99%

## 2026-05-05 (Desktop) — Round 5
- Vocab expanded 1156 → 1243 words
  - Added 43 missing TOEIC core words (appointment, insurance, executive, etc.)
  - Added 44 topic gap fillers (HR, Marketing, Legal, etc.)
- TOEIC topic coverage: ALL 10 topics now 90-100% ✅
  (Office, HR, Finance, Marketing, Travel, Tech, Manufacturing, Legal, Real Estate, Customer Service)
- Example sentences improved: real 460→825 (62%), template 790→503 (38%)
  - 77 more fetched from Dictionary API
  - 66 hand-written TOEIC-context sentences for core words
- Total examples: 1328 (covers all vocab + extras)

## 2026-05-05 (Desktop) — Round 4
- Vocab expanded to 1156 words (translated remaining 38 missing TSL words)
- Added example sentences for ALL 1250 TSL words
  - 461 real examples from Dictionary API
  - 789 TOEIC-style template sentences as fallback
  - Stored in `backend/src/data/examples.json`
- New: `lookupExample()` function in tslLoader.ts
- Example sentences shown in post-game word review cards
- Types updated: ReviewWord + AnswerResult now include `example` field

## 2026-05-05 (Desktop) — Round 3
- Expanded vocab 1043 → 1119 words
- Fixed 2 duplicate distractor bugs (considerably, relocate)
- Added 43 extra TOEIC core words beyond TSL (litigation, procurement, demographic, etc.)
- Top 200 coverage: 98% (197/200)
- Total TSL coverage: 86% (1076/1250) + 43 extra TOEIC = 1119 total
- 0 duplicate distractors

## 2026-05-05 (Desktop) — Round 2
- Expanded vocab from 526 → 1043 Traditional Chinese words (83% TSL coverage)
- Added CET6 (5651 words) + TOEFL (13477 words) as additional sources
- Top 200 TOEIC coverage: 82% → 94%
- Fixed 9 bad translations (overtime→加班, transaction→交易, amateur→業餘者, etc.)
- Added 25 manual high-freq words (cellphone, laptop, café, résumé, etc.)
- Distractors grouped by POS + character length for better difficulty

## 2026-05-05 (Desktop) — Round 1
- Expanded vocab from 40 → 526 Traditional Chinese words
- Fixed `lookupChinese()` function (was deleted during merge)
- Improved distractors: grouped by POS + Chinese character length
- Source: TSL 1250 × CET4 7508 cross-reference, OpenCC s2t conversion
- Added CLAUDE.md (sync protocol) + CHANGELOG.md

## 2026-05-04 ~ 05-05 (Mobile)
- Added i18n (中文/English)
- Private rooms with room codes
- Ready-up lobby system
- Personal word notebook (/words page)
- Human voice pronunciations (Dictionary API + TTS fallback)
- Party UI theme (purple/pink gradients, blob animations)
- Weak-word bias (70% from previously wrong words)
- PWA manifest + haptics
- Brand intro animation
- Skills simplified to one-use-each per game
- Practice mode (/practice page)
- Saved words with star/mastered/practice filters

## 2026-05-04 (Desktop)
- Deployed to Railway (backend + frontend)
- Mobile-first layout redesign
- Touch controls for Jump Mode
- GameArena: CSS scale-transform, attack mechanic, 6 random layouts
- Kenney character sprites (4 characters, 8 poses each)
- TSL 1250 words integrated
- Audio questions: hear word → pick Chinese
- Definition questions: English definition → pick word
- Wave 1 juice (flash/shake/vignette/particles/overtake/final-round)
- Web Audio API synthesized sounds
- Character unlock system (3/5/10 games)

## 2026-05-03 (Desktop)
- Initial MVP: Socket.io real-time multiplayer, 4 players, 10 questions
- Classic mode (tap buttons) + Jump mode (platformer)
- Skill system (shake/fog/time-cut)
- Scoring: base + speed bonus + combo multiplier
