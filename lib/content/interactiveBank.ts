/**
 * 互动内容库精选（闯关题 + 词卡）
 * 本批使用文件：
 * 1. 导论章节测试题.docx
 * 2. 2.习概论第二章题库（含问卷及答案）.docx
 * 3. 3.习概论第三章题库（含问卷及答案）.docx
 * 4. 绘画传声筒.docx
 * 路径：1互动内容库（题库）/互动内容库（题库）/
 */

export type QuizBankItem = {
  id: string;
  stem: string;
  options: string[];
  answer: number;
  difficulty: number;
  chapter: string;
  source_file: string;
};

export type WordcardBankItem = {
  id: string;
  term: string;
  hint: string;
  source_file: string;
};

/** 单选题精选（课中闯关用） */
export const QUIZ_BANK_SEED: QuizBankItem[] = [
  // —— 导论 ——
  {
    id: "qz_intro_01",
    stem: "党的十九大是在全面建成小康社会决胜阶段、中国特色社会主义进入（）的关键时期召开的一次十分重要的大会。",
    options: ["新时代", "新时期", "新阶段", "新征程"],
    answer: 0,
    difficulty: 1,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_02",
    stem: "（）是一个国家、一个民族发展中更基本、更深沉、更持久的力量。",
    options: ["道路自信", "理论自信", "制度自信", "文化自信"],
    answer: 3,
    difficulty: 1,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_03",
    stem: "世界未有之大变局正在加速演变。（）仍然是时代主题。",
    options: ["发展与共享", "和平与融合", "和平与发展", "开放与包容"],
    answer: 2,
    difficulty: 1,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_04",
    stem: "习近平新时代中国特色社会主义思想是当代中国马克思主义、二十一世纪马克思主义，是中华文化和（）的时代精华。",
    options: ["中华文明", "中华品格", "中国精神", "中国力量"],
    answer: 2,
    difficulty: 2,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_05",
    stem: "坚持把马克思主义基本原理同中国具体实际相结合，同（）相结合。",
    options: ["中国具体国情", "中华优秀传统文化", "中国精神", "民族特色"],
    answer: 1,
    difficulty: 2,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_06",
    stem: "（）通过决议，把习近平新时代中国特色社会主义思想写入党章。",
    options: ["党的十七大", "党的十八大", "党的十九大", "党的二十大"],
    answer: 2,
    difficulty: 1,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_07",
    stem: "（）是改革开放以来我们党全部理论和实践的鲜明主题。",
    options: [
      "贯彻新发展理念",
      "坚持和发展中国特色社会主义",
      "改革开放",
      "以经济建设为中心",
    ],
    answer: 1,
    difficulty: 2,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_08",
    stem: "中国特色社会主义最本质的特征是（）。",
    options: [
      "人民共同富裕",
      "人民当家作主",
      "中国共产党领导",
      "社会主义现代化",
    ],
    answer: 2,
    difficulty: 1,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_09",
    stem: "党的二十大提出了（）。",
    options: ["六个必须坚持", "十个明确", "十四个坚持", "十三个方面成就"],
    answer: 0,
    difficulty: 2,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },
  {
    id: "qz_intro_10",
    stem: "坚持和发展中国特色社会主义，总任务是实现社会主义现代化和中华民族伟大复兴，并在全面建成小康社会基础上分两步走建成社会主义现代化强国。下列表述正确的是？",
    options: [
      "完善和发展中国特色社会主义制度、推进国家治理体系和治理能力现代化",
      "建设中国特色社会主义法治体系、建设社会主义法治国家",
      "实现社会主义现代化和中华民族伟大复兴，分两步走建成社会主义现代化强国",
      "建设世界一流军队",
    ],
    answer: 2,
    difficulty: 2,
    chapter: "导论",
    source_file: "导论章节测试题.docx",
  },

  // —— 第二章 中国梦 ——
  {
    id: "qz_ch2_01",
    stem: "习近平参观《复兴之路》展览时指出，实现（），就是中华民族近代以来最伟大的梦想。",
    options: [
      "全面建设现代化强国",
      "中华民族的伟大复兴",
      "走中国特色社会主义道路",
      "全面建成小康社会",
    ],
    answer: 1,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_02",
    stem: "中国梦归根到底是（），必须紧紧依靠人民来实现。",
    options: ["国家的梦", "人民的梦", "民族的梦", "世界的梦"],
    answer: 1,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_03",
    stem: "实现中国梦必须走中国道路，这就是（）。",
    options: [
      "中华民族大团结之路",
      "社会发展之路",
      "人民民主专政之路",
      "中国特色社会主义道路",
    ],
    answer: 3,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_04",
    stem: "实现中国梦必须凝聚中国力量，这就是（）。",
    options: [
      "各族人民大团结的力量",
      "中国共产党的领导力量",
      "中高速增长的经济力量",
      "保障有力的军事力量",
    ],
    answer: 0,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_05",
    stem: "（）维系着华夏大地上各个民族的团结统一，激励一代代中华儿女不懈奋斗。",
    options: ["伟大精神", "爱国主义", "民族团结", "改革创新"],
    answer: 1,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_06",
    stem: "全面建设社会主义现代化国家进程中的第一阶段（2020—2035年）目标是（）。",
    options: [
      "建成社会主义现代化强国",
      "实现中华民族伟大复兴的中国梦",
      "全面建成小康社会",
      "基本实现社会主义现代化",
    ],
    answer: 3,
    difficulty: 2,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_07",
    stem: "实现社会主义现代化和中华民族伟大复兴……这是坚持和发展中国特色社会主义的（）。",
    options: ["总依据", "总布局", "总任务", "总安排"],
    answer: 2,
    difficulty: 2,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_08",
    stem: "2021年7月1日习近平庄严宣告，我们实现了（）。",
    options: [
      "第一个百年奋斗目标",
      "社会主义现代化国家",
      "社会主义现代化强国",
      "中华民族伟大复兴",
    ],
    answer: 0,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_09",
    stem: "中国梦的科学内涵包括国家富强、（）、人民幸福。",
    options: ["社会和谐", "民族振兴", "世界和平", "共同富裕"],
    answer: 1,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_10",
    stem: "中国式现代化是中国共产党领导的社会主义现代化，这是中国式现代化的（）。",
    options: ["一般特征", "外部条件", "定性（管总、管根本）", "阶段目标"],
    answer: 2,
    difficulty: 2,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_11",
    stem: "关于中国式现代化，下列说法错误的是？",
    options: [
      "提供了一种全新的现代化模式",
      "是对西方式现代化理论和实践的重大超越",
      "现代化就是西方化",
      "为广大发展中国家提供了全新选择",
    ],
    answer: 2,
    difficulty: 2,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch2_12",
    stem: "全面建成社会主义现代化强国总的战略安排是分（）。",
    options: ["两步走", "三步走", "四步走", "五步走"],
    answer: 0,
    difficulty: 1,
    chapter: "第二章",
    source_file: "2.习概论第二章题库（含问卷及答案）.docx",
  },

  // —— 第三章 党的全面领导 ——
  {
    id: "qz_ch3_01",
    stem: "中国共产党的领导是中国特色社会主义最本质的特征，这是（）以来习近平提出的重要论断。",
    options: ["十八大", "十五大", "十九大", "十七大"],
    answer: 0,
    difficulty: 2,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_02",
    stem: "面对新时代新挑战新要求，（）就是战胜艰难险阻、不断取得胜利的制胜法宝。",
    options: [
      "改进完善党的领导",
      "坚持和加强党的领导",
      "全面推进党的改革",
      "增加党员人数",
    ],
    answer: 1,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_03",
    stem: "（）是中国特色社会主义最本质的特征。",
    options: [
      "以经济建设为中心",
      "以人为本",
      "五位一体总体布局",
      "中国共产党的领导",
    ],
    answer: 3,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_04",
    stem: "中国共产党是中国工人阶级的先锋队，同时是（）。",
    options: [
      "中国人民的先锋队",
      "中华民族的先锋队",
      "中国人民和中华民族的先锋队",
      "中国新阶层的先锋队",
    ],
    answer: 2,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_05",
    stem: "（）会议将党的领导制度明确为我国根本领导制度。",
    options: ["十九大", "十九届三中全会", "十九届四中全会", "十九届五中全会"],
    answer: 2,
    difficulty: 2,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_06",
    stem: "中国共产党坚持全心全意为人民服务的宗旨，是坚持（）的根本要求。",
    options: [
      "立党为公、执政为民",
      "保持先进性、纯洁性",
      "中国特色社会主义道路",
      "马克思主义唯物史观",
    ],
    answer: 0,
    difficulty: 2,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_07",
    stem: "（）是我国的根本领导制度，居于统领地位。",
    options: ["党的组织原则", "党的政治原则", "党的领导制度", "党的性质宗旨"],
    answer: 2,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_08",
    stem: "中国共产党的性质决定了党的宗旨是（）。",
    options: [
      "立党为公、执政为民",
      "以人为本、执政为民",
      "全心全意为人民服务",
      "为实现共产主义而奋斗",
    ],
    answer: 2,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_09",
    stem: "中国共产党作为马克思主义政党，其最大的政治优势是（）。",
    options: [
      "一切从实际出发",
      "理论联系实际",
      "密切联系群众",
      "批评与自我批评",
    ],
    answer: 2,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_10",
    stem: "党的任何组织和成员必须服从党中央集中统一领导，这是党的领导的（）。",
    options: ["前提基础", "必然选择", "最高原则", "最终目标"],
    answer: 2,
    difficulty: 2,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_11",
    stem: "我们既不走封闭僵化的老路，也不走改旗易帜的邪路，要坚定不移走（）。",
    options: [
      "中国特色社会主义道路",
      "经济社会发展道路",
      "人民民主专政的道路",
      "文化强国之路",
    ],
    answer: 0,
    difficulty: 1,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
  {
    id: "qz_ch3_12",
    stem: "党的全面领导意味着党要包揽所有国家和社会事务、代替国家机关行使职权。这一说法（）。",
    options: ["正确", "错误", "部分正确", "无法判断"],
    answer: 1,
    difficulty: 2,
    chapter: "第三章",
    source_file: "3.习概论第三章题库（含问卷及答案）.docx",
  },
];

/** 词卡：绘画传声筒 */
export const WORDCARD_BANK_SEED: WordcardBankItem[] = [
  {
    id: "wc_01",
    term: "中国梦",
    hint: "民族复兴 · 人民的梦",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_02",
    term: "绿水青山就是金山银山",
    hint: "生态文明 · 发展理念",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_03",
    term: "乡村振兴",
    hint: "农业农村现代化",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_04",
    term: "一带一路",
    hint: "开放合作 · 命运与共",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_05",
    term: "共同富裕",
    hint: "全体人民 · 中国式现代化特征",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_06",
    term: "中国式现代化",
    hint: "党的领导 · 全新现代化模式",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_07",
    term: "人类命运共同体",
    hint: "和平发展 · 世界大同",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_08",
    term: "新质生产力",
    hint: "创新驱动 · 高质量发展",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_09",
    term: "全面从严治党",
    hint: "自我革命 · 长期执政",
    source_file: "绘画传声筒.docx",
  },
  {
    id: "wc_10",
    term: "国家安全",
    hint: "总体国家安全观",
    source_file: "绘画传声筒.docx",
  },
];

export function pickQuizPaper(count = 5): QuizBankItem[] {
  const pool = [...QUIZ_BANK_SEED];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function pickWordcard(): WordcardBankItem {
  return WORDCARD_BANK_SEED[
    Math.floor(Math.random() * WORDCARD_BANK_SEED.length)
  ];
}
