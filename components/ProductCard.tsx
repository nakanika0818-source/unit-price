import { useId } from "react";
import { allowsDecimalQuantity, type Unit } from "@/lib/units";

export type ProductInput = {
  name: string;
  price: string;
  quantity: string;
};

export const EMPTY_PRODUCT: ProductInput = { name: "", price: "", quantity: "" };

type Props = {
  label: string;
  unit: Unit;
  value: ProductInput;
  onChange: (value: ProductInput) => void;
};

export function ProductCard({ label, unit, value, onChange }: Props) {
  const id = useId();
  const decimal = allowsDecimalQuantity(unit);

  const update = (field: keyof ProductInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [field]: e.target.value });

  return (
    <fieldset className="min-w-0 rounded-2xl border border-accent bg-surface p-5 shadow-sm">
      <legend className="sr-only">{label}</legend>
      <h2 aria-hidden="true" className="text-lg font-bold">
        {label}
      </h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm font-medium">
            商品名<span className="text-muted">（任意）</span>
          </label>
          <input
            id={`${id}-name`}
            type="text"
            autoComplete="off"
            value={value.name}
            onChange={update("name")}
            placeholder={`未入力なら「${label}」`}
            className="mt-1 h-11 w-full rounded-lg border border-field-border bg-surface px-3 placeholder:text-muted focus:border-accent-strong focus:outline-2 focus:outline-accent-strong"
          />
        </div>

        <div>
          <label htmlFor={`${id}-price`} className="block text-sm font-medium">
            価格（税込）
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id={`${id}-price`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={value.price}
              onChange={update("price")}
              aria-describedby={`${id}-price-hint`}
              className="h-11 w-full min-w-0 rounded-lg border border-field-border bg-surface px-3 text-right focus:border-accent-strong focus:outline-2 focus:outline-accent-strong"
            />
            <span className="w-8 shrink-0">円</span>
          </div>
          <p id={`${id}-price-hint`} className="mt-1 text-xs text-muted">
            カンマなしで入力（例：1200）
          </p>
        </div>

        <div>
          <label htmlFor={`${id}-quantity`} className="block text-sm font-medium">
            数量
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              id={`${id}-quantity`}
              type="text"
              inputMode={decimal ? "decimal" : "numeric"}
              autoComplete="off"
              value={value.quantity}
              onChange={update("quantity")}
              aria-describedby={`${id}-quantity-hint`}
              className="h-11 w-full min-w-0 rounded-lg border border-field-border bg-surface px-3 text-right focus:border-accent-strong focus:outline-2 focus:outline-accent-strong"
            />
            <span className="w-8 shrink-0">{unit}</span>
          </div>
          <p id={`${id}-quantity-hint`} className="mt-1 text-xs text-muted">
            {decimal ? "小数第3位まで入力できます" : "整数で入力"}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
