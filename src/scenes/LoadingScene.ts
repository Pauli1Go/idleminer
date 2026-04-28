import Phaser from "phaser";

import { LOADING_SPLASH_KEY } from "./BootScene.ts";
import { assetManifest } from "./MineScene.ts";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const UI_FONT_FAMILY = '"Trebuchet MS", Verdana, sans-serif';

export class LoadingScene extends Phaser.Scene {
  private progressFill!: Phaser.GameObjects.Graphics;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super("LoadingScene");
  }

  preload(): void {
    this.createLoadingScreen();

    this.load.on("progress", this.updateProgress, this);
    this.load.once("complete", this.handleComplete, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    Object.entries(assetManifest).forEach(([key, url]) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    });
  }

  private createLoadingScreen(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, LOADING_SPLASH_KEY).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    this.add.rectangle(GAME_WIDTH / 2, 608, GAME_WIDTH, 224, 0x05070a, 0.42);

    this.add
      .text(GAME_WIDTH / 2, 554, "Loading Mine", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "30px",
        fontStyle: "bold",
        color: "#f8df96",
        stroke: "#111820",
        strokeThickness: 4
      })
      .setOrigin(0.5);

    const barX = 360;
    const barY = 598;
    const barWidth = 560;
    const barHeight = 34;

    const progressFrame = this.add.graphics();
    progressFrame.fillStyle(0x111820, 0.9);
    progressFrame.fillRoundedRect(barX, barY, barWidth, barHeight, 12);
    progressFrame.lineStyle(3, 0xf0c95c, 1);
    progressFrame.strokeRoundedRect(barX, barY, barWidth, barHeight, 12);

    this.progressFill = this.add.graphics();
    this.progressText = this.add
      .text(GAME_WIDTH / 2, barY + barHeight / 2, "0%", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "18px",
        fontStyle: "bold",
        color: "#fff6d8",
        stroke: "#131313",
        strokeThickness: 3
      })
      .setOrigin(0.5);

    this.updateProgress(0);
  }

  private updateProgress(value: number): void {
    const progress = Phaser.Math.Clamp(value, 0, 1);
    const barX = 366;
    const barY = 604;
    const barWidth = 548;
    const barHeight = 22;
    const fillWidth = Math.max(0, barWidth * progress);

    this.progressFill.clear();
    this.progressFill.fillStyle(0x33200f, 1);
    this.progressFill.fillRoundedRect(barX, barY, barWidth, barHeight, 8);

    if (fillWidth > 0) {
      this.progressFill.fillGradientStyle(0xffdf64, 0xffdf64, 0xd7791e, 0xd7791e, 1);
      this.progressFill.fillRoundedRect(barX, barY, fillWidth, barHeight, 8);
    }

    this.progressText.setText(`${Math.round(progress * 100)}%`);
  }

  private handleComplete(): void {
    this.updateProgress(1);
    this.time.delayedCall(250, () => {
      this.scene.start("MineScene");
    });
  }

  private handleShutdown(): void {
    this.load.off("progress", this.updateProgress, this);
  }
}
