"use client";

// app/api/users/route.ts

import { type UserDataTypes } from "@/types/userDataTypes";
import { apiGet } from "@/lib/http/apiClient";
import { useQuery } from "@tanstack/react-query";

export const useGetUserByIdBetterAuth = (id: string) => {
  return useQuery<UserDataTypes | null>({
    queryKey: ["users", id],
    queryFn: async () => {
      const response = await apiGet<UserDataTypes>(
        `/api/users/byAuth/${id}`,
      );
      return response?.data || null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  });
};
