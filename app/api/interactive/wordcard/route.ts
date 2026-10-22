import { NextResponse } from "next/server";

/** GET /api/interactive/wordcard — 抽取思政词卡 */
export async function GET() {
  const cards = [
    { id: "w1", term: "人民至上", hint: "客舱抉择的价值锚点" },
    { id: "w2", term: "服务边界", hint: "规则与人情的张力" },
    { id: "w3", term: "职业伦理", hint: "空乘现场的责任结构" },
  ];
  const pick = cards[Math.floor(Math.random() * cards.length)];
  return NextResponse.json({ data: pick });
}
