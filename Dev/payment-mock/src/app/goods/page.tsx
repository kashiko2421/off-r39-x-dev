import Link from "next/link";
import { PRODUCTS } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

// SPEC-050 PG-GDS-001 Goods List: 一覧では詳細への導線のみを提供し、
// 数量選択・購入開始はPG-GDS-002 Detailへ委譲する。
export default function GoodsListPage() {
  const products = PRODUCTS.filter((p) => p.category === "goods");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">グッズ</h1>
        <p className="text-sm text-muted-foreground mt-1">
          会場受け渡しのオリジナルグッズです（発送は行いません）。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((product) => {
          const soldOut = product.stock === 0;
          return (
            <Link key={product.id} href={`/goods/${product.id}`}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                    {soldOut && <Badge variant="destructive">在庫切れ</Badge>}
                  </div>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  <p className="text-lg font-semibold">{yen.format(product.price)}</p>
                  {product.stock !== null && !soldOut && (
                    <p className="text-xs text-muted-foreground">残り{product.stock}点</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
