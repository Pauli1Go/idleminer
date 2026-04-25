import Phaser from "phaser";

import backgroundSurfaceUrl from "../../assets/backgrounds/background_surface_clean.png";
import backgroundUndergroundUrl from "../../assets/backgrounds/background_underground_clean.png";
import minerCarryUrl from "../../assets/characters/miner_worker_carry_bag_level1.png";
import minerDropUrl from "../../assets/characters/miner_worker_drop_bag_level1.png";
import minerIdleUrl from "../../assets/characters/miner_worker_idle_level1.png";
import minerPickaxe01Url from "../../assets/characters/miner_worker_pickaxe_01_level1.png";
import minerPickaxe02Url from "../../assets/characters/miner_worker_pickaxe_02_level1.png";
import warehouseWorkerCarryUrl from "../../assets/characters/warehouse_worker_carry_coal_level1.png";
import warehouseWorkerIdleUrl from "../../assets/characters/warehouse_worker_idle_level1.png";
import warehouseWorkerSellUrl from "../../assets/characters/warehouse_worker_sell_level1.png";
import buttonPanelUrl from "../../assets/ui/button_panel.png";
import coinIconUrl from "../../assets/ui/coin_icon.png";
import oreIconUrl from "../../assets/ui/ore_icon.png";
import upgradeArrowIconUrl from "../../assets/ui/upgrade_arrow_icon.png";
import abilityCapacityBoostUrl from "../../assets/ui/abilities/ability_capacity_boost.png";
import abilityCostReductionUrl from "../../assets/ui/abilities/ability_cost_reduction.png";
import abilityLoadingSpeedUrl from "../../assets/ui/abilities/ability_loading_speed.png";
import abilityMiningSpeedUrl from "../../assets/ui/abilities/ability_mining_speed.png";
import abilityMovementSpeedUrl from "../../assets/ui/abilities/ability_movement_speed.png";
import abilityWalkingSpeedUrl from "../../assets/ui/abilities/ability_walking_speed.png";
import managerAssignSlotEmptyUrl from "../../assets/ui/managers/manager_assign_slot_empty.png";
import managerAssignSlotLeftEmptyUrl from "../../assets/ui/managers/manager_assign_slot_left_empty.png";
import managerElevatorCommonUrl from "../../assets/managers/manager_elevator_common.png";
import managerElevatorEpicUrl from "../../assets/managers/manager_elevator_epic.png";
import managerElevatorRareUrl from "../../assets/managers/manager_elevator_rare.png";
import managerMineCommonUrl from "../../assets/managers/manager_mine_common.png";
import managerMineEpicUrl from "../../assets/managers/manager_mine_epic.png";
import managerMineRareUrl from "../../assets/managers/manager_mine_rare.png";
import managerWarehouseCommonUrl from "../../assets/managers/manager_warehouse_common.png";
import managerWarehouseEpicUrl from "../../assets/managers/manager_warehouse_epic.png";
import managerWarehouseRareUrl from "../../assets/managers/manager_warehouse_rare.png";
import coalDepositUrl from "../../assets/world/coal_deposit_small_level1.png";
import elevatorCabinEmptyUrl from "../../assets/world/elevator_cabin_empty_level1.png";
import elevatorCabinLoadedUrl from "../../assets/world/elevator_cabin_loaded_coal_level1.png";
import elevatorShaftUrl from "../../assets/world/elevator_shaft_vertical_level1.png";
import elevatorTowerUrl from "../../assets/world/elevator_tower_surface_level1.png";
import mineShaftBackWallUrl from "../../assets/world/mine_shaft_back_wall_level1.png";
import mineShaftFloorUrl from "../../assets/world/mine_shaft_floor_level1.png";
import mineShaftPickupEmptyUrl from "../../assets/world/mine_shaft_pickup_box_empty_level1.png";
import mineShaftPickupFullUrl from "../../assets/world/mine_shaft_pickup_box_full_level1.png";
import mineShaftPickupSmallUrl from "../../assets/world/mine_shaft_pickup_box_small_level1.png";
import mineShaftSupportsUrl from "../../assets/world/mine_shaft_supports_level1.png";
import warehouseBuildingUrl from "../../assets/world/warehouse_building_level1.png";
import warehousePileEmptyUrl from "../../assets/world/warehouse_storage_pile_empty.png";
import warehousePileFullUrl from "../../assets/world/warehouse_storage_pile_coal_full.png";
import warehousePileSmallUrl from "../../assets/world/warehouse_storage_pile_coal_small.png";
import {
  getElevatorSpeedMultiplier,
  getManagerHireCost,
  getValidAbilityTypesForArea,
  managerRanks,
  type BalanceConfig,
  type GameState,
  type ManagerAbilityType,
  type ManagerArea,
  type ManagerRank,
  type ManagerState,
  type SaveGameRepository,
  type SimulationEvent,
  type UpgradeBuyMode,
  type UpgradeTarget
} from "../core/index.ts";
import { formatLargeNumber, formatCurrency } from "../core/formatters.ts";
import { SimulationViewModel, type SimulationFrame } from "../game/SimulationViewModel.ts";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const SURFACE_HEIGHT = 206;

const UI_FONT_FAMILY = '"Trebuchet MS", Verdana, sans-serif';
const UI_PANEL_DEPTH = 20;
const UI_TEXT_DEPTH = 21;
const UI_INTERACTIVE_DEPTH = 22;

const SURFACE_WORLD_OFFSET_X = 84;
const WAREHOUSE_BUILDING_X = 234;
const WAREHOUSE_BUILDING_Y = 136;
const WAREHOUSE_DROPOFF_X = 344;
const WAREHOUSE_DROPOFF_Y = 184;
const WAREHOUSE_PILE_X = 344;
const WAREHOUSE_PILE_Y = 188;
const WAREHOUSE_WORKER_HOME_X = 260;
const WAREHOUSE_WORKER_DROPOFF_X = WAREHOUSE_DROPOFF_X;
const WAREHOUSE_WORKER_Y = 186;

const ELEVATOR_X = 458;
const ELEVATOR_TOP_Y = 270;
const ELEVATOR_BOTTOM_Y = 592;

const MINE_SHAFT_CENTER_X = 742;
const MINE_SHAFT_BACK_WALL_Y = 508;
const MINE_SHAFT_BACK_WALL_WIDTH = 452;
const MINE_SHAFT_BACK_WALL_HEIGHT = 226;
const MINE_SHAFT_FLOOR_Y = 594;
const MINE_SHAFT_FLOOR_WIDTH = 456;
const MINE_SHAFT_FLOOR_HEIGHT = 152;
const MINE_SHAFT_SUPPORTS_Y = 518;
const MINE_SHAFT_SUPPORTS_WIDTH = 452;
const MINE_SHAFT_SUPPORTS_HEIGHT = 226;
const MINE_PICKUP_BOX_X = 590;
const MINE_PICKUP_BOX_Y = 596;
const MINE_PICKUP_BOX_WIDTH = 104;
const MINE_PICKUP_BOX_HEIGHT = 80;
const MINE_WORKER_MINE_X = 852;
const MINE_WORKER_PICKUP_X = 632;
const MINE_WORKER_Y = 612;
const MINE_WORKER_SIZE = 98;
const COAL_DEPOSIT_X = 918;
const COAL_DEPOSIT_Y = 578;
const COAL_DEPOSIT_WIDTH = 164;
const COAL_DEPOSIT_HEIGHT = 112;

const MONEY_PANEL_X = 18;
const MONEY_PANEL_Y = 14;
const MONEY_PANEL_WIDTH = 172;
const MONEY_PANEL_HEIGHT = 40;
const FLOW_PANEL_X = 198;
const FLOW_PANEL_Y = 14;
const FLOW_PANEL_WIDTH = 394;
const FLOW_PANEL_HEIGHT = 40;

const UPGRADE_COLUMN_X = 972;
const UPGRADE_COLUMN_WIDTH = 290;
const BUY_MODE_BAR_Y = 16;
const BUY_MODE_BAR_HEIGHT = 42;
const BUY_MODE_BUTTON_WIDTH = 52;
const BUY_MODE_BUTTON_HEIGHT = 22;
const BUY_MODE_BUTTON_GAP = 3;
const BUY_MODE_BUTTON_START_X = UPGRADE_COLUMN_X + 70;
const BUY_MODE_BUTTON_Y = BUY_MODE_BAR_Y + 25;
const BUY_MODE_BUTTON_LABEL_Y = BUY_MODE_BAR_Y + 10;
const BUY_MODE_BUTTON_LABEL_COLOR = "#fff8de";
const UPGRADE_CARD_WIDTH = UPGRADE_COLUMN_WIDTH;
const UPGRADE_CARD_HEIGHT = 146;
const WAREHOUSE_CARD_Y = 72;
const ELEVATOR_CARD_Y = 230;
const MINE_SHAFT_CARD_Y = 426;
const UPGRADE_BUTTON_WIDTH = 132;
const UPGRADE_BUTTON_HEIGHT = 34;

const MANAGER_SLOT_WIDTH = 220;
const MANAGER_SLOT_HEIGHT = 118;
const MANAGER_SLOT_IMAGE_SIZE = 58;
const MANAGER_SLOT_PORTRAIT_SIZE = 62;
const MANAGER_SLOT_DEPTH = 26;
const MANAGER_SLOT_TEXT_DEPTH = 27;
const MANAGER_SLOT_INTERACTIVE_DEPTH = 28;
const MANAGER_PANEL_X = 284;
const MANAGER_PANEL_Y = 38;
const MANAGER_PANEL_WIDTH = 676;
const MANAGER_PANEL_HEIGHT = 642;
const MANAGER_PANEL_DEPTH = 44;
const MANAGER_PANEL_TEXT_DEPTH = 45;
const MANAGER_PANEL_INTERACTIVE_DEPTH = 46;
const MANAGER_ENTRY_WIDTH = 300;
const MANAGER_ENTRY_HEIGHT = 42;
const MANAGER_ENTRY_GAP_X = 18;
const MANAGER_ENTRY_GAP_Y = 8;

