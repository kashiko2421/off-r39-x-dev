"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { dateLabel } from "@/lib/karaoke";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EntitlementStatusBadge } from "@/components/status-badge";

// SPEC-050 PG-MYP-008 Karaoke Reservation List
export default function KaraokeReservationListPage() {
  const { user, hydrated, orders } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/account/login?redirect=/mypage/karaoke");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  const reservations = orders.flatMap((o) =>
    (o.entitlements ?? [])
      .filter((e) => e.kind === "karaoke")
      .map((e) => ({ ...e, orderId: o.id })),
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">カラオケ予約</h1>

      {reservations.length === 0 ? (
        <Alert>
          <AlertTitle>カラオケ予約はありません</AlertTitle>
          <AlertDescription>カラオケ枠を購入すると、ここに表示されます。</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {reservations.map((r) => (
            <Link key={r.code} href={`/mypage/karaoke/${r.code}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.label}</p>
                    {r.karaoke && (
                      <p className="text-xs text-muted-foreground">
                        {dateLabel(r.karaoke.date)} {r.karaoke.startTime}〜{r.karaoke.endTime}
                      </p>
                    )}
                  </div>
                  <EntitlementStatusBadge status={r.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
