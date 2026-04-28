export type MineId = string;

export interface MinePrestigeData {
  prestigeLevel: number;
  cost: number;
  multiplier: number;
}

export interface MineDefinition {
  mineId: MineId;
  displayName: string;
  unlockCost: number;
  prestigeLevels: MinePrestigeData[];
}

interface PrestigeBalanceFile {
  mines: MineDefinition[];
}

const PRESTIGE_BALANCE_URL = new URL("../../prestige-balance.json", import.meta.url);

export const PRESTIGE_BALANCE = loadPrestigeBalanceFile();
export const MINE_DEFINITIONS = PRESTIGE_BALANCE.mines;
export const MINE_DEFINITIONS_BY_ID = Object.fromEntries(
  MINE_DEFINITIONS.map((definition) => [definition.mineId, definition])
) as Record<MineId, MineDefinition>;
export const DEFAULT_ACTIVE_MINE_ID = MINE_DEFINITIONS[0]?.mineId ?? "coal";

export function getMineDefinition(mineId: MineId): MineDefinition {
  const definition = MINE_DEFINITIONS_BY_ID[mineId];

  if (definition === undefined) {
    throw new Error(`Unknown mine id: ${mineId}`);
  }

  return definition;
}

export function getMinePrestigeData(mineId: MineId, prestigeLevel: number): MinePrestigeData {
  const definition = getMineDefinition(mineId);
  const prestigeData = definition.prestigeLevels.find((entry) => entry.prestigeLevel === prestigeLevel);

  if (prestigeData === undefined) {
    throw new Error(`Missing prestige data for mine ${mineId} at level ${prestigeLevel}.`);
  }

  return prestigeData;
}

export function getNextMinePrestigeData(mineId: MineId, prestigeLevel: number): MinePrestigeData | null {
  const definition = getMineDefinition(mineId);
  return definition.prestigeLevels.find((entry) => entry.prestigeLevel === prestigeLevel + 1) ?? null;
}

function loadPrestigeBalanceFile(): PrestigeBalanceFile {
  const raw = loadTextFile(PRESTIGE_BALANCE_URL);
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Unable to parse prestige-balance.json: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return validatePrestigeBalanceFile(parsed);
}

function validatePrestigeBalanceFile(value: unknown): PrestigeBalanceFile {
  if (!isRecord(value) || !Array.isArray(value.mines)) {
    throw new Error("prestige-balance.json must contain a top-level `mines` array.");
  }

  const mines = value.mines.map((entry, index) => validateMineDefinition(entry, index));

  if (mines.length === 0) {
    throw new Error("prestige-balance.json must contain at least one mine definition.");
  }

  return { mines };
}

function validateMineDefinition(value: unknown, index: number): MineDefinition {
  if (!isRecord(value)) {
    throw new Error(`Mine definition at index ${index} is invalid.`);
  }

  const mineId = readNonEmptyString(value.mineId);
  const displayName = readNonEmptyString(value.displayName);
  const unlockCost = readNonNegativeFiniteNumber(value.unlockCost);
  const prestigeLevels = Array.isArray(value.prestigeLevels)
    ? value.prestigeLevels.map((entry, prestigeIndex) => validatePrestigeLevel(entry, index, prestigeIndex))
    : null;

  if (mineId === null || displayName === null || unlockCost === null || prestigeLevels === null || prestigeLevels.length === 0) {
    throw new Error(`Mine definition at index ${index} is missing required fields.`);
  }

  return {
    mineId,
    displayName,
    unlockCost,
    prestigeLevels
  };
}

function validatePrestigeLevel(value: unknown, mineIndex: number, prestigeIndex: number): MinePrestigeData {
  if (!isRecord(value)) {
    throw new Error(`Prestige level ${prestigeIndex} for mine index ${mineIndex} is invalid.`);
  }

  const prestigeLevel = readNonNegativeInteger(value.prestigeLevel);
  const cost = readNonNegativeFiniteNumber(value.cost);
  const multiplier = readPositiveFiniteNumber(value.multiplier);

  if (prestigeLevel === null || cost === null || multiplier === null) {
    throw new Error(`Prestige level ${prestigeIndex} for mine index ${mineIndex} is missing required fields.`);
  }

  return {
    prestigeLevel,
    cost,
    multiplier
  };
}

function loadTextFile(url: URL): string {
  if (url.protocol === "file:") {
    const nodeProcess = (globalThis as {
      process?: {
        getBuiltinModule?: (specifier: string) => {
          readFileSync(path: URL, encoding: BufferEncoding): string;
        };
      };
    }).process;
    const fs = nodeProcess?.getBuiltinModule?.("node:fs");

    if (fs?.readFileSync === undefined) {
      throw new Error(`Unable to load ${url.href} from the local filesystem.`);
    }

    return fs.readFileSync(url, "utf8");
  }

  if (url.protocol === "data:") {
    return decodeDataUrl(url.href);
  }

  if (typeof XMLHttpRequest !== "undefined") {
    const request = new XMLHttpRequest();
    request.open("GET", url.href, false);
    request.send();

    if (request.status >= 400) {
      throw new Error(`Unable to load ${url.href}: ${request.status}`);
    }

    return request.responseText;
  }

  throw new Error(`Unable to load ${url.href} in this environment.`);
}

function decodeDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:.*?(;base64)?,(.*)$/);

  if (match === null) {
    throw new Error("Invalid data URL for prestige-balance.json.");
  }

  const isBase64 = match[1] === ";base64";
  const payload = match[2] ?? "";

  if (!isBase64) {
    return decodeURIComponent(payload);
  }

  if (typeof atob === "function") {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  const nodeProcess = (globalThis as {
    process?: {
      getBuiltinModule?: (specifier: string) => {
        Buffer: {
          from(value: string, encoding: BufferEncoding | "base64"): { toString(encoding: BufferEncoding): string };
        };
      };
    };
  }).process;
  const bufferModule = nodeProcess?.getBuiltinModule?.("node:buffer");

  if (bufferModule?.Buffer === undefined) {
    throw new Error("Unable to decode base64 prestige-balance.json data.");
  }

  return bufferModule.Buffer.from(payload, "base64").toString("utf8");
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNonNegativeFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function readPositiveFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
