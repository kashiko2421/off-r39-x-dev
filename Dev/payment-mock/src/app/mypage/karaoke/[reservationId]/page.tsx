"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { dateLabel } from "@/lib/karaoke";
import { EntitlementStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";

// SPEC-050 PG-MYP-009 Karaoke Reservation Detail（QR自体はPG-MYP-010へ分離）
export default function KaraokeReservationDetailPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace(`/account/login?redirect=/mypage/karaoke/${reservationId}`);
  }, [hydrated, user, router, reservationId]);

  if (!hydrated || !user) return null;

  const found = orders
    .flatMap((o) => (o.entitlements ?? []).map((ent) => ({ ...ent, orderId: o.id, orderStatus: o.status })))
    .find((ent) => ent.code === decodeURIComponent(reservationId) && ent.kind === "karaoke");

  if (!found) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>予約が見つかりません</AlertTitle>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/mypage/karaoke">一覧に戻る</Link>} />
      </div>
    );
  }

  const canUse = found.status === "valid" && found.orderStatus === "confirmed";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{found.label}</h1>
        <EntitlementStatusBadge status={found.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">予約内容</CardTitle>
          <CardDescription>カラオケコーナー前の受付で提示する電子チケットです。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {found.karaoke && (
            <p>
              {dateLabel(found.karaoke.date)} {found.karaoke.startTime}〜{found.karaoke.endTime}
            </p>
          )}
          <p className="font-mono text-xs text-muted-foreground">{found.code}</p>
          <p>{canUse ? "カラオケ受付に利用可能です。" : "現在、受付には利用できません。"}</p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={!canUse}
          nativeButton={false}
          render={<Link href={`/mypage/karaoke/${reservationId}/qr`}>QRを表示する</Link>}
        />
        <Button
          variant="outline"
          className="flex-1"
          nativeButton={false}
          render={<Link href={`/mypage/orders/${found.orderId}`}>注文を見る</Link>}
        />
      </div>
      <Button variant="ghost" nativeButton={false} render={<Link href="/mypage/karaoke">一覧に戻る</Link>} />
    </div>
  );
}
