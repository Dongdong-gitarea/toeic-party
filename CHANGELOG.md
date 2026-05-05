# Changelog

## 2026-05-05 (Desktop)
- Expanded vocab from 40 → 526 Traditional Chinese words
- Fixed `lookupChinese()` function (was deleted during merge)
- Improved distractors: grouped by POS + Chinese character length
- Source: TSL 1250 × CET4 7508 cross-reference, OpenCC s2t conversion

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
