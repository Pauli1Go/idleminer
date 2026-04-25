import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  MineSimulation,
  SAVEGAME_VERSION,
  createLocalStorageSaveGameRepository,
  parseSaveGame,
  serializeSaveGame,
  type BalanceConfig,
  type SaveGameRecord,
  type SaveGameStorageLike
} from "../src/core/index.ts";
import { SimulationViewModel } from "../src/game/SimulationViewModel.ts";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const balancePath = resolve(rootDir, "balance.json");
const balance = JSON.parse(readFileSync(balancePath, "utf8")) as BalanceConfig;

class MemoryStorage implements SaveGameStorageLike {
  private rawValue: string | null;

  constructor(initialValue: string | null = null) {
    this.rawValue = initialValue;
  }

  getItem(_key: string): string | null {
    return this.rawValue;
  }

  setItem(_key: string, value: string): void {
    this.rawValue = value;
  }

  removeItem(_key: string): void {
    this.rawValue = null;
  }

  get raw(): string | null {
    return this.rawValue;
  }
}

function createSaveRecord(savedAt: number): SaveGameRecord {
  return {
    version: 1,
    savedAt,
    state: {
      timeSeconds: 123.5,
      money: 412,
      levels: {
        mineShaft: 2,
        elevator: 3,
        warehouse: 4
      },
      resources: {
        mineShaft: 8,
        elevator: 2.5,
        warehouse: 12
      },
      totals: {
        producedOre: 50,
        collectedByElevatorOre: 30,
        transportedOre: 27,
        soldOre: 18,
        moneyEarned: 72
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
        ownedManagers: []
      },
      entities: {
        mineShaft: {
          state: "idle",
          cycleProgressSeconds: 0,
          storedOre: 8
        },
        elevator: {
          state: "moving",
          carriedOre: 2.5,
          remainingTripSeconds: 0.8
        },
        warehouse: {
          state: "idle",
          sellProgressSeconds: 0,
          storedOre: 12
        }
      }
    }
  };
}

function assertLoadedState(viewModel: SimulationViewModel, expected: SaveGameRecord["state"]): void {
  const frame = viewModel.getInitialFrame();

  assert.equal(frame.state.money, expected.money);
  assert.equal(frame.state.levels.mineShaft, expected.levels.mineShaft);
  assert.equal(frame.state.levels.elevator, expected.levels.elevator);
  assert.equal(frame.state.levels.warehouse, expected.levels.warehouse);
  
  assert.equal(frame.state.resources.storedOre.mineShaft, expected.resources.mineShaft);
  assert.equal(frame.state.resources.storedOre.elevator, expected.resources.elevator);
  assert.equal(frame.state.resources.storedOre.warehouse, expected.resources.warehouse);
  assert.equal(frame.state.resources.totals.producedOre, expected.totals.producedOre);
  assert.equal(frame.state.resources.totals.collectedByElevatorOre, expected.totals.collectedByElevatorOre);
  assert.equal(frame.state.resources.totals.transportedOre, expected.totals.transportedOre);
  assert.equal(frame.state.resources.totals.soldOre, expected.totals.soldOre);
  assert.equal(frame.state.resources.totals.moneyEarned, expected.totals.moneyEarned);
  assert.deepEqual(frame.state.managers.hireCountsByArea, expected.managers.hireCountsByArea);
  assert.deepEqual(frame.state.managers.assignedManagerIdsByArea, expected.managers.assignedManagerIdsByArea);
  assert.equal(frame.state.managers.ownedManagers.length, expected.managers.ownedManagers.length);
  assert.equal(frame.state.entities.mineShaft.state, expected.entities.mineShaft.state);
  assert.equal(frame.state.entities.mineShaft.storedOre, expected.entities.mineShaft.storedOre);
  assert.equal(frame.state.entities.elevator.state, expected.entities.elevator.state);
  assert.equal(frame.state.entities.elevator.carriedOre, expected.entities.elevator.carriedOre);
  assert.equal(frame.state.entities.warehouse.state, expected.entities.warehouse.state);
  assert.equal(frame.state.entities.warehouse.storedOre, expected.entities.warehouse.storedOre);
}

