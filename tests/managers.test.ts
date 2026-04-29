import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  MineSimulation,
  SAVEGAME_VERSION,
  parseSaveGame,
  type BalanceConfig,
  type SaveGameRecord
} from "../src/core/index.ts";
import { SimulationViewModel } from "../src/game/SimulationViewModel.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const baseBalance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

function cloneBalance(): BalanceConfig {
  return JSON.parse(JSON.stringify(baseBalance)) as BalanceConfig;
}

function createUnlockedBalance(options: {
  startingMoney?: number;
  mineShaftLevel?: number;
  activeDurationSeconds?: number;
  cooldownSeconds?: number;
} = {}): BalanceConfig {
  const balance = cloneBalance();
  const startingMoney = options.startingMoney ?? 5000;
  const mineShaftLevel = options.mineShaftLevel ?? 5;
  const activeDurationSeconds = options.activeDurationSeconds ?? 0.2;
  const cooldownSeconds = options.cooldownSeconds ?? 0.4;

  balance.economy.startingMoney = startingMoney;
  balance.mineShaft.startingLevel = mineShaftLevel;

  for (const rank of ["junior", "senior", "executive"] as const) {
    balance.normalManagerRanks[rank].activeDurationSeconds = activeDurationSeconds;
    balance.normalManagerRanks[rank].cooldownSeconds = cooldownSeconds;
  }

  return balance;
}

function createManualActionSaveGame(overrides: {
  mineShaftStoredOre?: number;
  elevatorCarriedOre?: number;
  warehouseStoredOre?: number;
  mineShaftState?: "idle" | "mining" | "blocked" | "inactive";
  elevatorState?: "idle" | "moving" | "unloading" | "returning";
  warehouseState?: "idle" | "selling";
  money?: number;
} = {}): SaveGameRecord {
  const mineShaftStoredOre = overrides.mineShaftStoredOre ?? 4;
  const elevatorCarriedOre = overrides.elevatorCarriedOre ?? 0;
  const warehouseStoredOre = overrides.warehouseStoredOre ?? 4;

  return {
    version: SAVEGAME_VERSION,
    savedAt: 1234,
    state: {
      timeSeconds: 0,
      money: overrides.money ?? baseBalance.economy.startingMoney,
      levels: {
        mineShaft: baseBalance.mineShaft.startingLevel,
        elevator: baseBalance.elevator.startingLevel,
        warehouse: baseBalance.warehouse.startingLevel
      },
      resources: {
        mineShaft: mineShaftStoredOre,
        elevator: elevatorCarriedOre,
        warehouse: warehouseStoredOre
      },
      totals: {
        producedOre: 0,
        collectedByElevatorOre: 0,
        transportedOre: 0,
        soldOre: 0,
        moneyEarned: 0
      },
      managers: {
        hireCountsByArea: {
          mineShaft: 0,
          elevator: 0,
          warehouse: 0
        },
        assignedManagerIdsByArea: {
          mineShaft: null,
          elevator: null,
          warehouse: null
        },
        assignedManagerIdsByShaft: {
          "1": null,
          "2": null,
          "3": null,
          "4": null,
          "5": null
        },
        ownedManagers: []
      },
      mineShafts: [
        {
          shaftId: 1,
          isUnlocked: true,
          level: baseBalance.mineShaft.startingLevel,
          storedOre: mineShaftStoredOre,
          state: overrides.mineShaftState ?? "idle",
          cycleProgressSeconds: 0,
          assignedManagerId: null,
          activeManagerAbilityState: null
        }
      ],
      entities: {
        mineShaft: {
          state: overrides.mineShaftState ?? "idle",
          cycleProgressSeconds: 0,
          storedOre: mineShaftStoredOre
        },
        elevator: {
          state: overrides.elevatorState ?? "idle",
          carriedOre: elevatorCarriedOre,
          remainingTripSeconds: 0
        },
        warehouse: {
          state: overrides.warehouseState ?? "idle",
          sellProgressSeconds: 0,
          storedOre: warehouseStoredOre
        }
      }
    }
  };
}

