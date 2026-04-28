import type { ManagerAbilityType, ManagerArea, ManagerRank } from "./balance.ts";
import type { MineId } from "./mines.ts";
import { DEFAULT_ACTIVE_MINE_ID, MINE_DEFINITIONS } from "./mines.ts";
import type { ManagerState } from "./managers.ts";
import { countManagersByArea, getAssignedManagerIdForArea, normalizeManagerState } from "./managers.ts";
import { isAbilityTypeValidForArea } from "./managers.ts";
import type { ElevatorState, MineShaftState, ResourceTotalsState, WarehouseState } from "./types.ts";

export const SAVEGAME_VERSION = 7 as const;
export const SAVEGAME_STORAGE_KEY = "idle-miner.savegame";

export interface SaveGameStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export interface SaveGameStateV1 {
  timeSeconds: number;
  money: number;
  levels: {
    mineShaft: number;
    elevator: number;
    warehouse: number;
  };
  resources: {
    mineShaft: number;
    elevator: number;
    warehouse: number;
  };
  totals: {
    producedOre: number;
    collectedByElevatorOre: number;
    transportedOre: number;
    soldOre: number;
    moneyEarned: number;
  };
  entities: {
    mineShaft: {
      state: MineShaftState;
      cycleProgressSeconds: number;
      storedOre: number;
    };
    elevator: {
      state: ElevatorState;
      carriedOre: number;
      remainingTripSeconds: number;
    };
    warehouse: {
      state: WarehouseState;
      sellProgressSeconds: number;
      storedOre: number;
    };
  };
}

export interface SaveGameManagersStateV2 {
  hireCountsByArea: Record<ManagerArea, number>;
  assignedManagerIdsByArea: Record<ManagerArea, string | null>;
  ownedManagers: ManagerState[];
}

export interface SaveGameStateV2 extends SaveGameStateV1 {
  managers: SaveGameManagersStateV2;
}

export interface SaveGameManagersStateV3 extends SaveGameManagersStateV2 {
  assignedManagerIdsByShaft: Record<number, string | null>;
}

export interface SaveGameStateV3 extends Omit<SaveGameStateV2, "managers"> {
  managers: SaveGameManagersStateV3;
  mineShafts: Array<{
    shaftId: number;
    isUnlocked: boolean;
    level: number;
    storedOre: number;
    state: MineShaftState;
    cycleProgressSeconds: number;
    assignedManagerId: string | null;
    activeManagerAbilityState: {
      isActive: boolean;
      abilityType: string | null;
      remainingActiveTime: number;
      remainingCooldownTime: number;
    } | null;
  }>;
  blockades?: Array<{
    blockadeId: string;
    afterShaftId: number;
    unlocksShaftId: number;
    isRemoved: boolean;
    removalCost: number;
    removalDurationSeconds: number;
    remainingRemovalSeconds: number;
    isRemoving: boolean;
  }>;
}

export interface SaveGameMineStateV7 {
  mineId: MineId;
  isUnlocked: boolean;
  prestigeLevel: number;
  lastActiveTime: number | null;
  pendingOfflineCash?: number;
  pendingOfflineSeconds?: number;
  pendingOfflineOreSold?: number;
  totals: ResourceTotalsState;
  elevator: {
    level: number;
    state: ElevatorState;
    carriedOre: number;
    remainingTripSeconds: number;
  };
  warehouse: {
    level: number;
    state: WarehouseState;
    storedOre: number;
    sellProgressSeconds: number;
  };
  managers: SaveGameManagersStateV3;
  mineShafts: Array<{
    shaftId: number;
    isUnlocked: boolean;
    level: number;
    storedOre: number;
    state: MineShaftState;
    cycleProgressSeconds: number;
    assignedManagerId: string | null;
    activeManagerAbilityState: {
      isActive: boolean;
      abilityType: string | null;
      remainingActiveTime: number;
      remainingCooldownTime: number;
    } | null;
  }>;
  blockades: Array<{
    blockadeId: string;
    afterShaftId: number;
    unlocksShaftId: number;
    isRemoved: boolean;
    removalCost: number;
    removalDurationSeconds: number;
    remainingRemovalSeconds: number;
    isRemoving: boolean;
  }>;
}

