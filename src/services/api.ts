import axios from 'axios';

const API_URL = 'https://kambio-server.onrender.com/api';

const http = axios.create({
  baseURL: API_URL,
  timeout: 60000,
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