test("starts a new game when no save exists", () => {
  const storage = new MemoryStorage();
  const repository = createLocalStorageSaveGameRepository(storage);
  const viewModel = new SimulationViewModel(balance, { saveRepository: repository });
  const frame = viewModel.getInitialFrame();

  assert.equal(frame.state.money, balance.economy.startingMoney);
  assert.equal(frame.state.levels.mineShaft, balance.mineShaft.startingLevel);
  assert.equal(frame.state.levels.elevator, balance.elevator.startingLevel);
  assert.equal(frame.state.levels.warehouse, balance.warehouse.startingLevel);
  assert.equal(frame.state.resources.storedOre.mineShaft, balance.startingStorage.startingMineShaftStoredOre);
  assert.equal(frame.state.resources.storedOre.elevator, balance.startingStorage.startingElevatorStoredOre);
  assert.equal(frame.state.resources.storedOre.warehouse, balance.startingStorage.startingWarehouseStoredOre);
  assert.equal(frame.state.resources.totals.moneyEarned, 0);

  viewModel.dispose();
});

test("elevator collects ore only after reaching the mine", () => {
  const simulation = new MineSimulation(balance, { fixedStepSeconds: 0.1 });

  simulation.mineShaft.storedOre = 2;
  simulation.mineShaft.totalProducedOre = 2;

  const startEvents = simulation.startElevatorCycle();

  assert.equal(simulation.getState().resources.storedOre.mineShaft, 2);
  assert.equal(simulation.getState().resources.storedOre.elevator, 0);
  assert.equal(simulation.getState().entities.elevator.state, "moving");
  assert.equal(startEvents.some((event) => event.type === "elevatorCycleStarted"), true);

  simulation.update(1.0);

  const afterBottomArrival = simulation.getState();

  assert.equal(afterBottomArrival.resources.storedOre.mineShaft, 0);
  assert.equal(afterBottomArrival.resources.storedOre.elevator, 2);
  assert.equal(afterBottomArrival.entities.elevator.state, "returning");
  assert.equal(afterBottomArrival.entities.elevator.carriedOre, 2);

  simulation.update(1.0);

  const afterReturn = simulation.getState();

  assert.equal(afterReturn.resources.storedOre.mineShaft, 0);
  assert.equal(afterReturn.resources.storedOre.elevator, 0);
  assert.equal(afterReturn.resources.storedOre.warehouse, 2);
  assert.equal(afterReturn.entities.elevator.state, "idle");
});

test("saves and loads the full core state", () => {
  const storage = new MemoryStorage(serializeSaveGame(createSaveRecord(1111)));
  const repository = createLocalStorageSaveGameRepository(storage);

  const firstViewModel = new SimulationViewModel(balance, { saveRepository: repository });
  const expectedState = createSaveRecord(1111).state;

  assertLoadedState(firstViewModel, expectedState);

  firstViewModel.dispose();

  const savedAfterDispose = parseSaveGame(storage.raw ?? "");

  assert.ok(savedAfterDispose);
  assert.equal(savedAfterDispose.version, SAVEGAME_VERSION);
  assert.equal(savedAfterDispose.savedAt >= 1111, true);
  assert.deepEqual(savedAfterDispose.state.levels, expectedState.levels);
  assert.deepEqual(savedAfterDispose.state.resources, expectedState.resources);
  assert.equal(savedAfterDispose.state.entities.elevator.state, expectedState.entities.elevator.state);

  const secondViewModel = new SimulationViewModel(balance, { saveRepository: repository });
  assertLoadedState(secondViewModel, expectedState);

  secondViewModel.dispose();
});

test("ignores damaged save data and starts fresh", () => {
  const storage = new MemoryStorage("{\"version\":1,\"savedAt\":1234,\"state\":{");
  const repository = createLocalStorageSaveGameRepository(storage);
  const viewModel = new SimulationViewModel(balance, { saveRepository: repository });
  const frame = viewModel.getInitialFrame();

  assert.equal(frame.state.money, balance.economy.startingMoney);
  assert.equal(frame.state.levels.mineShaft, balance.mineShaft.startingLevel);
  assert.equal(frame.state.levels.elevator, balance.elevator.startingLevel);
  assert.equal(frame.state.levels.warehouse, balance.warehouse.startingLevel);

  viewModel.dispose();
});

test("auto-saves after the configured interval", () => {
  const storage = new MemoryStorage();
  const repository = createLocalStorageSaveGameRepository(storage);
  const viewModel = new SimulationViewModel(balance, { saveRepository: repository, autoSaveIntervalSeconds: 1 });
  const beforeUpdate = storage.raw;

  viewModel.update(1.1);

  assert.notEqual(storage.raw, beforeUpdate);

  const saved = parseSaveGame(storage.raw ?? "");

  assert.ok(saved);
  assert.equal(saved.version, SAVEGAME_VERSION);
  assert.equal(saved.savedAt > 0, true);

  viewModel.dispose();
});
