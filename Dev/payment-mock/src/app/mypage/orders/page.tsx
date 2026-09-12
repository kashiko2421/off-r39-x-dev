"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { OrderStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export default function OrderHistoryPage() {
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login?redirect=/mypage/orders");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">購入履歴</h1>

      {orders.length === 0 ? (
        <Alert>
          <AlertTitle>注文はまだありません</AlertTitle>
          <AlertDescription>チケット一覧からお買い物を始めましょう。</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm mt-1">
                    {order.items.length}点 ・ {yen.format(order.totalAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {(order.status === "prepared" || order.status === "awaiting_payment") && (
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/purchase/orders/${order.id}`}>支払いへ進む</Link>}
                    />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link href={`/mypage/orders/${order.id}`}>詳細</Link>}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
