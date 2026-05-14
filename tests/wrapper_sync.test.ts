import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { MineSimulation, type BalanceConfig, type SaveGameRecord, type SaveGameRepository } from "../src/core/index.ts";
import { importServerSaveForEmptyLocalGame } from "../src/wrapperSync.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const baseBalance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

function cloneBalance(): BalanceConfig {
  return JSON.parse(JSON.stringify(baseBalance)) as BalanceConfig;
}

function createRepository(save: SaveGameRecord | null): SaveGameRepository {
  return {
    load: () => save,
    save: (record) => {
      save = record;
    },
    clear: () => {
      save = null;
    }
  };
}

function installWrapperWindow(fetchImpl: typeof fetch): () => void {
  const previousWindow = (globalThis as { window?: unknown }).window;
  const previousFetch = globalThis.fetch;
  const parent = {
    APP_CSRF: "test-csrf",
    location: { href: "https://example.test/games/idleminer/play.php" }
  };

  (globalThis as { window?: unknown }).window = {
    parent,
    location: { href: "https://example.test/games/idleminer/index.php" }
  };
  globalThis.fetch = fetchImpl;

  return () => {
    (globalThis as { window?: unknown }).window = previousWindow;
    globalThis.fetch = previousFetch;
  };
}

test("wrapper import skips local saves with Super Cash progress", async () => {
  const simulation = new MineSimulation(cloneBalance(), { fixedStepSeconds: 0.1, isDebug: true });
  const repository = createRepository(simulation.exportSaveGame());
  let fetchCount = 0;
  const restore = installWrapperWindow(async () => {
    fetchCount += 1;
    throw new Error("server_load should not be requested for progressed local saves");
  });

  try {
    await importServerSaveForEmptyLocalGame(repository);
  } finally {
    restore();
  }

  assert.equal(fetchCount, 0);
});

test("wrapper import still checks the server for an empty local save", async () => {
  const repository = createRepository(null);
  let requestedAction = "";
  const restore = installWrapperWindow(async (_input, init) => {
    const body = init?.body;
    if (body instanceof FormData) {
      requestedAction = String(body.get("action") ?? "");
    }

    return {
      json: async () => ({ ok: true, has_save: false })
    } as Response;
  });

  try {
    await importServerSaveForEmptyLocalGame(repository);
  } finally {
    restore();
  }

  assert.equal(requestedAction, "server_load");
});
