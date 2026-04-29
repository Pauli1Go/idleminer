import {
  EPSILON,
  assertValidBalance,
  getElevatorStats,
  getMineShaftConfigEntries,
  getMineShaftProductionMultiplier,
  getMineShaftStats,
  getWarehouseStats,
  roundForState
} from "./balance.ts";
import type {
  BalanceConfig,
  ElevatorStats,
  ManagerArea,
  MineShaftConfigEntry,
  MineShaftStats,
  WarehouseStats
} from "./balance.ts";
import { Elevator } from "./entities/Elevator.ts";
import { MineShaft } from "./entities/MineShaft.ts";
import { Warehouse } from "./entities/Warehouse.ts";
import {
  DEFAULT_ACTIVE_MINE_ID,
  MINE_DEFINITIONS,
  getMineDefinition,
  getMinePrestigeData,
  getNextMinePrestigeData,
  type MineDefinition,
  type MineId,
  type MinePrestigeData
} from "./mines.ts";
import {
  countManagersByArea,
  createPurchasedManager,
  getAutomationEnabledByArea,
  getManagerHireCost,
  isManagerArea,
  isManagerSystemLocked,
  managerAreas,
  normalizeManagerState,
  populateManagerBalanceValues,
  type ManagerState
} from "./managers.ts";
import { SimulationSignalBus } from "./events.ts";
import { SAVEGAME_VERSION, normalizeSaveGameRecord } from "./savegame.ts";
import type { SaveGameMineStateV7, SaveGameRecord, SaveGameRecordCompatible } from "./savegame.ts";
import type {
  SimulationActionFailureReason,
  SimulationCommandName,
  SimulationCommandRejectionReason,
  SimulationEvent,
  SimulationEventHandler,
  SimulationEventInput,
  SimulationEventType
} from "./events.ts";
import type {
  BlockadeRuntimeState,
  GameState,
  MineShaftRuntimeState,
  OfflineProgressResult,
  ResourceTotalsState
} from "./types.ts";
import {
  getUpgradePreview,
  purchaseUpgrade as purchaseSimulationUpgrade,
  type UpgradeBuyMode,
  type UpgradeTarget
} from "./upgrades.ts";

export interface MineSimulationOptions {
  fixedStepSeconds?: number;
  isDebug?: boolean;
}

interface MineRuntime {
  mineId: MineId;
  displayName: string;
  isUnlocked: boolean;
  unlockCost: number;
  prestigeLevel: number;
  currentPrestigeMultiplier: number;
  mineMultiplier: number;
  lastActiveTime: number | null;
  pendingOfflineCash: number;
  pendingOfflineSeconds: number;
  pendingOfflineOreSold: number;
  mineShafts: MineShaft[];
  elevator: Elevator;
  warehouse: Warehouse;
  ownedManagers: ManagerState[];
  blockades: Record<string, BlockadeRuntimeState>;
  baseMineShaftStatsByShaftId: Record<number, MineShaftStats>;
  baseElevatorStats: ElevatorStats;
  baseWarehouseStats: WarehouseStats;
  totals: ResourceTotalsState;
}

const SUPER_CASH_LEVEL_MILESTONE = 100;
const SUPER_CASH_REWARD_PER_LEVEL_MILESTONE = 100;
export const DEPTH_BLOCKADE_SKIP_INTERVAL_SECONDS = 30 * 60;
export const DEPTH_BLOCKADE_SKIP_SUPER_CASH_PER_INTERVAL = 100;
const DEBUG_SUPER_CASH = 10000;
const SUPER_CASH_REWARD_BY_PRESTIGE_LEVEL: Record<number, number> = {
  1: 100,
  2: 200,
  3: 300,
  4: 500,
  5: 1000,
  6: 2000
};

export function getDepthBlockadeSkipCost(remainingRemovalSeconds: number): number {
  if (!Number.isFinite(remainingRemovalSeconds) || remainingRemovalSeconds <= EPSILON) {
    return 0;
  }

  return Math.ceil(remainingRemovalSeconds / DEPTH_BLOCKADE_SKIP_INTERVAL_SECONDS) * DEPTH_BLOCKADE_SKIP_SUPER_CASH_PER_INTERVAL;
}

export class MineSimulation {
  readonly balance: BalanceConfig;
  readonly fixedStepSeconds: number;
  private readonly isDebug: boolean;
  private readonly mineDefinitions = MINE_DEFINITIONS;
  private readonly minesById: Record<MineId, MineRuntime> = {};

  private readonly signals = new SimulationSignalBus();
  private accumulatorSeconds = 0;
  private eventSequence = 0;
  private timeSeconds = 0;
  private money: number;
  private superCash: number;
  private activeMineId: MineId = DEFAULT_ACTIVE_MINE_ID;

  get mineShafts(): MineShaft[] {
    return this.getActiveMine().mineShafts;
  }

  get mineShaft(): MineShaft {
    return this.mineShafts[0];
  }

  get elevator(): Elevator {
    return this.getActiveMine().elevator;
  }

  get warehouse(): Warehouse {
    return this.getActiveMine().warehouse;
  }

  private get ownedManagers(): ManagerState[] {
    return this.getActiveMine().ownedManagers;
  }

  private set ownedManagers(value: ManagerState[]) {
    this.getActiveMine().ownedManagers = value;
  }

  private get blockades(): Record<string, BlockadeRuntimeState> {
    return this.getActiveMine().blockades;
  }

  private set blockades(value: Record<string, BlockadeRuntimeState>) {
    this.getActiveMine().blockades = value;
  }

  private get baseMineShaftStatsByShaftId(): Record<number, MineShaftStats> {
    return this.getActiveMine().baseMineShaftStatsByShaftId;
  }

  private set baseMineShaftStatsByShaftId(value: Record<number, MineShaftStats>) {
    this.getActiveMine().baseMineShaftStatsByShaftId = value;
  }

  private get baseElevatorStats(): ElevatorStats {
    return this.getActiveMine().baseElevatorStats;
  }

  private set baseElevatorStats(value: ElevatorStats) {
    this.getActiveMine().baseElevatorStats = value;
  }

  private get baseWarehouseStats(): WarehouseStats {
    return this.getActiveMine().baseWarehouseStats;
  }

  private set baseWarehouseStats(value: WarehouseStats) {
    this.getActiveMine().baseWarehouseStats = value;
  }

  constructor(balance: BalanceConfig, options: MineSimulationOptions = {}) {
    assertValidBalance(balance);

    const fixedStepSeconds = options.fixedStepSeconds ?? 0.1;

    if (!Number.isFinite(fixedStepSeconds) || fixedStepSeconds <= 0) {
      throw new Error("fixedStepSeconds must be greater than 0.");
    }

    this.balance = balance;
    this.fixedStepSeconds = fixedStepSeconds;
    this.isDebug = options.isDebug ?? false;
    
    const startingMoney = (this.isDebug && balance.economy.startingMoneytest !== undefined)
      ? balance.economy.startingMoneytest
      : balance.economy.startingMoney;
      
    this.money = roundForState(startingMoney);
    this.superCash = this.isDebug ? DEBUG_SUPER_CASH : 0;

    for (const definition of this.mineDefinitions) {
      const isUnlocked = definition.mineId === DEFAULT_ACTIVE_MINE_ID;
      this.minesById[definition.mineId] = this.createMineRuntime(definition, isUnlocked);
    }

    this.activeMineId = this.mineDefinitions.find((definition) => definition.mineId === DEFAULT_ACTIVE_MINE_ID)?.mineId
      ?? this.mineDefinitions[0]?.mineId
      ?? DEFAULT_ACTIVE_MINE_ID;
  }

  private getActiveMine(): MineRuntime {
    const mine = this.minesById[this.activeMineId];

    if (mine === undefined) {
      throw new Error(`Active mine ${this.activeMineId} is missing.`);
    }

    return mine;
  }

  private withMineContext<Result>(mineId: MineId, callback: () => Result): Result {
    const previousMineId = this.activeMineId;
    this.activeMineId = mineId;

    try {
      return callback();
    } finally {
      this.activeMineId = previousMineId;
    }
  }

  private createMineRuntime(definition: MineDefinition, isUnlocked: boolean): MineRuntime {
    const mineShaftDefinitions = getMineShaftConfigEntries(this.balance);
    const baseMineShaftStatsByShaftId: Record<number, MineShaftStats> = {};
    const mine: MineRuntime = {
      mineId: definition.mineId,
      displayName: definition.displayName,
      isUnlocked,
      unlockCost: definition.unlockCost,
      prestigeLevel: 0,
      currentPrestigeMultiplier: getMinePrestigeData(definition.mineId, 0).multiplier,
      mineMultiplier: getMinePrestigeData(definition.mineId, 0).multiplier,
      lastActiveTime: isUnlocked ? 0 : null,
      pendingOfflineCash: 0,
      pendingOfflineSeconds: 0,
      pendingOfflineOreSold: 0,
      mineShafts: [],
      elevator: new Elevator(getElevatorStats(this.balance, this.balance.elevator.startingLevel), this.balance.startingStorage.startingElevatorStoredOre),
      warehouse: new Warehouse(getWarehouseStats(this.balance, this.balance.warehouse.startingLevel), this.balance.startingStorage.startingWarehouseStoredOre),
      ownedManagers: [],
      blockades: {},
      baseMineShaftStatsByShaftId,
      baseElevatorStats: getElevatorStats(this.balance, this.balance.elevator.startingLevel),
      baseWarehouseStats: getWarehouseStats(this.balance, this.balance.warehouse.startingLevel),
      totals: this.createEmptyTotals()
    };

    this.minesById[definition.mineId] = mine;
    this.withMineContext(mine.mineId, () => {
      mine.baseElevatorStats = this.createElevatorStats(this.balance.elevator.startingLevel);
      mine.baseWarehouseStats = this.createWarehouseStats(this.balance.warehouse.startingLevel);
    });
    mine.elevator = new Elevator(mine.baseElevatorStats, this.balance.startingStorage.startingElevatorStoredOre);
    mine.warehouse = new Warehouse(mine.baseWarehouseStats, this.balance.startingStorage.startingWarehouseStoredOre);
    mine.mineShafts = mineShaftDefinitions.map((entry) => this.createMineShaftEntity(entry, mine, isUnlocked));
    mine.blockades = this.createBlockades();
    return mine;
  }

  private createEmptyTotals(): ResourceTotalsState {
    return {
      producedOre: 0,
      collectedByElevatorOre: 0,
      transportedOre: 0,
      soldOre: 0,
      moneyEarned: 0
    };
  }

  private createBlockades(): Record<string, BlockadeRuntimeState> {
    const blockades: Record<string, BlockadeRuntimeState> = {};

    if (this.balance.mineShaftBlockades?.enabled) {
      for (const b of this.balance.mineShaftBlockades.blockades) {
        const id = `blockade_${b.afterShaft}_${b.unlocksShaft}`;
        blockades[id] = {
          blockadeId: id,
          afterShaftId: b.afterShaft,
          unlocksShaftId: b.unlocksShaft,
          isRemoved: false,
          removalCost: b.removalCost,
          removalDurationSeconds: b.removalDurationSeconds,
          remainingRemovalSeconds: 0,
          isRemoving: false
        };
      }
    }

    return blockades;
  }

  exportSaveGame(savedAt = Date.now()): SaveGameRecord {
    return {
      version: SAVEGAME_VERSION,
      savedAt,
      state: {
        timeSeconds: roundForState(this.timeSeconds),
        money: roundForState(this.money),
        superCash: roundForState(this.superCash),
        activeMineId: this.activeMineId,
        mines: this.mineDefinitions.map((definition) => this.exportMineSaveState(this.minesById[definition.mineId]))
      }
    };
  }

  importSaveGame(saveGame: SaveGameRecordCompatible, loadedAt: number = Date.now()): OfflineProgressResult | null {
    const record = normalizeSaveGameRecord(saveGame);

    if (record === null) {
      throw new Error(`Unsupported savegame version or invalid state: ${saveGame.version}`);
    }

    if (record.version !== SAVEGAME_VERSION) {
      throw new Error(`Unsupported savegame version: ${record.version}`);
    }

    const state = record.state;

    this.timeSeconds = roundForState(requireNonNegativeNumber(state.timeSeconds, "state.timeSeconds"));
    this.money = roundForState(requireNonNegativeNumber(state.money, "state.money"));
    this.superCash = roundForState(requireNonNegativeNumber(state.superCash, "state.superCash"));
    if (this.isDebug) {
      this.superCash = Math.max(this.superCash, DEBUG_SUPER_CASH);
    }
    this.accumulatorSeconds = 0;
    this.eventSequence = 0;

    for (const definition of this.mineDefinitions) {
      const mine = this.minesById[definition.mineId];
      const savedMine = state.mines.find((entry) => entry.mineId === definition.mineId);
      this.importMineState(mine, savedMine);
    }

    const nextActiveMineId = state.activeMineId;
    this.activeMineId =
      this.minesById[nextActiveMineId]?.isUnlocked
        ? nextActiveMineId
        : this.mineDefinitions.find((definition) => this.minesById[definition.mineId]?.isUnlocked)?.mineId
          ?? DEFAULT_ACTIVE_MINE_ID;
    this.superCash = roundForState(Math.max(this.superCash, this.getRecoveredSuperCashTotal()));

    return this.applyOfflineProgress(record.savedAt, loadedAt);
  }

