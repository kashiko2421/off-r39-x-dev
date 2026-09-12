"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Entitlement, Order } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntitlementStatusBadge } from "@/components/status-badge";

// SPEC-080 §30 Canonical Check-in outcome の一部を簡略化して表現する
type LookupResult =
  | { kind: "not_found" }
  | { kind: "wrong_kind"; entitlement: Entitlement }
  | { kind: "order_not_confirmed"; entitlement: Entitlement; order: Order }
  | { kind: "ticket_canceled"; entitlement: Entitlement; order: Order }
  | { kind: "ticket_expired"; entitlement: Entitlement; order: Order }
  | { kind: "already_used"; entitlement: Entitlement; order: Order }
  | { kind: "valid"; entitlement: Entitlement; order: Order };

export default function CheckInPage() {
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
    // TQR-CHK-003: purposeが違う場合はTicket stateを変更せずwrong purposeとしてReject
    if (entitlement.kind !== "ticket") {
      setResult({ kind: "wrong_kind", entitlement });
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
    // TQR-TKT-002: Order CONFIRMED以外から有効なEntry QRを提供しない
    if (order.status !== "confirmed") {
      setResult({ kind: "order_not_confirmed", entitlement, order });
      return;
    }
    setResult({ kind: "valid", entitlement, order });
  }

  function handleCheckIn() {
    if (result?.kind !== "valid") return;
    markEntitlementUsed(result.order.id, result.entitlement.code);
    setCheckedIn(true);
  }

  // handoff 12章: 実運用ではスタッフが他人のQRを読み取るが、本モックは単一端末のlocalStorageしか
  // 参照できないため、動作確認用に発行済みの入場チケットをクイック選択できるようにしている。
  const demoTickets = orders
    .filter((o) => o.status === "confirmed")
    .flatMap((o) => (o.entitlements ?? []).filter((e) => e.kind === "ticket").map((e) => ({ e, o })));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">入場受付</h1>
        <p className="text-sm text-muted-foreground mt-1">
          QRコードの内容をサーバー側に照会し、有効性を確認したうえで受付します（TQR-CHK-*）。
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
              <Label htmlFor="code">チケットコード</Label>
              <Input
                id="code"
                placeholder="TICKET-tkt-general-1-xxxxxx"
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
                <AlertTitle>チケットが見つかりません（UNKNOWN_TOKEN）</AlertTitle>
                <AlertDescription>コードを確認してください。</AlertDescription>
              </Alert>
            )}
            {result.kind === "wrong_kind" && (
              <Alert variant="destructive">
                <AlertTitle>入場チケットではありません（WRONG_PURPOSE）</AlertTitle>
                <AlertDescription>
                  このコードは入場用ではないため、入場受付では利用できません（INV-SYS-001）。
                </AlertDescription>
              </Alert>
            )}
            {result.kind === "order_not_confirmed" && (
              <Alert variant="destructive">
                <AlertTitle>この注文はまだ確定していません</AlertTitle>
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
                <AlertTitle>使用済みのチケットです（ALREADY_USED）</AlertTitle>
                <AlertDescription>二重利用は防止されます。</AlertDescription>
              </Alert>
            )}
            {(result.kind === "valid" ||
              result.kind === "already_used" ||
              result.kind === "ticket_canceled" ||
              result.kind === "ticket_expired") && (
              <div className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{result.entitlement.label}</span>
                  <EntitlementStatusBadge status={result.entitlement.status} />
                </div>
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

      {demoTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">動作確認用: 発行済みの入場チケットから選択</CardTitle>
            <CardDescription>
              実運用ではスタッフが利用者のQRを読み取りますが、本モックは同一端末のデータしか参照できないため、確認用にここから選べるようにしています。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoTickets.map(({ e }) => (
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