function createSimulation(balance: BalanceConfig = baseBalance): MineSimulation {
  return new MineSimulation(balance, { fixedStepSeconds: 0.1 });
}

function getManagerIds(state: ReturnType<MineSimulation["getState"]>): string[] {
  return state.managers.ownedManagers.map((manager) => manager.id);
}

test("Manager system is locked before mine shaft level 5", () => {
  const simulation = createSimulation();
  const events = simulation.purchaseManager("mineShaft");
  const failure = events.find((event) => event.type === "actionFailed");

  assert.ok(failure);
  assert.equal(failure?.type, "actionFailed");
  assert.equal((failure as Extract<(typeof events)[number], { type: "actionFailed" }>).reason, "manager_system_locked");
  assert.equal(simulation.getState().managers.ownedManagers.length, 0);
});

test("Manager purchase is allowed at mine shaft level 5", () => {
  const simulation = createSimulation(createUnlockedBalance());
  const events = simulation.purchaseManager("mineShaft");

  assert.equal(events.some((event) => event.type === "managerPurchased"), true);
  assert.equal(simulation.getState().managers.systemLocked, false);
  assert.equal(simulation.getState().managers.ownedManagers.length, 1);
});

test("Manager purchase spends money when affordable", () => {
  const balance = createUnlockedBalance({ startingMoney: 1000 });
  const simulation = createSimulation(balance);
  const beforeMoney = simulation.getState().money;
  const events = simulation.purchaseManager("mineShaft");
  const afterMoney = simulation.getState().money;

  assert.equal(beforeMoney, 1000);
  assert.equal(afterMoney < beforeMoney, true);
  assert.equal(events.some((event) => event.type === "moneyChanged"), true);
});

test("Manager purchase fails without enough money", () => {
  const balance = createUnlockedBalance({ startingMoney: 50 });
  const simulation = createSimulation(balance);
  const events = simulation.purchaseManager("mineShaft");
  const failure = events.find((event) => event.type === "actionFailed");

  assert.ok(failure);
  assert.equal((failure as Extract<(typeof events)[number], { type: "actionFailed" }>).reason, "not_enough_money");
  assert.equal(simulation.getState().money, 50);
});

test("Manager hire cost scales per area and purchase count", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));
  const first = simulation.purchaseManager("mineShaft");
  const second = simulation.purchaseManager("mineShaft");
  const firstPurchase = first.find((event) => event.type === "managerPurchased");
  const secondPurchase = second.find((event) => event.type === "managerPurchased");

  assert.equal(firstPurchase?.type, "managerPurchased");
  assert.equal(secondPurchase?.type, "managerPurchased");
  assert.equal(firstPurchase && "manager" in firstPurchase ? firstPurchase.manager.hireCost : 0, 100);
  assert.equal(secondPurchase && "manager" in secondPurchase ? secondPurchase.manager.hireCost : 0, 185);
});

test("Multiple managers can be bought in the same area", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));
  simulation.purchaseManager("mineShaft");
  simulation.purchaseManager("mineShaft");
  simulation.purchaseManager("mineShaft");
  const state = simulation.getState();

  assert.equal(state.managers.hireCountsByArea.mineShaft, 3);
  assert.equal(state.managers.ownedManagers.filter((manager) => manager.area === "mineShaft").length, 3);
});

test("Only one manager can be assigned per area", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));
  simulation.purchaseManager("mineShaft");
  simulation.purchaseManager("mineShaft");
  const ids = getManagerIds(simulation.getState());

  simulation.assignManager(ids[0], "mineShaft");
  simulation.assignManager(ids[1], "mineShaft");

  const state = simulation.getState();

  assert.equal(state.managers.assignedManagerIdsByArea.mineShaft, ids[1]);
  assert.equal(state.managers.ownedManagers.filter((manager) => manager.area === "mineShaft" && manager.isAssigned).length, 1);
});