export interface SaveGameStateV7 {
  timeSeconds: number;
  money: number;
  superCash: number;
  activeMineId: MineId;
  mines: SaveGameMineStateV7[];
}

export interface SaveGameRecordV1 {
  version: 1;
  savedAt: number;
  state: SaveGameStateV1;
}

export interface SaveGameRecordV2 {
  version: 2;
  savedAt: number;
  state: SaveGameStateV2;
}

export interface SaveGameRecordV3 {
  version: 3 | 4 | 5 | 6;
  savedAt: number;
  state: SaveGameStateV3;
}

export interface SaveGameRecordV7 {
  version: 7;
  savedAt: number;
  state: SaveGameStateV7;
}

export type SaveGameRecord = SaveGameRecordV7;
export type SaveGameRecordCompatible = SaveGameRecordV1 | SaveGameRecordV2 | SaveGameRecordV3 | SaveGameRecordV7;

export interface SaveGameRepository {
  load(): SaveGameRecord | null;
  save(record: SaveGameRecord): void;
  clear(): void;
}

export function createLocalStorageSaveGameRepository(
  storage: SaveGameStorageLike,
  key: string = SAVEGAME_STORAGE_KEY
): SaveGameRepository {
  return {
    load() {
      try {
        const raw = storage.getItem(key);

        if (raw === null) {
          return null;
        }

        return parseSaveGame(raw);
      } catch {
        return null;
      }
    },
    save(record) {
      try {
        storage.setItem(key, serializeSaveGame(record));
      } catch {
        // Persistency is best-effort. The game must keep running even when storage is unavailable.
      }
    },
    clear() {
      try {
        storage.removeItem?.(key);
      } catch {
        // Ignore storage cleanup errors.
      }
    }
  };
}

export function serializeSaveGame(saveGame: SaveGameRecord): string {
  return JSON.stringify(saveGame);
}

export function parseSaveGame(raw: string): SaveGameRecord | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || typeof parsed.version !== "number" || !Number.isInteger(parsed.version)) {
    return null;
  }

  const savedAt = readNonNegativeNumber(parsed.savedAt);

  if (savedAt === null) {
    return null;
  }

  if (parsed.version === 1) {
    const state = readStateV1(parsed.state);

    if (state === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV2ToV3(upgradeStateV1ToV2(state)))
    };
  }

  if (parsed.version === 2) {
    const state = readStateV2(parsed.state);

    if (state === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV2ToV3(state))
    };
  }

  if (parsed.version === 3 || parsed.version === 4 || parsed.version === 5 || parsed.version === 6) {
    const state = readStateV3(parsed.state);

    if (state === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV5ToV6(upgradeStateV4ToV5(state)))
    };
  }

  if (parsed.version === SAVEGAME_VERSION) {
    const state = readStateV7(parsed.state);

    if (state !== null) {
      return {
        version: SAVEGAME_VERSION,
        savedAt,
        state
      };
    }

    const legacyState = readStateV3(parsed.state);

    if (legacyState === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV5ToV6(upgradeStateV4ToV5(legacyState)))
    };
  }

  return null;
}

