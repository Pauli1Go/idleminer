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
  type SaveGameRecord,
  getMineShaftProductionMultiplier
} from "../src/core/index.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const baseBalance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

function createSimulation(overrides: Partial<BalanceConfig> = {}): MineSimulation {
  const balance = JSON.parse(JSON.stringify(baseBalance)) as BalanceConfig;
  Object.assign(balance, overrides);
  return new MineSimulation(balance, { fixedStepSeconds: 0.1 });
}

test("1. Mine Shaft 1 ist standardmäßig freigeschaltet", () => {
  const simulation = createSimulation();
  const state = simulation.getState();
  assert.equal(state.entities.mineShafts[1].isUnlocked, true);
});

test("2. Mine Shaft 2 kostet 1000", () => {
  const simulation = createSimulation();
  const state = simulation.getState();
  assert.equal(state.entities.mineShafts[2].unlockCost, 1000);
});

test("3. Mine Shaft 2 kann freigeschaltet werden (Shaft 1 ist immer da)", () => {
  const simulation = createSimulation({ economy: { ...baseBalance.economy, startingMoney: 2000 } });
  const events = simulation.unlockMineShaft(2);
  assert.equal(events.some(e => e.type === "mineShaftUnlocked" && e.shaftId === 2), true);
  assert.equal(simulation.getState().entities.mineShafts[2].isUnlocked, true);
});

test("4. Mine Shaft 3 kostet 50.000", () => {
  const simulation = createSimulation();
  const state = simulation.getState();
  assert.equal(state.entities.mineShafts[3].unlockCost, 50000);
});

test("5. Mine Shaft 3 kann erst freigeschaltet werden, wenn Shaft 2 freigeschaltet ist", () => {
  const simulation = createSimulation({ economy: { ...baseBalance.economy, startingMoney: 100000 } });
  
  // Try unlocking 3 directly
  const events3 = simulation.unlockMineShaft(3);
  assert.equal(events3.some(e => e.type === "actionFailed" && e.reason === "previous_shaft_locked"), true);
  
  // Unlock 2 first
  simulation.unlockMineShaft(2);
  const events3Success = simulation.unlockMineShaft(3);
  assert.equal(events3Success.some(e => e.type === "mineShaftUnlocked" && e.shaftId === 3), true);
});

test("6. Mine Shaft 4 kann erst freigeschaltet werden, wenn Shaft 3 freigeschaltet ist", () => {
  const simulation = createSimulation({ economy: { ...baseBalance.economy, startingMoney: 10000000 } });
  simulation.unlockMineShaft(2);
  simulation.unlockMineShaft(3);
  const events = simulation.unlockMineShaft(4);
  assert.equal(events.some(e => e.type === "mineShaftUnlocked" && e.shaftId === 4), true);
});

test("7. Mine Shaft 5 kann erst freigeschaltet werden, wenn Shaft 4 freigeschaltet ist", () => {
  const simulation = createSimulation({ economy: { ...baseBalance.economy, startingMoney: 100000000 } });
  simulation.unlockMineShaft(2);
  simulation.unlockMineShaft(3);
  simulation.unlockMineShaft(4);
  const events = simulation.unlockMineShaft(5);
  assert.equal(events.some(e => e.type === "mineShaftUnlocked" && e.shaftId === 5), true);
});

test("8. Shaft 2 hat einen Production Multiplier von 50", () => {
  assert.equal(getMineShaftProductionMultiplier(baseBalance, 2), 50);
});

test("9. Shaft 3 hat einen Production Multiplier von 2250 (50 * 50 * 0.9)", () => {
  assert.equal(getMineShaftProductionMultiplier(baseBalance, 3), 2250);
});

test("10. Shaft 4 hat einen Production Multiplier von 101.250", () => {
  assert.equal(getMineShaftProductionMultiplier(baseBalance, 4), 101250);
});

test("11. Shaft 5 hat einen Production Multiplier von 4.556.250", () => {
  assert.equal(getMineShaftProductionMultiplier(baseBalance, 5), 4556250);
});

