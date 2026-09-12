"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { OrderStatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { PaymentMethod } from "@/lib/types";

export default function PaymentMethodPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { getOrder, startCheckout } = useStore();
  const order = getOrder(orderId);
  const [method, setMethod] = useState<PaymentMethod>("card");

  if (!order) {
    return <OrderNotFound />;
  }

  if (order.status !== "prepared" && order.status !== "awaiting_payment") {
    return <OrderNotPayable status={order.status} orderId={order.id} />;
  }

  function handleNext() {
    // SPEC-070 §9: Checkout Session作成成功でOrderをAWAITING_PAYMENTへ進める
    const attemptId = startCheckout(orderId, method);
    router.push(`/checkout/${orderId}/${method}?attemptId=${attemptId}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">お支払い方法の選択</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">お支払い方法</CardTitle>
          <CardDescription>クレジットカードまたはコンビニ払いを選択してください（PAY-040）。</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={method} onValueChange={(v) => setMethod(v as PaymentMethod)} className="space-y-3">
            <Label
              htmlFor="method-card"
              className="flex items-center gap-3 rounded-md border p-3 cursor-pointer has-[[data-state=checked]]:border-primary"
            >
              <RadioGroupItem value="card" id="method-card" />
              <div>
                <p className="font-medium">クレジットカード</p>
                <p className="text-xs text-muted-foreground">即時決済・有効期限30分（PAY-041）</p>
              </div>
            </Label>
            <Label
              htmlFor="method-konbini"
              className="flex items-center gap-3 rounded-md border p-3 cursor-pointer has-[[data-state=checked]]:border-primary"
            >
              <RadioGroupItem value="konbini" id="method-konbini" />
              <div>
                <p className="font-medium">コンビニ払い</p>
                <p className="text-xs text-muted-foreground">
                  バウチャー発行後、店頭でお支払い（有効期限は数日間）
                </p>
              </div>
            </Label>
          </RadioGroup>

          {method === "konbini" && (
            <Alert className="mt-4">
              <AlertTitle>受け入れたリスクの明示（PAY-170）</AlertTitle>
              <AlertDescription>
                コンビニ払いはバウチャー有効期限に合わせて枠の確保が数日間継続します。カラオケ枠等の数量限定商品は、その間は他の利用者が購入できません。
              </AlertDescription>
            </Alert>
          )}

          <Button className="w-full mt-4" size="lg" onClick={handleNext}>
            次へ進む
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderNotFound() {
  return (
    <Alert variant="destructive">
      <AlertTitle>注文が見つかりません</AlertTitle>
      <AlertDescription>カートから購入手続きをやり直してください。</AlertDescription>
    </Alert>
  );
}

function OrderNotPayable({ status, orderId }: { status: string; orderId: string }) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTitle>この注文はお支払いに進めません</AlertTitle>
        <AlertDescription>現在の状態: {status}</AlertDescription>
      </Alert>
      <Button
        variant="outline"
        nativeButton={false}
        render={<a href={`/mypage/orders/${orderId}`}>注文詳細を見る</a>}
      />
    </div>
  );
}
