import { MineSimulation } from "../core/index.ts";
import type {
  BalanceConfig,
  GameState,
  SaveGameRecord,
  SaveGameRepository,
  SimulationEvent,
  UpgradeBuyMode,
  UpgradeTarget,
  ManagerArea,
  ManagerAbilityType,
  ManagerRank,
  OfflineProgressResult
} from "../core/index.ts";
import { formatCurrency } from "../core/formatters.ts";
import { SaveGameController } from "./SaveGameController.ts";

export type MinerVisualState = "idle" | "pickaxe" | "carryBag" | "dropBag";
export type WarehouseWorkerVisualState = "idle" | "carryCoal" | "sell";
export type StorageVisualState = "empty" | "small" | "full";
export type ElevatorCabinVisualState = "empty" | "loaded";

export interface MineShaftVisualState {
  shaftId: number;
  miner: MinerVisualState;
  minerPositionRatio: number;
  minePickupBox: StorageVisualState;
}

export interface SimulationVisualState {
  mineShafts: Record<number, MineShaftVisualState>;
  elevatorCabin: ElevatorCabinVisualState;
  elevatorPositionRatio: number;
  warehouseWorker: WarehouseWorkerVisualState;
  warehouseWorkerPositionRatio: number;
  warehouseWorkerFacingLeft: boolean;
  warehousePile: StorageVisualState;
  warehouseFeedback: {
    visible: boolean;
    text: string;
  };
  commandFeedback: {
    visible: boolean;
    text: string;
  };
}

export interface SimulationFrame {
  buyMode: UpgradeBuyMode;
  state: GameState;
  events: SimulationEvent[];
  visual: SimulationVisualState;
}

export interface SimulationViewModelOptions {
  initialSave?: SaveGameRecord | null;
  saveRepository?: SaveGameRepository;
  autoSaveIntervalSeconds?: number;
  isDebug?: boolean;
}

export class SimulationViewModel {
  private readonly simulation: MineSimulation;
  private readonly saveController?: SaveGameController;
  private readonly saveRepository?: SaveGameRepository;
  private buyMode: UpgradeBuyMode = 1;
  private lastWarehouseFeedback: { text: string; expiresAtSeconds: number } | undefined;
  private lastCommandFeedback: { text: string; expiresAtSeconds: number } | undefined;
  
  public offlineProgressResult: OfflineProgressResult | null = null;

  constructor(balance: BalanceConfig, options: SimulationViewModelOptions = {}) {
    this.simulation = new MineSimulation(balance, { 
      fixedStepSeconds: 0.1,
      isDebug: options.isDebug
    });

    const initialSave = options.initialSave ?? options.saveRepository?.load() ?? null;

    if (initialSave !== null) {
      try {
        this.offlineProgressResult = this.simulation.importSaveGame(initialSave) ?? null;
      } catch {
        // A damaged or incompatible save must not block the game from starting.
      }
    }

    if (options.saveRepository !== undefined) {
      this.saveRepository = options.saveRepository;
      this.saveController = new SaveGameController(
        options.saveRepository,
        () => this.simulation.exportSaveGame(),
        options.autoSaveIntervalSeconds
      );
    }
  }

  startMiningCycle(shaftId = 1): SimulationFrame {
    return this.manualMineAction(shaftId);
  }

  startElevatorCycle(): SimulationFrame {
    return this.manualElevatorAction();
  }

  startWarehouseCycle(): SimulationFrame {
    return this.manualWarehouseAction();
  }

  manualMineAction(shaftId = 1): SimulationFrame {
    return this.frameFromEvents(this.simulation.manualMineAction(shaftId));
  }

  manualElevatorAction(): SimulationFrame {
    return this.frameFromEvents(this.simulation.manualElevatorAction());
  }

  manualWarehouseAction(): SimulationFrame {
    return this.frameFromEvents(this.simulation.manualWarehouseAction());
  }

  purchaseUpgrade(target: UpgradeTarget): SimulationFrame {
    return this.frameFromEvents(this.simulation.purchaseUpgrade(target, this.buyMode));
  }

  purchaseMineShaftUpgrade(shaftId = 1): SimulationFrame {
    return this.frameFromEvents(this.simulation.upgradeMineShaft(shaftId, this.buyMode));
  }

  purchaseElevatorUpgrade(): SimulationFrame {
    return this.frameFromEvents(this.simulation.purchaseUpgrade("elevator", this.buyMode));
  }

