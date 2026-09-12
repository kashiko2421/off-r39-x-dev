"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function FailedContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const { getOrder } = useStore();
  const order = getOrder(orderId);

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>注文が見つかりません</AlertTitle>
      </Alert>
    );
  }

  const attempt =
    order.checkoutAttempts.find((a) => a.id === attemptId) ?? order.checkoutAttempts.at(-1);

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="mx-auto size-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-2xl">
          !
        </div>
        <h1 className="text-xl font-semibold mt-3">お支払いを完了できませんでした</h1>
      </div>

      <Alert variant="destructive">
        <AlertTitle>失敗理由</AlertTitle>
        <AlertDescription>
          {attempt?.failureReason ?? "決済処理中にエラーが発生しました。"}
        </AlertDescription>
      </Alert>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">この注文は引き続きお支払いいただけます</CardTitle>
          <CardDescription>
            注文はキャンセルされていません（PAY-FLR-006: 同一Checkout内での再試行を許容）。別のお支払い方法で再試行できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={() => router.push(`/checkout/${orderId}/payment-method`)}>
            お支払い方法を選び直す
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            nativeButton={false}
            render={<Link href="/">商品一覧へ戻る</Link>}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={null}>
      <FailedContent />
    </Suspense>
  );
}
