"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  DEFAULT_END_TIME,
  DEFAULT_MAINTENANCE_MINUTES,
  DEFAULT_PRICE,
  DEFAULT_START_TIME,
  DEFAULT_USAGE_MINUTES,
  dateLabel,
  generateSlotsForDate,
  toDateKey,
  type GenerateSlotsParams,
} from "@/lib/karaoke";
import type { KaraokeSlot } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export default function NewKaraokeSlotsPage() {
  const { generateKaraokeSlots } = useStore();
  const router = useRouter();

  const [date, setDate] = useState(toDateKey(new Date()));
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [usageMinutes, setUsageMinutes] = useState(DEFAULT_USAGE_MINUTES);
  const [maintenanceMinutes, setMaintenanceMinutes] = useState(DEFAULT_MAINTENANCE_MINUTES);
  const [price, setPrice] = useState(DEFAULT_PRICE);
  const [preview, setPreview] = useState<KaraokeSlot[] | null>(null);

  function currentParams(): GenerateSlotsParams {
    return { date, startTime, endTime, usageMinutes, maintenanceMinutes, price };
  }

  function handlePreview(e: FormEvent) {
    e.preventDefault();
    setPreview(generateSlotsForDate(currentParams()));
  }

  function handleConfirm() {
    generateKaraokeSlots(currentParams());
    router.push("/admin/karaoke");
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-semibold">予約枠の一括生成</h1>
      <p className="text-sm text-muted-foreground">
        日付・時間範囲・利用時間・整備時間・価格を指定して、一枠ずつではなく一括で枠を作成します（handoff 16章）。
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">生成条件</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePreview} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">日付</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime">開始</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">終了</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="usageMinutes">利用時間（分）</Label>
                <Input
                  id="usageMinutes"
                  type="number"
                  min={1}
                  value={usageMinutes}
                  onChange={(e) => setUsageMinutes(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceMinutes">整備時間（分）</Label>
                <Input
                  id="maintenanceMinutes"
                  type="number"
                  min={0}
                  value={maintenanceMinutes}
                  onChange={(e) => setMaintenanceMinutes(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">価格（円）</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              プレビュー
            </Button>
          </form>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">生成結果プレビュー（{dateLabel(date)}）</CardTitle>
            <CardDescription>
              {preview.length === 0
                ? "この条件では枠を1つも生成できません（時間範囲を見直してください）。"
                : `${preview.length}枠を作成します。`}
            </CardDescription>
          </CardHeader>
          {preview.length > 0 && (
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                {preview.map((slot) => (
                  <div key={slot.id} className="rounded-md border p-2 text-center">
                    <p>
                      {slot.startTime}〜{slot.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground">{yen.format(slot.price)}</p>
                  </div>
                ))}
              </div>
              <Alert>
                <AlertTitle>この内容で作成しますか？</AlertTitle>
                <AlertDescription>作成後は一覧・編集画面から個別に停止・削除できます。</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={handleConfirm}>
                この内容で作成する
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
