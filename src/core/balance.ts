export type ManagerArea = "mineShaft" | "elevator" | "warehouse";
export type ManagerRank = "junior" | "senior" | "executive";
export type ManagerAbilityType =
  | "walkingSpeedBoost"
  | "upgradeCostReduction"
  | "miningSpeedBoost"
  | "movementSpeedBoost"
  | "loadingSpeedBoost"
  | "loadExpansion";

export interface BalanceConfig {
  economy: {
    currencyName: string;
    startingMoney: number;
    sellPricePerOre: number;
  };
  startingStorage: {
    startingMineShaftStoredOre: number;
    startingElevatorStoredOre: number;
    startingWarehouseStoredOre: number;
  };
  productionTimesSeconds: {
    minerMiningCycleTime: number;
    elevatorRoundTripTime: number;
    warehouseSellCycleTime: number;
    notes?: string;
  };
  mineShaft: {
    totalMineShafts: number;
    startingLevel: number;
    maxLevelPerShaft: number;
    oreBufferCapacity: number;
    moreWorkersUnlockLevels?: number[];
    maxWorkersPerShaft?: number;
    largeBoostLevels: number[];
  };
  mineShaftUnlock: {
    baseUnlockCostShaft2: number;
    unlockCostMultiplierPerShaft: number | null;
    explicitUnlockCosts: number[];
  };
  mineShaftProduction: {
    mode?: "groupedBlockFormula" | "chain";
    shaftBlockSize?: number;
    withinBlockEffectiveMultipliers?: number[];
    productionBlockMultiplier?: number;
    firstAdditionalShaftMultiplier?: number;
    additionalShaftBaseMultiplier?: number;
    additionalShaftDecay?: number;
    decayStartsAtShaft?: number;
    effectiveShaftMultipliers?: number[];
  };
  miner: {
    startingLevel: number;
    startsActive: boolean;
    baseOreProducedPerCycle: number;
    notes?: string;
  };
  elevator: {
    startingLevel: number;
    maxLevel: number;
    maxLevelWithCoreMineShafts?: number;
    oreLoadCapacityPerTrip: number;
    notes?: string;
  };
  warehouse: {
    startingLevel: number;
    maxLevel: number;
    maxLevelWithCoreMineShafts?: number;
    oreStorageCapacity: number;
    baseOreSoldPerCycle: number;
    notes?: string;
  };
  managerSystemUnlock: {
    firstMineShaftLevel: number;
  };
  normalManagerRanks: Record<ManagerRank, {
    activeDurationSeconds: number;
    cooldownSeconds: number;
  }>;
  normalManagerEffects: {
    mineShaft: {
      walkingSpeedBoost: Record<ManagerRank, number>;
      upgradeCostReduction: Record<ManagerRank, number>;
      miningSpeedBoost: Record<ManagerRank, number>;
    };
    elevator: {
      movementSpeedBoost: Record<ManagerRank, number>;
      upgradeCostReduction: Record<ManagerRank, number>;
      loadingSpeedBoost: Record<ManagerRank, number>;
      loadExpansion: Record<ManagerRank, number>;
    };
    warehouse: {
      walkingSpeedBoost: Record<ManagerRank, number>;
      upgradeCostReduction: Record<ManagerRank, number>;
      loadingSpeedBoost: Record<ManagerRank, number>;
      loadExpansion: Record<ManagerRank, number>;
    };
  };
  managerPricing: {
    notes?: string;
    baseCostByArea: Record<ManagerArea, number>;
    hireCountMultiplierByArea: number;
  };
  upgradeCosts: {
    notes?: string;
    mineShaft: {
      baseUpgradeCostForLevel2: number;
      costGrowthMultiplierPerLevel: number;
      milestoneCostSpikeMultiplier: number;
      upgradeCostProductionScalingFactor?: number;
      fallbackUpgradeCostProductionScalingFactor?: number;
      upgradeCostShaftMultiplierMode: "formula" | "explicit" | "explicitArray" | "groupedExplicitArray";
      withinBlockUpgradeCostMultipliers?: number[];
      upgradeCostBlockMultiplier?: number;
      explicitShaftUpgradeCostMultipliers?: number[];
      explicitUpgradeCostMultipliers?: number[];
    };
    elevator: {
      baseUpgradeCostForLevel2: number;
      costGrowthMultiplierPerLevel: number;
      milestoneCostSpikeMultiplier: number;
    };
    warehouse: {
      baseUpgradeCostForLevel2: number;
      costGrowthMultiplierPerLevel: number;
      milestoneCostSpikeMultiplier: number;
    };
  };
  upgradeMultipliers: {
    notes?: string;
    mineShaft: {
      oreProducedPerCycleMultiplierPerLevel: number;
      oreBufferCapacityMultiplierPerLevel: number;
      milestoneProductionBoostMultiplier: number;
    };
    elevator: {
      oreLoadCapacityMultiplierPerLevel: number;
      roundTripTimeMultiplierPerLevel: number;
      milestoneTransportBoostMultiplier: number;
    };
    warehouse: {
      oreSoldPerCycleMultiplierPerLevel: number;
      sellCycleTimeMultiplierPerLevel: number;
      oreStorageCapacityMultiplierPerLevel: number;
      milestoneSellBoostMultiplier: number;
    };
  };
  normalManagerDrawChances: Record<ManagerRank, number> & { notes?: string };
  mineShaftBlockades?: {
    enabled: boolean;
    blockadeEveryShafts: number;
    blockades: Array<{
      afterShaft: number;
      unlocksShaft: number;
      removalDurationSeconds: number;
      removalDurationLabel: string;
      removalCost: number;
      requiresPreviousShaftUnlocked: boolean;
    }>;
  };
}

