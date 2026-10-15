export const UNITS = ["個", "枚", "本", "mL", "g"] as const;

export type Unit = (typeof UNITS)[number];

export const DEFAULT_UNIT: Unit = "個";

/** 小数の数量を入力できる単位（小数第3位まで）。それ以外は整数のみ。 */
export function allowsDecimalQuantity(unit: Unit): boolean {
  return unit === "mL" || unit === "g";
}
