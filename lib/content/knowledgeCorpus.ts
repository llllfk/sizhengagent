/**
 * 答疑知识库精选语料
 * 来源：2客舱案例库/客舱案例库
 * - 民航安全案例库郜会远.docx（安全理念·红线意识）
 * - 思政案例1.docx（指示批示 / 辩证思维 / 工匠精神）
 * 不全量入库：只保留可课堂引用、可答疑匹配的短条目。
 */

export type KnowledgeKind =
  | "safety_case"
  | "policy"
  | "dialectic"
  | "craftsmanship";

export type KnowledgeSnippet = {
  snippet_id: string;
  kind: KnowledgeKind;
  title: string;
  summary: string;
  teaching_point: string;
  keywords: string[];
  source_file: string;
  source_note: string;
};

export const KNOWLEDGE_CORPUS: KnowledgeSnippet[] = [
  // —— 安全案例库（红线意识）——
  {
    snippet_id: "kb_saf_tenerife",
    kind: "safety_case",
    title: "特纳里夫跑道相撞：标准通话与情景意识",
    summary:
      "1977年荷航与泛美两架747在大雾跑道相撞。误解空管用语、未核实关键信息、任务压力下情景意识下降，导致未获许可起飞。",
    teaching_point:
      "陆空/客舱沟通必须用标准用语；不确定就核实；压力下仍要守住程序与 CRM。",
    keywords: ["红线", "通话", "情景意识", "CRM", "程序", "安全"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例1",
  },
  {
    snippet_id: "kb_saf_valujet",
    kind: "safety_case",
    title: "瓦卢杰货舱氧气发生器火灾",
    summary:
      "1996年违规载运化学氧气发生器导致货舱起火坠毁。危险品识别、维护承包监管与货舱探测灭火缺失叠加成灾。",
    teaching_point:
      "危险品零容忍；行李货物与公司物资都要按危品规则识别；客舱烟火征兆立即按程序处置。",
    keywords: ["危险品", "货舱", "火灾", "锂电池", "氧气", "红线"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例3",
  },
  {
    snippet_id: "kb_saf_jal123",
    kind: "safety_case",
    title: "日航123：不当维修与结构失效",
    summary:
      "1985年压力隔板维修不符合规范，金属疲劳累积导致高空爆裂减压、液压失效，最终坠毁。",
    teaching_point:
      "维修必须严格按手册；隐患修补不合规会在多年后以灾难形式显现——敬畏规章。",
    keywords: ["维修", "手册", "疲劳", "结构", "规章", "红线"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例5",
  },
  {
    snippet_id: "kb_saf_atr72",
    kind: "safety_case",
    title: "ATR-72未除冰起飞失事",
    summary:
      "2012年机组已注意到积冰却未按手册除冰起飞，气动性能恶化失速坠毁。培训与安全管理缺陷是背景因素。",
    teaching_point:
      "看见风险却不执行程序，就是突破红线；效益压力不能压过安全程序。",
    keywords: ["除冰", "程序", "失速", "效益", "安全第一", "红线"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例6",
  },
  {
    snippet_id: "kb_saf_tu154",
    kind: "safety_case",
    title: "西南航TU-154：自锁螺母与维修红线",
    summary:
      "1999年升降舵操纵连接因不合规自锁螺母脱落失效，俯仰失控坠毁。机务规章意识、程序意识淡薄是深层原因。",
    teaching_point:
      "一个不符合规定的紧固件可以毁掉全机；机务与客舱人员都要把「手册意识」内化为红线。",
    keywords: ["机务", "维修", "螺母", "手册意识", "红线", "责任"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例8",
  },
  {
    snippet_id: "kb_saf_wheel_fire",
    kind: "safety_case",
    title: "机轮着火正确处置（正向案例）",
    summary:
      "2019年10月11日白云机场机务正确处置机轮着火，体现发现隐患、按程序处置的正向安全文化。",
    teaching_point:
      "红线意识不只是「禁止」，也包括「发现即处置、程序即生命」。",
    keywords: ["机务", "着火", "程序", "正向", "安全文化"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例19",
  },
  {
    snippet_id: "kb_saf_jetbridge",
    kind: "safety_case",
    title: "廊桥刮碰舱门",
    summary:
      "2020年3月14日廊桥刮碰飞机舱门。地面保障与客舱衔接节点的疏忽会直接伤及航空器与旅客安全感。",
    teaching_point:
      "空地衔接每个节点都是安全链；客舱乘务员也要关注舱门区域异常并及时报告。",
    keywords: ["廊桥", "舱门", "空地", "衔接", "地面", "红线"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例20",
  },
  {
    snippet_id: "kb_saf_tool",
    kind: "safety_case",
    title: "飞机带工具起飞受损",
    summary:
      "2016年9月29日飞机带工具起飞造成飞机受损。工具清点与放行确认是典型「小疏忽、大后果」。",
    teaching_point:
      "清点、确认、闭环——安全链断在「以为已经做好」的瞬间。",
    keywords: ["工具", "放行", "清点", "闭环", "红线"],
    source_file: "民航安全案例库郜会远.docx",
    source_note: "安全理念·红线意识·案例15",
  },

  // —— 思政案例1：指示批示 ——
  {
    snippet_id: "kb_pol_2014",
    kind: "policy",
    title: "2014批示：航空安全事关重大",
    summary:
      "要站在国家战略和国家安全高度，加强航空安全保障体系建设，提高监控、技术装备与应急处置能力。",
    teaching_point: "空乘岗位上的每一次程序动作，都连着国家安全与人民生命。",
    keywords: ["航空安全", "国家战略", "应急", "监控", "人民"],
    source_file: "思政案例1.docx",
    source_note: "1.1 2014-05-16批示",
  },
  {
    snippet_id: "kb_pol_2015",
    kind: "policy",
    title: "2015批示：始终保持安全第一",
    summary:
      "民航业是重要战略产业，要始终保持安全第一，严格行业管理，更好服务国家战略与人民群众。",
    teaching_point: "安全第一不是口号，是行业身份与岗位底线。",
    keywords: ["安全第一", "战略产业", "服务", "人民群众"],
    source_file: "思政案例1.docx",
    source_note: "1.2 2015-03-04批示",
  },
  {
    snippet_id: "kb_pol_2016",
    kind: "policy",
    title: "2016批示：安全隐患零容忍",
    summary: "要坚持民航安全底线，对安全隐患零容忍。",
    teaching_point: "客舱里「差一点没关系」就是隐患；零容忍从每一次制止违规开始。",
    keywords: ["零容忍", "隐患", "底线", "安全"],
    source_file: "思政案例1.docx",
    source_note: "1.3 2016-10-23批示",
  },
  {
    snippet_id: "kb_pol_20180908",
    kind: "policy",
    title: "2018批示：安全是民航业的生命线",
    summary:
      "任何时候、任何环节都不能麻痹大意；正确处理安全与发展、安全与效益的关系，把安全责任落实到岗位、落实到人头。",
    teaching_point:
      "效益、准点、人情都不能压过安全；责任要落到「我这一岗」。",
    keywords: ["生命线", "效益", "发展", "责任", "岗位", "麻痹"],
    source_file: "思政案例1.docx",
    source_note: "1.6 2018-09-08批示",
  },
  {
    snippet_id: "kb_pol_hero",
    kind: "policy",
    title: "学习英雄机组：三个敬畏落在平凡航班",
    summary:
      "「5·14」成功处置来自平时养成的责任意识、严谨作风与专业技能。把非凡英雄精神体现在平凡岗位上，一个航班一个航班地盯。",
    teaching_point:
      "三个敬畏（生命、规章、职责）要变成客舱里的具体动作与话术，而不是纪念册上的句子。",
    keywords: ["英雄机组", "三个敬畏", "平凡", "责任", "3U8633", "忠于职守"],
    source_file: "思政案例1.docx",
    source_note: "1.7 2018-09-30指示",
  },

  // —— 辩证思维短条 ——
  {
    snippet_id: "kb_dia_huofu",
    kind: "dialectic",
    title: "祸兮福所倚：客舱决策中的辩证",
    summary:
      "老子：「祸兮福之所倚，福兮祸之所伏。」要正确对待祸福，从不利中看到有利，有利中发现不利。",
    teaching_point:
      "准点压力下的「省事」可能埋下更大风险；备降看似「损失」，实则保住生命与职业底线。",
    keywords: ["辩证", "祸福", "备降", "准点", "风险"],
    source_file: "思政案例1.docx",
    source_note: "《道德经》第五十八章",
  },
  {
    snippet_id: "kb_dia_rouruo",
    kind: "dialectic",
    title: "柔弱胜刚强：沟通温度与安全刚性",
    summary:
      "「天下之至柔，驰骋于天下之至坚。」柔弱胜刚强是对「道」的感悟。",
    teaching_point:
      "客舱沟通可以柔（温度），安全边界必须刚（规章）；柔不是破规，刚不是冷酷。",
    keywords: ["辩证", "温度", "规章", "沟通", "通融", "边界"],
    source_file: "思政案例1.docx",
    source_note: "《道德经》第四十三章",
  },

  // —— 工匠精神 ——
  {
    snippet_id: "kb_craft_lai",
    kind: "craftsmanship",
    title: "赖小明：每一个安全起落都是新的开始",
    summary:
      "检查员机长强调：每一个安全起落都是一个动作一个动作飞出来的；越飞越「胆小」，是敬畏而非退缩。",
    teaching_point:
      "工匠精神在空乘岗：把重复的安全带检查、广播、巡视做成每一次都认真的「第一次」。",
    keywords: ["工匠精神", "敬畏", "飞行品质", "习惯", "认真"],
    source_file: "思政案例1.docx",
    source_note: "工匠精神·打磨飞行品质",
  },
  {
    snippet_id: "kb_craft_cheng",
    kind: "craftsmanship",
    title: "程仲刚：敬畏规章手册就是敬畏人民",
    summary:
      "功勋飞行员把安全理解为「不能犯错」——对规章、手册的敬畏，是对人民生命的承诺。",
    teaching_point:
      "空乘的「匠心」不是表演服务秀，而是把手册动作做到位、把违规挡在红线外。",
    keywords: ["工匠精神", "敬畏规章", "手册", "功勋", "承诺"],
    source_file: "思政案例1.docx",
    source_note: "工匠精神·匠心铸就安全",
  },
  {
    snippet_id: "kb_craft_newcrew",
    kind: "craftsmanship",
    title: "南航新空姐培训中的工匠精神",
    summary:
      "精益求精、爱岗敬业、持续关注、守正创新——培训里的耐心与责任心，应迁移到对旅客的每一次讲解与处置。",
    teaching_point:
      "对学员不放弃的耐心，就是对旅客不放弃的服务伦理；工匠精神可从培训迁移到客舱。",
    keywords: ["工匠精神", "空姐", "培训", "耐心", "责任心", "服务"],
    source_file: "思政案例1.docx",
    source_note: "工匠精神·打造南航新空姐",
  },

  // —— 3知识库精选：民航指示讲话 ——
  {
    snippet_id: "kb_caac_zhou_3",
    kind: "policy",
    title: "周总理三句话：安全·服务·正常",
    summary:
      "1957年周恩来批示：「保证安全第一，改善服务工作，争取飞行正常。」揭示航空运输规律，长期指导民航工作。",
    teaching_point:
      "客舱岗位上：安全是底线，服务是温度，正常是专业；三者不可偏废。",
    keywords: ["安全第一", "服务", "飞行正常", "周恩来", "民航方针"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "1957·中缅通航批示",
  },
  {
    snippet_id: "kb_caac_fly_out",
    kind: "policy",
    title: "「中国民航一定要飞出去」",
    summary:
      "1965年周恩来提出民航要飞出去才能打开局面，并与机组一起实践远程专机，推动国际航线开拓。",
    teaching_point:
      "开放与担当：岗位技能要经得起「走出去」的检验；空乘服务也是国家形象。",
    keywords: ["飞出去", "国际航线", "周恩来", "专机", "开放"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "1965·一定要飞出去",
  },
  {
    snippet_id: "kb_caac_deng_enterprise",
    kind: "policy",
    title: "邓小平：民航要企业化、服务要有竞争力",
    summary:
      "1978—1980年邓小平多次指出民航不可缺少、步子要大一些；服务不好就没有竞争能力；民航一定要企业化。",
    teaching_point:
      "真情服务不是附加项，是竞争力本身；规章与服务都要按现代企业管理标准落地。",
    keywords: ["企业化", "服务", "竞争", "邓小平", "改革开放"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "1978—1980·民航改革",
  },
  {
    snippet_id: "kb_caac_spirit",
    kind: "policy",
    title: "当代民航精神四句话",
    summary:
      "忠诚担当的政治品格、严谨科学的专业精神、团结协作的工作作风、敬业奉献的职业操守。",
    teaching_point:
      "可直接对照客舱：忠诚于安全规章、专业于程序话术、协作于空地联动、敬业于每一个航班。",
    keywords: ["当代民航精神", "忠诚担当", "严谨", "协作", "敬业"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "2016·当代民航精神",
  },
  {
    snippet_id: "kb_caac_hero_2018",
    kind: "policy",
    title: "接见英雄机组：安全是生命线",
    summary:
      "2018年习近平接见川航英雄机组：伟大出自平凡；安全是民航业的生命线；正确处理安全与发展、安全与效益。",
    teaching_point:
      "每一个平凡航班盯到位，就是不平凡；效益与准点不能压过安全责任到岗到人。",
    keywords: ["英雄机组", "生命线", "平凡", "效益", "三个敬畏", "5·14"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "2018-09-30·英雄机组",
  },
  {
    snippet_id: "kb_caac_zero_2016",
    kind: "policy",
    title: "安全隐患零容忍",
    summary:
      "2016年习近平就民航安全工作批示：要坚持民航安全底线，对安全隐患零容忍。",
    teaching_point:
      "客舱里「差一点没关系」就是隐患；零容忍从每一次制止违规、每一次确认开始。",
    keywords: ["零容忍", "隐患", "底线", "安全", "批示"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "2016-10·安全批示",
  },
  {
    snippet_id: "kb_caac_xiamen_2024",
    kind: "policy",
    title: "给厦航全体员工的回信：筑牢安全底线",
    summary:
      "2024年习近平回信厦航：弘扬优良传统，坚持改革创新，增强核心竞争力，筑牢安全底线，服务经济社会发展与两岸交流。",
    teaching_point:
      "企业高质量发展的前提是安全底线；空乘岗位是「核心竞争力」看得见的一面。",
    keywords: ["厦航", "回信", "安全底线", "高质量发展", "交通强国"],
    source_file: "国家领导对民航的指示讲话.docx",
    source_note: "2024-07-24·厦航回信",
  },

  // —— 白云机场校区老飞机故事 ——
  {
    snippet_id: "kb_baiyun_md82",
    kind: "safety_case",
    title: "MD-82：大飞机梦想与现场青年",
    summary:
      "上海总装MD-82是国产大飞机项目的前身。邓小平视察总装线肯定建设民用航空工业基地，并寄语现场年轻工人是跨世纪骨干。",
    teaching_point:
      "空乘学员同样是「跨世纪骨干」：技术报国、精益求精，从认识一架飞机开始建立职业认同。",
    keywords: ["MD-82", "大飞机", "邓小平", "航空工业", "青年"],
    source_file: "白云机场校区老飞机的著名历史故事.docx",
    source_note: "MD-82总装与视察",
  },
  {
    snippet_id: "kb_baiyun_yun7",
    kind: "craftsmanship",
    title: "运-7：国产民机与自力更生",
    summary:
      "运-7是正式投入运营的国产运输机。江泽民视察时支持搞运-7，强调自力更生为主、争取外援为辅，质量上去应与进口机同等对待。",
    teaching_point:
      "对国产装备与国货服务的自信，和对规章标准的敬畏是一体的。",
    keywords: ["运-7", "国产", "自力更生", "民机", "质量"],
    source_file: "白云机场校区老飞机的著名历史故事.docx",
    source_note: "运-7与江泽民视察",
  },
  {
    snippet_id: "kb_baiyun_cj6",
    kind: "craftsmanship",
    title: "初教-6：最安全的教练机与工匠精神",
    summary:
      "初教-6从设计到首飞仅72天，年轻团队夜以继日；累计约千万飞行小时，因设计制造质量问题的重大事故为零，获国家质量金质奖。",
    teaching_point:
      "「飞不死」靠的是设计与制造的极致认真——客舱服务同样要把重复动作做成零差错习惯。",
    keywords: ["初教-6", "工匠精神", "质量", "安全", "教练机"],
    source_file: "白云机场校区老飞机的著名历史故事.docx",
    source_note: "初教-6传奇",
  },
  {
    snippet_id: "kb_baiyun_il14",
    kind: "safety_case",
    title: "伊尔-14：为人民而飞的专机故事",
    summary:
      "周恩来明确专机也可服务其他领导人与民航班机；平陆61人中毒事件中伊尔-14紧急空投药品救人。飞机价值在于为谁而飞、为何而飞。",
    teaching_point:
      "空乘职业答卷：每一次服务都在回答「为谁飞、为何飞」——人民生命优先。",
    keywords: ["伊尔-14", "周恩来", "专机", "救援", "为人民", "平陆"],
    source_file: "白云机场校区老飞机的著名历史故事.docx",
    source_note: "伊尔-14专机与救援",
  },

  // —— 中国梦论述摘编 ——
  {
    snippet_id: "kb_dream_revive",
    kind: "policy",
    title: "中国梦：中华民族伟大复兴",
    summary:
      "实现中华民族伟大复兴，是中华民族近代以来最伟大的梦想；国家好、民族好，大家才会好。",
    teaching_point:
      "个人职业成长与民航强国、民族复兴同向；客舱岗位也是中国形象的窗口。",
    keywords: ["中国梦", "民族复兴", "复兴之路", "命运"],
    source_file: "习近平关于实现中华民族伟大复兴的中国梦论述摘编.pdf",
    source_note: "参观《复兴之路》展览讲话",
  },
  {
    snippet_id: "kb_dream_people",
    kind: "policy",
    title: "中国梦归根到底是人民的梦",
    summary:
      "中国梦必须紧紧依靠人民来实现，必须不断为人民造福。",
    teaching_point:
      "客舱「人民至上」：旅客生命与尊严优先，服务温度建立在安全底线之上。",
    keywords: ["中国梦", "人民的梦", "造福", "人民至上"],
    source_file: "习近平关于实现中华民族伟大复兴的中国梦论述摘编.pdf",
    source_note: "十二届全国人大一次会议讲话",
  },
  {
    snippet_id: "kb_dream_model",
    kind: "craftsmanship",
    title: "劳模精神：平凡劳动创造不平凡",
    summary:
      "爱岗敬业、争创一流，艰苦奋斗、勇于创新，淡泊名利、甘于奉献——劳模精神是宝贵精神财富。",
    teaching_point:
      "空乘的「不平凡」藏在每一次安全带检查、每一次应急广播里。",
    keywords: ["劳模精神", "爱岗敬业", "平凡", "奉献", "铁人"],
    source_file: "习近平关于实现中华民族伟大复兴的中国梦论述摘编.pdf",
    source_note: "同全国劳动模范代表座谈",
  },

  // —— 二十大报告精选 ——
  {
    snippet_id: "kb_20th_theme",
    kind: "policy",
    title: "党的二十大主题：全面建设社会主义现代化国家",
    summary:
      "高举中国特色社会主义伟大旗帜，全面贯彻新时代中国特色社会主义思想，为全面建设社会主义现代化国家、全面推进中华民族伟大复兴而团结奋斗。",
    teaching_point:
      "课堂与岗位都要回答：如何在本职工作中服务现代化与复兴大局。",
    keywords: ["二十大", "现代化", "伟大复兴", "主题", "团结奋斗"],
    source_file: "在中国共产党第二十次全国代表大会上的报告.pdf",
    source_note: "二十大报告开篇主题",
  },
  {
    snippet_id: "kb_20th_life",
    kind: "policy",
    title: "人民至上、生命至上",
    summary:
      "面对疫情等重大考验，坚持人民至上、生命至上，最大限度保护人民生命安全和身体健康。",
    teaching_point:
      "客舱应急与日常服务的第一排序：生命安全不可让步。",
    keywords: ["人民至上", "生命至上", "安全", "健康", "二十大"],
    source_file: "在中国共产党第二十次全国代表大会上的报告.pdf",
    source_note: "二十大报告·新时代十年成就",
  },
];

/** 简单关键词匹配，供答疑首问挂载知识提示 */
export function matchKnowledgeSnippets(
  question: string,
  limit = 2,
): KnowledgeSnippet[] {
  const q = question.toLowerCase();
  const scored = KNOWLEDGE_CORPUS.map((s) => {
    let score = 0;
    for (const kw of s.keywords) {
      if (q.includes(kw.toLowerCase()) || question.includes(kw)) score += 2;
    }
    if (question.includes(s.title.slice(0, 6))) score += 3;
    return { s, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.s);
}