export function normalizeSaveGameRecord(saveGame: SaveGameRecordCompatible): SaveGameRecord | null {
  if (saveGame.version === 1) {
    const state = readStateV1(saveGame.state);

    if (state === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt: saveGame.savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV2ToV3(upgradeStateV1ToV2(state)))
    };
  }

  if (saveGame.version === 2) {
    const state = readStateV2(saveGame.state);

    if (state === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt: saveGame.savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV2ToV3(state))
    };
  }

  if (saveGame.version === 3 || saveGame.version === 4 || saveGame.version === 5 || saveGame.version === 6) {
    const state = readStateV3(saveGame.state);

    if (state === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt: saveGame.savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV5ToV6(upgradeStateV4ToV5(state)))
    };
  }

  if (saveGame.version === SAVEGAME_VERSION) {
    const state = readStateV7(saveGame.state);

    if (state !== null) {
      return {
        version: SAVEGAME_VERSION,
        savedAt: saveGame.savedAt,
        state
      };
    }

    const legacyState = readStateV3(saveGame.state);

    if (legacyState === null) {
      return null;
    }

    return {
      version: SAVEGAME_VERSION,
      savedAt: saveGame.savedAt,
      state: upgradeLegacyStateToV7(upgradeStateV5ToV6(upgradeStateV4ToV5(legacyState)))
    };
  }

  return null;
}

function readStateV1(value: unknown): SaveGameStateV1 | null {
  return readSharedState(value);
}

function readStateV2(value: unknown): SaveGameStateV2 | null {
  const shared = readSharedState(value);

  if (shared === null) {
    return null;
  }

  const managers = readManagersSectionV2(isRecord(value) ? value.managers : undefined);

  if (managers === null) {
    return null;
  }

  return { ...shared, managers };
}

function readStateV3(value: unknown): SaveGameStateV3 | null {
  const shared = readSharedState(value);

  if (shared === null || !isRecord(value)) {
    return null;
  }

  const managers = readManagersSectionV3(value.managers);
  const mineShafts = readMineShaftsSection(value.mineShafts);
  const blockades = readBlockadesSection(value.blockades);

  if (managers === null || mineShafts === null) {
    return null;
  }

  return {
    ...shared,
    managers,
    mineShafts,
    blockades: blockades ?? undefined
  };
}

function readStateV7(value: unknown): SaveGameStateV7 | null {
  if (!isRecord(value)) {
    return null;
  }

  const timeSeconds = readNonNegativeNumber(value.timeSeconds);
  const money = readNonNegativeNumber(value.money);
  const superCash = value.superCash === undefined ? 0 : readNonNegativeNumber(value.superCash);
  const activeMineId = readString(value.activeMineId);
  const mines = readMinesV7(value.mines);

  if (timeSeconds === null || money === null || superCash === null || activeMineId === null || mines === null) {
    return null;
  }

  return {
    timeSeconds,
    money,
    superCash,
    activeMineId,
    mines
  };
}

function readSharedState(value: unknown): SaveGameStateV1 | null {
  if (!isRecord(value)) {
    return null;
  }

  const timeSeconds = readNonNegativeNumber(value.timeSeconds);
  const money = readNonNegativeNumber(value.money);
  const levels = readLevels(value.levels);
  const resources = readResources(value.resources);
  const totals = readTotals(value.totals);
  const entities = readEntities(value.entities);

  if (
    timeSeconds === null ||
    money === null ||
    levels === null ||
    resources === null ||
    totals === null ||
    entities === null
  ) {
    return null;
  }

  return {
    timeSeconds,
    money,
    levels,
    resources,
    totals,
    entities
  };
}

function upgradeStateV1ToV2(state: SaveGameStateV1): SaveGameStateV2 {
  return {
    ...state,
    managers: createEmptyManagersStateV2()
  };
}

function upgradeStateV2ToV3(state: SaveGameStateV2): SaveGameStateV3 {
  return {
    ...state,
    managers: {
      ...state.managers,
      assignedManagerIdsByShaft: {}
    },
    mineShafts: [
      {
        shaftId: 1,
        isUnlocked: true,
        level: state.levels.mineShaft,
        storedOre: state.resources.mineShaft,
        state: state.entities.mineShaft.state,
        cycleProgressSeconds: state.entities.mineShaft.cycleProgressSeconds,
        assignedManagerId: state.managers.assignedManagerIdsByArea.mineShaft,
        activeManagerAbilityState: null
      }
    ]
  };
}

function upgradeStateV4ToV5(state: SaveGameStateV3): SaveGameStateV3 {
  if (state.blockades) {
    return state;
  }

  return {
    ...state,
    blockades: []
  };
}

