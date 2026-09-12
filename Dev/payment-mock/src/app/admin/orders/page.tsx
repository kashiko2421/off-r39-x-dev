"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { OrderStatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export default function AdminOrdersPage() {
  const { orders } = useStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.trim().toLowerCase();
    return orders.filter((o) => o.id.toLowerCase().includes(q));
  }, [orders, query]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">注文管理</h1>

      <Alert>
        <AlertDescription>
          本モックは端末のブラウザ内データのみを扱うため、この一覧には今この端末で作成した注文のみが表示されます（実運用では全利用者の注文を横断参照できます）。
        </AlertDescription>
      </Alert>

      <Input
        placeholder="注文番号で検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">該当する注文がありません。</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground truncate">{order.id}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm mt-1">
                      {order.items.length}点 ・ {yen.format(order.totalAmount)} ・ 決済試行{order.checkoutAttempts.length}件
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">詳細 ›</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
