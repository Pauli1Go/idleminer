import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldAutoCompleteTutorialForLegacySave,
  shouldReplayTutorialForEarlyGameState
} from "../src/game/tutorialProgress.ts";
import type { GameState, ManagerState } from "../src/core/index.ts";

function createManager(overrides: Partial<ManagerState> = {}): ManagerState {
  return {
    id: "mineShaft-1-junior-miningSpeedBoost",
    displayName: "Mine Manager 1",
    area: "mineShaft",
    rank: "junior",
    abilityType: "miningSpeedBoost",
    abilityMultiplier: 2,
    costReductionMultiplier: 1,
    activeDurationSeconds: 60,
    cooldownSeconds: 300,
    hireCost: 100,
    isOwned: true,
    isAssigned: false,
    assignedShaftId: null,
    isActive: false,
    remainingActiveTime: 0,
    remainingCooldownTime: 0,
    ...overrides
  };
}

function createState(overrides: {
  firstShaftLevel?: number;
  secondShaftUnlocked?: boolean;
  ownedManagers?: ManagerState[];
  superCash?: number;
  hasEarnedSuperCash?: boolean;
} = {}): GameState {
  const ownedManagers = overrides.ownedManagers ?? [];

  return {
    activeMineId: "coal",
    superCash: overrides.superCash ?? 0,
    hasEarnedSuperCash: overrides.hasEarnedSuperCash ?? false,
    boosts: {
      activeBoost: null,
      queuedBoosts: []
    },
    mines: {
      coal: {
        mineId: "coal",
        isUnlocked: true
      }
    },
    managers: {
      unlockLevel: 5,
      ownedManagers,
      assignedManagerIdsByArea: {
        mineShaft: null,
        elevator: null,
        warehouse: null
      },
      assignedManagerIdsByShaft: {
        1: ownedManagers.find((manager) => manager.isAssigned)?.id ?? null
      }
    },
    entities: {
      mineShafts: {
        1: {
          shaftId: 1,
          level: overrides.firstShaftLevel ?? 1,
          isUnlocked: true
        },
        2: {
          shaftId: 2,
          level: 1,
          isUnlocked: overrides.secondShaftUnlocked ?? false
        }
      }
    }
  } as GameState;
}

test("does not auto-complete tutorial for a fresh early-game save", () => {
  assert.equal(shouldAutoCompleteTutorialForLegacySave(createState()), false);
});

test("does not auto-complete tutorial from shaft level alone", () => {
  assert.equal(shouldAutoCompleteTutorialForLegacySave(createState({ firstShaftLevel: 5 })), false);
});

test("auto-completes missing tutorial progress for legacy saves with manager progress", () => {
  assert.equal(shouldAutoCompleteTutorialForLegacySave(createState({ ownedManagers: [createManager()] })), true);
});

test("replays tutorial when an early-game save was incorrectly marked complete", () => {
  assert.equal(
    shouldReplayTutorialForEarlyGameState(createState(), { completed: true, progressIndex: 11 }, 11),
    true
  );
});

test("keeps completed tutorial state for progressed legacy saves", () => {
  assert.equal(
    shouldReplayTutorialForEarlyGameState(
      createState({ ownedManagers: [createManager({ isAssigned: true, assignedShaftId: 1 })] }),
      { completed: true, progressIndex: 11 },
      11
    ),
    false
  );
});
