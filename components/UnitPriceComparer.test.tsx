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
