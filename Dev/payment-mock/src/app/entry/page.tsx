import { PRODUCTS } from "@/lib/mock-data";
import { ProductGrid } from "@/components/product-grid";

export default function EventTicketsPage() {
  const products = PRODUCTS.filter((p) => p.category === "ticket");
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">入場チケット</h1>
        <p className="text-sm text-muted-foreground mt-1">
          off r39&apos;x in 大阪らへん2027 の入場に必要な電子チケットです。
        </p>
      </div>
      <ProductGrid products={products} />
    </div>
  );
}