function upgradeStateV5ToV6(state: SaveGameStateV3): SaveGameStateV3 {
  return state;
}

function upgradeLegacyStateToV7(state: SaveGameStateV3): SaveGameStateV7 {
  const coalMineId = MINE_DEFINITIONS[0]?.mineId ?? DEFAULT_ACTIVE_MINE_ID;

  return {
    timeSeconds: state.timeSeconds,
    money: state.money,
    superCash: 0,
    activeMineId: coalMineId,
    mines: MINE_DEFINITIONS.map((definition) => {
      if (definition.mineId === coalMineId) {
        return convertLegacyMineState(coalMineId, state);
      }

      return createLockedMineState(definition.mineId);
    })
  };
}

function convertLegacyMineState(mineId: MineId, state: SaveGameStateV3): SaveGameMineStateV7 {
  return {
    mineId,
    isUnlocked: true,
    prestigeLevel: 0,
    lastActiveTime: state.timeSeconds,
    pendingOfflineCash: 0,
    pendingOfflineSeconds: 0,
    pendingOfflineOreSold: 0,
    totals: { ...state.totals },
    elevator: {
      level: state.levels.elevator,
      state: state.entities.elevator.state,
      carriedOre: state.resources.elevator,
      remainingTripSeconds: state.entities.elevator.remainingTripSeconds
    },
    warehouse: {
      level: state.levels.warehouse,
      state: state.entities.warehouse.state,
      storedOre: state.resources.warehouse,
      sellProgressSeconds: state.entities.warehouse.sellProgressSeconds
    },
    managers: state.managers,
    mineShafts: state.mineShafts,
    blockades: state.blockades ?? []
  };
}

function createLockedMineState(mineId: MineId): SaveGameMineStateV7 {
  return {
    mineId,
    isUnlocked: false,
    prestigeLevel: 0,
    lastActiveTime: null,
    pendingOfflineCash: 0,
    pendingOfflineSeconds: 0,
    pendingOfflineOreSold: 0,
    totals: createZeroTotals(),
    elevator: {
      level: 1,
      state: "idle",
      carriedOre: 0,
      remainingTripSeconds: 0
    },
    warehouse: {
      level: 1,
      state: "idle",
      storedOre: 0,
      sellProgressSeconds: 0
    },
    managers: createEmptyManagersStateV3(),
    mineShafts: [],
    blockades: []
  };
}

function readLevels(value: unknown): SaveGameStateV1["levels"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const mineShaft = readPositiveInteger(value.mineShaft);
  const elevator = readPositiveInteger(value.elevator);
  const warehouse = readPositiveInteger(value.warehouse);

  if (mineShaft === null || elevator === null || warehouse === null) {
    return null;
  }

  return { mineShaft, elevator, warehouse };
}

function readResources(value: unknown): SaveGameStateV1["resources"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const mineShaft = readNonNegativeNumber(value.mineShaft);
  const elevator = readNonNegativeNumber(value.elevator);
  const warehouse = readNonNegativeNumber(value.warehouse);

  if (mineShaft === null || elevator === null || warehouse === null) {
    return null;
  }

  return { mineShaft, elevator, warehouse };
}

function readTotals(value: unknown): SaveGameStateV1["totals"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const producedOre = readNonNegativeNumber(value.producedOre);
  const collectedByElevatorOre = readNonNegativeNumber(value.collectedByElevatorOre);
  const transportedOre = readNonNegativeNumber(value.transportedOre);
  const soldOre = readNonNegativeNumber(value.soldOre);
  const moneyEarned = readNonNegativeNumber(value.moneyEarned);

  if (
    producedOre === null ||
    collectedByElevatorOre === null ||
    transportedOre === null ||
    soldOre === null ||
    moneyEarned === null
  ) {
    return null;
  }

  return {
    producedOre,
    collectedByElevatorOre,
    transportedOre,
    soldOre,
    moneyEarned
  };
}

