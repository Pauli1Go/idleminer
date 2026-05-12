import {
  parseSaveGame,
  SAVEGAME_STORAGE_KEY,
  type SaveGameRecord,
  type SaveGameRepository
} from "./core/index.ts";

type WrapperWindow = Window & {
  APP_CSRF?: unknown;
};

interface ServerLoadResponse {
  ok?: boolean;
  has_save?: boolean;
  save_data?: unknown;
}

function getWrapperParent(): WrapperWindow | null {
  if (typeof window === "undefined" || window.parent === window) {
    return null;
  }

  try {
    return window.parent as WrapperWindow;
  } catch {
    return null;
  }
}

function getWrapperCsrf(): string | null {
  try {
    const parent = getWrapperParent();
    const token = parent?.APP_CSRF;
    return typeof token === "string" && token !== "" ? token : null;
  } catch {
    return null;
  }
}

function getWrapperApiUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const parent = getWrapperParent();
    const baseUrl = parent === null ? window.location.href : parent.location.href;
    return new URL("api.php", baseUrl).toString();
  } catch {
    return null;
  }
}

async function postWrapperApi(fields: Record<string, string>): Promise<unknown> {
  const apiUrl = getWrapperApiUrl();
  const csrf = getWrapperCsrf();
  if (apiUrl === null || csrf === null) {
    return null;
  }

  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  form.append("csrf", csrf);

  const response = await fetch(apiUrl, {
    method: "POST",
    body: form,
    credentials: "same-origin"
  });

  return response.json();
}

function hasSoldProgress(save: SaveGameRecord | null): boolean {
  return (
    save?.state.mines.some((mine) => Number.isFinite(mine.totals.soldOre) && mine.totals.soldOre > Number.EPSILON) ??
    false
  );
}

export async function importServerSaveForEmptyLocalGame(repository: SaveGameRepository | undefined): Promise<void> {
  if (repository === undefined || hasSoldProgress(repository.load())) {
    return;
  }

  try {
    const response = await postWrapperApi({ action: "server_load" }) as ServerLoadResponse | null;
    if (!response?.ok || !response.has_save || typeof response.save_data !== "string") {
      return;
    }

    const parsedSave = parseSaveGame(response.save_data);
    if (parsedSave !== null) {
      repository.save(parsedSave);
    }
  } catch {
    // Wrapper sync is optional; the standalone game must still start.
  }
}

export function saveBoostPurchaseToServer(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const saveData = window.localStorage.getItem(SAVEGAME_STORAGE_KEY);
    if (saveData === null || saveData === "") {
      return;
    }

    void postWrapperApi({
      action: "server_save",
      save_data: saveData,
      automatic: "1"
    }).catch(() => undefined);
  } catch {
    // The local save already happened; server sync is best-effort.
  }
}
