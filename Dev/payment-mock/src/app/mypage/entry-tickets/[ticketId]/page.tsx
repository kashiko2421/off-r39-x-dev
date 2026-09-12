"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EntitlementStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";

// SPEC-050 PG-MYP-006 Entry Ticket Detail（QR自体は専用のPG-MYP-007へ分離する）
export default function EntryTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace(`/account/login?redirect=/mypage/entry-tickets/${ticketId}`);
  }, [hydrated, user, router, ticketId]);

  if (!hydrated || !user) return null;

  const found = orders
    .flatMap((o) => (o.entitlements ?? []).map((ent) => ({ ...ent, orderId: o.id, orderStatus: o.status })))
    .find((ent) => ent.code === decodeURIComponent(ticketId) && ent.kind === "ticket");

  if (!found) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>チケットが見つかりません</AlertTitle>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/mypage/entry-tickets">一覧に戻る</Link>} />
      </div>
    );
  }

  // gap analysis是正: EntitlementのstatusだけでなくOrder Stateも確認する(取消済み注文のQRを有効表示しない)
  const canUse = found.status === "valid" && found.orderStatus === "confirmed";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{found.label}</h1>
        <EntitlementStatusBadge status={found.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">入場チケット</CardTitle>
          <CardDescription>会場入口の受付で提示する電子チケットです。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-mono text-xs text-muted-foreground">{found.code}</p>
          <p>{canUse ? "入場受付に利用可能です。" : "現在、受付には利用できません。"}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!canUse}
          nativeButton={false}
          render={<Link href={`/mypage/entry-tickets/${ticketId}/qr`}>QRを表示する</Link>}
        />
        <Button
          variant="outline"
          className="flex-1"
          nativeButton={false}
          render={<Link href={`/mypage/orders/${found.orderId}`}>注文を見る</Link>}
        />
      </div>
      <Button variant="ghost" nativeButton={false} render={<Link href="/mypage/entry-tickets">一覧に戻る</Link>} />
    </div>
  );
}