  purchaseWarehouseUpgrade(): SimulationFrame {
    return this.frameFromEvents(this.simulation.purchaseUpgrade("warehouse", this.buyMode));
  }

  purchaseManager(area: ManagerArea): SimulationFrame {
    return this.frameFromEvents(this.simulation.purchaseManager(area));
  }

  assignManager(managerId: string, area: ManagerArea, shaftId = 1): SimulationFrame {
    return this.frameFromEvents(this.simulation.assignManager(managerId, area, shaftId));
  }

  unassignManager(area: ManagerArea, shaftId = 1): SimulationFrame {
    return this.frameFromEvents(this.simulation.unassignManager(area, undefined, undefined, shaftId));
  }

  activateManagerAbility(managerId: string): SimulationFrame {
    return this.frameFromEvents(this.simulation.activateManagerAbility(managerId));
  }

  unlockMineShaft(shaftId: number): SimulationFrame {
    return this.frameFromEvents(this.simulation.unlockMineShaft(shaftId));
  }

  removeDepthBlockade(blockadeId: string): SimulationFrame {
    return this.frameFromEvents(this.simulation.removeDepthBlockade(blockadeId));
  }

  upgradeMineShaft(shaftId: number): SimulationFrame {
    return this.frameFromEvents(this.simulation.upgradeMineShaft(shaftId, this.buyMode));
  }

  setBuyMode(buyMode: UpgradeBuyMode): SimulationFrame {
    this.buyMode = buyMode;
    return this.frameFromEvents([]);
  }

  update(deltaSeconds: number): SimulationFrame {
    const frame = this.frameFromEvents(this.simulation.update(Math.min(deltaSeconds, 0.25)));

    this.saveController?.update(deltaSeconds);

    return frame;
  }

  getInitialFrame(): SimulationFrame {
    const state = this.simulation.getState(this.buyMode);

    return {
      buyMode: this.buyMode,
      state,
      events: [],
      visual: this.createVisualState(state)
    };
  }

  processOfflineProgress(): OfflineProgressResult | null {
    const lastSave = this.saveRepository?.load();
    if (!lastSave) {
      return null;
    }

    const result = this.simulation.applyOfflineProgress(lastSave.savedAt, Date.now());
    if (result) {
      this.offlineProgressResult = result;
      // After applying offline progress, save again to avoid double counting if the user immediately refreshes
      this.flushSave();
      return result;
    }

    return null;
  }

  flushSave(): void {
    this.saveController?.flush();
  }

  dispose(): void {
    this.saveController?.dispose();
  }

  resetSaveGame(): void {
    this.saveController?.stop();
    this.saveRepository?.clear();
  }

  private frameFromEvents(events: SimulationEvent[]): SimulationFrame {
    this.trackEvents(events);

    const state = this.simulation.getState(this.buyMode);

    return {
      buyMode: this.buyMode,
      state,
      events,
      visual: this.createVisualState(state)
    };
  }

  private trackEvents(events: SimulationEvent[]): void {
    for (const event of events) {
      if (event.type === "oreSold") {
        this.lastWarehouseFeedback = {
          text: `+${formatMoney(event.moneyEarned)}`,
          expiresAtSeconds: event.timeSeconds + 1.1
        };
      }

      if (event.type === "commandRejected") {
        this.lastCommandFeedback = {
          text: event.message,
          expiresAtSeconds: event.timeSeconds + 1.2
        };
      }

      if (event.type === "actionFailed") {
        this.lastCommandFeedback = {
          text: event.message,
          expiresAtSeconds: event.timeSeconds + 1.2
        };
      }

    }
  }

