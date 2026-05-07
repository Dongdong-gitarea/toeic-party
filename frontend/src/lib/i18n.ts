import { useGameStore } from '@/store/gameStore';

export type Lang = 'zh' | 'en';

export const LANGUAGES: { id: Lang; label: string }[] = [
  { id: 'zh', label: '中文' },
  { id: 'en', label: 'English' },
];

const dict: Record<Lang, Record<string, string>> = {
  zh: {
    // Common
    'common.you': '你',
    'common.bot': '機器人',
    'common.connecting': '連線中…',

    // Home
    'home.subtitle': '快問快答對戰',
    'home.pickChar': '選擇角色',
    'home.namePlaceholder': '你的名字',
    'home.classic': '經典',
    'home.jump': '跳躍',
    'home.start': '開戰！',
    'home.myWords': '我的單字 ({n})',
    'home.practice': '練習',

    // Lobby
    'lobby.waitingRoom': '等待室',
    'lobby.waiting': '等待中…',
    'lobby.players': '位玩家',
    'lobby.untilFill': '剩餘時間後 AI 補位',
    'lobby.soloHint': '按 READY 即可單人對戰',
    'lobby.allReadyHint': '全員 READY 立即開始',
    'lobby.imReady': '我準備好了',
    'lobby.readyDone': '已準備',
    'lobby.leave': '← 離開大廳',

    // Game
    'game.matchFound': '配對成功！',
    'game.getReady': '準備開始！',
    'game.go': '開始！',
    'game.finalRound': '最終回合',
    'game.qType.vocab': '字彙',
    'game.qType.audio': '聽力',
    'game.qType.fillblank': '定義',
    'game.qType.confusable': '易混淆',
    'game.qType.confusableHint': '選出正確的字',
    'game.qType.collocation': '搭配',
    'game.qType.collocationHint': '選出正確搭配詞',
    'game.tapToHear': '點擊發音',
    'game.whatWord': '聽到什麼字？',
    'game.whichMeans': '哪個字意思是',
    'game.score': '分數',
    'game.wrong': '錯！',
    'game.waitingOthers': '等待 {n} 位玩家…',

    // Result
    'result.gameOver': '遊戲結束',
    'result.youWon': '你贏了！',
    'result.gapBehind': '只差 {pts} 分到第 {rank} 名！',
    'result.wonBy': '領先 {pts} 分獲勝！',
    'result.playAgain': '再玩一次',
    'result.review': '複習單字 ({n})',
    'result.hide': '收合',
    'result.correct': '答對',
    'result.combo': '最高連擊',
    'result.rank1': '冠軍',
    'result.rank2': '亞軍',
    'result.rank3': '季軍',
    'result.rank4': '殿軍',
    'result.label.mvp': '最有價值',
    'result.label.fastest': '最快',
    'result.label.comboKing': '連擊王',
    'result.level.bronze': '銅',
    'result.level.silver': '銀',
    'result.level.gold': '金',
    'result.toNext': '· 還差 {n} 升級',
    'result.unstar': '取消標記',
    'result.save': '加入單字本',

    // Words
    'words.home': '← 首頁',
    'words.title': '我的單字',
    'words.empty': '還沒有單字，先玩一場累積！',
    'words.empty2': '這裡還沒有東西。',
    'words.note': '每場遊戲結束後自動存檔',
    'words.filter.all': '全部',
    'words.filter.starred': '重點',
    'words.filter.practice': '需練習',
    'words.filter.mastered': '已熟練',
    'words.times': '{pct}% · 共 {n} 次',
    'words.delete': '刪除',
    'words.deleteConfirm': '從筆記本移除「{word}」？',

    // Practice
    'practice.title': '練習',
    'practice.home': '← 首頁',
    'practice.needMore': '需要至少 4 個單字',
    'practice.howTo': '先玩幾場累積單字本',
    'practice.startGame': '開始一場',
    'practice.done': '練習完成',
    'practice.accuracy': '{pct}% 正確率',
    'practice.again': '再練一次',
    'practice.backToWords': '回到我的單字',
    'practice.next': '下一題 →',
    'practice.finish': '完成',
    'practice.qProgress': '第 {n} / {total} 題',
    'practice.untimed': '無時限 · 無對手 · 純粹練習',

    // Settings
    'settings.title': '設定',
    'settings.language': '介面語言',
    'settings.close': '關閉',

    // Difficulty
    'difficulty.title': '難度',
    'difficulty.easy': '初級',
    'difficulty.easyDesc': 'TOEIC 400-600',
    'difficulty.medium': '中級',
    'difficulty.mediumDesc': 'TOEIC 600-800',
    'difficulty.hard': '高級',
    'difficulty.hardDesc': 'TOEIC 800+',

    // Tutorial
    'tutorial.title': '玩法教學',
    'tutorial.next': '下一步',
    'tutorial.start': '開玩',
    'tutorial.skip': '跳過',
    'tutorial.step0.title': '4 人即時對戰',
    'tutorial.step0.desc': '10 題、每題 10 秒，比誰答得快又準。',
    'tutorial.step1.title': '在大廳選角色 + 準備',
    'tutorial.step1.desc': '挑一個角色（可隨時換），所有人按 READY 立刻開始；公開房等不到人 AI 會補位。',
    'tutorial.step2.title': '答題：A／B／C／D',
    'tutorial.step2.desc': '聽到單字或看到中文，4 選 1 點下去。回答越快分數越高，最後 3 秒倒數會變紅警告。',
    'tutorial.step3.title': '連擊與技能',
    'tutorial.step3.desc': '連續答對提升 combo 倍率，每場可使用震波、迷霧、縮時各一次干擾對手。',
    'tutorial.step4.title': '結算 + 自動存單字',
    'tutorial.step4.desc': '冠軍拿皇冠 + MVP 徽章，答錯的字自動加進單字本，下場優先複習。',

    // Vocab metadata
    'vocab.example': '例句',
    'pos.noun': '名詞',
    'pos.verb': '動詞',
    'pos.adj': '形容詞',
    'pos.adv': '副詞',

    // Between-round wrap-up
    'between.pickSkill': '為下一回合選擇技能',
    'between.skillsLocked': '下回合解鎖',
    'between.skip': '跳過 →',
    'between.skipped': '已跳過',

    // Skills
    'skill.used': '已使用',
    'skill.shake.name': '震波',
    'skill.shake.desc': '搖晃對手',
    'skill.fog.name': '迷霧',
    'skill.fog.desc': '模糊選項',
    'skill.cut.name': '縮時',
    'skill.cut.desc': '對手 -3 秒',
    'skill.noFinal': '最終回合無法使用',

    // Private rooms
    'home.createRoom': '建立私房',
    'home.playWithFriends': '跟朋友玩',
    'home.playWithFriendsHint': '建立或加入房號',
    'home.createRoomDesc': '產生房號分享給朋友',
    'home.joinRoomDesc': '輸入朋友的房號',
    'home.classicDesc': '快速 10 題',
    'home.jumpDesc': '答錯出局',
    'home.practiceLockedHint': '存 4 個單字即可解鎖練習',
    'home.joinRoom': '輸入房號加入',
    'home.joinPlaceholder': '輸入房號',
    'home.joinSubmit': '加入',
    'home.joinError': '找不到此房號或房間已滿',
    'lobby.roomCode': '房號',
    'lobby.copyCode': '複製',
    'lobby.copied': '已複製！',
    'lobby.share': '分享',
    'lobby.private': '私人房間',

    // Rematch
    'result.rematch': '再來一場',

    // Manual add word
    'words.add': '+ 新增單字',
    'words.addTitle': '新增單字',
    'words.addEnglish': '英文單字',
    'words.addMeaning': '中文意思',
    'words.addSubmit': '加入單字本',
    'words.addCancel': '取消',
  },
  en: {
    'common.you': 'YOU',
    'common.bot': 'BOT',
    'common.connecting': 'Connecting to server...',

    'home.subtitle': 'Fast Quiz Battle',
    'home.pickChar': 'PICK YOUR CHARACTER',
    'home.namePlaceholder': 'YOUR NAME',
    'home.classic': 'CLASSIC',
    'home.jump': 'JUMP',
    'home.start': 'START!',
    'home.myWords': 'MY WORDS ({n})',
    'home.practice': 'PRACTICE',

    'lobby.waitingRoom': 'WAITING ROOM',
    'lobby.waiting': 'Waiting…',
    'lobby.players': 'PLAYERS',
    'lobby.untilFill': 'until AI fills the rest',
    'lobby.soloHint': 'tap READY to start solo with AI',
    'lobby.allReadyHint': 'all ready = instant start',
    'lobby.imReady': "I'M READY",
    'lobby.readyDone': 'READY!',
    'lobby.leave': '← LEAVE LOBBY',

    'game.matchFound': 'MATCH FOUND!',
    'game.getReady': 'Get Ready!',
    'game.go': 'GO!',
    'game.finalRound': 'Final Round',
    'game.qType.vocab': 'VOCAB',
    'game.qType.audio': 'LISTEN',
    'game.qType.fillblank': 'DEF',
    'game.qType.confusable': 'TRICKY',
    'game.qType.confusableHint': 'Pick the right word',
    'game.qType.collocation': 'COMBO',
    'game.qType.collocationHint': 'Complete the phrase',
    'game.tapToHear': 'Tap to hear',
    'game.whatWord': 'What word do you hear?',
    'game.whichMeans': 'Which word means',
    'game.score': 'SCORE',
    'game.wrong': 'WRONG!',
    'game.waitingOthers': 'Waiting for {n} more…',

    'result.gameOver': 'GAME OVER',
    'result.youWon': 'YOU WON!',
    'result.gapBehind': 'Only {pts} pts from #{rank}!',
    'result.wonBy': 'Won by {pts} pts!',
    'result.playAgain': 'PLAY AGAIN',
    'result.review': 'REVIEW WORDS ({n})',
    'result.hide': 'HIDE',
    'result.correct': 'correct',
    'result.combo': 'max combo',
    'result.rank1': '1ST',
    'result.rank2': '2ND',
    'result.rank3': '3RD',
    'result.rank4': '4TH',
    'result.label.mvp': 'MVP',
    'result.label.fastest': 'FASTEST',
    'result.label.comboKing': 'COMBO KING',
    'result.level.bronze': 'BRONZE',
    'result.level.silver': 'SILVER',
    'result.level.gold': 'GOLD',
    'result.toNext': ' · {n} to next',
    'result.unstar': 'Unstar',
    'result.save': 'Save to notebook',

    'words.home': '← HOME',
    'words.title': 'MY WORDS',
    'words.empty': 'No words yet. Play a game to start collecting!',
    'words.empty2': 'Nothing here yet.',
    'words.note': 'Words are saved automatically after each game',
    'words.filter.all': 'ALL',
    'words.filter.starred': 'STARRED',
    'words.filter.practice': 'NEED PRACTICE',
    'words.filter.mastered': 'MASTERED',
    'words.times': '{pct}% · {n} times',
    'words.delete': 'DELETE',
    'words.deleteConfirm': 'Remove "{word}" from notebook?',

    'practice.title': 'PRACTICE',
    'practice.home': '← HOME',
    'practice.needMore': 'Need at least 4 saved words',
    'practice.howTo': 'Play a few games to build your vocab notebook first.',
    'practice.startGame': 'START A GAME',
    'practice.done': 'PRACTICE DONE',
    'practice.accuracy': '{pct}% accuracy',
    'practice.again': 'PRACTICE AGAIN',
    'practice.backToWords': 'BACK TO MY WORDS',
    'practice.next': 'NEXT →',
    'practice.finish': 'FINISH',
    'practice.qProgress': 'Q{n} / {total}',
    'practice.untimed': 'No timer · No opponents · Pure practice',

    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.close': 'Close',

    'difficulty.title': 'Difficulty',
    'difficulty.easy': 'Easy',
    'difficulty.easyDesc': 'TOEIC 400-600',
    'difficulty.medium': 'Medium',
    'difficulty.mediumDesc': 'TOEIC 600-800',
    'difficulty.hard': 'Hard',
    'difficulty.hardDesc': 'TOEIC 800+',

    'tutorial.title': 'How to play',
    'tutorial.next': 'Next',
    'tutorial.start': 'Got it',
    'tutorial.skip': 'Skip',
    'tutorial.step0.title': '4-player live quiz',
    'tutorial.step0.desc': '10 questions, 10 seconds each. Race to answer faster and smarter.',
    'tutorial.step1.title': 'Pick a character & ready up',
    'tutorial.step1.desc': 'Choose any character (you can switch anytime). The match starts the moment everyone is READY; public rooms auto-fill with AI.',
    'tutorial.step2.title': 'Answer A / B / C / D',
    'tutorial.step2.desc': 'See the word or hear it, then tap one of four. Faster answers score more, and the last 3 seconds turn red.',
    'tutorial.step3.title': 'Combo & skills',
    'tutorial.step3.desc': 'Stack correct answers for a combo multiplier. Each game gives you Shake / Fog / Time-cut once to throw off rivals.',
    'tutorial.step4.title': 'Results & saved words',
    'tutorial.step4.desc': 'The winner gets a crown and MVP badge. Words you missed are saved automatically and prioritized next time.',

    'vocab.example': 'EXAMPLE',
    'pos.noun': 'noun',
    'pos.verb': 'verb',
    'pos.adj': 'adj.',
    'pos.adv': 'adv.',

    'between.pickSkill': 'Pick a skill for next round',
    'between.skillsLocked': 'Unlocks next round',
    'between.skip': 'Skip →',
    'between.skipped': 'Skipped',

    'skill.used': 'USED',
    'skill.shake.name': 'SHAKE',
    'skill.shake.desc': 'Shake opponent',
    'skill.fog.name': 'FOG',
    'skill.fog.desc': 'Blur options',
    'skill.cut.name': 'CUT',
    'skill.cut.desc': 'Opponent -3s',
    'skill.noFinal': 'No skills on final question',

    'home.createRoom': 'PRIVATE ROOM',
    'home.playWithFriends': 'PLAY WITH FRIENDS',
    'home.playWithFriendsHint': 'Create or join a room code',
    'home.createRoomDesc': 'Generate a code to share',
    'home.joinRoomDesc': 'Use a friend’s code',
    'home.classicDesc': 'Quick · 10 questions',
    'home.jumpDesc': 'Wrong answer = out',
    'home.practiceLockedHint': 'Save 4 words to unlock practice',
    'home.joinRoom': 'JOIN BY CODE',
    'home.joinPlaceholder': 'ROOM CODE',
    'home.joinSubmit': 'JOIN',
    'home.joinError': 'Room not found or full',
    'lobby.roomCode': 'CODE',
    'lobby.copyCode': 'COPY',
    'lobby.copied': 'COPIED!',
    'lobby.share': 'SHARE',
    'lobby.private': 'PRIVATE ROOM',

    'result.rematch': 'REMATCH',

    'words.add': '+ ADD WORD',
    'words.addTitle': 'Add Word',
    'words.addEnglish': 'English word',
    'words.addMeaning': 'Chinese meaning',
    'words.addSubmit': 'Save to notebook',
    'words.addCancel': 'Cancel',
  },
};

function format(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  let out = s;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

export function useT() {
  const locale = useGameStore((s) => s.locale);
  return (key: string, vars?: Record<string, string | number>): string => {
    const table = dict[locale] ?? dict.en;
    const value = table[key] ?? dict.en[key] ?? key;
    return format(value, vars);
  };
}
