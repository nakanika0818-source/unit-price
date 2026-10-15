import { describe, expect, it } from "vitest";
import { compareProducts, formatYen, type ValidProduct } from "./compare";
import type { Unit } from "./units";
import { validatePrice, validateQuantity } from "./validation";

/** 画面と同じく、入力文字列を入力チェックに通してから比較する。 */
function product(price: string, quantity: string, unit: Unit): ValidProduct {
  const p = validatePrice(price);
  const q = validateQuantity(quantity, unit);
  if (!p.ok || !q.ok) throw new Error("テストの入力が不正です");
  return { price: p.value, quantityScaled: q.value };
}

const frac = (num: number, den: number) => ({
  num: BigInt(num),
  den: BigInt(den),
});

describe("compareProducts：完成条件", () => {
  it("1,200円／50個と1,800円／100個 → 24円と18円、Bが6円安い", () => {
    const result = compareProducts(
      product("1200", "50", "個"),
      product("1800", "100", "個"),
    );
    expect(result).toEqual({
      unitPriceA: "24",
      unitPriceB: "18",
      cheaper: "B",
      difference: "6",
      hiddenByRounding: false,
    });
  });

  it("1,000円／50個と2,000円／100個 → 同じ単価", () => {
    const result = compareProducts(
      product("1000", "50", "個"),
      product("2000", "100", "個"),
    );
    expect(result).toEqual({
      unitPriceA: "20",
      unitPriceB: "20",
      cheaper: "same",
      difference: null,
      hiddenByRounding: false,
    });
  });
});

describe("compareProducts：小数の数量", () => {
  it("mL の小数で比較できる（300円/0.5mL=600円、700円/1.25mL=560円）", () => {
    const result = compareProducts(
      product("300", "0.5", "mL"),
      product("700", "1.25", "mL"),
    );
    expect(result).toMatchObject({
      unitPriceA: "600",
      unitPriceB: "560",
      cheaper: "B",
      difference: "40",
    });
  });

  it("g の小数と全角数字で比較できる", () => {
    const result = compareProducts(
      product("９８０", "２５０．５", "g"),
      product("1500", "500", "g"),
    );
    // 980/250.5 = 3.912… 、1500/500 = 3
    expect(result).toMatchObject({
      unitPriceA: "3.91",
      unitPriceB: "3",
      cheaper: "B",
      difference: "0.91",
    });
  });
});

describe("compareProducts：丸める前の値で判定する", () => {
  it("割り算では誤差が出る組み合わせでも同じ単価と判定する", () => {
    // 浮動小数点では 1/0.3 = 3.3333333333333335、7/2.1 = 3.333333333333333 となりずれる
    expect(1 / 0.3).not.toBe(7 / 2.1);
    const result = compareProducts(
      product("1", "0.3", "mL"),
      product("7", "2.1", "mL"),
    );
    expect(result.cheaper).toBe("same");
    expect(result.difference).toBeNull();
  });

  it("表示上は同じ単価でも、丸める前の値で安い方を判定し、案内フラグを立てる", () => {
    // 10,001円/3,000個 = 3.3336…円、10,000円/3,000個 = 3.3333…円 → どちらも「3.33」
    const result = compareProducts(
      product("10001", "3000", "個"),
      product("10000", "3000", "個"),
    );
    expect(result).toEqual({
      unitPriceA: "3.33",
      unitPriceB: "3.33",
      cheaper: "B",
      difference: "0",
      hiddenByRounding: true,
    });
  });

  it("差額だけが0円と表示される場合も案内フラグを立てる", () => {
    // 1,004円/1,000個 = 1.004 → 「1」、1,006円/1,000個 = 1.006 → 「1.01」、差 0.002 → 「0」
    const result = compareProducts(
      product("1004", "1000", "個"),
      product("1006", "1000", "個"),
    );
    expect(result).toMatchObject({
      unitPriceA: "1",
      unitPriceB: "1.01",
      cheaper: "A",
      difference: "0",
      hiddenByRounding: true,
    });
  });

  it("差額は丸めた単価どうしの差ではなく、正確な差を丸める", () => {
    // 1.004 と 1.006 の丸め後は 1 と 1.01（差 0.01）だが、正確な差 0.002 は「0」
    const result = compareProducts(
      product("1004", "1000", "個"),
      product("1006", "1000", "個"),
    );
    expect(result.difference).not.toBe("0.01");
  });
});

describe("formatYen：表示形式", () => {
  it("末尾の0を省く", () => {
    expect(formatYen(frac(24, 1))).toBe("24");
    expect(formatYen(frac(49, 2))).toBe("24.5");
    expect(formatYen(frac(2453, 100))).toBe("24.53");
    expect(formatYen(frac(2450, 100))).toBe("24.5");
  });

  it("小数第2位で四捨五入する（toFixed の誤差が出ない）", () => {
    expect((1.005).toFixed(2)).toBe("1.00");
    expect(formatYen(frac(1005, 1000))).toBe("1.01");
    expect(formatYen(frac(1, 3))).toBe("0.33");
    expect(formatYen(frac(2, 3))).toBe("0.67");
    expect(formatYen(frac(19999, 1000))).toBe("20");
  });

  it("3桁ごとにカンマを付ける", () => {
    // 1,000,000円 / 0.001g = 1,000,000,000円
    const result = compareProducts(
      product("1000000", "0.001", "g"),
      product("1", "1000000", "g"),
    );
    expect(result.unitPriceA).toBe("1,000,000,000");
    expect(result.unitPriceB).toBe("0");
    expect(result.difference).toBe("1,000,000,000");
  });
});
