import { describe, expect, it } from "vitest";
import { displayName, evaluateForm } from "./form";

const input = (price: string, quantity: string, name = "") => ({
  name,
  price,
  quantity,
});

describe("displayName", () => {
  it("空欄・空白のみなら「商品A」「商品B」", () => {
    expect(displayName("", "A")).toBe("商品A");
    expect(displayName(" 　", "B")).toBe("商品B");
  });

  it("入力があれば前後の空白を除いて使う", () => {
    expect(displayName(" 化粧水 ", "A")).toBe("化粧水");
  });
});

describe("evaluateForm", () => {
  it("すべて正しければ比較結果と表示名を返す", () => {
    const evaluation = evaluateForm("個", {
      A: input("1200", "50"),
      B: input("1800", "100", "大容量"),
    });
    expect(evaluation).toEqual({
      ok: true,
      result: {
        unitPriceA: "24",
        unitPriceB: "18",
        cheaper: "B",
        difference: "6",
        hiddenByRounding: false,
      },
      names: { A: "商品A", B: "大容量" },
    });
  });

  it("エラーがあれば計算せず、商品・欄ごとの理由を返す", () => {
    const evaluation = evaluateForm("個", {
      A: input("", "0"),
      B: input("1800", "1.5"),
    });
    expect(evaluation).toEqual({
      ok: false,
      errors: {
        A: {
          price: "価格を入力してください。",
          quantity: "数量は0より大きい数で入力してください。",
        },
        B: {
          quantity: "単位が「個」のときは、数量を整数で入力してください。",
        },
      },
    });
  });

  it("単位によって数量の判定が変わる", () => {
    const inputs = { A: input("300", "0.5"), B: input("700", "1.25") };
    expect(evaluateForm("個", inputs).ok).toBe(false);
    expect(evaluateForm("mL", inputs).ok).toBe(true);
  });
});
