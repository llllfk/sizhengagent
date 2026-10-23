/**
 * 来源：《民航客舱典型案例汇编》（2021—2026，面向空乘/思政教学）
 * 路径：2客舱案例库/客舱案例库/民航客舱典型案例汇编.docx
 * 正文改写为可演练情景；solution 保留处置要点供点评/教学。
 */

export type CabinCaseSeed = {
  case_id: string;
  title: string;
  category: "emergency" | "disorder" | "care";
  scenario: string;
  roles: string[];
  focus: string;
  difficulty: number;
  emergency_level: number;
  solution: string;
  source: "real" | "simulation";
  meta: {
    occurred_at: string;
    flight?: string;
    source_note: string;
    assembly_ref: string;
  };
};

export const CABIN_CASES_ASSEMBLY: CabinCaseSeed[] = [
  {
    case_id: "asm_ca1524_turbulence",
    title: "晴空颠簸：安全带与应急防护",
    category: "emergency",
    scenario:
      "巡航中突遇晴空颠簸，客舱瞬间失重。部分旅客未系安全带，你正在过道检查。邻座旅客惊叫，有人可能受伤。请立即按颠簸应急程序处置并安抚客舱。",
    roles: ["乘务员", "乘务长", "旅客", "观察员"],
    focus: "按程序防护→巡视伤情→沟通温度；系好安全带的安全教育点",
    difficulty: 2,
    emergency_level: 3,
    solution:
      "按空中颠簸应急程序防护；平稳后巡视客舱与卫生间；伤者安排医疗与慰问；事后开展「系好安全带」安全教育。（参考：国航CA1524，2023-07-10）",
    source: "real",
    meta: {
      occurred_at: "2023-07-10",
      flight: "CA1524 上海—北京",
      source_note: "央广网转引国航官方微博",
      assembly_ref: "第一章·案例一",
    },
  },
  {
    case_id: "asm_cz6309_ami",
    title: "万米高空急性心梗：备降与空地联动",
    category: "emergency",
    scenario:
      "巡航中旅客突发心脏不适。机上寻医后症状未缓解，医生建议尽快送医。你是乘务长：如何上报机长、安抚客舱，并配合备降决策？",
    roles: ["乘务长", "乘务员", "医生旅客", "病患旅客"],
    focus: "生命优先；机上急救+空管/机场联动；全体旅客协同",
    difficulty: 3,
    emergency_level: 5,
    solution:
      "安抚监测→广播寻医→报告机长→果断备降→空地急救交接。（参考：南航CZ6309备降武汉，2024-12-08）",
    source: "real",
    meta: {
      occurred_at: "2024-12-08",
      flight: "CZ6309 沈阳—深圳",
      source_note: "新华网",
      assembly_ref: "第一章·案例二",
    },
  },
  {
    case_id: "asm_ca139_battery",
    title: "行李锂电池自燃：客舱火情处置",
    category: "emergency",
    scenario:
      "起飞后不久，行李架内手提行李锂电池自燃，客舱出现烟火征兆。请按锂电池/电气失火应急程序处置，并决定是否建议备降。",
    roles: ["乘务员", "乘务长", "旅客", "观察员"],
    focus: "火情标准程序；充电宝/锂电池携带安全；人机安全优先",
    difficulty: 3,
    emergency_level: 4,
    solution:
      "按锂电池失火程序处置完毕→评估后续风险→必要时备降。（参考：国航CA139备降浦东，2025-10-18）",
    source: "real",
    meta: {
      occurred_at: "2025-10-18",
      flight: "CA139 杭州—首尔",
      source_note: "新华网",
      assembly_ref: "第一章·案例三",
    },
  },
  {
    case_id: "asm_aq1305_cargo_fire",
    title: "货舱火警警告：备降与行李合规",
    category: "emergency",
    scenario:
      "飞行途中出现货舱火警警告。机组启动应急程序并备降。作为客舱乘务员，你如何配合客舱秩序、安抚旅客，并在落地后协助调查沟通？",
    roles: ["乘务员", "乘务长", "旅客", "观察员"],
    focus: "火警程序协同；禁止/限制携带物品；依法配合调查",
    difficulty: 2,
    emergency_level: 4,
    solution:
      "按货舱火警程序配合处置与备降；落地后配合监管调查；强调行李货物合规。（参考：九元AQ1305备降长沙，2022-03-01）",
    source: "real",
    meta: {
      occurred_at: "2022-03-01",
      flight: "AQ1305 广州—宜昌",
      source_note: "民航局中南局通报",
      assembly_ref: "第一章·案例四",
    },
  },
  {
    case_id: "asm_hu484_medical",
    title: "国际长航线心脏病救治：空地会商",
    category: "emergency",
    scenario:
      "国际长航中年长旅客疑似心脏病、意识不清。运行中心已开始多部门会商。你在客舱如何组织寻医、监测体征，并配合提前落地？",
    roles: ["乘务员", "乘务长", "医生旅客", "病患旅客"],
    focus: "国际航班急救链路；航医咨询；备降预案与真情服务",
    difficulty: 3,
    emergency_level: 5,
    solution:
      "启动紧急医疗救助→广播寻医→体征监测与安抚→空地会商提前落地。（参考：海航HU484，2024-02-11）",
    source: "real",
    meta: {
      occurred_at: "2024-02-11",
      flight: "HU484 墨尔本—海口",
      source_note: "新华网",
      assembly_ref: "第一章·案例五",
    },
  },
  {
    case_id: "asm_smoke_toilet",
    title: "卫生间吸烟触发烟感：秩序与依法移交",
    category: "disorder",
    scenario:
      "起飞后后舱卫生间烟感报警，开门有烟味、马桶内有烟蒂。旅客称「抽一口没事」。请处置现场并准备落地移交公安。",
    roles: ["乘务员", "乘务长", "涉事旅客", "邻座旅客"],
    focus: "安全底线不可通融；证据固定；依法治国与机闹整治",
    difficulty: 2,
    emergency_level: 2,
    solution:
      "立即核查→固定证据→告知法规后果→落地移交公安。（参考：行政拘留5日，2024-03-16）",
    source: "real",
    meta: {
      occurred_at: "2024-03-16",
      flight: "长沙—哈尔滨（航班号未披露）",
      source_note: "公安部官网机闹典型",
      assembly_ref: "第二章·案例一",
    },
  },
  {
    case_id: "asm_drunk_seat",
    title: "醉酒强占头等舱：劝阻与延误风险",
    category: "disorder",
    scenario:
      "待飞时醉酒旅客离开经济舱，强占头等舱座位，拒不听从劝阻，航班可能延误。请在保障安全与秩序前提下处置。",
    roles: ["乘务员", "乘务长", "涉事旅客", "头等舱旅客"],
    focus: "拒绝无效通融；保护其他旅客权益；必要时报警",
    difficulty: 2,
    emergency_level: 2,
    solution:
      "明确告知违规→团队劝阻→固定证据→落地依法处置。（参考：行政拘留10日，ZH8383，2024-03-18）",
    source: "real",
    meta: {
      occurred_at: "2024-03-18",
      flight: "ZH8383 郑州—南宁",
      source_note: "公安部官网/央视新闻",
      assembly_ref: "第二章·案例二",
    },
  },
  {
    case_id: "asm_exit_slide",
    title: "误开应急出口释放滑梯",
    category: "disorder",
    scenario:
      "刚停靠机位、廊桥未靠、未下达下客通知。旅客欲拉应急出口手柄，称「这就是出口」。请立即制止并说明后果。",
    roles: ["乘务员", "乘务长", "涉事旅客", "观察员"],
    focus: "应急设备不可触碰；指令清晰；法律责任提示",
    difficulty: 2,
    emergency_level: 3,
    solution:
      "紧急制止→保护现场→报告机长与地面→依法移交。（参考：行政拘留12日，2024-03-30）",
    source: "real",
    meta: {
      occurred_at: "2024-03-30",
      flight: "北京—厦门（航班号未披露）",
      source_note: "公安部官网机闹典型",
      assembly_ref: "第二章·案例三",
    },
  },
  {
    case_id: "asm_bomb_hoax",
    title: "误机泄愤谎称有炸弹（地面场景）",
    category: "disorder",
    scenario:
      "值机柜台旅客因误机情绪激动，扬言「飞机上有炸弹」。周围旅客恐慌。你是现场服务人员，如何稳住场面并启动安保流程？",
    roles: ["地服人员", "值班经理", "涉事旅客", "围观旅客"],
    focus: "虚假恐怖信息零容忍；立即报警；避免二次恐慌",
    difficulty: 3,
    emergency_level: 4,
    solution:
      "隔离涉事者→立即报警→配合防爆复检→法律后果告知。（参考：编造虚假恐怖信息罪判决，2024-03-01）",
    source: "real",
    meta: {
      occurred_at: "2024-03-01",
      flight: "首都机场值机柜台",
      source_note: "公安部/中国长安网",
      assembly_ref: "第二章·案例四",
    },
  },
  {
    case_id: "asm_seat_fight",
    title: "靠背纠纷升级为机上斗殴",
    category: "disorder",
    scenario:
      "两名旅客因座椅靠背调节争执，情绪升级即将动手。起飞前时间紧张。请快速降温、分隔双方并固定证据。",
    roles: ["乘务员", "乘务长", "旅客A", "旅客B"],
    focus: "先控风险再谈是非；客舱秩序；落地移交",
    difficulty: 2,
    emergency_level: 2,
    solution:
      "分隔劝止→保护其他旅客→记录取证→落地交公安。（参考：行政拘留并处罚款，2023-11-12）",
    source: "real",
    meta: {
      occurred_at: "2023-11-12",
      source_note: "公安部官网机闹典型",
      assembly_ref: "第二章·案例五",
    },
  },
  {
    case_id: "asm_e_cig",
    title: "滑行中吸电子烟且再犯",
    category: "disorder",
    scenario:
      "滑行起飞阶段旅客吸电子烟，经制止后再次吸食，可能导致延误。请依法依规处置并说明底线。",
    roles: ["乘务员", "乘务长", "涉事旅客", "邻座旅客"],
    focus: "电子烟等同禁烟管控；二次违规升级处置",
    difficulty: 1,
    emergency_level: 2,
    solution:
      "制止→告知禁令→再犯则固定证据并落地移交。（参考：虹桥滑行吸电子烟被拘留，2024-08-25）",
    source: "real",
    meta: {
      occurred_at: "2024-08-25",
      flight: "上海虹桥起飞滑行",
      source_note: "央视网",
      assembly_ref: "第二章·案例六",
    },
  },
  {
    case_id: "asm_y87528_coma",
    title: "旅客昏迷抽搐：机上无医护时的备降",
    category: "care",
    scenario:
      "平飞阶段旅客完全失去意识并抽搐，机上暂无医护。请组织供氧、监测、上报机长，并配合备降与地服陪护。",
    roles: ["乘务员", "乘务长", "病患旅客", "观察员"],
    focus: "敬畏生命；无医护条件下的规范施救与空地衔接",
    difficulty: 3,
    emergency_level: 5,
    solution:
      "呼唤铃响应→供氧监测→报告机长→OCC决策备降→医疗交接与地服陪护。（参考：金鹏Y87528备降郑州，2026-03-12）",
    source: "real",
    meta: {
      occurred_at: "2026-03-12",
      flight: "Y87528 呼和浩特—深圳",
      source_note: "人民网上海频道",
      assembly_ref: "第三章·案例一",
    },
  },
  {
    case_id: "asm_cz5929_bag",
    title: "错拿背包内巨额手术费：拾金不昧",
    category: "care",
    scenario:
      "落地后旅客称背包拿错。清舱发现无人认领双肩包，内有巨额现金。请按程序安抚、清点、交接并联动查找失主。",
    roles: ["乘务长", "乘务员", "地服", "失主旅客"],
    focus: "真情服务；遗失物法定返还；空地公安协同",
    difficulty: 2,
    emergency_level: 1,
    solution:
      "安抚→清舱交接→执法记录下清点→查登机牌信息→三方联动归还。（参考：南航CZ5929，50万元手术费，2025-10-11）",
    source: "real",
    meta: {
      occurred_at: "2025-10-11",
      flight: "CZ5929 揭阳—义乌",
      source_note: "中国新闻网",
      assembly_ref: "第三章·案例二",
    },
  },
  {
    case_id: "asm_um_children",
    title: "无陪儿童高峰：空地温情衔接",
    category: "care",
    scenario:
      "暑运单班无陪儿童超过30人。开舱门前地服要与你交接特殊需求。请完成接收确认、客舱安置与情绪安抚话术。",
    roles: ["乘务长", "乘务员", "地服", "无陪儿童"],
    focus: "特殊旅客服务规定；空地闭环；三个敬畏中的职责",
    difficulty: 2,
    emergency_level: 1,
    solution:
      "专人通道与等候区→开舱逐项交接→客舱安置与陪伴→全程闭环。（参考：国航贵州暑运600+无陪儿童，2025暑运）",
    source: "real",
    meta: {
      occurred_at: "2025-07~08",
      flight: "CA8528 等贵阳出港",
      source_note: "中国航空集团官网",
      assembly_ref: "第三章·案例三",
    },
  },
  {
    case_id: "asm_3u8633_windshield",
    title: "风挡爆裂极端险情：客舱失压处置",
    category: "care",
    scenario:
      "巡航中风挡爆裂，客舱强风、低温、失压、缺氧。自动化设备大面积失灵。请在客舱迅速实施安全处置、安抚旅客并配合机组备降。",
    roles: ["乘务员", "乘务长", "旅客", "观察员"],
    focus: "三个敬畏；极端险情下的程序与心理素质；敬畏生命",
    difficulty: 3,
    emergency_level: 5,
    solution:
      "客舱紧急防护与安抚→配合机长手动备降→全员平安。（参考：川航3U8633英雄机组，2018-05-14）",
    source: "real",
    meta: {
      occurred_at: "2018-05-14",
      flight: "3U8633 重庆—拉萨",
      source_note: "人民网/央视《面对面》",
      assembly_ref: "第三章·案例四",
    },
  },
];

