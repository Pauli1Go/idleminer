import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  getUpgradePreview,
  purchaseUpgrade,
  type BalanceConfig
} from "../src/core/index.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const baseBalance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

test("x100 upgrade kauft die restlichen Levels vor Max-Level", () => {
  const remainingLevels = 16;
  const currentLevel = baseBalance.mineShaft.maxLevelPerShaft - remainingLevels;
  const expensivePreview = getUpgradePreview(baseBalance, "mineShaft", 1e200, currentLevel, 100);
  const exactCost = expensivePreview.cost;

  const preview = getUpgradePreview(baseBalance, "mineShaft", exactCost, currentLevel, 100);
  assert.equal(preview.levelsToBuy, remainingLevels);
  assert.equal(preview.targetLevel, baseBalance.mineShaft.maxLevelPerShaft);
  assert.equal(preview.affordable, true);

  const result = purchaseUpgrade(baseBalance, "mineShaft", exactCost, currentLevel, 100);
  assert.equal(result.purchased, true);
  assert.equal(result.levelsPurchased, remainingLevels);
  assert.equal(result.currentLevel, baseBalance.mineShaft.maxLevelPerShaft);
  assert.equal(result.currentMoney, 0);
});
