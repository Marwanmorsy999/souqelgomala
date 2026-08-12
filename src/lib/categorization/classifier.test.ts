import { describe, it, expect } from "vitest";
import { classify, auditProducts } from "./classifier";
import { TAXONOMY, findCategory, getHomepageTiles, getTaxonomyTree } from "./taxonomy";

// Helper: id of a taxonomy node by Arabic name.
function idOf(nameAr: string): string {
  const node = TAXONOMY.find((n) => n.nameAr === nameAr);
  if (!node) throw new Error(`missing taxonomy node ${nameAr}`);
  return node.id;
}

describe("taxonomy: single source of truth", () => {
  it("homepage tiles resolve to real taxonomy ids (no phantom categories)", () => {
    const tiles = getHomepageTiles();
    for (const t of tiles) {
      expect(findCategory(t.id)).toBeDefined();
    }
    // Every id is unique and exists exactly once.
    const ids = new Set(TAXONOMY.map((n) => n.id));
    expect(ids.size).toBe(TAXONOMY.length);
  });

  it("tree is well-formed: every parent_id references a real node", () => {
    const ids = new Set(TAXONOMY.map((n) => n.id));
    for (const n of TAXONOMY) {
      if (n.parentId) expect(ids.has(n.parentId)).toBe(true);
    }
    const tree = getTaxonomyTree();
    expect(tree.length).toBeGreaterThan(0);
  });
});

describe("semantic classifier: disambiguates by intent, not keywords", () => {
  it('"Butter Cookies" is Bakery, NOT Butter & Ghee', () => {
    const r = classify({ nameEn: "Butter Cookies 200g" });
    expect(r.categoryId).toBe(idOf("مخبوزات وبسكويت"));
    expect(r.nameAr).not.toBe("زبدة وسمنة");
  });

  it('"Oasis Soft Drink" is a Beverage, NOT Cheese', () => {
    const r = classify({ nameEn: "Oasis Soft Drink Orange 1.5L", brand: "Oasis" });
    expect([idOf("مشروبات"), idOf("عصائر")]).toContain(r.categoryId);
    expect(r.nameAr).not.toBe("أجبان");
  });

  it("drinking water lands in Water, not grocery", () => {
    const r = classify({ nameEn: "Safa Natural Water 1.5L", brand: "Safa" });
    expect(r.categoryId).toBe(idOf("مياه"));
  });

  it("cheese stays in Cheese (positive dairy + refrigerated)", () => {
    const r = classify({ nameEn: "Panda Processed Cheese 200g" });
    expect(r.categoryId).toBe(idOf("أجبان"));
  });

  it("spices land in Spices, not Beverages (despite being a powder)", () => {
    const r = classify({ nameEn: "El Arish Black Pepper Powder 50g" });
    expect(r.categoryId).toBe(idOf("بهارات"));
  });

});

describe("granular audit: every product analysed independently", () => {
  it("flags products whose proposed category differs from current", () => {
    const rows = auditProducts([
      { id: "kz-1", nameEn: "Safa Natural Water 1.5L", currentCategoryId: idOf("مخبوزات وبسكويت") },
      { id: "kz-2", nameEn: "Panda Processed Cheese 200g", currentCategoryId: idOf("أجبان") },
    ]);
    expect(rows).toHaveLength(2);
    const moved = rows.find((r) => r.id === "kz-1")!;
    expect(moved.changed).toBe(true);
    expect(moved.proposedCategoryId).toBe(idOf("مياه"));
    const correct = rows.find((r) => r.id === "kz-2")!;
    expect(correct.changed).toBe(false);
  });

  it("produces reasoning for the winning assignment", () => {
    const r = classify({ nameEn: "Juhayna Full Cream Milk 1L", brand: "Juhayna" });
    expect(r.reasoning.length).toBeGreaterThan(0);
    expect(r.reasoning[0].contribution).toBeGreaterThan(0);
  });
});
