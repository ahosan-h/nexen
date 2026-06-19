import { apiFetch } from "@/lib/api";
import { createScanDto, Scan } from "@/types/scan";

export const ScanService = {
  create: (data: createScanDto, token: string) =>
    apiFetch<Scan>("/scan", {
      method: "POST",
      token,
      body: data,
    }),

  find: (barcode: string, token: string) =>
    apiFetch<Scan>(`/scan/${barcode}`, {
      token,
    }),
};
