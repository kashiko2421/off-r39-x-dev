"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user, cart, logout } = useStore();
  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Link href="/" className="font-semibold tracking-tight text-sm shrink-0">
          off r39&apos;x
          <span className="hidden sm:inline text-muted-foreground font-normal"> 決済モック</span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1 text-sm flex-wrap justify-end">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/entry">入場</Link>} />
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/karaoke">カラオケ</Link>} />
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/goods">グッズ</Link>} />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/mypage">マイページ</Link>}
          />
          <Button
            variant="ghost"
            size="sm"
            className="relative"
            nativeButton={false}
            render={
              <Link href="/cart">
                カート
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                    {itemCount}
                  </Badge>
                )}
              </Link>
            }
          />
          {user ? (
            <Button variant="outline" size="sm" onClick={logout}>
              ログアウト
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href="/account/login">ログイン</Link>}
            />
          )}
        </nav>
      </div>
    </header>
  );
}
