import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { getCart } from "lib/store";
import { ReactNode } from "react";
import { Toaster } from "sonner";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cart = getCart();

  return (
    <CartProvider cartPromise={cart}>
      <Navbar />
      <main>
        {children}
        <Toaster closeButton />
      </main>
    </CartProvider>
  );
}