const CABIN_EXTRA_KW: Record<string, string[]> = {
  emergency: ["应急", "颠簸", "火灾", "失压", "备降", "医疗", "心脏", "锂电池"],
  disorder: ["纠纷", "冲突", "机闹", "秩序", "醉酒", "打架"],
  care: ["无陪", "儿童", "特殊旅客", "关怀", "安抚"],
};

/** 情境类答疑：匹配客舱案例库条目 */
export function matchCabinCases(question: string, limit = 2): CabinCaseSeed[] {
  const q = question.toLowerCase();
  const scored = CABIN_CASES_ASSEMBLY.map((c) => {
    let score = 0;
    const bag = [
      c.title,
      c.focus,
      c.scenario,
      c.category,
      ...(CABIN_EXTRA_KW[c.category] ?? []),
    ];
    for (const token of bag) {
      const t = token.toLowerCase();
      if (t.length >= 2 && (q.includes(t) || question.includes(token))) {
        score += token.length >= 4 ? 3 : 2;
      }
    }
    // 拆短词
    for (const w of ["安全", "规则", "人情", "旅客", "乘务", "红线", "敬畏"]) {
      if (question.includes(w) && (c.focus.includes(w) || c.scenario.includes(w))) {
        score += 1;
      }
    }
    return { c, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.c.emergency_level - a.c.emergency_level);
  return scored.slice(0, limit).map((x) => x.c);
}
