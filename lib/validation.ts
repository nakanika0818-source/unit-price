import { allowsDecimalQuantity, type Unit } from "./units";

export const MAX_PRICE = 1_000_000;
export const MAX_QUANTITY = 1_000_000;

/** 数量は1000倍した整数（ミリ単位）で扱い、小数の計算を避ける。 */
export const QUANTITY_SCALE = 1000;
const QUANTITY_DECIMALS = 3;

export type FieldResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

const NUMBER_PATTERN = /^(\d+)(?:\.(\d+))?$/;

/** 全角数字・全角ピリオド・全角マイナスを半角にし、前後の空白を除く。 */
export function normalizeNumberInput(raw: string): string {
  return raw.normalize("NFKC").replace(/−/g, "-").trim();
}

function parseNonNegative(
  text: string,
): { intPart: string; fracPart: string } | null {
  const match = NUMBER_PATTERN.exec(text);
  if (!match) return null;
  return {
    intPart: match[1].replace(/^0+(?=\d)/, ""),
    fracPart: match[2] ?? "",
  };
}

function isNegativeNumber(text: string): boolean {
  return text.startsWith("-") && NUMBER_PATTERN.test(text.slice(1));
}

function isAllZero(digits: string): boolean {
  return /^0*$/.test(digits);
}

/** 価格：1〜1,000,000円の整数。 */
export function validatePrice(raw: string): FieldResult {
  const text = normalizeNumberInput(raw);
  if (text === "") return { ok: false, message: "価格を入力してください。" };
  if (isNegativeNumber(text)) {
    return { ok: false, message: "価格は1円以上で入力してください。" };
  }

  const parsed = parseNonNegative(text);
  if (!parsed) {
    return {
      ok: false,
      message: "価格は数字だけで入力してください（カンマや記号は不要です）。",
    };
  }
  if (parsed.fracPart !== "") {
    return { ok: false, message: "価格は整数で入力してください。" };
  }
  if (isAllZero(parsed.intPart)) {
    return { ok: false, message: "価格は1円以上で入力してください。" };
  }
  // 桁数で先に判定し、巨大な数字列でも数値変換の誤差が出ないようにする
  if (parsed.intPart.length > 7 || Number(parsed.intPart) > MAX_PRICE) {
    return { ok: false, message: "価格は1,000,000円以下で入力してください。" };
  }
  return { ok: true, value: Number(parsed.intPart) };
}

/**
 * 数量：0より大きく1,000,000以下。
 * 成功時の value は QUANTITY_SCALE 倍した整数（例：12.5 → 12500）。
 */
export function validateQuantity(raw: string, unit: Unit): FieldResult {
  const text = normalizeNumberInput(raw);
  if (text === "") return { ok: false, message: "数量を入力してください。" };
  if (isNegativeNumber(text)) {
    return { ok: false, message: "数量は0より大きい数で入力してください。" };
  }

  const parsed = parseNonNegative(text);
  if (!parsed) {
    return {
      ok: false,
      message: "数量は数字だけで入力してください（カンマや記号は不要です）。",
    };
  }
  if (parsed.fracPart !== "" && !allowsDecimalQuantity(unit)) {
    return {
      ok: false,
      message: `単位が「${unit}」のときは、数量を整数で入力してください。`,
    };
  }
  if (parsed.fracPart.length > QUANTITY_DECIMALS) {
    return {
      ok: false,
      message: "数量は小数第3位までで入力してください。",
    };
  }
  if (isAllZero(parsed.intPart) && isAllZero(parsed.fracPart)) {
    return { ok: false, message: "数量は0より大きい数で入力してください。" };
  }

  const tooLong = parsed.intPart.length > 7;
  const scaled = tooLong
    ? Infinity
    : Number(parsed.intPart) * QUANTITY_SCALE +
      Number(parsed.fracPart.padEnd(QUANTITY_DECIMALS, "0"));
  if (scaled > MAX_QUANTITY * QUANTITY_SCALE) {
    return { ok: false, message: "数量は1,000,000以下で入力してください。" };
  }
  return { ok: true, value: scaled };
}
