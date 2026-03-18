import { cookies } from "next/headers";
import { createReader } from "@keystatic/core/reader";
import config from "../../keystatic.config";
import type { Cart, CartItem, Collection, Menu, Page, Product } from "./types";

const reader = createReader(process.cwd(), config);

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProduct(handle: string): Promise<Product | undefined> {
  const entry = await reader.collections.products.read(handle);
  if (!entry) return undefined;
  return { ...entry, handle } as unknown as Product;
}

export async function getProducts({
  query,
  sortKey,
  reverse,
}: {
  query?: string;
  sortKey?: string;
  reverse?: boolean;
} = {}): Promise<Product[]> {
  const slugs = await reader.collections.products.list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections.products.read(slug);
      return entry ? { ...entry, handle: slug } : null;
    })
  );
  let products = entries.filter(Boolean) as unknown as Product[];

  if (query) {
    const q = query.toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (sortKey === "PRICE") {
    products = [...products].sort(
      (a, b) =>
        Number(a.priceRange.minVariantPrice.amount) -
        Number(b.priceRange.minVariantPrice.amount)
    );
  } else if (sortKey === "TITLE") {
    products = [...products].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortKey === "CREATED_AT") {
    products = [...products].sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
  }

  if (reverse) products = [...products].reverse();

  return products;
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  const all = await getProducts();
  return all.filter((p) => p.id !== productId).slice(0, 4);
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  const entry = await reader.collections.collections.read(handle);
  if (!entry) return undefined;
  return { ...entry, handle } as unknown as Collection;
}

export async function getCollections(): Promise<Collection[]> {
  const slugs = await reader.collections.collections.list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections.collections.read(slug);
      return entry ? { ...entry, handle: slug } : null;
    })
  );
  return entries.filter(Boolean) as unknown as Collection[];
}

export async function getCollectionProducts({
  collection,
  sortKey,
  reverse,
}: {
  collection: string;
  sortKey?: string;
  reverse?: boolean;
}): Promise<Product[]> {
  const all = await getProducts({ sortKey, reverse });
  return all.filter((p) => p.tags.includes(collection));
}

// ─── Cart (cookie-based) ──────────────────────────────────────────────────────

function emptyCart(): Cart {
  return {
    id: undefined,
    totalQuantity: 0,
    lines: [],
    cost: {
      subtotalAmount: { amount: "0", currencyCode: "NOK" },
      totalAmount: { amount: "0", currencyCode: "NOK" },
      totalTaxAmount: { amount: "0", currencyCode: "NOK" },
    },
  };
}

function recalcCart(cart: Cart): Cart {
  const totalQuantity = cart.lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalAmount = cart.lines.reduce(
    (sum, l) => sum + Number(l.cost.totalAmount.amount),
    0
  );
  const currencyCode =
    cart.lines[0]?.cost.totalAmount.currencyCode ?? "NOK";

  return {
    ...cart,
    totalQuantity,
    cost: {
      subtotalAmount: { amount: totalAmount.toFixed(2), currencyCode },
      totalAmount: { amount: totalAmount.toFixed(2), currencyCode },
      totalTaxAmount: { amount: "0", currencyCode },
    },
  };
}

async function saveCart(cart: Cart): Promise<void> {
  (await cookies()).set("cart", JSON.stringify(cart), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getCart(): Promise<Cart | undefined> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("cart")?.value;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Cart;
  } catch {
    return undefined;
  }
}

export async function createCart(): Promise<Cart> {
  const cart = emptyCart();
  await saveCart(cart);
  return cart;
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("cart")?.value;
  const cart: Cart = raw
    ? (() => {
        try {
          return JSON.parse(raw) as Cart;
        } catch {
          return emptyCart();
        }
      })()
    : emptyCart();

  const allProducts = await getProducts();

  for (const { merchandiseId, quantity } of lines) {
    const product = allProducts.find((p) =>
      p.variants.some((v) => v.id === merchandiseId)
    );
    if (!product) continue;
    const variant = product.variants.find((v) => v.id === merchandiseId)!;

    const existing = cart.lines.find(
      (l) => l.merchandise.id === merchandiseId
    );
    if (existing) {
      existing.quantity += quantity;
      existing.cost.totalAmount.amount = (
        Number(variant.price.amount) * existing.quantity
      ).toFixed(2);
    } else {
      const newItem: CartItem = {
        id: merchandiseId,
        quantity,
        cost: {
          totalAmount: {
            amount: (Number(variant.price.amount) * quantity).toFixed(2),
            currencyCode: variant.price.currencyCode,
          },
        },
        merchandise: {
          id: variant.id,
          title: variant.title,
          selectedOptions: variant.selectedOptions,
          product: {
            id: product.id,
            handle: product.handle,
            title: product.title,
            featuredImage: product.featuredImage,
          },
        },
      };
      cart.lines.push(newItem);
    }
  }

  const updated = recalcCart(cart);
  await saveCart(updated);
  return updated;
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("cart")?.value;
  const cart: Cart = raw
    ? (() => {
        try {
          return JSON.parse(raw) as Cart;
        } catch {
          return emptyCart();
        }
      })()
    : emptyCart();

  cart.lines = cart.lines.filter((l) => !lineIds.includes(l.id ?? ""));
  const updated = recalcCart(cart);
  await saveCart(updated);
  return updated;
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("cart")?.value;
  const cart: Cart = raw
    ? (() => {
        try {
          return JSON.parse(raw) as Cart;
        } catch {
          return emptyCart();
        }
      })()
    : emptyCart();

  const allProducts = await getProducts();

  for (const { id, merchandiseId, quantity } of lines) {
    const product = allProducts.find((p) =>
      p.variants.some((v) => v.id === merchandiseId)
    );
    if (!product) continue;
    const variant = product.variants.find((v) => v.id === merchandiseId)!;
    const line = cart.lines.find((l) => l.id === id);
    if (line) {
      line.quantity = quantity;
      line.cost.totalAmount.amount = (
        Number(variant.price.amount) * quantity
      ).toFixed(2);
    }
  }

  const updated = recalcCart(cart);
  await saveCart(updated);
  return updated;
}

// ─── Menus ────────────────────────────────────────────────────────────────────

const MENUS: Record<string, { title: string; path: string }[]> = {
  "header-menu": [
    { title: "All", path: "/search" },
    { title: "Workwear", path: "/search/workwear" },
    { title: "Summer", path: "/search/summer" },
  ],
  "footer-menu": [
    { title: "Home", path: "/" },
    { title: "About", path: "/about" },
  ],
};

export async function getMenu(
  handle: string
): Promise<{ title: string; path: string }[]> {
  return MENUS[handle] ?? [];
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export async function getPage(handle: string): Promise<Page | undefined> {
  const entry = await reader.collections.pages.read(handle);
  if (!entry) return undefined;
  return { ...entry, handle } as unknown as Page;
}

export async function getPages(): Promise<Page[]> {
  const slugs = await reader.collections.pages.list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = await reader.collections.pages.read(slug);
      return entry ? { ...entry, handle: slug } : null;
    })
  );
  return entries.filter(Boolean) as unknown as Page[];
}