function readEntities(value: unknown): SaveGameStateV1["entities"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const mineShaft = readMineShaftEntity(value.mineShaft);
  const elevator = readElevatorEntity(value.elevator);
  const warehouse = readWarehouseEntity(value.warehouse);

  if (mineShaft === null || elevator === null || warehouse === null) {
    return null;
  }

  return { mineShaft, elevator, warehouse };
}

function readMineShaftEntity(value: unknown): SaveGameStateV1["entities"]["mineShaft"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const state = readMineShaftState(value.state);
  const cycleProgressSeconds = readNonNegativeNumber(value.cycleProgressSeconds);
  const storedOre = readNonNegativeNumber(value.storedOre);

  if (state === null || cycleProgressSeconds === null || storedOre === null) {
    return null;
  }

  return { state, cycleProgressSeconds, storedOre };
}

function readElevatorEntity(value: unknown): SaveGameStateV1["entities"]["elevator"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const state = readElevatorState(value.state);
  const carriedOre = readNonNegativeNumber(value.carriedOre);
  const remainingTripSeconds = readNonNegativeNumber(value.remainingTripSeconds);

  if (state === null || carriedOre === null || remainingTripSeconds === null) {
    return null;
  }

  return { state, carriedOre, remainingTripSeconds };
}

function readWarehouseEntity(value: unknown): SaveGameStateV1["entities"]["warehouse"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const state = readWarehouseState(value.state);
  const sellProgressSeconds = readNonNegativeNumber(value.sellProgressSeconds);
  const storedOre = readNonNegativeNumber(value.storedOre);

  if (state === null || sellProgressSeconds === null || storedOre === null) {
    return null;
  }

  return { state, sellProgressSeconds, storedOre };
}

function readManagersSectionV2(value: unknown): SaveGameManagersStateV2 | null {
  if (value === undefined || value === null) {
    return createEmptyManagersStateV2();
  }

  if (!isRecord(value)) {
    return null;
  }

  const ownedManagers = readOwnedManagers(value.ownedManagers);

  if (ownedManagers === null) {
    return null;
  }

  const derivedCounts = countManagersByArea(ownedManagers);
  const hireCountsByArea = readHireCountsByArea(value.hireCountsByArea) ?? derivedCounts;
  const assignedManagerIdsByArea = readAssignedManagerIdsByArea(value.assignedManagerIdsByArea) ?? deriveAssignedManagerIds(ownedManagers);

  return {
    hireCountsByArea,
    assignedManagerIdsByArea,
    ownedManagers
  };
}

function readManagersSectionV3(value: unknown): SaveGameManagersStateV3 | null {
  const v2 = readManagersSectionV2(value);

  if (v2 === null) {
    return null;
  }

  if (!isRecord(value)) {
    return {
      ...v2,
      assignedManagerIdsByShaft: {}
    };
  }

  const assignedManagerIdsByShaft = readAssignedManagerIdsByShaft(value.assignedManagerIdsByShaft) ?? {};

  return {
    ...v2,
    assignedManagerIdsByShaft
  };
}

function readMineShaftsSection(value: unknown): SaveGameStateV3["mineShafts"] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const shafts: SaveGameStateV3["mineShafts"] = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      return null;
    }

    const shaftId = readPositiveInteger(entry.shaftId);
    const isUnlocked = readBoolean(entry.isUnlocked);
    const level = readPositiveInteger(entry.level);
    const storedOre = readNonNegativeNumber(entry.storedOre);
    const state = readMineShaftState(entry.state);
    const cycleProgressSeconds = readNonNegativeNumber(entry.cycleProgressSeconds);
    const assignedManagerId = readNullableString(entry.assignedManagerId);
    const abilityState = readActiveManagerAbilityState(entry.activeManagerAbilityState);

    if (
      shaftId === null ||
      isUnlocked === null ||
      level === null ||
      storedOre === null ||
      state === null ||
      cycleProgressSeconds === null ||
      assignedManagerId === undefined
    ) {
      return null;
    }

    shafts.push({
      shaftId,
      isUnlocked,
      level,
      storedOre,
      state,
      cycleProgressSeconds,
      assignedManagerId,
      activeManagerAbilityState: abilityState
    });
  }

  return shafts;
}

