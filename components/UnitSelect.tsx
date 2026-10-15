import { UNITS, type Unit } from "@/lib/units";

type Props = {
  value: Unit;
  onChange: (unit: Unit) => void;
};

export function UnitSelect({ value, onChange }: Props) {
  return (
    <fieldset className="rounded-2xl border border-accent bg-surface p-5 shadow-sm">
      <legend className="sr-only">共通単位</legend>
      <p aria-hidden="true" className="font-bold">
        共通単位
      </p>
      <p className="mt-1 text-sm text-muted">
        2つの商品とも、この単位で数量を入力します。
      </p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {UNITS.map((unit) => (
          <label key={unit} className="relative">
            <input
              type="radio"
              name="unit"
              value={unit}
              checked={value === unit}
              onChange={() => onChange(unit)}
              className="peer sr-only"
            />
            <span className="flex h-11 cursor-pointer items-center justify-center rounded-lg border border-accent bg-background font-medium peer-checked:border-accent-strong peer-checked:bg-accent peer-checked:text-accent-strong peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-strong">
              {unit}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
