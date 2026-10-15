"use client";

import { useState } from "react";
import { DEFAULT_UNIT, type Unit } from "@/lib/units";
import { EMPTY_PRODUCT, ProductCard, type ProductInput } from "./ProductCard";
import { UnitSelect } from "./UnitSelect";

// 入力は React の state だけで持つ（保存・外部送信・ログ出力はしない）
export function UnitPriceComparer() {
  const [unit, setUnit] = useState<Unit>(DEFAULT_UNIT);
  const [productA, setProductA] = useState<ProductInput>(EMPTY_PRODUCT);
  const [productB, setProductB] = useState<ProductInput>(EMPTY_PRODUCT);

  return (
    <div className="mt-6 space-y-6">
      <UnitSelect value={unit} onChange={setUnit} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ProductCard
          label="商品A"
          unit={unit}
          value={productA}
          onChange={setProductA}
        />
        <ProductCard
          label="商品B"
          unit={unit}
          value={productB}
          onChange={setProductB}
        />
      </div>
    </div>
  );
}
