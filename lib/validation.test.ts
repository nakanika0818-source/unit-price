import { describe, expect, it } from "vitest";
import {
  normalizeNumberInput,
  validatePrice,
  validateQuantity,
} from "./validation";

function errorOf(result: ReturnType<typeof validatePrice>): string {
  if (result.ok) throw new Error(`エラーになるはずが成功した: ${result.value}`);
  return result.message;
}

describe("normalizeNumberInput", () => {
  it("全角数字・全角ピリオド・全角マイナスを半角にする", () => {
    expect(normalizeNumberInput("１２３．４５")).toBe("123.45");
    expect(normalizeNumberInput("－５")).toBe("-5");
    expect(normalizeNumberInput("−５")).toBe("-5");
  });

  it("前後の空白（全角を含む）を除く", () => {
    expect(normalizeNumberInput(" 1200　")).toBe("1200");
  });
});

describe("validatePrice", () => {
  it("1〜1,000,000の整数を受け付ける", () => {
    expect(validatePrice("1")).toEqual({ ok: true, value: 1 });
    expect(validatePrice("1200")).toEqual({ ok: true, value: 1200 });
    expect(validatePrice("1000000")).toEqual({ ok: true, value: 1_000_000 });
  });

  it("全角数字を半角に変換して受け付ける", () => {
    expect(validatePrice("１２００")).toEqual({ ok: true, value: 1200 });
  });

  it("先頭の0は無視する", () => {
    expect(validatePrice("0050")).toEqual({ ok: true, value: 50 });
  });

  it("空欄を拒否する", () => {
    expect(errorOf(validatePrice(""))).toBe("価格を入力してください。");
    expect(errorOf(validatePrice("   "))).toBe("価格を入力してください。");
  });

  it("0と負数を拒否する", () => {
    expect(errorOf(validatePrice("0"))).toBe("価格は1円以上で入力してください。");
    expect(errorOf(validatePrice("-100"))).toBe(
      "価格は1円以上で入力してください。",
    );
    expect(errorOf(validatePrice("－１００"))).toBe(
      "価格は1円以上で入力してください。",
    );
  });

  it("上限を超える値を拒否する", () => {
    const message = "価格は1,000,000円以下で入力してください。";
    expect(errorOf(validatePrice("1000001"))).toBe(message);
    expect(errorOf(validatePrice("99999999999999999999999"))).toBe(message);
  });

  it("小数を拒否する", () => {
    expect(errorOf(validatePrice("100.5"))).toBe(
      "価格は整数で入力してください。",
    );
  });

  it("数字以外・カンマ・指数表記を拒否する", () => {
    const message =
      "価格は数字だけで入力してください（カンマや記号は不要です）。";
    for (const input of ["abc", "1,200", "1e3", "+100", ".5", "5.", "¥100"]) {
      expect(errorOf(validatePrice(input))).toBe(message);
    }
  });
});

describe("validateQuantity", () => {
  it("整数の単位で整数を受け付け、1000倍した値を返す", () => {
    expect(validateQuantity("50", "個")).toEqual({ ok: true, value: 50_000 });
    expect(validateQuantity("1000000", "枚")).toEqual({
      ok: true,
      value: 1_000_000_000,
    });
  });

  it("mL・g で小数第3位までの小数を受け付ける", () => {
    expect(validateQuantity("12.5", "mL")).toEqual({ ok: true, value: 12_500 });
    expect(validateQuantity("0.001", "g")).toEqual({ ok: true, value: 1 });
    expect(validateQuantity("2.125", "g")).toEqual({ ok: true, value: 2_125 });
  });

  it("全角の数字・小数点を受け付ける", () => {
    expect(validateQuantity("１２．５", "mL")).toEqual({
      ok: true,
      value: 12_500,
    });
    expect(validateQuantity("５０", "本")).toEqual({ ok: true, value: 50_000 });
  });

  it("空欄を拒否する", () => {
    expect(errorOf(validateQuantity("", "個"))).toBe(
      "数量を入力してください。",
    );
  });

  it("0と負数を拒否する", () => {
    const message = "数量は0より大きい数で入力してください。";
    expect(errorOf(validateQuantity("0", "個"))).toBe(message);
    expect(errorOf(validateQuantity("0.000", "mL"))).toBe(message);
    expect(errorOf(validateQuantity("-1", "個"))).toBe(message);
    expect(errorOf(validateQuantity("-0.5", "g"))).toBe(message);
  });

  it("上限を超える値を拒否する", () => {
    const message = "数量は1,000,000以下で入力してください。";
    expect(errorOf(validateQuantity("1000001", "個"))).toBe(message);
    expect(errorOf(validateQuantity("1000000.001", "mL"))).toBe(message);
    expect(errorOf(validateQuantity("123456789012345678901", "g"))).toBe(
      message,
    );
  });

  it("個・枚・本では小数を拒否する", () => {
    for (const unit of ["個", "枚", "本"] as const) {
      expect(errorOf(validateQuantity("1.5", unit))).toBe(
        `単位が「${unit}」のときは、数量を整数で入力してください。`,
      );
    }
  });

  it("mL・g で小数第4位以降を拒否する", () => {
    expect(errorOf(validateQuantity("1.2345", "mL"))).toBe(
      "数量は小数第3位までで入力してください。",
    );
  });

  it("数字以外を拒否する", () => {
    expect(errorOf(validateQuantity("1,000", "個"))).toBe(
      "数量は数字だけで入力してください（カンマや記号は不要です）。",
    );
  });
});
