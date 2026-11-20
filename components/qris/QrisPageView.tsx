import { jakarta } from "@/components/landing/font";
import QrisWorkspace from "@/components/qris/QrisWorkspace";

export type QrisTab =
  | "accounts"
  | "transactions"
  | "products"
  | "tables"
  | "orders";

export default function QrisPageView({ initialTab }: { initialTab: QrisTab }) {
  return (
    <div
      className={`${jakarta.className} landing-theme rounded-3xl bg-[#F7F7F8] p-4 md:p-6`}
    >
      <QrisWorkspace initialTab={initialTab} />
    </div>
  );
}
