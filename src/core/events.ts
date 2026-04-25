import type { ManagerState } from "./managers.ts";
import type { ManagerArea } from "./balance.ts";
import type { ElevatorStats, MineShaftStats, WarehouseStats } from "./balance.ts";
import type { UpgradeTarget } from "./upgrades.ts";
import type { StorageId } from "./types.ts";

export type SimulationCommandName =
  | "startMiningCycle"
  | "startElevatorCycle"
  | "startWarehouseCycle"
  | "purchaseMineShaftUpgrade"
  | "purchaseElevatorUpgrade"
  | "purchaseWarehouseUpgrade"
  | "upgradeMineShaft"
  | "unlockMineShaft"
  | "assignManager"
  | "unassignManager"
  | "activateManagerAbility";

export type SimulationCommandRejectionReason =
  | "busy"
  | "inactive"
  | "insufficientFunds"
  | "noOre"
  | "storageFull"
  | "warehouseFull"
  | "shaftLocked"
  | "maxLevelReached";

export type SimulationActionFailureReason =
  | SimulationCommandRejectionReason
  | "manager_system_locked"
  | "manager_not_owned"
  | "manager_not_assigned"
  | "ability_on_cooldown"
  | "invalid_assignment"
  | "no_resource_available"
  | "not_enough_money"
  | "invalid_shaft"
  | "shaft_locked"
  | "already_unlocked"
  | "previous_shaft_locked";

export type SimulationEvent =
  | {
      sequence: number;
      timeSeconds: number;
      type: "miningCycleStarted";
      shaftId: number;
      durationSeconds: number;
      storedOre: number;
      capacity: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorCycleStarted";
      carriedOre: number;
      tripTimeSeconds: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "warehouseCycleStarted";
      storedOre: number;
      durationSeconds: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "commandRejected";
      command: SimulationCommandName;
      reason: SimulationCommandRejectionReason;
      message: string;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "actionFailed";
      action: string;
      reason: SimulationActionFailureReason;
      message: string;
      shaftId?: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "oreProduced";
      shaftId: number;
      amount: number;
      storedOre: number;
      capacity: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "oreCollectedByElevator";
      amount: number;
      mineShaftStoredOre: number;
      elevatorStoredOre: number;
      elevatorCapacity: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorDeparted";
      carriedOre: number;
      tripTimeSeconds: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorArrived";
      carriedOre: number;
      deliveredOre: number;
      remainingCarriedOre: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "oreDeliveredToWarehouse";
      amount: number;
      warehouseStoredOre: number;
      warehouseCapacity: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "oreSold";
      amount: number;
      moneyEarned: number;
      remainingWarehouseOre: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "moneyChanged";
      previousMoney: number;
      currentMoney: number;
      delta: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "upgradePurchased";
      target: UpgradeTarget;
      shaftId?: number;
      previousLevel: number;
      currentLevel: number;
      cost: number;
      previousMoney: number;
      currentMoney: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "mineShaftUpgradePurchased";
      shaftId: number;
      previousLevel: number;
      currentLevel: number;
      cost: number;
      previousMoney: number;
      currentMoney: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "statsChanged";
      target: UpgradeTarget;
      shaftId?: number;
      previousStats: MineShaftStats | ElevatorStats | WarehouseStats;
      currentStats: MineShaftStats | ElevatorStats | WarehouseStats;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "storageChanged";
      storageId: StorageId;
      shaftId?: number;
      previousAmount: number;
      currentAmount: number;
      capacity: number;
      delta: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "mineShaftStorageChanged";
      shaftId: number;
      previousAmount: number;
      currentAmount: number;
      capacity: number;
      delta: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "mineShaftUnlocked";
      shaftId: number;
      unlockCost: number;
      currentMoney: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerPurchased";
      manager: ManagerState;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerAssigned";
      manager: ManagerState;
      area: ManagerArea;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerAssignedToShaft";
      manager: ManagerState;
      shaftId: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerUnassigned";
      manager: ManagerState;
      area: ManagerArea;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerUnassignedFromShaft";
      manager: ManagerState;
      shaftId: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerAbilityActivated";
      manager: ManagerState;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerAbilityExpired";
      manager: ManagerState;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerCooldownStarted";
      manager: ManagerState;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "managerCooldownFinished";
      manager: ManagerState;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorArrivedAtShaft";
      shaftId: number;
      carriedOre: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorLoadedFromShaft";
      shaftId: number;
      amount: number;
      carriedOre: number;
      capacity: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorSkippedShaft";
      shaftId: number;
      reason: string;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorRouteStarted";
      tripTimeSeconds: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "elevatorRouteFinished";
      totalCollected: number;
    }
  | {
      sequence: number;
      timeSeconds: number;
      type: "automationStateChanged";
      area: ManagerArea;
      automated: boolean;
      managerId: string | null;
      shaftId?: number;
    };

export type SimulationEventType = SimulationEvent["type"];
export type SimulationEventInput = SimulationEvent extends infer Event
  ? Event extends SimulationEvent
    ? Omit<Event, "sequence" | "timeSeconds">
    : never
  : never;
export type SimulationEventHandler = (event: SimulationEvent) => void;

export class SimulationSignalBus {
  private listeners = new Map<SimulationEventType | "*", Set<SimulationEventHandler>>();

  subscribe(type: SimulationEventType | "*", handler: SimulationEventHandler): () => void {
    const handlers = this.listeners.get(type) ?? new Set<SimulationEventHandler>();
    handlers.add(handler);
    this.listeners.set(type, handlers);

    return () => {
      handlers.delete(handler);
    };
  }

  publish(event: SimulationEvent): void {
    this.listeners.get(event.type)?.forEach((handler) => handler(event));
    this.listeners.get("*")?.forEach((handler) => handler(event));
  }
}
