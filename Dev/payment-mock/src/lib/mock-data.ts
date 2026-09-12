import type { Product } from "./types";

// handoff 7章/24章: Step1スコープは入場チケット・カラオケ・グッズ（グッズはDEC-B-04に合わせ継続提供）
export const PRODUCTS: Product[] = [
  {
    id: "tkt-general",
    category: "ticket",
    name: "一般入場チケット",
    description: "off r39'x in 大阪らへん2027 の一般入場チケットです。",
    price: 4500,
    stock: null,
  },
  {
    id: "tkt-vip",
    category: "ticket",
    name: "VIP入場チケット",
    description: "優先入場・特典付きのVIPチケットです。",
    price: 9800,
    stock: null,
  },
  {
    id: "gds-tshirt",
    category: "goods",
    name: "記念Tシャツ",
    description: "イベント限定デザインのTシャツです。会場受け渡し。",
    price: 3200,
    stock: 12,
    meta: "サイズ: フリー",
  },
  {
    id: "gds-towel",
    category: "goods",
    name: "マフラータオル",
    description: "イベントロゴ入りマフラータオルです。会場受け渡し。",
    price: 2000,
    stock: 25,
  },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export const CATEGORY_LABEL: Record<Product["category"] | "karaoke", string> = {
  ticket: "入場チケット",
  karaoke: "カラオケ",
  goods: "グッズ",
};