  private createVisualState(state: GameState): SimulationVisualState {
    const elevator = state.entities.elevator;
    const warehouse = state.entities.warehouse;
    const elevatorOneWaySeconds = state.currentValues.elevator.tripTimeSeconds / 2;
    const elevatorTripRatio =
      elevator.state === "moving"
        ? 1 - ratio(elevator.remainingTripSeconds, elevatorOneWaySeconds)
        : elevator.state === "returning"
          ? ratio(elevator.remainingTripSeconds, elevatorOneWaySeconds)
          : 0;
    const warehouseCycleRatio = ratio(warehouse.sellProgressSeconds, state.currentValues.warehouse.sellCycleTimeSeconds);
    const warehouseFeedbackVisible =
      this.lastWarehouseFeedback !== undefined && this.lastWarehouseFeedback.expiresAtSeconds > state.timeSeconds;
    const commandFeedbackVisible =
      this.lastCommandFeedback !== undefined && this.lastCommandFeedback.expiresAtSeconds > state.timeSeconds;
    const warehouseVisibleStoredOre = getWarehouseVisibleStoredOre(warehouse, state.currentValues.warehouse, warehouseCycleRatio);
    const mineShaftVisuals: Record<number, MineShaftVisualState> = {};

    for (const shaft of Object.values(state.entities.mineShafts)) {
      const currentValues = state.currentValues.mineShafts[shaft.shaftId];
      const miningCycleRatio = ratio(shaft.cycleProgressSeconds, currentValues.cycleTimeSeconds);

      mineShaftVisuals[shaft.shaftId] = {
        shaftId: shaft.shaftId,
        miner: getMinerState(shaft.state, miningCycleRatio),
        minerPositionRatio: shaft.state === "mining" ? getWorkerTravelRatio(miningCycleRatio) : 0,
        minePickupBox: getStorageState(ratio(shaft.storedOre, shaft.capacity))
      };
    }

    return {
      mineShafts: mineShaftVisuals,
      elevatorCabin: elevator.carriedOre > 0 ? "loaded" : "empty",
      elevatorPositionRatio: elevator.state === "unloading" ? 1 : clamp01(elevatorTripRatio),
      warehouseWorker: getWarehouseWorkerState(warehouse.state, warehouseCycleRatio),
      warehouseWorkerPositionRatio: warehouse.state === "selling" ? getWarehouseWorkerTravelRatio(warehouseCycleRatio) : 0,
      warehouseWorkerFacingLeft: warehouse.state === "selling" && warehouseCycleRatio >= 0.35 && warehouseCycleRatio < 0.72,
      warehousePile: getStorageState(ratio(warehouseVisibleStoredOre, warehouse.capacity)),
      warehouseFeedback: {
        visible: warehouseFeedbackVisible,
        text: warehouseFeedbackVisible ? this.lastWarehouseFeedback?.text ?? "" : ""
      },
      commandFeedback: {
        visible: commandFeedbackVisible,
        text: commandFeedbackVisible ? this.lastCommandFeedback?.text ?? "" : ""
      }
    };
  }
}

function getMinerState(state: GameState["entities"]["mineShaft"]["state"], progressRatio: number): MinerVisualState {
  if (state !== "mining") {
    return "idle";
  }

  if (progressRatio < 0.58) {
    return "pickaxe";
  }

  if (progressRatio < 0.9) {
    return "carryBag";
  }

  return "dropBag";
}

function getWorkerTravelRatio(progressRatio: number): number {
  if (progressRatio < 0.58) {
    return 0;
  }

  if (progressRatio < 0.86) {
    return ratio(progressRatio - 0.58, 0.32);
  }

  if (progressRatio < 0.94) {
    return 1;
  }

  return 1 - ratio(progressRatio - 0.94, 0.06);
}

function getWarehouseWorkerState(state: GameState["entities"]["warehouse"]["state"], progressRatio: number): WarehouseWorkerVisualState {
  if (state !== "selling") {
    return "idle";
  }

  return progressRatio < 0.72 ? "carryCoal" : "sell";
}

function getWarehouseWorkerTravelRatio(progressRatio: number): number {
  if (progressRatio < 0.35) {
    return ratio(progressRatio, 0.35);
  }

  if (progressRatio < 0.72) {
    return 1 - ratio(progressRatio - 0.35, 0.37);
  }

  return 0;
}

function getWarehouseVisibleStoredOre(
  warehouse: GameState["entities"]["warehouse"],
  currentWarehouseValues: GameState["currentValues"]["warehouse"],
  progressRatio: number
): number {
  if (warehouse.state !== "selling") {
    return warehouse.storedOre;
  }

  if (progressRatio < 0.35) {
    return warehouse.storedOre;
  }

  const reservedOre = Math.min(warehouse.storedOre, currentWarehouseValues.sellCapacityPerCycle);
  return Math.max(0, warehouse.storedOre - reservedOre);
}

function getStorageState(fillRatio: number): StorageVisualState {
  if (fillRatio <= 0.01) {
    return "empty";
  }

  if (fillRatio < 0.58) {
    return "small";
  }

  return "full";
}

function ratio(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return clamp01(value / max);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function formatMoney(value: number): string {
  return formatCurrency(value);
}
