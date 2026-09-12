"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { dateLabel } from "@/lib/karaoke";
import { PseudoQr } from "@/components/qr-code";
import { EntitlementStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";

// SPEC-050 PG-MYP-010 Karaoke QR: Entry QRと明確に異なるタイトルで「カラオケ受付用」を明示する
export default function KaraokeReservationQrPage() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace(`/account/login?redirect=/mypage/karaoke/${reservationId}/qr`);
  }, [hydrated, user, router, reservationId]);

  if (!hydrated || !user) return null;

  const found = orders
    .flatMap((o) => (o.entitlements ?? []).map((ent) => ({ ...ent, orderStatus: o.status })))
    .find((ent) => ent.code === decodeURIComponent(reservationId) && ent.kind === "karaoke");

  if (!found) {
    return (
      <Alert variant="destructive">
        <AlertTitle>予約が見つかりません</AlertTitle>
      </Alert>
    );
  }

  const canUse = found.status === "valid" && found.orderStatus === "confirmed";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">カラオケチケット / カラオケ受付用</h1>
        <EntitlementStatusBadge status={found.status} />
      </div>

      {found.karaoke && (
        <p className="text-sm text-muted-foreground">
          {dateLabel(found.karaoke.date)} {found.karaoke.startTime}〜{found.karaoke.endTime}
        </p>
      )}

      {!canUse && (
        <Alert>
          <AlertTitle>{found.status === "used" ? "使用済みです" : "現在は受付に利用できません"}</AlertTitle>
        </Alert>
      )}

      <Card>
        <CardContent className={`flex flex-col items-center gap-3 py-6 ${canUse ? "" : "opacity-40"}`}>
          <PseudoQr value={found.code} size={220} />
          <p className="font-mono text-xs text-muted-foreground">{found.code}</p>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href={`/mypage/karaoke/${reservationId}`}>予約詳細に戻る</Link>}
      />
    </div>
  );
}
