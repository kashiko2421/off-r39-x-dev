"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntitlementStatusBadge } from "@/components/status-badge";

// SPEC-050 PG-MYP-005 Entry Ticket List
export default function EntryTicketListPage() {
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login?redirect=/mypage/entry-tickets");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  const tickets = orders.flatMap((o) =>
    (o.entitlements ?? [])
      .filter((e) => e.kind === "ticket")
      .map((e) => ({ ...e, orderId: o.id })),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">入場チケット</h1>

      {tickets.length === 0 ? (
        <Alert>
          <AlertTitle>入場チケットはありません</AlertTitle>
          <AlertDescription>入場チケットを購入すると、ここに表示されます。</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <Link key={t.code} href={`/mypage/entry-tickets/${t.code}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.label}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{t.code}</p>
                  </div>
                  <EntitlementStatusBadge status={t.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
