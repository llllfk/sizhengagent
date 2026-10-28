"use client";

import {
  TYPE_AFTER,
  TYPE_IDENTIFY,
  TYPE_IN_CLASS,
  TYPE_LABEL,
  TYPE_ROLE,
  TYPE_TRAIT,
} from "@/lib/content/typeTags";
import { cn } from "@/lib/utils";

const FEATURED = ["deliberation", "inquiry"] as const;

/** 思辨型 × 探究型：课前识别—课中适配—课后延伸 */
export function TypeGuide({ highlight }: { highlight?: string }) {
  return (
    <div className="space-y-4 rounded-sm border border-[var(--orange)]/25 bg-gradient-to-b from-[var(--orange-fog)] to-white p-4 md:p-5">
      <header className="space-y-1 text-center">
        <p className="text-[10px] tracking-[0.28em] text-[var(--orange-deep)]">
          问题驱动双轮
        </p>
        <h3 className="font-display text-lg text-[var(--ink)] md:text-xl">
          思辨型 × 探究型 · 课前识别—课中适配—课后延伸
        </h3>
        <p className="text-xs text-[var(--muted)]">
          评理者横向论证 · 钻研者纵向深挖 · 同为问题驱动的两端
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {FEATURED.map((id, i) => {
          const on = highlight === id;
          return (
            <article
              key={id}
              className={cn(
                "animate-rise rounded-sm border bg-white/95 p-4",
                on
                  ? "border-[var(--orange)] shadow-[0_12px_28px_rgba(232,120,47,0.16)]"
                  : "border-[var(--orange)]/20",
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="font-display text-xl text-[var(--orange-deep)]">
                {TYPE_LABEL[id]} · {TYPE_ROLE[id]}
              </p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {TYPE_TRAIT[id]}
              </p>
              <dl className="mt-3 space-y-2 text-xs leading-6 text-[var(--ink)]/85">
                <div>
                  <dt className="text-[10px] tracking-[0.16em] text-[var(--orange)]">
                    课前 · 如何识别
                  </dt>
                  <dd>{TYPE_IDENTIFY[id]}</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-[0.16em] text-[var(--orange)]">
                    课中 · 适合活动
                  </dt>
                  <dd>{TYPE_IN_CLASS[id]}</dd>
                </div>
                <div>
                  <dt className="text-[10px] tracking-[0.16em] text-[var(--orange)]">
                    课后 · 延伸任务
                  </dt>
                  <dd>{TYPE_AFTER[id]}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-sm border border-[var(--line)] bg-white">
        <table className="w-full min-w-[36rem] text-left text-xs">
          <thead className="bg-[var(--orange-fog)] text-[var(--orange-deep)]">
            <tr>
              <th className="px-3 py-2 font-medium">对照</th>
              <th className="px-3 py-2 font-medium">思辨型</th>
              <th className="px-3 py-2 font-medium">探究型</th>
            </tr>
          </thead>
          <tbody className="text-[var(--ink)]/85">
            <tr className="border-t border-[var(--line)]">
              <td className="px-3 py-2 text-[var(--muted)]">问题方向</td>
              <td className="px-3 py-2">评：这个观点成立吗、有何漏洞、谁更合理</td>
              <td className="px-3 py-2">究：为什么这样、怎么来的、还有可能吗</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-3 py-2 text-[var(--muted)]">思维动作</td>
              <td className="px-3 py-2">比较与权衡（横）— 拿观点互证、挑逻辑</td>
              <td className="px-3 py-2">挖掘与查证（纵）— 追根由、穷尽资料</td>
            </tr>
            <tr className="border-t border-[var(--line)]">
              <td className="px-3 py-2 text-[var(--muted)]">闭环角色</td>
              <td className="px-3 py-2">议题论证的发动机关 — 把问题辩透</td>
              <td className="px-3 py-2">问题清单的供给者 — 把问题挖深</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="rounded-sm bg-gradient-to-r from-[var(--orange)] to-[var(--orange-deep)] px-4 py-3 text-xs leading-6 text-white">
        协作链路：探究型提出问题 → 思辨型论证分析 → 形成高质量议题（论坛/课堂）→
        回流问题账。两型同属问题驱动双轮：探究负责挖深，思辨负责辩明。
      </p>
    </div>
  );
}
