import { QUANTITY_SCALE } from "./validation";

/** 入力チェック済みの商品。quantityScaled は QUANTITY_SCALE 倍した整数。 */
export type ValidProduct = {
  price: number;
  quantityScaled: number;
};

export type ComparisonResult = {
  /** 単位あたりの価格（円、表示用。末尾の0は省く） */
  unitPriceA: string;
  unitPriceB: string;
  /** 丸める前の値で判定した安い方 */
  cheaper: "A" | "B" | "same";
  /** 単位あたりの差額（円、表示用）。同じ単価なら null */
  difference: string | null;
  /** 単価に差はあるが、小数第2位までの表示では差が見えない */
  hiddenByRounding: boolean;
};

type Fraction = { num: bigint; den: bigint };

/**
 * 2商品の単価を比較する。
 *
 * 判定は割り算をせず「価格A × 数量B」と「価格B × 数量A」の整数で行う
 * （最大 10^6 × 10^9 = 10^15 で、Number で正確に扱える範囲内）。
 * 表示用の単価・差額は BigInt の分数で正確に求め、最後に1回だけ丸める。
 */
export function compareProducts(
  a: ValidProduct,
  b: ValidProduct,
): ComparisonResult {
  const crossA = a.price * b.quantityScaled;
  const crossB = b.price * a.quantityScaled;

  const unitA = unitPrice(a);
  const unitB = unitPrice(b);
  const unitPriceA = formatYen(unitA);
  const unitPriceB = formatYen(unitB);

  if (crossA === crossB) {
    return {
      unitPriceA,
      unitPriceB,
      cheaper: "same",
      difference: null,
      hiddenByRounding: false,
    };
  }

  // 差額 = |価格A×数量B − 価格B×数量A| × SCALE / (数量A × 数量B)
  const scale = BigInt(QUANTITY_SCALE);
  const difference = formatYen({
    num: abs(BigInt(crossA) - BigInt(crossB)) * scale,
    den: BigInt(a.quantityScaled) * BigInt(b.quantityScaled),
  });

  return {
    unitPriceA,
    unitPriceB,
    cheaper: crossA < crossB ? "A" : "B",
    difference,
    hiddenByRounding: unitPriceA === unitPriceB || difference === "0",
  };
}

function unitPrice(p: ValidProduct): Fraction {
  return {
    num: BigInt(p.price) * BigInt(QUANTITY_SCALE),
    den: BigInt(p.quantityScaled),
  };
}

function abs(n: bigint): bigint {
  return n < BigInt(0) ? -n : n;
}

/**
 * 0以上の分数を小数第2位で四捨五入し、末尾の0を省いて3桁区切りにする。
 * 例：24 → "24"、24.5 → "24.5"、24.53 → "24.53"、1.005 → "1.01"
 */
export function formatYen({ num, den }: Fraction): string {
  const hundredths = (num * BigInt(200) + den) / (den * BigInt(2));
  const intPart = (hundredths / BigInt(100)).toString();
  const frac = (hundredths % BigInt(100))
    .toString()
    .padStart(2, "0")
    .replace(/0+$/, "");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac === "" ? grouped : `${grouped}.${frac}`;
}
