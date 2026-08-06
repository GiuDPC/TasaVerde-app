import { useQuery } from '@tanstack/react-query';
import { fetchAllRates, RatesData } from '../services/api';
import { getCachedRates, saveRates } from '../services/ratesStore';

async function fetchRatesWithFallback(): Promise<RatesData> {
  try {
    const rates = await fetchAllRates();
    try {
      await saveRates(rates); 
    } catch {
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
    retry: 0,
  });
}
