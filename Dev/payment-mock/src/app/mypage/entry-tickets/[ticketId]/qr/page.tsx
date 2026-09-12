"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PseudoQr } from "@/components/qr-code";
import { EntitlementStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";

// SPEC-050 PG-MYP-007 Entry QR: 「入場受付用」であることを明示する専用ページ
export default function EntryTicketQrPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace(`/account/login?redirect=/mypage/entry-tickets/${ticketId}/qr`);
  }, [hydrated, user, router, ticketId]);

  if (!hydrated || !user) return null;

  const found = orders
    .flatMap((o) => (o.entitlements ?? []).map((ent) => ({ ...ent, orderStatus: o.status })))
    .find((ent) => ent.code === decodeURIComponent(ticketId) && ent.kind === "ticket");

  if (!found) {
    return (
      <Alert variant="destructive">
        <AlertTitle>チケットが見つかりません</AlertTitle>
      </Alert>
    );
  }

  const canUse = found.status === "valid" && found.orderStatus === "confirmed";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">入場チケット / 入場受付用</h1>
        <EntitlementStatusBadge status={found.status} />
      </div>

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
        render={<Link href={`/mypage/entry-tickets/${ticketId}`}>チケット詳細に戻る</Link>}
      />
    </div>
  );
}
