"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EntitlementStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";

const STATUS_MESSAGE: Record<string, string> = {
  valid: "会場受け取り可能です。受け渡し窓口でスタッフにお伝えください。",
  used: "受け渡し済みです。",
  canceled: "取消済みのため受け取りできません。",
  expired: "受け取り期限が過ぎています。",
};

// SPEC-050 PG-MYP-012 Goods Purchase Detail
export default function GoodsPurchaseDetailPage() {
  const { goodsItemId } = useParams<{ goodsItemId: string }>();
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace(`/account/login?redirect=/mypage/goods/${goodsItemId}`);
  }, [hydrated, user, router, goodsItemId]);

  if (!hydrated || !user) return null;

  const found = orders
    .flatMap((o) => (o.entitlements ?? []).map((ent) => ({ ...ent, orderId: o.id })))
    .find((ent) => ent.code === decodeURIComponent(goodsItemId) && ent.kind === "goods");

  if (!found) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>購入情報が見つかりません</AlertTitle>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/mypage/goods">一覧に戻る</Link>} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{found.label}</h1>
        <EntitlementStatusBadge status={found.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">会場受け渡し情報</CardTitle>
          <CardDescription>発送は行わず、会場での受け渡しのみです。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-mono text-xs text-muted-foreground">{found.code}</p>
          <p>{STATUS_MESSAGE[found.status]}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          nativeButton={false}
          render={<Link href={`/mypage/orders/${found.orderId}`}>注文を見る</Link>}
        />
        <Button variant="ghost" className="flex-1" nativeButton={false} render={<Link href="/mypage/goods">一覧に戻る</Link>} />
      </div>
    </div>
  );
}