  private exportMineSaveState(mine: MineRuntime): SaveGameMineStateV7 {
    const previousMineId = this.activeMineId;
    this.activeMineId = mine.mineId;
    const ownedManagers = this.getOwnedManagersSnapshot();

    const snapshot: SaveGameMineStateV7 = {
      mineId: mine.mineId,
      isUnlocked: mine.isUnlocked,
      prestigeLevel: mine.prestigeLevel,
      lastActiveTime: mine.lastActiveTime,
      pendingOfflineCash: roundForState(mine.pendingOfflineCash),
      pendingOfflineSeconds: roundForState(mine.pendingOfflineSeconds),
      pendingOfflineOreSold: roundForState(mine.pendingOfflineOreSold),
      totals: {
        producedOre: roundForState(mine.totals.producedOre),
        collectedByElevatorOre: roundForState(mine.totals.collectedByElevatorOre),
        transportedOre: roundForState(mine.totals.transportedOre),
        soldOre: roundForState(mine.totals.soldOre),
        moneyEarned: roundForState(mine.totals.moneyEarned)
      },
      elevator: {
        level: mine.elevator.stats.level,
        state: mine.elevator.state,
        carriedOre: roundForState(mine.elevator.carriedOre),
        remainingTripSeconds: roundForState(mine.elevator.remainingTripSeconds)
      },
      warehouse: {
        level: mine.warehouse.stats.level,
        state: mine.warehouse.state,
        storedOre: roundForState(mine.warehouse.storedOre),
        sellProgressSeconds: roundForState(mine.warehouse.sellProgressSeconds)
      },
      managers: {
        hireCountsByArea: countManagersByArea(ownedManagers),
        assignedManagerIdsByArea: this.getAssignedManagerIdsByArea(ownedManagers),
        assignedManagerIdsByShaft: this.getAssignedManagerIdsByShaft(ownedManagers),
        ownedManagers: ownedManagers.map((manager) => {
          const { abilityMultiplier, costReductionMultiplier, activeDurationSeconds, cooldownSeconds, hireCost, ...rest } = manager;
          return rest as any;
        })
      },
      mineShafts: mine.mineShafts.map((shaft) => ({
        shaftId: shaft.shaftId,
        isUnlocked: shaft.isUnlocked,
        level: shaft.stats.level,
        storedOre: roundForState(shaft.storedOre),
        state: shaft.state,
        cycleProgressSeconds: roundForState(shaft.cycleProgressSeconds),
        assignedManagerId: shaft.assignedManagerId,
        activeManagerAbilityState: shaft.activeManagerAbilityState
          ? {
              isActive: shaft.activeManagerAbilityState.isActive,
              abilityType: shaft.activeManagerAbilityState.abilityType,
              remainingActiveTime: roundForState(shaft.activeManagerAbilityState.remainingActiveTime),
              remainingCooldownTime: roundForState(shaft.activeManagerAbilityState.remainingCooldownTime)
            }
          : null
      })),
      blockades: Object.values(mine.blockades).map((blockade) => ({
        blockadeId: blockade.blockadeId,
        afterShaftId: blockade.afterShaftId,
        unlocksShaftId: blockade.unlocksShaftId,
        isRemoved: blockade.isRemoved,
        removalCost: blockade.removalCost,
        removalDurationSeconds: blockade.removalDurationSeconds,
        remainingRemovalSeconds: roundForState(blockade.remainingRemovalSeconds),
        isRemoving: blockade.isRemoving
      }))
    };

    this.activeMineId = previousMineId;
    return snapshot;
  }

  private importMineState(mine: MineRuntime, savedMine?: SaveGameMineStateV7): void {
    const previousMineId = this.activeMineId;
    this.activeMineId = mine.mineId;
    mine.isUnlocked = savedMine?.isUnlocked ?? mine.mineId === DEFAULT_ACTIVE_MINE_ID;
    mine.prestigeLevel = requireNonNegativeInteger(savedMine?.prestigeLevel ?? 0, `mine[${mine.mineId}].prestigeLevel`);
    mine.currentPrestigeMultiplier = getMinePrestigeData(mine.mineId, mine.prestigeLevel).multiplier;
    mine.mineMultiplier = mine.currentPrestigeMultiplier;
    mine.lastActiveTime = savedMine?.lastActiveTime ?? (mine.isUnlocked ? this.timeSeconds : null);
    mine.pendingOfflineCash = roundForState(requireNonNegativeNumber(savedMine?.pendingOfflineCash ?? 0, `mine[${mine.mineId}].pendingOfflineCash`));
    const savedPendingOfflineSeconds = requireNonNegativeNumber(savedMine?.pendingOfflineSeconds ?? 0, `mine[${mine.mineId}].pendingOfflineSeconds`);
    const savedPendingOfflineOreSold = requireNonNegativeNumber(savedMine?.pendingOfflineOreSold ?? 0, `mine[${mine.mineId}].pendingOfflineOreSold`);
    mine.pendingOfflineSeconds = roundForState(
      savedPendingOfflineSeconds > EPSILON || mine.pendingOfflineCash <= EPSILON
        ? savedPendingOfflineSeconds
        : 60
    );
    mine.pendingOfflineOreSold = roundForState(
      savedPendingOfflineOreSold > EPSILON || mine.pendingOfflineCash <= EPSILON
        ? savedPendingOfflineOreSold
        : mine.pendingOfflineCash / this.balance.economy.sellPricePerOre
    );
    mine.totals = {
      producedOre: roundForState(savedMine?.totals.producedOre ?? 0),
      collectedByElevatorOre: roundForState(savedMine?.totals.collectedByElevatorOre ?? 0),
      transportedOre: roundForState(savedMine?.totals.transportedOre ?? 0),
      soldOre: roundForState(savedMine?.totals.soldOre ?? 0),
      moneyEarned: roundForState(savedMine?.totals.moneyEarned ?? 0)
    };

    this.baseElevatorStats = this.createElevatorStats(requirePositiveInteger(savedMine?.elevator.level ?? this.balance.elevator.startingLevel, `mine[${mine.mineId}].elevator.level`));
    this.baseWarehouseStats = this.createWarehouseStats(requirePositiveInteger(savedMine?.warehouse.level ?? this.balance.warehouse.startingLevel, `mine[${mine.mineId}].warehouse.level`));

    const mineShaftsById = new Map<number, NonNullable<SaveGameMineStateV7["mineShafts"]>[number]>();

    for (const shaftState of savedMine?.mineShafts ?? []) {
      mineShaftsById.set(shaftState.shaftId, shaftState);
    }

    for (const shaft of mine.mineShafts) {
      const saved = mineShaftsById.get(shaft.shaftId);
      const fallbackLevel = this.balance.mineShaft.startingLevel;
      const level = requirePositiveInteger(saved?.level ?? fallbackLevel, `mine[${mine.mineId}].mineShafts[${shaft.shaftId}].level`);
      const shouldUnlockShaft = mine.isUnlocked && (saved?.isUnlocked ?? shaft.shaftId === 1);

      mine.baseMineShaftStatsByShaftId[shaft.shaftId] = this.createMineShaftStats(shaft.shaftId, level);

      if (shouldUnlockShaft) {
        shaft.unlock();
      } else {
        shaft.lock();
      }

      shaft.applyStats(this.getEffectiveMineShaftStats(shaft.shaftId));

      const savedStoredOre = saved?.storedOre ?? 0;
      const savedProgress = saved?.cycleProgressSeconds ?? 0;
      shaft.storedOre = shouldUnlockShaft
        ? roundForState(Math.min(requireNonNegativeNumber(savedStoredOre, `mine[${mine.mineId}].mineShafts[${shaft.shaftId}].storedOre`), shaft.stats.bufferCapacity))
        : 0;
      shaft.cycleProgressSeconds = shouldUnlockShaft
        ? roundForState(Math.min(requireNonNegativeNumber(savedProgress, `mine[${mine.mineId}].mineShafts[${shaft.shaftId}].cycleProgressSeconds`), Math.max(shaft.stats.cycleTimeSeconds - EPSILON, 0)))
        : 0;
      shaft.state = shouldUnlockShaft ? saved?.state ?? deriveShaftStateFromResources(shaft.storedOre, shaft.stats.bufferCapacity) : "inactive";
      shaft.totalProducedOre = shaft.shaftId === 1 ? mine.totals.producedOre : 0;
      shaft.assignedManagerId = saved?.assignedManagerId ?? null;
      shaft.activeManagerAbilityState = saved?.activeManagerAbilityState ?? null;
      shaft.isReachable = this.isShaftReachable(shaft.shaftId);
    }

    mine.blockades = this.createBlockades();

    for (const blockade of savedMine?.blockades ?? []) {
      const existing = mine.blockades[blockade.blockadeId];

      if (existing) {
        existing.isRemoved = blockade.isRemoved;
        existing.remainingRemovalSeconds = blockade.remainingRemovalSeconds;
        existing.isRemoving = blockade.isRemoving;
      }
    }

    this.syncReachability();
    mine.elevator.applyStats(this.getEffectiveElevatorStats());
    mine.elevator.state = requireElevatorState(savedMine?.elevator.state ?? "idle");
    mine.elevator.carriedOre = roundForState(requireNonNegativeNumber(savedMine?.elevator.carriedOre ?? 0, `mine[${mine.mineId}].elevator.carriedOre`));
    mine.elevator.remainingTripSeconds = roundForState(
      requireNonNegativeNumber(savedMine?.elevator.remainingTripSeconds ?? 0, `mine[${mine.mineId}].elevator.remainingTripSeconds`)
    );
    mine.elevator.totalCollectedOre = roundForState(mine.totals.collectedByElevatorOre);
    mine.elevator.totalTransportedOre = roundForState(mine.totals.transportedOre);

    mine.warehouse.applyStats(this.getEffectiveWarehouseStats());
    mine.warehouse.state = requireWarehouseState(savedMine?.warehouse.state ?? "idle");
    mine.warehouse.storedOre = roundForState(requireNonNegativeNumber(savedMine?.warehouse.storedOre ?? 0, `mine[${mine.mineId}].warehouse.storedOre`));
    mine.warehouse.sellProgressSeconds = roundForState(
      requireNonNegativeNumber(savedMine?.warehouse.sellProgressSeconds ?? 0, `mine[${mine.mineId}].warehouse.sellProgressSeconds`)
    );
    mine.warehouse.totalSoldOre = roundForState(mine.totals.soldOre);

    this.restoreManagersFromSave(mine, savedMine);
    this.syncAllManagerEffects();
    this.activeMineId = previousMineId;
  }

  private getMineSummary(mine: MineRuntime): {
    isUnlocked: boolean;
    prestigeLevel: number;
    mineMultiplier: number;
  } {
    return {
      isUnlocked: mine.isUnlocked,
      prestigeLevel: mine.prestigeLevel,
      mineMultiplier: mine.mineMultiplier
    };
  }

  private emitMineStatsChanged(
    mine: MineRuntime,
    previousStats: {
      isUnlocked: boolean;
      prestigeLevel: number;
      mineMultiplier: number;
    },
    events: SimulationEvent[]
  ): void {
    const currentStats = this.getMineSummary(mine);

    if (
      previousStats.isUnlocked === currentStats.isUnlocked &&
      previousStats.prestigeLevel === currentStats.prestigeLevel &&
      previousStats.mineMultiplier === currentStats.mineMultiplier
    ) {
      return;
    }

    this.emit(
      {
        type: "mineStatsChanged",
        mineId: mine.mineId,
        previousStats,
        currentStats
      } as any,
      events
    );
  }

  private emitMoneyChanged(previousMoney: number, events: SimulationEvent[]): void {
    this.emit(
      {
        type: "moneyChanged",
        previousMoney,
        currentMoney: this.money,
        delta: roundForState(this.money - previousMoney)
      },
      events
    );
  }

  private awardSuperCash(amount: number, source: "upgrade" | "prestige", events: SimulationEvent[]): void {
    if (amount <= 0) {
      return;
    }

    const previousSuperCash = this.superCash;
    this.superCash = roundForState(this.superCash + amount);
    this.emit(
      {
        type: "superCashAwarded",
        amount,
        previousSuperCash,
        currentSuperCash: this.superCash,
        source
      },
      events
    );
  }

  private spendSuperCash(amount: number, source: "depthBlockadeSkip", events: SimulationEvent[]): void {
    if (amount <= 0) {
      return;
    }

    const previousSuperCash = this.superCash;
    this.superCash = roundForState(Math.max(0, this.superCash - amount));
    this.emit(
      {
        type: "superCashSpent",
        amount,
        previousSuperCash,
        currentSuperCash: this.superCash,
        source
      },
      events
    );
  }

