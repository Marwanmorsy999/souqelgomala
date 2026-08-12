import { describe, it, expect, vi, afterEach } from "vitest";
import type { Product } from "../../../lib/types";
import { getProductsByIds } from "../../../lib/services/catalog";

function makeProduct(id: string, name: string): Product {
  return {
    id,
    name,
    english: name,
    size: "كيلو",
    retail: 11.5,
    wholesale: 8,
    category: "فاكهة",
    inStock: true,
    image: `https://placehold.co/100x100?text=${id}`,
  };
}

function mockJsonFetch(payload: unknown, status = 200) {
  return vi.fn(
    () =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(payload),
      }) as unknown as Response,
  );
}

describe("getProductsByIds (storefront catalog client)", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("requests ONLY the referenced ids (deduped) and unwraps the data", async () => {
    const products = [makeProduct("a", "برتقال"), makeProduct("b", "تفاح")];
    const spy = mockJsonFetch({ success: true, data: products });
    globalThis.fetch = spy as unknown as typeof fetch;

    const res = await getProductsByIds(["a", "b", "a", "b"]);

    expect(spy).toHaveBeenCalledTimes(1);
    const [input] = spy.mock.calls[0]!;
    const url = new URL(String(input), "http://localhost");
    expect(url.pathname).toBe("/api/catalog/products");
    expect(url.searchParams.get("ids")).toBe("a,b");
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({
      ids: "a,b",
      pageSize: "2",
    });
    expect(res).toHaveLength(2);
    expect(res.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("short-circuits to [] without a network request when ids is empty", async () => {
    const spy = mockJsonFetch({ success: true, data: [] });
    globalThis.fetch = spy as unknown as typeof fetch;

    await expect(getProductsByIds([])).resolves.toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("still hits the network for a single id and passes pageSize", async () => {
    const spy = mockJsonFetch({
      success: true,
      data: [makeProduct("x", "ليمون")],
    });
    globalThis.fetch = spy as unknown as typeof fetch;

    const res = await getProductsByIds(["x"]);

    expect(spy).toHaveBeenCalledTimes(1);
    const [input] = spy.mock.calls[0]!;
    const url = new URL(String(input), "http://localhost");
    expect(url.searchParams.get("ids")).toBe("x");
    expect(url.searchParams.get("pageSize")).toBe("1");
    expect(res[0].id).toBe("x");
  });
});
