"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { dateLabel, getSlotDates } from "@/lib/karaoke";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KaraokeSlotStatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export default function AdminKaraokePage() {
  const { karaokeSlots } = useStore();
  const dates = useMemo(() => getSlotDates(karaokeSlots), [karaokeSlots]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">カラオケ枠管理</h1>
        <Button nativeButton={false} render={<Link href="/admin/karaoke/new">予約枠を一括生成</Link>} />
      </div>

      <p className="text-sm text-muted-foreground">
        利用時間と整備時間を区別して管理します（SPEC-090）。SOLD(売り切れ)とSALES_STOPPED(運営による販売停止)は別概念として扱います。
      </p>

      {dates.length === 0 ? (
        <Alert>
          <AlertTitle>登録されている予約枠がありません</AlertTitle>
          <AlertDescription>「予約枠を一括生成」から作成してください。</AlertDescription>
        </Alert>
      ) : (
        dates.map((date) => {
          const slots = karaokeSlots
            .filter((s) => s.date === date)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          return (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-base">{dateLabel(date)}</CardTitle>
                <CardDescription>{slots.length}枠</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.map((slot) => (
                  <Link key={slot.id} href={`/admin/karaoke/${slot.id}`}>
                    <div className="rounded-md border p-2 text-sm hover:bg-muted/50 transition-colors">
                      <p className="font-medium">
                        {slot.startTime}〜{slot.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground">{yen.format(slot.price)}</p>
                      <div className="mt-1">
                        <KaraokeSlotStatusBadge status={slot.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
