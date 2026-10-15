// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { UnitPriceComparer } from "./UnitPriceComparer";

afterEach(cleanup);

function card(name: "商品A" | "商品B") {
  return within(screen.getByRole("group", { name }));
}

describe("UnitPriceComparer：入力画面", () => {
  it("初期状態は単位「個」、価格・数量・商品名が空欄", () => {
    render(<UnitPriceComparer />);
    expect(screen.getByRole("radio", { name: "個" })).toBeChecked();
    for (const name of ["商品A", "商品B"] as const) {
      expect(card(name).getByLabelText(/商品名/)).toHaveValue("");
      expect(card(name).getByLabelText("価格（税込）")).toHaveValue("");
      expect(card(name).getByLabelText("数量")).toHaveValue("");
      expect(card(name).getByText("個")).toBeInTheDocument();
    }
  });

  it("5つの単位を選べる", () => {
    render(<UnitPriceComparer />);
    const radios = within(
      screen.getByRole("group", { name: "共通単位" }),
    ).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual([
      "個",
      "枚",
      "本",
      "mL",
      "g",
    ]);
  });

  it("単位を変えると両方の数量欄の単位が変わり、入力済みの値は保持される", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);

    await user.type(card("商品A").getByLabelText(/商品名/), "化粧水");
    await user.type(card("商品A").getByLabelText("価格（税込）"), "1200");
    await user.type(card("商品A").getByLabelText("数量"), "50");
    await user.type(card("商品B").getByLabelText("価格（税込）"), "１８００");
    await user.type(card("商品B").getByLabelText("数量"), "100");

    await user.click(screen.getByRole("radio", { name: "mL" }));

    expect(screen.getByRole("radio", { name: "mL" })).toBeChecked();
    for (const name of ["商品A", "商品B"] as const) {
      expect(card(name).getByText("mL")).toBeInTheDocument();
      expect(card(name).queryByText("個")).not.toBeInTheDocument();
      expect(card(name).getByLabelText("数量")).toHaveAttribute(
        "inputmode",
        "decimal",
      );
    }
    expect(card("商品A").getByLabelText(/商品名/)).toHaveValue("化粧水");
    expect(card("商品A").getByLabelText("価格（税込）")).toHaveValue("1200");
    expect(card("商品A").getByLabelText("数量")).toHaveValue("50");
    expect(card("商品B").getByLabelText("価格（税込）")).toHaveValue("１８００");
    expect(card("商品B").getByLabelText("数量")).toHaveValue("100");
  });

  it("価格欄に「カンマなしで入力」の案内が結び付いている", () => {
    render(<UnitPriceComparer />);
    for (const name of ["商品A", "商品B"] as const) {
      expect(card(name).getByLabelText("価格（税込）")).toHaveAccessibleDescription(
        /カンマなしで入力/,
      );
    }
  });
});

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  name: "商品A" | "商品B",
  values: { name?: string; price?: string; quantity?: string },
) {
  if (values.name) await user.type(card(name).getByLabelText(/商品名/), values.name);
  if (values.price) await user.type(card(name).getByLabelText("価格（税込）"), values.price);
  if (values.quantity) await user.type(card(name).getByLabelText("数量"), values.quantity);
}

function resultArea() {
  return within(screen.getByRole("region", { name: "比較結果" }));
}

