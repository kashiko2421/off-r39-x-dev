"use client";

import { Suspense, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";

// SPEC-070 PAY-WHK-*: 決済確定はサーバー側イベント(Webhook)を根拠とする。
// 本モックではWebhook受信〜内部反映までの非同期処理を疑似的な待機時間で表現する。
const SIMULATED_LAG_MS = 1600;

function ProcessingContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const outcome = (searchParams.get("outcome") ?? "succeeded") as "succeeded" | "failed";
  const reason = searchParams.get("reason");
  const expireOrder = searchParams.get("expireOrder") === "true";
  const { resolveCheckoutAttempt } = useStore();

  useEffect(() => {
    if (!attemptId) return;
    const timer = setTimeout(() => {
      resolveCheckoutAttempt(orderId, attemptId, outcome, {
        failureReason:
          outcome === "failed" ? (reason ?? "決済処理中にエラーが発生しました（テストシナリオ）") : undefined,
        expireOrder,
      });
      if (outcome === "succeeded" || expireOrder) {
        // SPEC-070 PAY-BRW-*: 成功/失効いずれもBusiness Database上のOrder Stateを唯一の権威として表示する
        router.replace(`/purchase/orders/${orderId}`);
      } else {
        // PAY-FLR-006: 個別card attempt failureは同一Checkout内での再試行を許容する
        router.replace(`/checkout/${orderId}/failed?attemptId=${attemptId}`);
      }
    }, SIMULATED_LAG_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, attemptId, outcome, reason, expireOrder]);

  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
        <div className="size-10 rounded-full border-4 border-muted border-t-primary animate-spin" />
        <div>
          <p className="font-medium">決済結果を確認しています…</p>
          <p className="text-sm text-muted-foreground mt-1">
            決済事業者からの通知（Webhook）を待機しています。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={null}>
      <ProcessingContent />
    </Suspense>
  );
}