test("A manager cannot be assigned to the wrong area", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];
  const events = simulation.assignManager(managerId, "elevator");
  const failure = events.find((event) => event.type === "actionFailed");

  assert.ok(failure);
  assert.equal((failure as Extract<(typeof events)[number], { type: "actionFailed" }>).reason, "invalid_assignment");
  assert.equal(simulation.getState().managers.ownedManagers[0].isAssigned, false);
});

test("Mine shaft does not work automatically without a manager", () => {
  const simulation = createSimulation();
  simulation.update(5);
  const state = simulation.getState();

  assert.equal(state.resources.totals.producedOre, 0);
  assert.equal(state.managers.automationEnabledByArea.mineShaft, false);
});

test("Mine shaft works automatically with an assigned manager", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];

  simulation.assignManager(managerId, "mineShaft");
  simulation.update(5.0);

  const state = simulation.getState();

  assert.equal(state.managers.automationEnabledByArea.mineShaft, true);
  assert.equal(state.resources.totals.producedOre > 0, true);
});

test("manualMineAction works without a manager", () => {
  const simulation = createSimulation();
  simulation.manualMineAction();
  simulation.update(4.1);

  const state = simulation.getState();

  assert.equal(state.resources.totals.producedOre > 0, true);
});

test("manualElevatorAction works without a manager", () => {
  const simulation = createSimulation();
  simulation.importSaveGame(createManualActionSaveGame({ mineShaftStoredOre: 4, elevatorCarriedOre: 0, warehouseStoredOre: 0 }));
  simulation.manualElevatorAction();
  simulation.update(2.1);

  const state = simulation.getState();

  assert.equal(state.resources.totals.transportedOre > 0, true);
  assert.equal(state.resources.storedOre.warehouse > 0, true);
});

test("manualWarehouseAction works without a manager", () => {
  const simulation = createSimulation();
  simulation.importSaveGame(createManualActionSaveGame({ mineShaftStoredOre: 0, elevatorCarriedOre: 0, warehouseStoredOre: 4 }));
  const beforeSold = simulation.getState().resources.totals.soldOre;
  simulation.manualWarehouseAction();
  simulation.update(20.0);
  const afterSold = simulation.getState().resources.totals.soldOre;

  assert.ok(afterSold > beforeSold, `Sold ore should increase. Before: ${beforeSold}, After: ${afterSold}`);
});

test("Manager abilities can only be activated on assigned managers", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];
  const events = simulation.activateManagerAbility(managerId);
  const failure = events.find((event) => event.type === "actionFailed");

  assert.ok(failure);
  assert.equal((failure as Extract<(typeof events)[number], { type: "actionFailed" }>).reason, "manager_not_assigned");
});

test("Manager abilities stay active only for their active duration", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000, activeDurationSeconds: 0.2, cooldownSeconds: 0.4 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];

  simulation.assignManager(managerId, "mineShaft");
  const activated = simulation.activateManagerAbility(managerId);
  assert.equal(activated.some((event) => event.type === "managerAbilityActivated"), true);

  simulation.update(0.1);
  assert.equal(simulation.getState().managers.ownedManagers[0].isActive, true);

  simulation.update(0.2);
  const manager = simulation.getState().managers.ownedManagers[0];

  assert.equal(manager.isActive, false);
  assert.equal(manager.remainingActiveTime, 0);
});

test("Cooldown starts after a manager ability expires", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000, activeDurationSeconds: 0.2, cooldownSeconds: 0.4 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];

  simulation.assignManager(managerId, "mineShaft");
  simulation.activateManagerAbility(managerId);
  const events = simulation.update(0.3);
  const manager = simulation.getState().managers.ownedManagers[0];

  assert.equal(events.some((event) => event.type === "managerAbilityExpired"), true);
  assert.equal(events.some((event) => event.type === "managerCooldownStarted"), true);
  assert.equal(manager.remainingCooldownTime > 0, true);
});

