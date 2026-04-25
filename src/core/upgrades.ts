import {
  getElevatorStats,
  getMineShaftStats,
  getWarehouseStats,
  roundForState,
  type BalanceConfig,
  type ElevatorStats,
  type MineShaftStats,
  type WarehouseStats
} from "./balance.ts";

export type UpgradeTarget = "mineShaft" | "elevator" | "warehouse";
export type UpgradeStats = MineShaftStats | ElevatorStats | WarehouseStats;
export type UpgradeBuyMode = 1 | 10 | 100 | "max";
export type UpgradePurchaseFailureReason = "insufficientFunds";

export interface UpgradePreview {
  target: UpgradeTarget;
  currentLevel: number;
  targetLevel: number;
  requestedLevels: UpgradeBuyMode;
  levelsToBuy: number;
  cost: number;
  firstLevelCost: number;
  affordable: boolean;
  maxed: boolean;
  currentStats: UpgradeStats;
  previewStats: UpgradeStats;
}

export type UpgradePurchaseResult =
  | {
    purchased: true;
    target: UpgradeTarget;
    levelsPurchased: number;
    cost: number;
    previousMoney: number;
    currentMoney: number;
    previousLevel: number;
    currentLevel: number;
    previousStats: UpgradeStats;
    currentStats: UpgradeStats;
  }
  | {
    purchased: false;
    target: UpgradeTarget;
    reason: UpgradePurchaseFailureReason | "maxLevelReached";
    requiredMoney: number;
    currentMoney: number;
    missingMoney: number;
  };

export function getUpgradePreview(
  balance: BalanceConfig,
  target: UpgradeTarget,
  currentMoney: number,
  currentLevel: number,
  buyMode: UpgradeBuyMode = 1,
  costMultiplier = 1,
  shaftId = 1
): UpgradePreview {
  const maxLevel = getMaxLevelForTarget(balance, target);
  const safeCostMultiplier = normalizeUpgradeCostMultiplier(costMultiplier);
  const safeLevel = normalizeUpgradeLevel(currentLevel);
  const currentStats = getStatsForTarget(balance, target, safeLevel, shaftId);
  const firstLevelCost = roundUpgradeCost(currentStats.upgradeCost * safeCostMultiplier);

  const isMaxed = safeLevel >= maxLevel;

  let levelsToBuy = 0;
  let totalCost = 0;

  if (isMaxed) {
    levelsToBuy = 0;
    totalCost = 0;
  } else if (typeof buyMode === "number") {
    // Fixed amount mode (1x, 10x, 100x): Always calculate the cost for the requested number of levels, capped by maxLevel
    levelsToBuy = Math.min(buyMode, maxLevel - safeLevel);
    for (let i = 0; i < levelsToBuy; i++) {
      const stepStats = getStatsForTarget(balance, target, safeLevel + i, shaftId);
      const stepCost = roundUpgradeCost(stepStats.upgradeCost * safeCostMultiplier);
      totalCost = roundForState(totalCost + stepCost);
    }
  } else {
    // "Max" mode: Find how many the player can actually afford, capped by maxLevel
    const purchaseLimit = Math.min(resolvePurchaseLimit(buyMode), maxLevel - safeLevel);
    let moneyLeft = roundForState(Math.max(currentMoney, 0));

    while (levelsToBuy < purchaseLimit) {
      const stepStats = getStatsForTarget(balance, target, safeLevel + levelsToBuy, shaftId);
      const stepCost = roundUpgradeCost(stepStats.upgradeCost * safeCostMultiplier);

      if (moneyLeft + Number.EPSILON < stepCost) {
        break;
      }

      moneyLeft = roundForState(moneyLeft - stepCost);
      totalCost = roundForState(totalCost + stepCost);
      levelsToBuy += 1;
    }

    // Default to 1 level preview if nothing can be afforded in "max" mode (unless maxed)
    if (levelsToBuy === 0 && !isMaxed) {
      levelsToBuy = 1;
      totalCost = firstLevelCost;
    }
  }

  const affordable = !isMaxed && currentMoney + Number.EPSILON >= totalCost && (typeof buyMode !== "number" || levelsToBuy === buyMode);
  const targetLevel = safeLevel + levelsToBuy;
  const previewStats = getStatsForTarget(balance, target, targetLevel, shaftId);

  return {
    target,
    currentLevel: safeLevel,
    targetLevel,
    requestedLevels: buyMode,
    levelsToBuy,
    cost: totalCost,
    firstLevelCost,
    affordable,
    maxed: isMaxed,
    currentStats,
    previewStats
  };
}

export function purchaseUpgrade(
  balance: BalanceConfig,
  target: UpgradeTarget,
  currentMoney: number,
  currentLevel: number,
  buyMode: UpgradeBuyMode = 1,
  costMultiplier = 1,
  shaftId = 1
): UpgradePurchaseResult {
  const preview = getUpgradePreview(balance, target, currentMoney, currentLevel, buyMode, costMultiplier, shaftId);

  if (preview.maxed) {
    return {
      purchased: false,
      target,
      reason: "maxLevelReached",
      requiredMoney: 0,
      currentMoney: roundForState(currentMoney),
      missingMoney: 0
    };
  }

  if (!preview.affordable) {
    return {
      purchased: false,
      target,
      reason: "insufficientFunds",
      requiredMoney: preview.cost,
      currentMoney: roundForState(currentMoney),
      missingMoney: roundForState(Math.max(preview.cost - currentMoney, 0))
    };
  }

  const nextMoney = roundForState(Math.max(0, currentMoney - preview.cost));

  return {
    purchased: true,
    target,
    levelsPurchased: preview.levelsToBuy,
    cost: preview.cost,
    previousMoney: roundForState(currentMoney),
    currentMoney: nextMoney,
    previousLevel: preview.currentLevel,
    currentLevel: preview.targetLevel,
    previousStats: preview.currentStats,
    currentStats: preview.previewStats
  };
}

function getStatsForTarget(balance: BalanceConfig, target: UpgradeTarget, level: number, shaftId = 1): UpgradeStats {
  switch (target) {
    case "mineShaft":
      return getMineShaftStats(balance, level, shaftId);
    case "elevator":
      return getElevatorStats(balance, level);
    case "warehouse":
      return getWarehouseStats(balance, level);
  }
}

function getMaxLevelForTarget(balance: BalanceConfig, target: UpgradeTarget): number {
  switch (target) {
    case "mineShaft":
      return balance.mineShaft.maxLevelPerShaft;
    case "elevator":
      return balance.elevator.maxLevel;
    case "warehouse":
      return balance.warehouse.maxLevel;
  }
}

function normalizeUpgradeLevel(level: number): number {
  if (!Number.isFinite(level)) {
    throw new Error("Upgrade level must be a finite number.");
  }

  return Math.max(1, Math.floor(level));
}

function resolvePurchaseLimit(buyMode: UpgradeBuyMode): number {
  switch (buyMode) {
    case 1:
    case 10:
    case 100:
      return buyMode;
    case "max":
      return Number.MAX_SAFE_INTEGER;
  }
}

function normalizeUpgradeCostMultiplier(costMultiplier: number): number {
  if (!Number.isFinite(costMultiplier) || costMultiplier <= 0) {
    throw new Error("Upgrade cost multiplier must be greater than 0.");
  }

  return costMultiplier;
}

function roundUpgradeCost(value: number): number {
  return Math.ceil(Math.max(0, value));
}
