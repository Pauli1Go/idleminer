import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  MINE_DEFINITIONS,
  MineSimulation,
  type BalanceConfig
} from "../src/core/index.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const prestigeBalancePath = resolve(rootDir, "prestige-balance.json");
const baseBalance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;
const parsedDefinitions = JSON.parse(readFileSync(prestigeBalancePath, "utf8")) as {
  mines: typeof MINE_DEFINITIONS;
};

function cloneBalance(): BalanceConfig {
  return JSON.parse(JSON.stringify(baseBalance)) as BalanceConfig;
}

function createSimulation(startingMoney = baseBalance.economy.startingMoney): MineSimulation {
  const balance = cloneBalance();
  balance.economy.startingMoney = startingMoney;
  return new MineSimulation(balance, { fixedStepSeconds: 0.1 });
}

function getMineDefinitionById(mineId: string) {
  const definition = parsedDefinitions.mines.find((mine) => mine.mineId === mineId);

  assert.ok(definition, `Missing mine definition for ${mineId}`);
  return definition;
}

function getCoalPrestigeOneCost(): number {
  return getMineDefinitionById("coal").prestigeLevels[1]?.cost ?? 0;
}

function createSimulationWithAutomatedInactiveGold(): MineSimulation {
  const goldUnlockCost = getMineDefinitionById("gold").unlockCost;
  const balance = cloneBalance();
  balance.economy.startingMoney = goldUnlockCost + 1000;
  balance.managerSystemUnlock.firstMineShaftLevel = 1;
  const simulation = new MineSimulation(balance, { fixedStepSeconds: 0.1 });

  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");

  for (const area of ["mineShaft", "elevator", "warehouse"] as const) {
    simulation.purchaseManager(area);
    const manager = simulation.getState().managers.ownedManagers.find((candidate) => candidate.area === area && !candidate.isAssigned);

    assert.ok(manager, `Missing ${area} manager`);
    simulation.assignManager(manager.id, area, 1);
  }

  simulation.setActiveMine("coal");
  return simulation;
}

function createLegacySingleMineSave() {
  return {
    version: 6 as const,
    savedAt: 1234,
    state: {
      timeSeconds: 20,
      money: 500,
      levels: {
        mineShaft: 3,
        elevator: 2,
        warehouse: 2
      },
      resources: {
        mineShaft: 7,
        elevator: 2,
        warehouse: 5
      },
      totals: {
        producedOre: 40,
        collectedByElevatorOre: 28,
        transportedOre: 21,
        soldOre: 18,
        moneyEarned: 150
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
        assignedManagerIdsByShaft: {},
        ownedManagers: []
      },
      mineShafts: [
        {
          shaftId: 1,
          isUnlocked: true,
          level: 3,
          storedOre: 7,
          state: "idle",
          cycleProgressSeconds: 0,
          assignedManagerId: null,
          activeManagerAbilityState: null
        }
      ],
      blockades: [],
      entities: {
        mineShaft: {
          state: "idle",
          cycleProgressSeconds: 0,
          storedOre: 7
        },
        elevator: {
          state: "idle",
          carriedOre: 2,
          remainingTripSeconds: 0
        },
        warehouse: {
          state: "idle",
          sellProgressSeconds: 0,
          storedOre: 5
        }
      }
    }
  };
}

test("1. `prestige-balance.json` wird gefunden und geladen", () => {
  assert.equal(parsedDefinitions.mines.length > 0, true);
});

test("2. alle Minen werden erkannt", () => {
  assert.deepEqual(
    parsedDefinitions.mines.map((mine) => mine.displayName),
    ["Coal Mine", "Gold Mine", "Ruby Mine", "Diamond Mine", "Emerald Mine"]
  );
});

test("3. Unlock-Kosten werden korrekt gelesen", () => {
  assert.equal(getMineDefinitionById("gold").unlockCost, 7.68e+16);
});

test("4. Prestige-Kosten werden korrekt gelesen", () => {
  assert.equal(getMineDefinitionById("ruby").prestigeLevels[2]?.cost, 3.32e+63);
});

test("5. Prestige-Multiplikatoren werden korrekt gelesen", () => {
  assert.equal(getMineDefinitionById("diamond").prestigeLevels[4]?.multiplier, 84);
});

