import TableOrderClient from "@/components/order/TableOrderClient";
import { getPublicTable } from "@/services/qris/orders";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PublicTablePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPublicTable(token);
  if (!data) notFound();

  return <TableOrderClient token={token} data={data} />;
}
