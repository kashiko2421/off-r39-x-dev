"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderSummary } from "@/components/order-summary";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

// PAY-073相当の見た目上の演出のみ。実際のカード検証・課金は一切行わない。
const DECLINE_TEST_NUMBER = "4000000000000002";

function CardPaymentForm() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const { getOrder } = useStore();
  const order = getOrder(orderId);
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/30");
  const [cvc, setCvc] = useState("123");
  const [submitting, setSubmitting] = useState(false);

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertTitle>注文が見つかりません</AlertTitle>
      </Alert>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const normalized = cardNumber.replace(/\s/g, "");
    const outcome = normalized === DECLINE_TEST_NUMBER ? "failed" : "succeeded";
    const qs = new URLSearchParams({ attemptId, outcome });
    if (outcome === "failed") {
      qs.set("reason", "カード会社により決済が拒否されました（テストシナリオ）");
    }
    router.push(`/checkout/${orderId}/processing?${qs.toString()}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">クレジットカード情報の入力</h1>

      <OrderSummary order={order} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">カード情報（モック入力）</CardTitle>
          <CardDescription>
            実際のカード情報は保持しません（SEC-AUTH-003相当）。テスト用番号でエラー動作を確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertDescription className="text-xs">
              成功例: 4242 4242 4242 4242 ／ 失敗例: 4000 0000 0000 0002
            </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">カード番号</Label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="expiry">有効期限</Label>
                <Input
                  id="expiry"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  required
                  inputMode="numeric"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "処理を開始しています…" : `${yen.format(order.totalAmount)} を支払う`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CardPaymentPage() {
  return (
    <Suspense fallback={null}>
      <CardPaymentForm />
    </Suspense>
  );
}
