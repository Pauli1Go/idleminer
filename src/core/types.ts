import type { ElevatorStats, MineShaftStats, WarehouseStats } from "./balance.ts";
import type { ManagerSystemState } from "./managers.ts";
import type { MineId, MinePrestigeData } from "./mines.ts";

export type MineShaftState = "idle" | "mining" | "blocked" | "inactive";
export type ElevatorState = "idle" | "moving" | "unloading" | "returning";
export type WarehouseState = "idle" | "selling";
export type StorageId = "mineShaft" | "elevator" | "warehouse";

export interface OfflineProgressResult {
  mineId: MineId;
  offlineSeconds: number;
  moneyEarned: number;
  oreSold: number;
}

export interface UpgradePreviewState<Stats> {
  currentLevel: number;
  targetLevel: number;
  levelsToBuy: number;
  cost: number;
  firstLevelCost: number;
  canAfford: boolean;
  isMaxed: boolean;
  previewStats: Stats;
}

export interface BlockadeRuntimeState {
  blockadeId: string;
  afterShaftId: number;
  unlocksShaftId: number;
  isRemoved: boolean;
  removalCost: number;
  removalDurationSeconds: number;
  remainingRemovalSeconds: number;
  isRemoving: boolean;
}

export interface MineShaftRuntimeState {
  shaftId: number;
  displayName: string;
  depthIndex: number;
  depthGroup: number;
  isUnlocked: boolean;
  isReachable: boolean;
  unlockCost: number;
  level: number;
  productionMultiplier: number;
  upgradeCostMultiplier: number;
  state: MineShaftState;
  cycleProgressSeconds: number;
  storedOre: number;
  capacity: number;
  productionRate: number;
  productionCycleTime: number;
  assignedManagerId: string | null;
  activeManagerAbilityState: {
    isActive: boolean;
    abilityType: string | null;
    remainingActiveTime: number;
    remainingCooldownTime: number;
  } | null;
}

export interface ResourceTotalsState {
  producedOre: number;
  collectedByElevatorOre: number;
  transportedOre: number;
  soldOre: number;
  moneyEarned: number;
}

export interface GameLevelsState {
  mineShaft: number; // For compatibility with single-shaft UI, usually refers to shaft 1
  elevator: number;
  warehouse: number;
  mineShafts: Record<number, number>;
}

export interface GameResourcesState {
  storedOre: {
    mineShaft: number; // For compatibility with single-shaft UI, usually refers to shaft 1
    elevator: number;
    warehouse: number;
    mineShafts: Record<number, number>;
  };
  totals: ResourceTotalsState;
}

export interface GameUpgradesState {
  mineShaft: UpgradePreviewState<MineShaftStats>; // For compatibility with single-shaft UI
  elevator: UpgradePreviewState<ElevatorStats>;
  warehouse: UpgradePreviewState<WarehouseStats>;
  mineShafts: Record<number, UpgradePreviewState<MineShaftStats>>;
}

export interface GameCurrentValuesState {
  mineShaft: MineShaftStats; // For compatibility
  elevator: ElevatorStats;
  warehouse: WarehouseStats;
  mineShafts: Record<number, MineShaftStats>;
}

export interface GameEntitiesState {
  mineShaft: MineShaftRuntimeState; // For compatibility
  elevator: {
    state: ElevatorState;
    carriedOre: number;
    capacity: number;
    remainingTripSeconds: number;
  };
  warehouse: {
    state: WarehouseState;
    sellProgressSeconds: number;
    storedOre: number;
    capacity: number;
  };
  mineShafts: Record<number, MineShaftRuntimeState>;
}

export interface MineStateSnapshot {
  mineId: MineId;
  displayName: string;
  isUnlocked: boolean;
  unlockCost: number;
  prestigeLevel: number;
  prestigeData: MinePrestigeData[];
  currentPrestigeMultiplier: number;
  mineMultiplier: number;
  pendingOfflineCash: number;
  pendingOfflineSeconds: number;
  pendingOfflineOreSold: number;
  levels: GameLevelsState;
  resources: GameResourcesState;
  currentValues: GameCurrentValuesState;
  baseValues: GameCurrentValuesState;
  managers: ManagerSystemState;
  blockades: Record<string, BlockadeRuntimeState>;
  entities: GameEntitiesState;
  lastActiveTime: number | null;
}

export interface GameState {
  activeMineId: MineId;
  cash: number;
  mines: Record<MineId, MineStateSnapshot>;
  timeSeconds: number;
  money: number;
  levels: GameLevelsState;
  resources: GameResourcesState;
  upgrades: GameUpgradesState;
  currentValues: GameCurrentValuesState;
  baseValues: GameCurrentValuesState;
  managers: ManagerSystemState;
  blockades: Record<string, BlockadeRuntimeState>;
  entities: GameEntitiesState;
}
