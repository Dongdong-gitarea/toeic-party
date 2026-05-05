# TOEIC PARTY — Project Rules

## Sync Protocol (Desktop ↔ Mobile Claude)

**IMPORTANT**: This project is edited from TWO environments:
- **Desktop Claude Code** (full terminal + file access)
- **Mobile Claude** (via GitHub web editor + auto-deploy)

### Before making changes:
1. Always `git pull` first
2. Read `CHANGELOG.md` to see what the other side changed
3. Do NOT rewrite files the other side recently modified — extend them instead

### After making changes:
1. Update `CHANGELOG.md` with what you changed (date + summary)
2. Commit + push immediately
3. If you modified `vocabChinese.ts`, make sure `lookupChinese()` function exists at the bottom

### File ownership:
- `vocabChinese.ts` — Desktop generates (script), Mobile should NOT manually edit
- `tslLoader.ts` — shared, be careful
- `frontend/src/lib/i18n.ts` — Mobile owns (translations)
- `frontend/src/app/*` — Mobile owns (UI/UX)
- `frontend/src/components/*` — Mobile owns (UI components)
- `backend/src/game/*` — shared, coordinate before changing

## Tech Stack
- Backend: Node.js + Express + Socket.io (port 3001/8080)
- Frontend: Next.js 15 + TailwindCSS v4 + Zustand
- Deploy: Railway (auto-deploy on push to main)

## Key URLs
- GitHub: https://github.com/Dongdong-gitarea/toeic-party
- Frontend: https://frontend-production-655f.up.railway.app
- Backend: https://toeic-party-production.up.railway.app

## Vocab System
- `vocabChinese.ts`: 526 words, English → Traditional Chinese, POS+length grouped distractors
- `tsl.json`: 1250 TSL words with English definitions
- `tslLoader.ts`: generates questions (vocab/audio/definition), weak-word bias
- `lookupChinese()`: maps English word → Chinese meaning for post-game review