export interface MineShaftConfigEntry {
  shaftId: number;
  displayName: string;
  depthIndex: number;
  depthGroup: number;
  isUnlocked: boolean;
  isReachable: boolean;
  unlockCost: number;
  productionMultiplier: number;
  upgradeCostMultiplier: number;
}

export interface MineShaftStats {
  level: number;
  orePerCycle: number;
  cycleTimeSeconds: number;
  bufferCapacity: number;
  throughputPerSecond: number;
  upgradeCost: number;
}

export interface ElevatorStats {
  level: number;
  loadCapacity: number;
  tripTimeSeconds: number;
  throughputPerSecond: number;
  upgradeCost: number;
}

export interface WarehouseStats {
  level: number;
  storageCapacity: number;
  sellCapacityPerCycle: number;
  sellCycleTimeSeconds: number;
  throughputPerSecond: number;
  upgradeCost: number;
}

export const EPSILON = 1e-9;

export function assertValidBalance(balance: BalanceConfig): void {
  // basic validation
  if (balance.productionTimesSeconds.minerMiningCycleTime <= 0) {
    throw new Error("Invalid balance value: minerMiningCycleTime must be greater than 0.");
  }

  if (balance.productionTimesSeconds.elevatorRoundTripTime <= 0) {
    throw new Error("Invalid balance value: elevatorRoundTripTime must be greater than 0.");
  }

  if (balance.productionTimesSeconds.warehouseSellCycleTime <= 0) {
    throw new Error("Invalid balance value: warehouseSellCycleTime must be greater than 0.");
  }
}

export function getMineShaftStats(balance: BalanceConfig, level: number, shaftId = 1): MineShaftStats {
  const maxLevel = balance.mineShaft.maxLevelPerShaft;
  const safeLevel = Math.min(normalizeLevel(level), maxLevel);
  let milestoneMultiplier = 1;
  for (const boostLevel of balance.mineShaft.largeBoostLevels) {
    if (safeLevel >= boostLevel) {
      milestoneMultiplier *= balance.upgradeMultipliers.mineShaft.milestoneProductionBoostMultiplier;
    }
  }

  const shaftProductionMultiplier = getMineShaftProductionMultiplier(balance, shaftId);

  const orePerCycle =
    balance.miner.baseOreProducedPerCycle *
    multiplierForLevel(balance.upgradeMultipliers.mineShaft.oreProducedPerCycleMultiplierPerLevel, safeLevel) * milestoneMultiplier * shaftProductionMultiplier;
  const bufferCapacity =
    balance.mineShaft.oreBufferCapacity *
    multiplierForLevel(balance.upgradeMultipliers.mineShaft.oreBufferCapacityMultiplierPerLevel, safeLevel) * milestoneMultiplier * shaftProductionMultiplier;
  const cycleTimeSeconds = balance.productionTimesSeconds.minerMiningCycleTime;

  return {
    level: safeLevel,
    orePerCycle: roundForState(orePerCycle),
    cycleTimeSeconds,
    bufferCapacity: roundForState(bufferCapacity),
    throughputPerSecond: roundForState(orePerCycle / cycleTimeSeconds),
    upgradeCost: getUpgradeCost(balance, "mineShaft", safeLevel, shaftId)
  };
}