test("12. Shaft Upgrade Kosten skalieren mit dem Production Multiplier", () => {
  const simulation = createSimulation();
  const shaft1Cost = simulation.getState().upgrades.mineShafts[1].firstLevelCost;
  const shaft2Cost = simulation.getState().upgrades.mineShafts[2].firstLevelCost;
  
  // cost scaling is pow(multiplier, 0.65)
  assert.ok(shaft2Cost > shaft1Cost * 10);
});

test("13. Mine Shafts produzieren nur, wenn freigeschaltet", () => {
  const simulation = createSimulation();
  // Shaft 2 is locked.
  simulation.manualMineAction(2);
  simulation.update(10);
  assert.equal(simulation.getState().resources.storedOre.mineShafts[2], 0);
});

test("14. Manager können spezifischen Shafts zugewiesen werden", () => {
  const simulation = createSimulation({ mineShaft: { ...baseBalance.mineShaft, startingLevel: 5 }, economy: { ...baseBalance.economy, startingMoney: 10000 } });
  simulation.purchaseManager("mineShaft");
  const managerId = simulation.getState().managers.ownedManagers[0].id;
  
  simulation.assignManager(managerId, "mineShaft", 1);
  assert.equal(simulation.getState().managers.assignedManagerIdsByShaft[1], managerId);
});

test("15. Ein Manager automatisiert nur seinen Shaft", () => {
  const simulation = createSimulation({ mineShaft: { ...baseBalance.mineShaft, startingLevel: 5 }, economy: { ...baseBalance.economy, startingMoney: 10000 } });
  simulation.unlockMineShaft(2);
  simulation.purchaseManager("mineShaft");
  const managerId = simulation.getState().managers.ownedManagers[0].id;
  
  simulation.assignManager(managerId, "mineShaft", 1);
  simulation.update(10.0);
  
  const state = simulation.getState();
  assert.ok(state.resources.storedOre.mineShafts[1] > 0);
  assert.equal(state.resources.storedOre.mineShafts[2], 0);
});

test("17. Reassigning eines Managers von Shaft A zu Shaft B funktioniert", () => {
  const simulation = createSimulation({ mineShaft: { ...baseBalance.mineShaft, startingLevel: 5 }, economy: { ...baseBalance.economy, startingMoney: 10000 } });
  simulation.unlockMineShaft(2);
  simulation.purchaseManager("mineShaft");
  const managerId = simulation.getState().managers.ownedManagers[0].id;
  
  simulation.assignManager(managerId, "mineShaft", 1);
  simulation.assignManager(managerId, "mineShaft", 2);
  
  const state = simulation.getState();
  assert.equal(state.managers.assignedManagerIdsByShaft[1], null);
  assert.equal(state.managers.assignedManagerIdsByShaft[2], managerId);
});

test("18-22. Elevator besucht alle freigeschalteten Schaechte", () => {
  const simulation = createSimulation({ 
    economy: { ...baseBalance.economy, startingMoney: 10000000 },
    elevator: { ...baseBalance.elevator, oreLoadCapacityPerTrip: 1000000 } 
  });
  simulation.unlockMineShaft(2);
  simulation.unlockMineShaft(3);
  
  simulation.manualMineAction(1);
  simulation.manualMineAction(2);
  simulation.manualMineAction(3);
  simulation.update(5.0); // let them produce
  
  simulation.startElevatorCycle();
  const updateEvents = simulation.update(5.0);
  
  const state = simulation.getState();
  assert.equal(state.resources.storedOre.mineShafts[1], 0);
  assert.equal(state.resources.storedOre.mineShafts[2], 0);
  assert.equal(state.resources.storedOre.mineShafts[3], 0);
  assert.ok(state.resources.storedOre.elevator > 0);
});

test("23. Elevator stoppt, wenn voll", () => {
  const simulation = createSimulation({ elevator: { ...baseBalance.elevator, startingLevel: 1 } });
  const capacity = simulation.getState().entities.elevator.capacity;
  
  simulation.unlockMineShaft(2);
  simulation.manualMineAction(1);
  simulation.update(5.0);
  simulation.manualMineAction(1);
  simulation.update(5.0);
  
  simulation.startElevatorCycle();
  simulation.update(1.1);
  
  assert.equal(simulation.getState().resources.storedOre.elevator, capacity);
});

