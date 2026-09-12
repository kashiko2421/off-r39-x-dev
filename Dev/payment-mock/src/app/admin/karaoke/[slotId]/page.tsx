"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { dateLabel } from "@/lib/karaoke";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KaraokeSlotStatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminKaraokeSlotDetailPage() {
  const { slotId } = useParams<{ slotId: string }>();
  const router = useRouter();
  const { karaokeSlots, updateKaraokeSlotStatus, updateKaraokeSlotPrice, deleteKaraokeSlot } = useStore();
  const slot = karaokeSlots.find((s) => s.id === slotId);
  const [price, setPrice] = useState(slot?.price ?? 0);
  const [saved, setSaved] = useState(false);

  if (!slot) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>枠が見つかりません</AlertTitle>
        </Alert>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/karaoke">一覧に戻る</Link>} />
      </div>
    );
  }

  // SPEC-090 §19: HELD/SOLDは通常編集不可。AVAILABLE/SALES_STOPPEDのみ編集可能。
  const editable = slot.status === "available" || slot.status === "sales_stopped";

  function handleSavePrice() {
    updateKaraokeSlotPrice(slotId, price);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleDelete() {
    deleteKaraokeSlot(slotId);
    router.push("/admin/karaoke");
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">
          {dateLabel(slot.date)} {slot.startTime}〜{slot.endTime}
        </h1>
        <KaraokeSlotStatusBadge status={slot.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">枠の情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">利用時間</dt>
            <dd>{slot.usageMinutes}分</dd>
            <dt className="text-muted-foreground">整備時間</dt>
            <dd>{slot.maintenanceMinutes}分</dd>
            <dt className="text-muted-foreground">枠ID</dt>
            <dd className="font-mono text-xs">{slot.id}</dd>
          </dl>
        </CardContent>
      </Card>

      {slot.status === "held" && (
        <Alert>
          <AlertTitle>この枠は現在確保中です</AlertTitle>
          <AlertDescription>
            他の利用者の購入試行中のため、価格変更・販売停止・削除はできません（SPEC-090 §19 KRK-EDT-004）。
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">価格変更</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="price">価格（円）</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={price}
              disabled={!editable}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          {saved && (
            <Alert>
              <AlertDescription>保存しました。</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" disabled={!editable} onClick={handleSavePrice}>
            価格を保存する
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">販売状態</CardTitle>
          <CardDescription>
            売り切れ（購入成立）と販売停止（運営操作）は別の状態として扱います。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {slot.status === "available" && (
            <Button variant="outline" onClick={() => updateKaraokeSlotStatus(slot.id, "sales_stopped")}>
              この枠の販売を停止する
            </Button>
          )}
          {slot.status === "sales_stopped" && (
            <Button variant="outline" onClick={() => updateKaraokeSlotStatus(slot.id, "available")}>
              この枠の販売を再開する
            </Button>
          )}
          {slot.status === "sold" && (
            <Alert>
              <AlertDescription>
                購入が成立しているため、販売再開はできません（二重販売防止）。返金・キャンセル操作は別Authorityの対応です。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">枠の削除</CardTitle>
          {!editable && (
            <CardDescription className="text-destructive">
              {slot.status === "sold"
                ? "購入済みのため削除できません（SPEC-090 §19 KRK-EDT-006）。"
                : "確保中のため削除できません。"}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled={!editable} onClick={handleDelete}>
            この枠を削除する
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" nativeButton={false} render={<Link href="/admin/karaoke">一覧に戻る</Link>} />
    </div>
  );
}
