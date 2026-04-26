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
  countManagersByArea,
  createPurchasedManager,
  getAutomationEnabledByArea,
  getManagerHireCost,
  isManagerArea,
  isManagerSystemLocked,
  managerAreas,
  normalizeManagerState,
  type ManagerState
} from "./managers.ts";
import { SimulationSignalBus } from "./events.ts";
import { SAVEGAME_VERSION, normalizeSaveGameRecord } from "./savegame.ts";
import type { SaveGameRecord, SaveGameRecordCompatible, SaveGameStateV3 } from "./savegame.ts";
import type {
  SimulationActionFailureReason,
  SimulationCommandName,
  SimulationCommandRejectionReason,
  SimulationEvent,
  SimulationEventHandler,
  SimulationEventInput,
  SimulationEventType
} from "./events.ts";
import type { BlockadeRuntimeState, GameState, MineShaftRuntimeState, OfflineProgressResult } from "./types.ts";
import {
  getUpgradePreview,
  purchaseUpgrade as purchaseSimulationUpgrade,
  type UpgradeBuyMode,
  type UpgradeTarget
} from "./upgrades.ts";

export interface MineSimulationOptions {
  fixedStepSeconds?: number;
}

export class MineSimulation {
  readonly balance: BalanceConfig;
  readonly fixedStepSeconds: number;
  readonly mineShafts: MineShaft[];
  readonly mineShaft: MineShaft;
  readonly elevator: Elevator;
  readonly warehouse: Warehouse;

  private readonly signals = new SimulationSignalBus();
  private accumulatorSeconds = 0;
  private eventSequence = 0;
  private timeSeconds = 0;
  private money: number;
  private moneyEarned = 0;
  private baseMineShaftStatsByShaftId: Record<number, MineShaftStats> = {};
  private baseElevatorStats: ElevatorStats;
  private baseWarehouseStats: WarehouseStats;
  private ownedManagers: ManagerState[] = [];
  private blockades: Record<string, BlockadeRuntimeState> = {};

  constructor(balance: BalanceConfig, options: MineSimulationOptions = {}) {
    assertValidBalance(balance);

    const fixedStepSeconds = options.fixedStepSeconds ?? 0.1;

    if (!Number.isFinite(fixedStepSeconds) || fixedStepSeconds <= 0) {
      throw new Error("fixedStepSeconds must be greater than 0.");
    }

    this.balance = balance;
    this.fixedStepSeconds = fixedStepSeconds;
    this.money = roundForState(balance.economy.startingMoney);

    const mineShaftDefinitions = getMineShaftConfigEntries(balance);
    this.mineShafts = mineShaftDefinitions.map((definition) => this.createMineShaftEntity(definition));
    this.mineShaft = this.mineShafts[0];

    this.baseElevatorStats = getElevatorStats(balance, balance.elevator.startingLevel);
    this.baseWarehouseStats = getWarehouseStats(balance, balance.warehouse.startingLevel);

    this.elevator = new Elevator(this.baseElevatorStats, balance.startingStorage.startingElevatorStoredOre);
    this.warehouse = new Warehouse(this.baseWarehouseStats, balance.startingStorage.startingWarehouseStoredOre);

    this.initializeBlockades();
  }

