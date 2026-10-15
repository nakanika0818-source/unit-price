import type { ComparisonResult as Result } from "@/lib/compare";
import type { ProductKey } from "@/lib/form";
import type { Unit } from "@/lib/units";

type Props = {
  result: Result;
  names: Record<ProductKey, string>;
  unit: Unit;
};

export const ROUNDING_NOTICE =
  "表示は小数第2位までのため、差が見えない場合があります";

export function ComparisonResult({ result, names, unit }: Props) {
  const per = `1${unit}あたり`;
  const rows: { key: ProductKey; unitPrice: string }[] = [
    { key: "A", unitPrice: result.unitPriceA },
    { key: "B", unitPrice: result.unitPriceB },
  ];

  return (
    <div className="space-y-4">
      <p className="text-lg font-bold">
        {result.cheaper === "same"
          ? "同じ単価です"
          : result.difference === "0"
            ? // 差額が表示上0円になる場合、「0円安い」とは書かない
              `${names[result.cheaper]}の方がわずかに安いです（${per}の差額は0.01円未満）`
            : `${names[result.cheaper]}の方が${per}${result.difference}円安いです`}
      </p>

      <ul className="space-y-2">
        {rows.map(({ key, unitPrice }) => {
          const cheaper = result.cheaper === key;
          return (
            <li
              key={key}
              className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg border px-4 py-3 ${
                cheaper
                  ? "border-2 border-accent-strong bg-accent"
                  : "border-field-border bg-surface"
              }`}
            >
              <span className="min-w-0 break-words font-medium">
                {names[key]}
                {cheaper && (
                  <span className="ml-2 inline-block rounded-full bg-accent-strong px-2 py-0.5 text-xs font-bold text-surface">
                    安い
                  </span>
                )}
              </span>
              <span className="shrink-0">
                {per} <span className="text-xl font-bold">{unitPrice}</span>円
              </span>
            </li>
          );
        })}
      </ul>

      {result.hiddenByRounding && (
        <p className="rounded-lg border border-field-border bg-background px-3 py-2 text-sm">
          ※ {ROUNDING_NOTICE}
        </p>
      )}
    </div>
  );
}
