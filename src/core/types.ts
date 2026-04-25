import type { ElevatorStats, MineShaftStats, WarehouseStats } from "./balance.ts";
import type { ManagerSystemState } from "./managers.ts";

export type MineShaftState = "idle" | "mining" | "blocked" | "inactive";
export type ElevatorState = "idle" | "moving" | "unloading" | "returning";
export type WarehouseState = "idle" | "selling";
export type StorageId = "mineShaft" | "elevator" | "warehouse";

export interface OfflineProgressResult {
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

export interface MineShaftRuntimeState {
  shaftId: number;
  displayName: string;
  depthIndex: number;
  isUnlocked: boolean;
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

export interface GameState {
  timeSeconds: number;
  money: number;
  levels: {
    mineShaft: number; // For compatibility with single-shaft UI, usually refers to shaft 1
    elevator: number;
    warehouse: number;
    mineShafts: Record<number, number>;
  };
  resources: {
    storedOre: {
      mineShaft: number; // For compatibility with single-shaft UI, usually refers to shaft 1
      elevator: number;
      warehouse: number;
      mineShafts: Record<number, number>;
    };
    totals: {
      producedOre: number;
      collectedByElevatorOre: number;
      transportedOre: number;
      soldOre: number;
      moneyEarned: number;
    };
  };
  upgrades: {
    mineShaft: UpgradePreviewState<MineShaftStats>; // For compatibility with single-shaft UI
    elevator: UpgradePreviewState<ElevatorStats>;
    warehouse: UpgradePreviewState<WarehouseStats>;
    mineShafts: Record<number, UpgradePreviewState<MineShaftStats>>;
  };
  currentValues: {
    mineShaft: MineShaftStats; // For compatibility
    elevator: ElevatorStats;
    warehouse: WarehouseStats;
    mineShafts: Record<number, MineShaftStats>;
  };
  baseValues: {
    mineShaft: MineShaftStats; // For compatibility
    elevator: ElevatorStats;
    warehouse: WarehouseStats;
    mineShafts: Record<number, MineShaftStats>;
  };
  managers: ManagerSystemState;
  entities: {
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
  };
}
