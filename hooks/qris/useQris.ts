"use client";

import { CACHE_STRATEGIES } from "@/app/providers";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/http/apiClient";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type QrisAccountRecord = {
  id: string;
  clientId: string;
  label: string;
  staticPayload: string;
  merchantName: string;
  merchantCity: string;
  merchantNmid: string | null;
  webhookUrl: string | null;
  webhookSecretTail: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { transactions: number };
};

export type WebhookDeliveryRecord = {
  id: string;
  event: string;
  url: string;
  statusCode: number | null;
  attempts: number;
  ok: boolean;
  error: string | null;
  createdAt: string;
  deliveredAt: string | null;
};

export type QrisTransactionRecord = {
  id: string;
  orderId: string;
  amount: number;
  dynamicPayload: string;
  status: string;
  expiresAt: string;
  paidAt: string | null;
  confirmedBy: string | null;
  createdAt: string;
  account?: { id: string; label: string; merchantName: string };
  order?: {
    id: string;
    customerName: string | null;
    table: { code: string; label: string | null } | null;
  } | null;
  deliveries?: WebhookDeliveryRecord[];
};

export type QrisAccountInput = {
  id?: string;
  label: string;
  staticPayload?: string;
  webhookUrl?: string | null;
  isActive?: boolean;
  rotateSecret?: boolean;
};

export type QrisTransactionInput = {
  accountId: string;
  amount: number;
  orderId?: string;
  expiresInMinutes?: number;
};

const invalidateQris = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["qrisAccounts"] });
  queryClient.invalidateQueries({ queryKey: ["qrisTransactions"] });
  queryClient.invalidateQueries({ queryKey: ["orders"] });
};

export const useGetQrisAccounts = () =>
  useQuery({
    queryKey: ["qrisAccounts"],
    queryFn: async () => {
      const res = await apiGet<QrisAccountRecord[]>("/api/qris/accounts");
      return res.data;
    },
    ...CACHE_STRATEGIES.dynamic,
  });

export const useCreateQrisAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QrisAccountInput) => {
      const res = await apiPost<QrisAccountRecord & { webhookSecret: string }>(
        "/api/qris/accounts",
        data,
      );
      return res.data;
    },
    onSuccess: () => invalidateQris(queryClient),
  });
};

export const useUpdateQrisAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QrisAccountInput) => {
      const res = await apiPut<QrisAccountRecord & { webhookSecret?: string }>(
        "/api/qris/accounts",
        data,
      );
      return res.data;
    },
    onSuccess: () => invalidateQris(queryClient),
  });
};

export const useDeleteQrisAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiDelete("/api/qris/accounts", {
        body: JSON.stringify({ id }),
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    },
    onSuccess: () => invalidateQris(queryClient),
  });
};

export const useGetQrisTransactions = (status = "all") =>
  useQuery({
    queryKey: ["qrisTransactions", status],
    queryFn: async () => {
      const res = await apiGet<QrisTransactionRecord[]>(
        "/api/qris/transactions",
        { params: { status } },
      );
      return res.data;
    },
    ...CACHE_STRATEGIES.realtime,
  });

export const useGetQrisTransaction = (id: string | null, poll = false) =>
  useQuery({
    queryKey: ["qrisTransaction", id],
    queryFn: async () => {
      const res = await apiGet<QrisTransactionRecord>(
        `/api/qris/transactions/${id}`,
      );
      return res.data;
    },
    enabled: Boolean(id),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchInterval: (query) =>
      poll && query.state.data?.status === "pending" ? 5_000 : false,
  });

export const useCheckQrisTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiGet<QrisTransactionRecord>(
        `/api/qris/transactions/${id}`,
      );
      return res.data;
    },
    onSuccess: (transaction) => {
      queryClient.setQueryData(["qrisTransaction", transaction.id], transaction);
      queryClient.invalidateQueries({ queryKey: ["qrisTransactions"] });
    },
  });
};

export const useCreateQrisTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: QrisTransactionInput) => {
      const res = await apiPost<QrisTransactionRecord>(
        "/api/qris/transactions",
        data,
      );
      return res.data;
    },
    onSuccess: () => invalidateQris(queryClient),
  });
};

export const useConfirmQrisTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiPost<{
        transaction: QrisTransactionRecord;
        delivery: WebhookDeliveryRecord | null;
      }>(`/api/qris/transactions/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => invalidateQris(queryClient),
  });
};

export const useResendQrisWebhook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiPost<WebhookDeliveryRecord | null>(
        `/api/qris/transactions/${id}/webhook`,
      );
      return res.data;
    },
    onSuccess: () => invalidateQris(queryClient),
  });
};
