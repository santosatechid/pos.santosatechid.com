"use client";

import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import QrisAccountsTab from "./QrisAccountsTab";
import QrisTransactionsTab from "./QrisTransactionsTab";
import TablesTab from "./TablesTab";
import { type QrisTab } from "./QrisPageView";

function Panel({
  children,
  reduced,
}: {
  children: ReactNode;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function QrisWorkspace({
  initialTab,
}: {
  initialTab: QrisTab;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Panel reduced={reduced}>
        {initialTab === "accounts" ? <QrisAccountsTab /> : null}
        {initialTab === "transactions" ? <QrisTransactionsTab /> : null}
        {initialTab === "products" ? <ProductsTab /> : null}
        {initialTab === "tables" ? <TablesTab /> : null}
        {initialTab === "orders" ? <OrdersTab /> : null}
      </Panel>
    </div>
  );
}
