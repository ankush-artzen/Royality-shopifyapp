import Link from "next/link";
import React from "react";

function Navbar() {
  return (
    <ui-nav-menu>
      <Link href="/royalty/orders/analytics">Analytics</Link>
      <Link href="/royalty">Products</Link>
      <Link href="/royalty/orders">Orders</Link>
      <Link href="/royalty/orders/transaction">Transactions</Link>
      <Link href="/royalty/billing">Billing</Link>
      <Link href="/royalty/steps">How to use</Link>
    </ui-nav-menu>
  );
}

export default Navbar;

