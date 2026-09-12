"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// SPEC-050 PG-MYP-001 Mypage Overview
export default function MyPageHub() {
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login?redirect=/mypage");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  const confirmedEntitlements = orders
    .filter((o) => o.status === "confirmed")
    .flatMap((o) => o.entitlements ?? []);
  const entryCount = confirmedEntitlements.filter((e) => e.kind === "ticket").length;
  const karaokeCount = confirmedEntitlements.filter((e) => e.kind === "karaoke").length;
  const goodsCount = confirmedEntitlements.filter((e) => e.kind === "goods").length;
  const pendingCount = orders.filter(
    (o) => o.status === "prepared" || o.status === "awaiting_payment" || o.status === "review_required",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">マイページ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user.displayName} さん（{user.email}）でログイン中
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">入場チケット</CardTitle>
            <CardDescription>電子チケット・QRを確認できます（{entryCount}件）</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/mypage/entry-tickets">見る</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">カラオケ予約</CardTitle>
            <CardDescription>予約と受付用QRを確認できます（{karaokeCount}件）</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/mypage/karaoke">見る</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">グッズ</CardTitle>
            <CardDescription>会場受け取り状況を確認できます（{goodsCount}件）</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" nativeButton={false} render={<Link href="/mypage/goods">見る</Link>} />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">購入履歴</CardTitle>
            <CardDescription>
              注文・決済状況を確認できます
              {pendingCount > 0 ? `（未確定 ${pendingCount}件）` : ""}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
              nativeButton={false}
              render={<Link href="/mypage/orders">見る</Link>}
            />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">プロフィール</CardTitle>
            <CardDescription>表示名の確認・変更ができます</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              variant="outline"
              nativeButton={false}
              render={<Link href="/mypage/profile">見る</Link>}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
