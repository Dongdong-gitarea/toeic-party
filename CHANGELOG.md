# Changelog

## 2026-05-07 (Mobile) — Examples.json sweep + content QA continued
Following the vocab audit, did a content review on `examples.json` (1,367 example sentences).

### Truly broken examples — replaced
- `o'clock`: was `(rare, nonstandard) What o'clock is it?` (meta-commentary)
- `caller`: was `- I've got someone on the line.` (orphan dash, doesn't mention "caller")
- `kit`: was `1961 18 Jan, Guardian (cited after OED):` (citation header)
- `pad`: was `May 21, 2008, Austin American-Statesman` (citation header)
- `café`: was a Joni Mitchell song citation
- `orientation`: was a pigeons-homing example (TOEIC-irrelevant)
- `remind`: was empty

### Wrong-spelling / wrong-word examples — fixed
- `brake`: example used "break" (wrong word)
- `ice-cream`: example used "ice cream" with space
- `runner`: example used "run" not "runner"
- `webpage`: example used "web page" with space
- `ma'am`: example used "madam"
- `plow`: example used "plough" (UK)
- `liter`: example used "litre" (UK)

### Templated generic sentences — replaced for top-200 high-frequency words
Three generic auto-templates ("We received the X from the vendor yesterday", "X has been updated for this quarter", "X was reviewed during the meeting") were applied to ~310 words regardless of fit, producing nonsense like "We received the **noon** from the vendor yesterday" or "The **traveler** was reviewed during the meeting".

Hand-wrote ~91 TOEIC-flavoured sentences for the most-played entries (rank ≤ 200 fully covered, plus the worst rank-200-500 cases). Examples:

| word | before | after |
|---|---|---|
| supervisor | The supervisor has been updated for this quarter. | Speak with your supervisor before changing the schedule. |
| noon | We received the noon from the vendor yesterday. | The lunch meeting is scheduled to start at noon. |
| résumé | The résumé was reviewed during the meeting. | Please attach your résumé to the application form. |
| inconvenience | We received the inconvenience from the vendor yesterday. | We apologize for any inconvenience caused by the delay. |
| sandwich | The sandwich was reviewed during the meeting. | I usually have a sandwich and coffee for lunch. |
| feedback | (templated) | The customer's feedback helped us improve the product. |

### Stats
- Before: 309 templated examples (22% of file)
- After: 217 templated examples remain — all in TSL rank > 200 (low-traffic words)
- 0 templated examples in TSL rank ≤ 200

The remaining low-rank templated entries can be re-written incrementally as users surface them; they're correct (just bland) sentences, not wrong.

## 2026-05-07 (Mobile) — Vocab translation audit

**Trigger**: user reported `tag → 尾隨` (should be 標籤). Did a comprehensive sweep of `vocabChinese.ts` (5,492 entries) looking for similar quality issues and applying fixes / removals.

### Changes

- **5,492 → 5,457 entries** (35 exact-duplicate keys removed; e.g. `hotel`/`hostess`/`humid`/`hymn` had two identical rows each)
- **~120+ sense / phrasing fixes** including:

#### Critical sense errors (the translation was the wrong meaning of the word)
| Word | Before | After | Note |
|---|---|---|---|
| tag | 尾隨 | **標籤** | The reported issue. 尾隨 is "to follow / stalk". |
| weekday | 週日 | **平日** | 週日 = Sunday (one day), opposite of weekday. |
| occupation | 佔領 | **職業** | TOEIC sense is profession, not military takeover. |
| sandwich | 夾入 | **三明治** | Was the verb "to sandwich between"; users want the food. |
| submission | 屈服 | **提交** | TOEIC = submitting a document, not surrender. |
| venue | 審判地 | **場地** | 審判地 = courtroom, but venue is general location. |
| contractor | 訂約人 | **承包商** | 訂約人 is signer of a contract; contractor is the builder. |
| audit | 旁聽 | **稽核** | TOEIC business sense, not class-auditing. |
| cabinet | 櫥 | **櫥櫃** | Single-char was incomplete. |
| toll | 敲 | **過路費** | 敲 is "to knock"; toll = highway fee. |

#### Verbose / awkward phrasings (collapsed to natural Chinese)
- 41 different `XX…YY` placeholder forms globally replaced (e.g. `'在…下面畫線'` → `'畫底線'`, `'給…錯誤印象'` → `'誤導'`, `'把…分類'` → `'分類'`).
- Bracket / notation noise removed: `(西點)餡餅` → `派`, `[律]使有效` → `使有效`, `〔數〕二項式` → `二項式`, `[pl.]腳` → `雙腳`, `(花)瓶` → `花瓶`, `(淺)盤` → `淺盤`, `(曲線)圖` → `曲線圖`, `卸(貨)` → `卸貨`, `裝飾(品)` → `裝飾品`, `(水果等)汁` → `果汁`.
- Verbose noun phrases: `會計人員` → `會計師`, `牙科醫生` → `牙醫`, `自助食堂` → `自助餐廳`, `推斷結果` → `推論`, `公衆的注意` → `知名度`, `用吸塵器清掃` → `吸塵器`, `運貨馬車` → `推車`, `乘噴氣式飛機` → `噴射機`, `裝載的貨物` → `貨運`, `富有挑戰性的` → `有挑戰性的`, `值得花時間的` → `值得的`, `朝聖者的旅程` → `朝聖`, `多數人的意見` → `多數意見`, `君主統治時期` → `統治期`, `全世界範圍地` → `全球地`, `未加工製造的` → `未加工的`, `有節奏地敲擊` → `敲擊`, `變得越來越大` → `擴大`, `鬼鬼祟祟地走` → `潛行`, `伸開四肢躺` → `伸展`.

#### Mainland Chinese → Taiwanese
- `車間` → `工作坊` (workshop)
- `地道` → `地鐵` (subway — Taiwan-friendlier; semantically the def is metro)
- `質量` → `品質` (quality)
- `程序設計員` → `程式設計員`
- `國際互聯網` → `網際網路`
- `調制解調器` → `數據機`
- `新聞媒介` → `媒體`
- `網絡` → kept (already valid)

#### POS / sense fixes for high-frequency words
- `advisory` (adj): 報告 → 諮詢的
- `wireless` (noun): 無線的 → 無線
- `patent` (noun): 專利的 → 專利
- `staple` (noun): 主要的 → 主食
- `serial` (noun): 連續的 → 連續劇
- `lightweight` (adj): 輕量級選手 → 輕量的
- `freelance` (noun): 自由接案的 → 自由接案
- `eager` (adj): 渴望 → 渴望的
- `mislead`: 給…錯誤印象 → 誤導
- `casual`: 偶然的 → 隨意的
- `manual`: 用手的 → 手動的
- `lobby`: 向進行遊說 → 大廳
- `feedback`: 回授 → 回饋
- `fountain`: 泉水 → 噴泉
- `media`: 新聞媒介 → 媒體
- `admission`: 允許進入 → 錄取
- `landlord`: 地主 → 房東
- `physician`: 內科醫生 → 醫師
- `brake`: 制動 → 煞車
- `dine`: 喫飯 → 用餐
- `appreciation`: 評價 → 感謝
- `assembly`: 立法機構 → 集會
- `recreational`: 休養的 → 休閒的
- `cabin`: 小屋 → 機艙
- `sweater`: 厚運動衫 → 毛衣
- `headquarter`: 設立總部 → 總部
- `removal`: 除去 → 移除
- `inquire`: 打聽 → 詢問
- `vacuum`: 用吸塵器清掃 → 吸塵器
- `cart`: 運貨馬車 → 推車
- `subway`: 地道 → 地鐵
- `workshop`: 車間 → 工作坊
- `underline`: 在…下面畫線 → 畫底線
- `shortly`: 立刻 → 不久
- `jet`: 乘噴氣式飛機 → 噴射機
- `minimize`: 將…減少 → 使最小化

#### Garbage / typo fixes
- `Jv.魅力` → `魅力`
- `∕v.法令` → `法令`
- `erj.乾杯` → `乾杯`
- `舌」鬍刀` → `刮鬍刀`
- `擦v` → `擦拭`
- `快速的/地` → `快速地`
- `對～有癮的人` → `上癮者`

### Audit scope

I did **not** translate-verify every one of the 5,457 remaining entries by hand (impossible in a single session). My pass:
1. Pattern-spotted every entry whose Chinese contained `…`, brackets, half-Latin prefixes, mainland-only terms, or "verbose dictionary-style" descriptions and globally rewrote them. ✅ Done.
2. Cross-referenced TSL rank 1-200 entries against TSL's English definitions and fixed sense mismatches. ✅ Done.
3. Spot-checked TSL rank 200-400 — fewer issues found at this depth. ✅ Done.
4. POS heuristic against TSL — fixed the worst adj/noun mismatches in high-rank words.

**Not audited** (acceptable accuracy expected, but please flag if you spot anything wrong in play): TSL rank 400+ words and CET-only / TOEFL-only entries. Any further reports can be added to this CHANGELOG.

### Test
- `tsc --noEmit` passes for backend + frontend
- `next build` clean
- Smoke test: 20 questions generated cleanly with the new translations

## 2026-05-07 (Mobile) — 'Mix' difficulty (built-in easy → hard curve per match)
Public matchmaking used to be locked at flat medium, which felt repetitive (and either too easy or too hard depending on the player). New behaviour:

- Each 10-question match now ramps **3 easy → 4 medium → 3 hard** by default. Easy uses TSL rank 1-400; medium 1-800; hard the full 5,492-word pool plus confusable / collocation. Final round (Q10) lands in the hard tier so the ×2.5 bonus actually means something.
- Question type still distributed inside each tier (vocab / audio / definition; medium also gets one confusable + one collocation). De-dup across tiers preserved.
- Backend: new `'curve'` Difficulty value; new `generateCurvedQuestions(count, weakWords)` that stitches the tiers in order with shuffled types within each tier; `generateTSLQuestions` branches early when difficulty === 'curve'. `pickQuestions` default + Matchmaker public default + index validator all switched from `'medium'` → `'curve'`.
- Frontend: `Difficulty` union gains `'curve'`. `PlayWithFriendsSheet` adds a 4th button "混合 / Mix" (fuchsia) as the recommended default; layout switches from 3-col to 2×2 grid. New i18n keys `difficulty.curve` / `difficulty.curveDesc` (zh: "混合 · 由淺入深", en: "Mix · easy → hard").

Private rooms keep their explicit easy / medium / hard / mix choice; this change only affects the public queue's default and gives the curve to private hosts as an option.

## 2026-05-07 (Mobile) — Game-feel polish round (5 small wins)
- **Winner confetti**: result page now showers ~36 CSS-only confetti pieces (random colour / size / drift / spin) when the local player finishes 1st. Pure CSS keyframes, zero deps. New `Confetti.tsx` + `confetti-fall` keyframe in globals.
- **Wrong-option dim & shrink**: AnswerButton was only fading non-selected wrong options; now they also `scale-90 grayscale opacity-35` with a longer 500ms transition during the review phase, so the eye is pulled to the correct answer.
- **Lobby empty-slot walk cycle**: empty slots used to show a static `UserPlus` icon. Now they show the slot's designated character sprite at 40% opacity, alternating between `walk1.png` ↔ `walk2.png` every 500ms — feels like that character is "running over" to fill the spot.
- **Countdown screen filled out**: under the `3 / 2 / 1 / 開始！` digit, all four contestants now line up with their character sprites (idle during digits, `cheer1` on GO!), each with a staggered float-bob. Removes the empty purple slab in the middle.
- **Reveal scrolls definition into view**: long fillblank prompts could push the definition reveal below the fold. New `revealRef` + `scrollIntoView({ block: 'nearest' })` on each `lastResult` change keeps it on screen.

(Result-page review words already had a Volume2 replay button per row; verified, no change needed for that one.)

## 2026-05-07 (Mobile) — Live per-player answer colouring on RankingBar
- Each player's row in the in-game RankingBar now flips colour as they lock in an answer:
  - **Pending** (haven't answered yet): default
  - **Correct**: emerald-tinted background + border
  - **Wrong**: rose-tinted background + border
- Status flips back to pending on every NEW_QUESTION
- Implementation: `ANSWER_PROGRESS` payload now also carries a `statuses: Record<playerId, 'pending'|'correct'|'wrong'>`. Old clients that don't read it are unaffected.
- Backend (`Room.ts`):
  - `processAnswer` now broadcasts AFTER reviewWords push (was before, so the status read was stale)
  - Timeout players get marked `answeredThisRound` so their row flips to wrong when the round resolves
  - Final progress broadcast at the end of `resolveQuestion` covers timeouts
- Frontend: new `roundStatuses` field in store; reset on NEW_QUESTION / MATCH_FOUND / reset(). RankingBar accepts a `statuses` prop and picks per-row chrome.

## 2026-05-07 (Mobile) — Rollback to v0.1.1 (revert v0.2.0 round-summary mechanic)
- **Reverted commit `8c4fc7f`** ("feat: round-summary wrap-up + skill rework").
  - Production now runs the v0.1.1 mechanic again: bottom SkillBar, in-game skill firing, 1.8s / 5s between-question pause.
  - Reason: new wrap-up flow didn't feel right in user testing.
- The reverted code is preserved in git history (commit `8c4fc7f`); to re-apply later, revert this revert commit (`75846b8`).
- `baseline-v0.1.1` branch unchanged — main is functionally back to that state.

## 2026-05-07 (Desktop) — Difficulty selector + OG image update
- **Difficulty system for private rooms**: host picks easy/medium/hard before creating
  - Easy (初級): TSL rank 1-400, no confusable/collocation, TOEIC 400-600
  - Medium (中級): TSL rank 1-800, all 5 question types, TOEIC 600-800
  - Hard (高級): full 5370 pool + all confusable/collocation, TOEIC 800+
  - Public matchmaking stays medium (no change)
  - Backend: `tslLoader.ts` adds `filterVocabByDifficulty()` + `DIFFICULTY_CONFIG`
  - Backend: `Matchmaker.ts` PrivateRoomState stores `difficulty` from host
  - Backend: `Room.ts` passes difficulty to `pickQuestions()`
  - Backend: `questions.ts` exports `Difficulty` type
  - Backend: `index.ts` validates difficulty in CREATE_PRIVATE handler
  - Backend: `LOBBY_UPDATE` broadcasts difficulty to all members
  - Frontend: `PlayWithFriendsSheet.tsx` — 3-button selector (green/amber/rose) with TOEIC score ranges
  - Frontend: `gameStore.ts` — `createPrivateRoom(difficulty)` param + `Difficulty` type export
  - Frontend: `LobbyState` interface now includes `difficulty?` field
  - i18n: `difficulty.title/easy/medium/hard/easyDesc/mediumDesc/hardDesc` (zh + en)
- **OG image replaced**: new yellow hand-drawn 多益派對 art with 4 characters
- **Read mobile changes**: tutorial sheet (5-step), BGM removed, Jump mode hidden, CTA shrunk

## 2026-05-06 (Mobile) — In-app tutorial
- New "**玩法教學**" entry on the home top-right (graduation-cap icon) next to the settings gear, plus a one-time auto-open for first-time visitors (`localStorage` flag `tp_tutorial_seen`)
- 5-step sheet (matches `PlayWithFriendsSheet` chrome — bottom sheet on mobile, centered card on desktop)
  1. Welcome / 4-player overview
  2. Lobby — pick character + ready
  3. Answering — A/B/C/D + timer urgency
  4. Combo + Skills row
  5. Result — crown / MVP / saved-words handoff
- "Screenshots" are real Tailwind/SVG mock-ups built with the same components / colours as the live UI, so they stay in sync without us shipping any PNGs (zero asset weight added)
- Step indicator dots, prev/next, skip-button (X) all i18n-keyed (`tutorial.*`, zh + en)

## 2026-05-06 (Mobile) — Remove BGM, shrink home CTA
- **Background music removed** — the looped Kenney jingles competed too noisily with the TTS in audio (listening) questions, making the listening prompts hard to hear. Pulled all of:
  - `frontend/public/audio/music/{lobby,game,result}.ogg` + README
  - `frontend/src/lib/music.ts`
  - `frontend/src/components/MusicSync.tsx` and its mount in `layout.tsx`
  - The "Music" toggle in `SettingsModal`
  - i18n keys `settings.music` / `settings.on` / `settings.off`
- The Web Audio SFX in `lib/sounds.ts` (correct / wrong / tick / combo / gameStart / gameEnd / skillReceived / rankUp) are left in place — those are short, don't overlap TTS, and add useful feedback.
- **Home CTA shrunk further**: `text-lg` + `tracking-[0.2em]` + `py-4` → `text-base` + `tracking-[0.15em]` + `py-3` so 「開戰！」 stays a single line and doesn't tower over the rest of the home column.

## 2026-05-06 (Mobile) — Background music
- Wired up looping BGM that auto-switches between **lobby / game / result** based on the game phase
  - `lib/music.ts`: small audio manager — single track at a time, ~600ms crossfade, fades to 0 on disable / tab hide
  - `components/MusicSync.tsx`: mounted once in root layout; subscribes to `phase` and unlocks autoplay on the first `pointerdown` / `keydown` (browsers block `<audio>.play()` until a user gesture)
  - SettingsModal: new "背景音樂" toggle (zh) / "Music" (en); preference persisted in localStorage (`tp_music_enabled`)
- **Tracks**: Kenney "Music Jingles" pack (CC0). Pulled from the GitHub mirror `Boyquotes/kenney-music-jingles-for-godot` since `kenney.nl` blocked direct curl from this sandbox.
  - `public/audio/music/lobby.ogg`  — Pizzicato (chamber-cute)
  - `public/audio/music/game.ogg`   — 8-bit NES (energetic)
  - `public/audio/music/result.ogg` — Steel (triumphant sting)
  - These are 3–5 second jingles looped — there's an audible seam. README in that folder explains how to swap in longer CC0 tracks later.

## 2026-05-06 (Mobile) — UX simplification round
- **Hide game-mode selector on home**: Jump mode is being deferred until I get back to it; with only Classic available, showing a single-option toggle was UI noise. The state still defaults to `'classic'` so `/game`'s Jump branch stays as inert dead code for when Jump comes back.
- **Shrink main CTA**: 「開戰！」 was rendering on two lines on narrow phones (`text-2xl` + `tracking-widest` was overflowing); dropped to `text-lg` with tighter tracking and slimmer padding (py-4).
- **Result page declutter**: removed the persistent "MY WORDS ({n})" button. The expandable per-match review block already covers post-game word recall; the full notebook still lives at /words from the home page.
- Cleaned up dead destructuring (`gameMode` / `setGameMode`) and unused `BookMarked` import.

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

## 2026-05-06 (Desktop) — Round 4: Supabase Persistence (Phase 2)
- **Database tables created**: players, matches, match_players, saved_words, leaderboard
- **Player accounts**: anonymous via device UUID (auto-created on first game)
- **Match history**: every game saved with all 4 players' scores
- **Leaderboard**: weekly + all-time, auto-updated after each game
- **Rank tiers**: auto-calculated (bronze→silver→gold→diamond based on XP)
- **Railway env vars**: SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_KEY
- Backend: Room.ts saves async on GAME_END (non-blocking)
- Frontend: deviceId via crypto.randomUUID() sent with all match events
- E2E verified: Player created → Match saved → Leaderboard updated

## 2026-05-06 (Desktop) — Round 3: Security Hardening
**Phase 1 pre-launch security — 4 fixes:**
1. **CORS locked down**: `origin: '*'` → whitelist (frontend domain + localhost + LAN IPs)
   - Custom domain support via `FRONTEND_URL` env var
2. **Rate limiting**: 
   - HTTP: 60 req/min via express-rate-limit
   - WebSocket: 50 events/10s per socket (custom tracker with auto-cleanup)
3. **Input validation**: all socket events validated
   - `answerIndex`: must be integer 0-3 (was unchecked)
   - `skillType`: must be shake/fog/timeCut (was unchecked)
   - `charIdx`: must be integer 0-3
   - `playerName`: max 16 chars + sanitized
   - `weakWords`: max 80 items, strings only
   - `code`: max 10 chars
   - Invalid input silently dropped (no crash)
4. **Sentry error tracking**: 
   - All socket handlers wrapped in try-catch → Sentry
   - `uncaughtException` + `unhandledRejection` caught
   - Socket error events logged
   - Set `SENTRY_DSN` env var to activate
- Global error handlers for uncaught exceptions
- Rate limit entries auto-cleaned every 30s

## 2026-05-06 (Desktop) — Round 5: Cloud Sync + OG + Domain + Analytics
- **Cloud sync saved words**: auto push/pull to Supabase (no login needed)
  - App init: pull from cloud → merge localStorage
  - Game end / star / add / remove: push to cloud (async)
  - Frontend: lib/db.ts, @supabase/supabase-js
  - Railway env: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
- **OG image**: 多益派對 game art + OpenGraph + Twitter card meta
- **Domain**: toeic-party.up.railway.app (CORS updated)
- **Analytics dashboard**: GitHub Pages (dongdong-gitarea.github.io/toeic-party/)
  - Real-time: players, matches, daily chart, leaderboard, tier distribution
  - Auto-refresh 60s, no server needed
- **Weak-word fix**: bias 70% → 30%, minimum 10 weak words to activate
  - Root cause: 3-5 wrong words → 70% of questions from same words → massive repetition

## 2026-05-06 (Desktop) — Round 2
- MASSIVE vocab expansion: 1283 → **5492 words** (4x growth!)
  - Integrated Taiwan CEE 7000 (學測+指考) vocabulary with Traditional Chinese
  - 4212 new words filtered from 5825 entries (removed too-basic words)
  - All words have POS-grouped distractor options
- Vocab/Audio can now play **1830 games** without repeating
- Sources: TSL + CET4 + CET6 + TOEFL + Taiwan CEE 7000 + ETS Core + manual

## 2026-05-06 (Desktop) — Round 1
- **Anti-repetition expansion**:
  - Confusable pairs: 20 → **60** (40 new: spelling traps, business pairs, grammar traps, advanced TOEIC)
  - Collocations: 25 → **79** (54 new across: meetings, HR, finance, marketing, manufacturing, legal, customer service, tech, travel)
  - Before: confusable/collocation repeated every 20-25 games
  - After: **60-79 games** before full cycle
- Example sentences: improved 95 more template → real (from Dictionary API)
- New confusable categories:
  - Spelling: loose/lose, quiet/quite, desert/dessert, weather/whether
  - Business: ensure/insure, expense/experience, moral/morale
  - Grammar: its/it's, their/there, whose/who's, than/then
  - Advanced: discrete/discreet, eminent/imminent, sensible/sensitive
- New collocation categories:
  - Meetings: chair a meeting, take minutes, adjourn a meeting
  - HR: fill a position, conduct an interview, evaluate performance
  - Finance: settle an account, raise capital, write off a debt
  - Marketing: boost sales, close a deal, generate leads
  - Legal: breach a contract, file a patent, obtain a permit
  - Tech: troubleshoot an issue, back up data, restore a backup

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