export function getElevatorStats(balance: BalanceConfig, level: number): ElevatorStats {
  const maxLevel = balance.elevator.maxLevel;
  const safeLevel = Math.min(normalizeLevel(level), maxLevel);
  let milestoneMultiplier = 1;
  for (const boostLevel of balance.mineShaft.largeBoostLevels) {
    if (safeLevel >= boostLevel) {
      milestoneMultiplier *= balance.upgradeMultipliers.elevator.milestoneTransportBoostMultiplier;
    }
  }

  const loadCapacity =
    balance.elevator.oreLoadCapacityPerTrip *
    multiplierForLevel(balance.upgradeMultipliers.elevator.oreLoadCapacityMultiplierPerLevel, safeLevel) * milestoneMultiplier;
  const tripTimeSeconds =
    balance.productionTimesSeconds.elevatorRoundTripTime *
    multiplierForLevel(balance.upgradeMultipliers.elevator.roundTripTimeMultiplierPerLevel, safeLevel);

  return {
    level: safeLevel,
    loadCapacity: roundForState(loadCapacity),
    tripTimeSeconds: roundForState(tripTimeSeconds),
    throughputPerSecond: roundForState(loadCapacity / tripTimeSeconds),
    upgradeCost: getUpgradeCost(balance, "elevator", safeLevel)
  };
}

export function getWarehouseStats(balance: BalanceConfig, level: number): WarehouseStats {
  const maxLevel = balance.warehouse.maxLevel;
  const safeLevel = Math.min(normalizeLevel(level), maxLevel);
  let milestoneMultiplier = 1;
  for (const boostLevel of balance.mineShaft.largeBoostLevels) {
    if (safeLevel >= boostLevel) {
      milestoneMultiplier *= balance.upgradeMultipliers.warehouse.milestoneSellBoostMultiplier;
    }
  }

  const storageCapacity =
    balance.warehouse.oreStorageCapacity *
    multiplierForLevel(balance.upgradeMultipliers.warehouse.oreStorageCapacityMultiplierPerLevel, safeLevel) * milestoneMultiplier;
  const sellCapacityPerCycle =
    balance.warehouse.baseOreSoldPerCycle *
    multiplierForLevel(balance.upgradeMultipliers.warehouse.oreSoldPerCycleMultiplierPerLevel, safeLevel) * milestoneMultiplier;
  const sellCycleTimeSeconds =
    balance.productionTimesSeconds.warehouseSellCycleTime *
    multiplierForLevel(balance.upgradeMultipliers.warehouse.sellCycleTimeMultiplierPerLevel, safeLevel);

  return {
    level: safeLevel,
    storageCapacity: roundForState(storageCapacity),
    sellCapacityPerCycle: roundForState(sellCapacityPerCycle),
    sellCycleTimeSeconds: roundForState(sellCycleTimeSeconds),
    throughputPerSecond: roundForState(sellCapacityPerCycle / sellCycleTimeSeconds),
    upgradeCost: getUpgradeCost(balance, "warehouse", safeLevel)
  };
}

export function getElevatorSpeedMultiplier(balance: BalanceConfig, tripTimeSeconds: number): number {
  if (!Number.isFinite(tripTimeSeconds) || tripTimeSeconds <= 0) {
    throw new Error("tripTimeSeconds must be greater than 0.");
  }

  return roundForState(balance.productionTimesSeconds.elevatorRoundTripTime / tripTimeSeconds);
}

export function clampToCapacity(value: number, capacity: number): number {
  return roundForState(Math.min(Math.max(value, 0), Math.max(capacity, 0)));
}

export function roundForState(value: number): number {
  if (Math.abs(value) < EPSILON) {
    return 0;
  }

  return Number(value.toFixed(9));
}

function multiplierForLevel(multiplier: number, level: number): number {
  return Math.pow(multiplier, level - 1);
}

function normalizeLevel(level: number): number {
  if (!Number.isFinite(level)) {
    throw new Error("Level must be a finite number.");
  }

  return Math.max(1, Math.floor(level));
}

function getUpgradeCost(balance: BalanceConfig, target: "mineShaft" | "elevator" | "warehouse", currentLevel: number, shaftId = 1): number {
  const costConfig = balance.upgradeCosts[target];
  const reachedMilestones = balance.mineShaft.largeBoostLevels.filter(level => level <= currentLevel).length;

  let shaftMultiplier = 1;
  if (target === "mineShaft") {
    shaftMultiplier = getMineShaftUpgradeCostMultiplier(balance, shaftId);
  }

  const cost =
    costConfig.baseUpgradeCostForLevel2 *
    Math.pow(costConfig.costGrowthMultiplierPerLevel, currentLevel - 1) *
    Math.pow(costConfig.milestoneCostSpikeMultiplier, reachedMilestones) *
    shaftMultiplier;

  return Math.ceil(cost);
}

