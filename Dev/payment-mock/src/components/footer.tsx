import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background py-4 mt-8">
      <div className="w-full max-w-3xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>off r39&apos;x in 大阪らへん2027（決済フロー確認用モック）</span>
        <div className="flex items-center gap-3">
          <Link href="/staff" className="underline underline-offset-2 hover:text-foreground">
            スタッフ向け受付（デモ）
          </Link>
          <Link href="/admin" className="underline underline-offset-2 hover:text-foreground">
            運営者向け管理画面（デモ）
          </Link>
        </div>
      </div>
    </footer>
  );
}
