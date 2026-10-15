import { useId } from "react";
import type { FieldErrors, ProductInput } from "@/lib/form";
import { allowsDecimalQuantity, type Unit } from "@/lib/units";

type Props = {
  label: string;
  unit: Unit;
  value: ProductInput;
  errors: FieldErrors;
  onChange: (field: keyof ProductInput, value: string) => void;
};

const fieldClass =
  "h-11 w-full min-w-0 rounded-lg border bg-surface px-3 focus:border-accent-strong focus:outline-2 focus:outline-accent-strong";

function borderClass(error: string | undefined) {
  return error ? "border-2 border-error" : "border-field-border";
}

export function ProductCard({ label, unit, value, errors, onChange }: Props) {
  const id = useId();
  const decimal = allowsDecimalQuantity(unit);

  const update =
    (field: keyof ProductInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(field, e.target.value);

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
            className={`mt-1 ${fieldClass} border-field-border placeholder:text-muted`}
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
              aria-invalid={errors.price ? true : undefined}
              aria-describedby={describedBy(
                `${id}-price-hint`,
                errors.price && `${id}-price-error`,
              )}
              className={`${fieldClass} ${borderClass(errors.price)} text-right`}
            />
            <span className="w-8 shrink-0">円</span>
          </div>
          <p id={`${id}-price-hint`} className="mt-1 text-xs text-muted">
            カンマなしで入力（例：1200）
          </p>
          <FieldError id={`${id}-price-error`} message={errors.price} />
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
              aria-invalid={errors.quantity ? true : undefined}
              aria-describedby={describedBy(
                `${id}-quantity-hint`,
                errors.quantity && `${id}-quantity-error`,
              )}
              className={`${fieldClass} ${borderClass(errors.quantity)} text-right`}
            />
            <span className="w-8 shrink-0">{unit}</span>
          </div>
          <p id={`${id}-quantity-hint`} className="mt-1 text-xs text-muted">
            {decimal ? "小数第3位まで入力できます" : "整数で入力"}
          </p>
          <FieldError id={`${id}-quantity-error`} message={errors.quantity} />
        </div>
      </div>
    </fieldset>
  );
}

function describedBy(...ids: (string | undefined)[]) {
  return ids.filter(Boolean).join(" ");
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm font-medium text-error">
      ⚠ {message}
    </p>
  );
}
