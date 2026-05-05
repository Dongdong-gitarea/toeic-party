# Changelog

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
