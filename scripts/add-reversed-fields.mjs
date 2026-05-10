// Adds love/career/finance fields to all reversed interpretations
// Run: node scripts/add-reversed-fields.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FILE = join(import.meta.dirname, "..", "lib", "tarot-data.ts");
let src = readFileSync(FILE, "utf-8");

// Pattern: find reversed blocks that only have general+advice
// Each reversed block is: reversed: { general: "...", advice: "..." }
// We want: reversed: { general: "...", love: "...", career: "...", finance: "...", advice: "..." }

// Strategy: find each reversed block, extract the card name from context, add fields

const majorReverseContent = {
  0: { love: "感情上可能过于冲动，在投入之前先想清楚自己想要什么。", career: "职业方向尚不明确，避免在没有充分准备的情况下跳槽或辞职。", finance: "财务上可能做出轻率决定，大额消费前先等待三天。" },
  1: { love: "感情中可能存在操控或不诚实。审视对方是否真诚，也检查自己的动机是否纯粹。", career: "才华被埋没或用到错误的方向。重新评估职业规划，等待更好的时机展现能力。", finance: "投资或商业合作中需防欺骗，签署文件前仔细审阅条款。" },
  2: { love: "感情中忽视直觉的声音。你已经在过度分析关系，放下逻辑去感受真实的情感。", career: "职场信息不透明，重要决策不宜操之过急。相信你的直觉而非表面信息。", finance: "此时不宜做重大财务决策，信息不足时暂缓投资。" },
  3: { love: "感情中可能过度依赖对方，或因为照顾他人而忽略了自己的情感需求。", career: "创造力受阻期，也许是因为过度付出导致的倦怠。给自己充电的时间。", finance: "过度消费在他人身上导致财务压力，重新平衡支出与收入。" },
  4: { love: "感情中控制欲过强，让对方感到窒息。学会放手和信任伴侣。", career: "独断专行的管理风格导致团队矛盾。倾听下属的声音，权力需要智慧而非强制。", finance: "财务控制过度或支出失控。找到安全与自由的平衡点。" },
  5: { love: "感情中对传统和责任的要求可能让关系变得沉重。允许彼此自由表达。", career: "职场教条限制了创新。敢于挑战不合时宜的规则。", finance: "过于保守的理财方式限制了财富增长。适当了解新的投资方式。" },
  6: { love: "面临感情选择的困难，或在关系中感到价值观的不一致。诚实地面对分歧。", career: "职业选择让你陷入纠结。列出每个选项的利弊，听从内心而非他人的期望。", finance: "财务决策受到他人意见干扰，回归自己的判断。" },
  7: { love: "感情中争强好胜会适得其反。退一步让关系回归平衡。", career: "职场方向失控。放慢速度重新规划，急功近利只会浪费更多时间。", finance: "冒进的财务策略导致损失。暂停所有投资操作，重新评估风险。" },
  8: { love: "感情中因为恐惧和不安而压抑真实感受。温柔地表达你的需求。", career: "自我怀疑让你在职场上不敢争取应得的机会。你的能力比你想象的更强。", finance: "因缺乏自信错过了投资机会。小额开始，重建财务信心。" },
  9: { love: "过度独处让感情生活变得贫乏。如果你想要爱，得先走向人群。", career: "孤军奋战太久，向同事或前辈寻求指导会让效率大幅提升。", finance: "过于保守的财务态度导致错失增长机会。适当咨询专业意见。" },
  10: { love: "感情运势的波动是暂时的。无论目前好坏，变化是必然的。", career: "职场遇到意外的挫折或变化。顺应潮流调整策略，而非对抗。", finance: "财运起伏不定，暂时不做长期的财务承诺。" },
  11: { love: "感情中的不公让你感到委屈。坦诚表达你的立场，公平需要争取。", career: "职场遭遇不公正的对待。收集证据，在适当的时机理直气壮地沟通。", finance: "财务纠纷需要公平妥善的处理，不要逃避。欠债及时还清。" },
  12: { love: "感情中无谓的牺牲不会换来感激。审视你的付出是否被珍视。", career: "为了工作牺牲了太多个人时间，却看不到回报。重新定义你的优先级。", finance: "为不值得的事物持续花钱。止损比坚持更难但更必要。" },
  13: { love: "紧抓一段行将结束的关系不放。放手才能让新的爱情进入你的生命。", career: "赖在不适合的岗位上耽误了发展的机会。接受改变的必要性。", finance: "旧的投资模式已经失效，需要彻底转换财务策略。" },
  14: { love: "感情生活中某方面过度而另一方面匮乏。需要找回平衡。", career: "工作与生活的平衡被打破。某一端已经过量，及时调整。", finance: "消费或投资过度集中在某一方面。分散风险、回归中道。" },
  15: { love: "一段不健康的关系依赖正在松脱。你看到了真相，正在收回自己的力量。", career: "从为了金钱或地位而忍受的工作中觉醒。你值得更有意义的事业。", finance: "摆脱了不良的财务习惯或上瘾性消费。自由近在眼前。" },
  16: { love: "在感情的废墟中慢慢站起来。最坏的已经过去，重新学习信任。", career: "职业上的巨大变动让你措手不及。从风暴中慢慢重建属于你的路径。", finance: "财务危机之后的渐恢复期。避免重复过去的错误。" },
  17: { love: "暂时失去对爱情的信心。星星还在，只是云层暂时遮住了光。", career: "职场方向似乎模糊不清。休整充电，灵感很快会回来。", finance: "财务上遭遇暂时的低迷。保持希望，情况即将好转。" },
  18: { love: "感情中的迷雾开始散去，真相逐渐显现。", career: "职场中的不确定因素即将明朗化。", finance: "财务信息逐渐透明，之前看不清楚的风险或机会开始清晰。" },
  19: { love: "感情中的快乐暂时蒙上阴影。放下思虑，单纯地享受当下。", career: "工作上看似阴霾但光明就在云后。保持乐观是最好的策略。", finance: "财务上的小挫折不足以掩盖整体的向好趋势。" },
  20: { love: "无法原谅过去的情感伤痛让你被困在原地。宽恕是为了让自己自由。", career: "对过往的职业失误耿耿于怀。原谅自己，向前看。", finance: "过去的财务错误不应成为永远的枷锁。重新开始永远有机会。" },
  21: { love: "感情周期的收尾阶段。一段旅程即将结束，但新的篇章就在下一转角。", career: "一个大项目即将完成但收尾工作繁重。耐心走完最后一里路。", finance: "财务目标近在咫尺。不要功亏一篑，最后的坚持最关键。" },
};

