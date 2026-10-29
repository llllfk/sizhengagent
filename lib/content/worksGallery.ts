/** 成果库成片元数据（可被客户端引用；勿在此 import fs） */
export type WorkClip = {
  id: string;
  /** 相对 `4视频/` 的原始文件名（打包源） */
  file: string;
  title: string;
  award: string;
  tag: string;
  /** 墙面占位：异形尺寸 */
  size: "hero" | "tall" | "wide" | "md" | "sm";
  /** 环绕层级：center 中心最大 · inner 中圈 · outer 外圈 */
  ring?: "center" | "inner" | "outer";
};

/**
 * 入库 / S3 Key：与扣子「对象存储」控制台直传一致——根目录中文原文件名。
 * 例：`9.客舱模拟.mp4`
 */
export function galleryObjectKey(clip: WorkClip | string): string {
  if (typeof clip === "string") {
    const hit = WORKS_GALLERY.find((w) => w.id === clip);
    return hit?.file ?? `works/gallery/${clip}.mp4`;
  }
  return clip.file;
}

export function galleryPublicRel(id: string): string {
  return galleryObjectKey(id);
}

/**
 * 文案以成片画面 / 片内字幕为准，奖项层级跟原片文件名。
 * 中心默认：醒狮·少年路
 */
export const WORKS_GALLERY: WorkClip[] = [
  {
    id: "lion-nation",
    file: "醒狮-新1.mp4",
    title: "醒狮·少年路",
    award: "国家级·教育部「魅力非遗」优秀原创作品",
    tag: "文化自信",
    size: "hero",
    ring: "center",
  },
  {
    id: "grow-up",
    file: "5.国家级优秀：长大后就成了您.mp4",
    title: "长大后，我就成了您",
    award: "国家级·第六届「我心中的思政课」大学生微电影展示活动",
    tag: "榜样力量",
    size: "wide",
    ring: "inner",
  },
  {
    id: "lion-school",
    file: "1.校级一等奖醒狮 文化安全.mp4",
    title: "根脉·新生",
    award: "校级·国家安全教育微视频大赛特等奖",
    tag: "文化安全",
    size: "md",
    ring: "inner",
  },
  {
    id: "walk-prov",
    file: "4.省级和校级一等奖：行走的思政课.mp4",
    title: "行走的思政课",
    award: "省级和校级一等奖",
    tag: "行走思政",
    size: "md",
    ring: "inner",
  },
  {
    id: "sanxiaxiang",
    file: "8.省级：三下乡.mp4",
    title: "青春筑梦基层行",
    award: "校级·助力「百千万工程」",
    tag: "实践育人",
    size: "md",
    ring: "inner",
  },
  {
    id: "interview-campus",
    file: "11.校园采访.mp4",
    title: "街头声音·廉洁",
    award: "校本专题",
    tag: "清风正气",
    size: "md",
    ring: "inner",
  },
  {
    id: "campus-safe",
    file: "10.校园安全.mp4",
    title: "完美受害者（校园安全）",
    award: "校本专题",
    tag: "安全底线",
    size: "tall",
    ring: "inner",
  },
  {
    id: "social",
    file: "3.国家级：社会服务.mp4",
    title: "「大思政」视域下青年的文化创承路",
    award: "省级·第十届广东高校网络媒体展示节一等奖",
    tag: "文化传承",
    size: "sm",
    ring: "inner",
  },
  {
    id: "cabin-sim",
    file: "9.客舱模拟.mp4",
    title: "客舱模拟",
    award: "校本实践",
    tag: "客舱思政",
    size: "sm",
    ring: "outer",
  },
  {
    id: "qihang-blue",
    file: "5.启航逐梦蓝天.mp4",
    title: "逐梦蓝天",
    award: "校本专题·实践作品展播",
    tag: "空乘梦想",
    size: "sm",
    ring: "outer",
  },
  {
    id: "rescue-nation",
    file: "2.国家级：紧急救助.mp4",
    title: "乘翼归来",
    award: "国家级 ·第五届“我心中的思政课”大学生微电影展示活动",
    tag: "空乘梦想",
    size: "sm",
    ring: "outer",
  },
  {
    id: "walk-bronze",
    file: "省级三等奖：行走的思政课.mp4",
    title: "思政青焰",
    award: "省级·“打卡广东红”优秀短视频",
    tag: "行走思政",
    size: "sm",
    ring: "outer",
  },
  {
    id: "cyber",
    file: "12.网络安全.mp4",
    title: "网络安全",
    award: "校本专题",
    tag: "网络文明",
    size: "sm",
    ring: "outer",
  },
  {
    id: "integrity",
    file: "11.廉洁 (1).mp4",
    title: "青春筑防线",
    award: "校本专题",
    tag: "职业形象",
    size: "sm",
    ring: "outer",
  },
  {
    id: "interview",
    file: "6.面试.mp4",
    title: "面试",
    award: "职业素养",
    tag: "职业形象",
    size: "sm",
    ring: "outer",
  },
  {
    id: "rescue-short",
    file: "7.紧急救助.mp4",
    title: "紧急救助",
    award: "实训成片",
    tag: "应急处置",
    size: "sm",
    ring: "outer",
  },
];

export function getWorkClip(id: string): WorkClip | undefined {
  return WORKS_GALLERY.find((w) => w.id === id);
}