  private getSuperCashForLevelMilestones(previousLevel: number, currentLevel: number): number {
    const previousMilestones = Math.floor(Math.max(0, previousLevel) / SUPER_CASH_LEVEL_MILESTONE);
    const currentMilestones = Math.floor(Math.max(0, currentLevel) / SUPER_CASH_LEVEL_MILESTONE);

    return Math.max(0, currentMilestones - previousMilestones) * SUPER_CASH_REWARD_PER_LEVEL_MILESTONE;
  }

  private getTotalSuperCashForLevel(level: number): number {
    return Math.floor(Math.max(0, level) / SUPER_CASH_LEVEL_MILESTONE) * SUPER_CASH_REWARD_PER_LEVEL_MILESTONE;
  }

  private getSuperCashForPrestigeLevel(prestigeLevel: number): number {
    return SUPER_CASH_REWARD_BY_PRESTIGE_LEVEL[prestigeLevel] ?? 0;
  }

  private getRecoveredSuperCashTotal(): number {
    let recoveredSuperCash = 0;

    for (const mine of Object.values(this.minesById)) {
      recoveredSuperCash += this.getTotalSuperCashForLevel(mine.elevator.stats.level);

      for (const shaft of mine.mineShafts) {
        recoveredSuperCash += this.getTotalSuperCashForLevel(shaft.stats.level);
      }

      for (let prestigeLevel = 1; prestigeLevel <= mine.prestigeLevel; prestigeLevel += 1) {
        recoveredSuperCash += this.getSuperCashForPrestigeLevel(prestigeLevel);
      }
    }

    return roundForState(recoveredSuperCash);
  }

  private resetMineProgress(
    mine: MineRuntime,
    options: {
      isUnlocked: boolean;
      preserveOwnedManagers?: boolean;
    }
  ): void {
    const preserveOwnedManagers = options.preserveOwnedManagers ?? false;

    this.withMineContext(mine.mineId, () => {
      mine.isUnlocked = options.isUnlocked;
      mine.lastActiveTime = mine.isUnlocked ? this.timeSeconds : null;
      mine.pendingOfflineCash = 0;
      mine.pendingOfflineSeconds = 0;
      mine.pendingOfflineOreSold = 0;
      mine.baseMineShaftStatsByShaftId = {};
      mine.baseElevatorStats = this.createElevatorStats(this.balance.elevator.startingLevel);
      mine.baseWarehouseStats = this.createWarehouseStats(this.balance.warehouse.startingLevel);
      mine.elevator = new Elevator(
        mine.baseElevatorStats,
        mine.isUnlocked ? this.balance.startingStorage.startingElevatorStoredOre : 0
      );
      mine.warehouse = new Warehouse(
        mine.baseWarehouseStats,
        mine.isUnlocked ? this.balance.startingStorage.startingWarehouseStoredOre : 0
      );
      mine.blockades = this.createBlockades();
      mine.mineShafts = getMineShaftConfigEntries(this.balance).map((entry) => this.createMineShaftEntity(entry, mine, mine.isUnlocked));
      mine.totals = this.createEmptyTotals();

      if (preserveOwnedManagers) {
        mine.ownedManagers = mine.ownedManagers.map((manager) =>
          normalizeManagerState({
            ...manager,
            isAssigned: false,
            assignedShaftId: null,
            isActive: false,
            remainingActiveTime: 0,
            remainingCooldownTime: 0
          })
        );
      } else {
        mine.ownedManagers = [];
      }

      this.refreshShaftManagerMetadata();
      this.syncAllManagerEffects();
      this.syncMineTotals(mine);
    });
  }

  on(type: SimulationEventType | "*", handler: SimulationEventHandler): () => void {
    return this.signals.subscribe(type, handler);
  }

  startMiningCycle(): SimulationEvent[] {
    return this.manualMineAction(1);
  }

  startElevatorCycle(): SimulationEvent[] {
    return this.manualElevatorAction();
  }

  startWarehouseCycle(): SimulationEvent[] {
    return this.manualWarehouseAction();
  }

  unlockMine(mineId: MineId): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const mine = this.minesById[mineId];

    if (mine === undefined) {
      this.emitActionFailed("unlockMine", "invalid_mine", "This mine does not exist.", events, undefined, mineId);
      return events;
    }

    if (mine.isUnlocked) {
      this.emitActionFailed("unlockMine", "mine_already_unlocked", "This mine is already unlocked.", events, undefined, mineId);
      return events;
    }

    if (this.money + Number.EPSILON < mine.unlockCost) {
      this.emitActionFailed("unlockMine", "not_enough_money", "Not enough money to unlock this mine.", events, undefined, mineId);
      return events;
    }

    const previousMoney = this.money;
    const previousStats = this.getMineSummary(mine);
    this.money = roundForState(this.money - mine.unlockCost);
    this.resetMineProgress(mine, { isUnlocked: true });

    this.emit(
      {
        type: "mineUnlocked",
        mineId,
        unlockCost: mine.unlockCost,
        currentMoney: this.money
      } as any,
      events
    );

