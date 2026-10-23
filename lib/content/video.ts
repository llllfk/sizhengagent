/** 短视频工坊文案生成（无大模型时的本地模板） */
export function generateScript(theme: string, valuePoint: string) {
  return [
    `【主题】${theme}`,
    `【价值点】${valuePoint || "人民至上 · 服务边界"}`,
    "",
    "旁白：客舱里每一次抉择，都在回答我们把什么放在前面。",
    "画面：旅客激动——乘务员沉稳——规章与温度同时在场。",
    "收束：安全是底线，温度是能力，边界是职业尊严。",
    "",
    "—— AI生成内容，供讨论参考",
  ].join("\n");
}

export function generateStoryboard(theme: string, valuePoint: string) {
  return [
    `主题：${theme}`,
    `价值点：${valuePoint || "（待填写）"}`,
    "镜头1 开场空镜 · 客舱走廊（2s）",
    "镜头2 冲突特写 · 旅客与乘务员（4s）",
    "镜头3 旁白切入 · 价值抉择字幕（3s）",
    "镜头4 预案落地 · 秩序恢复（3s）",
    "镜头5 收束金句 · 品牌落版（2s）",
    "",
    "—— AI生成内容，供讨论参考",
  ].join("\n");
}
