"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export function ProductGrid({ products }: { products: Product[] }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState<string | null>(null);

  function handleAdd(productId: string) {
    addToCart(productId, 1);
    setAdded(productId);
    setTimeout(() => setAdded((cur) => (cur === productId ? null : cur)), 1200);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {products.map((product) => {
        const soldOut = product.stock === 0;
        return (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{product.name}</CardTitle>
                {soldOut && <Badge variant="destructive">満枠・在庫切れ</Badge>}
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="text-lg font-semibold">{yen.format(product.price)}</p>
              {product.meta && <p className="text-xs text-muted-foreground">{product.meta}</p>}
              {product.stock !== null && !soldOut && (
                <p className="text-xs text-muted-foreground">残り{product.stock}枠</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={soldOut}
                variant={added === product.id ? "secondary" : "default"}
                onClick={() => handleAdd(product.id)}
              >
                {soldOut ? "満枠・在庫切れ" : added === product.id ? "カートに追加しました" : "カートに追加"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