test("6. Prestige 0 wird aus der Datei gelesen und nicht pauschal als 1x angenommen", () => {
  assert.equal(getMineDefinitionById("gold").prestigeLevels[0]?.multiplier, 2);
  assert.equal(getMineDefinitionById("emerald").prestigeLevels[0]?.multiplier, 14);
});

test("7. Coal Mine ist standardmäßig freigeschaltet", () => {
  const state = createSimulation().getState();
  assert.equal(state.mines.coal.isUnlocked, true);
});

test("8. Gold Mine und weitere Minen sind initial gesperrt", () => {
  const state = createSimulation().getState();
  assert.equal(state.mines.gold.isUnlocked, false);
  assert.equal(state.mines.ruby.isUnlocked, false);
  assert.equal(state.mines.diamond.isUnlocked, false);
  assert.equal(state.mines.emerald.isUnlocked, false);
});

test("9. `unlockMine` funktioniert mit genug Cash", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 100);
  const events = simulation.unlockMine("gold");
  const state = simulation.getState();

  assert.equal(state.mines.gold.isUnlocked, true);
  assert.equal(events.some((event) => event.type === "mineUnlocked" && event.mineId === "gold"), true);
});

test("10. `unlockMine` scheitert ohne genug Cash", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost * 0.5);
  const events = simulation.unlockMine("gold");

  assert.equal(events.some((event) => event.type === "actionFailed" && event.reason === "not_enough_money"), true);
  assert.equal(simulation.getState().mines.gold.isUnlocked, false);
});

test("11. Cash wird beim Mine-Unlock korrekt abgezogen", () => {
  const unlockCost = getMineDefinitionById("gold").unlockCost;
  const simulation = createSimulation(unlockCost * 2);

  simulation.unlockMine("gold");

  assert.equal(simulation.getState().cash, unlockCost);
});

test("12. Cash wird nie negativ", () => {
  const simulation = createSimulation(10);
  simulation.unlockMine("gold");
  assert.equal(simulation.getState().cash >= 0, true);
});

test("13. `activeMineId` kann auf eine freigeschaltete Mine gesetzt werden", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 100);
  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");

  assert.equal(simulation.getState().activeMineId, "gold");
});

test("14. Gesperrte Minen können nicht aktiv gesetzt werden", () => {
  const simulation = createSimulation();
  const events = simulation.setActiveMine("gold");

  assert.equal(events.some((event) => event.type === "actionFailed" && event.reason === "mine_locked"), true);
  assert.equal(simulation.getState().activeMineId, "coal");
});

test("15. Mine-Wechsel verändert keine Fortschritte anderer Minen", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 1000);
  simulation.manualMineAction(1);
  simulation.update(4.1);
  const coalProduced = simulation.getState().mines.coal.resources.totals.producedOre;

  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  simulation.update(4.1);

  assert.equal(simulation.getState().mines.coal.resources.totals.producedOre, coalProduced);
});

test("16. Der Mine-Multiplikator wirkt nur auf die jeweilige Mine", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 100);
  simulation.unlockMine("gold");
  const state = simulation.getState();

  assert.equal(state.mines.coal.currentValues.mineShaft.orePerCycle * 2, state.mines.gold.currentValues.mineShaft.orePerCycle);
  assert.equal(state.mines.coal.currentValues.mineShaft.bufferCapacity * 2, state.mines.gold.currentValues.mineShaft.bufferCapacity);
  assert.equal(state.mines.coal.currentValues.elevator.loadCapacity * 2, state.mines.gold.currentValues.elevator.loadCapacity);
  assert.equal(state.mines.coal.currentValues.warehouse.sellCapacityPerCycle * 2, state.mines.gold.currentValues.warehouse.sellCapacityPerCycle);
  assert.equal(state.mines.coal.currentValues.warehouse.storageCapacity * 2, state.mines.gold.currentValues.warehouse.storageCapacity);
});

test("17. Coal und Gold haben unterschiedliche Produktion", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 100);
  simulation.unlockMine("gold");

  simulation.setActiveMine("coal");
  simulation.manualMineAction(1);
  simulation.update(4.1);

  simulation.setActiveMine("gold");
  simulation.manualMineAction(1);
  simulation.update(4.1);

  const state = simulation.getState();
  assert.notEqual(state.mines.coal.resources.totals.producedOre, state.mines.gold.resources.totals.producedOre);
});

