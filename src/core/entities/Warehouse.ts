import { EPSILON, clampToCapacity, roundForState } from "../balance.ts";
import type { WarehouseStats } from "../balance.ts";
import type { SimulationEventInput } from "../events.ts";
import type { WarehouseState } from "../types.ts";

type EmitSimulationEvent = (event: SimulationEventInput) => void;
export type WarehouseStartResult = { started: true } | { started: false; reason: "busy" | "noOre" };

export interface WarehouseSale {
  soldOre: number;
}

export class Warehouse {
  stats: WarehouseStats;

  state: WarehouseState = "idle";
  storedOre: number;
  sellProgressSeconds = 0;
  totalSoldOre = 0;

  constructor(stats: WarehouseStats, startingStoredOre: number) {
    this.stats = stats;
    this.storedOre = clampToCapacity(startingStoredOre, stats.storageCapacity);
    this.state = "idle";
  }

  applyStats(stats: WarehouseStats): void {
    const progressRatio =
      this.state === "selling" && this.stats.sellCycleTimeSeconds > EPSILON
        ? clamp01(this.sellProgressSeconds / this.stats.sellCycleTimeSeconds)
        : 0;

    this.stats = stats;

    if (this.state === "selling" && this.storedOre > EPSILON) {
      this.sellProgressSeconds = roundForState(progressRatio * this.stats.sellCycleTimeSeconds);
      return;
    }

    this.sellProgressSeconds = 0;
    this.state = "idle";
  }

  startCycle(): WarehouseStartResult {
    if (this.state === "selling") {
      return { started: false, reason: "busy" };
    }

    if (this.storedOre <= EPSILON) {
      this.sellProgressSeconds = 0;
      this.state = "idle";
      return { started: false, reason: "noOre" };
    }

    this.state = "selling";
    this.sellProgressSeconds = 0;
    return { started: true };
  }

  update(deltaSeconds: number, emit: EmitSimulationEvent): WarehouseSale[] {
    if (this.state !== "selling") {
      this.state = "idle";
      this.sellProgressSeconds = 0;
      return [];
    }

    if (this.storedOre <= EPSILON) {
      this.state = "idle";
      this.sellProgressSeconds = 0;
      return [];
    }

    this.sellProgressSeconds = roundForState(this.sellProgressSeconds + deltaSeconds);

    const sales: WarehouseSale[] = [];

    if (this.sellProgressSeconds + EPSILON >= this.stats.sellCycleTimeSeconds && this.storedOre > EPSILON) {
      const soldOre = roundForState(Math.min(this.stats.sellCapacityPerCycle, this.storedOre));
      const previousStoredOre = this.storedOre;

      this.storedOre = roundForState(this.storedOre - soldOre);
      this.totalSoldOre = roundForState(this.totalSoldOre + soldOre);
      this.sellProgressSeconds = 0;
      sales.push({ soldOre });

      emit({
        type: "storageChanged",
        storageId: "warehouse",
        previousAmount: previousStoredOre,
        currentAmount: this.storedOre,
        capacity: this.stats.storageCapacity,
        delta: roundForState(this.storedOre - previousStoredOre)
      });
      this.state = "idle";
    }

    return sales;
  }

  receiveOre(maxAmount: number, emit: EmitSimulationEvent): number {
    const freeCapacity = roundForState(this.stats.storageCapacity - this.storedOre);
    const amount = roundForState(Math.min(Math.max(maxAmount, 0), freeCapacity));

    if (amount <= EPSILON) {
      return 0;
    }

    const previousStoredOre = this.storedOre;
    this.storedOre = roundForState(this.storedOre + amount);

    emit({
      type: "storageChanged",
      storageId: "warehouse",
      previousAmount: previousStoredOre,
      currentAmount: this.storedOre,
      capacity: this.stats.storageCapacity,
      delta: roundForState(this.storedOre - previousStoredOre)
    });

    return amount;
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
