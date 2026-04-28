import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { MineSimulation } from "../core/index.ts";
import type { BalanceConfig } from "../core/index.ts";
import { formatSignificantNumber } from "../core/formatters.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const balancePath = resolve(rootDir, "balance.json");
const balance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

const simulation = new MineSimulation(balance, { fixedStepSeconds: 0.1 });
const events = simulation.update(60);
const state = simulation.getState();

function formatAmount(value: number): string {
  return formatSignificantNumber(value);
}

console.log("60s core simulation debug");
console.log(`Produced ore: ${formatAmount(state.resources.totals.producedOre)}`);
console.log(`Transported ore: ${formatAmount(state.resources.totals.transportedOre)}`);
console.log(`Sold ore: ${formatAmount(state.resources.totals.soldOre)}`);
console.log(`Money earned: ${formatAmount(state.resources.totals.moneyEarned)}`);
console.log("Final storage:");
console.log(`  Mine Shaft: ${formatAmount(state.resources.storedOre.mineShaft)} / ${formatAmount(state.entities.mineShaft.capacity)}`);
console.log(`  Elevator: ${formatAmount(state.resources.storedOre.elevator)} / ${formatAmount(state.entities.elevator.capacity)}`);
console.log(`  Warehouse: ${formatAmount(state.resources.storedOre.warehouse)} / ${formatAmount(state.entities.warehouse.capacity)}`);
console.log(`Money: ${formatAmount(state.money)}`);
console.log(`Events emitted: ${events.length}`);