function readActiveManagerAbilityState(
  value: unknown
): SaveGameStateV3["mineShafts"][number]["activeManagerAbilityState"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const isActive = readBoolean(value.isActive);
  const abilityType = readNullableString(value.abilityType);
  const remainingActiveTime = readNonNegativeNumber(value.remainingActiveTime);
  const remainingCooldownTime = readNonNegativeNumber(value.remainingCooldownTime);

  if (
    isActive === null ||
    abilityType === undefined ||
    remainingActiveTime === null ||
    remainingCooldownTime === null
  ) {
    return null;
  }

  return {
    isActive,
    abilityType,
    remainingActiveTime,
    remainingCooldownTime
  };
}

function readBlockadesSection(value: unknown): SaveGameStateV3["blockades"] | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const blockades: NonNullable<SaveGameStateV3["blockades"]> = [];

  for (const entry of value) {
    if (!isRecord(entry)) {
      return null;
    }

    const blockadeId = readString(entry.blockadeId);
    const afterShaftId = readNonNegativeInteger(entry.afterShaftId);
    const unlocksShaftId = readNonNegativeInteger(entry.unlocksShaftId);
    const isRemoved = readBoolean(entry.isRemoved);
    const removalCost = readNonNegativeNumber(entry.removalCost);
    const removalDurationSeconds = readNonNegativeNumber(entry.removalDurationSeconds);
    const remainingRemovalSeconds = readNonNegativeNumber(entry.remainingRemovalSeconds);
    const isRemoving = readBoolean(entry.isRemoving);

    if (
      blockadeId === null ||
      afterShaftId === null ||
      unlocksShaftId === null ||
      isRemoved === null ||
      remainingRemovalSeconds === null ||
      isRemoving === null
    ) {
      return null;
    }

    blockades.push({
      blockadeId,
      afterShaftId,
      unlocksShaftId,
      isRemoved,
      removalCost: removalCost ?? 0,
      removalDurationSeconds: removalDurationSeconds ?? 0,
      remainingRemovalSeconds,
      isRemoving
    });
  }

  return blockades;
}

function readMinesV7(value: unknown): SaveGameMineStateV7[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const mines: SaveGameMineStateV7[] = [];

  for (const entry of value) {
    const mine = readMineV7(entry);

    if (mine === null) {
      return null;
    }

    mines.push(mine);
  }

  return mines;
}

function readMineV7(value: unknown): SaveGameMineStateV7 | null {
  if (!isRecord(value)) {
    return null;
  }

  const mineId = readString(value.mineId);
  const isUnlocked = readBoolean(value.isUnlocked);
  const prestigeLevel = readNonNegativeInteger(value.prestigeLevel) ?? 0;
  const lastActiveTime = readNullableNumber(value.lastActiveTime) ?? null;
  const pendingOfflineCash = readNonNegativeNumber(value.pendingOfflineCash) ?? 0;
  const pendingOfflineSeconds = readNonNegativeNumber(value.pendingOfflineSeconds) ?? 0;
  const pendingOfflineOreSold = readNonNegativeNumber(value.pendingOfflineOreSold) ?? 0;
  const totals = readTotals(value.totals) ?? createZeroTotals();
  const elevator = readMineElevatorV7(value.elevator) ?? createDefaultElevatorState();
  const warehouse = readMineWarehouseV7(value.warehouse) ?? createDefaultWarehouseState();
  const managers = readManagersSectionV3(value.managers) ?? createEmptyManagersStateV3();
  const mineShafts = Array.isArray(value.mineShafts) ? readMineShaftsSection(value.mineShafts) ?? [] : [];
  const blockades = Array.isArray(value.blockades) ? readBlockadesSection(value.blockades) ?? [] : [];

  if (mineId === null || isUnlocked === null) {
    return null;
  }

  return {
    mineId,
    isUnlocked,
    prestigeLevel,
    lastActiveTime,
    pendingOfflineCash,
    pendingOfflineSeconds,
    pendingOfflineOreSold,
    totals,
    elevator,
    warehouse,
    managers,
    mineShafts,
    blockades
  };
}