test("25. Elevator überspringt gesperrte Schaechte", () => {
  const simulation = createSimulation();
  simulation.manualMineAction(1);
  simulation.update(5.0);
  
  simulation.startElevatorCycle();
  const updateEvents = simulation.update(2.0);
  
  assert.equal(updateEvents.some(e => e.type === "elevatorArrivedAtShaft" && e.shaftId === 1), true);
  assert.equal(updateEvents.some(e => e.type === "elevatorArrivedAtShaft" && e.shaftId === 2), false);
});

test("26. Elevator Events werden korrekt gefeuert", () => {
  const simulation = createSimulation();
  simulation.manualMineAction(1);
  simulation.update(5.0);
  
  const startEvents = simulation.startElevatorCycle();
  const updateEvents = simulation.update(2.0);
  const events = [...startEvents, ...updateEvents];
  
  assert.ok(events.some(e => e.type === "elevatorArrivedAtShaft" && e.shaftId === 1));
  assert.ok(events.some(e => e.type === "elevatorLoadedFromShaft" && e.shaftId === 1));
  assert.ok(events.some(e => e.type === "elevatorRouteStarted"));
});

test("27-29. Savegame Migration von V2 auf V3", () => {
  const oldSave = {
    version: 2,
    savedAt: Date.now(),
    state: {
      timeSeconds: 100,
      money: 5000,
      levels: { mineShaft: 10, elevator: 5, warehouse: 5 },
      resources: { mineShaft: 20, elevator: 0, warehouse: 10 },
      totals: { producedOre: 100, collectedByElevatorOre: 80, transportedOre: 80, soldOre: 70, moneyEarned: 700 },
      managers: {
        hireCountsByArea: { mineShaft: 1, elevator: 0, warehouse: 0 },
        assignedManagerIdsByArea: { mineShaft: "m1", elevator: null, warehouse: null },
        ownedManagers: [
          {
            id: "m1", displayName: "M1", area: "mineShaft", rank: "junior", abilityType: "miningSpeedBoost",
            abilityMultiplier: 2, costReductionMultiplier: 1, activeDurationSeconds: 30, cooldownSeconds: 60,
            hireCost: 100, isOwned: true, isAssigned: true, assignedShaftId: null, isActive: false,
            remainingActiveTime: 0, remainingCooldownTime: 0
          }
        ]
      },
      entities: {
        mineShaft: { state: "idle", cycleProgressSeconds: 0, storedOre: 20 },
        elevator: { state: "idle", carriedOre: 0, remainingTripSeconds: 0 },
        warehouse: { state: "idle", sellProgressSeconds: 0, storedOre: 10 }
      }
    } as any
  };

  const simulation = createSimulation();
  simulation.importSaveGame(parseSaveGame(JSON.stringify(oldSave))!);
  
  const state = simulation.getState();
  assert.equal(state.entities.mineShafts[1].level, 10);
  assert.equal(state.entities.mineShafts[1].storedOre, 20);
  assert.equal(state.managers.assignedManagerIdsByShaft[1], "m1");
});

test("30. Savegame Speichern/Laden von 5 Schaechten funktioniert", () => {
  const simulation = createSimulation({ economy: { ...baseBalance.economy, startingMoney: 100000000 } });
  simulation.unlockMineShaft(2);
  simulation.unlockMineShaft(3);
  simulation.unlockMineShaft(4);
  simulation.unlockMineShaft(5);
  simulation.upgradeMineShaft(5, 10);
  
  const save = simulation.exportSaveGame();
  const restored = createSimulation();
  restored.importSaveGame(save);
  
  const state = restored.getState();
  assert.equal(state.entities.mineShafts[5].isUnlocked, true);
  assert.equal(state.entities.mineShafts[5].level, 11);
});

test("31. Geld wird korrekt abgezogen beim Freischalten", () => {
  const simulation = createSimulation({ economy: { ...baseBalance.economy, startingMoney: 2000 } });
  simulation.unlockMineShaft(2);
  assert.equal(simulation.getState().money, 1000);
});

test("32. Stats (Throughput) ändern sich korrekt nach Freischaltung/Upgrade", () => {
  const simulation = createSimulation();
  const initialShaft1Throughput = simulation.getState().entities.mineShafts[1].productionRate;
  simulation.upgradeMineShaft(1, 10);
  assert.ok(simulation.getState().entities.mineShafts[1].productionRate > initialShaft1Throughput);
});
