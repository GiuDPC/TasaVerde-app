import { useQuery } from '@tanstack/react-query';
import { fetchAllRates, RatesData } from '../services/api';
import { getCachedRates, saveRates } from '../services/ratesStore';

// Network first; if it fails, return local cache (offline-first).
// retry: 0 so offline startup doesn't block for 24s (12s timeout × 2).
async function fetchRatesWithFallback(): Promise<RatesData> {
  try {
    const rates = await fetchAllRates();
    try {
      await saveRates(rates); // cache + accumulate daily snapshot
    } catch {
      // Storage broken: serve live rate anyway (better than losing data).
    }
    return { ...rates, source: 'live', fetchedAt: Date.now() };
  } catch {
    const cached = await getCachedRates();
    if (cached) return { ...cached.rates, source: 'cache', fetchedAt: cached.fetchedAt };
    throw new Error('Sin conexión y sin datos guardados');
  }
}

export function useRates() {
  return useQuery<RatesData>({
    queryKey: ['rates'],
    queryFn: fetchRatesWithFallback,
    staleTime: 30 * 1000,
    // No retries: cache fallback already handles offline. Retrying just makes
    // the skeleton spin for 24s when there's no internet.
    retry: 0,
  });
}
