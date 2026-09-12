"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { findProduct } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle } from "@/components/ui/alert";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

// SPEC-050 PG-GDS-002 Goods Detail / Purchase
export default function GoodsDetailPage() {
  const { goodsId } = useParams<{ goodsId: string }>();
  const router = useRouter();
  const { user, addToCart } = useStore();
  const product = findProduct(goodsId);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product || product.category !== "goods") {
    return (
      <Alert variant="destructive">
        <AlertTitle>商品が見つかりません</AlertTitle>
      </Alert>
    );
  }

  const soldOut = product.stock === 0;
  const maxQuantity = product.stock ?? 99;

  function handlePurchaseStart() {
    if (!user) {
      router.push(`/account/login?redirect=/goods/${goodsId}`);
      return;
    }
    addToCart(product!.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        {soldOut && <Badge variant="destructive">在庫切れ</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardDescription>{product.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-semibold">{yen.format(product.price)}</p>
          <p className="text-xs text-muted-foreground">会場受け渡し商品です（発送は行いません）。</p>
          {product.stock !== null && !soldOut && (
            <p className="text-xs text-muted-foreground">残り{product.stock}点</p>
          )}

          {!soldOut && (
            <div className="flex items-center gap-2">
              <span className="text-sm">数量</span>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <span className="w-6 text-center text-sm">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              >
                +
              </Button>
            </div>
          )}

          {!user && (
            <p className="text-xs text-muted-foreground">購入手続きにはログインが必要です。</p>
          )}

          <Button
            className="w-full"
            disabled={soldOut}
            variant={added ? "secondary" : "default"}
            onClick={handlePurchaseStart}
          >
            {soldOut ? "在庫切れ" : added ? "カートに追加しました" : user ? "カートに追加" : "ログインして購入"}
          </Button>
        </CardContent>
      </Card>

      <Button variant="ghost" nativeButton={false} render={<Link href="/goods">一覧に戻る</Link>} />
    </div>
  );
}