export function getMineShaftConfigEntries(balance: BalanceConfig): MineShaftConfigEntry[] {
  const entries: MineShaftConfigEntry[] = [];
  const totalShafts = balance.mineShaft.totalMineShafts || 1;

  for (let i = 1; i <= totalShafts; i++) {
    const shaftId = i;
    const isUnlocked = shaftId === 1;
    
    let unlockCost = 0;
    if (shaftId === 2) {
      unlockCost = balance.mineShaftUnlock.baseUnlockCostShaft2;
    } else if (shaftId > 2) {
      const explicitCost = balance.mineShaftUnlock.explicitUnlockCosts?.[shaftId - 2];
      if (explicitCost !== undefined) {
        unlockCost = explicitCost;
      } else {
        const multiplier = balance.mineShaftUnlock.unlockCostMultiplierPerShaft ?? 1;
        unlockCost = balance.mineShaftUnlock.baseUnlockCostShaft2 * Math.pow(multiplier, shaftId - 2);
      }
    }

    const depthGroup = Math.floor((shaftId - 1) / 5) + 1;
    const isReachable = depthGroup === 1;

    entries.push({
      shaftId,
      displayName: `Shaft ${shaftId}`,
      depthIndex: shaftId - 1,
      depthGroup,
      isUnlocked,
      isReachable,
      unlockCost,
      productionMultiplier: getMineShaftProductionMultiplier(balance, shaftId),
      upgradeCostMultiplier: getMineShaftUpgradeCostMultiplier(balance, shaftId)
    });
  }

  return entries;
}

export function getMineShaftProductionMultiplier(balance: BalanceConfig, shaftId: number): number {
  return getShaftProductionMultiplier(balance, shaftId - 1);
}

export function getMineShaftUpgradeCostMultiplier(balance: BalanceConfig, shaftId: number): number {
  if (shaftId <= 1) return 1;

  const costConfig = balance.upgradeCosts.mineShaft;
  const explicitMultipliers =
    costConfig.explicitShaftUpgradeCostMultipliers ?? costConfig.explicitUpgradeCostMultipliers;

  if (explicitMultipliers && (costConfig.upgradeCostShaftMultiplierMode === "explicit" || costConfig.upgradeCostShaftMultiplierMode === "explicitArray" || costConfig.upgradeCostShaftMultiplierMode === "groupedExplicitArray")) {
    return roundForState(explicitMultipliers[shaftId - 1] ?? 1);
  }

  const productionMultiplier = getMineShaftProductionMultiplier(balance, shaftId);
  const scalingFactor =
    costConfig.fallbackUpgradeCostProductionScalingFactor ??
    costConfig.upgradeCostProductionScalingFactor ??
    1;

  return roundForState(Math.pow(productionMultiplier, scalingFactor));
}

function getShaftProductionMultiplier(balance: BalanceConfig, shaftIndex: number): number {
  if (shaftIndex <= 0) return 1;

  const config = balance.mineShaftProduction;
  const explicitMultiplier = config.effectiveShaftMultipliers?.[shaftIndex];

  if (explicitMultiplier !== undefined) {
    return roundForState(explicitMultiplier);
  }

  if (config.mode === "groupedBlockFormula") {
    const blockSize = config.shaftBlockSize || 5;
    const withinBlockMultipliers = config.withinBlockEffectiveMultipliers || [1];
    const blockMultiplier = config.productionBlockMultiplier || 1;
    
    const block = Math.floor(shaftIndex / blockSize);
    const position = shaftIndex % blockSize;
    
    const multiplier = (withinBlockMultipliers[position] || 1) * Math.pow(blockMultiplier, block);
    return roundForState(multiplier);
  }

  if (shaftIndex === 1) {
    return roundForState(config.firstAdditionalShaftMultiplier || 1);
  }

  const previousMultiplier = getShaftProductionMultiplier(balance, shaftIndex - 1);
  const decayExponent = Math.max(0, shaftIndex + 1 - (config.decayStartsAtShaft || 1));
  const decayFactor = Math.pow(config.additionalShaftDecay || 1, decayExponent);

  return roundForState(previousMultiplier * (config.additionalShaftBaseMultiplier || 1) * decayFactor);
}
