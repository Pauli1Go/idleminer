import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  MineSimulation,
  getBoostBalanceConfig,
  roundForState,
  type BalanceConfig
} from "../src/core/index.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const baseBalance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

function cloneBalance(): BalanceConfig {
  return JSON.parse(JSON.stringify(baseBalance)) as BalanceConfig;
}

function createWarehouseSaleSimulation(): MineSimulation {
  const balance = cloneBalance();
  balance.startingStorage.startingWarehouseStoredOre = 10;
  return new MineSimulation(balance, { fixedStepSeconds: 0.1 });
}

function createAutomatedOfflineSimulation(): MineSimulation {
  const balance = cloneBalance();
  balance.economy.startingMoney = 1000;
  balance.managerSystemUnlock.firstMineShaftLevel = 1;
  const simulation = new MineSimulation(balance, { fixedStepSeconds: 0.1 });

  for (const area of ["mineShaft", "elevator", "warehouse"] as const) {
    simulation.purchaseManager(area);
    const manager = simulation.getState().managers.ownedManagers.find((candidate) => candidate.area === area && !candidate.isAssigned);

    assert.ok(manager, `Missing ${area} manager`);
    simulation.assignManager(manager.id, area, 1);
  }

  return simulation;
}

test("Boost-Odds sind im Balancing hinterlegt", () => {
  const boosts = getBoostBalanceConfig(baseBalance);
  const cheapTotalWeight = boosts.purchases.cheap.drawTable.reduce((sum, entry) => sum + entry.weight, 0);
  const expensiveTotalWeight = boosts.purchases.expensive.drawTable.reduce((sum, entry) => sum + entry.weight, 0);

  assert.equal(boosts.purchases.cheap.cost, 500);
  assert.equal(boosts.purchases.expensive.cost, 5000);
  assert.equal(cheapTotalWeight, 100);
  assert.equal(expensiveTotalWeight, 100);
  assert.equal(Math.min(...boosts.purchases.cheap.drawTable.map((entry) => entry.multiplier)), 2);
  assert.equal(Math.max(...boosts.purchases.expensive.drawTable.map((entry) => entry.multiplier)), 5000);
});

test("Ein Cheap-Free-Spin legt einen Einkommensboost ohne Super-Cash-Kosten bereit", () => {
  const simulation = createWarehouseSaleSimulation();
  const before = simulation.getState();
  const events = simulation.purchaseCheapBoost({
    now: new Date(2026, 0, 1, 10).getTime(),
    randomValue: 0
  });
  const purchased = simulation.getState();

  assert.equal(events.some((event) => event.type === "superCashSpent"), false);
  assert.equal(events.some((event) => event.type === "incomeBoostPurchased" && event.usedFreeSpin), true);
  assert.equal(purchased.superCash, 0);
  assert.equal(purchased.boosts.incomeMultiplier, 1);
  assert.equal(purchased.boosts.activeBoost, null);
  assert.equal(purchased.boosts.queuedBoosts[0]?.definitionId, "cheap_2x_30m");
  assert.deepEqual(purchased.currentValues.mineShaft, before.currentValues.mineShaft);
  assert.deepEqual(purchased.currentValues.elevator, before.currentValues.elevator);
  assert.deepEqual(purchased.currentValues.warehouse, before.currentValues.warehouse);

  const activationEvents = simulation.activateNextIncomeBoost();
  const boosted = simulation.getState();

  assert.equal(activationEvents.some((event) => event.type === "incomeBoostActivated"), true);
  assert.equal(boosted.boosts.incomeMultiplier, 2);
  assert.equal(boosted.boosts.activeBoost?.definitionId, "cheap_2x_30m");
  assert.equal(boosted.boosts.queuedBoosts.length, 0);
});

test("Aktive Boosts multiplizieren Verkaufserloes statt Mine-, Elevator- oder Warehouse-Stats", () => {
  const simulation = createWarehouseSaleSimulation();

  simulation.purchaseCheapBoost({
    now: new Date(2026, 0, 1, 10).getTime(),
    randomValue: 0
  });
  simulation.activateNextIncomeBoost();
  simulation.startWarehouseCycle();
  simulation.update(baseBalance.productionTimesSeconds.warehouseSellCycleTime + 0.1);

  const state = simulation.getState();
  assert.equal(state.resources.totals.soldOre, 10);
  assert.equal(state.cash, 20);
  assert.equal(state.resources.totals.moneyEarned, 20);
});

