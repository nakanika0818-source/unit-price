import { UnitPriceComparer } from "@/components/UnitPriceComparer";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <header className="rounded-2xl border border-accent bg-surface p-5 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold tracking-wide sm:text-3xl">
          単価比較アプリ
        </h1>
        <p className="mt-3 leading-relaxed">
          価格と数量が違う2つの商品を、同じ単位あたりの価格で比べます。
          共通の単位を選び、商品A・Bの価格（税込）と数量を入力してください。
        </p>
        <p className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm leading-relaxed text-accent-strong">
          価格面での比較です。用途・品質なども確認してください。
        </p>
      </header>
      <UnitPriceComparer />
    </main>
  );
}
