import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">页面不存在</h1>
      <Link href="/" className="text-[var(--color-sky)] underline">
        返回首页
      </Link>
    </div>
  );
}