test("Nach dem taeglichen Cheap-Free-Spin kostet ein weiterer Cheap-Kauf 500 Super Cash und queued", () => {
  const simulation = new MineSimulation(cloneBalance(), { fixedStepSeconds: 0.1, isDebug: true });
  const now = new Date(2026, 0, 1, 10).getTime();

  simulation.purchaseCheapBoost({ now, randomValue: 0 });
  const events = simulation.purchaseCheapBoost({ now, randomValue: 0.999 });
  const state = simulation.getState(1, now);

  assert.equal(state.superCash, 9500);
  assert.equal(state.boosts.activeBoost, null);
  assert.equal(state.boosts.queuedBoosts.length, 2);
  assert.equal(state.boosts.queuedBoosts[0]?.definitionId, "cheap_2x_30m");
  assert.equal(state.boosts.queuedBoosts[1]?.definitionId, "cheap_20x_5m");
  assert.equal(events.some((event) => event.type === "superCashSpent" && event.source === "boostShop" && event.amount === 500), true);

  simulation.activateNextIncomeBoost();
  const activatedState = simulation.getState(1, now);
  assert.equal(activatedState.boosts.activeBoost?.definitionId, "cheap_2x_30m");
  assert.equal(activatedState.boosts.queuedBoosts.length, 1);
});

test("Aktivierung addiert Zeit nur bei gleichem Multiplikator", () => {
  const simulation = new MineSimulation(cloneBalance(), { fixedStepSeconds: 0.1, isDebug: true });
  const now = new Date(2026, 0, 1, 10).getTime();

  simulation.purchaseCheapBoost({ now, randomValue: 0 });
  simulation.purchaseCheapBoost({ now, randomValue: 0.31 });
  simulation.purchaseCheapBoost({ now, randomValue: 0.999 });
  simulation.activateNextIncomeBoost();

  const withActiveBoost = simulation.getState();
  const matchingBoost = withActiveBoost.boosts.queuedBoosts.find((boost) => boost.multiplier === 2);
  const mismatchingBoost = withActiveBoost.boosts.queuedBoosts.find((boost) => boost.multiplier === 20);

  assert.ok(matchingBoost);
  assert.ok(mismatchingBoost);

  simulation.activateIncomeBoost(matchingBoost.instanceId);
  const extended = simulation.getState();

  assert.equal(extended.boosts.activeBoost?.multiplier, 2);
  assert.equal(extended.boosts.activeBoost?.remainingSeconds, 5400);
  assert.equal(extended.boosts.queuedBoosts.length, 1);

  const mismatchEvents = simulation.activateIncomeBoost(mismatchingBoost.instanceId);

  assert.equal(mismatchEvents.some((event) => event.type === "actionFailed" && event.reason === "boost_multiplier_mismatch"), true);
  assert.equal(simulation.getState().boosts.activeBoost?.remainingSeconds, 5400);
});

test("Der Cheap-Free-Spin wird am naechsten lokalen Kalendertag wieder frei", () => {
  const simulation = new MineSimulation(cloneBalance(), { fixedStepSeconds: 0.1 });
  const firstDay = new Date(2026, 0, 1, 10).getTime();
  const sameDay = new Date(2026, 0, 1, 22).getTime();
  const nextDay = new Date(2026, 0, 2, 1).getTime();

  simulation.purchaseCheapBoost({ now: firstDay, randomValue: 0 });

  assert.equal(simulation.canClaimDailyCheapBoostSpin(sameDay), false);
  assert.equal(simulation.canClaimDailyCheapBoostSpin(nextDay), true);
});

test("Offline-Ertraege nutzen die verbleibende Boost-Zeit zeitgewichtet", () => {
  const simulation = createAutomatedOfflineSimulation();
  const now = new Date(2026, 0, 1, 10).getTime();

  simulation.purchaseCheapBoost({ now, randomValue: 0 });
  simulation.activateNextIncomeBoost();
  const beforeSave = simulation.getState();
  const mine = beforeSave.mines.coal;
  const bottleneckThroughput = Math.min(
    mine.baseValues.mineShaft.throughputPerSecond,
    mine.baseValues.elevator.throughputPerSecond,
    mine.baseValues.warehouse.throughputPerSecond
  );
  const baseOrePerSecond = bottleneckThroughput / baseBalance.economy.offlineEarningsDivisor;
  const expectedOreSold = roundForState(baseOrePerSecond * 3600);
  const expectedMoney = roundForState(
    baseOrePerSecond * 1800 * 2 * baseBalance.economy.sellPricePerOre +
    baseOrePerSecond * 1800 * baseBalance.economy.sellPricePerOre
  );

  const save = simulation.exportSaveGame(1000);
  const restored = createAutomatedOfflineSimulation();
  const result = restored.importSaveGame(save, 1000 + 3600 * 1000);
  const afterLoad = restored.getState();

  assert.ok(result);
  assert.equal(result.oreSold, expectedOreSold);
  assert.equal(result.moneyEarned, expectedMoney);
  assert.equal(afterLoad.mines.coal.pendingOfflineOreSold, expectedOreSold);
  assert.equal(afterLoad.mines.coal.pendingOfflineCash, expectedMoney);
  assert.equal(afterLoad.boosts.incomeMultiplier, 1);
  assert.equal(afterLoad.boosts.activeBoost, null);
});
