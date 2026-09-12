import type { Order } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" });

export function OrderSummary({ order }: { order: Order }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>注文番号</span>
          <span className="font-mono">{order.id}</span>
        </div>
        <Separator />
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{CATEGORY_LABEL[item.category]}</p>
                <p>
                  {item.name} × {item.quantity}
                </p>
              </div>
              <span>{yen.format(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between font-semibold">
          <span>合計（税込）</span>
          <span className="text-lg">{yen.format(order.totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
