import { useQuery } from '@tanstack/react-query';
import { fetchHistory, HistoryResponse } from '../services/api';
import { getSnapshots, saveSnapshots } from '../services/ratesStore';
import {
  buildHistoryResponse,
  mergeSnapshots,
  serverEntriesToSnapshots,
} from '../utils/ratesLogic';

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// Historial 100% local. Si hay pocos datos (primer uso), intenta sembrar desde
// el server con un tope de 4s: si el server está dormido, no se bloquea la UI.
async function loadHistory(days: number): Promise<HistoryResponse> {
  const local = await getSnapshots();
  const response = buildHistoryResponse(local, days);

  if (local.length < 2) {
    try {
      const server = await withTimeout(fetchHistory(30), 4000);
      const merged = mergeSnapshots(local, serverEntriesToSnapshots(server.data));
      if (merged.length > local.length) {
        await saveSnapshots(merged);
        return buildHistoryResponse(merged, days);
      }
    } catch {
      // offline o server dormido: se sigue con lo local (hoy + acumulación diaria)
    }
  }

  return response;
}

export function useHistory(days: number = 7) {
  return useQuery<HistoryResponse>({
    queryKey: ['history', days],
    queryFn: () => loadHistory(days),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
