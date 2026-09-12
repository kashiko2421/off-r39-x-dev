"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { dateLabel, getHourlyAvailability, getSlotDates, type HourlyAvailability } from "@/lib/karaoke";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MARK_STYLE: Record<HourlyAvailability["mark"], string> = {
  "◎": "text-emerald-600 dark:text-emerald-400",
  "○": "text-emerald-600 dark:text-emerald-400",
  "△": "text-amber-600 dark:text-amber-400",
  "×": "text-muted-foreground",
};

// SPEC-050 PG-KRK-002 Karaoke Day Schedule: 選択日の1時間単位空き状況を表示する
export default function KaraokeDaySchedulePage() {
  const { date } = useParams<{ date: string }>();
  const { karaokeSlots } = useStore();
  const dates = useMemo(() => getSlotDates(karaokeSlots), [karaokeSlots]);
  const hourly = useMemo(() => getHourlyAvailability(date, karaokeSlots), [date, karaokeSlots]);
  const currentIndex = dates.indexOf(date);
  const prevDate = currentIndex > 0 ? dates[currentIndex - 1] : null;
  const nextDate = currentIndex >= 0 && currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{dateLabel(date)} の空き状況</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevDate}
            nativeButton={false}
            render={prevDate ? <Link href={`/karaoke/schedule/${prevDate}`}>前日</Link> : <span>前日</span>}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!nextDate}
            nativeButton={false}
            render={nextDate ? <Link href={`/karaoke/schedule/${nextDate}`}>翌日</Link> : <span>翌日</span>}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1時間単位の空き状況</CardTitle>
          <CardDescription>◎ 空きあり ／ ○ △ 残りわずか ／ × 満枠</CardDescription>
        </CardHeader>
        <CardContent>
          {hourly.length === 0 ? (
            <p className="text-sm text-muted-foreground">この日に販売対象の枠はありません。</p>
          ) : (
            <div className="space-y-3">
              {hourly.map((h) => (
                <div key={h.hour} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{h.hourLabel}</span>
                    <span className={cn("text-xl font-semibold", MARK_STYLE[h.mark])}>{h.mark}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {h.slots.map((slot) => (
                      <Link key={slot.id} href={`/karaoke/slots/${slot.id}`}>
                        <div
                          className={cn(
                            "rounded-md border p-2 text-center text-xs",
                            slot.status === "available" ? "hover:bg-muted/50" : "text-muted-foreground",
                          )}
                        >
                          <p>
                            {slot.startTime}〜{slot.endTime}
                          </p>
                          <p className="mt-1">
                            {slot.status === "available" && "選択可能"}
                            {slot.status === "held" && "確保中"}
                            {slot.status === "sold" && "販売済み"}
                            {slot.status === "sales_stopped" && "販売停止"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
