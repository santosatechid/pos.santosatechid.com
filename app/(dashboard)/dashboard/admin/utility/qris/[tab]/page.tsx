import QrisPageView, {
  type QrisTab,
} from "@/components/qris/QrisPageView";
import { notFound } from "next/navigation";

const TABS: QrisTab[] = [
  "accounts",
  "transactions",
  "products",
  "tables",
  "orders",
];

export default async function QrisTabPage({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const { tab } = await params;
  if (!TABS.includes(tab as QrisTab)) notFound();

  return <QrisPageView initialTab={tab as QrisTab} />;
}
