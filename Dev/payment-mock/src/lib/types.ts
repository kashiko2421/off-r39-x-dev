// SPEC-070 §6: Order Stateは7状態（PREPARED〜REVIEW_REQUIRED）。Payment単体の状態モデルは持たず、
// 決済試行(Checkout Attempt)ごとの結果として succeeded/failed のみを記録する。
export type OrderStatus =
  | "prepared"
  | "awaiting_payment"
  | "confirmed"
  | "payment_failed"
  | "canceled"
  | "expired"
  | "review_required";

// SPEC-070 §37: Payment単体ではなくRefund Recordが独立したfinancial lifecycleを持つ
export type RefundStatus = "requested" | "pending" | "succeeded" | "failed" | "review_required";

export type PaymentMethod = "card" | "konbini";

// 1件の決済試行(Checkout Attempt)の結果。SPEC-070はPayment単体のCanonical状態を持たないため、
// ここでは「この試行がどうなったか」のみを表す簡易な結果種別として扱う。
export type CheckoutAttemptOutcome = "processing" | "succeeded" | "failed";

export type ProductCategory = "ticket" | "karaoke" | "goods";

// handoff 7章: 入場チケット販売の商品カタログ（静的商品）
export interface Product {
  id: string;
  category: "ticket" | "goods";
  name: string;
  description: string;
  price: number; // 総額(税込) PAY-044
  stock: number | null; // null = 在庫概念なし(入場チケット等)
  meta?: string; // グッズのサイズ等の補足表示
}

// SPEC-090 §9/§18: Karaoke SlotはAVAILABLE/HELD/SOLD/SALES_STOPPEDの4状態。
// SOLDからの再販売(resale)は行わない(§16 Slot resale policy)。
export type KaraokeSlotStatus = "available" | "held" | "sold" | "sales_stopped";

export interface KaraokeSlot {
  id: string;
  date: string; // "2026-09-16"
  startTime: string; // "16:00" (usage_start)
  endTime: string; // "16:15" (usage_end)
  cycleEndTime: string; // 整備時間を含む占有終了時刻 (cycle_end)
  price: number;
  status: KaraokeSlotStatus;
  usageMinutes: number;
  maintenanceMinutes: number;
  // SPEC-090 §10: Hold取得時刻・期限。Hold ACTIVE中のみ値を持つ。
  holdAcquiredAt?: string;
  holdExpiresAt?: string; // holdAcquiredAt + 45分
  holdOrderId?: string; // どのOrderのHoldか
}

export interface OrderItem {
  productId: string;
  name: string;
  category: ProductCategory;
  unitPrice: number;
  quantity: number;
}

export interface CheckoutAttempt {
  id: string;
  method: PaymentMethod;
  outcome: CheckoutAttemptOutcome;
  createdAt: string;
  failureReason?: string;
}

// SPEC-080 §6/§7: Entry Ticket / Karaoke TicketはともにVALID/USED/CANCELED/EXPIREDの4状態
export type EntitlementStatus = "valid" | "used" | "canceled" | "expired";

export type EntitlementKind = "ticket" | "karaoke" | "goods";

export interface Entitlement {
  code: string;
  kind: EntitlementKind;
  label: string;
  status: EntitlementStatus;
  // handoff 19章 / SPEC-090: カラオケ受付画面での予約日時表示・失効判定に使う
  karaoke?: {
    date: string;
    startTime: string;
    endTime: string;
  };
}

// SPEC-070 §37: Full RefundのみをCanonicalとする(部分返金は対象外)
export interface RefundRecord {
  id: string;
  status: RefundStatus;
  amount: number;
  reason?: string;
  requestedAt: string;
  resolvedAt?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  checkoutAttempts: CheckoutAttempt[]; // SPEC-070 §30: (Order, Checkout Attempt)単位のBusiness Cause
  entitlements?: Entitlement[]; // 確定後に発行される権利
  purchaserName?: string; // handoff 19章: スタッフ受付画面での予約者表示に使う
  // SPEC-090 §12 / SPEC-070 §11: Hold Safety BufferとPayment Deadlineの模擬に使う時刻
  checkoutStartedAt?: string; // Checkout Session作成成功時点 = Payment Deadline算出の起点(カードのみ30分)
  refund?: RefundRecord; // SPEC-070 §35: CONFIRMED Orderに対するfull refundのみ
}

export interface AuthUser {
  email: string;
  displayName: string;
}
