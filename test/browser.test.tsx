import { fireEvent, render, screen, act } from "@testing-library/react";
import { AssetBrowser, categories, filterAssets, type AssetManifest } from "../src/browser";

const manifest: AssetManifest = {
  version: 1,
  generated: "2026-09-16",
  assets: [
    { id: "figure-a", name: "Service map", category: "Figures", kind: "figure", preview: "docs/assets/a.svg", source: "serviceMap()", tags: ["preset"] },
    { id: "icon-lock", name: "lock", category: "Icons", kind: "icon", preview: "docs/assets/b.svg", source: 'icon="lock"', tags: ["icon", "lock"] },
    { id: "icon-db", name: "db", category: "Icons", kind: "icon", preview: "docs/assets/c.svg", source: 'icon="db"', tags: ["icon", "db"] },
  ],
};

describe("asset browser", () => {
  it("counts categories with All first", () => {
    expect(categories(manifest.assets)).toEqual([
      { name: "All", count: 3 },
      { name: "Figures", count: 1 },
      { name: "Icons", count: 2 },
    ]);
  });
  it("filters by category and query", () => {
    expect(filterAssets(manifest.assets, "Icons", "").map((a) => a.id)).toEqual(["icon-lock", "icon-db"]);
    expect(filterAssets(manifest.assets, "All", "LOCK").map((a) => a.id)).toEqual(["icon-lock"]);
    expect(filterAssets(manifest.assets, "Figures", "lock")).toEqual([]);
  });
  it("renders the grid, switches category, searches, and runs the action", async () => {
    const onAction = vi.fn();
    const { container } = render(<AssetBrowser manifest={manifest} onAction={onAction} base="/" />);
    expect(screen.getAllByRole("listitem").filter((li) => li.className.includes("card"))).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: /^Icons/ }));
    expect(screen.getByRole("status")).toHaveTextContent("2 assets in Icons");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "db" } });
    expect(screen.getByRole("status")).toHaveTextContent("1 asset in Icons");
    const btn = screen.getByRole("button", { name: "Copy db" });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "icon-db" }));
    expect(btn).toHaveTextContent("Copied");
    expect(container.querySelector("img")).toHaveAttribute("src", "/docs/assets/c.svg");
  });
  it("says so when nothing matches", () => {
    render(<AssetBrowser manifest={manifest} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzz" } });
    expect(screen.getByText("Nothing matches.")).toBeInTheDocument();
  });
});
