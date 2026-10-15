"use client";

import { useState } from "react";
import {
  EMPTY_PRODUCT,
  evaluateForm,
  PRODUCT_LABELS,
  type FieldErrors,
  type FormEvaluation,
  type ProductInput,
  type ProductKey,
} from "@/lib/form";
import { DEFAULT_UNIT, type Unit } from "@/lib/units";
import { ComparisonResult } from "./ComparisonResult";
import { ProductCard } from "./ProductCard";
import { UnitSelect } from "./UnitSelect";

type Outcome =
  | { kind: "none" }
  | { kind: "result"; evaluation: Extract<FormEvaluation, { ok: true }>; unit: Unit }
  | { kind: "stale" };

const NO_ERRORS: Record<ProductKey, FieldErrors> = { A: {}, B: {} };
const KEYS: ProductKey[] = ["A", "B"];
const FIELD_LABELS = { price: "価格", quantity: "数量" } as const;

// 入力は React の state だけで持つ（保存・外部送信・ログ出力はしない）
export function UnitPriceComparer() {
  const [unit, setUnit] = useState<Unit>(DEFAULT_UNIT);
  const [inputs, setInputs] = useState<Record<ProductKey, ProductInput>>({
    A: EMPTY_PRODUCT,
    B: EMPTY_PRODUCT,
  });
  const [errors, setErrors] = useState(NO_ERRORS);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "none" });

  // 結果を表示した後に入力や単位が変わったら、古い結果を消して再比較を促す
  const invalidateResult = () => {
    if (outcome.kind === "result") setOutcome({ kind: "stale" });
  };

  const handleUnitChange = (next: Unit) => {
    setUnit(next);
    // 数量の判定は単位で変わるため、数量のエラーは消す
    setErrors((prev) => ({
      A: { ...prev.A, quantity: undefined },
      B: { ...prev.B, quantity: undefined },
    }));
    invalidateResult();
  };

  const handleInputChange =
    (key: ProductKey) => (field: keyof ProductInput, value: string) => {
      setInputs((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
      if (field !== "name") {
        setErrors((prev) => ({
          ...prev,
          [key]: { ...prev[key], [field]: undefined },
        }));
      }
      invalidateResult();
    };

  // 単位・入力・エラー・結果（再比較の案内を含む）をすべて初期状態に戻す
  const handleReset = () => {
    setUnit(DEFAULT_UNIT);
    setInputs({ A: EMPTY_PRODUCT, B: EMPTY_PRODUCT });
    setErrors(NO_ERRORS);
    setOutcome({ kind: "none" });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const evaluation = evaluateForm(unit, inputs);
    if (evaluation.ok) {
      setErrors(NO_ERRORS);
      setOutcome({ kind: "result", evaluation, unit });
    } else {
      setErrors(evaluation.errors);
      setOutcome({ kind: "none" });
    }
  };

  const errorList = KEYS.flatMap((key) =>
    (["price", "quantity"] as const)
      .filter((field) => errors[key][field])
      .map((field) => ({
        key: `${key}-${field}`,
        text: `${PRODUCT_LABELS[key]}の${FIELD_LABELS[field]}：${errors[key][field]}`,
      })),
  );

  return (
    <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-6">
      <UnitSelect value={unit} onChange={handleUnitChange} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {KEYS.map((key) => (
          <ProductCard
            key={key}
            label={PRODUCT_LABELS[key]}
            unit={unit}
            value={inputs[key]}
            errors={errors[key]}
            onChange={handleInputChange(key)}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="h-12 flex-1 rounded-xl bg-accent-strong font-bold text-surface shadow-sm hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        >
          比較する
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="h-12 w-28 shrink-0 rounded-xl border border-field-border bg-surface font-bold shadow-sm hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        >
          リセット
        </button>
      </div>

      <section
        aria-labelledby="result-heading"
        className="rounded-2xl border border-accent bg-surface p-5 shadow-sm"
      >
        <h2 id="result-heading" className="font-bold">
          比較結果
        </h2>
        <div aria-live="polite" className="mt-3">
          {errorList.length > 0 ? (
            <div className="rounded-lg border-2 border-error px-4 py-3 text-error">
              <p className="font-bold">⚠ 入力内容を確認してください</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {errorList.map((item) => (
                  <li key={item.key}>{item.text}</li>
                ))}
              </ul>
            </div>
          ) : outcome.kind === "result" ? (
            <ComparisonResult
              result={outcome.evaluation.result}
              names={outcome.evaluation.names}
              unit={outcome.unit}
            />
          ) : outcome.kind === "stale" ? (
            <p>
              入力が変更されたため、結果を消しました。もう一度「比較する」を押してください。
            </p>
          ) : (
            <p className="text-muted">
              入力して「比較する」を押すと、ここに結果が表示されます。
            </p>
          )}
        </div>
      </section>
    </form>
  );
}
