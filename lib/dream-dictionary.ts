// Zhou Gong Dream Dictionary — traditional Chinese dream interpretation
// Category → keyword → { meaning, lucky: "吉"|"凶"|"平" }

export interface DreamSymbol {
  keyword: string;
  category: string;
  meaning: string;
  lucky: "吉" | "凶" | "平";
}

const DREAM_DICTIONARY: Record<string, { category: string; meaning: string; lucky: "吉" | "凶" | "平" }> = {
  // ── 自然天象 ──
  "太阳": { category: "自然", meaning: "光明与希望，事业将有起色，权威人物将给予帮助", lucky: "吉" },
  "月亮": { category: "自然", meaning: "情感波动，思念远方的亲人或恋人，阴柔之力显现", lucky: "平" },
  "星星": { category: "自然", meaning: "理想与追求，心中目标虽远但可及，将有意外惊喜", lucky: "吉" },
  "彩虹": { category: "自然", meaning: "苦尽甘来，困境即将过去，好运正在靠近", lucky: "吉" },
  "雨": { category: "自然", meaning: "洗涤与净化，悲伤情绪的释放，即将迎来清新局面", lucky: "平" },
  "暴雨": { category: "自然", meaning: "情绪失控或突发事件，需冷静应对，避免冲动决策", lucky: "凶" },
  "雷": { category: "自然", meaning: "突如其来的变故或警示，上天在提醒你注意某事", lucky: "凶" },
  "闪电": { category: "自然", meaning: "灵感闪现，突然的领悟，但也可能有意外冲击", lucky: "平" },
  "雪": { category: "自然", meaning: "纯洁与新生，烦恼将被覆盖消融，新的开始", lucky: "吉" },
  "风": { category: "自然", meaning: "变动与消息，生活将有变化，远方传来音讯", lucky: "平" },
  "云": { category: "自然", meaning: "思绪飘忽不定，心中有事未决，需静心思考", lucky: "平" },
  "雾": { category: "自然", meaning: "迷茫与困惑，前路看不清方向，不宜做重大决定", lucky: "凶" },
  "地震": { category: "自然", meaning: "生活根基动摇，重大变故前兆，需稳固根本", lucky: "凶" },
  "洪水": { category: "自然", meaning: "情绪泛滥无法控制，或财务上的巨大压力", lucky: "凶" },
  "日出": { category: "自然", meaning: "新的开始，事业蒸蒸日上，健康恢复", lucky: "吉" },
  "日落": { category: "自然", meaning: "一个阶段的结束，需要反思总结，蓄势待发", lucky: "平" },
  "天空": { category: "自然", meaning: "心境开阔，志向高远，精神层面的追求", lucky: "吉" },
  "大海": { category: "自然", meaning: "胸怀宽广，潜意识深处的情感涌动，机遇与风险并存", lucky: "平" },

  // ── 动物 ──
  "蛇": { category: "动物", meaning: "智慧与诱惑并存，谨防身边小人，但也可能预示财富", lucky: "凶" },
  "龙": { category: "动物", meaning: "至高无上的祥瑞，事业将有大突破，贵人相助", lucky: "吉" },
  "凤凰": { category: "动物", meaning: "涅槃重生，好运降临，姻缘美满", lucky: "吉" },
  "鱼": { category: "动物", meaning: "财富与丰盛，年年有余，机会满满", lucky: "吉" },
  "鸟": { category: "动物", meaning: "自由与消息，将有喜讯传来，心想事成", lucky: "吉" },
  "狗": { category: "动物", meaning: "忠诚的友谊，可靠的朋友将给予帮助", lucky: "吉" },
  "猫": { category: "动物", meaning: "直觉敏锐但可能有欺骗，需警惕表面温和的人", lucky: "平" },
  "马": { category: "动物", meaning: "奔腾向前的动力，事业进展迅速，旅行运旺", lucky: "吉" },
  "老虎": { category: "动物", meaning: "威严与挑战，将面对强大对手或困难，但可战胜", lucky: "平" },
  "狮子": { category: "动物", meaning: "领导力与勇气，自信满满，适合主动出击", lucky: "吉" },
  "蜘蛛": { category: "动物", meaning: "耐心与编织，正在织就自己的命运之网，需坚持", lucky: "平" },
  "蝴蝶": { category: "动物", meaning: "美丽蜕变，人生将迎来华丽转变，爱情运势上升", lucky: "吉" },
  "老鼠": { category: "动物", meaning: "谨慎防备，小心财物损失或有小人暗中作祟", lucky: "凶" },
  "兔子": { category: "动物", meaning: "温柔与机敏，好运将至，生育或创造力的象征", lucky: "吉" },
  "乌龟": { category: "动物", meaning: "长寿与稳健，事情进展缓慢但扎实，健康运佳", lucky: "吉" },
  "鹰": { category: "动物", meaning: "远见卓识，视野开阔，适合做长远规划", lucky: "吉" },
  "狼": { category: "动物", meaning: "团队力量但也可能有背叛，注意人际关系边界", lucky: "平" },
  "熊": { category: "动物", meaning: "强大的内在力量，但也需警惕脾气失控", lucky: "平" },
  "蚂蚁": { category: "动物", meaning: "勤劳与合作，小事积累成大业，团队协作顺利", lucky: "吉" },
  "蜜蜂": { category: "动物", meaning: "勤劳收获，甜蜜的回报即将到来，人际关系和谐", lucky: "吉" },

  // ── 人物 ──
  "婴儿": { category: "人物", meaning: "新的开始或项目诞生，纯真的自我，创意萌发", lucky: "吉" },
  "小孩": { category: "人物", meaning: "童真与无忧，内心的孩子气需要被关注", lucky: "平" },
  "老人": { category: "人物", meaning: "智慧与经验，需向长者请教，或代表内心深处的声音", lucky: "吉" },
  "孕妇": { category: "人物", meaning: "孕育新计划，创意或项目正在酝酿中，时机将至", lucky: "吉" },
  "医生": { category: "人物", meaning: "治愈与修复，身心需要关注，或将得到帮助", lucky: "吉" },
  "警察": { category: "人物", meaning: "秩序与规则，内心道德在起作用，或需面对权威", lucky: "平" },
  "老师": { category: "人物", meaning: "学习与成长，将有贵人指路，获得重要知识", lucky: "吉" },
  "陌生人": { category: "人物", meaning: "未知的自我或新的机遇，保持开放心态", lucky: "平" },
  "死者": { category: "人物", meaning: "与过去的告别，一个阶段的彻底结束，重生前兆", lucky: "平" },
  "新娘": { category: "人物", meaning: "新的承诺与关系，人生进入新阶段", lucky: "吉" },
  "国王": { category: "人物", meaning: "权威与掌控，自信满满，适合领导他人", lucky: "吉" },
  "乞丐": { category: "人物", meaning: "内在匮乏感的投射，需要关注自我价值", lucky: "凶" },
  "小偷": { category: "人物", meaning: "不安全感，担心失去某物或某人", lucky: "凶" },
  "家人": { category: "人物", meaning: "亲情与归属感，家庭关系需要关注", lucky: "平" },
  "朋友": { category: "人物", meaning: "社交需求，友谊将得到加强或考验", lucky: "平" },
  "恋人": { category: "人物", meaning: "感情生活的投射，爱情运势的写照", lucky: "吉" },

  // ── 身体 ──
  "牙齿": { category: "身体", meaning: "门面与自信，脱落暗示焦虑，坚固则代表底气足", lucky: "平" },
  "头发": { category: "身体", meaning: "力量与生命力，脱落代表烦恼，浓密则精力旺盛", lucky: "平" },
  "手": { category: "身体", meaning: "行动力与创造力，做事的能力和掌控感", lucky: "平" },
  "眼睛": { category: "身体", meaning: "洞察力与直觉，需看清某事的真相", lucky: "平" },
  "脚": { category: "身体", meaning: "根基与前行的方向，人生道路的选择", lucky: "平" },
  "血": { category: "身体", meaning: "生命力与情感强度，也代表家族血脉的联系", lucky: "平" },
  "哭泣": { category: "身体", meaning: "情绪的释放，压抑的情感得到宣泄，好事将至", lucky: "吉" },
  "笑": { category: "身体", meaning: "内心的喜悦与满足，好运相伴", lucky: "吉" },
  "裸体": { category: "身体", meaning: "暴露与脆弱，害怕被人看穿，或渴望回归本真", lucky: "平" },
  "生病": { category: "身体", meaning: "身心疲惫的警告，需要停下来休息和调整", lucky: "凶" },
  "伤口": { category: "身体", meaning: "内心创伤的显现，需要时间愈合某段经历", lucky: "凶" },
  "怀孕": { category: "身体", meaning: "新计划正在孕育，创造力的高峰期", lucky: "吉" },

  // ── 物品 ──
  "钱": { category: "物品", meaning: "价值与自我认同，财运变化的预兆", lucky: "吉" },
  "金币": { category: "物品", meaning: "意外之财，努力将获得丰厚回报", lucky: "吉" },
  "钥匙": { category: "物品", meaning: "解决方案即将出现，难题将被解开", lucky: "吉" },
  "门": { category: "物品", meaning: "新的机会与选择，转折点来临", lucky: "平" },
  "镜子": { category: "物品", meaning: "自我反思，需要正视真实的自己", lucky: "平" },
  "钟表": { category: "物品", meaning: "时间紧迫感，某事的截止日期在逼近", lucky: "平" },
  "手机": { category: "物品", meaning: "沟通与连接，渴望与人交流或收到重要信息", lucky: "平" },
  "电脑": { category: "物品", meaning: "工作与思维，脑力劳动的反映", lucky: "平" },
  "书": { category: "物品", meaning: "知识与智慧，需要学习新东西来解决问题", lucky: "吉" },
  "笔": { category: "物品", meaning: "表达与创造，适合写作或签约", lucky: "吉" },
  "刀": { category: "物品", meaning: "决断与切割，需要果断地切断某段关系或习惯", lucky: "凶" },
  "剑": { category: "物品", meaning: "力量与正义，将战胜困难，维护自己的立场", lucky: "吉" },
  "戒指": { category: "物品", meaning: "承诺与约束，感情关系的象征，婚恋运势", lucky: "吉" },
  "项链": { category: "物品", meaning: "情感的牵绊，珍贵的关系需要维护", lucky: "平" },
  "衣服": { category: "物品", meaning: "社会角色与形象，你在他人眼中的样子", lucky: "平" },
  "鞋子": { category: "物品", meaning: "人生道路的选择，新的旅程即将开始", lucky: "平" },
  "食物": { category: "物品", meaning: "精神食粮与满足感，内心渴望被滋养", lucky: "吉" },
  "水": { category: "物品", meaning: "情感与潜意识的流动，生命力的象征", lucky: "平" },
  "火": { category: "物品", meaning: "激情与毁灭并存，情绪激烈变化的预示", lucky: "平" },
  "黄金": { category: "物品", meaning: "珍贵之物或品质，自我价值的肯定", lucky: "吉" },
  "宝石": { category: "物品", meaning: "内在价值的发现，隐藏的才华将被发掘", lucky: "吉" },
  "车": { category: "物品", meaning: "人生方向的掌控，事业发展速度的象征", lucky: "平" },
  "船": { category: "物品", meaning: "人生的航程，情感或事业的远行", lucky: "平" },
  "飞机": { category: "物品", meaning: "快速上升，事业或人生将有飞跃", lucky: "吉" },
  "桥": { category: "物品", meaning: "过渡与连接，正在跨越人生的一个重要阶段", lucky: "吉" },
  "灯": { category: "物品", meaning: "智慧之光照亮前路，困惑将被解开", lucky: "吉" },
  "蜡烛": { category: "物品", meaning: "希望之火，在黑暗中坚持信念", lucky: "吉" },
  "花": { category: "物品", meaning: "美好与短暂，幸福时刻需珍惜", lucky: "吉" },
  "树": { category: "物品", meaning: "生命力与成长，根基稳固，事业有发展", lucky: "吉" },
  "房子": { category: "物品", meaning: "内心世界与安全感，家庭生活的写照", lucky: "平" },
  "楼梯": { category: "物品", meaning: "上升或下降的人生阶段，步步高升的预兆", lucky: "吉" },
  "棺材": { category: "物品", meaning: "旧的结束=新的开始，升官发财的谐音吉兆", lucky: "吉" },
  "坟墓": { category: "物品", meaning: "过去的终结，埋葬旧我迎接新生", lucky: "平" },

  // ── 场景与动作 ──
  "坠落": { category: "场景", meaning: "失控感或不安，现实中某些事脱离掌控，需稳住阵脚", lucky: "凶" },
  "飞翔": { category: "场景", meaning: "超越与自由，突破限制，精神层面的提升", lucky: "吉" },
  "追逐": { category: "场景", meaning: "逃避与压力，有未面对的问题在追赶你", lucky: "凶" },
  "逃跑": { category: "场景", meaning: "逃避现实的某个问题，需要勇敢面对", lucky: "凶" },
  "游泳": { category: "场景", meaning: "在情感的海洋中自如穿梭，情绪管理能力增强", lucky: "吉" },
  "考试": { category: "场景", meaning: "生活中的考验与评估，对自我能力的怀疑", lucky: "平" },
  "迷路": { category: "场景", meaning: "人生方向迷茫，需要停下来重新定位", lucky: "凶" },
  "迟到": { category: "场景", meaning: "错失机会的焦虑，对时间管理的担忧", lucky: "凶" },
  "结婚": { category: "场景", meaning: "新的结合与承诺，合作关系将有重大进展", lucky: "吉" },
  "死亡": { category: "场景", meaning: "重生的象征，一个阶段的彻底结束，新的开始", lucky: "吉" },
  "战斗": { category: "场景", meaning: "内心冲突的外化，现实中面临对抗与挑战", lucky: "平" },
  "唱歌": { category: "场景", meaning: "情感的抒发与表达，心情愉悦的体现", lucky: "吉" },
  "跳舞": { category: "场景", meaning: "自由与快乐，身心和谐，社交运势上升", lucky: "吉" },
  "吃饭": { category: "场景", meaning: "精神或物质上的满足，需求获得满足", lucky: "平" },
  "旅行": { category: "场景", meaning: "心灵或身体的探索，人生将有新的体验", lucky: "吉" },
  "爬山": { category: "场景", meaning: "克服困难向上攀登，事业将稳步上升", lucky: "吉" },
  "过河": { category: "场景", meaning: "度过人生的一道坎，困难将被克服", lucky: "吉" },
  "溺水": { category: "场景", meaning: "情感上的不堪重负，需要寻求帮助", lucky: "凶" },
  "被追杀": { category: "场景", meaning: "强烈的压力或罪恶感，有未解决的心理创伤", lucky: "凶" },
  "重生": { category: "场景", meaning: "彻底的转变，涅槃重生，人生将焕然一新", lucky: "吉" },
  "搬家": { category: "场景", meaning: "生活环境的改变，心态或处境的重大调整", lucky: "平" },

  // ── 超自然 ──
  "鬼": { category: "超自然", meaning: "未解的心结在困扰你，过去的阴影需要面对", lucky: "凶" },
  "神": { category: "超自然", meaning: "高层次指引，直觉力增强，将有贵人相助", lucky: "吉" },
  "天使": { category: "超自然", meaning: "守护与祝福，你正在被看顾，可以放心前行", lucky: "吉" },
  "恶魔": { category: "超自然", meaning: "内心阴暗面的投射，需正视自己的欲望与恐惧", lucky: "凶" },
  "灵魂": { category: "超自然", meaning: "深层自我的探索，精神觉醒的前兆", lucky: "平" },
  "寺庙": { category: "超自然", meaning: "心灵的庇护所，需要静心修养，寻求精神寄托", lucky: "吉" },
  "墓地": { category: "超自然", meaning: "与过去和解，释放旧有的束缚", lucky: "平" },
  "预言": { category: "超自然", meaning: "直觉力的高峰，你的预感可能成真", lucky: "平" },
  "外星人": { category: "超自然", meaning: "对未知的好奇与恐惧，生活中出现陌生元素", lucky: "平" },
  "怪兽": { category: "超自然", meaning: "内心恐惧的具象化，需要正视并克服", lucky: "凶" },

  // ── 情绪颜色 ──
  "红色": { category: "颜色", meaning: "热情、活力、吉祥，但也可能代表愤怒和危险", lucky: "吉" },
  "蓝色": { category: "颜色", meaning: "平静、理性、深邃，精神层面的宁静", lucky: "吉" },
  "绿色": { category: "颜色", meaning: "生机、成长、治愈，新机会在萌芽", lucky: "吉" },
  "黄色": { category: "颜色", meaning: "智慧与财富，但也需注意健康预警", lucky: "平" },
  "白色": { category: "颜色", meaning: "纯洁与新的开始，也可能是空虚和缺失", lucky: "平" },
  "黑色": { category: "颜色", meaning: "未知与潜意识的深处，隐藏的恐惧或力量", lucky: "平" },
  "紫色": { category: "颜色", meaning: "灵性与高贵，精神层面的提升", lucky: "吉" },
  "金色": { category: "颜色", meaning: "荣耀与成就，财运亨通", lucky: "吉" },
  "灰色": { category: "颜色", meaning: "情绪低落，犹豫不决，需要更多信息", lucky: "凶" },
};