    this.emitMineStatsChanged(mine, previousStats, events);
    this.emitMoneyChanged(previousMoney, events);
    return events;
  }

  setActiveMine(mineId: MineId): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const mine = this.minesById[mineId];

    if (mine === undefined) {
      this.emitActionFailed("setActiveMine", "invalid_mine", "This mine does not exist.", events, undefined, mineId);
      return events;
    }

    if (!mine.isUnlocked) {
      this.emitActionFailed("setActiveMine", "mine_locked", "This mine is still locked.", events, undefined, mineId);
      return events;
    }

    if (this.activeMineId === mineId) {
      return events;
    }

    const previousMineId = this.activeMineId;
    this.getActiveMine().lastActiveTime = this.timeSeconds;
    this.activeMineId = mineId;
    mine.lastActiveTime = this.timeSeconds;

    this.emit(
      {
        type: "activeMineChanged",
        previousMineId,
        mineId
      } as any,
      events
    );

    return events;
  }

  canPrestigeMine(mineId: MineId): boolean {
    const mine = this.minesById[mineId];
    const nextPrestige = mine ? getNextMinePrestigeData(mineId, mine.prestigeLevel) : null;

    return Boolean(mine?.isUnlocked && nextPrestige !== null && this.money + Number.EPSILON >= nextPrestige.cost);
  }

  prestigeMine(mineId: MineId): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const mine = this.minesById[mineId];

    if (mine === undefined) {
      this.emitActionFailed("prestigeMine", "invalid_mine", "This mine does not exist.", events, undefined, mineId);
      return events;
    }

    if (!mine.isUnlocked) {
      this.emitActionFailed("prestigeMine", "mine_locked", "Locked mines cannot be prestiged.", events, undefined, mineId);
      return events;
    }

    const nextPrestige = getNextMinePrestigeData(mineId, mine.prestigeLevel);

    if (nextPrestige === null) {
      this.emitActionFailed("prestigeMine", "max_prestige_reached", "This mine is already at max prestige.", events, undefined, mineId);
      return events;
    }

    if (this.money + Number.EPSILON < nextPrestige.cost) {
      this.emitActionFailed("prestigeMine", "not_enough_money", "Not enough money to prestige this mine.", events, undefined, mineId);
      return events;
    }

    const previousMoney = this.money;
    const previousPrestigeLevel = mine.prestigeLevel;
    const previousMultiplier = mine.currentPrestigeMultiplier;
    const previousStats = this.getMineSummary(mine);

    this.money = roundForState(this.money - nextPrestige.cost);
    mine.prestigeLevel = nextPrestige.prestigeLevel;
    mine.currentPrestigeMultiplier = nextPrestige.multiplier;
    mine.mineMultiplier = nextPrestige.multiplier;
    this.awardSuperCash(this.getSuperCashForPrestigeLevel(nextPrestige.prestigeLevel), "prestige", events);
    this.resetMineProgress(mine, { isUnlocked: true });

    this.emit(
      {
        type: "minePrestiged",
        mineId,
        previousPrestigeLevel,
        currentPrestigeLevel: mine.prestigeLevel,
        previousMultiplier,
        currentMultiplier: mine.currentPrestigeMultiplier,
        cost: nextPrestige.cost
      } as any,
      events
    );

    this.emitMineStatsChanged(mine, previousStats, events);
    this.emitMoneyChanged(previousMoney, events);
    return events;
  }

  collectMineOfflineCash(mineId: MineId): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const mine = this.minesById[mineId];

    if (mine === undefined) {
      this.emitActionFailed("collectMineOfflineCash", "invalid_mine", "This mine does not exist.", events, undefined, mineId);
      return events;
    }

    if (!mine.isUnlocked) {
      this.emitActionFailed("collectMineOfflineCash", "mine_locked", "This mine is still locked.", events, undefined, mineId);
      return events;
    }

    const collectedCash = roundForState(mine.pendingOfflineCash);

    if (collectedCash <= EPSILON) {
      this.emitActionFailed("collectMineOfflineCash", "no_resource_available", "No offline cash to collect.", events, undefined, mineId);
      return events;
    }

    const previousMoney = this.money;
    mine.pendingOfflineCash = 0;
    mine.pendingOfflineSeconds = 0;
    mine.pendingOfflineOreSold = 0;
    mine.totals.moneyEarned = roundForState(mine.totals.moneyEarned + collectedCash);
    this.money = roundForState(this.money + collectedCash);

    this.emit(
      {
        type: "mineOfflineCashCollected",
        mineId,
        amount: collectedCash,
        currentMoney: this.money
      } as any,
      events
    );
    this.emitMoneyChanged(previousMoney, events);
    return events;
  }

  manualMineAction(shaftId = 1, mineId: MineId = this.activeMineId): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const mine = this.minesById[mineId];

    if (mine === undefined) {
      this.emitActionFailed("manualMineAction", "invalid_mine", "This mine does not exist.", events, shaftId, mineId);
      return events;
    }

    const previousMineId = this.activeMineId;
    this.activeMineId = mine.mineId;
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      this.emitActionFailed("manualMineAction", "invalid_shaft", "This shaft does not exist.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    if (!shaft.isUnlocked) {
      this.emitActionFailed("manualMineAction", "shaft_locked", "This shaft is still locked.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    const result = shaft.startCycle();

    if (!result.started) {
      if (result.reason === "shaftLocked") {
        this.emitActionFailed("manualMineAction", "shaft_locked", "This shaft is still locked.", events, shaftId, mineId);
      } else {
        this.emitCommandRejected("startMiningCycle", result.reason, events);
      }

      this.activeMineId = previousMineId;
      return events;
    }

    this.emit(
      {
        type: "miningCycleStarted",
        shaftId,
        durationSeconds: shaft.stats.cycleTimeSeconds,
        storedOre: shaft.storedOre,
        capacity: shaft.stats.bufferCapacity
      },
      events
    );

    this.activeMineId = previousMineId;
    return events;
  }

  unlockMineShaft(shaftId: number, mineId: MineId = this.activeMineId): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const mine = this.minesById[mineId];

    if (mine === undefined) {
      this.emitActionFailed("unlockMineShaft", "invalid_mine", "This mine does not exist.", events, shaftId, mineId);
      return events;
    }

    const previousMineId = this.activeMineId;
    this.activeMineId = mine.mineId;
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      this.emitActionFailed("unlockMineShaft", "invalid_shaft", "This shaft does not exist.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    if (shaft.isUnlocked) {
      this.emitActionFailed("unlockMineShaft", "already_unlocked", "This shaft is already unlocked.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    const previousShaft = this.getMineShaftById(shaftId - 1);

    if (previousShaft !== undefined && !previousShaft.isUnlocked) {
      this.emitActionFailed("unlockMineShaft", "previous_shaft_locked", "The previous shaft is still locked.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    if (this.money + Number.EPSILON < shaft.unlockCost) {
      this.emitActionFailed("unlockMineShaft", "not_enough_money", "Not enough money to unlock.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    if (!this.isShaftReachable(shaftId)) {
      this.emitActionFailed("unlockMineShaft", "depth_blockade_not_removed", "The depth blockade is still in place.", events, shaftId, mineId);
      this.activeMineId = previousMineId;
      return events;
    }

    const previousMoney = this.money;
    this.money = roundForState(this.money - shaft.unlockCost);
    shaft.unlock();
    this.syncMineShaftStats(shaftId, events);

    this.emit(
      {
        type: "mineShaftUnlocked",
        shaftId,
        unlockCost: shaft.unlockCost,
        currentMoney: this.money
      },
      events
    );

    this.emit(
      {
        type: "moneyChanged",
        previousMoney,
        currentMoney: this.money,
        delta: roundForState(this.money - previousMoney)
      },
      events
    );

    this.activeMineId = previousMineId;
    return events;
  }

  manualElevatorAction(): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const result = this.elevator.startCycle(this.mineShafts, this.warehouse, (event) => this.emit(event, events));

    if (!result.started) {
      this.emitCommandRejected("startElevatorCycle", result.reason, events);
      return events;
    }

    this.emit(
      {
        type: "elevatorCycleStarted",
        carriedOre: result.carriedOre,
        tripTimeSeconds: this.elevator.stats.tripTimeSeconds
      },
      events
    );

    return events;
  }

  manualWarehouseAction(): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const result = this.warehouse.startCycle();

    if (!result.started) {
      this.emitCommandRejected("startWarehouseCycle", result.reason, events);
      return events;
    }

    this.emit(
      {
        type: "warehouseCycleStarted",
        storedOre: this.warehouse.storedOre,
        durationSeconds: this.warehouse.stats.sellCycleTimeSeconds
      },
      events
    );

    return events;
  }

  purchaseManager(area: ManagerArea): SimulationEvent[] {
    const events: SimulationEvent[] = [];

    if (isManagerSystemLocked(this.balance, this.mineShaft.stats.level)) {
      this.emitActionFailed(
        "purchaseManager",
        "manager_system_locked",
        `Managers unlock at Mine Shaft Level ${this.balance.managerSystemUnlock.firstMineShaftLevel}.`,
        events
      );
      return events;
    }

    if (!isManagerArea(area)) {
      this.emitActionFailed("purchaseManager", "invalid_assignment", "Invalid manager configuration.", events);
      return events;
    }

    const hireCountsByArea = countManagersByArea(this.ownedManagers);
    const hireCost = getManagerHireCost(this.balance, area, hireCountsByArea[area]);

    if (this.money + Number.EPSILON < hireCost) {
      this.emitActionFailed("purchaseManager", "not_enough_money", "Not enough money to hire the manager.", events);
      return events;
    }

    const manager = normalizeManagerState(
      createPurchasedManager(
        this.balance,
        {
          area
        },
        hireCountsByArea[area]
      )
    );

    const previousMoney = this.money;
    this.money = roundForState(this.money - hireCost);
    this.ownedManagers = [...this.ownedManagers, manager];

    this.emit(
      {
        type: "managerPurchased",
        manager
      },
      events
    );

    this.emit(
      {
        type: "moneyChanged",
        previousMoney,
        currentMoney: this.money,
        delta: roundForState(this.money - previousMoney)
      },
      events
    );

    return events;
  }

  assignManager(managerId: string, area: ManagerArea, shaftId = 1): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const manager = this.getOwnedManagerById(managerId);

    if (manager === undefined) {
      this.emitActionFailed("assignManager", "manager_not_owned", "The manager is not owned by the player.", events);
      return events;
    }

    if (manager.area !== area) {
      this.emitActionFailed(
        "assignManager",
        "invalid_assignment",
        "The manager cannot be assigned to this area.",
        events
      );
      return events;
    }

    if (area === "mineShaft") {
      return this.assignMineManagerToShaft(manager, shaftId, events);
    }

    const previousAutomationEnabled = this.isAutomationEnabledForArea(area);
    const previousAssignedManager = this.getAssignedManagerForArea(area);

    if (previousAssignedManager !== undefined && previousAssignedManager.id === manager.id) {
      return events;
    }

    if (previousAssignedManager !== undefined) {
      this.unassignManager(area, events, {
        emitAutomationEvent: false,
        emitStatsEvent: false
      });
    }

    manager.isAssigned = true;
    manager.assignedShaftId = null;

    this.emit(
      {
        type: "managerAssigned",
        manager: normalizeManagerState(manager),
        area
      },
      events
    );

    this.emitAutomationStateIfChanged(area, previousAutomationEnabled, events);
    this.syncAreaStats(area, events);
    return events;
  }

  unassignManager(
    area: ManagerArea,
    events: SimulationEvent[] = [],
    options: { emitAutomationEvent?: boolean; emitStatsEvent?: boolean } = {},
    shaftId = 1
  ): SimulationEvent[] {
    if (area === "mineShaft") {
      return this.unassignMineManagerFromShaft(shaftId, events, options);
    }

    const manager = this.getAssignedManagerForArea(area);
    const previousAutomationEnabled = this.isAutomationEnabledForArea(area);
    const emitAutomationEvent = options.emitAutomationEvent ?? true;
    const emitStatsEvent = options.emitStatsEvent ?? true;

    if (manager === undefined) {
      if (events.length === 0) {
        this.emitActionFailed("unassignManager", "manager_not_assigned", "No manager is assigned to this area.", events);
      }

      return events;
    }

    manager.isAssigned = false;
    manager.assignedShaftId = null;

    if (manager.isActive) {
      manager.isActive = false;
      manager.remainingActiveTime = 0;
      manager.remainingCooldownTime = roundForState(Math.max(manager.remainingCooldownTime, manager.cooldownSeconds));
      this.emit(
        {
          type: "managerAbilityExpired",
          manager: normalizeManagerState(manager)
        },
        events
      );
      this.emit(
        {
          type: "managerCooldownStarted",
          manager: normalizeManagerState(manager)
        },
        events
      );
    }

    this.emit(
      {
        type: "managerUnassigned",
        manager: normalizeManagerState(manager),
        area
      },
      events
    );

    if (emitAutomationEvent) {
      this.emitAutomationStateIfChanged(area, previousAutomationEnabled, events);
    }

    if (emitStatsEvent) {
      this.syncAreaStats(area, events);
    }

    return events;
  }

  activateManagerAbility(managerId: string): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const manager = this.getOwnedManagerById(managerId);

    if (manager === undefined) {
      this.emitActionFailed("activateManagerAbility", "manager_not_owned", "The manager is not owned by the player.", events);
      return events;
    }

    if (!manager.isAssigned) {
      this.emitActionFailed("activateManagerAbility", "manager_not_assigned", "The manager is not assigned.", events);
      return events;
    }

    if (manager.isActive || manager.remainingCooldownTime > EPSILON) {
      this.emitActionFailed("activateManagerAbility", "ability_on_cooldown", "The ability is on cooldown.", events);
      return events;
    }

    manager.isActive = true;
    manager.remainingActiveTime = roundForState(manager.activeDurationSeconds);

    this.emit(
      {
        type: "managerAbilityActivated",
        manager: normalizeManagerState(manager)
      },
      events
    );

    if (manager.area === "mineShaft" && manager.assignedShaftId !== null) {
      this.syncMineShaftStats(manager.assignedShaftId, events);
    } else {
      this.syncAreaStats(manager.area as "elevator" | "warehouse", events);
    }

    return events;
  }

  upgradeMineShaft(shaftId: number, buyMode: UpgradeBuyMode = 1): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      this.emitActionFailed("upgradeMineShaft", "invalid_shaft", "This shaft does not exist.", events, shaftId);
      return events;
    }

    if (!shaft.isUnlocked) {
      this.emitActionFailed("upgradeMineShaft", "shaft_locked", "Locked shafts cannot be upgraded.", events, shaftId);
      return events;
    }

    if (!shaft.isReachable) {
      this.emitActionFailed("upgradeMineShaft", "shaft_not_reachable", "This shaft is not reachable.", events, shaftId);
      return events;
    }

    const result = purchaseSimulationUpgrade(
      this.balance,
      "mineShaft",
      this.money,
      shaft.stats.level,
      buyMode,
      this.getUpgradeCostMultiplierForMineShaft(shaftId),
      shaftId
    );

    if (!result.purchased) {
      this.emitCommandRejected("upgradeMineShaft", result.reason, events);
      return events;
    }

    this.money = result.currentMoney;

    this.baseMineShaftStatsByShaftId[shaftId] = this.createMineShaftStats(shaftId, result.currentLevel);
    this.syncMineShaftStats(shaftId, events);
    this.awardSuperCash(this.getSuperCashForLevelMilestones(result.previousLevel, result.currentLevel), "upgrade", events);

    this.emit(
      {
        type: "mineShaftUpgradePurchased",
        shaftId,
        previousLevel: result.previousLevel,
        currentLevel: result.currentLevel,
        cost: result.cost,
        previousMoney: result.previousMoney,
        currentMoney: result.currentMoney
      },
      events
    );

    this.emit(
      {
        type: "upgradePurchased",
        target: "mineShaft",
        shaftId,
        previousLevel: result.previousLevel,
        currentLevel: result.currentLevel,
        cost: result.cost,
        previousMoney: result.previousMoney,
        currentMoney: result.currentMoney
      },
      events
    );

    this.emit(
      {
        type: "moneyChanged",
        previousMoney: result.previousMoney,
        currentMoney: result.currentMoney,
        delta: roundForState(result.currentMoney - result.previousMoney)
      },
      events
    );

    return events;
  }

  purchaseUpgrade(target: UpgradeTarget, buyMode: UpgradeBuyMode = 1): SimulationEvent[] {
    if (target === "mineShaft") {
      return this.upgradeMineShaft(1, buyMode);
    }

    const events: SimulationEvent[] = [];
    const result = purchaseSimulationUpgrade(
      this.balance,
      target,
      this.money,
      this.getCurrentLevel(target),
      buyMode,
      this.getUpgradeCostMultiplierForTarget(target)
    );

    if (!result.purchased) {
      this.emitCommandRejected(getUpgradeCommandName(target), result.reason, events);
      return events;
    }

    this.money = result.currentMoney;
    this.applyUpgradeStats(target, result.currentStats);

    this.awardSuperCash(this.getSuperCashForLevelMilestones(result.previousLevel, result.currentLevel), "upgrade", events);

    this.emit(
      {
        type: "upgradePurchased",
        target,
        previousLevel: result.previousLevel,
        currentLevel: result.currentLevel,
        cost: result.cost,
        previousMoney: result.previousMoney,
        currentMoney: result.currentMoney
      },
      events
    );

    this.emit(
      {
        type: "moneyChanged",
        previousMoney: result.previousMoney,
        currentMoney: result.currentMoney,
        delta: roundForState(result.currentMoney - result.previousMoney)
      },
      events
    );

    this.emit(
      {
        type: "statsChanged",
        target,
        previousStats: result.previousStats,
        currentStats: result.currentStats
      },
      events
    );

    return events;
  }

  purchaseMineShaftUpgrade(): SimulationEvent[] {
    return this.upgradeMineShaft(1);
  }

  purchaseElevatorUpgrade(): SimulationEvent[] {
    return this.purchaseUpgrade("elevator");
  }

  purchaseWarehouseUpgrade(): SimulationEvent[] {
    return this.purchaseUpgrade("warehouse");
  }

  update(deltaTimeSeconds: number): SimulationEvent[] {
    if (!Number.isFinite(deltaTimeSeconds) || deltaTimeSeconds < 0) {
      throw new Error("deltaTimeSeconds must be a non-negative finite number.");
    }

    const events: SimulationEvent[] = [];

    this.accumulatorSeconds = roundForState(this.accumulatorSeconds + deltaTimeSeconds);

    while (this.accumulatorSeconds + EPSILON >= this.fixedStepSeconds) {
      this.accumulatorSeconds = roundForState(this.accumulatorSeconds - this.fixedStepSeconds);
      this.step(this.fixedStepSeconds, events);
    }

    return events;
  }

  getState(buyMode: UpgradeBuyMode = 1): GameState {
    const activeSnapshot = this.buildMineStateSnapshot(this.getActiveMine());
    const upgrades = this.buildUpgradeState(buyMode);
    const mines = Object.fromEntries(
      this.mineDefinitions.map((definition) => [
        definition.mineId,
        this.buildMineStateSnapshot(this.minesById[definition.mineId])
      ])
    ) as GameState["mines"];

    return {
      activeMineId: this.activeMineId,
      cash: roundForState(this.money),
      superCash: roundForState(this.superCash),
      mines,
      timeSeconds: roundForState(this.timeSeconds),
      money: roundForState(this.money),
      levels: activeSnapshot.levels,
      resources: {
        ...activeSnapshot.resources,
        totals: this.getGlobalTotals()
      },
      upgrades,
      currentValues: activeSnapshot.currentValues,
      baseValues: activeSnapshot.baseValues,
      managers: activeSnapshot.managers,
      blockades: activeSnapshot.blockades,
      entities: activeSnapshot.entities
    };
  }

  private buildMineStateSnapshot(mine: MineRuntime): GameState["mines"][MineId] {
    return this.withMineContext(mine.mineId, () => {
      const mineShaftLevels: Record<number, number> = {};
      const mineShaftStoredOre: Record<number, number> = {};
      const mineShaftCurrentValues: Record<number, MineShaftStats> = {};
      const mineShaftBaseValues: Record<number, MineShaftStats> = {};
      const mineShaftEntities: Record<number, MineShaftRuntimeState> = {};

      for (const shaft of this.mineShafts) {
        mineShaftLevels[shaft.shaftId] = shaft.stats.level;
        mineShaftStoredOre[shaft.shaftId] = roundForState(shaft.storedOre);
        mineShaftCurrentValues[shaft.shaftId] = shaft.stats;
        mineShaftBaseValues[shaft.shaftId] = this.baseMineShaftStatsByShaftId[shaft.shaftId];
        mineShaftEntities[shaft.shaftId] = {
          shaftId: shaft.shaftId,
          displayName: shaft.displayName,
          depthIndex: shaft.depthIndex,
          depthGroup: shaft.depthGroup,
          isUnlocked: shaft.isUnlocked,
          isReachable: shaft.isReachable,
          unlockCost: shaft.unlockCost,
          level: shaft.stats.level,
          productionMultiplier: shaft.productionMultiplier,
          upgradeCostMultiplier: shaft.upgradeCostMultiplier,
          state: shaft.state,
          cycleProgressSeconds: roundForState(shaft.cycleProgressSeconds),
          storedOre: roundForState(shaft.storedOre),
          capacity: shaft.stats.bufferCapacity,
          productionRate: shaft.stats.throughputPerSecond,
          productionCycleTime: shaft.stats.cycleTimeSeconds,
          assignedManagerId: shaft.assignedManagerId,
          activeManagerAbilityState: shaft.activeManagerAbilityState
        };
      }

      const firstShaft = this.mineShaft;

      return {
        mineId: mine.mineId,
        displayName: mine.displayName,
        isUnlocked: mine.isUnlocked,
        unlockCost: mine.unlockCost,
        prestigeLevel: mine.prestigeLevel,
        prestigeData: getMineDefinition(mine.mineId).prestigeLevels,
        currentPrestigeMultiplier: mine.currentPrestigeMultiplier,
        mineMultiplier: mine.mineMultiplier,
        pendingOfflineCash: roundForState(mine.pendingOfflineCash),
        pendingOfflineSeconds: roundForState(mine.pendingOfflineSeconds),
        pendingOfflineOreSold: roundForState(mine.pendingOfflineOreSold),
        levels: {
          mineShaft: firstShaft.stats.level,
          mineShafts: mineShaftLevels,
          elevator: this.elevator.stats.level,
          warehouse: this.warehouse.stats.level
        },
        resources: {
          storedOre: {
            mineShaft: roundForState(firstShaft.storedOre),
            mineShafts: mineShaftStoredOre,
            elevator: roundForState(this.elevator.carriedOre),
            warehouse: roundForState(this.warehouse.storedOre)
          },
          totals: {
            producedOre: roundForState(mine.totals.producedOre),
            collectedByElevatorOre: roundForState(mine.totals.collectedByElevatorOre),
            transportedOre: roundForState(mine.totals.transportedOre),
            soldOre: roundForState(mine.totals.soldOre),
            moneyEarned: roundForState(mine.totals.moneyEarned)
          }
        },
        currentValues: {
          mineShaft: firstShaft.stats,
          mineShafts: mineShaftCurrentValues,
          elevator: this.elevator.stats,
          warehouse: this.warehouse.stats
        },
        baseValues: {
          mineShaft: this.baseMineShaftStatsByShaftId[1],
          mineShafts: mineShaftBaseValues,
          elevator: this.baseElevatorStats,
          warehouse: this.baseWarehouseStats
        },
        managers: {
          systemLocked: isManagerSystemLocked(this.balance, firstShaft.stats.level),
          unlockLevel: this.balance.managerSystemUnlock.firstMineShaftLevel,
          hireCountsByArea: countManagersByArea(this.ownedManagers),
          ownedManagers: this.getOwnedManagersSnapshot(),
          assignedManagerIdsByArea: this.getAssignedManagerIdsByArea(),
          assignedManagerIdsByShaft: this.getAssignedManagerIdsByShaft(),
          automationEnabledByArea: getAutomationEnabledByArea(this.ownedManagers),
          automationEnabledByShaft: this.getAutomationEnabledByShaft()
        },
        blockades: { ...this.blockades },
        entities: {
          mineShaft: mineShaftEntities[1],
          mineShafts: mineShaftEntities,
          elevator: {
            state: this.elevator.state,
            carriedOre: roundForState(this.elevator.carriedOre),
            capacity: this.elevator.stats.loadCapacity,
            remainingTripSeconds: roundForState(this.elevator.remainingTripSeconds)
          },
          warehouse: {
            state: this.warehouse.state,
            sellProgressSeconds: roundForState(this.warehouse.sellProgressSeconds),
            storedOre: roundForState(this.warehouse.storedOre),
            capacity: this.warehouse.stats.storageCapacity
          }
        },
        lastActiveTime: mine.lastActiveTime
      };
    });
  }

  private buildUpgradeState(buyMode: UpgradeBuyMode): GameState["upgrades"] {
    const mineShaftUpgradeById: Record<number, GameState["upgrades"]["mineShaft"]> = {};

    for (const shaft of this.mineShafts) {
      const preview = getUpgradePreview(
        this.balance,
        "mineShaft",
        this.money,
        shaft.stats.level,
        buyMode,
        this.getUpgradeCostMultiplierForMineShaft(shaft.shaftId),
        shaft.shaftId
      );

      mineShaftUpgradeById[shaft.shaftId] = {
        currentLevel: preview.currentLevel,
        targetLevel: preview.targetLevel,
        levelsToBuy: preview.levelsToBuy,
        cost: preview.cost,
        firstLevelCost: preview.firstLevelCost,
        canAfford: shaft.isUnlocked ? preview.affordable : false,
        isMaxed: preview.maxed,
        previewStats: this.applyMineMultiplierToMineShaftStats(preview.previewStats as MineShaftStats)
      };
    }

    const elevatorUpgrade = getUpgradePreview(
      this.balance,
      "elevator",
      this.money,
      this.elevator.stats.level,
      buyMode,
      this.getUpgradeCostMultiplierForArea("elevator")
    );
    const warehouseUpgrade = getUpgradePreview(
      this.balance,
      "warehouse",
      this.money,
      this.warehouse.stats.level,
      buyMode,
      this.getUpgradeCostMultiplierForArea("warehouse")
    );

    return {
      mineShaft: mineShaftUpgradeById[1],
      mineShafts: mineShaftUpgradeById,
      elevator: {
        currentLevel: elevatorUpgrade.currentLevel,
        targetLevel: elevatorUpgrade.targetLevel,
        levelsToBuy: elevatorUpgrade.levelsToBuy,
        cost: elevatorUpgrade.cost,
        firstLevelCost: elevatorUpgrade.firstLevelCost,
        canAfford: elevatorUpgrade.affordable,
        isMaxed: elevatorUpgrade.maxed,
        previewStats: this.applyMineMultiplierToElevatorStats(elevatorUpgrade.previewStats as ElevatorStats)
      },
      warehouse: {
        currentLevel: warehouseUpgrade.currentLevel,
        targetLevel: warehouseUpgrade.targetLevel,
        levelsToBuy: warehouseUpgrade.levelsToBuy,
        cost: warehouseUpgrade.cost,
        firstLevelCost: warehouseUpgrade.firstLevelCost,
        canAfford: warehouseUpgrade.affordable,
        isMaxed: warehouseUpgrade.maxed,
        previewStats: this.applyMineMultiplierToWarehouseStats(warehouseUpgrade.previewStats as WarehouseStats)
      }
    };
  }

  private getGlobalTotals(): ResourceTotalsState {
    return this.mineDefinitions.reduce(
      (totals, definition) => {
        const mine = this.minesById[definition.mineId];
        totals.producedOre = roundForState(totals.producedOre + mine.totals.producedOre);
        totals.collectedByElevatorOre = roundForState(totals.collectedByElevatorOre + mine.totals.collectedByElevatorOre);
        totals.transportedOre = roundForState(totals.transportedOre + mine.totals.transportedOre);
        totals.soldOre = roundForState(totals.soldOre + mine.totals.soldOre);
        totals.moneyEarned = roundForState(totals.moneyEarned + mine.totals.moneyEarned);
        return totals;
      },
      this.createEmptyTotals()
    );
  }

  private createMineShaftEntity(definition: MineShaftConfigEntry, mine: MineRuntime, isMineUnlocked: boolean): MineShaft {
    const startingLevel = this.balance.mineShaft.startingLevel;
    const previousMineId = this.activeMineId;
    this.activeMineId = mine.mineId;
    const stats = this.createMineShaftStats(definition.shaftId, startingLevel);
    mine.baseMineShaftStatsByShaftId[definition.shaftId] = stats;
    this.activeMineId = previousMineId;

    const startingStoredOre =
      isMineUnlocked && definition.shaftId === 1 ? this.balance.startingStorage.startingMineShaftStoredOre : 0;

    return new MineShaft(stats, startingStoredOre, this.balance.miner.startsActive, {
      shaftId: definition.shaftId,
      displayName: definition.displayName,
      depthIndex: definition.depthIndex,
      isUnlocked: isMineUnlocked ? definition.isUnlocked : false,
      unlockCost: definition.unlockCost,
      productionMultiplier: definition.productionMultiplier,
      upgradeCostMultiplier: definition.upgradeCostMultiplier,
      depthGroup: definition.depthGroup,
      isReachable: definition.isReachable
    });
  }

  private createMineShaftStats(shaftId: number, level: number): MineShaftStats {
    const baseStats = getMineShaftStats(this.balance, level, shaftId);
    return this.applyMineMultiplierToMineShaftStats(baseStats);
  }

  private createElevatorStats(level: number): ElevatorStats {
    return this.applyMineMultiplierToElevatorStats(getElevatorStats(this.balance, level));
  }

  private createWarehouseStats(level: number): WarehouseStats {
    return this.applyMineMultiplierToWarehouseStats(getWarehouseStats(this.balance, level));
  }

  private applyMineMultiplierToMineShaftStats(baseStats: MineShaftStats): MineShaftStats {
    const multiplier = this.getActiveMine().currentPrestigeMultiplier;
    return {
      ...baseStats,
      orePerCycle: roundForState(baseStats.orePerCycle * multiplier),
      bufferCapacity: roundForState(baseStats.bufferCapacity * multiplier),
      throughputPerSecond: roundForState((baseStats.orePerCycle * multiplier) / baseStats.cycleTimeSeconds)
    };
  }

  private applyMineMultiplierToElevatorStats(baseStats: ElevatorStats): ElevatorStats {
    const multiplier = this.getActiveMine().currentPrestigeMultiplier;
    const loadCapacity = roundForState(baseStats.loadCapacity * multiplier);

    return {
      ...baseStats,
      loadCapacity,
      throughputPerSecond: roundForState(loadCapacity / baseStats.tripTimeSeconds)
    };
  }

  private applyMineMultiplierToWarehouseStats(baseStats: WarehouseStats): WarehouseStats {
    const multiplier = this.getActiveMine().currentPrestigeMultiplier;
    const storageCapacity = roundForState(baseStats.storageCapacity * multiplier);
    const sellCapacityPerCycle = roundForState(baseStats.sellCapacityPerCycle * multiplier);

    return {
      ...baseStats,
      storageCapacity,
      sellCapacityPerCycle,
      throughputPerSecond: roundForState(sellCapacityPerCycle / baseStats.sellCycleTimeSeconds)
    };
  }

  private step(deltaSeconds: number, events: SimulationEvent[]): void {
    this.timeSeconds = roundForState(this.timeSeconds + deltaSeconds);
    this.accumulateInactiveMineOfflineCash(deltaSeconds);

    const emit = (event: SimulationEventInput) => this.emit(event, events);

    for (const shaft of this.mineShafts) {
      shaft.update(deltaSeconds, emit);
      this.runAutomationForMineShaft(shaft, events);
    }

    this.updateBlockades(deltaSeconds, events);

    const sales = this.warehouse.update(deltaSeconds, emit);
    this.runAutomationForWarehouse(events);

    for (const sale of sales) {
      const moneyEarned = roundForState(sale.soldOre * this.balance.economy.sellPricePerOre);
      const previousMoney = this.money;
      this.money = roundForState(this.money + moneyEarned);
      this.getActiveMine().totals.moneyEarned = roundForState(this.getActiveMine().totals.moneyEarned + moneyEarned);
      this.getActiveMine().totals.soldOre = roundForState(this.warehouse.totalSoldOre);
      this.getActiveMine().totals.collectedByElevatorOre = roundForState(this.elevator.totalCollectedOre);
      this.getActiveMine().totals.transportedOre = roundForState(this.elevator.totalTransportedOre);
      this.getActiveMine().totals.producedOre = roundForState(this.getTotalProducedOre());

      emit({
        type: "oreSold",
        amount: sale.soldOre,
        moneyEarned,
        remainingWarehouseOre: this.warehouse.storedOre
      });

      emit({
        type: "moneyChanged",
        previousMoney,
        currentMoney: this.money,
        delta: moneyEarned
      });
    }

    this.elevator.update(deltaSeconds, this.mineShafts, this.warehouse, emit);
    this.runAutomationForElevator(events);

    this.tickManagerTimers(deltaSeconds, events);
    this.syncMineTotals();
  }

  private syncMineTotals(mine: MineRuntime = this.getActiveMine()): void {
    mine.totals.producedOre = roundForState(this.getTotalProducedOre(mine));
    mine.totals.collectedByElevatorOre = roundForState(mine.elevator.totalCollectedOre);
    mine.totals.transportedOre = roundForState(mine.elevator.totalTransportedOre);
    mine.totals.soldOre = roundForState(mine.warehouse.totalSoldOre);
  }

  private runAutomationForMineShaft(shaft: MineShaft, events: SimulationEvent[]): void {
    const manager = this.getAssignedMineManagerForShaft(shaft.shaftId);

    if (manager === undefined) {
      return;
    }

    if (!shaft.isUnlocked || shaft.state !== "idle" || shaft.storedOre >= shaft.stats.bufferCapacity - EPSILON) {
      return;
    }

    const result = shaft.startCycle();

    if (!result.started) {
      return;
    }

    this.emit(
      {
        type: "miningCycleStarted",
        shaftId: shaft.shaftId,
        durationSeconds: shaft.stats.cycleTimeSeconds,
        storedOre: shaft.storedOre,
        capacity: shaft.stats.bufferCapacity
      },
      events
    );
  }

  private runAutomationForElevator(events: SimulationEvent[]): void {
    if (this.getAssignedManagerForArea("elevator") === undefined) {
      return;
    }

    if (this.elevator.state !== "idle") {
      return;
    }

    const hasCollectableOre = this.mineShafts.some((shaft) => shaft.isUnlocked && shaft.storedOre > EPSILON);

    if (!hasCollectableOre) {
      return;
    }

    if (roundForState(this.warehouse.stats.storageCapacity - this.warehouse.storedOre) <= EPSILON) {
      return;
    }

    const result = this.elevator.startCycle(this.mineShafts, this.warehouse, (event) => this.emit(event, events));

    if (!result.started) {
      return;
    }

    this.emit(
      {
        type: "elevatorCycleStarted",
        carriedOre: result.carriedOre,
        tripTimeSeconds: this.elevator.stats.tripTimeSeconds
      },
      events
    );
  }

  private runAutomationForWarehouse(events: SimulationEvent[]): void {
    if (this.getAssignedManagerForArea("warehouse") === undefined) {
      return;
    }

    if (this.warehouse.state !== "idle" || this.warehouse.storedOre <= EPSILON) {
      return;
    }

    const result = this.warehouse.startCycle();

    if (!result.started) {
      return;
    }

    this.emit(
      {
        type: "warehouseCycleStarted",
        storedOre: this.warehouse.storedOre,
        durationSeconds: this.warehouse.stats.sellCycleTimeSeconds
      },
      events
    );
  }

  private assignMineManagerToShaft(manager: ManagerState, shaftId: number, events: SimulationEvent[]): SimulationEvent[] {
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      this.emitActionFailed("assignManager", "invalid_shaft", "This shaft does not exist.", events, shaftId);
      return events;
    }

    if (!shaft.isUnlocked) {
      this.emitActionFailed("assignManager", "shaft_locked", "Managers can only be assigned to unlocked shafts.", events, shaftId);
      return events;
    }

    const previousAreaAutomation = this.isAutomationEnabledForArea("mineShaft");
    const previousShaftAutomation = this.isAutomationEnabledForShaft(shaftId);
    const previousShaftManager = this.getAssignedMineManagerForShaft(shaftId);
    const previousManagerShaftId = manager.assignedShaftId;

    if (manager.isAssigned && manager.assignedShaftId === shaftId) {
      return events;
    }

    if (previousShaftManager !== undefined && previousShaftManager.id !== manager.id) {
      this.unassignMineManagerFromShaft(shaftId, events, {
        emitAutomationEvent: false,
        emitStatsEvent: false
      });
    }

    if (manager.isAssigned && previousManagerShaftId !== null && previousManagerShaftId !== shaftId) {
      this.unassignMineManagerFromShaft(previousManagerShaftId, events, {
        emitAutomationEvent: false,
        emitStatsEvent: false
      });
    }

    manager.isAssigned = true;
    manager.assignedShaftId = shaftId;
    shaft.assignedManagerId = manager.id;

    this.emit(
      {
        type: "managerAssigned",
        manager: normalizeManagerState(manager),
        area: "mineShaft"
      },
      events
    );

    this.emit(
      {
        type: "managerAssignedToShaft",
        manager: normalizeManagerState(manager),
        shaftId
      },
      events
    );

    this.emitAutomationStateIfChanged("mineShaft", previousAreaAutomation, events);
    this.emitAutomationStateForShaftIfChanged(shaftId, previousShaftAutomation, events);

    if (previousManagerShaftId !== null && previousManagerShaftId !== shaftId) {
      this.syncMineShaftStats(previousManagerShaftId, events);
    }

    this.syncMineShaftStats(shaftId, events);
    this.refreshShaftManagerMetadata();
    return events;
  }

  private unassignMineManagerFromShaft(
    shaftId: number,
    events: SimulationEvent[] = [],
    options: { emitAutomationEvent?: boolean; emitStatsEvent?: boolean } = {}
  ): SimulationEvent[] {
    const manager = this.getAssignedMineManagerForShaft(shaftId);
    const previousAreaAutomation = this.isAutomationEnabledForArea("mineShaft");
    const previousShaftAutomation = this.isAutomationEnabledForShaft(shaftId);
    const emitAutomationEvent = options.emitAutomationEvent ?? true;
    const emitStatsEvent = options.emitStatsEvent ?? true;

    if (manager === undefined) {
      if (events.length === 0) {
        this.emitActionFailed("unassignManager", "manager_not_assigned", "No manager is assigned to this shaft.", events, shaftId);
      }

      return events;
    }

    manager.isAssigned = false;
    manager.assignedShaftId = null;

    const shaft = this.getMineShaftById(shaftId);
    if (shaft !== undefined) {
      shaft.assignedManagerId = null;
    }

    if (manager.isActive) {
      manager.isActive = false;
      manager.remainingActiveTime = 0;
      manager.remainingCooldownTime = roundForState(Math.max(manager.remainingCooldownTime, manager.cooldownSeconds));
      this.emit(
        {
          type: "managerAbilityExpired",
          manager: normalizeManagerState(manager)
        },
        events
      );
      this.emit(
        {
          type: "managerCooldownStarted",
          manager: normalizeManagerState(manager)
        },
        events
      );
    }

    this.emit(
      {
        type: "managerUnassigned",
        manager: normalizeManagerState(manager),
        area: "mineShaft"
      },
      events
    );

    this.emit(
      {
        type: "managerUnassignedFromShaft",
        manager: normalizeManagerState(manager),
        shaftId
      },
      events
    );

    if (emitAutomationEvent) {
      this.emitAutomationStateIfChanged("mineShaft", previousAreaAutomation, events);
      this.emitAutomationStateForShaftIfChanged(shaftId, previousShaftAutomation, events);
    }

    if (emitStatsEvent) {
      this.syncMineShaftStats(shaftId, events);
    }

    this.refreshShaftManagerMetadata();
    return events;
  }

  private getCurrentLevel(target: UpgradeTarget): number {
    switch (target) {
      case "mineShaft":
        return this.mineShaft.stats.level;
      case "elevator":
        return this.elevator.stats.level;
      case "warehouse":
        return this.warehouse.stats.level;
    }
  }

  private applyUpgradeStats(target: UpgradeTarget, stats: GameState["currentValues"][UpgradeTarget], shaftId = 1): void {
    switch (target) {
      case "mineShaft":
        this.baseMineShaftStatsByShaftId[shaftId] = this.createMineShaftStats(shaftId, stats.level);
        this.syncMineShaftStats(shaftId);
        return;
      case "elevator":
        this.baseElevatorStats = this.createElevatorStats(stats.level);
        this.syncAreaStats("elevator");
        return;
      case "warehouse":
        this.baseWarehouseStats = this.createWarehouseStats(stats.level);
        this.syncAreaStats("warehouse");
        return;
    }
  }

  private getUpgradeCostMultiplierForTarget(target: UpgradeTarget): number {
    switch (target) {
      case "mineShaft":
        return this.getUpgradeCostMultiplierForMineShaft(1);
      case "elevator":
        return this.getUpgradeCostMultiplierForArea("elevator");
      case "warehouse":
        return this.getUpgradeCostMultiplierForArea("warehouse");
    }
  }

  private getUpgradeCostMultiplierForArea(area: Exclude<ManagerArea, "mineShaft">): number {
    const manager = this.getActiveAssignedManager(area);

    if (manager?.abilityType === "upgradeCostReduction") {
      return manager.costReductionMultiplier;
    }

    return 1;
  }

  private getUpgradeCostMultiplierForMineShaft(shaftId: number): number {
    const manager = this.getActiveAssignedMineManager(shaftId);

    if (manager?.abilityType === "upgradeCostReduction") {
      return manager.costReductionMultiplier;
    }

    return 1;
  }

  private getOwnedManagersSnapshot(): ManagerState[] {
    return this.ownedManagers.map((manager) => normalizeManagerState(manager));
  }

  private getOwnedManagerById(managerId: string): ManagerState | undefined {
    return this.ownedManagers.find((manager) => manager.id === managerId && manager.isOwned);
  }

  private getAssignedManagerForArea(area: Exclude<ManagerArea, "mineShaft">): ManagerState | undefined {
    return this.ownedManagers.find((manager) => manager.area === area && manager.isOwned && manager.isAssigned);
  }

  private getAssignedMineManagerForShaft(shaftId: number): ManagerState | undefined {
    return this.ownedManagers.find(
      (manager) =>
        manager.area === "mineShaft" &&
        manager.isOwned &&
        manager.isAssigned &&
        manager.assignedShaftId === shaftId
    );
  }

  private getActiveAssignedManager(area: Exclude<ManagerArea, "mineShaft">): ManagerState | undefined {
    const manager = this.getAssignedManagerForArea(area);

    return manager !== undefined && manager.isActive ? manager : undefined;
  }

  private getActiveAssignedMineManager(shaftId: number): ManagerState | undefined {
    const manager = this.getAssignedMineManagerForShaft(shaftId);

    return manager !== undefined && manager.isActive ? manager : undefined;
  }

  private isAutomationEnabledForArea(area: ManagerArea): boolean {
    if (area === "mineShaft") {
      return this.ownedManagers.some(
        (manager) => manager.area === "mineShaft" && manager.isOwned && manager.isAssigned && manager.assignedShaftId !== null
      );
    }

    return this.getAssignedManagerForArea(area) !== undefined;
  }

  private isAutomationEnabledForShaft(shaftId: number): boolean {
    return this.getAssignedMineManagerForShaft(shaftId) !== undefined;
  }

  private getAssignedManagerIdsByArea(managers: readonly ManagerState[] = this.ownedManagers): Record<ManagerArea, string | null> {
    return {
      mineShaft:
        managers.find(
          (manager) => manager.area === "mineShaft" && manager.isOwned && manager.isAssigned && manager.assignedShaftId === 1
        )?.id ??
        managers.find((manager) => manager.area === "mineShaft" && manager.isOwned && manager.isAssigned)?.id ??
        null,
      elevator: managers.find((manager) => manager.area === "elevator" && manager.isOwned && manager.isAssigned)?.id ?? null,
      warehouse: managers.find((manager) => manager.area === "warehouse" && manager.isOwned && manager.isAssigned)?.id ?? null
    };
  }

  private getAssignedManagerIdsByShaft(managers: readonly ManagerState[] = this.ownedManagers): Record<number, string | null> {
    const result: Record<number, string | null> = {};

    for (const shaft of this.mineShafts) {
      result[shaft.shaftId] = null;
    }

    for (const manager of managers) {
      if (manager.area !== "mineShaft" || !manager.isOwned || !manager.isAssigned || manager.assignedShaftId === null) {
        continue;
      }

      result[manager.assignedShaftId] = manager.id;
    }

    return result;
  }

  private getAutomationEnabledByShaft(): Record<number, boolean> {
    const result: Record<number, boolean> = {};

    for (const shaft of this.mineShafts) {
      result[shaft.shaftId] = this.isAutomationEnabledForShaft(shaft.shaftId);
    }

    return result;
  }

  private emitAutomationStateIfChanged(
    area: ManagerArea,
    previousAutomationEnabled: boolean,
    events: SimulationEvent[]
  ): void {
    const currentAutomationEnabled = this.isAutomationEnabledForArea(area);

    if (currentAutomationEnabled === previousAutomationEnabled) {
      return;
    }

    this.emit(
      {
        type: "automationStateChanged",
        area,
        automated: currentAutomationEnabled,
        managerId: this.getAssignedManagerIdsByArea()[area]
      },
      events
    );
  }

  private emitAutomationStateForShaftIfChanged(
    shaftId: number,
    previousAutomationEnabled: boolean,
    events: SimulationEvent[]
  ): void {
    const currentAutomationEnabled = this.isAutomationEnabledForShaft(shaftId);

    if (currentAutomationEnabled === previousAutomationEnabled) {
      return;
    }

    this.emit(
      {
        type: "automationStateChanged",
        area: "mineShaft",
        automated: currentAutomationEnabled,
        managerId: this.getAssignedManagerIdsByShaft()[shaftId] ?? null,
        shaftId
      },
      events
    );
  }

  private restoreManagersFromSave(mine: MineRuntime, state?: SaveGameMineStateV7): void {
    const hireCounts: Record<ManagerArea, number> = { mineShaft: 0, elevator: 0, warehouse: 0 };
    const managerState = state?.managers;
    const managers = (managerState?.ownedManagers ?? []).map((manager) => {
      const area = manager.area;
      const hiredCountBeforeThis = hireCounts[area];
      hireCounts[area]++;
      
      return populateManagerBalanceValues(
        normalizeManagerState({
          ...manager,
          assignedShaftId: manager.assignedShaftId ?? null
        }),
        this.balance,
        hiredCountBeforeThis
      );
    });

    for (const manager of managers) {
      manager.isAssigned = false;
      if (manager.area === "mineShaft") {
        manager.assignedShaftId = null;
      }
    }

    const assignedByArea = managerState?.assignedManagerIdsByArea ?? {
      mineShaft: null,
      elevator: null,
      warehouse: null
    };
    for (const area of managerAreas) {
      if (area === "mineShaft") {
        continue;
      }

      const assignedId = assignedByArea[area];

      if (assignedId === null) {
        continue;
      }

      const manager = managers.find((entry) => entry.id === assignedId && entry.area === area);

      if (manager !== undefined) {
        manager.isAssigned = true;
      }
    }

    const assignedByShaft = managerState?.assignedManagerIdsByShaft ?? {};
    const shaftIds = new Set<number>(mine.mineShafts.map((shaft) => shaft.shaftId));

    for (const [shaftIdRaw, managerId] of Object.entries(assignedByShaft)) {
      const shaftId = Number(shaftIdRaw);

      if (!Number.isInteger(shaftId) || !shaftIds.has(shaftId) || managerId === null) {
        continue;
      }

      const manager = managers.find((entry) => entry.id === managerId && entry.area === "mineShaft");

      if (manager !== undefined) {
        manager.isAssigned = true;
        manager.assignedShaftId = shaftId;
      }
    }

    if (!managers.some((manager) => manager.area === "mineShaft" && manager.isAssigned)) {
      const fallbackManagerId = assignedByArea.mineShaft;

      if (fallbackManagerId !== null) {
        const manager = managers.find((entry) => entry.id === fallbackManagerId && entry.area === "mineShaft");

        if (manager !== undefined) {
          manager.isAssigned = true;
          manager.assignedShaftId = 1;
        }
      }
    }

    for (const manager of managers) {
      if (!manager.isAssigned) {
        manager.isActive = false;
        manager.remainingActiveTime = 0;
      } else if (manager.isActive && manager.remainingActiveTime <= EPSILON) {
        manager.isActive = false;
        manager.remainingActiveTime = 0;
      }

      if (manager.area === "mineShaft" && manager.assignedShaftId !== null) {
        const shaft = this.getMineShaftById(manager.assignedShaftId);

        if (shaft === undefined || !shaft.isUnlocked) {
          manager.isAssigned = false;
          manager.assignedShaftId = null;
          manager.isActive = false;
          manager.remainingActiveTime = 0;
        }
      }
    }

    this.ownedManagers = managers;
    this.refreshShaftManagerMetadata();
  }

  private refreshShaftManagerMetadata(): void {
    for (const shaft of this.mineShafts) {
      const manager = this.getAssignedMineManagerForShaft(shaft.shaftId);
      shaft.assignedManagerId = manager?.id ?? null;

      if (manager !== undefined) {
        shaft.activeManagerAbilityState = {
          isActive: manager.isActive,
          abilityType: manager.abilityType,
          remainingActiveTime: manager.remainingActiveTime,
          remainingCooldownTime: manager.remainingCooldownTime
        };
      } else {
        shaft.activeManagerAbilityState = null;
      }
    }
  }

  private syncAllManagerEffects(events?: SimulationEvent[]): void {
    for (const shaft of this.mineShafts) {
      this.syncMineShaftStats(shaft.shaftId, events);
    }

    this.syncAreaStats("elevator", events);
    this.syncAreaStats("warehouse", events);
    this.refreshShaftManagerMetadata();
  }

  private syncAreaStats(area: Exclude<ManagerArea, "mineShaft">, events?: SimulationEvent[]): void {
    switch (area) {
      case "elevator": {
        const previousStats = this.elevator.stats;
        const nextStats = this.getEffectiveElevatorStats();
        this.elevator.applyStats(nextStats);

        if (events !== undefined && !areStatsEqual(previousStats, this.elevator.stats)) {
          this.emit(
            {
              type: "statsChanged",
              target: "elevator",
              previousStats,
              currentStats: this.elevator.stats
            },
            events
          );
        }

        return;
      }
      case "warehouse": {
        const previousStats = this.warehouse.stats;
        const nextStats = this.getEffectiveWarehouseStats();
        this.warehouse.applyStats(nextStats);

        if (events !== undefined && !areStatsEqual(previousStats, this.warehouse.stats)) {
          this.emit(
            {
              type: "statsChanged",
              target: "warehouse",
              previousStats,
              currentStats: this.warehouse.stats
            },
            events
          );
        }

        return;
      }
    }
  }

  private syncMineShaftStats(shaftId: number, events?: SimulationEvent[]): void {
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      return;
    }

    const previousStats = shaft.stats;
    const nextStats = this.getEffectiveMineShaftStats(shaftId);
    shaft.applyStats(nextStats);

    if (events !== undefined && !areStatsEqual(previousStats, shaft.stats)) {
      this.emit(
        {
          type: "statsChanged",
          target: "mineShaft",
          shaftId,
          previousStats,
          currentStats: shaft.stats
        },
        events
      );
    }
  }

  private getEffectiveMineShaftStats(shaftId: number): MineShaftStats {
    const baseStats = this.baseMineShaftStatsByShaftId[shaftId];

    if (baseStats === undefined) {
      throw new Error(`Missing base stats for mine shaft ${shaftId}.`);
    }

    const manager = this.getActiveAssignedMineManager(shaftId);

    if (manager === undefined || manager.abilityType === "upgradeCostReduction") {
      return baseStats;
    }

    const multiplier = manager.abilityMultiplier;
    const cycleTimeSeconds = roundForState(baseStats.cycleTimeSeconds / multiplier);

    return {
      ...baseStats,
      cycleTimeSeconds,
      throughputPerSecond: roundForState(baseStats.orePerCycle / cycleTimeSeconds)
    };
  }

  private getEffectiveElevatorStats(): ElevatorStats {
    const manager = this.getActiveAssignedManager("elevator");

    if (manager === undefined || manager.abilityType === "upgradeCostReduction") {
      return this.baseElevatorStats;
    }

    let loadCapacity = this.baseElevatorStats.loadCapacity;
    let tripTimeSeconds = this.baseElevatorStats.tripTimeSeconds;

    if (manager.abilityType === "loadExpansion") {
      loadCapacity = roundForState(loadCapacity * manager.abilityMultiplier);
    } else {
      tripTimeSeconds = roundForState(tripTimeSeconds / manager.abilityMultiplier);
    }

    return {
      ...this.baseElevatorStats,
      loadCapacity,
      tripTimeSeconds,
      throughputPerSecond: roundForState(loadCapacity / tripTimeSeconds)
    };
  }

  private getEffectiveWarehouseStats(): WarehouseStats {
    const manager = this.getActiveAssignedManager("warehouse");

    if (manager === undefined || manager.abilityType === "upgradeCostReduction") {
      return this.baseWarehouseStats;
    }

    let storageCapacity = this.baseWarehouseStats.storageCapacity;
    let sellCapacityPerCycle = this.baseWarehouseStats.sellCapacityPerCycle;
    let sellCycleTimeSeconds = this.baseWarehouseStats.sellCycleTimeSeconds;

    if (manager.abilityType === "loadExpansion") {
      storageCapacity = roundForState(storageCapacity * manager.abilityMultiplier);
      sellCapacityPerCycle = roundForState(sellCapacityPerCycle * manager.abilityMultiplier);
    } else {
      sellCycleTimeSeconds = roundForState(sellCycleTimeSeconds / manager.abilityMultiplier);
    }

    return {
      ...this.baseWarehouseStats,
      storageCapacity,
      sellCapacityPerCycle,
      sellCycleTimeSeconds,
      throughputPerSecond: roundForState(sellCapacityPerCycle / sellCycleTimeSeconds)
    };
  }

  private tickManagerTimers(deltaSeconds: number, events: SimulationEvent[]): void {
    const changedGlobalAreas = new Set<Exclude<ManagerArea, "mineShaft">>();
    const changedMineShafts = new Set<number>();

    for (const manager of this.ownedManagers) {
      if (!manager.isOwned) {
        continue;
      }

      if (manager.isAssigned && manager.isActive) {
        const previousActiveTime = manager.remainingActiveTime;
        manager.remainingActiveTime = roundForState(Math.max(0, manager.remainingActiveTime - deltaSeconds));

        if (manager.remainingActiveTime <= EPSILON) {
          manager.isActive = false;
          manager.remainingActiveTime = 0;
          
          const overshoot = Math.max(0, deltaSeconds - previousActiveTime);
          manager.remainingCooldownTime = roundForState(Math.max(0, manager.cooldownSeconds - overshoot));

          this.emit(
            {
              type: "managerAbilityExpired",
              manager: normalizeManagerState(manager)
            },
            events
          );

          if (manager.remainingCooldownTime > EPSILON) {
            this.emit(
              {
                type: "managerCooldownStarted",
                manager: normalizeManagerState(manager)
              },
              events
            );
          } else {
            this.emit(
              {
                type: "managerCooldownFinished",
                manager: normalizeManagerState(manager)
              },
              events
            );
          }

          if (manager.area === "mineShaft" && manager.assignedShaftId !== null) {
            changedMineShafts.add(manager.assignedShaftId);
          } else if (manager.area !== "mineShaft") {
            changedGlobalAreas.add(manager.area);
          }
        }
      } else if (manager.remainingCooldownTime > EPSILON) {
        manager.remainingCooldownTime = roundForState(Math.max(0, manager.remainingCooldownTime - deltaSeconds));

        if (manager.remainingCooldownTime <= EPSILON) {
          manager.remainingCooldownTime = 0;
          this.emit(
            {
              type: "managerCooldownFinished",
              manager: normalizeManagerState(manager)
            },
            events
          );
        }
      }
    }

    for (const shaftId of changedMineShafts) {
      this.syncMineShaftStats(shaftId, events);
    }

    for (const area of changedGlobalAreas) {
      this.syncAreaStats(area, events);
    }

    this.refreshShaftManagerMetadata();
  }

  private accumulateInactiveMineOfflineCash(deltaSeconds: number): void {
    if (deltaSeconds <= 0) {
      return;
    }

    for (const definition of this.mineDefinitions) {
      if (definition.mineId === this.activeMineId) {
        continue;
      }

      const mine = this.minesById[definition.mineId];
      const result = this.calculateOfflineProductionForMine(mine, deltaSeconds);

      if (mine.isUnlocked) {
        mine.pendingOfflineSeconds = roundForState(mine.pendingOfflineSeconds + deltaSeconds);
      }

      if (result.moneyEarned <= EPSILON) {
        continue;
      }

      mine.pendingOfflineCash = roundForState(mine.pendingOfflineCash + result.moneyEarned);
      mine.pendingOfflineOreSold = roundForState(mine.pendingOfflineOreSold + result.oreSold);
    }
  }

  private calculateOfflineProductionForMine(
    mine: MineRuntime,
    offlineSeconds: number
  ): { moneyEarned: number; oreSold: number } {
    if (!mine.isUnlocked || offlineSeconds <= 0) {
      return { moneyEarned: 0, oreSold: 0 };
    }

    return this.withMineContext(mine.mineId, () => {
      const assignedByShaft = this.getAssignedManagerIdsByShaft();
      const activeMineThroughput = this.mineShafts
        .filter((shaft) => shaft.isUnlocked && assignedByShaft[shaft.shaftId] !== null)
        .reduce((sum, shaft) => sum + shaft.stats.throughputPerSecond, 0);

      const assignedArea = this.getAssignedManagerIdsByArea();
      if (activeMineThroughput <= EPSILON || assignedArea.elevator === null || assignedArea.warehouse === null) {
        return { moneyEarned: 0, oreSold: 0 };
      }

      const bottleneckThroughput = Math.min(
        activeMineThroughput,
        this.elevator.stats.throughputPerSecond,
        this.warehouse.stats.throughputPerSecond
      );
      const oreSold = roundForState(bottleneckThroughput * offlineSeconds * (1 / this.balance.economy.offlineEarningsDivisor));
      const moneyEarned = roundForState(oreSold * this.balance.economy.sellPricePerOre);

      return { moneyEarned, oreSold };
    });
  }

  public applyOfflineProgress(savedAt: number, loadedAt: number): OfflineProgressResult | null {
    const offlineMs = loadedAt - savedAt;
    let offlineSeconds = offlineMs > 0 ? offlineMs / 1000 : 0;

    const maxOfflineSeconds = 7 * 24 * 60 * 60;
    if (offlineSeconds > maxOfflineSeconds) {
      offlineSeconds = maxOfflineSeconds;
    }

    if (offlineSeconds <= 0) {
      return null;
    }

    let totalMoneyEarned = 0;
    let totalOreSold = 0;

    for (const definition of this.mineDefinitions) {
      const mine = this.minesById[definition.mineId];
      const result = this.calculateOfflineProductionForMine(mine, offlineSeconds);

      if (result.moneyEarned <= EPSILON) {
        continue;
      }

      mine.pendingOfflineSeconds = roundForState(mine.pendingOfflineSeconds + offlineSeconds);
      mine.pendingOfflineCash = roundForState(mine.pendingOfflineCash + result.moneyEarned);
      mine.pendingOfflineOreSold = roundForState(mine.pendingOfflineOreSold + result.oreSold);

      totalMoneyEarned = roundForState(totalMoneyEarned + result.moneyEarned);
      totalOreSold = roundForState(totalOreSold + result.oreSold);
    }

    this.tickManagerTimers(offlineSeconds, []);
    this.updateBlockades(offlineSeconds, []);

    if (totalMoneyEarned <= EPSILON) {
      return null;
    }

    return {
      mineId: this.activeMineId,
      offlineSeconds,
      moneyEarned: totalMoneyEarned,
      oreSold: totalOreSold
    };
  }

  private emitActionFailed(
    action: string,
    reason: SimulationActionFailureReason,
    message: string,
    events: SimulationEvent[],
    shaftId?: number,
    mineId: MineId = this.activeMineId
  ): void {
    this.emit(
      {
        type: "actionFailed",
        action,
        reason,
        message,
        shaftId,
        mineId
      },
      events
    );
  }

  private emit(event: SimulationEventInput, events: SimulationEvent[]): SimulationEvent {
    const eventWithMineId = this.attachMineIdToEvent(event);
    const fullEvent = {
      ...eventWithMineId,
      sequence: ++this.eventSequence,
      timeSeconds: this.timeSeconds
    } as SimulationEvent;

    events.push(fullEvent);
    this.signals.publish(fullEvent);
    return fullEvent;
  }

  private attachMineIdToEvent(event: SimulationEventInput): SimulationEventInput {
    if ("mineId" in event && typeof event.mineId === "string" && event.mineId.length > 0) {
      return event;
    }

    switch (event.type) {
      case "miningCycleStarted":
      case "actionFailed":
      case "oreProduced":
      case "superCashAwarded":
      case "superCashSpent":
      case "upgradePurchased":
      case "mineShaftUpgradePurchased":
      case "statsChanged":
      case "storageChanged":
      case "mineShaftStorageChanged":
      case "mineShaftUnlocked":
      case "managerAssignedToShaft":
      case "managerUnassignedFromShaft":
      case "elevatorArrivedAtShaft":
      case "elevatorLoadedFromShaft":
      case "elevatorSkippedShaft":
      case "automationStateChanged":
      case "depthBlockadeRemovalStarted":
      case "depthBlockadeRemoved":
      case "depthBlockadeSkipped":
        return {
          ...event,
          mineId: this.activeMineId
        } as SimulationEventInput;
      default:
        return event;
    }
  }

  private emitCommandRejected(
    command: SimulationCommandName,
    reason: SimulationCommandRejectionReason,
    events: SimulationEvent[]
  ): void {
    this.emit(
      {
        type: "commandRejected",
        command,
        reason,
        message: getCommandRejectionMessage(command, reason)
      },
      events
    );
  }

  private getMineShaftById(shaftId: number): MineShaft | undefined {
    return this.mineShafts.find((shaft) => shaft.shaftId === shaftId);
  }

  private getTotalProducedOre(mine: MineRuntime = this.getActiveMine()): number {
    return this.withMineContext(mine.mineId, () =>
      roundForState(this.mineShafts.reduce((sum, shaft) => sum + shaft.totalProducedOre, 0))
    );
  }

  removeDepthBlockade(blockadeId: string): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const blockade = this.blockades[blockadeId];

    if (!blockade) {
      this.emitActionFailed("removeDepthBlockade", "invalid_blockade", "This blockade does not exist.", events);
      return events;
    }

    if (blockade.isRemoved) {
      this.emitActionFailed("removeDepthBlockade", "already_unlocked", "This blockade is already removed.", events);
      return events;
    }

    if (blockade.isRemoving) {
      this.emitActionFailed("removeDepthBlockade", "already_removing", "This blockade is already being removed.", events);
      return events;
    }

    const previousShaft = this.getMineShaftById(blockade.afterShaftId);
    if (previousShaft && !previousShaft.isUnlocked) {
      this.emitActionFailed("removeDepthBlockade", "previous_shaft_locked", "You must unlock the previous shaft first.", events);
      return events;
    }

    if (this.money + Number.EPSILON < blockade.removalCost) {
      this.emitActionFailed("removeDepthBlockade", "not_enough_money", "Not enough money to remove blockade.", events);
      return events;
    }

    const previousMoney = this.money;
    this.money = roundForState(this.money - blockade.removalCost);
    blockade.isRemoving = true;
    blockade.remainingRemovalSeconds = blockade.removalDurationSeconds;

    this.emit({
      type: "depthBlockadeRemovalStarted",
      blockadeId,
      removalCost: blockade.removalCost,
      durationSeconds: blockade.removalDurationSeconds
    } as any, events);

    this.emit({
      type: "moneyChanged",
      previousMoney,
      currentMoney: this.money,
      delta: roundForState(this.money - previousMoney)
    }, events);

    return events;
  }

  skipDepthBlockade(blockadeId: string): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const blockade = this.blockades[blockadeId];

    if (!blockade) {
      this.emitActionFailed("skipDepthBlockade", "invalid_blockade", "This blockade does not exist.", events);
      return events;
    }

    if (blockade.isRemoved) {
      this.emitActionFailed("skipDepthBlockade", "already_unlocked", "This blockade is already removed.", events);
      return events;
    }

    if (!blockade.isRemoving) {
      this.emitActionFailed("skipDepthBlockade", "blockade_timer_not_started", "Start clearing this blockade before skipping the timer.", events);
      return events;
    }

    const skippedSeconds = roundForState(blockade.remainingRemovalSeconds);
    const superCashCost = getDepthBlockadeSkipCost(skippedSeconds);

    if (this.superCash + Number.EPSILON < superCashCost) {
      this.emitActionFailed("skipDepthBlockade", "not_enough_super_cash", "Not enough Super Cash to skip this blockade.", events);
      return events;
    }

    this.spendSuperCash(superCashCost, "depthBlockadeSkip", events);
    blockade.remainingRemovalSeconds = 0;
    blockade.isRemoving = false;
    blockade.isRemoved = true;

    this.emit({
      type: "depthBlockadeSkipped",
      blockadeId,
      skippedSeconds,
      superCashCost
    }, events);

    this.emit({
      type: "depthBlockadeRemoved",
      blockadeId
    } as any, events);

    this.syncReachability(events);

    return events;
  }

  isDepthGroupVisible(depthGroup: number): boolean {
    if (depthGroup <= 1) return true;
    const blockadeAfterShaft = (depthGroup - 1) * 5;
    const blockade = Object.values(this.blockades).find(b => b.afterShaftId === blockadeAfterShaft);
    if (!blockade) return true;
    
    // Visible if previous group's last shaft is unlocked
    const lastShaftOfPrevGroup = this.getMineShaftById(blockadeAfterShaft);
    return lastShaftOfPrevGroup ? lastShaftOfPrevGroup.isUnlocked : false;
  }

  isDepthGroupReachable(depthGroup: number): boolean {
    if (depthGroup <= 1) return true;
    const blockadeAfterShaft = (depthGroup - 1) * 5;
    const blockade = Object.values(this.blockades).find(b => b.afterShaftId === blockadeAfterShaft);
    return blockade ? blockade.isRemoved : true;
  }

  isShaftVisibleForPurchase(shaftId: number): boolean {
    const shaft = this.getMineShaftById(shaftId);
    if (!shaft) return false;
    
    if (shaft.isUnlocked) return true;
    
    // First shaft of a group is visible if the blockade before it is removed or if it's group 1
    if ((shaftId - 1) % 5 === 0) {
      return this.isDepthGroupReachable(shaft.depthGroup);
    }
    
    // Other shafts are visible if the previous shaft is unlocked
    const previousShaft = this.getMineShaftById(shaftId - 1);
    return previousShaft ? previousShaft.isUnlocked : false;
  }

  isShaftReachable(shaftId: number): boolean {
    const shaft = this.getMineShaftById(shaftId);
    if (!shaft) return false;
    return this.isDepthGroupReachable(shaft.depthGroup);
  }

  private updateBlockades(deltaSeconds: number, events: SimulationEvent[]): void {
    for (const blockade of Object.values(this.blockades)) {
      if (blockade.isRemoving && !blockade.isRemoved) {
        blockade.remainingRemovalSeconds = roundForState(Math.max(0, blockade.remainingRemovalSeconds - deltaSeconds));
        if (blockade.remainingRemovalSeconds <= EPSILON) {
          blockade.isRemoving = false;
          blockade.isRemoved = true;
          
          this.emit({
            type: "depthBlockadeRemoved",
            blockadeId: blockade.blockadeId
          } as any, events);
          
          this.syncReachability(events);
        }
      }
    }
  }

  private syncReachability(events: SimulationEvent[] = []): void {
    for (const shaft of this.mineShafts) {
      const reachable = this.isShaftReachable(shaft.shaftId);
      if (shaft.isReachable !== reachable) {
        shaft.isReachable = reachable;
        this.emit({
          type: "shaftReachabilityChanged",
          shaftId: shaft.shaftId,
          isReachable: reachable
        } as any, events);
      }
    }
  }
}