function readMineElevatorV7(value: unknown): SaveGameMineStateV7["elevator"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const level = readPositiveInteger(value.level);
  const state = readElevatorState(value.state);
  const carriedOre = readNonNegativeNumber(value.carriedOre);
  const remainingTripSeconds = readNonNegativeNumber(value.remainingTripSeconds);

  if (level === null || state === null || carriedOre === null || remainingTripSeconds === null) {
    return null;
  }

  return {
    level,
    state,
    carriedOre,
    remainingTripSeconds
  };
}

function readMineWarehouseV7(value: unknown): SaveGameMineStateV7["warehouse"] | null {
  if (!isRecord(value)) {
    return null;
  }

  const level = readPositiveInteger(value.level);
  const state = readWarehouseState(value.state);
  const storedOre = readNonNegativeNumber(value.storedOre);
  const sellProgressSeconds = readNonNegativeNumber(value.sellProgressSeconds);

  if (level === null || state === null || storedOre === null || sellProgressSeconds === null) {
    return null;
  }

  return {
    level,
    state,
    storedOre,
    sellProgressSeconds
  };
}

function createEmptyManagersStateV2(): SaveGameManagersStateV2 {
  return {
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
  };
}

function createEmptyManagersStateV3(): SaveGameManagersStateV3 {
  return {
    ...createEmptyManagersStateV2(),
    assignedManagerIdsByShaft: {}
  };
}

function createZeroTotals(): ResourceTotalsState {
  return {
    producedOre: 0,
    collectedByElevatorOre: 0,
    transportedOre: 0,
    soldOre: 0,
    moneyEarned: 0
  };
}

function createDefaultElevatorState(): SaveGameMineStateV7["elevator"] {
  return {
    level: 1,
    state: "idle",
    carriedOre: 0,
    remainingTripSeconds: 0
  };
}

function createDefaultWarehouseState(): SaveGameMineStateV7["warehouse"] {
  return {
    level: 1,
    state: "idle",
    storedOre: 0,
    sellProgressSeconds: 0
  };
}

function readHireCountsByArea(value: unknown): Record<ManagerArea, number> | null {
  if (!isRecord(value)) {
    return null;
  }

  const mineShaft = readNonNegativeInteger(value.mineShaft);
  const elevator = readNonNegativeInteger(value.elevator);
  const warehouse = readNonNegativeInteger(value.warehouse);

  if (mineShaft === null || elevator === null || warehouse === null) {
    return null;
  }

  return { mineShaft, elevator, warehouse };
}

function readAssignedManagerIdsByArea(value: unknown): Record<ManagerArea, string | null> | null {
  if (!isRecord(value)) {
    return null;
  }

  const mineShaft = readNullableString(value.mineShaft);
  const elevator = readNullableString(value.elevator);
  const warehouse = readNullableString(value.warehouse);

  if (mineShaft === undefined || elevator === undefined || warehouse === undefined) {
    return null;
  }

  return { mineShaft, elevator, warehouse };
}

function readAssignedManagerIdsByShaft(value: unknown): Record<number, string | null> | null {
  if (!isRecord(value)) {
    return null;
  }

  const result: Record<number, string | null> = {};

  for (const key of Object.keys(value)) {
    const shaftId = parseInt(key, 10);

    if (Number.isNaN(shaftId)) {
      continue;
    }

    const managerId = readNullableString(value[key]);

    if (managerId === undefined) {
      return null;
    }

    result[shaftId] = managerId;
  }

  return result;
}

