import { compareProducts, type ComparisonResult } from "./compare";
import type { Unit } from "./units";
import { validatePrice, validateQuantity } from "./validation";

/** 画面の入力値（文字列のまま持つ）。 */
export type ProductInput = {
  name: string;
  price: string;
  quantity: string;
};

export const EMPTY_PRODUCT: ProductInput = { name: "", price: "", quantity: "" };

export type ProductKey = "A" | "B";

export const PRODUCT_LABELS: Record<ProductKey, string> = {
  A: "商品A",
  B: "商品B",
};

export type FieldErrors = { price?: string; quantity?: string };

export type FormEvaluation =
  | {
      ok: true;
      result: ComparisonResult;
      names: Record<ProductKey, string>;
    }
  | { ok: false; errors: Record<ProductKey, FieldErrors> };

/** 商品名が空欄（空白のみを含む）なら「商品A」「商品B」を使う。 */
export function displayName(name: string, key: ProductKey): string {
  return name.trim() || PRODUCT_LABELS[key];
}

/** 2商品の入力をチェックし、すべて正しければ比較結果を返す。 */
export function evaluateForm(
  unit: Unit,
  inputs: Record<ProductKey, ProductInput>,
): FormEvaluation {
  const checked = {
    A: check(inputs.A, unit),
    B: check(inputs.B, unit),
  };
  const { A, B } = checked;

  if (!A.price.ok || !A.quantity.ok || !B.price.ok || !B.quantity.ok) {
    return {
      ok: false,
      errors: { A: errorsOf(A), B: errorsOf(B) },
    };
  }

  return {
    ok: true,
    result: compareProducts(
      { price: A.price.value, quantityScaled: A.quantity.value },
      { price: B.price.value, quantityScaled: B.quantity.value },
    ),
    names: {
      A: displayName(inputs.A.name, "A"),
      B: displayName(inputs.B.name, "B"),
    },
  };
}

function check(input: ProductInput, unit: Unit) {
  return {
    price: validatePrice(input.price),
    quantity: validateQuantity(input.quantity, unit),
  };
}

function errorsOf(c: ReturnType<typeof check>): FieldErrors {
  return {
    ...(c.price.ok ? {} : { price: c.price.message }),
    ...(c.quantity.ok ? {} : { quantity: c.quantity.message }),
  };
}