const managerSlotLayout = {
  warehouse: { x: 18, y: 226, label: "Warehouse" },
  elevator: { x: 526, y: 72, label: "Elevator" },
  mineShaft: { x: 174, y: 456, label: "Mine" }
} satisfies Record<ManagerArea, { x: number; y: number; label: string }>;

const assetManifest = {
  "background-surface": backgroundSurfaceUrl,
  "background-underground": backgroundUndergroundUrl,
  "elevator-tower": elevatorTowerUrl,
  "elevator-shaft": elevatorShaftUrl,
  "elevator-cabin-empty": elevatorCabinEmptyUrl,
  "elevator-cabin-loaded": elevatorCabinLoadedUrl,
  "warehouse-building": warehouseBuildingUrl,
  "warehouse-pile-empty": warehousePileEmptyUrl,
  "warehouse-pile-small": warehousePileSmallUrl,
  "warehouse-pile-full": warehousePileFullUrl,
  "mine-shaft-floor": mineShaftFloorUrl,
  "mine-shaft-back-wall": mineShaftBackWallUrl,
  "mine-shaft-supports": mineShaftSupportsUrl,
  "mine-pickup-empty": mineShaftPickupEmptyUrl,
  "mine-pickup-small": mineShaftPickupSmallUrl,
  "mine-pickup-full": mineShaftPickupFullUrl,
  "coal-deposit": coalDepositUrl,
  "miner-idle": minerIdleUrl,
  "miner-pickaxe-01": minerPickaxe01Url,
  "miner-pickaxe-02": minerPickaxe02Url,
  "miner-carry": minerCarryUrl,
  "miner-drop": minerDropUrl,
  "warehouse-worker-idle": warehouseWorkerIdleUrl,
  "warehouse-worker-carry": warehouseWorkerCarryUrl,
  "warehouse-worker-sell": warehouseWorkerSellUrl,
  "button-panel": buttonPanelUrl,
  "coin-icon": coinIconUrl,
  "ore-icon": oreIconUrl,
  "upgrade-arrow-icon": upgradeArrowIconUrl,
  "manager-slot-empty": managerAssignSlotEmptyUrl,
  "manager-slot-left-empty": managerAssignSlotLeftEmptyUrl,
  "manager-mine-common": managerMineCommonUrl,
  "manager-mine-rare": managerMineRareUrl,
  "manager-mine-epic": managerMineEpicUrl,
  "manager-elevator-common": managerElevatorCommonUrl,
  "manager-elevator-rare": managerElevatorRareUrl,
  "manager-elevator-epic": managerElevatorEpicUrl,
  "manager-warehouse-common": managerWarehouseCommonUrl,
  "manager-warehouse-rare": managerWarehouseRareUrl,
  "manager-warehouse-epic": managerWarehouseEpicUrl,
  "ability-mining-speed": abilityMiningSpeedUrl,
  "ability-walking-speed": abilityWalkingSpeedUrl,
  "ability-loading-speed": abilityLoadingSpeedUrl,
  "ability-movement-speed": abilityMovementSpeedUrl,
  "ability-capacity-boost": abilityCapacityBoostUrl,
  "ability-cost-reduction": abilityCostReductionUrl
} satisfies Record<string, string>;

interface UpgradeCardUi {
  frame: Phaser.GameObjects.Graphics;
  levelBadge: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  mainLabelText: Phaser.GameObjects.Text;
  mainCurrentText: Phaser.GameObjects.Text;
  mainNextText: Phaser.GameObjects.Text;
  secondaryLabelText: Phaser.GameObjects.Text;
  secondaryCurrentText: Phaser.GameObjects.Text;
  secondaryNextText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  buyCountText: Phaser.GameObjects.Text;
  buttonImage: Phaser.GameObjects.Image;
  buttonText: Phaser.GameObjects.Text;
  buttonZone: Phaser.GameObjects.Zone;
  enabled: boolean;
}

interface BuyModeButtonUi {
  mode: UpgradeBuyMode;
  background: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
}

interface UpgradeCardDisplay {
  mainLabel: string;
  mainCurrent: string;
  mainNext: string;
  secondaryLabel: string;
  secondaryCurrent: string;
  secondaryNext: string;
}

interface ManagerSlotUi {
  area: ManagerArea;
  x: number;
  y: number;
  frame: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  emptySlotImage: Phaser.GameObjects.Image;
  portraitImage: Phaser.GameObjects.Image;
  rankText: Phaser.GameObjects.Text;
  abilityImage: Phaser.GameObjects.Image;
  abilityZone: Phaser.GameObjects.Zone;
  statusText: Phaser.GameObjects.Text;
  timerText: Phaser.GameObjects.Text;
  slotZone: Phaser.GameObjects.Zone;
}

interface ManagerHireOffer {
  area: ManagerArea;


  hireCost: number;
  canAfford: boolean;
}

export class MineScene extends Phaser.Scene {
  private readonly balance: BalanceConfig;
  private readonly viewModel: SimulationViewModel;

  private miner!: Phaser.GameObjects.Image;
  private minePickupBox!: Phaser.GameObjects.Image;
  private elevatorCabin!: Phaser.GameObjects.Image;
  private warehouseWorker!: Phaser.GameObjects.Image;
  private warehousePile!: Phaser.GameObjects.Image;
  private warehouseFeedback!: Phaser.GameObjects.Text;
  private commandFeedback!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private productionText!: Phaser.GameObjects.Text;
  private buyModeButtons: BuyModeButtonUi[] = [];
  private upgradeCards!: Record<UpgradeTarget, UpgradeCardUi>;
  private managerSlots!: Record<ManagerArea, ManagerSlotUi>;
  private saveRepository?: SaveGameRepository;
  private activeManagerPanelArea: ManagerArea | null = null;
  private managerPanel: Phaser.GameObjects.Container | undefined;
  private managerPanelScrollY = 0;
  private latestState: GameState | undefined;
  private lastManagerSlotRefreshSecond = -1;
  private lastManagerPanelRefreshSecond = -1;
  private uiInitialized = false;
  private activeBuyMode: UpgradeBuyMode = 1;

  constructor(balance: BalanceConfig, saveRepository?: SaveGameRepository) {
    super("MineScene");
    this.balance = balance;
    this.saveRepository = saveRepository;
    this.viewModel = new SimulationViewModel(balance, { saveRepository });
  }

  preload(): void {
    Object.entries(assetManifest).forEach(([key, url]) => {
      this.load.image(key, url);
    });
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);

    this.createWorld();
    this.createSurfaceObjects();
    this.createElevator();
    this.createMineShaft();
    this.createClickTargets();
    this.createUi();
    this.applyFrame(this.viewModel.getInitialFrame(), 0);

