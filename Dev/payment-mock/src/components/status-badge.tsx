import { Badge } from "@/components/ui/badge";
import type {
  CheckoutAttemptOutcome,
  EntitlementStatus,
  KaraokeSlotStatus,
  OrderStatus,
  RefundStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// SPEC-070 §6: Order Stateの7状態
const ORDER_LABEL: Record<OrderStatus, string> = {
  prepared: "準備中",
  awaiting_payment: "支払い待ち",
  confirmed: "確定",
  payment_failed: "支払い不成立",
  canceled: "取消",
  expired: "期限切れ",
  review_required: "確認中",
};

const ORDER_COLOR: Record<OrderStatus, string> = {
  prepared: "bg-muted text-muted-foreground",
  awaiting_payment: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  confirmed: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  payment_failed: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  canceled: "bg-muted text-muted-foreground line-through",
  expired: "bg-muted text-muted-foreground",
  review_required: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge className={cn("border-0", ORDER_COLOR[status])}>
      {ORDER_LABEL[status]}
    </Badge>
  );
}

// SPEC-070はPayment単体の状態モデルを持たないため、1回のCheckout Attemptの結果として表示する
const CHECKOUT_ATTEMPT_LABEL: Record<CheckoutAttemptOutcome, string> = {
  processing: "処理中",
  succeeded: "成功",
  failed: "失敗",
};

const CHECKOUT_ATTEMPT_COLOR: Record<CheckoutAttemptOutcome, string> = {
  processing: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  succeeded: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  failed: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function CheckoutAttemptBadge({ outcome }: { outcome: CheckoutAttemptOutcome }) {
  return (
    <Badge className={cn("border-0", CHECKOUT_ATTEMPT_COLOR[outcome])}>
      {CHECKOUT_ATTEMPT_LABEL[outcome]}
    </Badge>
  );
}

// SPEC-080 §6/§7: Entry/Karaoke TicketともにVALID/USED/CANCELED/EXPIREDの4状態
const ENTITLEMENT_LABEL: Record<EntitlementStatus, string> = {
  valid: "未使用",
  used: "使用済み",
  canceled: "取消済み",
  expired: "失効済み",
};

const ENTITLEMENT_COLOR: Record<EntitlementStatus, string> = {
  valid: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  used: "bg-muted text-muted-foreground",
  canceled: "bg-muted text-muted-foreground line-through",
  expired: "bg-muted text-muted-foreground",
};

export function EntitlementStatusBadge({ status }: { status: EntitlementStatus }) {
  return (
    <Badge className={cn("border-0", ENTITLEMENT_COLOR[status])}>
      {ENTITLEMENT_LABEL[status]}
    </Badge>
  );
}

// SPEC-090 §9: Karaoke SlotはAVAILABLE/HELD/SOLD/SALES_STOPPEDの4状態
const SLOT_STATUS_LABEL: Record<KaraokeSlotStatus, string> = {
  available: "販売中",
  held: "確保中",
  sold: "売り切れ",
  sales_stopped: "販売停止",
};

const SLOT_STATUS_COLOR: Record<KaraokeSlotStatus, string> = {
  available: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  held: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  sold: "bg-muted text-muted-foreground",
  sales_stopped: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function KaraokeSlotStatusBadge({ status }: { status: KaraokeSlotStatus }) {
  return (
    <Badge className={cn("border-0", SLOT_STATUS_COLOR[status])}>
      {SLOT_STATUS_LABEL[status]}
    </Badge>
  );
}

// SPEC-070 §37: Refund Recordの独立したfinancial lifecycle
const REFUND_LABEL: Record<RefundStatus, string> = {
  requested: "返金依頼中",
  pending: "返金処理中",
  succeeded: "返金済み",
  failed: "返金失敗",
  review_required: "確認中",
};

const REFUND_COLOR: Record<RefundStatus, string> = {
  requested: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  pending: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  succeeded: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  failed: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  review_required: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200",
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return (
    <Badge className={cn("border-0", REFUND_COLOR[status])}>
      {REFUND_LABEL[status]}
    </Badge>
  );
}
