"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { OrderStatusBadge, CheckoutAttemptBadge, RefundStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const METHOD_LABEL: Record<string, string> = { card: "クレジットカード", konbini: "コンビニ払い" };

function entitlementLink(orderId: string, code: string, kind: string): string {
  if (kind === "ticket") return `/mypage/entry-tickets/${code}`;
  if (kind === "karaoke") return `/mypage/karaoke/${code}`;
  return `/mypage/goods/${code}`;
}

// SPEC-050 PG-MYP-004 Order Detail
export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrder } = useStore();
  const order = getOrder(orderId);

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>注文が見つかりません</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">注文詳細</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">決済試行履歴</CardTitle>
          <CardDescription>
            個別の失敗のたびに新しい試行が記録されます（SPEC-070: Order:Checkout Attempt = 1:N）。
          </CardDescription>
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

      {order.status === "confirmed" && order.entitlements && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">発行された権利</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.entitlements.map((ent) => (
              <Link key={ent.code} href={entitlementLink(order.id, ent.code, ent.kind)}>
                <div className="flex items-center justify-between rounded-md border p-2 text-sm hover:bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">{ent.label}</p>
                    <span className="font-mono text-xs">{ent.code}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">詳細を見る ›</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {(order.status === "prepared" || order.status === "awaiting_payment") && (
        <Alert>
          <AlertTitle>この注文は運営操作のみで取消可能です</AlertTitle>
          <AlertDescription>
            利用者自身による取消は提供していません。お支払い期限を過ぎると自動的に失効します。
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {(order.status === "prepared" || order.status === "awaiting_payment") && (
          <Button
            className="flex-1"
            nativeButton={false}
            render={<Link href={`/purchase/orders/${order.id}`}>お支払いへ進む</Link>}
          />
        )}
        <Button
          variant="ghost"
          className="flex-1"
          nativeButton={false}
          render={<Link href="/mypage/orders">注文履歴に戻る</Link>}
        />
      </div>
    </div>
  );
}