/**
 * Search dream text for matching symbols from the Zhou Gong dictionary.
 * Returns matches sorted by relevance (longer keyword matches first).
 */
export function searchDreamSymbols(dreamText: string): DreamSymbol[] {
  const results: DreamSymbol[] = [];
  const matched = new Set<string>();

  // Sort keywords by length (longest first) for better matching
  const keywords = Object.keys(DREAM_DICTIONARY).sort((a, b) => b.length - a.length);

  for (const keyword of keywords) {
    if (matched.has(keyword)) continue;
    if (dreamText.includes(keyword)) {
      const entry = DREAM_DICTIONARY[keyword];
      results.push({ keyword, ...entry });
      matched.add(keyword);
    }
  }

  // Limit to top 12 matches
  return results.slice(0, 12);
}

/**
 * Get a single dream symbol entry by keyword.
 */
export function getDreamSymbol(keyword: string): DreamSymbol | null {
  const entry = DREAM_DICTIONARY[keyword];
  if (!entry) return null;
  return { keyword, ...entry };
}

export const DREAM_CATEGORIES = ["自然", "动物", "人物", "身体", "物品", "场景", "超自然", "颜色"] as const;
export type DreamCategory = (typeof DREAM_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<string, string> = {
  "自然": "🌿", "动物": "🐾", "人物": "👤", "身体": "💪",
  "物品": "🔮", "场景": "🎬", "超自然": "✨", "颜色": "🎨",
};