test("18. Einnahmen aller Minen gehen in globales Cash", () => {
  const unlockCost = getMineDefinitionById("gold").unlockCost;
  const balance = cloneBalance();
  balance.economy.startingMoney = unlockCost * 2;
  balance.economy.sellPricePerOre = unlockCost;
  const simulation = new MineSimulation(balance, { fixedStepSeconds: 0.1 });

  simulation.manualMineAction(1);
  simulation.update(4.1);
  simulation.manualElevatorAction();
  simulation.update(2.1);
  simulation.manualWarehouseAction();
  simulation.update(20.1);
  const afterCoalSales = simulation.getState().cash;

  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  simulation.manualMineAction(1);
  simulation.update(4.1);
  simulation.manualElevatorAction();
  simulation.update(2.1);
  simulation.manualWarehouseAction();
  simulation.update(20.1);

  assert.equal(simulation.getState().cash > afterCoalSales, true);
});

test("19. Shaft-Events enthalten `mineId` und `shaftId`", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 100);
  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  simulation.manualMineAction(1);
  const events = simulation.update(4.1);

  assert.equal(
    events.some((event) => event.type === "oreProduced" && event.mineId === "gold" && event.shaftId === 1),
    true
  );
});

test("inaktive freigeschaltete Minen sammeln Offline-Cash fuer die Map", () => {
  const simulation = createSimulationWithAutomatedInactiveGold();
  const cashBefore = simulation.getState().cash;

  simulation.update(10);

  const state = simulation.getState();
  assert.equal(state.cash, cashBefore);
  assert.equal(state.mines.gold.pendingOfflineCash > 0, true);
});

test("Mine-Wechsel sammelt pending Offline-Cash nicht automatisch ein", () => {
  const simulation = createSimulationWithAutomatedInactiveGold();
  simulation.update(10);
  const beforeSwitch = simulation.getState();
  const pendingCash = beforeSwitch.mines.gold.pendingOfflineCash;

  simulation.setActiveMine("gold");
  const afterSwitch = simulation.getState();

  assert.equal(pendingCash > 0, true);
  assert.equal(afterSwitch.cash, beforeSwitch.cash);
  assert.equal(afterSwitch.mines.gold.pendingOfflineCash, pendingCash);
});

test("Offline-Cash einer Mine kann eingesammelt und gespeichert werden", () => {
  const simulation = createSimulationWithAutomatedInactiveGold();
  simulation.update(10);
  const pendingCash = simulation.getState().mines.gold.pendingOfflineCash;
  const cashBeforeCollect = simulation.getState().cash;
  const collectEvents = simulation.collectMineOfflineCash("gold");
  const afterCollect = simulation.getState();

  assert.equal(collectEvents.some((event) => event.type === "mineOfflineCashCollected" && event.mineId === "gold"), true);
  assert.equal(afterCollect.mines.gold.pendingOfflineCash, 0);
  assert.equal(afterCollect.cash, cashBeforeCollect + pendingCash);

  simulation.update(10);
  const saved = simulation.exportSaveGame();
  const restored = createSimulation();
  restored.importSaveGame(saved, saved.savedAt);

  assert.equal(restored.getState().mines.gold.pendingOfflineCash, simulation.getState().mines.gold.pendingOfflineCash);
});

test("inaktive Minen sammeln Offline-Cash nach geschlossenem Spiel", () => {
  const simulation = createSimulationWithAutomatedInactiveGold();
  const saved = simulation.exportSaveGame(1000);
  const restored = createSimulation();
  const offlineResult = restored.importSaveGame(saved, 121000);
  const afterLoad = restored.getState();

  assert.ok(offlineResult);
  assert.equal(offlineResult.moneyEarned, afterLoad.mines.gold.pendingOfflineCash);
  assert.equal(offlineResult.oreSold, afterLoad.mines.gold.pendingOfflineOreSold);
  assert.equal(afterLoad.mines.gold.pendingOfflineCash > 0, true);
  assert.equal(afterLoad.mines.gold.pendingOfflineSeconds >= 60, true);

  const cashBeforeCollect = afterLoad.cash;
  const pendingCash = afterLoad.mines.gold.pendingOfflineCash;
  restored.collectMineOfflineCash("gold");

  assert.equal(restored.getState().cash, cashBeforeCollect + pendingCash);
  assert.equal(restored.getState().mines.gold.pendingOfflineCash, 0);
});

