"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { dateLabel } from "@/lib/karaoke";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

const STATUS_LABEL: Record<string, string> = {
  available: "予約購入可能",
  held: "他の購入試行で確保中",
  sold: "販売済み",
  sales_stopped: "販売停止",
};

// SPEC-050 PG-KRK-003 Karaoke Slot Detail
export default function KaraokeSlotDetailPage() {
  const { slotId } = useParams<{ slotId: string }>();
  const router = useRouter();
  const { karaokeSlots, user, addKaraokeSlotToCart } = useStore();
  const slot = karaokeSlots.find((s) => s.id === slotId);
  const [added, setAdded] = useState(false);

  if (!slot) {
    return (
      <Alert variant="destructive">
        <AlertTitle>枠が見つかりません</AlertTitle>
      </Alert>
    );
  }

  const purchasable = slot.status === "available";

  function handlePurchaseStart() {
    if (!user) {
      router.push(`/account/login?redirect=/karaoke/slots/${slotId}`);
      return;
    }
    addKaraokeSlotToCart(slot!);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">
          {dateLabel(slot.date)} {slot.startTime}〜{slot.endTime}
        </h1>
        {!purchasable && <Badge variant="secondary">{STATUS_LABEL[slot.status]}</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">枠の詳細</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-semibold">{yen.format(slot.price)}</p>
          <p className="text-sm text-muted-foreground">
            利用時間 {slot.startTime}〜{slot.endTime}（{slot.usageMinutes}分）
          </p>
          {!purchasable && (
            <Alert>
              <AlertTitle>{STATUS_LABEL[slot.status]}</AlertTitle>
            </Alert>
          )}
          {!user && purchasable && (
            <p className="text-xs text-muted-foreground">購入手続きにはログインが必要です。</p>
          )}
          <Button
            className="w-full"
            disabled={!purchasable}
            variant={added ? "secondary" : "default"}
            onClick={handlePurchaseStart}
          >
            {!purchasable
              ? STATUS_LABEL[slot.status]
              : added
                ? "カートに追加しました"
                : user
                  ? "カートに追加"
                  : "ログインして購入"}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href={`/karaoke/schedule/${slot.date}`}>空き状況に戻る</Link>}
      />
    </div>
  );
}