  private initializeBlockades(): void {
    if (this.balance.mineShaftBlockades?.enabled) {
      for (const b of this.balance.mineShaftBlockades.blockades) {
        const id = `blockade_${b.afterShaft}_${b.unlocksShaft}`;
        this.blockades[id] = {
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
  }

  exportSaveGame(savedAt = Date.now()): SaveGameRecord {
    const ownedManagers = this.getOwnedManagersSnapshot();
    const firstShaft = this.mineShaft;

    return {
      version: SAVEGAME_VERSION,
      savedAt,
      state: {
        timeSeconds: roundForState(this.timeSeconds),
        money: roundForState(this.money),
        levels: {
          mineShaft: firstShaft.stats.level,
          elevator: this.elevator.stats.level,
          warehouse: this.warehouse.stats.level
        },
        resources: {
          mineShaft: roundForState(firstShaft.storedOre),
          elevator: roundForState(this.elevator.carriedOre),
          warehouse: roundForState(this.warehouse.storedOre)
        },
        totals: {
          producedOre: roundForState(this.getTotalProducedOre()),
          collectedByElevatorOre: roundForState(this.elevator.totalCollectedOre),
          transportedOre: roundForState(this.elevator.totalTransportedOre),
          soldOre: roundForState(this.warehouse.totalSoldOre),
          moneyEarned: roundForState(this.moneyEarned)
        },
        managers: {
          hireCountsByArea: countManagersByArea(ownedManagers),
          assignedManagerIdsByArea: this.getAssignedManagerIdsByArea(ownedManagers),
          assignedManagerIdsByShaft: this.getAssignedManagerIdsByShaft(ownedManagers),
          ownedManagers
        },
        mineShafts: this.mineShafts.map((shaft) => ({
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
        blockades: Object.values(this.blockades).map(b => ({ ...b })),
        entities: {
          mineShaft: {
            state: firstShaft.state,
            cycleProgressSeconds: roundForState(firstShaft.cycleProgressSeconds),
            storedOre: roundForState(firstShaft.storedOre)
          },
          elevator: {
            state: this.elevator.state,
            carriedOre: roundForState(this.elevator.carriedOre),
            remainingTripSeconds: roundForState(this.elevator.remainingTripSeconds)
          },
          warehouse: {
            state: this.warehouse.state,
            sellProgressSeconds: roundForState(this.warehouse.sellProgressSeconds),
            storedOre: roundForState(this.warehouse.storedOre)
          }
        }
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
    const firstShaftLevel = requirePositiveInteger(state.levels.mineShaft, "state.levels.mineShaft");
    const elevatorLevel = requirePositiveInteger(state.levels.elevator, "state.levels.elevator");
    const warehouseLevel = requirePositiveInteger(state.levels.warehouse, "state.levels.warehouse");

    this.timeSeconds = roundForState(requireNonNegativeNumber(state.timeSeconds, "state.timeSeconds"));
    this.money = roundForState(requireNonNegativeNumber(state.money, "state.money"));
    this.moneyEarned = roundForState(requireNonNegativeNumber(state.totals.moneyEarned, "state.totals.moneyEarned"));
    this.accumulatorSeconds = 0;
    this.eventSequence = 0;

    this.baseElevatorStats = getElevatorStats(this.balance, elevatorLevel);
    this.baseWarehouseStats = getWarehouseStats(this.balance, warehouseLevel);
    this.elevator.applyStats(this.getEffectiveElevatorStats());
    this.warehouse.applyStats(this.getEffectiveWarehouseStats());

    const mineShaftsById = new Map<number, SaveGameStateV3["mineShafts"][number]>();

    for (const shaftState of state.mineShafts) {
      mineShaftsById.set(shaftState.shaftId, shaftState);
    }

    for (const shaft of this.mineShafts) {
      const saved = mineShaftsById.get(shaft.shaftId);
      const fallbackLevel = shaft.shaftId === 1 ? firstShaftLevel : this.balance.mineShaft.startingLevel;
      const level = requirePositiveInteger(saved?.level ?? fallbackLevel, `state.mineShafts[${shaft.shaftId}].level`);
      const isUnlocked = saved?.isUnlocked ?? shaft.shaftId === 1;

      this.baseMineShaftStatsByShaftId[shaft.shaftId] = this.createMineShaftStats(shaft.shaftId, level);

      if (isUnlocked) {
        shaft.unlock();
      } else {
        shaft.lock();
      }

      shaft.applyStats(this.getEffectiveMineShaftStats(shaft.shaftId));

      const savedStoredOre = saved?.storedOre ?? (shaft.shaftId === 1 ? state.resources.mineShaft : 0);
      const savedProgress = saved?.cycleProgressSeconds ?? (shaft.shaftId === 1 ? state.entities.mineShaft.cycleProgressSeconds : 0);

      shaft.storedOre = isUnlocked
        ? roundForState(Math.min(requireNonNegativeNumber(savedStoredOre, `state.mineShafts[${shaft.shaftId}].storedOre`), shaft.stats.bufferCapacity))
        : 0;
      shaft.cycleProgressSeconds = isUnlocked
        ? roundForState(Math.min(requireNonNegativeNumber(savedProgress, `state.mineShafts[${shaft.shaftId}].cycleProgressSeconds`), Math.max(shaft.stats.cycleTimeSeconds - EPSILON, 0)))
        : 0;
      shaft.state = isUnlocked ? saved?.state ?? deriveShaftStateFromResources(shaft.storedOre, shaft.stats.bufferCapacity) : "inactive";
      shaft.totalProducedOre = 0;
      shaft.assignedManagerId = saved?.assignedManagerId ?? null;
      shaft.activeManagerAbilityState = saved?.activeManagerAbilityState ?? null;
      shaft.isReachable = this.isShaftReachable(shaft.shaftId);
    }

    if (state.blockades) {
      for (const b of state.blockades) {
        if (this.blockades[b.blockadeId]) {
          this.blockades[b.blockadeId] = { ...b };
        }
      }
    }
    this.syncReachability();

    this.mineShaft.totalProducedOre = roundForState(requireNonNegativeNumber(state.totals.producedOre, "state.totals.producedOre"));

    this.elevator.state = requireElevatorState(state.entities.elevator.state);
    this.elevator.carriedOre = roundForState(requireNonNegativeNumber(state.resources.elevator, "state.resources.elevator"));
    this.elevator.remainingTripSeconds = roundForState(
      requireNonNegativeNumber(state.entities.elevator.remainingTripSeconds, "state.entities.elevator.remainingTripSeconds")
    );
    this.elevator.totalCollectedOre = roundForState(
      requireNonNegativeNumber(state.totals.collectedByElevatorOre, "state.totals.collectedByElevatorOre")
    );
    this.elevator.totalTransportedOre = roundForState(requireNonNegativeNumber(state.totals.transportedOre, "state.totals.transportedOre"));

    this.warehouse.state = requireWarehouseState(state.entities.warehouse.state);
    this.warehouse.storedOre = roundForState(requireNonNegativeNumber(state.resources.warehouse, "state.resources.warehouse"));
    this.warehouse.sellProgressSeconds = roundForState(
      requireNonNegativeNumber(state.entities.warehouse.sellProgressSeconds, "state.entities.warehouse.sellProgressSeconds")
    );
    this.warehouse.totalSoldOre = roundForState(requireNonNegativeNumber(state.totals.soldOre, "state.totals.soldOre"));

    this.restoreManagersFromSave(state);
    this.syncAllManagerEffects();

    return this.applyOfflineProgress(record.savedAt, loadedAt);
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

  manualMineAction(shaftId = 1): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      this.emitActionFailed("manualMineAction", "invalid_shaft", "This shaft does not exist.", events, shaftId);
      return events;
    }

    if (!shaft.isUnlocked) {
      this.emitActionFailed("manualMineAction", "shaft_locked", "This shaft is still locked.", events, shaftId);
      return events;
    }

    const result = shaft.startCycle();

    if (!result.started) {
      if (result.reason === "shaftLocked") {
        this.emitActionFailed("manualMineAction", "shaft_locked", "This shaft is still locked.", events, shaftId);
      } else {
        this.emitCommandRejected("startMiningCycle", result.reason, events);
      }

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

    return events;
  }

  unlockMineShaft(shaftId: number): SimulationEvent[] {
    const events: SimulationEvent[] = [];
    const shaft = this.getMineShaftById(shaftId);

    if (shaft === undefined) {
      this.emitActionFailed("unlockMineShaft", "invalid_shaft", "This shaft does not exist.", events, shaftId);
      return events;
    }

    if (shaft.isUnlocked) {
      this.emitActionFailed("unlockMineShaft", "already_unlocked", "This shaft is already unlocked.", events, shaftId);
      return events;
    }

    const previousShaft = this.getMineShaftById(shaftId - 1);

    if (previousShaft !== undefined && !previousShaft.isUnlocked) {
      this.emitActionFailed("unlockMineShaft", "previous_shaft_locked", "The previous shaft is still locked.", events, shaftId);
      return events;
    }

    if (this.money + Number.EPSILON < shaft.unlockCost) {
      this.emitActionFailed("unlockMineShaft", "not_enough_money", "Not enough money to unlock.", events, shaftId);
      return events;
    }

    if (!this.isShaftReachable(shaftId)) {
      this.emitActionFailed("unlockMineShaft", "depth_blockade_not_removed", "The depth blockade is still in place.", events, shaftId);
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
    const mineShaftUpgradeById: Record<number, GameState["upgrades"]["mineShaft"]> = {};
    const mineShaftLevels: Record<number, number> = {};
    const mineShaftStoredOre: Record<number, number> = {};
    const mineShaftCurrentValues: Record<number, MineShaftStats> = {};
    const mineShaftBaseValues: Record<number, MineShaftStats> = {};
    const mineShaftEntities: Record<number, MineShaftRuntimeState> = {};

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
        previewStats: preview.previewStats as MineShaftStats
      };

      mineShaftLevels[shaft.shaftId] = shaft.stats.level;
      mineShaftStoredOre[shaft.shaftId] = roundForState(shaft.storedOre);
      mineShaftCurrentValues[shaft.shaftId] = shaft.stats;
      mineShaftBaseValues[shaft.shaftId] = this.baseMineShaftStatsByShaftId[shaft.shaftId];

      mineShaftEntities[shaft.shaftId] = {
        shaftId: shaft.shaftId,
        displayName: shaft.displayName,
        depthIndex: shaft.depthIndex,
        isUnlocked: shaft.isUnlocked,
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
        activeManagerAbilityState: shaft.activeManagerAbilityState,
        depthGroup: shaft.depthGroup,
        isReachable: shaft.isReachable
      };
    }

    const firstShaft = this.mineShaft;

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

    const state: GameState = {
      timeSeconds: roundForState(this.timeSeconds),
      money: roundForState(this.money),
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
          producedOre: roundForState(this.getTotalProducedOre()),
          collectedByElevatorOre: roundForState(this.elevator.totalCollectedOre),
          transportedOre: roundForState(this.elevator.totalTransportedOre),
          soldOre: roundForState(this.warehouse.totalSoldOre),
          moneyEarned: roundForState(this.moneyEarned)
        }
      },
      upgrades: {
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
          previewStats: elevatorUpgrade.previewStats as ElevatorStats
        },
        warehouse: {
          currentLevel: warehouseUpgrade.currentLevel,
          targetLevel: warehouseUpgrade.targetLevel,
          levelsToBuy: warehouseUpgrade.levelsToBuy,
          cost: warehouseUpgrade.cost,
          firstLevelCost: warehouseUpgrade.firstLevelCost,
          canAfford: warehouseUpgrade.affordable,
          isMaxed: warehouseUpgrade.maxed,
          previewStats: warehouseUpgrade.previewStats as WarehouseStats
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
      }
    };

    return state;
  }

  private createMineShaftEntity(definition: MineShaftConfigEntry): MineShaft {
    const startingLevel = this.balance.mineShaft.startingLevel;
    const stats = this.createMineShaftStats(definition.shaftId, startingLevel);
    this.baseMineShaftStatsByShaftId[definition.shaftId] = stats;

    const startingStoredOre = definition.shaftId === 1 ? this.balance.startingStorage.startingMineShaftStoredOre : 0;

    return new MineShaft(stats, startingStoredOre, this.balance.miner.startsActive, {
      shaftId: definition.shaftId,
      displayName: definition.displayName,
      depthIndex: definition.depthIndex,
      isUnlocked: definition.isUnlocked,
      unlockCost: definition.unlockCost,
      productionMultiplier: definition.productionMultiplier,
      upgradeCostMultiplier: definition.upgradeCostMultiplier,
      depthGroup: definition.depthGroup,
      isReachable: definition.isReachable
    });
  }

  private createMineShaftStats(shaftId: number, level: number): MineShaftStats {
    return getMineShaftStats(this.balance, level, shaftId);
  }

  private step(deltaSeconds: number, events: SimulationEvent[]): void {
    this.timeSeconds = roundForState(this.timeSeconds + deltaSeconds);

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
      this.moneyEarned = roundForState(this.moneyEarned + moneyEarned);

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
        this.baseMineShaftStatsByShaftId[shaftId] = stats as MineShaftStats;
        this.syncMineShaftStats(shaftId);
        return;
      case "elevator":
        this.baseElevatorStats = stats as ElevatorStats;
        this.syncAreaStats("elevator");
        return;
      case "warehouse":
        this.baseWarehouseStats = stats as WarehouseStats;
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

  private restoreManagersFromSave(state: SaveGameStateV3): void {
    const managers = state.managers.ownedManagers.map((manager) =>
      normalizeManagerState({
        ...manager,
        assignedShaftId: manager.assignedShaftId ?? null
      })
    );

    for (const manager of managers) {
      manager.isAssigned = false;
      if (manager.area === "mineShaft") {
        manager.assignedShaftId = null;
      }
    }

    const assignedByArea = state.managers.assignedManagerIdsByArea;
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

    const assignedByShaft = state.managers.assignedManagerIdsByShaft ?? {};
    const shaftIds = new Set<number>(this.mineShafts.map((shaft) => shaft.shaftId));

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

  private applyOfflineProgress(savedAt: number, loadedAt: number): OfflineProgressResult | null {
    const offlineMs = loadedAt - savedAt;
    let offlineSeconds = offlineMs > 0 ? offlineMs / 1000 : 0;

    const maxOfflineSeconds = 7 * 24 * 60 * 60;
    if (offlineSeconds > maxOfflineSeconds) {
      offlineSeconds = maxOfflineSeconds;
    }

    if (offlineSeconds <= 0) {
      return null;
    }

    this.tickManagerTimers(offlineSeconds, []);

    const assignedByShaft = this.getAssignedManagerIdsByShaft();
    const activeMineThroughput = this.mineShafts
      .filter((shaft) => shaft.isUnlocked && assignedByShaft[shaft.shaftId] !== null)
      .reduce((sum, shaft) => sum + shaft.stats.throughputPerSecond, 0);

    const assignedArea = this.getAssignedManagerIdsByArea();
    if (activeMineThroughput <= EPSILON || assignedArea.elevator === null || assignedArea.warehouse === null) {
      return null;
    }

    const bottleneckThroughput = Math.min(activeMineThroughput, this.elevator.stats.throughputPerSecond, this.warehouse.stats.throughputPerSecond);
    const offlineOreSold = roundForState(bottleneckThroughput * offlineSeconds * 0.1);
    const offlineMoneyEarned = roundForState(offlineOreSold * this.balance.economy.sellPricePerOre);

    if (offlineMoneyEarned <= EPSILON) {
      return null;
    }

    this.money = roundForState(this.money + offlineMoneyEarned);
    this.moneyEarned = roundForState(this.moneyEarned + offlineMoneyEarned);
    this.warehouse.totalSoldOre = roundForState(this.warehouse.totalSoldOre + offlineOreSold);
    this.elevator.totalCollectedOre = roundForState(this.elevator.totalCollectedOre + offlineOreSold);
    this.elevator.totalTransportedOre = roundForState(this.elevator.totalTransportedOre + offlineOreSold);
    
    // Distribute produced ore to shaft 1 for compatibility (totals are updated separately)
    this.mineShaft.totalProducedOre = roundForState(this.mineShaft.totalProducedOre + offlineOreSold);

    return {
      offlineSeconds,
      moneyEarned: offlineMoneyEarned,
      oreSold: offlineOreSold
    };
  }

  private emitActionFailed(
    action: string,
    reason: SimulationActionFailureReason,
    message: string,
    events: SimulationEvent[],
    shaftId?: number
  ): void {
    this.emit(
      {
        type: "actionFailed",
        action,
        reason,
        message,
        shaftId
      },
      events
    );
  }

  private emit(event: SimulationEventInput, events: SimulationEvent[]): SimulationEvent {
    const fullEvent = {
      ...event,
      sequence: ++this.eventSequence,
      timeSeconds: this.timeSeconds
    } as SimulationEvent;

    events.push(fullEvent);
    this.signals.publish(fullEvent);
    return fullEvent;
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

  private getTotalProducedOre(): number {
    return roundForState(this.mineShafts.reduce((sum, shaft) => sum + shaft.totalProducedOre, 0));
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

function requireNonNegativeNumber(value: number, fieldName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid savegame value: ${fieldName} must be a non-negative finite number.`);
  }

  return value;
}

function requireElevatorState(value: SaveGameStateV3["entities"]["elevator"]["state"]): SaveGameStateV3["entities"]["elevator"]["state"] {
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

function requireWarehouseState(value: SaveGameStateV3["entities"]["warehouse"]["state"]): SaveGameStateV3["entities"]["warehouse"]["state"] {
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