// For minor arcana, generate based on suit domain
const suitDomains = {
  wands: { love: "感情中行动胜于言语。用实际的付出来表达你的心意。", career: "职场的行动力受阻。重新点燃对工作的热情。", finance: "积极管理财务。行动比计划更重要。" },
  cups: { love: "感情中的情绪波动需要平静面对。真实地表达感受，不要伪装。", career: "工作中投入太多感情导致判断失误。保持专业的客观视角。", finance: "凭情感而不是理性消费。在购物前冷静一天再做决定。" },
  swords: { love: "沟通中的误会加深了关系的裂痕。坦诚对话比沉默更好。", career: "职场中的竞争和冲突让你身心俱疲。选择对你真正重要的战斗。", finance: "清晰的财务分析比盲目行动更有价值。先算清楚再动。" },
  pentacles: { love: "感情中过度计较得失。真正的安全感来自彼此的信任而非物质。", career: "工作中钻牛角尖。跳出细节看大局。", finance: "财务上过于保守或冒险。找到适合你风险承受度的平衡点。" },
};

// Process the file
let count = 0;
// Match reversed blocks: reversed: { ... general: "..." ... advice: "..." }
// We need to find blocks that don't already have love/career/finance

src = src.replace(
  /reversed:\s*\{\s*(\n\s*)general:\s*("[^"]*"),\s*\n\s*advice:\s*("[^"]*"),?\s*\n(\s*)\}/g,
  (match, nl, general, advice, indent) => {
    count++;
    // Try to determine the card context by looking at the preceding content
    // We can't easily do this in regex, so use the count for major arcana
    let love, career, finance;
    if (count <= 22) {
      const m = majorReverseContent[count - 1];
      love = m?.love || "感情中需反思当前的模式，重新找到平衡与真实的需求。";
      career = m?.career || "职场中遇到的阻碍是暂时的，调整策略而非放弃目标。";
      finance = m?.finance || "谨慎管理财务，避免冲动消费和高风险投资。";
    } else {
      // Minor arcana — determine suit from context
      const cardIdx = count - 23; // 0-55
      const suitIdx = Math.floor(cardIdx / 14);
      const suits = ["wands", "cups", "swords", "pentacles"];
      const domain = suitDomains[suits[suitIdx]] || suitDomains.wands;
      love = domain.love;
      career = domain.career;
      finance = domain.finance;
    }

    return `reversed: {${nl}    general: ${general},${nl}    love: "${love}",${nl}    career: "${career}",${nl}    finance: "${finance}",${nl}    advice: ${advice},${nl}${indent}}`;
  }
);

writeFileSync(FILE, src, "utf-8");
console.log(`Updated ${count} reversed interpretation blocks`);
