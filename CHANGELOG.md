# Changelog

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
