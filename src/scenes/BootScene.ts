import Phaser from "phaser";

import loadingSplashUrl from "../../assets/ui/loading_splash_mine.png";

export const LOADING_SPLASH_KEY = "loading-splash-mine";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    this.load.image(LOADING_SPLASH_KEY, loadingSplashUrl);
  }

  create(): void {
    this.scene.start("LoadingScene");
  }
}
