import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/services/adapters';

/** useMutation + consistent toasts + query invalidation. `invalidate` is a list of query keys. */
export function useApiMutation(mutationFn, { success, invalidate = [], onSuccess, silentError = false } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (data, vars, ctx) => {
      if (success) toast.success(typeof success === 'function' ? success(data, vars) : success);
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      onSuccess?.(data, vars, ctx);
    },
    onError: (err) => { if (!silentError) toast.error(getErrorMessage(err)); },
  });
}