function getCommandRejectionMessage(command: SimulationCommandName, reason: SimulationCommandRejectionReason): string {
  if (reason === "busy") {
    return "Action already in progress.";
  }

  if (reason === "inactive") {
    return "Miner is not active.";
  }

  if (reason === "insufficientFunds") {
    if (command === "purchaseMineShaftUpgrade" || command === "upgradeMineShaft") {
      return "Not enough money for Mine Shaft upgrade.";
    }

    if (command === "purchaseElevatorUpgrade") {
      return "Not enough money for Elevator upgrade.";
    }

    if (command === "purchaseWarehouseUpgrade") {
      return "Not enough money for Warehouse upgrade.";
    }

    return "Not enough money.";
  }

  if (reason === "storageFull") {
    return "Pickup box is full.";
  }

  if (reason === "warehouseFull") {
    return "Warehouse is full.";
  }

  if (reason === "noOre") {
    return command === "startElevatorCycle" ? "No ore in the shafts." : "No ore in the warehouse.";
  }

  if (reason === "shaftLocked") {
    return "This shaft is still locked.";
  }

  if (reason === "maxLevelReached") {
    return "Max level reached.";
  }

  return "Action is unavailable.";
}

function getUpgradeCommandName(target: UpgradeTarget): SimulationCommandName {
  switch (target) {
    case "mineShaft":
      return "purchaseMineShaftUpgrade";
    case "elevator":
      return "purchaseElevatorUpgrade";
    case "warehouse":
      return "purchaseWarehouseUpgrade";
  }
}

function areStatsEqual(left: object, right: object): boolean {
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (leftRecord[key] !== rightRecord[key]) {
      return false;
    }
  }

  return true;
}

function requirePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid savegame value: ${fieldName} must be a positive integer.`);
  }

  return value;
}

function requireNonNegativeInteger(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid savegame value: ${fieldName} must be a non-negative integer.`);
  }

  return value;
}

function requireNonNegativeNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid savegame value: ${fieldName} must be a non-negative finite number.`);
  }

  return value;
}

function requireElevatorState(value: Elevator["state"]): Elevator["state"] {
  switch (value) {
    case "idle":
    case "moving":
    case "unloading":
    case "returning":
      return value;
    default:
      throw new Error(`Invalid savegame value: elevator state ${String(value)} is not supported.`);
  }
}

function requireWarehouseState(value: Warehouse["state"]): Warehouse["state"] {
  switch (value) {
    case "idle":
    case "selling":
      return value;
    default:
      throw new Error(`Invalid savegame value: warehouse state ${String(value)} is not supported.`);
  }
}

function deriveShaftStateFromResources(storedOre: number, capacity: number): MineShaftRuntimeState["state"] {
  return storedOre >= capacity - EPSILON ? "blocked" : "idle";
}
