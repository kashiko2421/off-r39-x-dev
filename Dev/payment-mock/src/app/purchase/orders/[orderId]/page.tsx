"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/mock-data";
import { OrderSummary } from "@/components/order-summary";
import { OrderStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// SPEC-050 §16 PG-XFN-001 Purchase Status: 外部Checkoutへ進む前・Browser Return後・
// Mypageからの再確認を同一Order単位で表示する。Order Stateだけを唯一の権威とする。
export default function PurchaseStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
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
        <h1 className="text-xl font-semibold">購入状態</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status === "prepared" && (
        <Alert>
          <AlertTitle>支払い手続き未開始</AlertTitle>
          <AlertDescription>この注文はまだ購入確定していません。支払い画面へ進んでください。</AlertDescription>
        </Alert>
      )}
      {order.status === "awaiting_payment" && (
        <Alert>
          <AlertTitle>支払い結果を確認中</AlertTitle>
          <AlertDescription>決済事業者からの結果反映を待っています。しばらくしてから状態を再確認してください。</AlertDescription>
        </Alert>
      )}
      {order.status === "confirmed" && (
        <Alert>
          <AlertTitle>購入確定</AlertTitle>
          <AlertDescription>ご購入ありがとうございます。確認メールを送信しました。</AlertDescription>
        </Alert>
      )}
      {order.status === "payment_failed" && (
        <Alert variant="destructive">
          <AlertTitle>支払い不成立</AlertTitle>
          <AlertDescription>この注文は支払いが成立しませんでした。有効な権利はありません。</AlertDescription>
        </Alert>
      )}
      {order.status === "canceled" && (
        <Alert variant="destructive">
          <AlertTitle>購入手続き取消済み</AlertTitle>
          <AlertDescription>この注文は取消されました。有効な権利はありません。</AlertDescription>
        </Alert>
      )}
      {order.status === "expired" && (
        <Alert variant="destructive">
          <AlertTitle>購入手続き失効</AlertTitle>
          <AlertDescription>お支払い期限を過ぎたため、この注文は失効しました。有効な権利はありません。</AlertDescription>
        </Alert>
      )}
      {order.status === "review_required" && (
        <Alert>
          <AlertTitle>購入状態を確認中</AlertTitle>
          <AlertDescription>安全に自動確定できなかったため、運営で確認しています。しばらくお待ちください。</AlertDescription>
        </Alert>
      )}

      <OrderSummary order={order} />

      {order.status === "confirmed" && order.entitlements && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">発行された権利</CardTitle>
            <CardDescription>入場チケット・カラオケ予約・グッズ引換の権利が発行されました。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.entitlements.map((ent) => (
              <div key={ent.code} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[ent.kind]}</p>
                  <span className="font-mono text-xs">{ent.code}</span>
                </div>
                <span className="text-muted-foreground text-xs">発行済み</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {(order.status === "prepared" || order.status === "awaiting_payment") && (
          <Button
            className="flex-1"
            nativeButton={false}
            render={<Link href={`/checkout/${orderId}/payment-method`}>支払い画面を開く</Link>}
          />
        )}
        {(order.status === "awaiting_payment" || order.status === "review_required") && (
          <Button variant="outline" className="flex-1" onClick={() => router.refresh()}>
            状態を再確認
          </Button>
        )}
        {order.status === "confirmed" && (
          <>
            <Button
              className="flex-1"
              nativeButton={false}
              render={<Link href="/mypage/entry-tickets">保有チケットを見る</Link>}
            />
            <Button
              variant="outline"
              className="flex-1"
              nativeButton={false}
              render={<Link href={`/mypage/orders/${orderId}`}>注文詳細を見る</Link>}
            />
          </>
        )}
        {(order.status === "payment_failed" || order.status === "canceled" || order.status === "expired") && (
          <Button className="flex-1" nativeButton={false} render={<Link href="/">もう一度購入する</Link>} />
        )}
      </div>
    </div>
  );
}
