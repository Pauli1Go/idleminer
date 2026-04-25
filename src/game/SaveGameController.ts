import type { SaveGameRecord, SaveGameRepository } from "../core/savegame.ts";

const DEFAULT_AUTO_SAVE_INTERVAL_SECONDS = 10;

export class SaveGameController {
  private readonly autoSaveIntervalSeconds: number;
  private readonly repository: SaveGameRepository | undefined;
  private readonly snapshotProvider: () => SaveGameRecord;
  private readonly onLifecycleEvent = (): void => {
    this.flush();
  };
  private accumulatorSeconds = 0;
  private disposed = false;

  constructor(repository: SaveGameRepository | undefined, snapshotProvider: () => SaveGameRecord, autoSaveIntervalSeconds = DEFAULT_AUTO_SAVE_INTERVAL_SECONDS) {
    if (!Number.isFinite(autoSaveIntervalSeconds) || autoSaveIntervalSeconds <= 0) {
      throw new Error("autoSaveIntervalSeconds must be greater than 0.");
    }

    this.repository = repository;
    this.snapshotProvider = snapshotProvider;
    this.autoSaveIntervalSeconds = autoSaveIntervalSeconds;

    if (this.repository !== undefined && typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.onLifecycleEvent);
      window.addEventListener("pagehide", this.onLifecycleEvent);
    }
  }

  update(deltaSeconds: number): void {
    if (this.disposed || this.repository === undefined) {
      return;
    }

    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
      return;
    }

    this.accumulatorSeconds += deltaSeconds;

    if (this.accumulatorSeconds < this.autoSaveIntervalSeconds) {
      return;
    }

    this.accumulatorSeconds %= this.autoSaveIntervalSeconds;
    this.flush();
  }

  flush(): void {
    if (this.disposed || this.repository === undefined) {
      return;
    }

    try {
      this.repository.save(this.snapshotProvider());
    } catch {
      // Best-effort save: keep the game alive even when a snapshot cannot be persisted.
    }
  }

  stop(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;

    if (this.repository !== undefined && typeof window !== "undefined") {
      window.removeEventListener("beforeunload", this.onLifecycleEvent);
      window.removeEventListener("pagehide", this.onLifecycleEvent);
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.flush();
    this.stop();
  }
}
