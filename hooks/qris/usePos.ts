"use client";

import { CACHE_STRATEGIES } from "@/app/providers";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ProductRecord = {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  id?: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive?: boolean;
};

export type DiningTableRecord = {
  id: string;
  clientId: string;
  code: string;
  label: string | null;
  token: string;
  qrisAccountId: string | null;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  qrisAccount?: { id: string; label: string; merchantName: string } | null;
  branch?: { id: string; name: string } | null;
  _count?: { orders: number };
};

export type DiningTableInput = {
  id?: string;
  code: string;
  label?: string | null;
  qrisAccountId?: string | null;
  branchId?: string | null;
  isActive?: boolean;
};

export type OrderRecord = {
  id: string;
  clientId: string;
  tableId: string | null;
  customerName: string | null;
  note: string | null;
  status: string;
  orderType: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  table: { code: string; label: string | null } | null;
  branch: { id: string; name: string } | null;
  items: {
    id: string;
    productName: string;
    unitPrice: number;
    qty: number;
    note: string | null;
  }[];
  qrisTransaction: {
    id: string;
    status: string;
    amount: number;
    dynamicPayload: string;
    expiresAt: string;
    paidAt: string | null;
    deliveries: {
      id: string;
      ok: boolean;
      attempts: number;
      statusCode: number | null;
      createdAt: string;
    }[];
  } | null;
};

export type OrderType = "dine-in" | "takeaway" | "delivery";

export type PosOrderInput = {
  orderType: OrderType;
  paymentMethod: "qris" | "cash" | "transfer";
  accountId?: string | null;
  tableId?: string | null;
  customerName?: string | null;
  note?: string | null;
  items: { productId: string; qty: number }[];
};

export type PosOrderResult = {
  orderId: string;
  total: number;
  paymentMethod: "qris" | "cash" | "transfer";
  receiptNumber?: number;
  receiptCode?: string;
  qrisTransactionId?: string;
  expiresAt?: string;
  qrisPayload?: string;
};

export const useCreatePosOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PosOrderInput) => {
      const res = await apiPost<PosOrderResult>("/api/orders/pos", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["qrisTransactions"] });
    },
  });
};

export const useGetProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiGet<ProductRecord[]>("/api/products");
      return res.data;
    },
    ...CACHE_STRATEGIES.dynamic,
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const res = await apiPost<ProductRecord>("/api/products", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ProductInput) => {
      const res = await apiPut<ProductRecord>("/api/products", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete("/api/products", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useGetTables = () =>
  useQuery({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await apiGet<DiningTableRecord[]>("/api/tables");
      return res.data;
    },
    ...CACHE_STRATEGIES.dynamic,
  });

export const useCreateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DiningTableInput) => {
      const res = await apiPost<DiningTableRecord>("/api/tables", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

export const useUpdateTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: DiningTableInput) => {
      const res = await apiPut<DiningTableRecord>("/api/tables", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

export const useDeleteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete("/api/tables", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

export type OrderStatsPoint = {
  key: string;
  label: string;
  orders: number;
  revenue: number;
};

export type OrderStats = {
  daily: OrderStatsPoint[];
  monthly: OrderStatsPoint[];
  byType: { key: string; label: string; orders: number }[];
  balances: { cash: number; transfer: number; qris: number };
  qrisByAccount: { id: string; label: string; amount: number }[];
};

export const useGetOrderStats = (branchId = "all") =>
  useQuery({
    queryKey: ["orders", "stats", branchId],
    queryFn: async () => {
      const res = await apiGet<OrderStats>("/api/orders/stats", {
        params: branchId === "all" ? undefined : { branchId },
      });
      return res.data;
    },
    ...CACHE_STRATEGIES.realtime,
  });

export const useGetOrders = (status = "all", branchId = "all") =>
  useQuery({
    queryKey: ["orders", status, branchId],
    queryFn: async () => {
      const res = await apiGet<OrderRecord[]>("/api/orders", {
        params: {
          status,
          ...(branchId === "all" ? {} : { branchId }),
        },
      });
      return res.data;
    },
    ...CACHE_STRATEGIES.realtime,
  });