test("Cooldown blocks reactivation", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000, activeDurationSeconds: 0.2, cooldownSeconds: 0.4 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];

  simulation.assignManager(managerId, "mineShaft");
  simulation.activateManagerAbility(managerId);
  simulation.update(0.3);
  const events = simulation.activateManagerAbility(managerId);
  const failure = events.find((event) => event.type === "actionFailed");

  assert.ok(failure);
  assert.equal((failure as Extract<(typeof events)[number], { type: "actionFailed" }>).reason, "ability_on_cooldown");
});

test("Inactive mine manager abilities and cooldowns continue ticking", () => {
  const simulation = createSimulation(
    createUnlockedBalance({ startingMoney: 1e20, activeDurationSeconds: 0.2, cooldownSeconds: 0.4 })
  );

  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  simulation.purchaseManager("mineShaft");
  const goldManagerId = getManagerIds(simulation.getState())[0];

  simulation.assignManager(goldManagerId, "mineShaft", 1);
  simulation.activateManagerAbility(goldManagerId);
  simulation.setActiveMine("coal");

  const expireEvents = simulation.update(0.3);
  const goldManagerAfterExpire = simulation.getState().mines.gold.managers.ownedManagers.find((manager) => manager.id === goldManagerId);

  assert.ok(goldManagerAfterExpire);
  assert.equal(goldManagerAfterExpire.isActive, false);
  assert.equal(goldManagerAfterExpire.remainingActiveTime, 0);
  assert.equal(goldManagerAfterExpire.remainingCooldownTime > 0, true);
  assert.equal(expireEvents.some((event) => event.type === "managerAbilityExpired" && event.mineId === "gold"), false);

  simulation.update(0.4);
  const goldManagerAfterCooldown = simulation.getState().mines.gold.managers.ownedManagers.find((manager) => manager.id === goldManagerId);

  assert.ok(goldManagerAfterCooldown);
  assert.equal(goldManagerAfterCooldown.remainingCooldownTime, 0);
});

test("Activating all manager abilities starts every ready assigned manager", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));

  simulation.purchaseManager("mineShaft");
  simulation.purchaseManager("elevator");
  simulation.purchaseManager("warehouse");

  const managers = simulation.getState().managers.ownedManagers;
  const mineManagerId = managers.find((manager) => manager.area === "mineShaft")?.id;
  const elevatorManagerId = managers.find((manager) => manager.area === "elevator")?.id;
  const warehouseManagerId = managers.find((manager) => manager.area === "warehouse")?.id;

  assert.ok(mineManagerId);
  assert.ok(elevatorManagerId);
  assert.ok(warehouseManagerId);

  simulation.assignManager(mineManagerId, "mineShaft", 1);
  simulation.assignManager(elevatorManagerId, "elevator");
  simulation.assignManager(warehouseManagerId, "warehouse");

  const events = simulation.activateAllManagerAbilities();
  const activatedEvents = events.filter((event) => event.type === "managerAbilityActivated");
  const assignedManagers = simulation.getState().managers.ownedManagers.filter((manager) => manager.isAssigned);

  assert.equal(activatedEvents.length, 3);
  assert.equal(assignedManagers.length, 3);
  assert.equal(assignedManagers.every((manager) => manager.isActive), true);
});

test("Activating all manager abilities skips managers that are already active", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000 }));

  simulation.purchaseManager("mineShaft");
  simulation.purchaseManager("elevator");
  simulation.purchaseManager("warehouse");

  const managers = simulation.getState().managers.ownedManagers;
  const mineManagerId = managers.find((manager) => manager.area === "mineShaft")?.id;
  const elevatorManagerId = managers.find((manager) => manager.area === "elevator")?.id;
  const warehouseManagerId = managers.find((manager) => manager.area === "warehouse")?.id;

  assert.ok(mineManagerId);
  assert.ok(elevatorManagerId);
  assert.ok(warehouseManagerId);

  simulation.assignManager(mineManagerId, "mineShaft", 1);
  simulation.assignManager(elevatorManagerId, "elevator");
  simulation.assignManager(warehouseManagerId, "warehouse");
  simulation.activateManagerAbility(mineManagerId);

  const events = simulation.activateAllManagerAbilities();
  const activatedEvents = events.filter((event) => event.type === "managerAbilityActivated");

  assert.equal(activatedEvents.length, 2);
  assert.equal(activatedEvents.some((event) => event.type === "managerAbilityActivated" && event.manager.id === mineManagerId), false);
});