function deriveAssignedManagerIds(managers: readonly ManagerState[]): Record<ManagerArea, string | null> {
  return {
    mineShaft: getAssignedManagerIdForArea(managers, "mineShaft"),
    elevator: getAssignedManagerIdForArea(managers, "elevator"),
    warehouse: getAssignedManagerIdForArea(managers, "warehouse")
  };
}

function readOwnedManagers(value: unknown): ManagerState[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const managers: ManagerState[] = [];

  for (const entry of value) {
    const manager = readManagerState(entry);

    if (manager === null) {
      return null;
    }

    managers.push(manager);
  }

  return managers;
}

function readManagerState(value: unknown): ManagerState | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const displayName = readString(value.displayName);
  const area = readManagerArea(value.area);
  const rank = readManagerRank(value.rank);
  const abilityType = readManagerAbilityType(value.abilityType, area);
  const abilityMultiplier = readNonNegativeNumber(value.abilityMultiplier);
  const costReductionMultiplier = readNonNegativeNumber(value.costReductionMultiplier);
  const activeDurationSeconds = readNonNegativeNumber(value.activeDurationSeconds);
  const cooldownSeconds = readNonNegativeNumber(value.cooldownSeconds);
  const hireCost = readNonNegativeNumber(value.hireCost);
  const isOwned = readBoolean(value.isOwned);
  const isAssigned = readBoolean(value.isAssigned);
  const assignedShaftId = readNullableNumber(value.assignedShaftId);
  const isActive = readBoolean(value.isActive);
  const remainingActiveTime = readNonNegativeNumber(value.remainingActiveTime);
  const remainingCooldownTime = readNonNegativeNumber(value.remainingCooldownTime);

  if (
    id === null ||
    displayName === null ||
    area === null ||
    rank === null ||
    abilityType === null ||
    isOwned === null ||
    isAssigned === null ||
    assignedShaftId === undefined ||
    isActive === null ||
    remainingActiveTime === null ||
    remainingCooldownTime === null
  ) {
    return null;
  }

  return normalizeManagerState({
    id,
    displayName,
    area,
    rank,
    abilityType,
    abilityMultiplier: abilityMultiplier ?? 1,
    costReductionMultiplier: costReductionMultiplier ?? 1,
    activeDurationSeconds: activeDurationSeconds ?? 0,
    cooldownSeconds: cooldownSeconds ?? 0,
    hireCost: hireCost ?? 0,
    isOwned,
    isAssigned,
    assignedShaftId,
    isActive,
    remainingActiveTime,
    remainingCooldownTime
  });
}

function readManagerArea(value: unknown): ManagerArea | null {
  return value === "mineShaft" || value === "elevator" || value === "warehouse" ? value : null;
}

function readManagerRank(value: unknown): ManagerRank | null {
  return value === "junior" || value === "senior" || value === "executive" ? value : null;
}

function readManagerAbilityType(value: unknown, area: ManagerArea | null): ManagerAbilityType | null {
  if (typeof value !== "string" || area === null || !isAbilityTypeValidForArea(area, value as ManagerAbilityType)) {
    return null;
  }

  return value as ManagerAbilityType;
}

function readMineShaftState(value: unknown): MineShaftState | null {
  return value === "idle" || value === "mining" || value === "blocked" || value === "inactive" ? value : null;
}

function readElevatorState(value: unknown): ElevatorState | null {
  return value === "idle" || value === "moving" || value === "unloading" || value === "returning" ? value : null;
}

function readWarehouseState(value: unknown): WarehouseState | null {
  return value === "idle" || value === "selling" ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return typeof value === "string" && value.length > 0 ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readNonNegativeNumber(value: unknown): number | null {
  const num = readFiniteNumber(value);
  return num !== null && num >= 0 ? num : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  const num = readFiniteNumber(value);
  return num !== null && Number.isInteger(num) && num >= 0 ? num : null;
}

function readPositiveInteger(value: unknown): number | null {
  const num = readFiniteNumber(value);
  return num !== null && Number.isInteger(num) && num >= 1 ? num : null;
}

function readNullableNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  return readFiniteNumber(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
