// Aturan pembatalan berjenjang (dihitung dari tanggal keberangkatan)
export interface CancellationTier {
  minDays: number;
  penaltyPercent: number;
  label: string;
}

export const CANCELLATION_TIERS: CancellationTier[] = [
  { minDays: 61, penaltyPercent: 10, label: 'Lebih dari 60 hari sebelum keberangkatan' },
  { minDays: 31, penaltyPercent: 25, label: '31-60 hari sebelum keberangkatan' },
  { minDays: 15, penaltyPercent: 50, label: '15-30 hari sebelum keberangkatan' },
  { minDays: 8, penaltyPercent: 75, label: '8-14 hari sebelum keberangkatan' },
  { minDays: 0, penaltyPercent: 90, label: '7 hari atau kurang sebelum keberangkatan' },
];

export interface CancellationEstimate {
  daysToDeparture: number | null;
  penaltyPercent: number;
  penaltyAmount: number;
  refundEstimate: number;
  tierLabel: string;
}

export const estimateCancellation = (
  totalPrice: number,
  paidAmount: number,
  departureDate?: string | null
): CancellationEstimate => {
  let daysToDeparture: number | null = null;
  if (departureDate) {
    const diff = new Date(departureDate).getTime() - Date.now();
    daysToDeparture = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const tier =
    daysToDeparture === null
      ? CANCELLATION_TIERS[2]
      : CANCELLATION_TIERS.find((t) => daysToDeparture! >= t.minDays) ||
        CANCELLATION_TIERS[CANCELLATION_TIERS.length - 1];

  const penaltyAmount = Math.round((totalPrice * tier.penaltyPercent) / 100);
  const refundEstimate = Math.max(0, paidAmount - penaltyAmount);

  return {
    daysToDeparture,
    penaltyPercent: tier.penaltyPercent,
    penaltyAmount,
    refundEstimate,
    tierLabel: tier.label,
  };
};
