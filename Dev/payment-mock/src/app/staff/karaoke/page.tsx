"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { isWithinKaraokeCheckinWindow, dateLabel } from "@/lib/karaoke";
import type { Entitlement, Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntitlementStatusBadge } from "@/components/status-badge";

type LookupResult =
  | { kind: "not_found" }
  | { kind: "wrong_kind" }
  | { kind: "reservation_canceled"; entitlement: Entitlement; order: Order }
  | { kind: "ticket_canceled"; entitlement: Entitlement; order: Order }
  | { kind: "ticket_expired"; entitlement: Entitlement; order: Order }
  | { kind: "already_used"; entitlement: Entitlement; order: Order }
  | { kind: "outside_window"; entitlement: Entitlement; order: Order }
  | { kind: "valid"; entitlement: Entitlement; order: Order };

export default function KaraokeCheckInPage() {
  const { orders, findEntitlementByCode, markEntitlementUsed } = useStore();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);

  function handleLookup(rawCode?: string) {
    const target = (rawCode ?? code).trim();
    if (!target) return;
    setCode(target);
    setCheckedIn(false);
    const found = findEntitlementByCode(target);
    if (!found) {
      setResult({ kind: "not_found" });
      return;
    }
    const { entitlement, order } = found;
    if (entitlement.kind !== "karaoke") {
      setResult({ kind: "wrong_kind" });
      return;
    }
    // KRK-CFM-005: Reservation "USED" state は存在しない。取消はOrder状態から、利用済みはTicket状態から判定する。
    if (order.status === "canceled") {
      setResult({ kind: "reservation_canceled", entitlement, order });
      return;
    }
    if (entitlement.status === "canceled") {
      setResult({ kind: "ticket_canceled", entitlement, order });
      return;
    }
    if (entitlement.status === "expired") {
      setResult({ kind: "ticket_expired", entitlement, order });
      return;
    }
    if (entitlement.status === "used") {
      setResult({ kind: "already_used", entitlement, order });
      return;
    }
    // SPEC-090 KRK-CHK-003/004: 通常Check-in windowの外は受付をブロックする(警告のみにしない)
    if (
      entitlement.karaoke &&
      !isWithinKaraokeCheckinWindow(entitlement.karaoke.date, entitlement.karaoke.startTime, entitlement.karaoke.endTime)
    ) {
      setResult({ kind: "outside_window", entitlement, order });
      return;
    }
    setResult({ kind: "valid", entitlement, order });
  }

  function handleCheckIn() {
    if (result?.kind !== "valid") return;
    markEntitlementUsed(result.order.id, result.entitlement.code);
    setCheckedIn(true);
  }

  const demoReservations = orders
    .filter((o) => o.status === "confirmed")
    .flatMap((o) => (o.entitlements ?? []).filter((e) => e.kind === "karaoke").map((e) => ({ e, o })));

  const showsSlotCard =
    result?.kind === "valid" ||
    result?.kind === "already_used" ||
    result?.kind === "ticket_canceled" ||
    result?.kind === "ticket_expired" ||
    result?.kind === "outside_window";
  const slot = showsSlotCard ? result.entitlement.karaoke : undefined;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">カラオケ受付</h1>
        <p className="text-sm text-muted-foreground mt-1">
          予約情報をサーバー側に照会し、有効性を確認したうえで受付します（KRK-CHK-*）。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">QRコードの照会</CardTitle>
          <CardDescription>QR読み取り機の代わりに、コードを入力して照会します。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="code">予約コード</Label>
              <Input
                id="code"
                placeholder="KARAOKE-kar-xxxxxxxx-1-xxxxxx"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
            </div>
            <Button className="self-end" onClick={() => handleLookup()}>
              照会する
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="space-y-3">
            {result.kind === "not_found" && (
              <Alert variant="destructive">
                <AlertTitle>予約が見つかりません（UNKNOWN_TOKEN）</AlertTitle>
                <AlertDescription>コードを確認してください。</AlertDescription>
              </Alert>
            )}
            {result.kind === "wrong_kind" && (
              <Alert variant="destructive">
                <AlertTitle>カラオケ予約ではありません（WRONG_PURPOSE）</AlertTitle>
                <AlertDescription>
                  このコードはカラオケ用ではないため、カラオケ受付では利用できません（INV-SYS-001）。
                </AlertDescription>
              </Alert>
            )}
            {result.kind === "reservation_canceled" && (
              <Alert variant="destructive">
                <AlertTitle>この予約は取消されています（RESERVATION_CANCELED）</AlertTitle>
                <AlertDescription>受付できません。</AlertDescription>
              </Alert>
            )}
            {result.kind === "ticket_canceled" && (
              <Alert variant="destructive">
                <AlertTitle>取消済みのチケットです（TICKET_CANCELED）</AlertTitle>
                <AlertDescription>受付できません。</AlertDescription>
              </Alert>
            )}
            {result.kind === "ticket_expired" && (
              <Alert variant="destructive">
                <AlertTitle>失効済みのチケットです（TICKET_EXPIRED）</AlertTitle>
                <AlertDescription>受付できません。</AlertDescription>
              </Alert>
            )}
            {result.kind === "already_used" && (
              <Alert variant="destructive">
                <AlertTitle>使用済みの予約です（ALREADY_USED）</AlertTitle>
                <AlertDescription>二重利用は防止されます。</AlertDescription>
              </Alert>
            )}
            {result.kind === "outside_window" && (
              <Alert variant="destructive">
                <AlertTitle>受付時間外です（OUTSIDE_CHECKIN_WINDOW）</AlertTitle>
                <AlertDescription>
                  通常の受付可能時間（利用開始10分前〜利用終了まで）の外のため、受付できません（KRK-CHK-003/004）。
                </AlertDescription>
              </Alert>
            )}
            {showsSlotCard && (
              <div className="rounded-md border p-3 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.entitlement.label}</span>
                  <EntitlementStatusBadge status={result.entitlement.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <dt>予約者</dt>
                  <dd className="text-foreground">{result.order.purchaserName ?? "（不明）"}</dd>
                  {slot && (
                    <>
                      <dt>利用日</dt>
                      <dd className="text-foreground">{dateLabel(slot.date)}</dd>
                      <dt>利用時間</dt>
                      <dd className="text-foreground">
                        {slot.startTime}〜{slot.endTime}
                      </dd>
                    </>
                  )}
                </dl>
                <p className="text-xs text-muted-foreground font-mono">{result.entitlement.code}</p>
              </div>
            )}
            {result.kind === "valid" && !checkedIn && (
              <Button className="w-full" onClick={handleCheckIn}>
                受付する（CHECKED_IN）
              </Button>
            )}
            {checkedIn && (
              <Alert>
                <AlertTitle>受付が完了しました</AlertTitle>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {demoReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">動作確認用: 発行済みの予約から選択</CardTitle>
            <CardDescription>
              実運用ではスタッフが利用者のQRを読み取りますが、本モックは同一端末のデータしか参照できないため、確認用にここから選べるようにしています。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoReservations.map(({ e }) => (
              <button
                key={e.code}
                type="button"
                onClick={() => handleLookup(e.code)}
                className="w-full flex items-center justify-between rounded-md border p-2 text-sm text-left hover:bg-muted/50"
              >
                <span className="font-mono text-xs">{e.code}</span>
                <EntitlementStatusBadge status={e.status} />
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
