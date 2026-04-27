import { roundForState, type BalanceConfig, type ManagerAbilityType, type ManagerArea, type ManagerRank } from "./balance.ts";

export interface ManagerState {
  id: string;
  displayName: string;
  area: ManagerArea;
  rank: ManagerRank;
  abilityType: ManagerAbilityType;
  abilityMultiplier: number;
  costReductionMultiplier: number;
  activeDurationSeconds: number;
  cooldownSeconds: number;
  hireCost: number;
  isOwned: boolean;
  isAssigned: boolean;
  assignedShaftId: number | null;
  isActive: boolean;
  remainingActiveTime: number;
  remainingCooldownTime: number;
}

export interface ManagerSystemState {
  systemLocked: boolean;
  unlockLevel: number;
  hireCountsByArea: Record<ManagerArea, number>;
  ownedManagers: ManagerState[];
  assignedManagerIdsByArea: Record<ManagerArea, string | null>;
  assignedManagerIdsByShaft: Record<number, string | null>;
  automationEnabledByArea: Record<ManagerArea, boolean>;
  automationEnabledByShaft: Record<number, boolean>;
}

export interface ManagerPurchaseRequest {
  area: ManagerArea;
}

export const managerAreas: readonly ManagerArea[] = ["mineShaft", "elevator", "warehouse"] as const;
export const managerRanks: readonly ManagerRank[] = ["junior", "senior", "executive"] as const;

export function isManagerArea(value: unknown): value is ManagerArea {
  return managerAreas.includes(value as ManagerArea);
}

export function isManagerRank(value: unknown): value is ManagerRank {
  return managerRanks.includes(value as ManagerRank);
}

export function isManagerSystemLocked(balance: BalanceConfig, firstMineShaftLevel: number): boolean {
  return firstMineShaftLevel < balance.managerSystemUnlock.firstMineShaftLevel;
}

export function getManagerHireCost(
  balance: BalanceConfig,
  area: ManagerArea,
  hiredCountForArea: number
): number {
  const baseCost = balance.managerPricing.baseCostByArea[area];
  const hireCountMultiplier = balance.managerPricing.hireCountMultiplierByArea;

  return Math.ceil(baseCost * Math.pow(hireCountMultiplier, Math.max(0, hiredCountForArea)));
}

export function isAbilityTypeValidForArea(area: ManagerArea, abilityType: ManagerAbilityType): boolean {
  return getValidAbilityTypesForArea(area).includes(abilityType);
}

export function getValidAbilityTypesForArea(area: ManagerArea): readonly ManagerAbilityType[] {
  switch (area) {
    case "mineShaft":
      return ["miningSpeedBoost", "walkingSpeedBoost", "upgradeCostReduction"] as const;
    case "elevator":
      return ["loadingSpeedBoost", "movementSpeedBoost", "loadExpansion", "upgradeCostReduction"] as const;
    case "warehouse":
      return ["loadingSpeedBoost", "walkingSpeedBoost", "loadExpansion", "upgradeCostReduction"] as const;
  }
}

export function drawManagerRank(balance: BalanceConfig): ManagerRank {
  const roll = Math.random();
  let cumulative = 0;
  for (const rank of managerRanks) {
    cumulative += balance.normalManagerDrawChances[rank];
    if (roll < cumulative) {
      return rank;
    }
  }
  return "junior"; // fallback
}

export function drawManagerAbility(area: ManagerArea): ManagerAbilityType {
  const validAbilities = getValidAbilityTypesForArea(area);
  return validAbilities[Math.floor(Math.random() * validAbilities.length)];
}

export function createPurchasedManager(
  balance: BalanceConfig,
  request: ManagerPurchaseRequest,
  hiredCountForArea: number
): ManagerState {
  const rank = drawManagerRank(balance);
  const abilityType = drawManagerAbility(request.area);
  
  const rankConfig = balance.normalManagerRanks[rank];
  const effectConfig = balance.normalManagerEffects[request.area] as any;
  const abilityMultiplier = effectConfig[abilityType]?.[rank] || 1;
  const costReductionMultiplier = abilityType === "upgradeCostReduction" ? effectConfig["upgradeCostReduction"]?.[rank] || 1 : 1;

  const purchaseNumber = hiredCountForArea + 1;

  return {
    id: buildManagerId(request.area, purchaseNumber, rank, abilityType),
    displayName: buildManagerDisplayName(request.area, purchaseNumber, rank, abilityType),
    area: request.area,
    rank: rank,
    abilityType: abilityType,
    abilityMultiplier: roundForState(abilityMultiplier),
    costReductionMultiplier: roundForState(costReductionMultiplier),
    activeDurationSeconds: roundForState(rankConfig.activeDurationSeconds),
    cooldownSeconds: roundForState(rankConfig.cooldownSeconds),
    hireCost: getManagerHireCost(balance, request.area, hiredCountForArea),
    isOwned: true,
    isAssigned: false,
    assignedShaftId: null,
    isActive: false,
    remainingActiveTime: 0,
    remainingCooldownTime: 0
  };
}

