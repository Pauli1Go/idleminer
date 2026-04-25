import Phaser from "phaser";

import balance from "../balance.json";
import { createLocalStorageSaveGameRepository, type BalanceConfig, type SaveGameRepository } from "./core/index.ts";
import { MineScene } from "./scenes/MineScene.ts";
import "./style.css";

function createSaveRepository(): SaveGameRepository | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return createLocalStorageSaveGameRepository(window.localStorage);
  } catch {
    return undefined;
  }
}

const saveRepository = createSaveRepository();

const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#17202b",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },
  scene: [new MineScene(balance as BalanceConfig, saveRepository)]
};

const game = new Phaser.Game(gameConfig);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