test("Saving and loading managers preserves their state", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 5000, activeDurationSeconds: 0.2, cooldownSeconds: 0.4 }));
  simulation.purchaseManager("mineShaft");
  const managerId = getManagerIds(simulation.getState())[0];

  simulation.assignManager(managerId, "mineShaft");
  simulation.activateManagerAbility(managerId);
  simulation.update(0.1);

  const save = simulation.exportSaveGame();
  const restored = createSimulation(createUnlockedBalance({ startingMoney: 5000, activeDurationSeconds: 0.2, cooldownSeconds: 0.4 }));
  restored.importSaveGame(save);
  const state = restored.getState();

  assert.equal(state.managers.ownedManagers.length, 1);
  assert.equal(state.managers.assignedManagerIdsByArea.mineShaft, managerId);
  assert.equal(state.managers.ownedManagers[0].isActive, true);
  assert.equal(state.managers.ownedManagers[0].remainingActiveTime > 0, true);
  assert.equal(state.managers.automationEnabledByArea.mineShaft, true);
});

test("Old saves without manager data still load", () => {
  const oldSaveRaw = JSON.stringify({
    version: 1,
    savedAt: 1234,
    state: {
      timeSeconds: 0,
      money: baseBalance.economy.startingMoney,
      levels: {
        mineShaft: 1,
        elevator: 1,
        warehouse: 1
      },
      resources: {
        mineShaft: 0,
        elevator: 0,
        warehouse: 0
      },
      totals: {
        producedOre: 0,
        collectedByElevatorOre: 0,
        transportedOre: 0,
        soldOre: 0,
        moneyEarned: 0
      },
      entities: {
        mineShaft: {
          state: "idle",
          cycleProgressSeconds: 0,
          storedOre: 0
        },
        elevator: {
          state: "idle",
          carriedOre: 0,
          remainingTripSeconds: 0
        },
        warehouse: {
          state: "idle",
          sellProgressSeconds: 0,
          storedOre: 0
        }
      }
    }
  });

  const parsed = parseSaveGame(oldSaveRaw);
  const viewModel = new SimulationViewModel(baseBalance, { initialSave: parsed });
  const frame = viewModel.getInitialFrame();

  assert.ok(parsed);
  assert.equal(parsed.version, SAVEGAME_VERSION);
  assert.equal(frame.state.managers.ownedManagers.length, 0);
  assert.equal(frame.state.managers.automationEnabledByArea.mineShaft, false);
  viewModel.dispose();
});

test("Invalid manager actions surface the same feedback mechanism", () => {
  const balance = createUnlockedBalance({ startingMoney: 50 });
  const viewModel = new SimulationViewModel(balance);
  const managerFrame = viewModel.purchaseManager("mineShaft");
  const commandFrame = viewModel.startElevatorCycle();

  assert.equal(managerFrame.events.some((event) => event.type === "actionFailed"), true);
  assert.equal(managerFrame.visual.commandFeedback.visible, true);
  assert.equal(commandFrame.events.some((event) => event.type === "commandRejected"), true);
  assert.equal(commandFrame.visual.commandFeedback.visible, true);

  viewModel.dispose();
});

test("Money never goes below zero", () => {
  const simulation = createSimulation(createUnlockedBalance({ startingMoney: 50 }));
  simulation.purchaseManager("mineShaft");
  const state = simulation.getState();

  assert.equal(state.money >= 0, true);
});

test("Resources never go below zero", () => {
  const simulation = createSimulation();
  simulation.manualElevatorAction();
  simulation.manualWarehouseAction();
  simulation.update(1);

  const state = simulation.getState();

  assert.equal(state.resources.storedOre.mineShaft >= 0, true);
  assert.equal(state.resources.storedOre.elevator >= 0, true);
  assert.equal(state.resources.storedOre.warehouse >= 0, true);
});
