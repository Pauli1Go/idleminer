import { EPSILON, clampToCapacity, roundForState } from "../balance.ts";
import type { ElevatorStats } from "../balance.ts";
import type { SimulationEventInput } from "../events.ts";
import type { ElevatorState } from "../types.ts";
import type { MineShaft } from "./MineShaft.ts";
import type { Warehouse } from "./Warehouse.ts";

type EmitSimulationEvent = (event: SimulationEventInput) => void;
export type ElevatorStartResult = { started: true; carriedOre: number } | { started: false; reason: "busy" | "noOre" | "warehouseFull" };

export class Elevator {
  /**
   * Stats define the capacity and trip time.
   * Note: Trip time is constant regardless of how many mine shafts are visited
   * to ensure consistent production calculations (Throughput = Capacity / TripTime).
   */
  stats: ElevatorStats;

  state: ElevatorState;
  carriedOre: number;
  remainingTripSeconds = 0;
  totalCollectedOre = 0;
  totalTransportedOre = 0;

  constructor(stats: ElevatorStats, startingCarriedOre: number) {
    this.stats = stats;
    this.carriedOre = clampToCapacity(startingCarriedOre, stats.loadCapacity);
    this.state = this.carriedOre > EPSILON ? "unloading" : "idle";
  }

  applyStats(stats: ElevatorStats): void {
    const previousOneWayTripSeconds = getOneWayTripSeconds(this.stats.tripTimeSeconds);
    const remainingTripRatio =
      (this.state === "moving" || this.state === "returning") && previousOneWayTripSeconds > EPSILON
        ? clamp01(this.remainingTripSeconds / previousOneWayTripSeconds)
        : 0;

    this.stats = stats;

    if (this.state === "moving" || this.state === "returning") {
      this.remainingTripSeconds = roundForState(remainingTripRatio * getOneWayTripSeconds(this.stats.tripTimeSeconds));
      return;
    }

    if (this.state !== "unloading") {
      this.remainingTripSeconds = 0;
    }
  }

  startCycle(mineShafts: MineShaft[], warehouse: Warehouse, emit: EmitSimulationEvent): ElevatorStartResult {
    if (this.state !== "idle") {
      return { started: false, reason: "busy" };
    }

    const totalAvailableOre = mineShafts.reduce((sum, shaft) => sum + (shaft.isUnlocked && shaft.isReachable ? shaft.storedOre : 0), 0);

    if (totalAvailableOre <= EPSILON) {
      return { started: false, reason: "noOre" };
    }

    const warehouseFreeCapacity = roundForState(warehouse.stats.storageCapacity - warehouse.storedOre);

    if (warehouseFreeCapacity <= EPSILON) {
      return { started: false, reason: "warehouseFull" };
    }

    this.carriedOre = 0;
    this.state = "moving";
    this.remainingTripSeconds = getOneWayTripSeconds(this.stats.tripTimeSeconds);

    emit({
      type: "elevatorRouteStarted",
      tripTimeSeconds: this.stats.tripTimeSeconds
    });

    emit({
      type: "elevatorCycleStarted",
      carriedOre: this.carriedOre,
      tripTimeSeconds: this.remainingTripSeconds
    });

    emit({
      type: "elevatorDeparted",
      carriedOre: this.carriedOre,
      tripTimeSeconds: this.remainingTripSeconds
    });

    return { started: true, carriedOre: this.carriedOre };
  }

