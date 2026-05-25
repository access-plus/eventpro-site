import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { queryKeys } from "@/state/queryKeys";

export function useCheckoutTotalsQuery(subtotal: number, state?: string, country?: string) {
  return useQuery({
    queryKey: queryKeys.checkout.totals(subtotal, state, country),
    queryFn: () => apiService.getCheckoutTotals(subtotal, state || undefined, country || undefined),
    enabled: subtotal > 0,
  });
}