test("20. `canPrestigeMine` erkennt eine mögliche Prestige-Stufe", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() + 1000);
  assert.equal(simulation.canPrestigeMine("coal"), true);
});

test("21. `prestigeMine` scheitert ohne genug Cash", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() * 0.5);
  const events = simulation.prestigeMine("coal");

  assert.equal(events.some((event) => event.type === "actionFailed" && event.reason === "not_enough_money"), true);
});

test("22. `prestigeMine` erhöht das Prestige-Level", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() + 1000);
  simulation.prestigeMine("coal");

  assert.equal(simulation.getState().mines.coal.prestigeLevel, 1);
});

test("23. Der Prestige-Multiplikator aktualisiert sich korrekt", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() + 1000);
  simulation.prestigeMine("coal");

  assert.equal(simulation.getState().mines.coal.currentPrestigeMultiplier, 4);
});

test("Prestige-Multiplikator wirkt auf Storage, Elevator und Warehouse", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() + 1000);
  const before = simulation.getState().mines.coal.currentValues;

  simulation.prestigeMine("coal");

  const after = simulation.getState().mines.coal.currentValues;
  assert.equal(after.mineShaft.orePerCycle, before.mineShaft.orePerCycle * 4);
  assert.equal(after.mineShaft.bufferCapacity, before.mineShaft.bufferCapacity * 4);
  assert.equal(after.elevator.loadCapacity, before.elevator.loadCapacity * 4);
  assert.equal(after.elevator.throughputPerSecond, before.elevator.throughputPerSecond * 4);
  assert.equal(after.warehouse.sellCapacityPerCycle, before.warehouse.sellCapacityPerCycle * 4);
  assert.equal(after.warehouse.storageCapacity, before.warehouse.storageCapacity * 4);
  assert.equal(after.warehouse.throughputPerSecond, before.warehouse.throughputPerSecond * 4);
});

test("24. Der Prestige-Reset betrifft nur die prestigte Mine", () => {
  const goldPrestigeOneCost = getMineDefinitionById("gold").prestigeLevels[1]?.cost ?? 0;
  const startingMoney = goldPrestigeOneCost * 2;
  const simulation = createSimulation(startingMoney);

  simulation.manualMineAction(1);
  simulation.update(4.1);
  const coalBefore = simulation.getState().mines.coal;

  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  simulation.unlockMineShaft(2);
  for (let index = 0; index < 5; index += 1) {
    simulation.purchaseMineShaftUpgrade();
  }
  simulation.purchaseElevatorUpgrade();
  simulation.purchaseWarehouseUpgrade();
  simulation.purchaseManager("mineShaft");
  const goldManagerId = simulation.getState().managers.ownedManagers[0].id;
  simulation.assignManager(goldManagerId, "mineShaft", 1);
  simulation.manualMineAction(1);
  simulation.update(4.1);
  const goldBefore = simulation.getState().mines.gold;

  simulation.prestigeMine("gold");
  const goldAfter = simulation.getState().mines.gold;
  const coalAfter = simulation.getState().mines.coal;

  assert.equal(goldAfter.prestigeLevel, 1);
  assert.equal(goldAfter.levels.mineShaft, baseBalance.mineShaft.startingLevel);
  assert.equal(goldAfter.levels.elevator, baseBalance.elevator.startingLevel);
  assert.equal(goldAfter.levels.warehouse, baseBalance.warehouse.startingLevel);
  assert.equal(goldAfter.entities.mineShafts[1].isUnlocked, true);
  assert.equal(goldAfter.entities.mineShafts[2].isUnlocked, false);
  assert.equal(goldAfter.resources.storedOre.mineShaft, 0);
  assert.equal(goldAfter.managers.assignedManagerIdsByShaft[1], null);
  assert.equal(goldAfter.managers.ownedManagers.length, 0);
  assert.equal(coalAfter.resources.totals.producedOre, coalBefore.resources.totals.producedOre);
});