describe("UnitPriceComparer：比較と結果表示", () => {
  it("1,200円／50個と1,800円／100個 → 24円と18円、商品Bが1個あたり6円安い", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "1200", quantity: "50" });
    await fill(user, "商品B", { price: "1800", quantity: "100" });
    await user.click(screen.getByRole("button", { name: "比較する" }));

    const result = resultArea();
    expect(result.getByText("商品Bの方が1個あたり6円安いです")).toBeInTheDocument();
    const rows = result.getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("商品A");
    expect(rows[0]).toHaveTextContent("1個あたり 24円");
    expect(rows[0]).not.toHaveTextContent("安い");
    expect(rows[1]).toHaveTextContent("商品B安い");
    expect(rows[1]).toHaveTextContent("1個あたり 18円");
  });

  it("1,000円／50個と2,000円／100個 → 同じ単価です", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "1000", quantity: "50" });
    await fill(user, "商品B", { price: "2000", quantity: "100" });
    await user.click(screen.getByRole("button", { name: "比較する" }));

    expect(resultArea().getByText("同じ単価です")).toBeInTheDocument();
    expect(resultArea().queryByText("安い")).not.toBeInTheDocument();
  });

  it("商品名を入力すると結果にその名前を使い、Enterキーでも比較できる", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await user.click(screen.getByRole("radio", { name: "mL" }));
    await fill(user, "商品A", { name: "化粧水S", price: "300", quantity: "0.5" });
    await fill(user, "商品B", { name: "化粧水L", price: "７００", quantity: "１．２５" });
    await user.type(card("商品B").getByLabelText("数量"), "{Enter}");

    expect(
      resultArea().getByText("化粧水Lの方が1mLあたり40円安いです"),
    ).toBeInTheDocument();
    expect(resultArea().getAllByRole("listitem")[0]).toHaveTextContent(
      "1mLあたり 600円",
    );
  });

  it("表示上は同額になる場合に案内文を出す", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "10001", quantity: "3000" });
    await fill(user, "商品B", { price: "10000", quantity: "3000" });
    await user.click(screen.getByRole("button", { name: "比較する" }));

    expect(
      resultArea().getByText(/表示は小数第2位までのため、差が見えない場合があります/),
    ).toBeInTheDocument();
    expect(resultArea().getByText(/商品Bの方が/)).toBeInTheDocument();
  });
});

describe("UnitPriceComparer：入力エラー", () => {
  it("空欄で比較すると計算せず、商品と欄ごとの理由を出す", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await user.click(screen.getByRole("button", { name: "比較する" }));

    const result = resultArea();
    expect(result.getByText("⚠ 入力内容を確認してください")).toBeInTheDocument();
    for (const text of [
      "商品Aの価格：価格を入力してください。",
      "商品Aの数量：数量を入力してください。",
      "商品Bの価格：価格を入力してください。",
      "商品Bの数量：数量を入力してください。",
    ]) {
      expect(result.getByText(text)).toBeInTheDocument();
    }
    expect(result.queryByText(/あたり/)).toBeNull();
    const price = card("商品A").getByLabelText("価格（税込）");
    expect(price).toHaveAttribute("aria-invalid", "true");
    expect(price).toHaveAccessibleDescription(/価格を入力してください。/);
  });

  it("0・負数・上限超過・許可されない小数を拒否する", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "0", quantity: "-3" });
    await fill(user, "商品B", { price: "1000001", quantity: "1.5" });
    await user.click(screen.getByRole("button", { name: "比較する" }));

    const result = resultArea();
    expect(result.getByText("商品Aの価格：価格は1円以上で入力してください。")).toBeInTheDocument();
    expect(result.getByText("商品Aの数量：数量は0より大きい数で入力してください。")).toBeInTheDocument();
    expect(result.getByText("商品Bの価格：価格は1,000,000円以下で入力してください。")).toBeInTheDocument();
    expect(
      result.getByText("商品Bの数量：単位が「個」のときは、数量を整数で入力してください。"),
    ).toBeInTheDocument();
    expect(result.queryByText(/安いです|同じ単価です/)).toBeNull();
  });

  it("直した欄のエラーは消え、残りのエラーは残る", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { quantity: "50" });
    await fill(user, "商品B", { price: "1800", quantity: "100" });
    await user.click(screen.getByRole("button", { name: "比較する" }));
    expect(resultArea().getByText("商品Aの価格：価格を入力してください。")).toBeInTheDocument();

    await fill(user, "商品A", { price: "1200" });
    expect(resultArea().queryByText(/商品Aの価格/)).toBeNull();
    expect(card("商品A").getByLabelText("価格（税込）")).not.toHaveAttribute("aria-invalid");
  });
});

