"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntitlementStatusBadge } from "@/components/status-badge";

// SPEC-050 PG-MYP-011 Goods Purchase List
export default function GoodsPurchaseListPage() {
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login?redirect=/mypage/goods");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  const items = orders.flatMap((o) =>
    (o.entitlements ?? [])
      .filter((e) => e.kind === "goods")
      .map((e) => ({ ...e, orderId: o.id })),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">グッズ</h1>

      {items.length === 0 ? (
        <Alert>
          <AlertTitle>グッズの購入はありません</AlertTitle>
          <AlertDescription>グッズを購入すると、ここに表示されます。</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.code} href={`/mypage/goods/${item.code}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{item.code}</p>
                  </div>
                  <EntitlementStatusBadge status={item.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
