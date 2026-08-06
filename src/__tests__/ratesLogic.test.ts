import { bestRateOf, computeTrend, filterSnapshots, type RateSnapshot } from '../utils/ratesLogic';

describe('Lógica de Tasas (ratesLogic)', () => {
  describe('bestRateOf (detecta la mejor tasa)', () => {
    it('detecta binance como la mejor opción si es mayor a BCV', () => {
      const snap: RateSnapshot = {
        date: '2023-10-01',
        bcvUsd: 36.5,
        bcvEur: 38.0,
        binance: 37.2,
      };
      
      const result = bestRateOf(snap);
      
      expect(result.source).toBe('binance');
      expect(result.rate).toBe(37.2);
    });

    it('detecta BCV como la mejor opción si es mayor a binance', () => {
      const snap: RateSnapshot = {
        date: '2023-10-01',
        bcvUsd: 38.5,
        bcvEur: 40.0,
        binance: 37.2,
      };
      
      const result = bestRateOf(snap);
      
      expect(result.source).toBe('bcv');
      expect(result.rate).toBe(38.5);
    });
  });

  describe('computeTrend', () => {
    it('calcula la tendencia estable si no hay datos', () => {
      const trend = computeTrend([]);
      expect(trend.direction).toBe('stable');
      expect(trend.changePercent).toBe(0);
    });

    it('calcula tendencia al alza (up) correctamente', () => {
      const snapshots: RateSnapshot[] = [
        { date: '2023-10-01', bcvUsd: 30, bcvEur: 32, binance: 31 },
        { date: '2023-10-02', bcvUsd: 33, bcvEur: 35, binance: 34 },
      ];
      
      const trend = computeTrend(snapshots);
      
      expect(trend.direction).toBe('up');
      expect(trend.changePercent).toBe(10); // (33 - 30) / 30 * 100 = 10%
    });

    it('calcula tendencia a la baja (down) correctamente', () => {
      const snapshots: RateSnapshot[] = [
        { date: '2023-10-01', bcvUsd: 40, bcvEur: 42, binance: 41 },
        { date: '2023-10-02', bcvUsd: 36, bcvEur: 38, binance: 37 },
      ];
      
      const trend = computeTrend(snapshots);
      
      expect(trend.direction).toBe('down');
      expect(trend.changePercent).toBe(-10); // (36 - 40) / 40 * 100 = -10%
    });
  });

  describe('filterSnapshots', () => {
    it('filtra correctamente los días especificados', () => {
      const today = new Date();
      const format = (d: Date) => d.toISOString().split('T')[0];
      
      const day1 = new Date(today);
      day1.setDate(today.getDate() - 10);
      
      const day2 = new Date(today);
      day2.setDate(today.getDate() - 1);
      
      const day3 = new Date(today);
      
      const snapshots: RateSnapshot[] = [
        { date: format(day1), bcvUsd: 35, bcvEur: 37, binance: 36 },
        { date: format(day2), bcvUsd: 36, bcvEur: 38, binance: 37 },
        { date: format(day3), bcvUsd: 37, bcvEur: 39, binance: 38 },
      ];
      
      const filtered = filterSnapshots(snapshots, 3);
      expect(filtered.length).toBe(2);
      expect(filtered[0].date).toBe(format(day2));
    });
  });
});