  update(deltaSeconds: number, mineShafts: MineShaft[], warehouse: Warehouse, emit: EmitSimulationEvent): void {
    let arrivedThisStep = false;

    if (this.state === "moving") {
      this.remainingTripSeconds = roundForState(Math.max(0, this.remainingTripSeconds - deltaSeconds));

      if (this.remainingTripSeconds <= EPSILON) {
        this.state = "unloading";
        arrivedThisStep = true;
      }
    }

    if (this.state === "unloading") {
      if (this.carriedOre <= EPSILON) {
        let totalCollectedFromShafts = 0;

        // Sort shafts by depth to collect from top to bottom
        const sortedShafts = [...mineShafts].sort((a, b) => a.depthIndex - b.depthIndex);

        for (const shaft of sortedShafts) {
          if (!shaft.isUnlocked || !shaft.isReachable) {
            continue;
          }

          emit({
            type: "elevatorArrivedAtShaft",
            shaftId: shaft.shaftId,
            carriedOre: totalCollectedFromShafts
          });

          const capacityLeft = roundForState(this.stats.loadCapacity - totalCollectedFromShafts);
          if (capacityLeft <= EPSILON) {
            emit({
              type: "elevatorSkippedShaft",
              shaftId: shaft.shaftId,
              reason: "elevator_full"
            });
            break;
          }

          if (shaft.storedOre <= EPSILON) {
            // Check if there is any ore in deeper shafts
            const deeperOre = sortedShafts.some(s => s.depthIndex > shaft.depthIndex && s.isUnlocked && s.isReachable && s.storedOre > EPSILON);
            if (!deeperOre) {
              emit({
                type: "elevatorSkippedShaft",
                shaftId: shaft.shaftId,
                reason: "no_more_ore_below"
              });
              break; 
            }
            
            emit({
              type: "elevatorSkippedShaft",
              shaftId: shaft.shaftId,
              reason: "no_ore"
            });
            continue;
          }

          const toCollect = Math.min(capacityLeft, shaft.storedOre);
          const collected = shaft.takeOre(toCollect, emit);
          totalCollectedFromShafts = roundForState(totalCollectedFromShafts + collected);

          emit({
            type: "elevatorLoadedFromShaft",
            shaftId: shaft.shaftId,
            amount: collected,
            carriedOre: totalCollectedFromShafts,
            capacity: this.stats.loadCapacity
          });

          emit({
            type: "oreCollectedByElevator",
            amount: collected,
            mineShaftStoredOre: shaft.storedOre,
            elevatorStoredOre: totalCollectedFromShafts,
            elevatorCapacity: this.stats.loadCapacity
          });

          if (totalCollectedFromShafts >= this.stats.loadCapacity - EPSILON) {
            break;
          }
        }

        if (totalCollectedFromShafts > EPSILON) {
          const previousCarriedOre = this.carriedOre;
          this.carriedOre = roundForState(totalCollectedFromShafts);
          this.totalCollectedOre = roundForState(this.totalCollectedOre + totalCollectedFromShafts);

          emit({
            type: "storageChanged",
            storageId: "elevator",
            previousAmount: previousCarriedOre,
            currentAmount: this.carriedOre,
            capacity: this.stats.loadCapacity,
            delta: roundForState(this.carriedOre - previousCarriedOre)
          });
        }

        emit({
          type: "elevatorRouteFinished",
          totalCollected: totalCollectedFromShafts
        });

        this.state = "returning";
        this.remainingTripSeconds = getOneWayTripSeconds(this.stats.tripTimeSeconds);
        return;
      }

      const carriedBeforeUnload = this.carriedOre;
      const deliveredOre = warehouse.receiveOre(this.carriedOre, emit);

      if (deliveredOre > EPSILON) {
        const previousCarriedOre = this.carriedOre;
        this.carriedOre = roundForState(this.carriedOre - deliveredOre);
        this.totalTransportedOre = roundForState(this.totalTransportedOre + deliveredOre);

        emit({
          type: "storageChanged",
          storageId: "elevator",
          previousAmount: previousCarriedOre,
          currentAmount: this.carriedOre,
          capacity: this.stats.loadCapacity,
          delta: roundForState(this.carriedOre - previousCarriedOre)
        });
      }

      if (arrivedThisStep) {
        emit({
          type: "elevatorArrived",
          carriedOre: carriedBeforeUnload,
          deliveredOre,
          remainingCarriedOre: this.carriedOre
        });
      }

      if (deliveredOre > EPSILON) {
        emit({
          type: "oreDeliveredToWarehouse",
          amount: deliveredOre,
          warehouseStoredOre: warehouse.storedOre,
          warehouseCapacity: warehouse.stats.storageCapacity
        });
      }

      if (this.carriedOre > EPSILON) {
        return;
      }

      this.state = "returning";
      this.remainingTripSeconds = getOneWayTripSeconds(this.stats.tripTimeSeconds);
      return;
    }


    if (this.state === "returning") {
      const previousRemainingTripSeconds = this.remainingTripSeconds;
      this.remainingTripSeconds = roundForState(Math.max(0, this.remainingTripSeconds - deltaSeconds));
      const arrivedAtSurfaceThisStep = previousRemainingTripSeconds > EPSILON && this.remainingTripSeconds <= EPSILON;

      if (this.remainingTripSeconds <= EPSILON) {
        const carriedBeforeUnload = this.carriedOre;
        const deliveredOre = warehouse.receiveOre(this.carriedOre, emit);

        if (deliveredOre > EPSILON) {
          const previousCarriedOre = this.carriedOre;
          this.carriedOre = roundForState(this.carriedOre - deliveredOre);
          this.totalTransportedOre = roundForState(this.totalTransportedOre + deliveredOre);

          emit({
            type: "storageChanged",
            storageId: "elevator",
            previousAmount: previousCarriedOre,
            currentAmount: this.carriedOre,
            capacity: this.stats.loadCapacity,
            delta: roundForState(this.carriedOre - previousCarriedOre)
          });
        }

        if (arrivedAtSurfaceThisStep) {
          emit({
            type: "elevatorArrived",
            carriedOre: carriedBeforeUnload,
            deliveredOre,
            remainingCarriedOre: this.carriedOre
          });
        }

        if (deliveredOre > EPSILON) {
          emit({
            type: "oreDeliveredToWarehouse",
            amount: deliveredOre,
            warehouseStoredOre: warehouse.storedOre,
            warehouseCapacity: warehouse.stats.storageCapacity
          });
        }

        if (this.carriedOre > EPSILON) {
          return;
        }

        this.state = "idle";
      }
    }
  }
}

function getOneWayTripSeconds(roundTripSeconds: number): number {
  return Math.max(EPSILON, roundTripSeconds / 2);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
