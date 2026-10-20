import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { api } from '@/lib/api';
import type { Checkout, PaymentStatus } from '@/types/api';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Opens Squad's secure checkout, waits for the parent to finish, then asks our API to confirm
 * with Squad. Returns SUCCESS, PENDING (bank still processing) or FAILED / CANCELLED.
 */
export function usePayment(start: () => Promise<Checkout>, invalidate: unknown[][]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<PaymentStatus['status'] | 'CANCELLED'> => {
      const checkout = await start();
      const result = await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, 'brainbox://payment');
      // Even if the browser was closed by hand, the payment may have gone through: always check.
      for (let i = 0; i < 4; i++) {
        const { data } = await api.post<PaymentStatus>(`/payments/${checkout.reference}/verify`);
        if (data.status !== 'PENDING') return data.status;
        if (result.type !== 'success' && i === 0) return 'CANCELLED';
        await wait(2500);
      }
      return 'PENDING';
    },
    onSettled: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  });
}