export function normalizeManagerState(manager: ManagerState): ManagerState {
  return {
    ...manager,
    abilityMultiplier: roundForState(manager.abilityMultiplier),
    costReductionMultiplier: roundForState(manager.costReductionMultiplier),
    activeDurationSeconds: roundForState(manager.activeDurationSeconds),
    cooldownSeconds: roundForState(manager.cooldownSeconds),
    hireCost: roundForState(manager.hireCost),
    remainingActiveTime: roundForState(manager.remainingActiveTime),
    remainingCooldownTime: roundForState(manager.remainingCooldownTime)
  };
}

export function populateManagerBalanceValues(
  manager: ManagerState,
  balance: BalanceConfig,
  hiredCountBeforeThis: number
): ManagerState {
  const rankConfig = balance.normalManagerRanks[manager.rank];
  const effectConfig = balance.normalManagerEffects[manager.area] as any;
  const abilityMultiplier = effectConfig[manager.abilityType]?.[manager.rank] || 1;
  const costReductionMultiplier = manager.abilityType === "upgradeCostReduction" 
    ? effectConfig["upgradeCostReduction"]?.[manager.rank] || 1 
    : 1;

  return {
    ...manager,
    abilityMultiplier: roundForState(abilityMultiplier),
    costReductionMultiplier: roundForState(costReductionMultiplier),
    activeDurationSeconds: roundForState(rankConfig.activeDurationSeconds),
    cooldownSeconds: roundForState(rankConfig.cooldownSeconds),
    hireCost: getManagerHireCost(balance, manager.area, hiredCountBeforeThis)
  };
}

export function getEmptyManagerSystemState(balance: BalanceConfig, firstMineShaftLevel: number): ManagerSystemState {
  return {
    systemLocked: isManagerSystemLocked(balance, firstMineShaftLevel),
    unlockLevel: balance.managerSystemUnlock.firstMineShaftLevel,
    hireCountsByArea: {
      mineShaft: 0,
      elevator: 0,
      warehouse: 0
    },
    ownedManagers: [],
    assignedManagerIdsByArea: {
      mineShaft: null,
      elevator: null,
      warehouse: null
    },
    assignedManagerIdsByShaft: {},
    automationEnabledByArea: {
      mineShaft: false,
      elevator: false,
      warehouse: false
    },
    automationEnabledByShaft: {}
  };
}

export function countManagersByArea(managers: readonly ManagerState[]): Record<ManagerArea, number> {
  return managerAreas.reduce(
    (counts, area) => {
      counts[area] = managers.filter((manager) => manager.area === area && manager.isOwned).length;
      return counts;
    },
    { mineShaft: 0, elevator: 0, warehouse: 0 } as Record<ManagerArea, number>
  );
}

export function getAssignedManagerIdForArea(
  managers: readonly ManagerState[],
  area: ManagerArea
): string | null {
  return managers.find((manager) => manager.area === area && manager.isOwned && manager.isAssigned)?.id ?? null;
}

export function getAutomationEnabledByArea(managers: readonly ManagerState[]): Record<ManagerArea, boolean> {
  return managerAreas.reduce(
    (result, area) => {
      result[area] = managers.some((manager) => manager.area === area && manager.isOwned && manager.isAssigned);
      return result;
    },
    { mineShaft: false, elevator: false, warehouse: false } as Record<ManagerArea, boolean>
  );
}

function buildManagerId(
  area: ManagerArea,
  purchaseNumber: number,
  rank: ManagerRank,
  abilityType: ManagerAbilityType
): string {
  return `${area}-${purchaseNumber}-${rank}-${abilityType}`;
}

function buildManagerDisplayName(
  area: ManagerArea,
  purchaseNumber: number,
  rank: ManagerRank,
  abilityType: ManagerAbilityType
): string {
  return `${capitalize(area)} ${capitalize(rank)} ${formatAbilityType(abilityType)} #${purchaseNumber}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatAbilityType(abilityType: ManagerAbilityType): string {
  return abilityType
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(" ")
    .map((part) => capitalize(part))
    .join(" ");
}
