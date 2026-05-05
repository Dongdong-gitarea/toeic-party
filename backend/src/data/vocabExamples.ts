// Hand-written example sentences for the most-used TOEIC words.
// Tuned for short, business-flavoured sentences that fit on one mobile line.
// Add more entries here as the vocab bank grows; missing words simply render
// without an example.

export interface VocabExample {
  en: string;
  zh: string;
}

const EXAMPLES: Record<string, VocabExample> = {
  conference: {
    en: 'The annual sales conference starts on Monday.',
    zh: '年度業務會議將於星期一開始。',
  },
  deadline: {
    en: 'Please submit the report before the deadline.',
    zh: '請在截止日期前繳交報告。',
  },
  negotiate: {
    en: 'We need to negotiate a better price with the supplier.',
    zh: '我們需要和供應商協商更好的價格。',
  },
  warranty: {
    en: 'This laptop comes with a two-year warranty.',
    zh: '這台筆電附有兩年保固。',
  },
  revenue: {
    en: 'Quarterly revenue grew by 12 percent.',
    zh: '本季營收成長了百分之十二。',
  },
  achieve: {
    en: 'The team achieved its sales target ahead of schedule.',
    zh: '團隊提前達成銷售目標。',
  },
  inventory: {
    en: 'We take inventory at the end of every month.',
    zh: '我們每月底盤點庫存。',
  },
  reimburse: {
    en: 'The company will reimburse your travel expenses.',
    zh: '公司會報銷你的差旅費用。',
  },
  profit: {
    en: 'Higher profit allowed us to expand the team.',
    zh: '更高的利潤讓我們得以擴編。',
  },
  expand: {
    en: 'The startup plans to expand into Asian markets next year.',
    zh: '這家新創計畫明年拓展到亞洲市場。',
  },
  comply: {
    en: 'All employees must comply with the safety guidelines.',
    zh: '所有員工都必須遵守安全規範。',
  },
  promote: {
    en: 'She was promoted to senior manager last month.',
    zh: '她上個月被晉升為資深經理。',
  },
  retain: {
    en: 'The company offers bonuses to retain top talent.',
    zh: '公司提供獎金以留住頂尖人才。',
  },
  expire: {
    en: 'Your membership will expire at the end of the month.',
    zh: '你的會員資格將於月底到期。',
  },
  postpone: {
    en: 'The launch event has been postponed to next week.',
    zh: '發表會已延期到下週。',
  },
  budget: {
    en: 'We are over budget for this quarter.',
    zh: '我們本季已超出預算。',
  },
  deposit: {
    en: 'Please make a deposit to confirm your booking.',
    zh: '請支付訂金以確認預訂。',
  },
  invoice: {
    en: 'The invoice is due within thirty days.',
    zh: '此發票需於三十天內付款。',
  },
  mortgage: {
    en: 'They took out a mortgage to buy their first home.',
    zh: '他們申請了房貸購買第一間房子。',
  },
  surplus: {
    en: 'We ended the year with a small budget surplus.',
    zh: '我們以小幅預算盈餘結束本年度。',
  },
  candidate: {
    en: 'We interviewed five candidates for the position.',
    zh: '我們面試了五位這個職位的候選人。',
  },
  commute: {
    en: 'My daily commute takes about 40 minutes.',
    zh: '我每天通勤大約四十分鐘。',
  },
  evaluation: {
    en: 'Your performance evaluation is scheduled for Friday.',
    zh: '你的績效評估安排在星期五。',
  },
  recruit: {
    en: 'HR is recruiting new engineers this month.',
    zh: '人資部本月正在招聘新的工程師。',
  },
  'résumé': {
    en: 'Please attach your résumé to the application.',
    zh: '請將履歷附在申請中。',
  },
  banquet: {
    en: 'The company held a banquet for retiring staff.',
    zh: '公司為退休員工舉辦了一場宴會。',
  },
  itinerary: {
    en: 'The travel agent emailed our full itinerary.',
    zh: '旅行社把完整的行程表寄到我的信箱。',
  },
  luggage: {
    en: 'Each passenger may bring two pieces of luggage.',
    zh: '每位乘客可攜帶兩件行李。',
  },
  souvenir: {
    en: 'She bought a small souvenir from Kyoto.',
    zh: '她從京都買了一個小紀念品。',
  },
  accommodate: {
    en: 'The hall can accommodate up to 200 guests.',
    zh: '這個大廳最多可容納兩百位賓客。',
  },
  headquarters: {
    en: 'Their headquarters are located in Singapore.',
    zh: '他們的總部位於新加坡。',
  },
  warehouse: {
    en: 'The shipment is still in the warehouse.',
    zh: '貨物還在倉庫裡。',
  },
  supervisor: {
    en: 'Speak with your supervisor before changing the schedule.',
    zh: '更動排班前請先與主管談談。',
  },
  colleague: {
    en: 'My colleague will cover the meeting for me.',
    zh: '我的同事會替我去開會。',
  },
  agenda: {
    en: 'Let me share the agenda for tomorrow’s meeting.',
    zh: '讓我先分享明天會議的議程。',
  },
  appliance: {
    en: 'The store offers free delivery on large appliances.',
    zh: '這家店大型家電免費送貨。',
  },
  certificate: {
    en: 'Please bring the original certificate to the interview.',
    zh: '面試時請攜帶證書正本。',
  },
  receptionist: {
    en: 'The receptionist will call you when the room is ready.',
    zh: '房間準備好時，接待員會通知你。',
  },
  entrepreneur: {
    en: 'She is a successful tech entrepreneur from Taipei.',
    zh: '她是來自台北的成功科技企業家。',
  },
  maintenance: {
    en: 'Regular maintenance keeps the machines running.',
    zh: '定期維修讓機器持續運作。',
  },
  assign: {
    en: 'My manager assigned me to the new project.',
    zh: '我的主管把我指派到新專案。',
  },
  attach: {
    en: 'Please attach the signed contract to your email.',
    zh: '請將簽好的合約附在電子郵件裡。',
  },
  distribute: {
    en: 'We will distribute the brochures at the entrance.',
    zh: '我們會在入口處分發手冊。',
  },
  submit: {
    en: 'Submit your timesheet by Friday afternoon.',
    zh: '請在週五下午前提交工時表。',
  },
  attend: {
    en: 'About 30 people attended the briefing.',
    zh: '約有三十人出席這場簡報。',
  },
  proposal: {
    en: 'The client approved our proposal this morning.',
    zh: '客戶今天上午批准了我們的提案。',
  },
  consensus: {
    en: 'The team reached a consensus on the new policy.',
    zh: '團隊對於新政策達成了共識。',
  },
  implement: {
    en: 'We will implement the changes starting next quarter.',
    zh: '我們將從下一季開始實施這些變更。',
  },
  coordinate: {
    en: 'Could you coordinate the schedule with the other team?',
    zh: '你可以和另一個團隊協調行程嗎？',
  },
  collaborate: {
    en: 'Our office collaborates closely with the Tokyo branch.',
    zh: '我們辦公室與東京分公司密切合作。',
  },
};

// Build a normalized lookup once on first call (TOEIC words have a few
// accented forms like "résumé" that we want to match insensitively).
let cache: Map<string, VocabExample> | null = null;

function key(word: string): string {
  return word.normalize('NFKD').toLowerCase().replace(/[̀-ͯ]/g, '');
}

export function lookupExample(word: string): VocabExample | null {
  if (!cache) {
    cache = new Map();
    for (const [w, ex] of Object.entries(EXAMPLES)) {
      cache.set(key(w), ex);
    }
  }
  return cache.get(key(word)) ?? null;
}