    if (this.viewModel.offlineProgressResult !== null) {
      this.showOfflineProgressModal(this.viewModel.offlineProgressResult);
    }
  }

  update(time: number, delta: number): void {
    this.applyFrame(this.viewModel.update(delta / 1000), time);
  }

  private showOfflineProgressModal(result: import("../core/index.ts").OfflineProgressResult): void {
    const overlay = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setDepth(900)
      .setInteractive(); // block clicks

    const panelWidth = 500;
    const panelHeight = 300;
    const panelX = GAME_WIDTH / 2 - panelWidth / 2;
    const panelY = GAME_HEIGHT / 2 - panelHeight / 2;

    const panel = this.add.graphics().setDepth(901);
    panel.fillStyle(0x17212a, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
    panel.lineStyle(2, 0xf1c96b, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

    const titleText = this.add.text(GAME_WIDTH / 2, panelY + 40, "Offline Progress", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f6e8bb",
    }).setOrigin(0.5).setDepth(902);

    const formatTime = (seconds: number) => {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor(seconds % (3600 * 24) / 3600);
      const m = Math.floor(seconds % 3600 / 60);
      return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
    };

    const timeText = this.add.text(GAME_WIDTH / 2, panelY + 100, `Offline time: ${formatTime(result.offlineSeconds)}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      color: "#dcecf1",
    }).setOrigin(0.5).setDepth(902);

    const coinIcon = this.add.image(GAME_WIDTH / 2 - 80, panelY + 150, "coin-icon").setDisplaySize(24, 24).setDepth(902);
    const moneyText = this.add.text(GAME_WIDTH / 2 - 50, panelY + 150, `+${formatCurrency(result.moneyEarned)}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#4ee669",
    }).setOrigin(0, 0.5).setDepth(902);

    const oreIcon = this.add.image(GAME_WIDTH / 2 - 80, panelY + 190, "ore-icon").setDisplaySize(24, 24).setDepth(902);
    const oreText = this.add.text(GAME_WIDTH / 2 - 50, panelY + 190, `${formatLargeNumber(result.oreSold)} ore sold`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      color: "#e6c94e",
    }).setOrigin(0, 0.5).setDepth(902);

    const buttonWidth = 160;
    const buttonHeight = 40;
    const buttonX = GAME_WIDTH / 2;
    const buttonY = panelY + panelHeight - 40;

    const buttonBg = this.add.graphics().setDepth(901);
    buttonBg.fillStyle(0x386641, 1);
    buttonBg.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 8);

    const buttonText = this.add.text(buttonX, buttonY, "Continue", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(902);

    const buttonZone = this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
      .setInteractive({ useHandCursor: true })
      .setDepth(903);

    const objects = [overlay, panel, titleText, timeText, coinIcon, moneyText, oreIcon, oreText, buttonBg, buttonText, buttonZone];

    buttonZone.once("pointerdown", () => {
      objects.forEach(obj => obj.destroy());
    });
  }

  private handleShutdown(): void {
    this.viewModel.dispose();
  }

  private createWorld(): void {
    this.add.image(GAME_WIDTH / 2, SURFACE_HEIGHT / 2, "background-surface").setDisplaySize(GAME_WIDTH, SURFACE_HEIGHT);
    this.add
      .image(GAME_WIDTH / 2, SURFACE_HEIGHT + (GAME_HEIGHT - SURFACE_HEIGHT) / 2, "background-underground")
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT - SURFACE_HEIGHT);

    this.add.rectangle(GAME_WIDTH / 2, SURFACE_HEIGHT, GAME_WIDTH, 8, 0x3d2b1d, 0.96);
    this.add.rectangle(GAME_WIDTH / 2, SURFACE_HEIGHT + 5, GAME_WIDTH, 3, 0xe7bb63, 0.38);
  }

  private createSurfaceObjects(): void {
    this.add.image(WAREHOUSE_BUILDING_X, WAREHOUSE_BUILDING_Y, "warehouse-building").setDisplaySize(176, 144);
    this.warehousePile = this.add.image(WAREHOUSE_PILE_X, WAREHOUSE_PILE_Y, "warehouse-pile-empty").setDisplaySize(108, 68);
    this.warehouseWorker = this.add
      .image(WAREHOUSE_WORKER_HOME_X, WAREHOUSE_WORKER_Y, "warehouse-worker-idle")
      .setOrigin(0.5, 1)
      .setDisplaySize(62, 62);

    this.warehouseFeedback = this.add
      .text(310, 78, "", feedbackTextStyle(22, "#f8dc75"))
      .setOrigin(0.5)
      .setVisible(false);
  }

  private createElevator(): void {
    this.add.image(ELEVATOR_X, 498, "elevator-shaft").setDisplaySize(124, 632);
    this.add.image(ELEVATOR_X, 132, "elevator-tower").setDisplaySize(228, 174);
    this.elevatorCabin = this.add.image(ELEVATOR_X, ELEVATOR_TOP_Y, "elevator-cabin-empty").setDisplaySize(102, 102);
  }

  private createMineShaft(): void {
    this.add
      .image(MINE_SHAFT_CENTER_X, MINE_SHAFT_BACK_WALL_Y, "mine-shaft-back-wall")
      .setDisplaySize(MINE_SHAFT_BACK_WALL_WIDTH, MINE_SHAFT_BACK_WALL_HEIGHT);
    this.add
      .image(MINE_SHAFT_CENTER_X, MINE_SHAFT_FLOOR_Y, "mine-shaft-floor")
      .setDisplaySize(MINE_SHAFT_FLOOR_WIDTH, MINE_SHAFT_FLOOR_HEIGHT);
    this.add
      .image(MINE_SHAFT_CENTER_X, MINE_SHAFT_SUPPORTS_Y, "mine-shaft-supports")
      .setDisplaySize(MINE_SHAFT_SUPPORTS_WIDTH, MINE_SHAFT_SUPPORTS_HEIGHT);
    this.minePickupBox = this.add
      .image(MINE_PICKUP_BOX_X, MINE_PICKUP_BOX_Y, "mine-pickup-empty")
      .setDisplaySize(MINE_PICKUP_BOX_WIDTH, MINE_PICKUP_BOX_HEIGHT);
    this.add.image(COAL_DEPOSIT_X, COAL_DEPOSIT_Y, "coal-deposit").setDisplaySize(COAL_DEPOSIT_WIDTH, COAL_DEPOSIT_HEIGHT);
    this.miner = this.add
      .image(MINE_WORKER_MINE_X, MINE_WORKER_Y, "miner-idle")
      .setOrigin(0.5, 1)
      .setDisplaySize(MINE_WORKER_SIZE, MINE_WORKER_SIZE);
  }

  private createUi(): void {
    this.createTopBar();
    this.createBuyModeBar();
    this.createUpgradeCards();
    this.createStatusBar();
    this.createManagerSlots();
    this.setupManagerScroll();
  }

  private setupManagerScroll(): void {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
      if (this.activeManagerPanelArea === null || !this.managerPanel) {
        return;
      }

      // Check if pointer is over the panel
      const pointer = this.input.activePointer;
      if (
        pointer.x < MANAGER_PANEL_X ||
        pointer.x > MANAGER_PANEL_X + MANAGER_PANEL_WIDTH ||
        pointer.y < MANAGER_PANEL_Y ||
        pointer.y > MANAGER_PANEL_Y + MANAGER_PANEL_HEIGHT
      ) {
        return;
      }

      const contentContainer = this.managerPanel.list.find(
        (child) => child instanceof Phaser.GameObjects.Container && child !== this.managerPanel
      ) as Phaser.GameObjects.Container;

      if (!contentContainer) return;

      const contentAreaHeight = MANAGER_PANEL_HEIGHT - 72;
      const totalContentHeight = (contentContainer as any).totalContentHeight || 0;
      const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);

      if (maxScroll <= 0) return;

      this.managerPanelScrollY = Phaser.Math.Clamp(this.managerPanelScrollY - deltaY, -maxScroll, 0);
      contentContainer.setY(this.managerPanelScrollY);

      const scrollbar = this.managerPanel.list.find(
        (child) => child instanceof Phaser.GameObjects.Graphics && (child as any).isScrollbar
      ) as Phaser.GameObjects.Graphics;

      if (scrollbar) {
        const scrollPercent = -this.managerPanelScrollY / maxScroll;
        const scrollbarHeight = (scrollbar as any).scrollbarHeight || 0;
        scrollbar.setY(MANAGER_PANEL_Y + 71 + scrollPercent * (contentAreaHeight - scrollbarHeight - 10));
      }
    });
  }

  private createTopBar(): void {
    this.createBarPanel(MONEY_PANEL_X, MONEY_PANEL_Y, MONEY_PANEL_WIDTH, MONEY_PANEL_HEIGHT);
    this.add.image(MONEY_PANEL_X + 22, MONEY_PANEL_Y + MONEY_PANEL_HEIGHT / 2, "coin-icon").setDisplaySize(42, 42).setDepth(UI_TEXT_DEPTH);
    this.moneyText = this.add
      .text(MONEY_PANEL_X + 42, MONEY_PANEL_Y + MONEY_PANEL_HEIGHT / 2, "", topBarTextStyle(20, "#4b2709"))
      .setOrigin(0, 0.5)
      .setDepth(UI_TEXT_DEPTH);

    this.createBarPanel(FLOW_PANEL_X, FLOW_PANEL_Y, FLOW_PANEL_WIDTH, FLOW_PANEL_HEIGHT);
    this.add.image(FLOW_PANEL_X + 24, FLOW_PANEL_Y + FLOW_PANEL_HEIGHT / 2, "ore-icon").setDisplaySize(40, 40).setDepth(UI_TEXT_DEPTH);
    this.productionText = this.add
      .text(FLOW_PANEL_X + 56, FLOW_PANEL_Y + FLOW_PANEL_HEIGHT / 2, "", topBarTextStyle(12, "#4b2709"))
      .setOrigin(0, 0.5)
      .setDepth(UI_TEXT_DEPTH);

    this.createResetButton();
  }

  private createResetButton(): void {
    const x = FLOW_PANEL_X + FLOW_PANEL_WIDTH + 10;
    const y = FLOW_PANEL_Y;
    const width = 80;
    const height = 40;

    const bg = this.add.graphics().setDepth(UI_PANEL_DEPTH);
    bg.fillStyle(0xcc0000, 0.9);
    bg.fillRoundedRect(x, y, width, height, 10);
    bg.lineStyle(2, 0xffffff, 0.5);
    bg.strokeRoundedRect(x, y, width, height, 10);

    const text = this.add.text(x + width / 2, y + height / 2, "RESET", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(UI_TEXT_DEPTH);

    const zone = this.add.zone(x + width / 2, y + height / 2, width, height)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_INTERACTIVE_DEPTH);

    zone.on("pointerdown", () => {
      if (confirm("Reset your save game?")) {
        this.viewModel.resetSaveGame();
        window.location.reload();
      }
    });

    zone.on("pointerover", () => bg.setAlpha(1));
    zone.on("pointerout", () => bg.setAlpha(0.9));
  }

  private createBarPanel(x: number, y: number, width: number, height: number): void {
    this.drawRoundedPanel(x, y, width, height, {
      fill: 0xf4cb7d,
      fillAlpha: 0.96,
      innerFill: 0xffdf9a,
      innerAlpha: 0.52,
      line: 0x613212,
      radius: 16
    });
  }

  private createBuyModeBar(): void {
    this.drawRoundedPanel(UPGRADE_COLUMN_X, BUY_MODE_BAR_Y, UPGRADE_COLUMN_WIDTH, BUY_MODE_BAR_HEIGHT, {
      fill: 0x213b46,
      fillAlpha: 0.9,
      innerFill: 0x5c7c87,
      innerAlpha: 0.16,
      line: 0xf1c96b,
      radius: 16
    });

    this.add
      .text(UPGRADE_COLUMN_X + 14, BUY_MODE_BUTTON_LABEL_Y, "Buy", smallUiTextStyle(12, "#f6e9ba"))
      .setDepth(UI_TEXT_DEPTH);

    const buttonConfigs: Array<{ mode: UpgradeBuyMode; label: string; width: number }> = [
      { mode: 1, label: "1x", width: BUY_MODE_BUTTON_WIDTH },
      { mode: 10, label: "10x", width: BUY_MODE_BUTTON_WIDTH },
      { mode: 100, label: "100x", width: BUY_MODE_BUTTON_WIDTH },
      { mode: "max", label: "Max", width: BUY_MODE_BUTTON_WIDTH }
    ];

    let cursorX = BUY_MODE_BUTTON_START_X;

    for (const config of buttonConfigs) {
      const centerX = cursorX + config.width / 2;
      const background = this.add
        .image(centerX, BUY_MODE_BUTTON_Y, "button-panel")
        .setDisplaySize(config.width, BUY_MODE_BUTTON_HEIGHT)
        .setDepth(UI_PANEL_DEPTH + 1);
      const label = this.add
        .text(centerX, BUY_MODE_BUTTON_LABEL_Y, config.label, smallUiTextStyle(12, BUY_MODE_BUTTON_LABEL_COLOR))
        .setOrigin(0.5)
        .setDepth(UI_TEXT_DEPTH);
      const zone = this.add
        .zone(centerX, BUY_MODE_BUTTON_Y, config.width, BUY_MODE_BUTTON_HEIGHT)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(UI_INTERACTIVE_DEPTH);

      const button: BuyModeButtonUi = { mode: config.mode, background, label, zone };

      zone.on("pointerdown", () => {
        this.applyFrame(this.viewModel.setBuyMode(config.mode), this.time.now);
      });

      zone.on("pointerover", () => {
        if (this.activeBuyMode === config.mode) {
          return;
        }

        background.setAlpha(0.96);
      });

      zone.on("pointerout", () => {
        if (this.activeBuyMode === config.mode) {
          return;
        }

        background.setAlpha(0.82);
      });

      this.buyModeButtons.push(button);
      cursorX += config.width + BUY_MODE_BUTTON_GAP;
    }
  }

  private createUpgradeCards(): void {
    this.upgradeCards = {
      warehouse: this.createUpgradeCard(UPGRADE_COLUMN_X, WAREHOUSE_CARD_Y, "Warehouse"),
      elevator: this.createUpgradeCard(UPGRADE_COLUMN_X, ELEVATOR_CARD_Y, "Elevator"),
      mineShaft: this.createUpgradeCard(UPGRADE_COLUMN_X, MINE_SHAFT_CARD_Y, "Mine Shaft")
    };
  }

  private createUpgradeCard(left: number, top: number, title: string): UpgradeCardUi {
    const frame = this.drawUpgradeCardFrame(left, top, UPGRADE_CARD_WIDTH, UPGRADE_CARD_HEIGHT);
    const titleText = this.add.text(left + 16, top + 12, title, cardTitleTextStyle()).setDepth(UI_TEXT_DEPTH);
    const levelBadge = this.drawLevelBadge(left + UPGRADE_CARD_WIDTH - 74, top + 10, 58, 24);
    const levelText = this.add
      .text(left + UPGRADE_CARD_WIDTH - 45, top + 21, "", smallUiTextStyle(12, "#f6e8bb"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);

    const mainLabelText = this.add
      .text(left + UPGRADE_CARD_WIDTH / 2, top + 42, "", smallUiTextStyle(11, "#6e5531"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const mainCurrentText = this.add
      .text(left + 88, top + 62, "", metricValueTextStyle(18, "#683d11"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    this.add
      .image(left + UPGRADE_CARD_WIDTH / 2, top + 65, "upgrade-arrow-icon")
      .setDisplaySize(18, 18)
      .setDepth(UI_TEXT_DEPTH);
    const mainNextText = this.add
      .text(left + UPGRADE_CARD_WIDTH - 88, top + 62, "", metricValueTextStyle(18, "#234f66"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);

    const secondaryLabelText = this.add
      .text(left + UPGRADE_CARD_WIDTH / 2, top + 84, "", smallUiTextStyle(11, "#6e5531"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const secondaryCurrentText = this.add
      .text(left + 88, top + 102, "", metricValueTextStyle(14, "#6b4519"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    this.add
      .image(left + UPGRADE_CARD_WIDTH / 2, top + 104, "upgrade-arrow-icon")
      .setDisplaySize(18, 18)
      .setDepth(UI_TEXT_DEPTH);
    const secondaryNextText = this.add
      .text(left + UPGRADE_CARD_WIDTH - 88, top + 102, "", metricValueTextStyle(14, "#2f5962"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);

    this.add.image(left + 18, top + 123, "coin-icon").setDisplaySize(32, 32).setDepth(UI_TEXT_DEPTH);
    const costText = this.add
      .text(left + 48, top + 116, "", smallUiTextStyle(13, "#5a3411"))
      .setDepth(UI_TEXT_DEPTH);
    const buyCountText = this.add
      .text(left + UPGRADE_CARD_WIDTH / 2 + UPGRADE_BUTTON_WIDTH / 2 + 12, top + 116, "", smallUiTextStyle(11, "#7b4e1d"))
      .setOrigin(0, 0)
      .setDepth(UI_TEXT_DEPTH);

    const buttonCenterY = top + UPGRADE_CARD_HEIGHT - 18;
    const buttonImage = this.add
      .image(left + UPGRADE_CARD_WIDTH / 2, buttonCenterY, "button-panel")
      .setDisplaySize(UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
      .setDepth(UI_PANEL_DEPTH + 1);
    const buttonText = this.add
      .text(left + UPGRADE_CARD_WIDTH / 2, buttonCenterY - 1, "Upgrade", smallUiTextStyle(13, "#fff8de"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const buttonZone = this.add
      .zone(left + UPGRADE_CARD_WIDTH / 2, buttonCenterY, UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_INTERACTIVE_DEPTH);

    return {
      frame,
      levelBadge,
      titleText,
      levelText,
      mainLabelText,
      mainCurrentText,
      mainNextText,
      secondaryLabelText,
      secondaryCurrentText,
      secondaryNextText,
      costText,
      buyCountText,
      buttonImage,
      buttonText,
      buttonZone,
      enabled: true
    };
  }

  private createStatusBar(): void {
    this.commandFeedback = this.add
      .text(640, 686, "", feedbackTextStyle(17, "#f2dfbd"))
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(UI_TEXT_DEPTH);
  }

  private createManagerSlots(): void {
    this.managerSlots = {
      mineShaft: this.createManagerSlot("mineShaft"),
      elevator: this.createManagerSlot("elevator"),
      warehouse: this.createManagerSlot("warehouse")
    };
  }

  private createManagerSlot(area: ManagerArea): ManagerSlotUi {
    const config = managerSlotLayout[area];
    const frame = this.add.graphics().setDepth(MANAGER_SLOT_DEPTH);
    const titleText = this.add
      .text(config.x + 12, config.y + 10, config.label, smallUiTextStyle(12, "#f9e9bb"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const emptySlotImage = this.add
      .image(config.x + 38, config.y + 58, getManagerEmptySlotKey(area))
      .setDisplaySize(MANAGER_SLOT_IMAGE_SIZE, MANAGER_SLOT_IMAGE_SIZE)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const portraitImage = this.add
      .image(config.x + 38, config.y + 60, getManagerPortraitKey(area, "junior"))
      .setDisplaySize(MANAGER_SLOT_PORTRAIT_SIZE, MANAGER_SLOT_PORTRAIT_SIZE)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH)
      .setVisible(false);
    const rankText = this.add
      .text(config.x + 76, config.y + 38, "", smallUiTextStyle(11, "#f7f1dd"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const abilityImage = this.add
      .image(config.x + 172, config.y + 60, "ability-mining-speed")
      .setDisplaySize(64, 64)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH)
      .setVisible(false);
    const abilityZone = this.add
      .zone(config.x + 172, config.y + 60, 64, 64)
      .setOrigin(0.5)
      .setDepth(MANAGER_SLOT_INTERACTIVE_DEPTH + 1);
    const statusText = this.add
      .text(config.x + 76, config.y + 60, "", smallUiTextStyle(11, "#f1d389"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const timerText = this.add
      .text(config.x + 76, config.y + 82, "", smallUiTextStyle(11, "#dcecf1"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const slotZone = this.add
      .zone(config.x, config.y, MANAGER_SLOT_WIDTH, MANAGER_SLOT_HEIGHT)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(MANAGER_SLOT_INTERACTIVE_DEPTH);

    const slot: ManagerSlotUi = {
      area,
      x: config.x,
      y: config.y,
      frame,
      titleText,
      emptySlotImage,
      portraitImage,
      rankText,
      abilityImage,
      abilityZone,
      statusText,
      timerText,
      slotZone
    };

    slotZone.on("pointerdown", () => {
      const state = this.latestState;

      if (state === undefined) {
        return;
      }

      this.openManagerPanel(area, state);
    });

    slotZone.on("pointerover", () => {
      frame.setAlpha(1);
    });

    slotZone.on("pointerout", () => {
      frame.setAlpha(0.94);
    });

    abilityZone.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.activateAssignedManagerAbility(area);
      }
    );

    return slot;
  }

  private createClickTargets(): void {
    this.createClickTarget(392, 74, 132, 572, "Elevator", () => {
      this.applyFrame(this.viewModel.startElevatorCycle(), this.time.now);
    });

    this.createClickTarget(138, 72, 260, 130, "Warehouse", () => {
      this.applyFrame(this.viewModel.startWarehouseCycle(), this.time.now);
    });

    this.createClickTarget(534, 390, 408, 246, "Mine Shaft", () => {
      this.applyFrame(this.viewModel.startMiningCycle(), this.time.now);
    });
  }

  private createClickTarget(x: number, y: number, width: number, height: number, label: string, handler: () => void): void {
    const zone = this.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const outline = this.add.rectangle(x, y, width, height).setOrigin(0, 0).setStrokeStyle(2, 0xf1c96b, 0.14);
    const chip = this.add
      .text(x + 10, y + 8, label, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "12px",
        fontStyle: "700",
        color: "#f7f1dd",
        backgroundColor: "rgba(24, 33, 42, 0.52)",
        padding: { x: 8, y: 4 }
      })
      .setAlpha(0.74);

    zone.on("pointerover", () => {
      outline.setStrokeStyle(2, 0xf1c96b, 0.38);
      chip.setAlpha(0.96);
    });
    zone.on("pointerout", () => {
      outline.setStrokeStyle(2, 0xf1c96b, 0.14);
      chip.setAlpha(0.74);
    });
    zone.on("pointerdown", handler);
  }

  private applyFrame(frame: SimulationFrame, time: number): void {
    const { state, visual, events, buyMode } = frame;
    this.latestState = state;

    this.applyMinerVisual(visual.miner, visual.minerPositionRatio, time);
    this.applyMinePickupBoxVisual(visual.minePickupBox);
    this.applyElevatorVisual(visual.elevatorCabin, visual.elevatorPositionRatio);
    this.applyWarehouseVisual(
      visual.warehouseWorker,
      visual.warehouseWorkerPositionRatio,
      visual.warehouseWorkerFacingLeft,
      visual.warehousePile,
      visual.warehouseFeedback.visible,
      visual.warehouseFeedback.text,
      visual.commandFeedback.visible,
      visual.commandFeedback.text
    );
    this.applyUiState(state, events, buyMode);
  }

  private applyMinerVisual(mode: "idle" | "pickaxe" | "carryBag" | "dropBag", positionRatio: number, time: number): void {
    const texture =
      mode === "pickaxe"
        ? Math.floor(time / 170) % 2 === 0
          ? "miner-pickaxe-01"
          : "miner-pickaxe-02"
        : mode === "carryBag"
          ? "miner-carry"
          : mode === "dropBag"
            ? "miner-drop"
            : "miner-idle";

    this.miner.setTexture(texture);
    this.miner.setPosition(Phaser.Math.Linear(MINE_WORKER_MINE_X, MINE_WORKER_PICKUP_X, positionRatio), MINE_WORKER_Y);
    this.miner.setFlipX(false);
    this.miner.setDisplaySize(MINE_WORKER_SIZE, MINE_WORKER_SIZE);
  }

  private applyMinePickupBoxVisual(mode: "empty" | "small" | "full"): void {
    const texture = mode === "empty" ? "mine-pickup-empty" : mode === "small" ? "mine-pickup-small" : "mine-pickup-full";
    this.minePickupBox.setTexture(texture);
  }

  private applyElevatorVisual(loadState: "empty" | "loaded", positionRatio: number): void {
    this.elevatorCabin.setY(Phaser.Math.Linear(ELEVATOR_TOP_Y, ELEVATOR_BOTTOM_Y, positionRatio));
    this.elevatorCabin.setTexture(loadState === "loaded" ? "elevator-cabin-loaded" : "elevator-cabin-empty");
  }

  private applyWarehouseVisual(
    workerState: "idle" | "carryCoal" | "sell",
    workerPositionRatio: number,
    workerFacingLeft: boolean,
    pileState: "empty" | "small" | "full",
    salesFeedbackVisible: boolean,
    salesFeedbackText: string,
    commandFeedbackVisible: boolean,
    commandFeedbackText: string
  ): void {
    const workerTexture =
      workerState === "carryCoal" ? "warehouse-worker-carry" : workerState === "sell" ? "warehouse-worker-sell" : "warehouse-worker-idle";
    const pileTexture = pileState === "empty" ? "warehouse-pile-empty" : pileState === "small" ? "warehouse-pile-small" : "warehouse-pile-full";

    this.warehouseWorker.setTexture(workerTexture);
    this.warehouseWorker.setPosition(
      Phaser.Math.Linear(WAREHOUSE_WORKER_HOME_X, WAREHOUSE_WORKER_DROPOFF_X, workerPositionRatio),
      WAREHOUSE_WORKER_Y
    );
    this.warehouseWorker.setFlipX(workerFacingLeft);
    this.warehousePile.setTexture(pileTexture);
    this.warehouseFeedback.setVisible(salesFeedbackVisible).setText(salesFeedbackText);
    this.commandFeedback.setVisible(commandFeedbackVisible).setText(commandFeedbackText);
  }

  private applyUiState(state: GameState, events: SimulationEvent[], buyMode: UpgradeBuyMode): void {
    const refreshAll = !this.uiInitialized;
    const buyModeChanged = this.activeBuyMode !== buyMode;
    const eventTypes = new Set(events.map((event) => event.type));
    const currentManagerSecond = Math.floor(state.timeSeconds);
    const upgradeStateChanged =
      refreshAll ||
      buyModeChanged ||
      eventTypes.has("moneyChanged") ||
      eventTypes.has("statsChanged") ||
      eventTypes.has("upgradePurchased");
    const managerStateChanged =
      refreshAll ||
      eventTypes.has("managerPurchased") ||
      eventTypes.has("managerAssigned") ||
      eventTypes.has("managerUnassigned") ||
      eventTypes.has("managerAbilityActivated") ||
      eventTypes.has("managerAbilityExpired") ||
      eventTypes.has("managerCooldownStarted") ||
      eventTypes.has("managerCooldownFinished") ||
      eventTypes.has("automationStateChanged") ||
      eventTypes.has("statsChanged") ||
      eventTypes.has("moneyChanged");
    const managerTimerChanged = currentManagerSecond !== this.lastManagerSlotRefreshSecond;

    if (refreshAll || eventTypes.has("moneyChanged")) {
      this.moneyText.setText(formatMoney(state.money));
    }

    if (refreshAll || eventTypes.has("statsChanged") || eventTypes.has("upgradePurchased")) {
      this.productionText.setText(formatProductionSummary(state));
      fitTextToWidth(this.productionText, FLOW_PANEL_WIDTH - 58, [12, 11, 10]);
    }

    if (upgradeStateChanged) {
      this.refreshBuyModeButtons(buyMode);
      this.refreshUpgradeCards(state);
    }

    if (managerStateChanged || managerTimerChanged) {
      this.refreshManagerSlots(state);
      this.lastManagerSlotRefreshSecond = currentManagerSecond;
    }

    if (
      this.activeManagerPanelArea !== null &&
      (managerStateChanged || currentManagerSecond !== this.lastManagerPanelRefreshSecond)
    ) {
      this.rebuildManagerPanel(state);
      this.lastManagerPanelRefreshSecond = currentManagerSecond;
    }

    this.activeBuyMode = buyMode;
    this.uiInitialized = true;
  }

  private refreshManagerSlots(state: GameState): void {
    for (const area of ["warehouse", "elevator", "mineShaft"] as const) {
      const slot = this.managerSlots[area];
      const assignedManager = getAssignedManagerForArea(state, area);
      const automated = state.managers.automationEnabledByArea[area];
      const locked = state.managers.systemLocked;

      this.drawManagerSlotFrame(slot, automated, locked, assignedManager?.isActive ?? false);

      slot.titleText.setText(`${getAreaLabel(area)} Slot`);
      slot.emptySlotImage.setVisible(assignedManager === undefined);
      slot.portraitImage.setVisible(assignedManager !== undefined);
      slot.abilityImage.setVisible(assignedManager !== undefined);

      if (assignedManager !== undefined) {
        slot.portraitImage
          .setTexture(getManagerPortraitKey(area, assignedManager.rank))
          .setFlipX(false)
          .setAlpha(1);
        slot.abilityImage
          .setTexture(getAbilityIconKey(assignedManager.abilityType))
          .setAlpha(assignedManager.isActive ? 1 : assignedManager.remainingCooldownTime > 0 ? 0.48 : 0.9)
          .clearTint();
        slot.rankText.setText(formatRank(assignedManager.rank)).setColor(getRankColor(assignedManager.rank));
        slot.statusText.setText(automated ? "Automated" : "Manual").setColor(automated ? "#95f0bd" : "#f1d389");
        slot.timerText.setText(formatManagerTimer(assignedManager));
        slot.abilityZone.setInteractive({ useHandCursor: true });
      } else {
        slot.emptySlotImage.setTexture(getManagerEmptySlotKey(area)).setAlpha(locked ? 0.52 : 0.9);
        slot.rankText.setText("No Manager").setColor(locked ? "#b6a385" : "#f7f1dd");
        slot.statusText.setText("Manual").setColor("#f1d389");
        slot.timerText.setText(locked ? `Unlock: Mine Lvl ${state.managers.unlockLevel}` : "Tap to hire");
        slot.abilityZone.disableInteractive();
      }
    }
  }

  private drawManagerSlotFrame(
    slot: ManagerSlotUi,
    automated: boolean,
    locked: boolean,
    activeAbility: boolean
  ): void {
    const fill = locked ? 0x1d2430 : automated ? 0x17382d : 0x273542;
    const innerFill = activeAbility ? 0x62bf7b : automated ? 0x2a6b50 : 0x5c7c87;
    const line = activeAbility ? 0xb5ff8d : automated ? 0x95f0bd : 0xf1c96b;

    slot.frame.clear();
    slot.frame.fillStyle(fill, locked ? 0.78 : 0.92);
    slot.frame.fillRoundedRect(slot.x, slot.y, MANAGER_SLOT_WIDTH, MANAGER_SLOT_HEIGHT, 14);
    slot.frame.fillStyle(innerFill, activeAbility ? 0.2 : 0.12);
    slot.frame.fillRoundedRect(slot.x + 5, slot.y + 5, MANAGER_SLOT_WIDTH - 10, MANAGER_SLOT_HEIGHT - 10, 10);
    slot.frame.lineStyle(1.5, line, locked ? 0.42 : 0.84);
    slot.frame.strokeRoundedRect(slot.x + 0.75, slot.y + 0.75, MANAGER_SLOT_WIDTH - 1.5, MANAGER_SLOT_HEIGHT - 1.5, 14);
    slot.frame.setAlpha(0.94);
  }

  private openManagerPanel(area: ManagerArea, state: GameState): void {
    if (state.managers.systemLocked) {
      this.applyFrame(this.viewModel.purchaseManager(area), this.time.now);
      return;
    }

    this.activeManagerPanelArea = area;
    this.managerPanelScrollY = 0;
    this.rebuildManagerPanel(state);
    this.lastManagerPanelRefreshSecond = Math.floor(state.timeSeconds);
  }

  private closeManagerPanel(): void {
    this.managerPanel?.destroy(true);
    this.managerPanel = undefined;
    this.activeManagerPanelArea = null;
    this.managerPanelScrollY = 0;
    this.lastManagerPanelRefreshSecond = -1;
  }

  private rebuildManagerPanel(state: GameState): void {
    const area = this.activeManagerPanelArea;

    if (area === null) {
      return;
    }

    if (state.managers.systemLocked) {
      this.closeManagerPanel();
      return;
    }

    this.managerPanel?.destroy(true);

    const container = this.add.container(0, 0).setDepth(MANAGER_PANEL_DEPTH);
    this.managerPanel = container;

    const backdrop = this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.42)
      .setOrigin(0, 0)
      .setInteractive();
    backdrop.on("pointerdown", () => {
      this.closeManagerPanel();
    });
    container.add(backdrop);

    const panelFrame = this.add.graphics();
    panelFrame.fillStyle(0x14222c, 0.98);
    panelFrame.fillRoundedRect(MANAGER_PANEL_X, MANAGER_PANEL_Y, MANAGER_PANEL_WIDTH, MANAGER_PANEL_HEIGHT, 18);
    panelFrame.fillStyle(0xf0c66c, 0.96);
    panelFrame.fillRoundedRect(MANAGER_PANEL_X + 6, MANAGER_PANEL_Y + 6, MANAGER_PANEL_WIDTH - 12, 54, 14);
    panelFrame.fillStyle(0x203642, 0.96);
    panelFrame.fillRoundedRect(MANAGER_PANEL_X + 6, MANAGER_PANEL_Y + 66, MANAGER_PANEL_WIDTH - 12, MANAGER_PANEL_HEIGHT - 72, 14);
    panelFrame.lineStyle(2, 0xf1c96b, 0.92);
    panelFrame.strokeRoundedRect(MANAGER_PANEL_X + 1, MANAGER_PANEL_Y + 1, MANAGER_PANEL_WIDTH - 2, MANAGER_PANEL_HEIGHT - 2, 18);
    container.add(panelFrame);

    container.add(
      this.add
        .text(MANAGER_PANEL_X + 22, MANAGER_PANEL_Y + 20, `${getAreaLabel(area)} Manager`, topBarTextStyle(20, "#4b2709"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    container.add(
      this.add
        .text(
          MANAGER_PANEL_X + 244,
          MANAGER_PANEL_Y + 24,
          state.managers.automationEnabledByArea[area] ? "Automated" : "Manual",
          smallUiTextStyle(13, state.managers.automationEnabledByArea[area] ? "#174421" : "#6a3b13")
        )
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    this.createPanelButton(
      container,
      MANAGER_PANEL_X + MANAGER_PANEL_WIDTH - 54,
      MANAGER_PANEL_Y + 16,
      34,
      28,
      "X",
      true,
      () => {
        this.closeManagerPanel();
      }
    );

    // Scrollable Content
    const contentAreaX = MANAGER_PANEL_X + 6;
    const contentAreaY = MANAGER_PANEL_Y + 66;
    const contentAreaWidth = MANAGER_PANEL_WIDTH - 12;
    const contentAreaHeight = MANAGER_PANEL_HEIGHT - 72;

    const contentMaskShape = this.make.graphics({});
    contentMaskShape.fillStyle(0xffffff);
    contentMaskShape.fillRoundedRect(contentAreaX, contentAreaY, contentAreaWidth, contentAreaHeight, 14);
    const contentMask = contentMaskShape.createGeometryMask();

    const contentContainer = this.add.container(0, this.managerPanelScrollY);
    contentContainer.setMask(contentMask);
    container.add(contentContainer);

    const assignedManager = getAssignedManagerForArea(state, area);
    const assignedY = MANAGER_PANEL_Y + 78;
    this.createAssignedManagerPanel(contentContainer, area, assignedManager, state.managers.automationEnabledByArea[area], assignedY);

    let cursorY = assignedY + 132;
    contentContainer.add(
      this.add
        .text(MANAGER_PANEL_X + 22, cursorY, "Hire Offers", smallUiTextStyle(14, "#f9e9bb"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    cursorY += 26;

    const offers = this.getManagerHireOffers(state, area);
    offers.forEach((offer, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = MANAGER_PANEL_X + 22 + column * (MANAGER_ENTRY_WIDTH + MANAGER_ENTRY_GAP_X);
      const y = cursorY + row * (MANAGER_ENTRY_HEIGHT + MANAGER_ENTRY_GAP_Y);
      this.createHireOfferEntry(contentContainer, offer, x, y);
    });
    cursorY += Math.ceil(offers.length / 2) * (MANAGER_ENTRY_HEIGHT + MANAGER_ENTRY_GAP_Y) + 14;

    const ownedManagers = state.managers.ownedManagers.filter((manager) => manager.area === area && manager.isOwned);
    contentContainer.add(
      this.add
        .text(MANAGER_PANEL_X + 22, cursorY, "Owned Managers", smallUiTextStyle(14, "#f9e9bb"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    cursorY += 26;

    if (ownedManagers.length === 0) {
      contentContainer.add(
        this.add
          .text(MANAGER_PANEL_X + 26, cursorY + 8, "No managers in this area yet.", smallUiTextStyle(12, "#bdd2d8"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      cursorY += 34;
    } else {
      ownedManagers.forEach((manager, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = MANAGER_PANEL_X + 22 + column * (MANAGER_ENTRY_WIDTH + MANAGER_ENTRY_GAP_X);
        const y = cursorY + row * (MANAGER_ENTRY_HEIGHT + MANAGER_ENTRY_GAP_Y);
        this.createOwnedManagerEntry(contentContainer, manager, x, y);
      });
      cursorY += Math.ceil(ownedManagers.length / 2) * (MANAGER_ENTRY_HEIGHT + MANAGER_ENTRY_GAP_Y);
    }

    const totalContentHeight = cursorY - contentAreaY + 20;
    (contentContainer as any).totalContentHeight = totalContentHeight;
    const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);

    // Clamp scroll Y if content height changed
    this.managerPanelScrollY = Phaser.Math.Clamp(this.managerPanelScrollY, -maxScroll, 0);
    contentContainer.setY(this.managerPanelScrollY);

    // Scrollbar
    if (maxScroll > 0) {
      const scrollbarHeight = Math.max(30, (contentAreaHeight / totalContentHeight) * contentAreaHeight);
      const scrollbar = this.add.graphics();
      (scrollbar as any).isScrollbar = true;
      (scrollbar as any).scrollbarHeight = scrollbarHeight;
      scrollbar.fillStyle(0xf1c96b, 0.4);
      scrollbar.fillRoundedRect(contentAreaX + contentAreaWidth - 10, 0, 4, scrollbarHeight, 2);
      
      const scrollPercent = -this.managerPanelScrollY / maxScroll;
      scrollbar.setY(contentAreaY + 5 + scrollPercent * (contentAreaHeight - scrollbarHeight - 10));
      
      container.add(scrollbar);
    }
  }

  private createAssignedManagerPanel(
    container: Phaser.GameObjects.Container,
    area: ManagerArea,
    manager: ManagerState | undefined,
    automated: boolean,
    y: number
  ): void {
    this.createPanelCard(container, MANAGER_PANEL_X + 18, y, MANAGER_PANEL_WIDTH - 36, 112, 0x253e49, 0.98);
    const assignedTitleText = this.add
      .text(MANAGER_PANEL_X + 36, y + 14, "Currently assigned", smallUiTextStyle(13, "#f7e5b2"))
      .setDepth(MANAGER_PANEL_TEXT_DEPTH);
    container.add(assignedTitleText);

    if (manager === undefined) {
      container.add(
        this.add
          .image(MANAGER_PANEL_X + 64, y + 66, getManagerEmptySlotKey(area))
          .setDisplaySize(58, 58)
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      container.add(
        this.add
          .text(MANAGER_PANEL_X + 104, y + 48, "No manager assigned", smallUiTextStyle(14, "#dcecf1"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      container.add(
        this.add
          .text(MANAGER_PANEL_X + 104, y + 72, "This area is running manually.", smallUiTextStyle(12, "#bdd2d8"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
    } else {
      container.add(
        this.add
          .image(MANAGER_PANEL_X + 64, y + 64, getManagerPortraitKey(area, manager.rank))
          .setDisplaySize(66, 66)
          .setFlipX(false)
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      const managerNameText = this.add.text(
        MANAGER_PANEL_X + 106,
        y + 38,
        manager.displayName,
        smallUiTextStyle(13, "#ecf8fa")
      );
      fitTextToWidth(managerNameText, 260, [13, 12, 11]);
      container.add(managerNameText.setDepth(MANAGER_PANEL_TEXT_DEPTH));
      container.add(
        this.add
          .text(
            MANAGER_PANEL_X + 106,
            y + 58,
            `Rank: ${formatRank(manager.rank)}`,
            smallUiTextStyle(12, getRankColor(manager.rank))
          )
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      container.add(
        this.add
          .text(
            MANAGER_PANEL_X + 106,
            y + 78,
            `Ability: ${formatAbilityType(manager.abilityType)}`,
            smallUiTextStyle(12, "#bdd2d8")
          )
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      container.add(
        this.add
          .text(MANAGER_PANEL_X + 382, y + 38, formatManagerTimer(manager), smallUiTextStyle(12, "#f1d389"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );

      const abilityIcon = this.add
        .image(MANAGER_PANEL_X + 594, y + 58, getAbilityIconKey(manager.abilityType))
        .setDisplaySize(108, 108)
        .setAlpha(manager.isActive ? 1 : manager.remainingCooldownTime > 0 ? 0.48 : 0.92)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH);
      const abilityZone = this.add
        .zone(MANAGER_PANEL_X + 594, y + 58, 116, 116)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(MANAGER_PANEL_INTERACTIVE_DEPTH);

      abilityZone.on("pointerdown", () => {
        this.activateAssignedManagerAbility(area);
      });

      container.add([abilityIcon, abilityZone]);

      this.createPanelButton(
        container,
        assignedTitleText.x + assignedTitleText.width + 12,
        y + 10,
        96,
        24,
        "Unassign",
        true,
        () => {
          this.applyFrame(this.viewModel.unassignManager(area), this.time.now);
        },
        true,
        0xc94c4c
      );
    }

    if (automated) {
      container.add(
        this.add
          .text(MANAGER_PANEL_X + 382, y + 82, "Automated", smallUiTextStyle(12, "#95f0bd"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      return;
    }

    this.createPanelButton(
      container,
      MANAGER_PANEL_X + 460,
      y + 76,
      152,
      28,
      getManualActionLabel(area),
      true,
      () => {
        this.handleManualAreaAction(area);
      }
    );
  }

  private createOwnedManagerEntry(
    container: Phaser.GameObjects.Container,
    manager: ManagerState,
    x: number,
    y: number
  ): void {
    this.createPanelCard(container, x, y, MANAGER_ENTRY_WIDTH, MANAGER_ENTRY_HEIGHT, manager.isAssigned ? 0x284f38 : 0x1f323c, 0.96);
    container.add(
      this.add
        .image(x + 22, y + 21, getManagerPortraitKey(manager.area, manager.rank))
        .setDisplaySize(34, 34)
        .setFlipX(false)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    container.add(
      this.add
        .image(x + 58, y + 21, getAbilityIconKey(manager.abilityType))
        .setDisplaySize(22, 22)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    container.add(
      this.add
        .text(x + 76, y + 7, formatRank(manager.rank), smallUiTextStyle(11, getRankColor(manager.rank)))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    container.add(
      this.add
        .text(x + 76, y + 23, formatAbilityType(manager.abilityType), smallUiTextStyle(10, "#bdd2d8"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    if (manager.isAssigned) {
      container.add(
        this.add
          .text(x + 224, y + 14, "Assigned", smallUiTextStyle(11, "#95f0bd"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      return;
    }

    this.createPanelButton(
      container,
      x + 226,
      y + 8,
      62,
      26,
      "Assign",
      true,
      () => {
        this.applyFrame(this.viewModel.assignManager(manager.id, manager.area), this.time.now);
      }
    );
  }

  private createHireOfferEntry(container: Phaser.GameObjects.Container, offer: ManagerHireOffer, x: number, y: number): void {
    this.createPanelCard(container, x, y, MANAGER_ENTRY_WIDTH, MANAGER_ENTRY_HEIGHT, offer.canAfford ? 0x1f323c : 0x332b2b, 0.96);
    container.add(
      this.add
        .image(x + 22, y + 21, getManagerPortraitKey(offer.area, 'junior'))
        .setDisplaySize(34, 34)
        .setFlipX(false)
        .setAlpha(offer.canAfford ? 1 : 0.68)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    container.add(
      this.add
        .text(x + 70, y + 12, "Random draw + ability", smallUiTextStyle(11, "#ecf8fa"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    container.add(
      this.add
        .text(x + 76, y + 23, formatMoney(offer.hireCost), smallUiTextStyle(11, offer.canAfford ? "#f1d389" : "#f08e7f"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    this.createPanelButton(
      container,
      x + 236,
      y + 8,
      52,
      26,
      "Hire",
      offer.canAfford,
      () => {
        this.applyFrame(this.viewModel.purchaseManager(offer.area), this.time.now);
      },
      true
    );
  }

  private createPanelCard(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: number,
    fillAlpha: number
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics().setDepth(MANAGER_PANEL_DEPTH);
    graphics.fillStyle(fill, fillAlpha);
    graphics.fillRoundedRect(x, y, width, height, 10);
    graphics.lineStyle(1, 0xf1c96b, 0.26);
    graphics.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, 10);
    container.add(graphics);
    return graphics;
  }

  private createPanelButton(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    visualEnabled: boolean,
    handler: () => void,
    interactive = visualEnabled,
    enabledTint?: number
  ): void {
    const tint = enabledTint ?? (visualEnabled ? 0xffffff : 0x8c6c58);
    const image = this.add
      .image(x + width / 2, y + height / 2, "button-panel")
      .setDisplaySize(width, height)
      .setAlpha(visualEnabled ? 1 : 0.64)
      .setTint(tint)
      .setDepth(MANAGER_PANEL_TEXT_DEPTH);
    const text = this.add
      .text(x + width / 2, y + height / 2 - 1, label, smallUiTextStyle(11, visualEnabled ? "#fff8de" : "#e3c7aa"))
      .setOrigin(0.5)
      .setDepth(MANAGER_PANEL_TEXT_DEPTH);
    const zone = this.add
      .zone(x + width / 2, y + height / 2, width, height)
      .setOrigin(0.5)
      .setDepth(MANAGER_PANEL_INTERACTIVE_DEPTH);

    if (interactive) {
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerdown", handler);
    }

    container.add([image, text, zone]);
  }

  private getManagerHireOffers(state: GameState, area: ManagerArea): ManagerHireOffer[] {
    const hiredCount = state.managers.hireCountsByArea[area];
    const hireCost = getManagerHireCost(this.balance, area, hiredCount);
    return [{
      area,
      hireCost,
      canAfford: state.money >= hireCost
    }];
  }

  private activateAssignedManagerAbility(area: ManagerArea): void {
    const state = this.latestState;
    const manager = state === undefined ? undefined : getAssignedManagerForArea(state, area);

    if (manager === undefined) {
      return;
    }

    this.applyFrame(this.viewModel.activateManagerAbility(manager.id), this.time.now);
  }

  private handleManualAreaAction(area: ManagerArea): void {
    switch (area) {
      case "mineShaft":
        this.applyFrame(this.viewModel.manualMineAction(), this.time.now);
        return;
      case "elevator":
        this.applyFrame(this.viewModel.manualElevatorAction(), this.time.now);
        return;
      case "warehouse":
        this.applyFrame(this.viewModel.manualWarehouseAction(), this.time.now);
        return;
    }
  }

  private refreshBuyModeButtons(activeBuyMode: UpgradeBuyMode): void {
    for (const button of this.buyModeButtons) {
      const isActive = button.mode === activeBuyMode;
      button.background.setAlpha(isActive ? 1 : 0.82);
      button.background.setTint(isActive ? 0xfff7d8 : 0xe9cf92);
      button.label.setColor(BUY_MODE_BUTTON_LABEL_COLOR);

      if (button.zone.input) {
        button.zone.input.cursor = "pointer";
      }
    }
  }

  private refreshUpgradeCards(state: GameState): void {
    this.refreshUpgradeCard("warehouse", this.upgradeCards.warehouse, state);
    this.refreshUpgradeCard("elevator", this.upgradeCards.elevator, state);
    this.refreshUpgradeCard("mineShaft", this.upgradeCards.mineShaft, state);
  }

  private refreshUpgradeCard(target: UpgradeTarget, card: UpgradeCardUi, state: GameState): void {
    const preview = state.upgrades[target];
    const display = getUpgradeDisplay(this.balance, target, state);

    card.levelText.setText(`Lvl ${preview.currentLevel}`);
    card.mainLabelText.setText(display.mainLabel);
    card.mainCurrentText.setText(display.mainCurrent);
    card.mainNextText.setText(display.mainNext);
    card.secondaryLabelText.setText(display.secondaryLabel);
    card.secondaryCurrentText.setText(display.secondaryCurrent);
    card.secondaryNextText.setText(display.secondaryNext);
    card.costText.setText(preview.isMaxed ? "MAX" : formatLargeNumber(preview.cost));
    card.buyCountText.setText(preview.isMaxed ? "" : `x${preview.levelsToBuy}`);

    if (preview.isMaxed) {
      card.mainNextText.setText("MAX");
      card.secondaryNextText.setText("MAX");
    }

    fitTextToWidth(card.mainCurrentText, 88, [18, 16, 14, 12]);
    fitTextToWidth(card.mainNextText, 88, [18, 16, 14, 12]);
    fitTextToWidth(card.secondaryCurrentText, 88, [14, 13, 12, 11]);
    fitTextToWidth(card.secondaryNextText, 88, [14, 13, 12, 11]);
    fitTextToWidth(card.costText, 120, [13, 12, 11, 10]);
    fitTextToWidth(card.buyCountText, 54, [11, 10, 9]);

    this.setUpgradeCardEnabled(card, preview.canAfford && !preview.isMaxed);

    card.buttonZone.removeAllListeners("pointerdown");
    card.buttonZone.on("pointerdown", () => {
      if (!card.enabled) {
        return;
      }

      this.applyFrame(this.viewModel.purchaseUpgrade(target), this.time.now);
    });
  }

  private setUpgradeCardEnabled(card: UpgradeCardUi, enabled: boolean): void {
    card.enabled = enabled;
    card.frame.setAlpha(enabled ? 1 : 0.88);
    card.levelBadge.setAlpha(enabled ? 1 : 0.76);
    card.buttonImage.setAlpha(enabled ? 1 : 0.7);
    card.buttonImage.setTint(enabled ? 0xffffff : 0x9c7f58);
    card.buttonText.setColor(enabled ? "#fff8de" : "#e0cfb3");
    card.costText.setColor(enabled ? "#5a3411" : "#a84a3a");
    card.buyCountText.setColor(enabled ? "#7b4e1d" : "#9f7e62");
    card.mainCurrentText.setAlpha(enabled ? 1 : 0.82);
    card.mainNextText.setAlpha(enabled ? 1 : 0.82);
    card.secondaryCurrentText.setAlpha(enabled ? 1 : 0.8);
    card.secondaryNextText.setAlpha(enabled ? 1 : 0.8);

    if (card.buttonZone.input) {
      card.buttonZone.input.cursor = enabled ? "pointer" : "default";
    }
  }

  private drawUpgradeCardFrame(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics().setDepth(UI_PANEL_DEPTH);
    graphics.fillStyle(0x4b2b14, 0.98);
    graphics.fillRoundedRect(x, y, width, height, 16);
    graphics.fillStyle(0xf3d08d, 0.98);
    graphics.fillRoundedRect(x + 5, y + 5, width - 10, height - 10, 13);
    graphics.fillStyle(0x486470, 0.98);
    graphics.fillRoundedRect(x + 8, y + 8, width - 16, 28, 10);
    graphics.fillStyle(0xd8b168, 0.28);
    graphics.fillRoundedRect(x + 12, y + 112, width - 24, 20, 8);
    graphics.lineStyle(2, 0x693813, 0.92);
    graphics.strokeRoundedRect(x + 1, y + 1, width - 2, height - 2, 16);
    graphics.lineStyle(1, 0x74441a, 0.62);
    graphics.strokeLineShape(new Phaser.Geom.Line(x + 14, y + 52, x + width - 14, y + 52));
    graphics.strokeLineShape(new Phaser.Geom.Line(x + 14, y + 92, x + width - 14, y + 92));
    return graphics;
  }

  private drawLevelBadge(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics().setDepth(UI_PANEL_DEPTH + 1);
    graphics.fillStyle(0x233c45, 0.96);
    graphics.fillRoundedRect(x, y, width, height, 10);
    graphics.lineStyle(1, 0xf6df9b, 0.7);
    graphics.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, 10);
    return graphics;
  }

  private drawRoundedPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    style: {
      fill: number;
      fillAlpha: number;
      innerFill: number;
      innerAlpha: number;
      line: number;
      radius: number;
    }
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics().setDepth(UI_PANEL_DEPTH);
    graphics.fillStyle(style.fill, style.fillAlpha);
    graphics.fillRoundedRect(x, y, width, height, style.radius);
    graphics.fillStyle(style.innerFill, style.innerAlpha);
    graphics.fillRoundedRect(x + 4, y + 4, width - 8, height - 8, Math.max(style.radius - 4, 2));
    graphics.lineStyle(1.5, style.line, 0.82);
    graphics.strokeRoundedRect(x + 0.75, y + 0.75, width - 1.5, height - 1.5, style.radius);
    return graphics;
  }
}

function topBarTextStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: "700",
    color
  };
}

function cardTitleTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: "15px",
    fontStyle: "700",
    color: "#ecf8fa",
    stroke: "#233845",
    strokeThickness: 2
  };
}

function smallUiTextStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: "700",
    color
  };
}

function metricValueTextStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: "700",
    color,
    stroke: "#f6e3aa",
    strokeThickness: 1
  };
}

function feedbackTextStyle(fontSize: number, color: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: UI_FONT_FAMILY,
    fontSize: `${fontSize}px`,
    fontStyle: "700",
    color,
    stroke: "#40270f",
    strokeThickness: 4
  };
}

function getUpgradeDisplay(balance: BalanceConfig, target: UpgradeTarget, state: GameState): UpgradeCardDisplay {
  if (target === "mineShaft") {
    const current = state.baseValues.mineShaft;
    const preview = state.upgrades.mineShaft.previewStats;

    return {
      mainLabel: "Production",
      mainCurrent: formatRate(current.throughputPerSecond),
      mainNext: formatRate(preview.throughputPerSecond),
      secondaryLabel: "Buffer",
      secondaryCurrent: formatAmount(current.bufferCapacity),
      secondaryNext: formatAmount(preview.bufferCapacity)
    };
  }

  if (target === "elevator") {
    const current = state.baseValues.elevator;
    const preview = state.upgrades.elevator.previewStats;

    return {
      mainLabel: "Capacity",
      mainCurrent: formatAmount(current.loadCapacity),
      mainNext: formatAmount(preview.loadCapacity),
      secondaryLabel: "Speed",
      secondaryCurrent: formatSpeedMultiplier(getElevatorSpeedMultiplier(balance, current.tripTimeSeconds)),
      secondaryNext: formatSpeedMultiplier(getElevatorSpeedMultiplier(balance, preview.tripTimeSeconds))
    };
  }

  const current = state.baseValues.warehouse;
  const preview = state.upgrades.warehouse.previewStats;

  return {
    mainLabel: "Sales",
    mainCurrent: formatRate(current.throughputPerSecond),
    mainNext: formatRate(preview.throughputPerSecond),
    secondaryLabel: "Storage",
    secondaryCurrent: formatAmount(current.storageCapacity),
    secondaryNext: formatAmount(preview.storageCapacity)
  };
}

function formatProductionSummary(state: GameState): string {
  return (
    `Mine ${formatRate(state.currentValues.mineShaft.throughputPerSecond)}   ` +
    `Elevator ${formatRate(state.currentValues.elevator.throughputPerSecond)}   ` +
    `Warehouse ${formatRate(state.currentValues.warehouse.throughputPerSecond)}`
  );
}

function formatRate(value: number): string {
  return `${formatAmount(value)}/s`;
}

function formatSpeedMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

function formatMoney(value: number): string {
  return formatCurrency(value);
}

function formatAmount(value: number): string {
  return formatLargeNumber(value);
}

function formatFlowStatus(state: GameState, events: SimulationEvent[]): string {
  const event = [...events].reverse().find((candidate) => candidate.type !== "storageChanged");

  if (event?.type === "miningCycleStarted") {
    return "Mine started";
  }

  if (event?.type === "oreProduced") {
    return `Mine: +${formatAmount(event.amount)} ore`;
  }

  if (event?.type === "elevatorCycleStarted") {
    return "Elevator departs";
  }

  if (event?.type === "oreCollectedByElevator") {
    return `Elevator loaded: ${formatAmount(event.amount)} ore`;
  }

  if (event?.type === "oreDeliveredToWarehouse") {
    return `Warehouse: +${formatAmount(event.amount)} ore`;
  }

  if (event?.type === "elevatorArrived") {
    return event.remainingCarriedOre > 0 ? "Elevator waiting at top" : "Elevator arrived";
  }

  if (event?.type === "warehouseCycleStarted") {
    return "Warehouse worker started";
  }

  if (event?.type === "oreSold") {
    return `Sold: ${formatAmount(event.amount)} ore`;
  }

  if (event?.type === "upgradePurchased") {
    const gainedLevels = event.currentLevel - event.previousLevel;
    return `${getUpgradeName(event.target)} +${gainedLevels} Level`;
  }

  if (event?.type === "managerPurchased") {
    return `${getAreaLabel(event.manager.area)} manager purchased`;
  }

  if (event?.type === "managerAssigned") {
    return `${getAreaLabel(event.area)} automated`;
  }

  if (event?.type === "managerUnassigned") {
    return `${getAreaLabel(event.area)} back to manual`;
  }

  if (event?.type === "managerAbilityActivated") {
    return `${formatAbilityType(event.manager.abilityType)} active`;
  }

  if (event?.type === "managerCooldownFinished") {
    return `${getAreaLabel(event.manager.area)} ability ready`;
  }

  if (event?.type === "commandRejected") {
    return event.message;
  }

  if (event?.type === "actionFailed") {
    return event.message;
  }

  return `Produced: ${formatAmount(state.resources.totals.producedOre)}   Sold: ${formatAmount(state.resources.totals.soldOre)}`;
}

function getUpgradeName(target: UpgradeTarget): string {
  if (target === "mineShaft") {
    return "Mine Shaft";
  }

  if (target === "elevator") {
    return "Elevator";
  }

  return "Warehouse";
}

function getAssignedManagerForArea(state: GameState, area: ManagerArea): ManagerState | undefined {
  const assignedManagerId = state.managers.assignedManagerIdsByArea[area];

  if (assignedManagerId === null) {
    return undefined;
  }

  return state.managers.ownedManagers.find((manager) => manager.id === assignedManagerId && manager.isOwned);
}

function getManagerEmptySlotKey(area: ManagerArea): string {
  return area === "elevator" ? "manager-slot-left-empty" : "manager-slot-empty";
}

function getManagerPortraitKey(area: ManagerArea, rank: ManagerRank): string {
  const assetArea = area === "mineShaft" ? "mine" : area;
  let assetRarity = "common";
  if (rank === "senior") assetRarity = "rare";
  if (rank === "executive") assetRarity = "epic";
  return `manager-${assetArea}-${assetRarity}`;
}

function getAbilityIconKey(abilityType: ManagerAbilityType): string {
  switch (abilityType) {
    case "miningSpeedBoost": return "ability-mining-speed";
    case "walkingSpeedBoost": return "ability-walking-speed";
    case "loadingSpeedBoost": return "ability-loading-speed";
    case "movementSpeedBoost": return "ability-movement-speed";
    case "loadExpansion": return "ability-capacity-boost";
    case "upgradeCostReduction": return "ability-cost-reduction";
  }
}

function getAreaLabel(area: ManagerArea): string {
  switch (area) {
    case "mineShaft":
      return "Mine";
    case "elevator":
      return "Elevator";
    case "warehouse":
      return "Warehouse";
  }
}

function getManualActionLabel(area: ManagerArea): string {
  switch (area) {
    case "mineShaft":
      return "Manual Mine";
    case "elevator":
      return "Manual Elevator";
    case "warehouse":
      return "Manual Sell";
  }
}

function formatRank(rank: ManagerRank): string {
  switch (rank) {
    case "junior": return "Junior";
    case "senior": return "Senior";
    case "executive": return "Executive";
  }
}

function getRankColor(rank: ManagerRank): string {
  switch (rank) {
    case "junior": return "#dcecf1";
    case "senior": return "#7fc7ff";
    case "executive": return "#e0a3ff";
  }
}

function formatAbilityType(abilityType: ManagerAbilityType): string {
  switch (abilityType) {
    case "miningSpeedBoost": return "Mining Speed";
    case "walkingSpeedBoost": return "Walking Speed";
    case "loadingSpeedBoost": return "Loading Speed";
    case "movementSpeedBoost": return "Movement Speed";
    case "loadExpansion": return "Capacity Boost";
    case "upgradeCostReduction": return "Cost Reduction";
  }
}

function formatManagerTimer(manager: ManagerState): string {
  if (manager.isActive) {
    return `Active ${formatDuration(manager.remainingActiveTime)}`;
  }

  if (manager.remainingCooldownTime > 0) {
    return `Cooldown ${formatDuration(manager.remainingCooldownTime)}`;
  }

  return "Ability ready";
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number, fontSizes: number[]): void {
  for (const fontSize of fontSizes) {
    text.setFontSize(fontSize);

    if (text.width <= maxWidth) {
      return;
    }
  }
}