describe("UnitPriceComparer：入力変更で古い結果を消す", () => {
  async function compared() {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "1200", quantity: "50" });
    await fill(user, "商品B", { price: "1800", quantity: "100" });
    await user.click(screen.getByRole("button", { name: "比較する" }));
    expect(resultArea().getByText(/安いです/)).toBeInTheDocument();
    return user;
  }

  const stale = /入力が変更されたため、結果を消しました。もう一度「比較する」を押してください。/;

  it("価格を変えると結果が消え、再比較を促す", async () => {
    const user = await compared();
    await fill(user, "商品B", { price: "0" });
    expect(resultArea().queryByText(/安いです/)).toBeNull();
    expect(resultArea().getByText(stale)).toBeInTheDocument();
  });

  it("商品名を変えても結果が消える", async () => {
    const user = await compared();
    await fill(user, "商品A", { name: "x" });
    expect(resultArea().getByText(stale)).toBeInTheDocument();
  });

  it("単位を変えても結果が消え、再比較すると新しい単位で表示する", async () => {
    const user = await compared();
    await user.click(screen.getByRole("radio", { name: "本" }));
    expect(resultArea().getByText(stale)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "比較する" }));
    expect(resultArea().getByText("商品Bの方が1本あたり6円安いです")).toBeInTheDocument();
  });
});

describe("UnitPriceComparer：リセット", () => {
  const placeholder = "入力して「比較する」を押すと、ここに結果が表示されます。";

  function expectInitialState() {
    expect(screen.getByRole("radio", { name: "個" })).toBeChecked();
    for (const name of ["商品A", "商品B"] as const) {
      expect(card(name).getByLabelText(/商品名/)).toHaveValue("");
      expect(card(name).getByLabelText("価格（税込）")).toHaveValue("");
      expect(card(name).getByLabelText("数量")).toHaveValue("");
      expect(card(name).getByLabelText("価格（税込）")).not.toHaveAttribute("aria-invalid");
      expect(card(name).getByLabelText("数量")).not.toHaveAttribute("aria-invalid");
      expect(card(name).getByText("個")).toBeInTheDocument();
    }
    expect(resultArea().getByText(placeholder)).toBeInTheDocument();
    expect(screen.queryByText(/⚠/)).toBeNull();
  }

  it("比較結果の表示中にリセットすると、入力・単位・結果が初期状態に戻る", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await user.click(screen.getByRole("radio", { name: "g" }));
    await fill(user, "商品A", { name: "粉A", price: "300", quantity: "0.5" });
    await fill(user, "商品B", { name: "粉B", price: "700", quantity: "1.25" });
    await user.click(screen.getByRole("button", { name: "比較する" }));
    expect(resultArea().getByText(/安いです/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "リセット" }));
    expectInitialState();
  });

  it("入力エラーの表示中にリセットすると、エラーが消え、新たなエラーも出ない", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "0" });
    await user.click(screen.getByRole("button", { name: "比較する" }));
    expect(resultArea().getByText("⚠ 入力内容を確認してください")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "リセット" }));
    expectInitialState();
  });

  it("再比較の案内が出ているときにリセットすると、案内も消える", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "1200", quantity: "50" });
    await fill(user, "商品B", { price: "1800", quantity: "100" });
    await user.click(screen.getByRole("button", { name: "比較する" }));
    await fill(user, "商品A", { price: "0" });
    expect(resultArea().getByText(/結果を消しました/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "リセット" }));
    expectInitialState();
    expect(resultArea().queryByText(/結果を消しました/)).toBeNull();
  });

  it("リセット後も、比較と入力変更で結果を消す動作は変わらない", async () => {
    const user = userEvent.setup();
    render(<UnitPriceComparer />);
    await fill(user, "商品A", { price: "999", quantity: "9" });
    await user.click(screen.getByRole("button", { name: "リセット" }));

    await fill(user, "商品A", { price: "1200", quantity: "50" });
    await fill(user, "商品B", { price: "1800", quantity: "100" });
    await user.click(screen.getByRole("button", { name: "比較する" }));
    expect(resultArea().getByText("商品Bの方が1個あたり6円安いです")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "枚" }));
    expect(resultArea().getByText(/結果を消しました/)).toBeInTheDocument();
  });
});
