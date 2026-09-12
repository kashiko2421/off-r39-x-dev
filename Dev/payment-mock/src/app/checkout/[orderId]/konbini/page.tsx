"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function KonbiniConfirmForm() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const { getOrder } = useStore();
  const order = getOrder(orderId);

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>注文が見つかりません</AlertTitle>
      </Alert>
    );
  }

  function handleIssue() {
    router.push(`/checkout/${orderId}/konbini/voucher?attemptId=${attemptId}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">コンビニ払い</h1>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">お支払い方法の確認</CardTitle>
          <CardDescription>
            番号発行後、コンビニ店頭でお支払いいただきます（PAY-041）。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>お支払い期限にご注意ください</AlertTitle>
            <AlertDescription>
              コンビニ払いはバウチャーの有効期限（数日間）に合わせて枠を確保します。期限を過ぎるとお支払いいただけません。
            </AlertDescription>
          </Alert>
          <Button className="w-full" size="lg" onClick={handleIssue}>
            支払い番号を発行する
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function KonbiniPaymentPage() {
  return (
    <Suspense fallback={null}>
      <KonbiniConfirmForm />
    </Suspense>
  );
}
