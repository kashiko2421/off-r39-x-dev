import type { KaraokeSlot } from "./types";

// handoff 16章: 一括生成の標準設定（利用時間・整備時間は管理画面から変更可能な構造にする）
export const DEFAULT_USAGE_MINUTES = 15;
export const DEFAULT_MAINTENANCE_MINUTES = 5;
export const DEFAULT_START_TIME = "16:00";
export const DEFAULT_END_TIME = "21:00";
export const DEFAULT_PRICE = 500;

// SPEC-090 §10.3 / §12.1: Hold通常有効時間45分、Stripe Payment Deadline30分、
// Hold Safety Buffer5分（Payment DeadlineがHold失効の5分以上前に収まっていることを要求する）
export const HOLD_DURATION_MINUTES = 45;
export const PAYMENT_DEADLINE_MINUTES = 30;
export const HOLD_SAFETY_BUFFER_MINUTES = 5;
// SPEC-080 §33 / SPEC-090 §20.1: Karaoke Check-in windowはusage_startの10分前から開く
export const CHECKIN_OPENS_BEFORE_MINUTES = 10;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function timeLabel(hour: number, minute: number): string {
  return `${pad(hour)}:${pad(minute)}`;
}

function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// DATE_LABELの固定テーブルではなく関数にすることで、管理画面から追加した任意の日付にも対応する
export function dateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}/${d}(${WEEKDAY[date.getDay()]})`;
}

export function toInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export interface GenerateSlotsParams {
  date: string; // "2026-09-16"
  startTime: string; // "16:00"
  endTime: string; // "21:00"
  usageMinutes: number;
  maintenanceMinutes: number;
  price: number;
}

// handoff 16章 / SPEC-090 §8.2: 管理画面から日付・開始/終了・利用時間・整備時間・価格を入力し、一括生成する
// window_endを超える不完全な最終cycleは生成しない(KRK-GEN-002)
export function generateSlotsForDate(params: GenerateSlotsParams): KaraokeSlot[] {
  const { date, startTime, endTime, usageMinutes, maintenanceMinutes, price } = params;
  const cycle = usageMinutes + maintenanceMinutes;
  const startTotal = parseTime(startTime);
  const endTotal = parseTime(endTime);
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const slots: KaraokeSlot[] = [];
  let idx = 0;
  for (let t = startTotal; t + cycle <= endTotal; t += cycle) {
    const sH = Math.floor(t / 60);
    const sM = t % 60;
    const usageEndT = t + usageMinutes;
    const ueH = Math.floor(usageEndT / 60);
    const ueM = usageEndT % 60;
    const cycleEndT = t + cycle;
    const ceH = Math.floor(cycleEndT / 60);
    const ceM = cycleEndT % 60;
    slots.push({
      id: `kar-${date}-${pad(sH)}${pad(sM)}-${seed}-${idx}`,
      date,
      startTime: timeLabel(sH, sM),
      endTime: timeLabel(ueH, ueM),
      cycleEndTime: timeLabel(ceH, ceM),
      price,
      status: "available",
      usageMinutes,
      maintenanceMinutes,
    });
    idx++;
  }
  return slots;
}

// アプリ初回起動時のシードデータ（今日・明日の2日分、◎○△×の全パターンを確認できるよう一部を意図的に売り切れにする）
export function buildSeedSlots(): KaraokeSlot[] {
  const today = new Date();
  const dates = [0, 1].map((offset) => toDateKey(addDays(today, offset)));
  const slots = dates.flatMap((date) =>
    generateSlotsForDate({
      date,
      startTime: DEFAULT_START_TIME,
      endTime: DEFAULT_END_TIME,
      usageMinutes: DEFAULT_USAGE_MINUTES,
      maintenanceMinutes: DEFAULT_MAINTENANCE_MINUTES,
      price: DEFAULT_PRICE,
    }),
  );

  const day0 = dates[0];
  const forceSold = (hour: number, count: number) => {
    slots
      .filter((s) => s.date === day0 && s.startTime.startsWith(pad(hour)))
      .slice(0, count)
      .forEach((s) => {
        s.status = "sold";
      });
  };
  forceSold(17, 1); // 17:00台: 1枠売り切れ → ○
  forceSold(18, 2); // 18:00台: 2枠売り切れ → △
  forceSold(19, 3); // 19:00台: 3枠すべて売り切れ → ×

  return slots;
}

export function findKaraokeSlotIn(slots: KaraokeSlot[], id: string): KaraokeSlot | undefined {
  return slots.find((s) => s.id === id);
}

// 販売対象の日付一覧を、実際に登録されている枠から動的に算出する
export function getSlotDates(slots: KaraokeSlot[]): string[] {
  return Array.from(new Set(slots.map((s) => s.date))).sort();
}

export interface HourlyAvailability {
  hour: number;
  hourLabel: string;
  slots: KaraokeSlot[];
  availableCount: number;
  mark: "◎" | "○" | "△" | "×";
}

function markFor(availableCount: number): HourlyAvailability["mark"] {
  if (availableCount >= 3) return "◎";
  if (availableCount === 2) return "○";
  if (availableCount === 1) return "△";
  return "×";
}

// handoff 14章: 日付 → 1時間単位の空き状況 → 具体的な予約枠、の3段階選択
// held/sold/sales_stoppedはavailableではないため空き枠には数えない(SPEC-090 KRK-AVL-001)
export function getHourlyAvailability(date: string, allSlots: KaraokeSlot[]): HourlyAvailability[] {
  const dateSlots = allSlots
    .filter((s) => s.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const hours = Array.from(new Set(dateSlots.map((s) => Number(s.startTime.split(":")[0])))).sort(
    (a, b) => a - b,
  );
  return hours.map((hour) => {
    const slots = dateSlots.filter((s) => Number(s.startTime.split(":")[0]) === hour);
    const availableCount = slots.filter((s) => s.status === "available").length;
    return {
      hour,
      hourLabel: `${pad(hour)}:00〜`,
      slots,
      availableCount,
      mark: markFor(availableCount),
    };
  });
}

// SPEC-090 §20: 通常Karaoke Check-in windowは [usage_start - 10分, usage_end) の半開区間。
// 区間外は通常Staff Capabilityでは受付をブロックする(KRK-CHK-003/004)。
export function isWithinKaraokeCheckinWindow(
  date: string,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
): boolean {
  const opensAt = new Date(toInstant(date, startTime).getTime() - CHECKIN_OPENS_BEFORE_MINUTES * 60_000);
  const closesAt = toInstant(date, endTime);
  return now >= opensAt && now < closesAt;
}

// SPEC-090 §20.2: Karaoke TicketのauthoritativeなexpirationはcheckinClosesAt(=usage_end)
export function isKaraokeUsagePast(date: string, endTime: string, now: Date = new Date()): boolean {
  return now >= toInstant(date, endTime);
}

// SPEC-090 §10.3: Hold取得時刻から45分後がHold失効時刻
export function computeHoldExpiresAt(acquiredAt: Date): Date {
  return new Date(acquiredAt.getTime() + HOLD_DURATION_MINUTES * 60_000);
}

// SPEC-070 §11 / SPEC-090 §12.1: Checkout Session作成成功時点から30分がPayment Deadline(カードのみ)
export function computePaymentDeadline(checkoutStartedAt: Date): Date {
  return new Date(checkoutStartedAt.getTime() + PAYMENT_DEADLINE_MINUTES * 60_000);
}
