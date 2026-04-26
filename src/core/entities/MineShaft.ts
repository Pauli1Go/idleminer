import { EPSILON, clampToCapacity, roundForState } from "../balance.ts";
import type { MineShaftStats } from "../balance.ts";
import type { SimulationEventInput } from "../events.ts";
import type { MineShaftState } from "../types.ts";

type EmitSimulationEvent = (event: SimulationEventInput) => void;
export type MineShaftStartResult =
  | { started: true }
  | { started: false; reason: "busy" | "inactive" | "storageFull" | "shaftLocked" };

export interface MineShaftDefinition {
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

export class MineShaft {
  stats: MineShaftStats;
  readonly active: boolean;

  readonly shaftId: number;
  readonly displayName: string;
  readonly depthIndex: number;
  readonly depthGroup: number;
  readonly unlockCost: number;
  readonly productionMultiplier: number;
  readonly upgradeCostMultiplier: number;

  isUnlocked: boolean;
  isReachable: boolean;
  state: MineShaftState;
  storedOre: number;
  cycleProgressSeconds = 0;
  totalProducedOre = 0;

  assignedManagerId: string | null = null;
  activeManagerAbilityState: {
    isActive: boolean;
    abilityType: string | null;
    remainingActiveTime: number;
    remainingCooldownTime: number;
  } | null = null;

  constructor(stats: MineShaftStats, startingStoredOre: number, active: boolean, definition: MineShaftDefinition) {
    this.stats = stats;
    this.active = active;

    this.shaftId = definition.shaftId;
    this.displayName = definition.displayName;
    this.depthIndex = definition.depthIndex;
    this.depthGroup = definition.depthGroup;
    this.unlockCost = definition.unlockCost;
    this.productionMultiplier = definition.productionMultiplier;
    this.upgradeCostMultiplier = definition.upgradeCostMultiplier;

    this.isUnlocked = definition.isUnlocked;
    this.isReachable = definition.isReachable;
    this.storedOre = this.isUnlocked ? clampToCapacity(startingStoredOre, stats.bufferCapacity) : 0;
    this.state = this.resolveIdleState();
  }

  unlock(): void {
    if (this.isUnlocked) {
      return;
    }

    this.isUnlocked = true;
    this.storedOre = clampToCapacity(this.storedOre, this.stats.bufferCapacity);
    this.state = this.resolveIdleState();
  }

  lock(): void {
    this.isUnlocked = false;
    this.state = "inactive";
    this.cycleProgressSeconds = 0;
    this.storedOre = 0;
  }

  applyStats(stats: MineShaftStats): void {
    const progressRatio =
      this.state === "mining" && this.stats.cycleTimeSeconds > EPSILON
        ? clamp01(this.cycleProgressSeconds / this.stats.cycleTimeSeconds)
        : 0;

    this.stats = stats;

    if (!this.isUnlocked || !this.active) {
      this.state = "inactive";
      this.cycleProgressSeconds = 0;
      this.storedOre = this.isUnlocked ? clampToCapacity(this.storedOre, this.stats.bufferCapacity) : 0;
      return;
    }

    this.storedOre = clampToCapacity(this.storedOre, this.stats.bufferCapacity);

    if (this.state === "mining") {
      this.cycleProgressSeconds = roundForState(progressRatio * stats.cycleTimeSeconds);

      if (this.storedOre >= this.stats.bufferCapacity - EPSILON) {
        this.state = "blocked";
        this.cycleProgressSeconds = 0;
      }

      return;
    }

    this.cycleProgressSeconds = 0;
    this.state = this.resolveIdleState();
  }

  startCycle(): MineShaftStartResult {
    if (!this.isUnlocked) {
      this.state = "inactive";
      return { started: false, reason: "shaftLocked" };
    }

    if (!this.active) {
      this.state = "inactive";
      return { started: false, reason: "inactive" };
    }

    if (this.state === "mining") {
      return { started: false, reason: "busy" };
    }

    if (this.storedOre >= this.stats.bufferCapacity - EPSILON) {
      this.state = "blocked";
      return { started: false, reason: "storageFull" };
    }

    this.state = "mining";
    this.cycleProgressSeconds = 0;
    return { started: true };
  }

  update(deltaSeconds: number, emit: EmitSimulationEvent): void {
    if (!this.isUnlocked || !this.active) {
      this.state = "inactive";
      this.cycleProgressSeconds = 0;
      return;
    }

    if (this.state !== "mining") {
      this.state = this.resolveIdleState();
      this.cycleProgressSeconds = 0;
      return;
    }

    if (this.storedOre >= this.stats.bufferCapacity - EPSILON) {
      this.state = "blocked";
      this.cycleProgressSeconds = 0;
      return;
    }

    this.cycleProgressSeconds = roundForState(this.cycleProgressSeconds + deltaSeconds);

    if (this.cycleProgressSeconds + EPSILON < this.stats.cycleTimeSeconds) {
      return;
    }

    const freeCapacity = this.stats.bufferCapacity - this.storedOre;

    if (freeCapacity <= EPSILON) {
      this.state = "blocked";
      this.cycleProgressSeconds = 0;
      return;
    }

    const producedOre = roundForState(Math.min(this.stats.orePerCycle, freeCapacity));
    const previousStoredOre = this.storedOre;

    this.storedOre = roundForState(this.storedOre + producedOre);
    this.totalProducedOre = roundForState(this.totalProducedOre + producedOre);
    this.cycleProgressSeconds = 0;

    emit({
      type: "oreProduced",
      shaftId: this.shaftId,
      amount: producedOre,
      storedOre: this.storedOre,
      capacity: this.stats.bufferCapacity
    });

    emit({
      type: "mineShaftStorageChanged",
      shaftId: this.shaftId,
      previousAmount: previousStoredOre,
      currentAmount: this.storedOre,
      capacity: this.stats.bufferCapacity,
      delta: roundForState(this.storedOre - previousStoredOre)
    });

    emit({
      type: "storageChanged",
      storageId: "mineShaft",
      previousAmount: previousStoredOre,
      currentAmount: this.storedOre,
      capacity: this.stats.bufferCapacity,
      delta: roundForState(this.storedOre - previousStoredOre),
      shaftId: this.shaftId
    });

    this.state = this.resolveIdleState();
  }

  takeOre(maxAmount: number, emit: EmitSimulationEvent): number {
    if (!this.isUnlocked) {
      return 0;
    }

    const amount = roundForState(Math.min(Math.max(maxAmount, 0), this.storedOre));

    if (amount <= EPSILON) {
      return 0;
    }

    const previousStoredOre = this.storedOre;
    this.storedOre = roundForState(this.storedOre - amount);

    emit({
      type: "mineShaftStorageChanged",
      shaftId: this.shaftId,
      previousAmount: previousStoredOre,
      currentAmount: this.storedOre,
      capacity: this.stats.bufferCapacity,
      delta: roundForState(this.storedOre - previousStoredOre)
    });

    emit({
      type: "storageChanged",
      storageId: "mineShaft",
      previousAmount: previousStoredOre,
      currentAmount: this.storedOre,
      capacity: this.stats.bufferCapacity,
      delta: roundForState(this.storedOre - previousStoredOre),
      shaftId: this.shaftId
    });

    if (this.state === "blocked" && this.storedOre < this.stats.bufferCapacity - EPSILON) {
      this.state = "idle";
    }

    return amount;
  }

  private resolveIdleState(): MineShaftState {
    if (!this.isUnlocked || !this.active) {
      return "inactive";
    }

    return this.storedOre >= this.stats.bufferCapacity - EPSILON ? "blocked" : "idle";
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