test("25. Andere Minen bleiben nach Prestige unverändert", () => {
  const goldPrestigeOneCost = getMineDefinitionById("gold").prestigeLevels[1]?.cost ?? 0;
  const startingMoney = goldPrestigeOneCost * 2;
  const simulation = createSimulation(startingMoney);

  simulation.manualMineAction(1);
  simulation.update(4.1);
  const coalBefore = simulation.getState().mines.coal;

  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  simulation.manualMineAction(1);
  simulation.update(4.1);
  simulation.prestigeMine("gold");
  const coalAfter = simulation.getState().mines.coal;

  assert.equal(coalAfter.isUnlocked, coalBefore.isUnlocked);
  assert.equal(coalAfter.prestigeLevel, coalBefore.prestigeLevel);
  assert.equal(coalAfter.resources.totals.producedOre, coalBefore.resources.totals.producedOre);
});

test("26. Save/Load mit mehreren Minen funktioniert", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() + getMineDefinitionById("gold").unlockCost + 100000);
  simulation.unlockMine("gold");
  simulation.prestigeMine("coal");
  simulation.setActiveMine("gold");
  const save = simulation.exportSaveGame();

  const restored = createSimulation();
  restored.importSaveGame(save);

  assert.equal(restored.getState().mines.gold.isUnlocked, true);
});

test("27. `activeMineId` bleibt im Save erhalten", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 1000);
  simulation.unlockMine("gold");
  simulation.setActiveMine("gold");
  const restored = createSimulation();
  restored.importSaveGame(simulation.exportSaveGame());

  assert.equal(restored.getState().activeMineId, "gold");
});

test("28. Mine-Unlock-Zustände bleiben im Save erhalten", () => {
  const simulation = createSimulation(getMineDefinitionById("gold").unlockCost + 1000);
  simulation.unlockMine("gold");
  const restored = createSimulation();
  restored.importSaveGame(simulation.exportSaveGame());

  assert.equal(restored.getState().mines.coal.isUnlocked, true);
  assert.equal(restored.getState().mines.gold.isUnlocked, true);
});

test("29. Prestige-Level bleiben im Save erhalten", () => {
  const simulation = createSimulation(getCoalPrestigeOneCost() + 1000);
  simulation.prestigeMine("coal");
  const restored = createSimulation();
  restored.importSaveGame(simulation.exportSaveGame());

  assert.equal(restored.getState().mines.coal.prestigeLevel, 1);
});

test("30. Ein altes Single-Mine-Save wird auf Coal migriert", () => {
  const restored = createSimulation();
  restored.importSaveGame(createLegacySingleMineSave());
  const state = restored.getState();

  assert.equal(state.activeMineId, "coal");
  assert.equal(state.mines.coal.isUnlocked, true);
  assert.equal(state.mines.gold.isUnlocked, false);
  assert.equal(state.mines.coal.levels.mineShaft, 3);
  assert.equal(state.cash, 500);
});

test("Elevator-Meilensteine geben Super Cash", () => {
  const simulation = createSimulation(1e120);

  simulation.purchaseUpgrade("elevator", 100);
  assert.equal(simulation.getState().levels.elevator, 101);
  assert.equal(simulation.getState().superCash, 100);

  simulation.purchaseUpgrade("elevator", 100);
  assert.equal(simulation.getState().levels.elevator, 201);
  assert.equal(simulation.getState().superCash, 200);
});

test("Prestige-Stufen geben die konfigurierten Super-Cash-Belohnungen", () => {
  const simulation = createSimulation(1e120);
  const expectedSuperCashByPrestige = [100, 300, 600, 1100, 2100, 4100];

  for (const [index, expectedSuperCash] of expectedSuperCashByPrestige.entries()) {
    simulation.prestigeMine("coal");
    assert.equal(simulation.getState().mines.coal.prestigeLevel, index + 1);
    assert.equal(simulation.getState().superCash, expectedSuperCash);
  }
});

test("exported mine definitions stay aligned with `prestige-balance.json`", () => {
  assert.deepEqual(
    MINE_DEFINITIONS.map((mine) => ({ mineId: mine.mineId, unlockCost: mine.unlockCost })),
    parsedDefinitions.mines.map((mine) => ({ mineId: mine.mineId, unlockCost: mine.unlockCost }))
  );
});
