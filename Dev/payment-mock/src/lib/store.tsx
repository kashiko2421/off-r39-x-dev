"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AuthUser,
  CheckoutAttempt,
  CheckoutAttemptOutcome,
  Entitlement,
  KaraokeSlot,
  KaraokeSlotStatus,
  Order,
  OrderItem,
  PaymentMethod,
  RefundRecord,
} from "./types";
import { findProduct } from "./mock-data";
import {
  buildSeedSlots,
  computeHoldExpiresAt,
  computePaymentDeadline,
  dateLabel,
  findKaraokeSlotIn,
  generateSlotsForDate,
  isKaraokeUsagePast,
  type GenerateSlotsParams,
} from "./karaoke";

const STORAGE_KEY = "off-r39x-payment-mock:v4";
const EXPIRATION_CHECK_INTERVAL_MS = 5000;

interface PersistedState {
  user: AuthUser | null;
  cart: OrderItem[];
  orders: Order[];
  karaokeSlots: KaraokeSlot[];
}

interface StoreValue extends PersistedState {
  hydrated: boolean;
  login: (email: string, displayName?: string) => void;
  logout: () => void;
  updateProfile: (displayName: string) => void;
  addToCart: (productId: string, quantity?: number) => void;
  addKaraokeSlotToCart: (slot: KaraokeSlot) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  createOrder: () => { orderId: string } | { error: string };
  getOrder: (orderId: string) => Order | undefined;
  startCheckout: (orderId: string, method: PaymentMethod) => string;
  resolveCheckoutAttempt: (
    orderId: string,
    attemptId: string,
    outcome: "succeeded" | "failed",
    options?: { failureReason?: string; expireOrder?: boolean },
  ) => void;
  forceCancelOrder: (orderId: string) => void;
  requestRefund: (orderId: string, reason: string) => { ok: true } | { ok: false; error: string };
  findEntitlementByCode: (
    code: string,
  ) => { entitlement: Entitlement; order: Order } | undefined;
  markEntitlementUsed: (orderId: string, code: string) => void;
  generateKaraokeSlots: (params: GenerateSlotsParams) => KaraokeSlot[];
  updateKaraokeSlotStatus: (id: string, status: KaraokeSlotStatus) => void;
  updateKaraokeSlotPrice: (id: string, price: number) => void;
  deleteKaraokeSlot: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadInitialState(): PersistedState {
  if (typeof window === "undefined") {
    return { user: null, cart: [], orders: [], karaokeSlots: [] };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { user: null, cart: [], orders: [], karaokeSlots: buildSeedSlots() };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      user: parsed.user ?? null,
      cart: parsed.cart ?? [],
      orders: parsed.orders ?? [],
      karaokeSlots: parsed.karaokeSlots?.length ? parsed.karaokeSlots : buildSeedSlots(),
    };
  } catch {
    return { user: null, cart: [], orders: [], karaokeSlots: buildSeedSlots() };
  }
}

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>({
    user: null,
    cart: [],
    orders: [],
    karaokeSlots: [],
  });
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    // localStorageはクライアントでのみ読めるため、マウント後に読み込んでhydrateする。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadInitialState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // SPEC-090 §11/§23, SPEC-070 §11/§28: Hold(45分)・Payment Deadline(30分, カードのみ)の
  // 期限切れをタブを開いている間、定期的に検出して自動的にexpireへ収束させる。
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setState((s) => {
        let ordersChanged = false;
        const releasedSlotIds = new Set<string>();

        const orders = s.orders.map((o) => {
          if (o.status !== "awaiting_payment" && o.status !== "prepared") return o;
          const deadline = o.checkoutStartedAt ? computePaymentDeadline(new Date(o.checkoutStartedAt)) : null;
          const paymentExpired = deadline !== null && now >= deadline;
          if (!paymentExpired) return o;
          ordersChanged = true;
          const karaokeProductIds = o.items
            .filter((item) => item.category === "karaoke")
            .map((item) => item.productId);
          karaokeProductIds.forEach((id) => releasedSlotIds.add(id));
          return { ...o, status: "expired" as const };
        });

        let karaokeSlots = s.karaokeSlots;
        const heldExpired = s.karaokeSlots.filter(
          (slot) => slot.status === "held" && slot.holdExpiresAt && now >= new Date(slot.holdExpiresAt),
        );
        if (heldExpired.length > 0 || releasedSlotIds.size > 0) {
          karaokeSlots = s.karaokeSlots.map((slot) => {
            const holdTimedOut =
              slot.status === "held" && slot.holdExpiresAt && now >= new Date(slot.holdExpiresAt);
            if (releasedSlotIds.has(slot.id) || holdTimedOut) {
              return {
                ...slot,
                status: "available" as const,
                holdAcquiredAt: undefined,
                holdExpiresAt: undefined,
                holdOrderId: undefined,
              };
            }
            return slot;
          });
        }

        // SPEC-090 §20.2: 未使用Karaoke Ticketはusage_end経過で自動的にexpireへ進める
        const orders2 = orders.map((o) => {
          if (!o.entitlements) return o;
          let changed = false;
          const entitlements = o.entitlements.map((e) => {
            if (e.status !== "valid" || e.kind !== "karaoke" || !e.karaoke) return e;
            if (isKaraokeUsagePast(e.karaoke.date, e.karaoke.endTime, now)) {
              changed = true;
              return { ...e, status: "expired" as const };
            }
            return e;
          });
          if (!changed) return o;
          ordersChanged = true;
          return { ...o, entitlements };
        });

        if (!ordersChanged && karaokeSlots === s.karaokeSlots) return s;
        return { ...s, orders: orders2, karaokeSlots };
      });
    }, EXPIRATION_CHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const login = useCallback((email: string, displayName?: string) => {
    setState((s) => ({
      ...s,
      user: { email, displayName: displayName?.trim() || email.split("@")[0] },
    }));
  }, []);

  const logout = useCallback(() => {
    setState((s) => ({ ...s, user: null }));
  }, []);

  const updateProfile = useCallback((displayName: string) => {
    setState((s) => (s.user ? { ...s, user: { ...s.user, displayName } } : s));
  }, []);

  const addItemToCart = useCallback((item: Omit<OrderItem, "quantity">, quantity = 1) => {
    setState((s) => {
      const existing = s.cart.find((i) => i.productId === item.productId);
      const cart = existing
        ? s.cart.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
          )
        : [...s.cart, { ...item, quantity }];
      return { ...s, cart };
    });
  }, []);

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = findProduct(productId);
      if (!product) return;
      addItemToCart(
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          unitPrice: product.price,
        },
        quantity,
      );
    },
    [addItemToCart],
  );

  // handoff 18章: カラオケ枠は日付+時間で一意な動的商品として扱う(1枠=1件)
  const addKaraokeSlotToCart = useCallback(
    (slot: KaraokeSlot) => {
      addItemToCart(
        {
          productId: slot.id,
          name: `カラオケ枠 ${dateLabel(slot.date)} ${slot.startTime}〜${slot.endTime}`,
          category: "karaoke",
          unitPrice: slot.price,
        },
        1,
      );
    },
    [addItemToCart],
  );

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setState((s) => ({
      ...s,
      cart:
        quantity <= 0
          ? s.cart.filter((i) => i.productId !== productId)
          : s.cart.map((i) =>
              i.productId === productId ? { ...i, quantity } : i,
            ),
    }));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setState((s) => ({
      ...s,
      cart: s.cart.filter((i) => i.productId !== productId),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState((s) => ({ ...s, cart: [] }));
  }, []);

  const cartTotal = useMemo(
    () => state.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [state.cart],
  );

  // SPEC-090 §10.1(KRK-HLD-001): purchase startではOrder PREPAREDの作成と、
  // カート内Karaoke商品のHold取得(AVAILABLE -> HELD)を一つの整合した操作として成立させる。
  // 複数Domain混在Order(DEC-B-04)を維持しつつ、All-or-Nothingでロールバックする。
  const createOrder = useCallback((): { orderId: string } | { error: string } => {
    const s = stateRef.current;
    const now = new Date();
    const karaokeItems = s.cart.filter((i) => i.category === "karaoke");
    for (const item of karaokeItems) {
      const slot = findKaraokeSlotIn(s.karaokeSlots, item.productId);
      if (!slot || slot.status !== "available") {
        return { error: `${item.name} は既に他の方が確保済みのため、購入手続きを開始できません。` };
      }
    }

    const orderId = genId("order");
    const holdAcquiredAt = now.toISOString();
    const holdExpiresAt = computeHoldExpiresAt(now).toISOString();

    setState((prev) => {
      const order: Order = {
        id: orderId,
        status: "prepared",
        items: prev.cart,
        totalAmount: prev.cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
        createdAt: now.toISOString(),
        checkoutAttempts: [],
        purchaserName: prev.user?.displayName,
      };
      const karaokeProductIds = new Set(karaokeItems.map((i) => i.productId));
      const karaokeSlots = prev.karaokeSlots.map((slot) =>
        karaokeProductIds.has(slot.id)
          ? { ...slot, status: "held" as const, holdAcquiredAt, holdExpiresAt, holdOrderId: orderId }
          : slot,
      );
      return { ...prev, cart: [], orders: [order, ...prev.orders], karaokeSlots };
    });
    return { orderId };
  }, []);

  const getOrder = useCallback(
    (orderId: string) => state.orders.find((o) => o.id === orderId),
    [state.orders],
  );

  // SPEC-070 §9: Checkout Session作成成功時点でOrderをAWAITING_PAYMENTへ進める。
  // checkoutStartedAtは初回のみ記録し、以後の再試行(同一Checkout Attempt回復)では上書きしない。
  const startCheckout = useCallback((orderId: string, method: PaymentMethod): string => {
    const attemptId = genId("chk");
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) => {
        if (o.id !== orderId) return o;
        const attempt: CheckoutAttempt = {
          id: attemptId,
          method,
          outcome: "processing",
          createdAt: new Date().toISOString(),
        };
        return {
          ...o,
          status: o.status === "prepared" ? "awaiting_payment" : o.status,
          checkoutStartedAt: o.checkoutStartedAt ?? new Date().toISOString(),
          checkoutAttempts: [...o.checkoutAttempts, attempt],
        };
      }),
    }));
    return attemptId;
  }, []);

  // SPEC-070 §21〜24 / PAY-FLR-006: 個別card attempt failureはOrderをPAYMENT_FAILEDにせず、
  // 同一Checkout内での再試行を許容する(AWAITING_PAYMENT維持)。
  // コンビニ期限切れ等、支払可能性そのものが終了した場合はEXPIREDへ進める(options.expireOrder)。
  const resolveCheckoutAttempt = useCallback(
    (
      orderId: string,
      attemptId: string,
      outcome: "succeeded" | "failed",
      options?: { failureReason?: string; expireOrder?: boolean },
    ) => {
      setState((s) => {
        const targetOrder = s.orders.find((o) => o.id === orderId);
        const karaokeProductIds =
          outcome === "succeeded"
            ? new Set(
                (targetOrder?.items ?? [])
                  .filter((item) => item.category === "karaoke")
                  .map((item) => item.productId),
              )
            : new Set<string>();
        const releaseSlotIds =
          outcome === "failed" && options?.expireOrder
            ? new Set(
                (targetOrder?.items ?? [])
                  .filter((item) => item.category === "karaoke")
                  .map((item) => item.productId),
              )
            : new Set<string>();

        let karaokeSlots = s.karaokeSlots;
        if (karaokeProductIds.size > 0) {
          karaokeSlots = karaokeSlots.map((slot) =>
            karaokeProductIds.has(slot.id)
              ? { ...slot, status: "sold" as const, holdAcquiredAt: undefined, holdExpiresAt: undefined, holdOrderId: undefined }
              : slot,
          );
        }
        if (releaseSlotIds.size > 0) {
          karaokeSlots = karaokeSlots.map((slot) =>
            releaseSlotIds.has(slot.id)
              ? { ...slot, status: "available" as const, holdAcquiredAt: undefined, holdExpiresAt: undefined, holdOrderId: undefined }
              : slot,
          );
        }

        const orders = s.orders.map((o) => {
          if (o.id !== orderId) return o;
          const checkoutAttempts: CheckoutAttempt[] = o.checkoutAttempts.map((a) =>
            a.id === attemptId
              ? { ...a, outcome: outcome as CheckoutAttemptOutcome, failureReason: options?.failureReason }
              : a,
          );
          let status: Order["status"] = o.status;
          if (outcome === "succeeded") {
            status = "confirmed";
          } else if (options?.expireOrder) {
            status = "expired";
          } // それ以外(カード拒否等)はawaiting_paymentを維持

          const entitlements: Entitlement[] | undefined =
            outcome === "succeeded"
              ? o.items.flatMap((item) => {
                  const karaokeSlot =
                    item.category === "karaoke"
                      ? findKaraokeSlotIn(s.karaokeSlots, item.productId)
                      : undefined;
                  return Array.from({ length: item.quantity }, (_, idx) => ({
                    code: `${item.category.toUpperCase()}-${item.productId}-${idx + 1}-${orderId.slice(-6)}`,
                    kind: item.category,
                    label: item.name,
                    status: "valid" as const,
                    karaoke: karaokeSlot
                      ? {
                          date: karaokeSlot.date,
                          startTime: karaokeSlot.startTime,
                          endTime: karaokeSlot.endTime,
                        }
                      : undefined,
                  }));
                })
              : o.entitlements;
          return { ...o, checkoutAttempts, status, entitlements };
        });

        return { ...s, orders, karaokeSlots };
      });
    },
    [],
  );

  // SPEC-070 PAY-ORD-001: Confirmed/PaymentFailed/Canceled/Expiredへの通常遷移のみ許可。
  // Confirmed Orderの取消はRefund経由に限定するため、ここではPREPARED/AWAITING_PAYMENT/
  // REVIEW_REQUIREDのみを対象とする(DEC-B-03: 運営操作のみ。利用者向け取消は提供しない)。
  const forceCancelOrder = useCallback((orderId: string) => {
    setState((s) => {
      const target = s.orders.find((o) => o.id === orderId);
      if (!target) return s;
      if (target.status !== "prepared" && target.status !== "awaiting_payment" && target.status !== "review_required") {
        return s;
      }
      const karaokeProductIds = new Set(
        target.items.filter((i) => i.category === "karaoke").map((i) => i.productId),
      );
      const karaokeSlots =
        karaokeProductIds.size > 0
          ? s.karaokeSlots.map((slot) =>
              karaokeProductIds.has(slot.id) && slot.status === "held"
                ? { ...slot, status: "available" as const, holdAcquiredAt: undefined, holdExpiresAt: undefined, holdOrderId: undefined }
                : slot,
            )
          : s.karaokeSlots;
      return {
        ...s,
        karaokeSlots,
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "canceled" as const } : o)),
      };
    });
  }, []);

  // SPEC-070 §35〜39: CONFIRMED Orderに対するfull refundのみ。使用済みEntitlementを含む場合は不可(PAY-RFD-003)。
  // 成功後、Domain cancellation(Entitlement CANCELED)を実行するが、Karaoke Slotの再販売は行わない(SPEC-090 §16)。
  const requestRefund = useCallback(
    (orderId: string, reason: string): { ok: true } | { ok: false; error: string } => {
      const s = stateRef.current;
      const target = s.orders.find((o) => o.id === orderId);
      if (!target) return { ok: false, error: "注文が見つかりません。" };
      if (target.status !== "confirmed") {
        return { ok: false, error: "確定済み(CONFIRMED)の注文のみ返金できます。" };
      }
      if (target.refund) {
        return { ok: false, error: "この注文は既に返金処理済みです。" };
      }
      if ((target.entitlements ?? []).some((e) => e.status === "used")) {
        return { ok: false, error: "使用済みの権利が含まれるため、通常の返金操作では処理できません。" };
      }

      const now = new Date().toISOString();
      const refund: RefundRecord = {
        id: genId("rfd"),
        status: "succeeded",
        amount: target.totalAmount,
        reason,
        requestedAt: now,
        resolvedAt: now,
      };
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                refund,
                entitlements: o.entitlements?.map((e) => ({ ...e, status: "canceled" as const })),
              }
            : o,
        ),
      }));
      return { ok: true };
    },
    [],
  );

  // handoff 12/19章: スタッフ受付画面でQRコード(=Entitlement.code)からチケット/予約を照会する。
  const findEntitlementByCode = useCallback(
    (code: string) => {
      for (const order of state.orders) {
        const entitlement = order.entitlements?.find((e) => e.code === code);
        if (entitlement) return { entitlement, order };
      }
      return undefined;
    },
    [state.orders],
  );

  // handoff 12/19章: 受付確定で使用済みへ変更する。同一チケットの二重利用防止の基礎データとなる。
  const markEntitlementUsed = useCallback((orderId: string, code: string) => {
    setState((s) => ({
      ...s,
      orders: s.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              entitlements: o.entitlements?.map((e) =>
                e.code === code ? { ...e, status: "used" as const } : e,
              ),
            }
          : o,
      ),
    }));
  }, []);

  // handoff 16章: 管理画面からの一括生成。一枠ずつ手入力せず、日付+時間範囲+利用/整備時間+価格から生成する。
  const generateKaraokeSlots = useCallback((params: GenerateSlotsParams): KaraokeSlot[] => {
    const newSlots = generateSlotsForDate(params);
    setState((s) => ({ ...s, karaokeSlots: [...s.karaokeSlots, ...newSlots] }));
    return newSlots;
  }, []);

  // SPEC-090 §19: HELD/SOLD Slotの通常編集は不可。AVAILABLE/SALES_STOPPEDのみ状態変更を許可する。
  const updateKaraokeSlotStatus = useCallback((id: string, status: KaraokeSlotStatus) => {
    setState((s) => ({
      ...s,
      karaokeSlots: s.karaokeSlots.map((slot) =>
        slot.id === id && (slot.status === "available" || slot.status === "sales_stopped")
          ? { ...slot, status }
          : slot,
      ),
    }));
  }, []);

  const updateKaraokeSlotPrice = useCallback((id: string, price: number) => {
    setState((s) => ({
      ...s,
      karaokeSlots: s.karaokeSlots.map((slot) =>
        slot.id === id && (slot.status === "available" || slot.status === "sales_stopped")
          ? { ...slot, price }
          : slot,
      ),
    }));
  }, []);

  const deleteKaraokeSlot = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      karaokeSlots: s.karaokeSlots.filter(
        (slot) => slot.id !== id || (slot.status !== "available" && slot.status !== "sales_stopped"),
      ),
    }));
  }, []);

  const value: StoreValue = {
    ...state,
    hydrated,
    login,
    logout,
    updateProfile,
    addToCart,
    addKaraokeSlotToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    createOrder,
    getOrder,
    startCheckout,
    resolveCheckoutAttempt,
    forceCancelOrder,
    requestRefund,
    findEntitlementByCode,
    markEntitlementUsed,
    generateKaraokeSlots,
    updateKaraokeSlotStatus,
    updateKaraokeSlotPrice,
    deleteKaraokeSlot,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
