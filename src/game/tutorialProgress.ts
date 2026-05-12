import type { GameState } from "../core/index.ts";

export interface TutorialCompletionProgress {
  completed: boolean;
  progressIndex: number;
}

export function shouldAutoCompleteTutorialForLegacySave(state: GameState): boolean {
  const hasOwnedManager = state.managers.ownedManagers.some((manager) => manager.isOwned);
  const hasAssignedManagerReference =
    Object.values(state.managers.assignedManagerIdsByArea).some((managerId) => managerId !== null) ||
    Object.values(state.managers.assignedManagerIdsByShaft).some((managerId) => managerId !== null);
  const hasUnlockedAdditionalShaft = Object.values(state.entities.mineShafts).some(
    (shaft) => shaft.shaftId > 1 && shaft.isUnlocked
  );
  const hasUnlockedAdditionalMine = Object.values(state.mines).some(
    (mine) => mine.mineId !== state.activeMineId && mine.isUnlocked
  );
  const hasBoostProgress = state.boosts.activeBoost !== null || state.boosts.queuedBoosts.length > 0;

  return (
    hasOwnedManager ||
    hasAssignedManagerReference ||
    hasUnlockedAdditionalShaft ||
    hasUnlockedAdditionalMine ||
    hasBoostProgress ||
    state.superCash > 0 ||
    state.hasEarnedSuperCash
  );
}

export function shouldReplayTutorialForEarlyGameState(
  state: GameState,
  progress: TutorialCompletionProgress,
  totalStepCount: number
): boolean {
  return (
    progress.completed &&
    progress.progressIndex >= totalStepCount &&
    !shouldAutoCompleteTutorialForLegacySave(state)
  );
}
