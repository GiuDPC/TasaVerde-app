import axios from 'axios';

// URL de produccion (Render). ponytail: sigue siendo un solo punto de red para el dato
// "en vivo", pero offline-first ya no lo hace crítico (la app opera con caché).
// Upgrade path: llamar directo a la API pública de Binance P2P desde la app.
const API_URL = 'https://kambio-server.onrender.com/api';

const http = axios.create({
  baseURL: API_URL,
  // ponytail: 12s mata el skeleton infinito cuando Render "duerme" (free tier).
  timeout: 12000,
});

export interface Rates {
  bcv: {
    usd: number;
    eur: number;
    date: string | null;
  };
  binance: number;
  bestOption: 'bcv' | 'binance';
  lastUpdated: string;
}

export interface RatesData extends Rates {
  source: 'live' | 'cache';
  fetchedAt: number;
}

export interface HistoryEntry {
  timestamp: string;
  bcvUsd: number;
  bcvEur: number;
  binance: number;
}

export interface Trend {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  minBcv: number;
  maxBcv: number;
  avgBcv: number;
  firstValue: number;
  lastValue: number;
  dataPoints: number;
}

export interface HistoryResponse {
  period: number;
  trend: Trend;
  data: HistoryEntry[];
}

export async function fetchAllRates(): Promise<Rates> {
  const response = await http.get<Rates>('/rates');
  return response.data;
}

export async function fetchHistory(days: number = 30): Promise<HistoryResponse> {
  const response = await http.get<HistoryResponse>('/history', { params: { days } });
  return response.data;
}
