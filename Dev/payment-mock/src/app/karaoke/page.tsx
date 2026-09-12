"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { dateLabel, getSlotDates } from "@/lib/karaoke";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// SPEC-050 PG-KRK-001 Karaoke Sales Guide: 販売条件を説明し、対象日選択へ進める
export default function KaraokeSalesGuidePage() {
  const { karaokeSlots } = useStore();
  const dates = useMemo(() => getSlotDates(karaokeSlots), [karaokeSlots]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">カラオケ予約</h1>
        <p className="text-sm text-muted-foreground mt-1">
          利用時間＋整備時間を1サイクルとして運営します（枠設定は運営が管理します）。予約は1名につき1枠です。
        </p>
      </div>

      {dates.length === 0 ? (
        <Alert>
          <AlertTitle>現在受付可能な枠がありません</AlertTitle>
          <AlertDescription>管理画面から予約枠を生成してください。</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">対象日を選んでください</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {dates.map((d) => (
              <Button key={d} variant="outline" nativeButton={false} render={<Link href={`/karaoke/schedule/${d}`}>{dateLabel(d)}</Link>} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
