"use client";

import { Suspense, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { CheckoutAttemptBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";

function voucherNumberFor(attemptId: string): string {
  const digits = Array.from(attemptId).reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  const value = Math.abs(digits).toString().padStart(12, "0").slice(0, 12);
  return value.match(/.{1,4}/g)?.join(" ") ?? value;
}

function VoucherContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const { getOrder } = useStore();
  const order = getOrder(orderId);

  const dueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short" });
  }, []);

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>注文が見つかりません</AlertTitle>
      </Alert>
    );
  }

  const attempt = order.checkoutAttempts.find((a) => a.id === attemptId);

  function handleSimulateWebhook(outcome: "succeeded" | "failed") {
    const qs = new URLSearchParams({ attemptId, outcome });
    if (outcome === "failed") {
      qs.set("reason", "お支払い期限内にコンビニ店頭でのお支払いが確認できませんでした（テストシナリオ）");
      // SPEC-070 §20 / §25: コンビニ払いで支払可能性が終了した場合、PAYMENT_FAILEDではなくEXPIREDへ進める
      qs.set("expireOrder", "true");
    }
    router.push(`/checkout/${orderId}/processing?${qs.toString()}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">お支払い番号を発行しました</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">コンビニ支払い情報</CardTitle>
            {attempt && <CheckoutAttemptBadge outcome={attempt.outcome} />}
          </div>
          <CardDescription>お近くのコンビニ店頭でこの番号をお伝えください。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border bg-muted/40 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">お支払い番号</p>
            <p className="font-mono text-lg tracking-wider">{voucherNumberFor(attemptId)}</p>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">お支払い期限</span>
            <span>{dueDate}</span>
          </div>
        </CardContent>
      </Card>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">動作確認用（デモ操作）</CardTitle>
          <CardDescription>
            実際は店頭でのお支払い後、数日以内にStripe Webhookで確定します。ここでは確認のため即時にシミュレートできます。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => handleSimulateWebhook("succeeded")}>
            入金完了を受信した想定にする
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSimulateWebhook("failed")}
          >
            期限切れ・未入金として扱う
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KonbiniVoucherPage() {
  return (
    <Suspense fallback={null}>
      <VoucherContent />
    </Suspense>
  );
}
