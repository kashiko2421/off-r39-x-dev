"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { CATEGORY_LABEL } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, user, createOrder } = useStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function handleCheckout() {
    if (!user) {
      router.push("/account/login?redirect=/cart");
      return;
    }
    const result = createOrder();
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/purchase/orders/${result.orderId}`);
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">カート</h1>
        <Alert>
          <AlertTitle>カートは空です</AlertTitle>
          <AlertDescription>商品一覧から購入したい商品を追加してください。</AlertDescription>
        </Alert>
        <Button nativeButton={false} render={<Link href="/">商品一覧へ</Link>} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">カート</h1>

      <Card>
        <CardContent className="divide-y">
          {cart.map((item) => (
            <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[item.category]}</p>
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-sm text-muted-foreground">{yen.format(item.unitPrice)}</p>
              </div>
              {item.category === "karaoke" ? (
                <span className="text-sm text-muted-foreground px-2">1枠</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    −
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => removeFromCart(item.productId)}
              >
                削除
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">小計（税込）</span>
            <span className="font-semibold text-lg">{yen.format(cartTotal)}</span>
          </div>
          <Separator />
          {!user && (
            <p className="text-xs text-muted-foreground">
              購入手続きにはログインが必要です（PAY-ORD-003）。
            </p>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>購入手続きを開始できません</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" size="lg" onClick={handleCheckout}>
            購入手続きへ進む
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
