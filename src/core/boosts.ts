export type BoostPurchaseTier = "cheap" | "expensive";

export interface BoostDefinition {
  id: string;
  multiplier: number;
  durationSeconds: number;
  weight: number;
}

export interface BoostShopTierConfig {
  cost: number;
  drawTable: BoostDefinition[];
}

export interface BoostBalanceConfig {
  dailyFreeCheapBoostReset: "localCalendarDay";
  purchases: Record<BoostPurchaseTier, BoostShopTierConfig>;
}

export interface IncomeBoostRuntimeState {
  instanceId: string;
  definitionId: string;
  purchaseTier: BoostPurchaseTier;
  multiplier: number;
  durationSeconds: number;
  remainingSeconds: number;
  purchasedAt: number;
  activatedAt: number | null;
  source: "freeSpin" | "superCash";
}

export interface BoostShopTierState {
  tier: BoostPurchaseTier;
  cost: number;
  canAfford: boolean;
  canUseFreeSpin: boolean;
  drawOdds: Array<BoostDefinition & { chance: number }>;
}

export interface BoostSystemState {
  incomeMultiplier: number;
  activeBoost: IncomeBoostRuntimeState | null;
  queuedBoosts: IncomeBoostRuntimeState[];
  dailyFreeCheapBoost: {
    isAvailable: boolean;
    lastClaimedAt: number | null;
    nextAvailableAt: number;
  };
  shop: Record<BoostPurchaseTier, BoostShopTierState>;
}

export interface SaveGameBoostState {
  incomeBoosts: IncomeBoostRuntimeState[];
  queuedIncomeBoosts: IncomeBoostRuntimeState[];
  lastFreeCheapBoostSpinAt: number | null;
}

export const DEFAULT_BOOST_BALANCE: BoostBalanceConfig = {
  dailyFreeCheapBoostReset: "localCalendarDay",
  purchases: {
    cheap: {
      cost: 500,
      drawTable: [
        { id: "cheap_2x_30m", multiplier: 2, durationSeconds: 30 * 60, weight: 30 },
        { id: "cheap_2x_1h", multiplier: 2, durationSeconds: 60 * 60, weight: 24 },
        { id: "cheap_3x_30m", multiplier: 3, durationSeconds: 30 * 60, weight: 16 },
        { id: "cheap_3x_1h", multiplier: 3, durationSeconds: 60 * 60, weight: 12 },
        { id: "cheap_4x_30m", multiplier: 4, durationSeconds: 30 * 60, weight: 8 },
        { id: "cheap_5x_30m", multiplier: 5, durationSeconds: 30 * 60, weight: 5 },
        { id: "cheap_8x_15m", multiplier: 8, durationSeconds: 15 * 60, weight: 3 },
        { id: "cheap_10x_10m", multiplier: 10, durationSeconds: 10 * 60, weight: 1.5 },
        { id: "cheap_20x_5m", multiplier: 20, durationSeconds: 5 * 60, weight: 0.5 }
      ]
    },
    expensive: {
      cost: 5000,
      drawTable: [
        { id: "expensive_5x_1h", multiplier: 5, durationSeconds: 60 * 60, weight: 24 },
        { id: "expensive_10x_45m", multiplier: 10, durationSeconds: 45 * 60, weight: 20 },
        { id: "expensive_20x_30m", multiplier: 20, durationSeconds: 30 * 60, weight: 16 },
        { id: "expensive_50x_20m", multiplier: 50, durationSeconds: 20 * 60, weight: 12 },
        { id: "expensive_100x_15m", multiplier: 100, durationSeconds: 15 * 60, weight: 9 },
        { id: "expensive_250x_10m", multiplier: 250, durationSeconds: 10 * 60, weight: 7 },
        { id: "expensive_500x_10m", multiplier: 500, durationSeconds: 10 * 60, weight: 5 },
        { id: "expensive_1000x_8m", multiplier: 1000, durationSeconds: 8 * 60, weight: 3 },
        { id: "expensive_2000x_5m", multiplier: 2000, durationSeconds: 5 * 60, weight: 2 },
        { id: "expensive_3000x_5m", multiplier: 3000, durationSeconds: 5 * 60, weight: 1.5 },
        { id: "expensive_5000x_5m", multiplier: 5000, durationSeconds: 5 * 60, weight: 0.5 }
      ]
    }
  }
};

export function getBoostBalanceConfig(balance: { boosts?: BoostBalanceConfig }): BoostBalanceConfig {
  return balance.boosts ?? DEFAULT_BOOST_BALANCE;
}

export function assertValidBoostBalance(boosts: BoostBalanceConfig): void {
  if (boosts.dailyFreeCheapBoostReset !== "localCalendarDay") {
    throw new Error("Invalid boost balance value: dailyFreeCheapBoostReset must be localCalendarDay.");
  }

  for (const tier of ["cheap", "expensive"] as const) {
    const config = boosts.purchases[tier];

    if (!Number.isFinite(config.cost) || config.cost < 0) {
      throw new Error(`Invalid boost balance value: ${tier}.cost must be non-negative.`);
    }

    if (!Array.isArray(config.drawTable) || config.drawTable.length === 0) {
      throw new Error(`Invalid boost balance value: ${tier}.drawTable must not be empty.`);
    }

    let totalWeight = 0;
    for (const entry of config.drawTable) {
      if (entry.id.length === 0) {
        throw new Error(`Invalid boost balance value: ${tier}.drawTable contains an empty id.`);
      }

      if (!Number.isFinite(entry.multiplier) || entry.multiplier < 2) {
        throw new Error(`Invalid boost balance value: ${entry.id}.multiplier must be at least 2.`);
      }

      if (!Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0) {
        throw new Error(`Invalid boost balance value: ${entry.id}.durationSeconds must be greater than 0.`);
      }

      if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
        throw new Error(`Invalid boost balance value: ${entry.id}.weight must be greater than 0.`);
      }

      totalWeight += entry.weight;
    }

    if (totalWeight <= 0) {
      throw new Error(`Invalid boost balance value: ${tier}.drawTable total weight must be greater than 0.`);
    }
  }
}

export function drawBoostDefinition(drawTable: readonly BoostDefinition[], randomValue: number): BoostDefinition {
  if (drawTable.length === 0) {
    throw new Error("drawTable must not be empty.");
  }

  const totalWeight = drawTable.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);

  if (totalWeight <= 0) {
    throw new Error("drawTable total weight must be greater than 0.");
  }

  const safeRandomValue = Number.isFinite(randomValue) ? Math.min(Math.max(randomValue, 0), 1 - Number.EPSILON) : 0;
  const roll = safeRandomValue * totalWeight;
  let cursor = 0;

  for (const entry of drawTable) {
    cursor += Math.max(0, entry.weight);

    if (roll < cursor) {
      return entry;
    }
  }

  return drawTable[drawTable.length - 1];
}

export function getBoostDrawOdds(drawTable: readonly BoostDefinition[]): Array<BoostDefinition & { chance: number }> {
  const totalWeight = drawTable.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);

  if (totalWeight <= 0) {
    return [];
  }

  return drawTable.map((entry) => ({
    ...entry,
    chance: entry.weight / totalWeight
  }));
}

export function createEmptyBoostSaveState(): SaveGameBoostState {
  return {
    incomeBoosts: [],
    queuedIncomeBoosts: [],
    lastFreeCheapBoostSpinAt: null
  };
}

export function isSameLocalCalendarDay(leftTimestamp: number, rightTimestamp: number): boolean {
  const left = new Date(leftTimestamp);
  const right = new Date(rightTimestamp);

  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function getNextLocalCalendarDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}
