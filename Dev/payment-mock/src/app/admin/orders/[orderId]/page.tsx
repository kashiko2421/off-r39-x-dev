"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { OrderStatusBadge, CheckoutAttemptBadge, RefundStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const METHOD_LABEL: Record<string, string> = { card: "クレジットカード", konbini: "コンビニ払い" };

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder, forceCancelOrder, requestRefund } = useStore();
  const order = getOrder(orderId);
  const [reason, setReason] = useState("");
  const [refundError, setRefundError] = useState<string | null>(null);

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>注文が見つかりません</AlertTitle>
      </Alert>
    );
  }

  const hasUsedEntitlement = (order.entitlements ?? []).some((e) => e.status === "used");
  const canForceCancel =
    order.status === "prepared" || order.status === "awaiting_payment" || order.status === "review_required";
  const canRefund = order.status === "confirmed" && !order.refund;

  function handleRefund() {
    if (!reason.trim()) {
      setRefundError("返金理由の入力は必須です（PRJ-103, PRJ-120相当）。");
      return;
    }
    const result = requestRefund(orderId, reason.trim());
    if (!result.ok) {
      setRefundError(result.error);
      return;
    }
    setRefundError(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">注文詳細（管理）</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">決済試行履歴</CardTitle>
          <CardDescription>SPEC-070: Order:Checkout Attempt = 1:N。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.checkoutAttempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ決済は試行されていません。</p>
          ) : (
            order.checkoutAttempts.map((a) => (
              <div key={a.id} className="rounded-md border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <CheckoutAttemptBadge outcome={a.outcome} />
                </div>
                <p>{METHOD_LABEL[a.method] ?? a.method}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </p>
                {a.failureReason && (
                  <p className="text-xs text-red-600 dark:text-red-400">{a.failureReason}</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {order.entitlements && order.entitlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">発行済みの権利</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.entitlements.map((ent) => (
              <div key={ent.code} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="font-mono text-xs">{ent.code}</span>
                <span className="text-muted-foreground text-xs">
                  {ent.label}（{ent.status}）
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {order.refund && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">返金</CardTitle>
              <RefundStatusBadge status={order.refund.status} />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>理由: {order.refund.reason}</p>
          </CardContent>
        </Card>
      )}

      {canForceCancel && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">運営操作: 取消</CardTitle>
            <CardDescription>
              DEC-B-03: Order取消は運営のみ実行可能。理由入力・監査記録は今回のモックでは省略しています。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => forceCancelOrder(order.id)}>
              この注文を取消する
            </Button>
          </CardContent>
        </Card>
      )}

      {canRefund && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">運営操作: 返金</CardTitle>
            <CardDescription>
              SPEC-070 §35〜39: 確定済み(CONFIRMED)注文の取消は、直接の状態変更ではなく全額返金(Full Refund)経由のみ許可します。
              {hasUsedEntitlement && " 使用済みの権利が含まれるため、通常の返金操作では処理できません。"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="reason">返金理由（必須）</Label>
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            {refundError && (
              <Alert variant="destructive">
                <AlertDescription>{refundError}</AlertDescription>
              </Alert>
            )}
            <Button variant="destructive" disabled={hasUsedEntitlement} onClick={handleRefund}>
              全額返金する
            </Button>
          </CardContent>
        </Card>
      )}

      <Button variant="ghost" nativeButton={false} render={<Link href="/admin/orders">注文一覧に戻る</Link>} />
    </div>
  );
}
