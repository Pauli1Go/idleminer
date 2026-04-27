import Phaser from "phaser";

import backgroundSurfaceUrl from "../../assets/backgrounds/background_surface_clean.png";
import backgroundUndergroundUrl from "../../assets/backgrounds/background_underground_clean.png";
import backgroundUndergroundDepth2Url from "../../assets/backgrounds/background_underground_deph_2.png";
import backgroundUndergroundDepth3Url from "../../assets/backgrounds/background_underground_deph_3.png";
import backgroundUndergroundDepth4Url from "../../assets/backgrounds/background_underground_deph_4.png";
import backgroundUndergroundDepth5Url from "../../assets/backgrounds/background_underground_deph_5.png";
import backgroundUndergroundDepth6Url from "../../assets/backgrounds/background_underground_deph_6.png";
import stoneBlockadeUrl from "../../assets/backgrounds/stone_blockade.png";
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
import elevatorShaftBottomUrl from "../../assets/world/elevator_shaft_vertical_bottom_level1png.png";
import elevatorShaftMiddleUrl from "../../assets/world/elevator_shaft_vertical_middle_level1.png";
import elevatorShaftTopUrl from "../../assets/world/elevator_shaft_vertical_top_level1.png";
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
import { formatLargeNumber, formatCurrency, formatDuration } from "../core/formatters.ts";
import { SimulationViewModel, type SimulationFrame } from "../game/SimulationViewModel.ts";
import { IS_DEBUG } from "../debug/config.ts";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const SURFACE_HEIGHT = 206;
const SHAFTS_PER_DEPTH_GROUP = 5;

const UI_FONT_FAMILY = '"Trebuchet MS", Verdana, sans-serif';
const UI_PANEL_DEPTH = 20;
const UI_TEXT_DEPTH = 21;
const UI_INTERACTIVE_DEPTH = 22;

const PINNED_UI_PANEL_DEPTH = 30;
const PINNED_UI_TEXT_DEPTH = 31;
const PINNED_UI_INTERACTIVE_DEPTH = 32;

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
const MINE_SHAFT_VERTICAL_SPACING = 212;
const DEPTH_GROUP_VERTICAL_GAP = 180;
const DEPTH_SECTION_WIDTH = GAME_WIDTH;
const ELEVATOR_SHAFT_WIDTH = 124;
const ELEVATOR_SHAFT_TOP_HEIGHT = MINE_SHAFT_VERTICAL_SPACING / 2;
const ELEVATOR_SHAFT_MIDDLE_HEIGHT = MINE_SHAFT_VERTICAL_SPACING;
const ELEVATOR_SHAFT_BOTTOM_HEIGHT = MINE_SHAFT_VERTICAL_SPACING / 2;
const ELEVATOR_SHAFT_SURFACE_TOP_CENTER_Y = 239;
const ELEVATOR_SHAFT_BOTTOM_CENTER_OFFSET = 35;
const MINE_SHAFT_BACK_WALL_Y = 508;
const MINE_SHAFT_BACK_WALL_WIDTH = 452;
const MINE_SHAFT_BACK_WALL_HEIGHT = 244;
const MINE_SHAFT_BACK_WALL_VISUAL_OFFSET_Y = 9;
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
const MINE_SHAFT_STORAGE_TEXT_X = 646;
const MINE_SHAFT_STORAGE_TEXT_Y = 510;
const LOCKED_SHAFT_PLACEHOLDER_X = 530;
const LOCKED_SHAFT_PLACEHOLDER_WIDTH = 714;
const LOCKED_SHAFT_PLACEHOLDER_HEIGHT = 126;
const LOCKED_SHAFT_BUTTON_WIDTH = 168;
const LOCKED_SHAFT_BUTTON_HEIGHT = 38;
const DEPTH_BLOCKADE_IMAGE_WIDTH = GAME_WIDTH;
const DEPTH_BLOCKADE_IMAGE_HEIGHT = 232;
const DEPTH_BLOCKADE_BUTTON_WIDTH = 188;
const DEPTH_BLOCKADE_BUTTON_HEIGHT = 38;
const DEPTH_BLOCKADE_PANEL_WIDTH = 432;
const DEPTH_BLOCKADE_PANEL_HEIGHT = 112;
const DEPTH_BLOCKADE_CENTER_X = GAME_WIDTH / 2;
const MINE_MANAGER_SLOT_X = 148;
const MINE_CLICK_TARGET_X = 518;
const MINE_CLICK_TARGET_WIDTH = 448;
const MINE_CLICK_TARGET_HEIGHT = 214;

const MONEY_PANEL_X = 18;
const MONEY_PANEL_Y = 14;
const MONEY_PANEL_WIDTH = 172;
const MONEY_PANEL_HEIGHT = 40;
const FLOW_PANEL_X = 197;
const FLOW_PANEL_Y = 14;
const FLOW_PANEL_WIDTH = 394;
const FLOW_PANEL_HEIGHT = 40;

const UPGRADE_COLUMN_X = 972;
const UPGRADE_COLUMN_WIDTH = 290;
const BUY_MODE_BAR_Y = 14;
const BUY_MODE_BAR_HEIGHT = 40;
const BUY_MODE_BUTTON_WIDTH = 52;
const BUY_MODE_BUTTON_HEIGHT = 30;
const BUY_MODE_BUTTON_GAP = 3;
const BUY_MODE_BUTTON_START_X = UPGRADE_COLUMN_X + 55;
const BUY_MODE_BUTTON_Y = BUY_MODE_BAR_Y + BUY_MODE_BAR_HEIGHT / 2;
const BUY_MODE_BUTTON_LABEL_Y = BUY_MODE_BAR_Y + BUY_MODE_BAR_HEIGHT / 2;
const BUY_MODE_BUTTON_LABEL_COLOR = "#fff8de";
const UPGRADE_CARD_WIDTH = UPGRADE_COLUMN_WIDTH;
const UPGRADE_CARD_HEIGHT = 146;
const WAREHOUSE_CARD_Y = 72;
const ELEVATOR_CARD_Y = 230;
const UPGRADE_BUTTON_WIDTH = 132;
const UPGRADE_BUTTON_HEIGHT = 34;
const MINE_SHAFT_PANEL_Y = 426;
const MINE_SHAFT_PANEL_HEIGHT = 182;
const MINE_SHAFT_PANEL_BUTTON_WIDTH = 116;
const MINE_SHAFT_PANEL_BUTTON_HEIGHT = 30;
const WORLD_BOTTOM_PADDING = 200;
const CAMERA_SCROLL_STEP = 0.72;
const SURFACE_SIDEBAR_HIDE_SCROLL_Y = 140;

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
  elevator: { x: 526, y: 72, label: "Elevator" }
} satisfies Record<"warehouse" | "elevator", { x: number; y: number; label: string }>;

const assetManifest = {
  "background-surface": backgroundSurfaceUrl,
  "background-underground": backgroundUndergroundUrl,
  "background-underground-depth-2": backgroundUndergroundDepth2Url,
  "background-underground-depth-3": backgroundUndergroundDepth3Url,
  "background-underground-depth-4": backgroundUndergroundDepth4Url,
  "background-underground-depth-5": backgroundUndergroundDepth5Url,
  "background-underground-depth-6": backgroundUndergroundDepth6Url,
  "stone-blockade": stoneBlockadeUrl,
  "elevator-tower": elevatorTowerUrl,
  "elevator-shaft-top": elevatorShaftTopUrl,
  "elevator-shaft-middle": elevatorShaftMiddleUrl,
  "elevator-shaft-bottom": elevatorShaftBottomUrl,
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

interface MiniUpgradeCardUi {
  objects: Phaser.GameObjects.GameObject[];
  titleText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  costText: Phaser.GameObjects.Text;
  buttonZone: Phaser.GameObjects.Zone;
  buttonBg: Phaser.GameObjects.Image;
  target: "warehouse" | "elevator";
  enabled: boolean;
}

interface UpgradeCardUi {
  frame: Phaser.GameObjects.Graphics;
  levelBadge: Phaser.GameObjects.Graphics;
  decorations: Phaser.GameObjects.Image[];
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

interface WorldClickTargetUi {
  zone: Phaser.GameObjects.Zone;
  outline: Phaser.GameObjects.Rectangle;
  chip: Phaser.GameObjects.Text;
}

interface MineShaftRowUi {
  shaftId: number;
  managerSlotX: number;
  managerSlotY: number;
  backWall: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  supports: Phaser.GameObjects.Image;
  pickupBox: Phaser.GameObjects.Image;
  coalDeposit: Phaser.GameObjects.Image;
  miner: Phaser.GameObjects.Image;
  storageText: Phaser.GameObjects.Text;
  routeText: Phaser.GameObjects.Text;

  // Upgrade Panel (Matching UpgradeCardUi)
  panelFrame: Phaser.GameObjects.Graphics;
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
  upgradeButtonImage: Phaser.GameObjects.Image;
  upgradeButtonText: Phaser.GameObjects.Text;
  upgradeButtonZone: Phaser.GameObjects.Zone;
  decorations: Phaser.GameObjects.Image[];

  // Manager Slot
  managerFrame: Phaser.GameObjects.Graphics;
  managerTitleText: Phaser.GameObjects.Text;
  managerEmptySlotImage: Phaser.GameObjects.Image;
  managerPortraitImage: Phaser.GameObjects.Image;
  managerRankText: Phaser.GameObjects.Text;
  managerStatusText: Phaser.GameObjects.Text;
  managerTimerText: Phaser.GameObjects.Text;
  managerAbilityImage: Phaser.GameObjects.Image;
  managerAbilityZone: Phaser.GameObjects.Zone;
  managerSlotZone: Phaser.GameObjects.Zone;

  // Click Target
  mineClickOutline: Phaser.GameObjects.Rectangle;
  mineClickChip: Phaser.GameObjects.Text;
  mineClickZone: Phaser.GameObjects.Zone;

  // Locked Placeholder
  lockedPlaceholderFrame: Phaser.GameObjects.Graphics;
  lockedTitleText: Phaser.GameObjects.Text;
  lockedHintText: Phaser.GameObjects.Text;
  unlockButtonImage: Phaser.GameObjects.Image;
  unlockButtonText: Phaser.GameObjects.Text;
  unlockButtonZone: Phaser.GameObjects.Zone;

  // State
  upgradeEnabled: boolean;
}

interface ShaftRouteFeedback {
  text: string;
  expiresAtSeconds: number;
}

interface DepthSectionUi {
  depthGroup: number;
  background: Phaser.GameObjects.Image;
}

interface DepthBlockadeUi {
  blockadeId: string;
  afterShaftId: number;
  unlocksShaftId: number;
  image: Phaser.GameObjects.Image;
  panel: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  hintText: Phaser.GameObjects.Text;
  buttonImage: Phaser.GameObjects.Image;
  buttonText: Phaser.GameObjects.Text;
  buttonZone: Phaser.GameObjects.Zone;
}

interface ElevatorAnimationStep {
  targetY: number;
  durationMs: number;
  holdMs?: number;
  loaded?: boolean;
}

export class MineScene extends Phaser.Scene {
  private readonly balance: BalanceConfig;
  private readonly viewModel: SimulationViewModel;
  private readonly totalMineShafts: number;
  private readonly worldHeight: number;

  private mineShaftRows: Record<number, MineShaftRowUi> = {};
  private depthSections: DepthSectionUi[] = [];
  private depthBlockades: DepthBlockadeUi[] = [];
  private elevatorShaftTop!: Phaser.GameObjects.Image;
  private elevatorShaftBottom!: Phaser.GameObjects.Image;
  private elevatorShaftMiddleSegments: Phaser.GameObjects.Image[] = [];
  private elevatorClickTarget!: WorldClickTargetUi;
  private elevatorCabin!: Phaser.GameObjects.Image;
  private warehouseWorker!: Phaser.GameObjects.Image;
  private warehousePile!: Phaser.GameObjects.Image;
  private warehouseFeedback!: Phaser.GameObjects.Text;
  private commandFeedback!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private productionTextsBoosted: Phaser.GameObjects.Text[] = [];
  private productionTextsBase: Phaser.GameObjects.Text[] = [];
  private buyModeButtons: BuyModeButtonUi[] = [];
  private buyModeBarPanel!: Phaser.GameObjects.Graphics;
  private buyModeBarLabel!: Phaser.GameObjects.Text;
  private upgradeCards!: Record<"warehouse" | "elevator", UpgradeCardUi>;
  private miniUpgradeCards: Record<"warehouse" | "elevator", MiniUpgradeCardUi> | null = null;
  private managerSlots!: Record<"warehouse" | "elevator", ManagerSlotUi>;
  private saveRepository?: SaveGameRepository;
  private activeManagerPanelArea: ManagerArea | null = null;
  private activeManagerPanelShaftId: number | null = null;
  private managerPanel: Phaser.GameObjects.Container | undefined;
  private managerPanelScrollY = 0;
  private latestState: GameState | undefined;
  private elevatorAnimationQueue: ElevatorAnimationStep[] = [];
  private activeElevatorAnimation:
    | {
        startY: number;
        targetY: number;
        durationMs: number;
        elapsedMs: number;
        holdMs: number;
        holdElapsedMs: number;
        loaded: boolean;
      }
    | undefined;
  private elevatorVisualLoaded = false;
  private shaftRouteFeedbackById: Record<number, ShaftRouteFeedback | undefined> = {};
  private lastManagerSlotRefreshSecond = -1;
  private lastManagerPanelRefreshSecond = -1;
  private uiInitialized = false;
  private activeBuyMode: UpgradeBuyMode = 1;
  private activeManagerAbilityTab: ManagerAbilityType | "all" = "all";

  constructor(balance: BalanceConfig, saveRepository?: SaveGameRepository) {
    super("MineScene");
    this.balance = balance;
    this.totalMineShafts = Math.max(1, balance.mineShaft.totalMineShafts);
    this.worldHeight = this.computeWorldHeight(this.totalMineShafts);
    this.saveRepository = saveRepository;
    this.viewModel = new SimulationViewModel(balance, { 
      saveRepository,
      isDebug: IS_DEBUG
    });
  }

  preload(): void {
    Object.entries(assetManifest).forEach(([key, url]) => {
      this.load.image(key, url);
    });
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);
    
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.handleVisibilityChange);
    }
    this.input.setTopOnly(true);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, this.worldHeight);

    this.createWorld();
    this.createSurfaceObjects();
    this.createElevator();
    this.createMineShaft();
    this.createDepthBlockades();
    this.createClickTargets();
    this.createUi();
    this.applyFrame(this.viewModel.getInitialFrame(), 0);
    this.advanceElevatorAnimation(0);

    if (this.viewModel.offlineProgressResult !== null && this.viewModel.offlineProgressResult.offlineSeconds >= 60) {
      this.showOfflineProgressModal(this.viewModel.offlineProgressResult);
    }
  }

  update(time: number, delta: number): void {
    const frame = this.viewModel.update(delta / 1000);
    this.applyFrame(frame, time);
    this.advanceElevatorAnimation(delta);
  }

  private showOfflineProgressModal(result: import("../core/index.ts").OfflineProgressResult): void {
    const overlay = this.pinUi(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
        .setDepth(900)
        .setInteractive()
    );

    const panelWidth = 500;
    const panelHeight = 300;
    const panelX = GAME_WIDTH / 2 - panelWidth / 2;
    const panelY = GAME_HEIGHT / 2 - panelHeight / 2;

    const panel = this.pinUi(this.add.graphics().setDepth(901));
    panel.fillStyle(0x17212a, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
    panel.lineStyle(2, 0xf1c96b, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

    const titleText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 40, "Offline Progress", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f6e8bb",
    }).setOrigin(0.5).setDepth(902));

    const formatTime = (seconds: number) => {
      const d = Math.floor(seconds / (3600 * 24));
      const h = Math.floor(seconds % (3600 * 24) / 3600);
      const m = Math.floor(seconds % 3600 / 60);
      return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
    };

    const timeText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 100, `Offline time: ${formatTime(result.offlineSeconds)}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      color: "#dcecf1",
    }).setOrigin(0.5).setDepth(902));

    const coinIcon = this.pinUi(
      this.add.image(GAME_WIDTH / 2 - 80, panelY + 150, "coin-icon").setDisplaySize(24, 24).setDepth(902)
    );
    const moneyText = this.pinUi(this.add.text(GAME_WIDTH / 2 - 50, panelY + 150, `+${formatCurrency(result.moneyEarned)}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#4ee669",
    }).setOrigin(0, 0.5).setDepth(902));

    const oreIcon = this.pinUi(
      this.add.image(GAME_WIDTH / 2 - 80, panelY + 190, "ore-icon").setDisplaySize(24, 24).setDepth(902)
    );
    const oreText = this.pinUi(this.add.text(GAME_WIDTH / 2 - 50, panelY + 190, `${formatLargeNumber(result.oreSold)} ore sold`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      color: "#e6c94e",
    }).setOrigin(0, 0.5).setDepth(902));

    const buttonWidth = 160;
    const buttonHeight = 40;
    const buttonX = GAME_WIDTH / 2;
    const buttonY = panelY + panelHeight - 40;

    const buttonBg = this.pinUi(this.add.graphics().setDepth(901));
    buttonBg.fillStyle(0x386641, 1);
    buttonBg.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 8);

    const buttonText = this.pinUi(this.add.text(buttonX, buttonY, "Continue", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(902));

    const buttonZone = this.pinUi(
      this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
        .setInteractive({ useHandCursor: true })
        .setDepth(903)
    );

    const objects = [overlay, panel, titleText, timeText, coinIcon, moneyText, oreIcon, oreText, buttonBg, buttonText, buttonZone];

    buttonZone.once("pointerdown", () => {
      objects.forEach(obj => obj.destroy());
    });
  }

  private handleShutdown(): void {
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
    this.viewModel.dispose();
  }

  private handleVisibilityChange = (): void => {
    if (typeof document === "undefined") return;

    if (document.hidden) {
      // Game saved automatically by SaveGameController on hidden
    } else {
      // We became visible again, calculate offline progress
      const result = this.viewModel.processOfflineProgress();
      if (result !== null && result.offlineSeconds >= 60) {
        this.showOfflineProgressModal(result);
      }
    }
  };

  private createWorld(): void {
    this.add.image(GAME_WIDTH / 2, SURFACE_HEIGHT / 2, "background-surface").setDisplaySize(GAME_WIDTH, SURFACE_HEIGHT);
    this.depthSections = [];

    const totalDepthGroups = this.getTotalDepthGroups();

    for (let depthGroup = 1; depthGroup <= totalDepthGroups; depthGroup += 1) {
      const topY = this.getDepthGroupTopY(depthGroup);
      const bottomY = this.getDepthGroupBottomY(depthGroup);
      const height = Math.max(1, bottomY - topY);
      const background = this.add
        .image(GAME_WIDTH / 2, topY + height / 2, getDepthBackgroundKey(depthGroup))
        .setDisplaySize(DEPTH_SECTION_WIDTH, height)
        .setVisible(depthGroup === 1);

      this.depthSections.push({
        depthGroup,
        background
      });
    }

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
    const initialAccessibleShaftId = this.getDepthGroupEndShaft(1);
    this.elevatorShaftTop = this.add
      .image(ELEVATOR_X, this.getElevatorShaftTopY(initialAccessibleShaftId), "elevator-shaft-top")
      .setDisplaySize(ELEVATOR_SHAFT_WIDTH, ELEVATOR_SHAFT_TOP_HEIGHT);
    this.elevatorShaftBottom = this.add
      .image(ELEVATOR_X, this.getElevatorShaftBottomY(initialAccessibleShaftId), "elevator-shaft-bottom")
      .setDisplaySize(ELEVATOR_SHAFT_WIDTH, ELEVATOR_SHAFT_BOTTOM_HEIGHT);

    for (let middleIndex = 0; middleIndex < this.getElevatorMiddleSegmentCount(this.totalMineShafts); middleIndex += 1) {
      this.elevatorShaftMiddleSegments.push(
        this.add
          .image(ELEVATOR_X, this.getElevatorShaftMiddleY(initialAccessibleShaftId, middleIndex), "elevator-shaft-middle")
          .setDisplaySize(ELEVATOR_SHAFT_WIDTH, this.getElevatorShaftMiddleSegmentHeight(initialAccessibleShaftId))
          .setVisible(false)
      );
    }

    this.add.image(ELEVATOR_X, 132, "elevator-tower").setDisplaySize(228, 174);
    this.elevatorCabin = this.add.image(ELEVATOR_X, ELEVATOR_TOP_Y, "elevator-cabin-empty").setDisplaySize(102, 102);
  }

  private createMineShaft(): void {
    for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
      this.mineShaftRows[shaftId] = this.createMineShaftRow(shaftId);
    }
  }

  private createDepthBlockades(): void {
    this.depthBlockades = [];

    for (const blockade of Object.values(this.viewModel.getInitialFrame().state.blockades)) {
      const centerY = this.getBlockadeY(blockade.afterShaftId);
      const image = this.add
        .image(DEPTH_BLOCKADE_CENTER_X, centerY, "stone-blockade")
        .setDisplaySize(DEPTH_BLOCKADE_IMAGE_WIDTH, DEPTH_BLOCKADE_IMAGE_HEIGHT)
        .setVisible(false);
      const panel = this.add.graphics().setDepth(UI_PANEL_DEPTH + 1).setVisible(false);
      const titleText = this.add
        .text(DEPTH_BLOCKADE_CENTER_X, centerY - 40, "Blockade", feedbackTextStyle(14, "#f8e4b4"))
        .setOrigin(0.5)
        .setDepth(UI_TEXT_DEPTH + 1)
        .setVisible(false);
      const hintText = this.add
        .text(DEPTH_BLOCKADE_CENTER_X, centerY - 14, "", smallUiTextStyle(12, "#f7f1dd"))
        .setOrigin(0.5)
        .setDepth(UI_TEXT_DEPTH + 1)
        .setVisible(false);
      const buttonImage = this.add
        .image(DEPTH_BLOCKADE_CENTER_X, centerY + 24, "button-panel")
        .setDisplaySize(DEPTH_BLOCKADE_BUTTON_WIDTH, DEPTH_BLOCKADE_BUTTON_HEIGHT)
        .setDepth(UI_PANEL_DEPTH + 2)
        .setVisible(false);
      const buttonText = this.add
        .text(DEPTH_BLOCKADE_CENTER_X, centerY + 23, "", smallUiTextStyle(13, "#fff8de"))
        .setOrigin(0.5)
        .setDepth(UI_TEXT_DEPTH + 2)
        .setVisible(false);
      const buttonZone = this.add
        .zone(DEPTH_BLOCKADE_CENTER_X, centerY + 24, DEPTH_BLOCKADE_BUTTON_WIDTH, DEPTH_BLOCKADE_BUTTON_HEIGHT)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(UI_INTERACTIVE_DEPTH + 1)
        .setVisible(false);

      buttonZone.on("pointerdown", () => {
        this.applyFrame(this.viewModel.removeDepthBlockade(blockade.blockadeId), this.time.now);
      });

      this.depthBlockades.push({
        blockadeId: blockade.blockadeId,
        afterShaftId: blockade.afterShaftId,
        unlocksShaftId: blockade.unlocksShaftId,
        image,
        panel,
        titleText,
        hintText,
        buttonImage,
        buttonText,
        buttonZone
      });
    }
  }

  private createUi(): void {
    this.createTopBar();
    this.createBuyModeBar();
    this.createUpgradeCards();
    this.createStatusBar();
    this.createManagerSlots();
    this.setupInputScroll();
  }

  private setupInputScroll(): void {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      const pointer = this.input.activePointer;

      if (this.activeManagerPanelArea !== null && this.managerPanel !== undefined) {
        if (
          pointer.x >= MANAGER_PANEL_X &&
          pointer.x <= MANAGER_PANEL_X + MANAGER_PANEL_WIDTH &&
          pointer.y >= MANAGER_PANEL_Y &&
          pointer.y <= MANAGER_PANEL_Y + MANAGER_PANEL_HEIGHT
        ) {
          this.scrollManagerPanel(deltaY);
        }
        return;
      }

      const state = this.latestState;
      const maxScroll = state === undefined ? 0 : this.getMaxCameraScroll(state);
      if (maxScroll <= 0) {
        return;
      }

      const camera = this.cameras.main;
      camera.scrollY = Phaser.Math.Clamp(camera.scrollY + deltaY * CAMERA_SCROLL_STEP, 0, maxScroll);
    });
  }

  private scrollManagerPanel(deltaY: number): void {
    if (!this.managerPanel) {
      return;
    }

    const contentContainer = this.managerPanel.list.find(
      (child) => child instanceof Phaser.GameObjects.Container && child !== this.managerPanel
    ) as Phaser.GameObjects.Container | undefined;

    if (!contentContainer) {
      return;
    }

    const contentAreaHeight = (contentContainer as any).contentAreaHeight ?? (MANAGER_PANEL_HEIGHT - 72);
    const contentAreaY = (contentContainer as any).contentAreaY ?? (MANAGER_PANEL_Y + 66);
    const totalContentHeight = (contentContainer as { totalContentHeight?: number }).totalContentHeight ?? 0;
    const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);

    if (maxScroll <= 0) {
      return;
    }

    this.managerPanelScrollY = Phaser.Math.Clamp(this.managerPanelScrollY - deltaY, -maxScroll, 0);
    contentContainer.setY(this.managerPanelScrollY);

    const scrollbar = this.managerPanel.list.find(
      (child) => child instanceof Phaser.GameObjects.Graphics && (child as { isScrollbar?: boolean }).isScrollbar
    ) as Phaser.GameObjects.Graphics | undefined;

    if (!scrollbar) {
      return;
    }

    const scrollPercent = -this.managerPanelScrollY / maxScroll;
    const scrollbarHeight = (scrollbar as { scrollbarHeight?: number }).scrollbarHeight ?? 0;
    scrollbar.setY(contentAreaY + 5 + scrollPercent * (contentAreaHeight - scrollbarHeight - 10));
  }

  private computeWorldHeight(totalMineShafts: number): number {
    const lastShaftFloorBottom = this.getShaftY(MINE_SHAFT_FLOOR_Y + MINE_SHAFT_FLOOR_HEIGHT / 2, totalMineShafts);
    const lastPanelBottom = this.getMineShaftPanelTop(totalMineShafts) + MINE_SHAFT_PANEL_HEIGHT;
    const lastDepthBottom = this.getDepthGroupBottomY(this.getTotalDepthGroups());
    return Math.max(GAME_HEIGHT, Math.ceil(Math.max(lastShaftFloorBottom, lastPanelBottom, lastDepthBottom) + WORLD_BOTTOM_PADDING));
  }

  private getShaftOffset(shaftId: number): number {
    const zeroBasedIndex = Math.max(0, shaftId - 1);
    const completedDepthGroups = Math.floor(zeroBasedIndex / SHAFTS_PER_DEPTH_GROUP);
    return zeroBasedIndex * MINE_SHAFT_VERTICAL_SPACING + completedDepthGroups * DEPTH_GROUP_VERTICAL_GAP;
  }

  private getTotalDepthGroups(): number {
    return Math.max(1, Math.ceil(this.totalMineShafts / SHAFTS_PER_DEPTH_GROUP));
  }

  private getDepthGroupStartShaft(depthGroup: number): number {
    return (depthGroup - 1) * SHAFTS_PER_DEPTH_GROUP + 1;
  }

  private getDepthGroupEndShaft(depthGroup: number): number {
    return Math.min(this.totalMineShafts, depthGroup * SHAFTS_PER_DEPTH_GROUP);
  }

  private getShaftY(baseY: number, shaftId: number): number {
    return baseY + this.getShaftOffset(shaftId);
  }

  private getMineShaftPanelTop(shaftId: number): number {
    return this.getShaftY(MINE_SHAFT_PANEL_Y, shaftId);
  }

  private getElevatorStopY(shaftId: number): number {
    return this.getShaftY(ELEVATOR_BOTTOM_Y, shaftId);
  }

  private getDepthGroupTopY(depthGroup: number): number {
    if (depthGroup <= 1) {
      return SURFACE_HEIGHT;
    }

    return this.getBlockadeY(this.getDepthGroupStartShaft(depthGroup) - 1);
  }

  private getDepthGroupBottomY(depthGroup: number): number {
    if (depthGroup >= this.getTotalDepthGroups()) {
      return this.getShaftY(MINE_SHAFT_FLOOR_Y + MINE_SHAFT_FLOOR_HEIGHT / 2 + 56, this.getDepthGroupEndShaft(depthGroup));
    }

    return this.getBlockadeY(this.getDepthGroupEndShaft(depthGroup));
  }

  private getBlockadeY(afterShaftId: number): number {
    const nextShaftId = Math.min(this.totalMineShafts, afterShaftId + 1);
    const currentY = this.getShaftY(MINE_SHAFT_BACK_WALL_Y, afterShaftId);
    const nextY = this.getShaftY(MINE_SHAFT_BACK_WALL_Y, nextShaftId);
    return (currentY + nextY) / 2;
  }

  private getVisibleDepthGroupCount(state: GameState): number {
    const deepestUnlockedShaftId = getDeepestUnlockedShaftId(state, this.totalMineShafts);
    const deepestUnlockedDepthGroup = Math.floor((deepestUnlockedShaftId - 1) / SHAFTS_PER_DEPTH_GROUP) + 1;
    const lastUnlockedShaftInDepthGroup = deepestUnlockedDepthGroup * SHAFTS_PER_DEPTH_GROUP;
    const shouldRevealNextDepthGroup =
      deepestUnlockedShaftId === lastUnlockedShaftInDepthGroup && deepestUnlockedShaftId < this.totalMineShafts;

    return Math.min(this.getTotalDepthGroups(), deepestUnlockedDepthGroup + (shouldRevealNextDepthGroup ? 1 : 0));
  }

  private isDepthGroupVisible(state: GameState, depthGroup: number): boolean {
    return depthGroup <= this.getVisibleDepthGroupCount(state);
  }

  private isDepthGroupReachable(state: GameState, depthGroup: number): boolean {
    if (depthGroup <= 1) {
      return true;
    }

    const requiredBlockade = Object.values(state.blockades).find(
      (blockade) => blockade.afterShaftId === this.getDepthGroupStartShaft(depthGroup) - 1
    );

    return requiredBlockade?.isRemoved ?? true;
  }

  private getDeepestReachableVisibleShaftId(state: GameState): number {
    let deepestReachableVisibleDepthGroup = 1;

    for (let depthGroup = 1; depthGroup <= this.getVisibleDepthGroupCount(state); depthGroup += 1) {
      if (!this.isDepthGroupReachable(state, depthGroup)) {
        break;
      }

      deepestReachableVisibleDepthGroup = depthGroup;
    }

    return this.getDepthGroupEndShaft(deepestReachableVisibleDepthGroup);
  }

  private getVisibleWorldHeight(state: GameState): number {
    const visibleDepthGroupCount = this.getVisibleDepthGroupCount(state);
    const visibleBottomY = this.getDepthGroupBottomY(visibleDepthGroupCount);
    return Math.max(GAME_HEIGHT, Math.ceil(visibleBottomY));
  }

  private getNextVisibleLockedShaftId(state: GameState): number | null {
    for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
      const shaft = state.entities.mineShafts[shaftId];
      if (shaft === undefined || shaft.isUnlocked) {
        continue;
      }

      const previousUnlocked = shaftId === 1 || state.entities.mineShafts[shaftId - 1]?.isUnlocked === true;
      if (!previousUnlocked) {
        return null;
      }

      if (!shaft.isReachable || !this.isDepthGroupVisible(state, shaft.depthGroup)) {
        return null;
      }

      return shaftId;
    }

    return null;
  }

  private getMaxCameraScroll(state: GameState): number {
    return Math.max(0, this.getVisibleWorldHeight(state) - GAME_HEIGHT);
  }

  private clampCameraScroll(state: GameState): void {
    const visibleWorldHeight = this.getVisibleWorldHeight(state);
    const maxScroll = this.getMaxCameraScroll(state);
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, visibleWorldHeight);
    this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, 0, maxScroll);
  }

  private getElevatorMiddleSegmentCount(deepestAccessibleShaftId: number): number {
    return Math.max(1, Math.ceil(this.getElevatorShaftMiddleHeight(deepestAccessibleShaftId) / ELEVATOR_SHAFT_MIDDLE_HEIGHT));
  }

  private getElevatorShaftMiddleHeight(deepestAccessibleShaftId: number): number {
    const middleTopY = this.getElevatorShaftTopEdgeY(deepestAccessibleShaftId) + ELEVATOR_SHAFT_TOP_HEIGHT;
    const middleBottomY = this.getElevatorShaftBottomY(deepestAccessibleShaftId) - ELEVATOR_SHAFT_BOTTOM_HEIGHT / 2;
    return Math.max(ELEVATOR_SHAFT_MIDDLE_HEIGHT, middleBottomY - middleTopY);
  }

  private getElevatorShaftMiddleSegmentHeight(deepestAccessibleShaftId: number): number {
    return this.getElevatorShaftMiddleHeight(deepestAccessibleShaftId) / this.getElevatorMiddleSegmentCount(deepestAccessibleShaftId);
  }

  private getElevatorShaftHeight(deepestAccessibleShaftId: number): number {
    return (
      ELEVATOR_SHAFT_TOP_HEIGHT +
      this.getElevatorShaftMiddleHeight(deepestAccessibleShaftId) +
      ELEVATOR_SHAFT_BOTTOM_HEIGHT
    );
  }

  private getElevatorShaftCenterY(deepestAccessibleShaftId: number): number {
    return this.getElevatorShaftTopEdgeY(deepestAccessibleShaftId) + this.getElevatorShaftHeight(deepestAccessibleShaftId) / 2;
  }

  private getElevatorShaftTopEdgeY(_deepestAccessibleShaftId: number): number {
    return ELEVATOR_SHAFT_SURFACE_TOP_CENTER_Y - ELEVATOR_SHAFT_TOP_HEIGHT / 2;
  }

  private getElevatorShaftTopY(_deepestAccessibleShaftId: number): number {
    return ELEVATOR_SHAFT_SURFACE_TOP_CENTER_Y;
  }

  private getElevatorShaftMiddleY(deepestAccessibleShaftId: number, middleIndex: number): number {
    return (
      this.getElevatorShaftTopEdgeY(deepestAccessibleShaftId) +
      ELEVATOR_SHAFT_TOP_HEIGHT +
      this.getElevatorShaftMiddleSegmentHeight(deepestAccessibleShaftId) / 2 +
      middleIndex * this.getElevatorShaftMiddleSegmentHeight(deepestAccessibleShaftId)
    );
  }

  private getElevatorShaftBottomY(deepestAccessibleShaftId: number): number {
    return this.getElevatorStopY(deepestAccessibleShaftId) - ELEVATOR_SHAFT_BOTTOM_CENTER_OFFSET;
  }

  private createMineShaftRow(shaftId: number): MineShaftRowUi {
    const backWallY = this.getShaftY(MINE_SHAFT_BACK_WALL_Y, shaftId);
    const floorY = this.getShaftY(MINE_SHAFT_FLOOR_Y, shaftId);
    const supportsY = this.getShaftY(MINE_SHAFT_SUPPORTS_Y, shaftId);
    const pickupY = this.getShaftY(MINE_PICKUP_BOX_Y, shaftId);
    const workerY = this.getShaftY(MINE_WORKER_Y, shaftId);
    const depositY = this.getShaftY(COAL_DEPOSIT_Y, shaftId);
    const storageTextY = this.getShaftY(MINE_SHAFT_STORAGE_TEXT_Y, shaftId);
    const routeTextY = this.getElevatorStopY(shaftId) - 66;
    const panelTop = this.getMineShaftPanelTop(shaftId);
    const panelLeft = UPGRADE_COLUMN_X;
    const placeholderTop = backWallY - LOCKED_SHAFT_PLACEHOLDER_HEIGHT / 2;
    const managerSlotX = MINE_MANAGER_SLOT_X;
    const managerSlotY = backWallY - 58;
    const mineClickTop = backWallY - 84;

    const backWall = this.add
      .image(MINE_SHAFT_CENTER_X, backWallY + MINE_SHAFT_BACK_WALL_VISUAL_OFFSET_Y, "mine-shaft-back-wall")
      .setDisplaySize(MINE_SHAFT_BACK_WALL_WIDTH, MINE_SHAFT_BACK_WALL_HEIGHT);
    const floor = this.add
      .image(MINE_SHAFT_CENTER_X, floorY, "mine-shaft-floor")
      .setDisplaySize(MINE_SHAFT_FLOOR_WIDTH, MINE_SHAFT_FLOOR_HEIGHT);
    const supports = this.add
      .image(MINE_SHAFT_CENTER_X, supportsY, "mine-shaft-supports")
      .setDisplaySize(MINE_SHAFT_SUPPORTS_WIDTH, MINE_SHAFT_SUPPORTS_HEIGHT);
    const pickupBox = this.add
      .image(MINE_PICKUP_BOX_X, pickupY, "mine-pickup-empty")
      .setDisplaySize(MINE_PICKUP_BOX_WIDTH, MINE_PICKUP_BOX_HEIGHT);
    const coalDeposit = this.add
      .image(COAL_DEPOSIT_X, depositY, "coal-deposit")
      .setDisplaySize(COAL_DEPOSIT_WIDTH, COAL_DEPOSIT_HEIGHT);
    const miner = this.add
      .image(MINE_WORKER_MINE_X, workerY, "miner-idle")
      .setOrigin(0.5, 1)
      .setDisplaySize(MINE_WORKER_SIZE, MINE_WORKER_SIZE);
    const storageText = this.add
      .text(MINE_SHAFT_STORAGE_TEXT_X, storageTextY, "", smallUiTextStyle(12, "#f7f1dd"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const routeText = this.add
      .text(ELEVATOR_X + 92, routeTextY, "", feedbackTextStyle(12, "#f6e8bb"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH)
      .setVisible(false);

    // Redesigned Upgrade Panel
    const panelFrame = this.add.graphics().setDepth(UI_PANEL_DEPTH - 2);
    const decorations: Phaser.GameObjects.Image[] = [];
    const titleText = this.add.text(panelLeft + 16, panelTop + 12, `Shaft ${shaftId}`, cardTitleTextStyle()).setDepth(UI_TEXT_DEPTH);
    const levelBadge = this.drawLevelBadge(panelLeft + UPGRADE_CARD_WIDTH - 74, panelTop + 10, 58, 24);
    const levelText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH - 45, panelTop + 21, "", smallUiTextStyle(12, "#f6e8bb"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);

    const mainLabelText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH / 2, panelTop + 42, "Production", smallUiTextStyle(11, "#6e5531"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const mainCurrentText = this.add
      .text(panelLeft + 88, panelTop + 62, "", metricValueTextStyle(18, "#683d11"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    decorations.push(
      this.add
        .image(panelLeft + UPGRADE_CARD_WIDTH / 2, panelTop + 65, "upgrade-arrow-icon")
        .setDisplaySize(18, 18)
        .setDepth(UI_TEXT_DEPTH)
    );
    const mainNextText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH - 88, panelTop + 62, "", metricValueTextStyle(18, "#234f66"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);

    const secondaryLabelText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH / 2, panelTop + 84, "Storage", smallUiTextStyle(11, "#6e5531"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const secondaryCurrentText = this.add
      .text(panelLeft + 88, panelTop + 102, "", metricValueTextStyle(14, "#6b4519"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    decorations.push(
      this.add
        .image(panelLeft + UPGRADE_CARD_WIDTH / 2, panelTop + 104, "upgrade-arrow-icon")
        .setDisplaySize(18, 18)
        .setDepth(UI_TEXT_DEPTH)
    );
    const secondaryNextText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH - 88, panelTop + 102, "", metricValueTextStyle(14, "#2f5962"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);

    decorations.push(
      this.add
        .image(panelLeft + 18, panelTop + 123, "coin-icon")
        .setDisplaySize(32, 32)
        .setDepth(UI_TEXT_DEPTH)
    );
    const costText = this.add.text(panelLeft + 29, panelTop + 116, "", smallUiTextStyle(13, "#5a3411")).setDepth(UI_TEXT_DEPTH);
    const buyCountText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH / 2 + UPGRADE_BUTTON_WIDTH / 2 + 12, panelTop + 116, "", smallUiTextStyle(11, "#7b4e1d"))
      .setOrigin(0, 0)
      .setDepth(UI_TEXT_DEPTH);

    const buttonCenterY = panelTop + UPGRADE_CARD_HEIGHT - 18;
    const upgradeButtonImage = this.add
      .image(panelLeft + UPGRADE_CARD_WIDTH / 2, buttonCenterY, "button-panel")
      .setDisplaySize(UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
      .setDepth(UI_PANEL_DEPTH + 1);
    const upgradeButtonText = this.add
      .text(panelLeft + UPGRADE_CARD_WIDTH / 2, buttonCenterY - 1, "Upgrade", smallUiTextStyle(13, "#fff8de"))
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH);
    const upgradeButtonZone = this.add
      .zone(panelLeft + UPGRADE_CARD_WIDTH / 2, buttonCenterY, UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_INTERACTIVE_DEPTH);

    // Manager Slot
    const managerFrame = this.add.graphics().setDepth(MANAGER_SLOT_DEPTH);
    const managerTitleText = this.add
      .text(managerSlotX + 12, managerSlotY + 10, `Shaft ${shaftId} Slot`, smallUiTextStyle(12, "#f9e9bb"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const managerEmptySlotImage = this.add
      .image(managerSlotX + 38, managerSlotY + 58, getManagerEmptySlotKey("mineShaft"))
      .setDisplaySize(MANAGER_SLOT_IMAGE_SIZE, MANAGER_SLOT_IMAGE_SIZE)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const managerPortraitImage = this.add
      .image(managerSlotX + 38, managerSlotY + 60, getManagerPortraitKey("mineShaft", "junior"))
      .setDisplaySize(MANAGER_SLOT_PORTRAIT_SIZE, MANAGER_SLOT_PORTRAIT_SIZE)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH)
      .setVisible(false)
      .setAlpha(0);
    const managerRankText = this.add
      .text(managerSlotX + 76, managerSlotY + 38, "", smallUiTextStyle(11, "#f7f1dd"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const managerStatusText = this.add
      .text(managerSlotX + 76, managerSlotY + 60, "", smallUiTextStyle(11, "#bdd2d8"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const managerTimerText = this.add
      .text(managerSlotX + 76, managerSlotY + 82, "", smallUiTextStyle(11, "#dcecf1"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const managerAbilityImage = this.add
      .image(managerSlotX + 172, managerSlotY + 60, "ability-mining-speed")
      .setDisplaySize(64, 64)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH)
      .setVisible(false)
      .setAlpha(0);
    const managerAbilityZone = this.add
      .zone(managerSlotX + 172, managerSlotY + 60, 64, 64)
      .setOrigin(0.5)
      .setDepth(MANAGER_SLOT_INTERACTIVE_DEPTH + 1)
      .setVisible(false);
    const managerSlotZone = this.add
      .zone(managerSlotX, managerSlotY, MANAGER_SLOT_WIDTH, MANAGER_SLOT_HEIGHT)
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(MANAGER_SLOT_INTERACTIVE_DEPTH);

    const mineClickTarget = this.createClickTarget(
      MINE_CLICK_TARGET_X,
      mineClickTop,
      MINE_CLICK_TARGET_WIDTH,
      MINE_CLICK_TARGET_HEIGHT,
      `Shaft ${shaftId}`,
      () => {
        this.applyFrame(this.viewModel.manualMineAction(shaftId), this.time.now);
      }
    );
    const mineClickOutline = mineClickTarget.outline;
    const mineClickChip = mineClickTarget.chip;
    const mineClickZone = mineClickTarget.zone;

    // Locked Placeholder
    const lockedPlaceholderFrame = this.add.graphics().setDepth(UI_PANEL_DEPTH - 2);
    const lockedTitleText = this.add
      .text(LOCKED_SHAFT_PLACEHOLDER_X + 26, placeholderTop + 20, `Shaft ${shaftId}`, cardTitleTextStyle())
      .setDepth(UI_TEXT_DEPTH - 1);
    const lockedHintText = this.add
      .text(LOCKED_SHAFT_PLACEHOLDER_X + 26, placeholderTop + 54, "", smallUiTextStyle(13, "#dcecf1"))
      .setDepth(UI_TEXT_DEPTH - 1);
    const unlockButtonImage = this.add
      .image(
        LOCKED_SHAFT_PLACEHOLDER_X + LOCKED_SHAFT_PLACEHOLDER_WIDTH - 118,
        placeholderTop + LOCKED_SHAFT_PLACEHOLDER_HEIGHT / 2,
        "button-panel"
      )
      .setDisplaySize(LOCKED_SHAFT_BUTTON_WIDTH, LOCKED_SHAFT_BUTTON_HEIGHT)
      .setDepth(UI_PANEL_DEPTH - 1);
    const unlockButtonText = this.add
      .text(
        LOCKED_SHAFT_PLACEHOLDER_X + LOCKED_SHAFT_PLACEHOLDER_WIDTH - 118,
        placeholderTop + LOCKED_SHAFT_PLACEHOLDER_HEIGHT / 2 - 1,
        "",
        smallUiTextStyle(13, "#fff8de")
      )
      .setOrigin(0.5)
      .setDepth(UI_TEXT_DEPTH - 1);
    const unlockButtonZone = this.add
      .zone(
        LOCKED_SHAFT_PLACEHOLDER_X + LOCKED_SHAFT_PLACEHOLDER_WIDTH - 118,
        placeholderTop + LOCKED_SHAFT_PLACEHOLDER_HEIGHT / 2,
        LOCKED_SHAFT_BUTTON_WIDTH,
        LOCKED_SHAFT_BUTTON_HEIGHT
      )
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(UI_INTERACTIVE_DEPTH - 1);

    managerSlotZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      const state = this.latestState;
      if (state === undefined) {
        return;
      }

      this.openManagerPanel("mineShaft", state, shaftId);
    });

    managerAbilityZone.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.activateAssignedManagerAbility("mineShaft", shaftId);
      }
    );

    upgradeButtonZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.applyFrame(this.viewModel.upgradeMineShaft(shaftId), this.time.now);
    });

    unlockButtonZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.applyFrame(this.viewModel.unlockMineShaft(shaftId), this.time.now);
    });

    return {
      shaftId,
      managerSlotX,
      managerSlotY,
      backWall,
      floor,
      supports,
      pickupBox,
      coalDeposit,
      miner,
      storageText,
      routeText,
      panelFrame,
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
      upgradeButtonImage,
      upgradeButtonText,
      upgradeButtonZone,
      decorations,
      managerFrame,
      managerTitleText,
      managerEmptySlotImage,
      managerPortraitImage,
      managerRankText,
      managerStatusText,
      managerTimerText,
      managerAbilityImage,
      managerAbilityZone,
      managerSlotZone,
      mineClickOutline,
      mineClickChip,
      mineClickZone,
      lockedPlaceholderFrame,
      lockedTitleText,
      lockedHintText,
      unlockButtonImage,
      unlockButtonText,
      unlockButtonZone,
      upgradeEnabled: true
    };
  }

  private createTopBar(): void {
    this.createBarPanel(MONEY_PANEL_X, MONEY_PANEL_Y, MONEY_PANEL_WIDTH, MONEY_PANEL_HEIGHT);
    this.pinUi(
      this.add.image(MONEY_PANEL_X + 22, MONEY_PANEL_Y + MONEY_PANEL_HEIGHT / 2, "coin-icon").setDisplaySize(42, 42).setDepth(PINNED_UI_TEXT_DEPTH)
    );
    this.moneyText = this.pinUi(
      this.add
        .text(MONEY_PANEL_X + 42, MONEY_PANEL_Y + MONEY_PANEL_HEIGHT / 2, "", topBarTextStyle(20, "#4b2709"))
        .setOrigin(0, 0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );

    this.createBarPanel(FLOW_PANEL_X, FLOW_PANEL_Y, FLOW_PANEL_WIDTH, FLOW_PANEL_HEIGHT);
    this.pinUi(
      this.add.image(FLOW_PANEL_X + 24, FLOW_PANEL_Y + FLOW_PANEL_HEIGHT / 2, "ore-icon").setDisplaySize(40, 40).setDepth(PINNED_UI_TEXT_DEPTH)
    );
    this.productionTextsBoosted = [];
    this.productionTextsBase = [];

    const textStartX = FLOW_PANEL_X + 56;
    const partWidth = (FLOW_PANEL_WIDTH - 66) / 3;

    for (let i = 0; i < 3; i++) {
      const x = textStartX + i * partWidth;
      const boostedText = this.pinUi(
        this.add
          .text(x, FLOW_PANEL_Y + FLOW_PANEL_HEIGHT / 2, "", topBarTextStyle(12, "#4b2709"))
          .setOrigin(0, 0.5)
          .setDepth(PINNED_UI_TEXT_DEPTH)
      );
      this.productionTextsBoosted.push(boostedText);

      const baseText = this.pinUi(
        this.add
          .text(x, FLOW_PANEL_Y + 28, "", topBarTextStyle(10, "#4a90e2"))
          .setOrigin(0, 0.5)
          .setDepth(PINNED_UI_TEXT_DEPTH)
          .setVisible(false)
      );
      this.productionTextsBase.push(baseText);
    }

    if (IS_DEBUG) {
      this.createResetButton();
    }
    
    this.createMiniUpgradeCards();
  }

  private createResetButton(): void {
    const width = 80;
    const height = 40;
    const x = 20;
    const y = GAME_HEIGHT - height - 20;

    const bg = this.pinUi(this.add.graphics().setDepth(PINNED_UI_PANEL_DEPTH));
    bg.fillStyle(0xcc0000, 0.9);
    bg.fillRoundedRect(x, y, width, height, 10);
    bg.lineStyle(2, 0xffffff, 0.5);
    bg.strokeRoundedRect(x, y, width, height, 10);

    const text = this.pinUi(this.add.text(x + width / 2, y + height / 2, "RESET", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(PINNED_UI_TEXT_DEPTH));

    const zone = this.pinUi(
      this.add.zone(x + width / 2, y + height / 2, width, height)
        .setInteractive({ useHandCursor: true })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );

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
    this.pinUi(this.drawRoundedPanel(x, y, width, height, {
      fill: 0xf4cb7d,
      fillAlpha: 0.96,
      innerFill: 0xffdf9a,
      innerAlpha: 0.52,
      line: 0x613212,
      radius: 16
    }).setDepth(PINNED_UI_PANEL_DEPTH));
  }

  private createBuyModeBar(): void {
    this.buyModeBarPanel = this.pinUi(this.drawRoundedPanel(UPGRADE_COLUMN_X, BUY_MODE_BAR_Y, UPGRADE_COLUMN_WIDTH, BUY_MODE_BAR_HEIGHT, {
      fill: 0x213b46,
      fillAlpha: 0.9,
      innerFill: 0x5c7c87,
      innerAlpha: 0.16,
      line: 0xf1c96b,
      radius: 16
    }).setDepth(PINNED_UI_PANEL_DEPTH));

    this.buyModeBarLabel = this.pinUi(
      this.add
        .text(UPGRADE_COLUMN_X + 14, BUY_MODE_BUTTON_LABEL_Y, "Buy", smallUiTextStyle(12, "#f6e9ba"))
        .setOrigin(0, 0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );

    const buttonConfigs: Array<{ mode: UpgradeBuyMode; label: string; width: number }> = [
      { mode: 1, label: "1x", width: BUY_MODE_BUTTON_WIDTH },
      { mode: 10, label: "10x", width: BUY_MODE_BUTTON_WIDTH },
      { mode: 100, label: "100x", width: BUY_MODE_BUTTON_WIDTH },
      { mode: "max", label: "Max", width: BUY_MODE_BUTTON_WIDTH }
    ];

    let cursorX = BUY_MODE_BUTTON_START_X;

    for (const config of buttonConfigs) {
      const centerX = cursorX + config.width / 2;
      const background = this.pinUi(
        this.add
          .image(centerX, BUY_MODE_BUTTON_Y, "button-panel")
          .setDisplaySize(config.width, BUY_MODE_BUTTON_HEIGHT)
          .setDepth(PINNED_UI_PANEL_DEPTH + 1)
      );
      const label = this.pinUi(
        this.add
          .text(centerX, BUY_MODE_BUTTON_Y - 1, config.label, smallUiTextStyle(12, BUY_MODE_BUTTON_LABEL_COLOR))
          .setOrigin(0.5)
          .setDepth(PINNED_UI_TEXT_DEPTH)
      );
      const zone = this.pinUi(
        this.add
          .zone(centerX, BUY_MODE_BUTTON_Y, config.width, BUY_MODE_BUTTON_HEIGHT)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
      );

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

  private createMiniUpgradeCards(): void {
    const cardWidth = 180;
    const cardHeight = 40;
    const startX = FLOW_PANEL_X + FLOW_PANEL_WIDTH + 7; // ~598
    const y = 14;

    this.miniUpgradeCards = {
      warehouse: this.createMiniUpgradeCard("warehouse", startX, y, cardWidth, cardHeight),
      elevator: this.createMiniUpgradeCard("elevator", startX + cardWidth + 7, y, cardWidth, cardHeight)
    };
  }

  private createMiniUpgradeCard(target: "warehouse" | "elevator", x: number, y: number, width: number, height: number): MiniUpgradeCardUi {
    const objects: Phaser.GameObjects.GameObject[] = [];

    const bg = this.pinUi(this.drawRoundedPanel(x, y, width, height, {
      fill: 0xf4cb7d,
      fillAlpha: 0.96,
      innerFill: 0xffdf9a,
      innerAlpha: 0.52,
      line: 0x613212,
      radius: 16
    }).setDepth(PINNED_UI_PANEL_DEPTH));
    objects.push(bg);

    const titleText = this.pinUi(
      this.add
        .text(x + 10, y + 11, target === "warehouse" ? "Warehouse" : "Elevator", smallUiTextStyle(12, "#4b2709"))
        .setOrigin(0, 0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    objects.push(titleText);

    const levelText = this.pinUi(
      this.add
        .text(x + 10, y + 27, "Lvl 1", smallUiTextStyle(10, "#6e5531"))
        .setOrigin(0, 0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    objects.push(levelText);

    const coinIcon = this.pinUi(
      this.add
        .image(x + 56, y + 27, "coin-icon")
        .setDisplaySize(16, 16)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    objects.push(coinIcon);

    const costText = this.pinUi(
      this.add
        .text(x + 68, y + 27, "100", smallUiTextStyle(11, "#5a3411"))
        .setOrigin(0, 0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    objects.push(costText);

    const buttonWidth = 56;
    const buttonHeight = 56;
    const buttonX = x + width - 38;
    const buttonY = y + height / 2;

    const buttonBg = this.pinUi(
      this.add
        .image(buttonX, buttonY, "button-panel")
        .setDisplaySize(buttonWidth, buttonHeight)
        .setDepth(PINNED_UI_PANEL_DEPTH + 1)
    );
    objects.push(buttonBg);

    const arrowIcon = this.pinUi(
      this.add
        .image(buttonX, buttonY, "upgrade-arrow-icon")
        .setDisplaySize(20, 20)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    objects.push(arrowIcon);

    const buttonZone = this.pinUi(
      this.add
        .zone(buttonX, buttonY, buttonWidth, buttonHeight)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );
    objects.push(buttonZone);

    buttonZone.on("pointerdown", () => {
      if (this.miniUpgradeCards && this.miniUpgradeCards[target].enabled) {
        if (target === "warehouse") {
          this.applyFrame(this.viewModel.purchaseWarehouseUpgrade(), this.time.now);
        } else {
          this.applyFrame(this.viewModel.purchaseElevatorUpgrade(), this.time.now);
        }
      }
    });

    buttonZone.on("pointerover", () => {
      if (this.miniUpgradeCards && this.miniUpgradeCards[target].enabled) {
        buttonBg.setTint(0xcccccc);
      }
    });

    buttonZone.on("pointerout", () => {
      buttonBg.clearTint();
    });

    // Initially hide all objects
    objects.forEach(obj => {
      if ("setVisible" in obj && typeof obj.setVisible === "function") {
        obj.setVisible(false);
      }
    });

    return {
      objects,
      titleText,
      levelText,
      costText,
      buttonZone,
      buttonBg,
      target,
      enabled: true
    };
  }

  private createUpgradeCards(): void {
    this.upgradeCards = {
      warehouse: this.createUpgradeCard(UPGRADE_COLUMN_X, WAREHOUSE_CARD_Y, "Warehouse"),
      elevator: this.createUpgradeCard(UPGRADE_COLUMN_X, ELEVATOR_CARD_Y, "Elevator")
    };
  }

  private createUpgradeCard(left: number, top: number, title: string): UpgradeCardUi {
    const frame = this.pinUi(this.drawUpgradeCardFrame(left, top, UPGRADE_CARD_WIDTH, UPGRADE_CARD_HEIGHT).setDepth(PINNED_UI_PANEL_DEPTH));
    const titleText = this.pinUi(this.add.text(left + 16, top + 12, title, cardTitleTextStyle()).setDepth(PINNED_UI_TEXT_DEPTH));
    const levelBadge = this.pinUi(this.drawLevelBadge(left + UPGRADE_CARD_WIDTH - 74, top + 10, 58, 24).setDepth(PINNED_UI_PANEL_DEPTH + 1));
    const decorations: Phaser.GameObjects.Image[] = [];
    const levelText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH - 45, top + 21, "", smallUiTextStyle(12, "#f6e8bb"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
 
    const mainLabelText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH / 2, top + 42, "", smallUiTextStyle(11, "#6e5531"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const mainCurrentText = this.pinUi(
      this.add
        .text(left + 88, top + 62, "", metricValueTextStyle(18, "#683d11"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    decorations.push(this.pinUi(
      this.add
        .image(left + UPGRADE_CARD_WIDTH / 2, top + 65, "upgrade-arrow-icon")
        .setDisplaySize(18, 18)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    ));
    const mainNextText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH - 88, top + 62, "", metricValueTextStyle(18, "#234f66"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
 
    const secondaryLabelText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH / 2, top + 84, "", smallUiTextStyle(11, "#6e5531"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const secondaryCurrentText = this.pinUi(
      this.add
        .text(left + 88, top + 102, "", metricValueTextStyle(14, "#6b4519"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    decorations.push(this.pinUi(
      this.add
        .image(left + UPGRADE_CARD_WIDTH / 2, top + 104, "upgrade-arrow-icon")
        .setDisplaySize(18, 18)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    ));
    const secondaryNextText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH - 88, top + 102, "", metricValueTextStyle(14, "#2f5962"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
 
    decorations.push(this.pinUi(this.add.image(left + 18, top + 123, "coin-icon").setDisplaySize(32, 32).setDepth(PINNED_UI_TEXT_DEPTH)));
    const costText = this.pinUi(
      this.add
        .text(left + 29, top + 116, "", smallUiTextStyle(13, "#5a3411"))
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const buyCountText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH / 2 + UPGRADE_BUTTON_WIDTH / 2 + 12, top + 116, "", smallUiTextStyle(11, "#7b4e1d"))
        .setOrigin(0, 0)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
 
    const buttonCenterY = top + UPGRADE_CARD_HEIGHT - 18;
    const buttonImage = this.pinUi(
      this.add
        .image(left + UPGRADE_CARD_WIDTH / 2, buttonCenterY, "button-panel")
        .setDisplaySize(UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
        .setDepth(PINNED_UI_PANEL_DEPTH + 1)
    );
    const buttonText = this.pinUi(
      this.add
        .text(left + UPGRADE_CARD_WIDTH / 2, buttonCenterY - 1, "Upgrade", smallUiTextStyle(13, "#fff8de"))
        .setOrigin(0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const buttonZone = this.pinUi(
      this.add
        .zone(left + UPGRADE_CARD_WIDTH / 2, buttonCenterY, UPGRADE_BUTTON_WIDTH, UPGRADE_BUTTON_HEIGHT)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );

    return {
      frame,
      levelBadge,
      decorations,
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
    this.commandFeedback = this.pinUi(
      this.add
        .text(640, 686, "", feedbackTextStyle(17, "#f2dfbd"))
        .setOrigin(0.5)
        .setVisible(false)
        .setDepth(UI_TEXT_DEPTH)
    );
  }

  private createManagerSlots(): void {
    this.managerSlots = {
      elevator: this.createManagerSlot("elevator"),
      warehouse: this.createManagerSlot("warehouse")
    };
  }

  private createManagerSlot(area: "warehouse" | "elevator"): ManagerSlotUi {
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
      .setVisible(false)
      .setAlpha(0);
    const rankText = this.add
      .text(config.x + 76, config.y + 38, "", smallUiTextStyle(11, "#f7f1dd"))
      .setDepth(MANAGER_SLOT_TEXT_DEPTH);
    const abilityImage = this.add
      .image(config.x + 172, config.y + 60, "ability-mining-speed")
      .setDisplaySize(64, 64)
      .setDepth(MANAGER_SLOT_TEXT_DEPTH)
      .setVisible(false)
      .setAlpha(0);
    const abilityZone = this.add
      .zone(config.x + 172, config.y + 60, 64, 64)
      .setOrigin(0.5)
      .setDepth(MANAGER_SLOT_INTERACTIVE_DEPTH + 1)
      .setVisible(false);
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

    slotZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
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
    this.elevatorClickTarget = this.createClickTarget(392, 74, 132, 572, "Elevator", () => {
      this.applyFrame(this.viewModel.startElevatorCycle(), this.time.now);
    });

    this.createClickTarget(138, 72, 260, 130, "Warehouse", () => {
      this.applyFrame(this.viewModel.startWarehouseCycle(), this.time.now);
    });
  }

  private createClickTarget(x: number, y: number, width: number, height: number, label: string, handler: () => void): WorldClickTargetUi {
    const zone = this.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const outline = this.add.rectangle(x, y, width, height).setOrigin(0, 0).setStrokeStyle(2, 0xf1c96b, 0.14).setVisible(false);
    const chip = this.add
      .text(x + 10, y + 8, label, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "12px",
        fontStyle: "700",
        color: "#f7f1dd",
        backgroundColor: "rgba(24, 33, 42, 0.52)",
        padding: { x: 8, y: 4 }
      })
      .setAlpha(0.74)
      .setVisible(false);

    zone.on("pointerdown", handler);

    return { zone, outline, chip };
  }

  private updateWorldClickTarget(target: WorldClickTargetUi, x: number, y: number, width: number, height: number): void {
    target.zone.setPosition(x, y).setSize(width, height);
    target.outline.setPosition(x, y).setSize(width, height);
    target.chip.setPosition(x + 10, y + 8);
  }

  private applyFrame(frame: SimulationFrame, time: number): void {
    const { state, visual, events, buyMode } = frame;
    this.latestState = state;

    this.processElevatorRouteEvents(state, events);
    this.refreshDepthSections(state);
    this.refreshDepthBlockades(state);
    this.clampCameraScroll(state);
    this.refreshElevatorShaftVisual(state);
    this.refreshMineShaftRows(state, visual, time);
    this.applyElevatorVisual(visual.elevatorCabin, visual.elevatorPositionRatio, state);
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

  private refreshMineShaftRows(state: GameState, visual: SimulationFrame["visual"], time: number): void {
    const nextVisibleLockedShaftId = this.getNextVisibleLockedShaftId(state);

    for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
      const row = this.mineShaftRows[shaftId];
      const shaftState = state.entities.mineShafts[shaftId];
      const shaftVisual = visual.mineShafts[shaftId];
      const preview = state.upgrades.mineShafts[shaftId];
      const assignedManager = getAssignedManagerForShaft(state, shaftId);
      const automated = state.managers.automationEnabledByShaft[shaftId] ?? false;
      const managersLocked = state.managers.systemLocked;
      const routeFeedback = this.shaftRouteFeedbackById[shaftId];
      const previousUnlocked = shaftId === 1 || state.entities.mineShafts[shaftId - 1]?.isUnlocked === true;
      const canUnlock = previousUnlocked && state.money + Number.EPSILON >= shaftState.unlockCost;
      const rowMode =
        shaftState.isUnlocked
          ? "unlocked"
          : shaftId === nextVisibleLockedShaftId
            ? "locked"
            : "hidden";

      this.setMineShaftRowMode(row, rowMode);

      if (rowMode === "hidden") {
        continue;
      }

      row.routeText.setVisible(routeFeedback !== undefined && routeFeedback.expiresAtSeconds > state.timeSeconds);
      row.routeText.setText(routeFeedback?.text ?? "");

      if (!shaftState.isUnlocked) {
        this.drawLockedShaftPlaceholder(row, canUnlock, previousUnlocked);
        row.unlockButtonText.setText(`Unlock ${formatAmount(shaftState.unlockCost)}`);
        row.lockedHintText.setText(
          previousUnlocked
            ? canUnlock
              ? "Deepen the mine and extend the elevator."
              : "Need more cash to unlock this shaft."
            : `Unlock Shaft ${shaftId - 1} first.`
        );
        this.setWorldButtonEnabled(row.unlockButtonImage, row.unlockButtonText, row.unlockButtonZone, canUnlock, true);
        continue;
      }

      const minerTexture =
        shaftVisual.miner === "pickaxe"
          ? Math.floor(time / 170) % 2 === 0
            ? "miner-pickaxe-01"
            : "miner-pickaxe-02"
          : shaftVisual.miner === "carryBag"
            ? "miner-carry"
            : shaftVisual.miner === "dropBag"
              ? "miner-drop"
              : "miner-idle";
      const pickupTexture =
        shaftVisual.minePickupBox === "empty"
          ? "mine-pickup-empty"
          : shaftVisual.minePickupBox === "small"
            ? "mine-pickup-small"
            : "mine-pickup-full";

      row.miner.setTexture(minerTexture);
      row.miner.setPosition(
        Phaser.Math.Linear(MINE_WORKER_MINE_X, MINE_WORKER_PICKUP_X, shaftVisual.minerPositionRatio),
        this.getShaftY(MINE_WORKER_Y, shaftId)
      );
      row.miner.setFlipX(false);
      row.pickupBox.setTexture(pickupTexture);
      row.storageText.setText(`${formatAmount(shaftState.storedOre)} / ${formatAmount(shaftState.capacity)}`);
      row.titleText.setText(shaftState.displayName);
      row.levelText.setText(`Lvl ${preview.currentLevel}`);
      row.mainCurrentText.setText(formatRate(state.baseValues.mineShafts[shaftId].throughputPerSecond));
      row.mainNextText.setText(preview.isMaxed ? "MAX" : formatRate(preview.previewStats.throughputPerSecond));
      row.secondaryCurrentText.setText(formatAmount(state.baseValues.mineShafts[shaftId].bufferCapacity));
      row.secondaryNextText.setText(preview.isMaxed ? "MAX" : formatAmount(preview.previewStats.bufferCapacity));
      row.costText.setText(preview.isMaxed ? "MAX" : formatAmount(preview.cost));
      row.buyCountText.setText(preview.isMaxed ? "" : `x${preview.levelsToBuy}`);

      fitTextToWidth(row.mainCurrentText, 88, [18, 16, 14, 12]);
      fitTextToWidth(row.mainNextText, 88, [18, 16, 14, 12]);
      fitTextToWidth(row.secondaryCurrentText, 88, [14, 13, 12, 11]);
      fitTextToWidth(row.secondaryNextText, 88, [14, 13, 12, 11]);
      fitTextToWidth(row.costText, 120, [13, 12, 11, 10]);
      fitTextToWidth(row.buyCountText, 54, [11, 10, 9]);

      this.drawMineShaftPanelFrame(row);
      this.drawMineShaftManagerSlotFrame(row, automated, managersLocked, assignedManager?.isActive ?? false);
      this.setMineShaftUpgradeEnabled(row, preview.canAfford && !preview.isMaxed);
      const showManagerSlot = shaftState.isUnlocked;
      row.managerFrame.setVisible(showManagerSlot);
      row.managerTitleText.setVisible(showManagerSlot);
      row.managerSlotZone.setVisible(showManagerSlot);

      row.managerEmptySlotImage.setVisible(showManagerSlot && assignedManager === undefined).setAlpha(assignedManager === undefined ? (managersLocked ? 0.52 : 0.9) : 0);
      row.managerPortraitImage.setVisible(showManagerSlot && assignedManager !== undefined).setAlpha(assignedManager === undefined ? 0 : 1);
      row.managerAbilityImage.setVisible(showManagerSlot && assignedManager !== undefined).setAlpha(assignedManager === undefined ? 0 : 0.92);
      row.managerAbilityZone.setVisible(showManagerSlot && assignedManager !== undefined);
      row.managerRankText.setVisible(showManagerSlot);
      row.managerStatusText.setVisible(showManagerSlot);
      row.managerTimerText.setVisible(showManagerSlot);

      if (assignedManager === undefined) {
        row.managerEmptySlotImage.setAlpha(managersLocked ? 0.52 : 0.9);
        row.managerRankText.setText(managersLocked ? "Manager Locked" : "No Manager").setColor(managersLocked ? "#c8b39a" : "#f7f1dd");
        row.managerStatusText
          .setText(managersLocked ? `Mine Lvl ${state.managers.unlockLevel}` : "Tap to assign")
          .setColor(managersLocked ? "#f08e7f" : "#bdd2d8");
        row.managerTimerText.setText(automated ? "Automated" : "Manual");
        row.managerAbilityZone.disableInteractive();
      } else {
        row.managerPortraitImage.setTexture(getManagerPortraitKey("mineShaft", assignedManager.rank));
        row.managerAbilityImage
          .setTexture(getAbilityIconKey(assignedManager.abilityType))
          .setAlpha(assignedManager.isActive ? 1 : assignedManager.remainingCooldownTime > 0 ? 0.48 : 0.92)
          .clearTint();
        row.managerRankText.setText(formatRank(assignedManager.rank)).setColor(getRankColor(assignedManager.rank));
        row.managerStatusText.setText(automated ? "Automated" : "Assigned").setColor(automated ? "#95f0bd" : "#f1d389");
        row.managerTimerText.setText(formatManagerTimer(assignedManager));
        row.managerAbilityZone.setInteractive({ useHandCursor: true });
      }

      row.mineClickChip.setText(automated ? `${shaftState.displayName} Auto` : shaftState.displayName);

      if (automated) {
        this.setWorldClickTargetEnabled(row.mineClickOutline, row.mineClickChip, row.mineClickZone, false);
      } else {
        this.setWorldClickTargetEnabled(row.mineClickOutline, row.mineClickChip, row.mineClickZone, true);
      }
    }
  }

  private applyElevatorVisual(loadState: "empty" | "loaded", positionRatio: number, state: GameState): void {
    const animating = this.activeElevatorAnimation !== undefined || this.elevatorAnimationQueue.length > 0;
    const deepestUnlockedShaftId = getDeepestUnlockedShaftId(state, this.totalMineShafts);

    if (!animating) {
      if (state.entities.elevator.state === "moving") {
        this.elevatorCabin.setY(Phaser.Math.Linear(ELEVATOR_TOP_Y, this.getElevatorStopY(deepestUnlockedShaftId), positionRatio));
      } else if (state.entities.elevator.state === "idle") {
        this.elevatorCabin.setY(ELEVATOR_TOP_Y);
      }
      this.elevatorCabin.setTexture(loadState === "loaded" ? "elevator-cabin-loaded" : "elevator-cabin-empty");
    } else {
      this.elevatorCabin.setTexture(this.elevatorVisualLoaded ? "elevator-cabin-loaded" : "elevator-cabin-empty");
    }
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
      eventTypes.has("upgradePurchased") ||
      eventTypes.has("mineShaftUnlocked");
    const managerStateChanged =
      refreshAll ||
      eventTypes.has("managerPurchased") ||
      eventTypes.has("managerAssigned") ||
      eventTypes.has("managerAssignedToShaft") ||
      eventTypes.has("managerUnassigned") ||
      eventTypes.has("managerUnassignedFromShaft") ||
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

    if (
      refreshAll ||
      eventTypes.has("statsChanged") ||
      eventTypes.has("upgradePurchased") ||
      eventTypes.has("mineShaftUnlocked") ||
      managerStateChanged
    ) {
      const summary = formatProductionSummary(state);
      const keys: Array<"mine" | "elevator" | "warehouse"> = ["mine", "elevator", "warehouse"];
      
      keys.forEach((key, index) => {
        const boostedText = this.productionTextsBoosted[index];
        const baseText = this.productionTextsBase[index];
        
        boostedText.setText(summary.boosted[key]);
        baseText.setText(summary.base[key]);
        
        // Highlight bottleneck in red
        const isBottleneck = summary.bottleneckArea === key;
        boostedText.setColor(isBottleneck ? "#cc3333" : "#4b2709");
        
        if (summary.isBoosted) {
          boostedText.setY(FLOW_PANEL_Y + 13);
          baseText.setVisible(true);
          // fitTextToWidth for each part
          const partWidth = (FLOW_PANEL_WIDTH - 66) / 3;
          fitTextToWidth(boostedText, partWidth - 10, [12, 11, 10]);
          fitTextToWidth(baseText, partWidth - 10, [10, 9, 8]);
        } else {
          boostedText.setY(FLOW_PANEL_Y + FLOW_PANEL_HEIGHT / 2);
          baseText.setVisible(false);
          const partWidth = (FLOW_PANEL_WIDTH - 66) / 3;
          fitTextToWidth(boostedText, partWidth - 10, [12, 11, 10]);
        }
      });
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

    this.refreshSurfaceSidebarVisibility();
    this.activeBuyMode = buyMode;
    this.uiInitialized = true;
  }

  private refreshDepthSections(state: GameState): void {
    const visibleDepthGroupCount = this.getVisibleDepthGroupCount(state);

    for (const section of this.depthSections) {
      section.background.setVisible(section.depthGroup <= visibleDepthGroupCount);
    }
  }

  private refreshDepthBlockades(state: GameState): void {
    for (const ui of this.depthBlockades) {
      const blockade = state.blockades[ui.blockadeId];
      const nextDepthGroup = Math.floor((ui.unlocksShaftId - 1) / SHAFTS_PER_DEPTH_GROUP) + 1;
      const visible = blockade !== undefined && !blockade.isRemoved && this.isDepthGroupVisible(state, nextDepthGroup);

      ui.image.setVisible(visible);
      ui.panel.setVisible(visible);
      ui.titleText.setVisible(visible);
      ui.hintText.setVisible(visible);
      ui.buttonImage.setVisible(visible);
      ui.buttonText.setVisible(visible);
      ui.buttonZone.setVisible(visible);

      if (!visible || blockade === undefined) {
        ui.panel.clear();
        ui.buttonZone.disableInteractive();
        continue;
      }

      const canAfford = state.money + Number.EPSILON >= blockade.removalCost;
      const previousShaftUnlocked = state.entities.mineShafts[ui.afterShaftId]?.isUnlocked ?? false;
      const enabled = previousShaftUnlocked && canAfford && !blockade.isRemoving;

      ui.buttonText.setText(blockade.isRemoving ? "Removing..." : `Clear ${formatAmount(blockade.removalCost)}`);
      ui.hintText.setText(
        blockade.isRemoving
          ? `Clearing: ${formatDuration(blockade.remainingRemovalSeconds)}`
          : canAfford
            ? "Remove the rockfall to reach the next depth."
            : "Need more cash to clear this blockade."
      );

      ui.panel.clear();
      ui.panel.fillStyle(0x14222c, 0.94);
      ui.panel.fillRoundedRect(
        DEPTH_BLOCKADE_CENTER_X - DEPTH_BLOCKADE_PANEL_WIDTH / 2,
        ui.image.y - DEPTH_BLOCKADE_PANEL_HEIGHT / 2,
        DEPTH_BLOCKADE_PANEL_WIDTH,
        DEPTH_BLOCKADE_PANEL_HEIGHT,
        14
      );
      ui.panel.fillStyle(0x3b5360, 0.18);
      ui.panel.fillRoundedRect(
        DEPTH_BLOCKADE_CENTER_X - DEPTH_BLOCKADE_PANEL_WIDTH / 2 + 6,
        ui.image.y - DEPTH_BLOCKADE_PANEL_HEIGHT / 2 + 6,
        DEPTH_BLOCKADE_PANEL_WIDTH - 12,
        DEPTH_BLOCKADE_PANEL_HEIGHT - 12,
        10
      );
      ui.panel.lineStyle(2, 0xf1c96b, 0.86);
      ui.panel.strokeRoundedRect(
        DEPTH_BLOCKADE_CENTER_X - DEPTH_BLOCKADE_PANEL_WIDTH / 2 + 1,
        ui.image.y - DEPTH_BLOCKADE_PANEL_HEIGHT / 2 + 1,
        DEPTH_BLOCKADE_PANEL_WIDTH - 2,
        DEPTH_BLOCKADE_PANEL_HEIGHT - 2,
        14
      );

      fitTextToWidth(ui.buttonText, DEPTH_BLOCKADE_BUTTON_WIDTH - 22, [13, 12, 11, 10]);
      fitTextToWidth(ui.hintText, DEPTH_BLOCKADE_PANEL_WIDTH - 36, [12, 11, 10]);
      this.setWorldButtonEnabled(ui.buttonImage, ui.buttonText, ui.buttonZone, enabled, true);
    }
  }

  private refreshManagerSlots(state: GameState): void {
    for (const area of ["warehouse", "elevator"] as const) {
      const slot = this.managerSlots[area];
      const assignedManager = getAssignedManagerForArea(state, area);
      const automated = state.managers.automationEnabledByArea[area];
      const locked = state.managers.systemLocked;

      this.drawManagerSlotFrame(slot, automated, locked, assignedManager?.isActive ?? false);

      slot.titleText.setText(`${getAreaLabel(area)} Slot`);
      slot.emptySlotImage.setVisible(assignedManager === undefined).setAlpha(assignedManager === undefined ? (locked ? 0.52 : 0.9) : 0);
      slot.portraitImage.setVisible(assignedManager !== undefined).setAlpha(assignedManager === undefined ? 0 : 1);
      slot.abilityImage.setVisible(assignedManager !== undefined).setAlpha(assignedManager === undefined ? 0 : 0.9);
      slot.abilityZone.setVisible(assignedManager !== undefined);

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

  private openManagerPanel(area: ManagerArea, state: GameState, shaftId: number | null = null): void {
    if (state.managers.systemLocked) {
      this.applyFrame(this.viewModel.purchaseManager(area), this.time.now);
      return;
    }

    this.activeManagerPanelArea = area;
    this.activeManagerPanelShaftId = area === "mineShaft" ? shaftId ?? 1 : null;
    this.activeManagerAbilityTab = "all";
    this.managerPanelScrollY = 0;
    this.rebuildManagerPanel(state);
    this.lastManagerPanelRefreshSecond = Math.floor(state.timeSeconds);
  }

  private closeManagerPanel(): void {
    this.managerPanel?.destroy(true);
    this.managerPanel = undefined;
    this.activeManagerPanelArea = null;
    this.activeManagerPanelShaftId = null;
    this.managerPanelScrollY = 0;
    this.lastManagerPanelRefreshSecond = -1;
  }

  private rebuildManagerPanel(state: GameState): void {
    const area = this.activeManagerPanelArea;
    const shaftId = area === "mineShaft" ? this.activeManagerPanelShaftId ?? 1 : null;

    if (area === null) {
      return;
    }

    if (state.managers.systemLocked) {
      this.closeManagerPanel();
      return;
    }

    this.managerPanel?.destroy(true);

    const container = this.pinUi(this.add.container(0, 0).setDepth(MANAGER_PANEL_DEPTH));
    this.managerPanel = container;
    const automated = area === "mineShaft" ? state.managers.automationEnabledByShaft[shaftId ?? 1] ?? false : state.managers.automationEnabledByArea[area];

    const backdrop = this.addManagerPanelObject(
      container,
      this.add
        .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.42)
        .setOrigin(0, 0)
        .setInteractive()
    );
    backdrop.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.closeManagerPanel();
    });

    // Block clicks from passing through the panel to the backdrop
    this.addManagerPanelObject(
      container,
      this.add
        .rectangle(MANAGER_PANEL_X, MANAGER_PANEL_Y, MANAGER_PANEL_WIDTH, MANAGER_PANEL_HEIGHT, 0x000000, 0)
        .setOrigin(0, 0)
        .setInteractive()
        .on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
        })
    );

    const panelFrame = this.addManagerPanelObject(container, this.add.graphics());
    panelFrame.fillStyle(0x14222c, 0.98);
    panelFrame.fillRoundedRect(MANAGER_PANEL_X, MANAGER_PANEL_Y, MANAGER_PANEL_WIDTH, MANAGER_PANEL_HEIGHT, 18);
    panelFrame.fillStyle(0xf0c66c, 0.96);
    panelFrame.fillRoundedRect(MANAGER_PANEL_X + 6, MANAGER_PANEL_Y + 6, MANAGER_PANEL_WIDTH - 12, 54, 14);
    panelFrame.fillStyle(0x203642, 0.96);
    panelFrame.fillRoundedRect(MANAGER_PANEL_X + 6, MANAGER_PANEL_Y + 66, MANAGER_PANEL_WIDTH - 12, MANAGER_PANEL_HEIGHT - 72, 14);
    panelFrame.lineStyle(2, 0xf1c96b, 0.92);
    panelFrame.strokeRoundedRect(MANAGER_PANEL_X + 1, MANAGER_PANEL_Y + 1, MANAGER_PANEL_WIDTH - 2, MANAGER_PANEL_HEIGHT - 2, 18);

    this.addManagerPanelObject(
      container,
      this.add
        .text(
          MANAGER_PANEL_X + 22,
          MANAGER_PANEL_Y + 20,
          area === "mineShaft" ? `Shaft ${shaftId} Manager` : `${getAreaLabel(area)} Manager`,
          topBarTextStyle(20, "#4b2709")
        )
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    this.addManagerPanelObject(
      container,
      this.add
        .text(
          MANAGER_PANEL_X + 244,
          MANAGER_PANEL_Y + 24,
          automated ? "Automated" : "Manual",
          smallUiTextStyle(13, automated ? "#174421" : "#6a3b13")
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

    // Fixed Header Content
    const assignedManager = area === "mineShaft" ? getAssignedManagerForShaft(state, shaftId ?? 1) : getAssignedManagerForArea(state, area);
    const assignedY = MANAGER_PANEL_Y + 78;
    this.createAssignedManagerPanel(container, area, assignedManager, automated, assignedY, shaftId);

    let cursorY = assignedY + 132;
    this.addManagerPanelObject(
      container,
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
      this.createHireOfferEntry(container, offer, x, y);
    });
    cursorY += Math.ceil(offers.length / 2) * (MANAGER_ENTRY_HEIGHT + MANAGER_ENTRY_GAP_Y) + 14;

    // Owned Managers Title (Fixed)
    const allOwnedManagersInArea = state.managers.ownedManagers.filter((manager) => manager.area === area && manager.isOwned);
    this.addManagerPanelObject(
      container,
      this.add
        .text(MANAGER_PANEL_X + 22, cursorY, "Owned Managers", smallUiTextStyle(14, "#f9e9bb"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    cursorY += 26;

    if (allOwnedManagersInArea.length > 15) {
      const abilities = Array.from(new Set(allOwnedManagersInArea.map(m => m.abilityType))) as ManagerAbilityType[];
      const tabs: (ManagerAbilityType | "all")[] = ["all", ...abilities];
      
      let tabX = MANAGER_PANEL_X + 22;
      tabs.forEach(tab => {
        const label = tab === "all" ? "All" : formatAbilityType(tab);
        const isActive = this.activeManagerAbilityTab === tab;
        const tabBtn = this.addManagerPanelObject(
          container,
          this.add.text(tabX, cursorY, label, smallUiTextStyle(11, isActive ? "#f1c96b" : "#bdd2d8"))
            .setDepth(MANAGER_PANEL_TEXT_DEPTH)
            .setInteractive({ useHandCursor: true })
        );
        if (isActive) {
          const underline = this.addManagerPanelObject(container, this.add.graphics());
          underline.lineStyle(1, 0xf1c96b, 0.8);
          underline.strokeLineShape(new Phaser.Geom.Line(tabX, cursorY + tabBtn.height + 1, tabX + tabBtn.width, cursorY + tabBtn.height + 1));
        }
        tabBtn.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.activeManagerAbilityTab = tab;
          this.rebuildManagerPanel(state);
        });
        tabX += tabBtn.width + 12;
      });
      cursorY += 24;
    }

    const rankWeights: Record<ManagerRank, number> = {
      executive: 3,
      senior: 2,
      junior: 1
    };

    const ownedManagers = (this.activeManagerAbilityTab === "all" 
      ? allOwnedManagersInArea 
      : allOwnedManagersInArea.filter(m => m.abilityType === this.activeManagerAbilityTab))
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        
        const weightA = rankWeights[a.rank];
        const weightB = rankWeights[b.rank];
        if (weightA !== weightB) return weightB - weightA;
        
        return a.id.localeCompare(b.id);
      });

    // Scrollable Content (Owned Managers Entries)
    const contentAreaX = MANAGER_PANEL_X + 6;
    const scrollAreaY = cursorY;
    const contentAreaWidth = MANAGER_PANEL_WIDTH - 12;
    const scrollAreaHeight = (MANAGER_PANEL_Y + MANAGER_PANEL_HEIGHT - 6) - scrollAreaY;

    const contentMaskShape = this.make.graphics({});
    this.pinUi(contentMaskShape);
    contentMaskShape.fillStyle(0xffffff);
    contentMaskShape.fillRoundedRect(contentAreaX, scrollAreaY, contentAreaWidth, scrollAreaHeight, 14);
    const contentMask = contentMaskShape.createGeometryMask();

    const contentContainer = this.pinUi(this.add.container(0, 0));
    contentContainer.setMask(contentMask);
    container.add(contentContainer);
    (contentContainer as any).contentAreaY = scrollAreaY;
    (contentContainer as any).contentAreaHeight = scrollAreaHeight;

    const ownedManagersListStartY = cursorY;
    if (ownedManagers.length === 0) {
      this.addManagerPanelObject(
        contentContainer,
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
        this.createOwnedManagerEntry(contentContainer, manager, x, y, shaftId);
      });
      cursorY += Math.ceil(ownedManagers.length / 2) * (MANAGER_ENTRY_HEIGHT + MANAGER_ENTRY_GAP_Y);
    }

    const totalContentHeight = cursorY - ownedManagersListStartY + 20; 
    (contentContainer as any).totalContentHeight = totalContentHeight;
    const maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    // Clamp scroll Y if content height changed
    this.managerPanelScrollY = Phaser.Math.Clamp(this.managerPanelScrollY, -maxScroll, 0);
    contentContainer.setY(this.managerPanelScrollY);

    // Scrollbar
    if (maxScroll > 0) {
      const scrollbarHeight = Math.max(30, (scrollAreaHeight / totalContentHeight) * scrollAreaHeight);
      const scrollbar = this.addManagerPanelObject(container, this.add.graphics());
      (scrollbar as any).isScrollbar = true;
      (scrollbar as any).scrollbarHeight = scrollbarHeight;
      scrollbar.fillStyle(0xf1c96b, 0.4);
      scrollbar.fillRoundedRect(contentAreaX + contentAreaWidth - 10, 0, 4, scrollbarHeight, 2);
      
      const scrollPercent = -this.managerPanelScrollY / maxScroll;
      scrollbar.setY(scrollAreaY + 5 + scrollPercent * (scrollAreaHeight - scrollbarHeight - 10));
    }
  }

  private createAssignedManagerPanel(
    container: Phaser.GameObjects.Container,
    area: ManagerArea,
    manager: ManagerState | undefined,
    automated: boolean,
    y: number,
    shaftId: number | null = null
  ): void {
    this.createPanelCard(container, MANAGER_PANEL_X + 18, y, MANAGER_PANEL_WIDTH - 36, 112, 0x253e49, 0.98);
    const assignedTitleText = this.addManagerPanelObject(
      container,
      this.add
        .text(MANAGER_PANEL_X + 36, y + 14, "Currently assigned", smallUiTextStyle(13, "#f7e5b2"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    if (manager === undefined) {
      this.addManagerPanelObject(
        container,
        this.add
          .image(MANAGER_PANEL_X + 64, y + 66, getManagerEmptySlotKey(area))
          .setDisplaySize(58, 58)
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      this.addManagerPanelObject(
        container,
        this.add
          .text(MANAGER_PANEL_X + 104, y + 48, "No manager assigned", smallUiTextStyle(14, "#dcecf1"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      this.addManagerPanelObject(
        container,
        this.add
          .text(MANAGER_PANEL_X + 104, y + 72, "This area is running manually.", smallUiTextStyle(12, "#bdd2d8"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
    } else {
      this.addManagerPanelObject(
        container,
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
      this.addManagerPanelObject(container, managerNameText.setDepth(MANAGER_PANEL_TEXT_DEPTH));
      this.addManagerPanelObject(
        container,
        this.add
          .text(
            MANAGER_PANEL_X + 106,
            y + 58,
            `Rank: ${formatRank(manager.rank)}`,
            smallUiTextStyle(12, getRankColor(manager.rank))
          )
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      this.addManagerPanelObject(
        container,
        this.add
          .text(
            MANAGER_PANEL_X + 106,
            y + 78,
            `Ability: ${formatAbilityType(manager.abilityType)}`,
            smallUiTextStyle(12, "#bdd2d8")
          )
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      this.addManagerPanelObject(
        container,
        this.add
          .text(MANAGER_PANEL_X + 382, y + 38, formatManagerTimer(manager), smallUiTextStyle(12, "#f1d389"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );

      const abilityIcon = this.addManagerPanelObject(
        container,
        this.add
          .image(MANAGER_PANEL_X + 594, y + 58, getAbilityIconKey(manager.abilityType))
          .setDisplaySize(108, 108)
          .setAlpha(manager.isActive ? 1 : manager.remainingCooldownTime > 0 ? 0.48 : 0.92)
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      const abilityZone = this.addManagerPanelObject(
        container,
        this.add
          .zone(MANAGER_PANEL_X + 594, y + 58, 116, 116)
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .setDepth(MANAGER_PANEL_INTERACTIVE_DEPTH)
      );

      abilityZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.activateAssignedManagerAbility(area, shaftId ?? 1);
      });

      this.createPanelButton(
        container,
        assignedTitleText.x + assignedTitleText.width + 12,
        y + 10,
        96,
        24,
        "Unassign",
        true,
        () => {
          this.applyFrame(this.viewModel.unassignManager(area, shaftId ?? 1), this.time.now);
        },
        true,
        0xc94c4c
      );
    }

    if (automated) {
      this.addManagerPanelObject(
        container,
        this.add
          .text(MANAGER_PANEL_X + 382, y + 82, "Automated", smallUiTextStyle(12, "#95f0bd"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      return;
    }

    if (area === "mineShaft") {
      this.addManagerPanelObject(
        container,
        this.add
          .text(MANAGER_PANEL_X + 382, y + 82, "Manual via shaft click", smallUiTextStyle(12, "#f1d389"))
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
        this.handleManualAreaAction(area, shaftId ?? 1);
      }
    );
  }

  private createOwnedManagerEntry(
    container: Phaser.GameObjects.Container,
    manager: ManagerState,
    x: number,
    y: number,
    targetShaftId: number | null = null
  ): void {
    const assignedToDifferentShaft = manager.area === "mineShaft" && manager.assignedShaftId !== null && manager.assignedShaftId !== targetShaftId;
    this.createPanelCard(
      container,
      x,
      y,
      MANAGER_ENTRY_WIDTH,
      MANAGER_ENTRY_HEIGHT,
      manager.isAssigned ? 0x284f38 : 0x1f323c,
      0.96
    );
    this.addManagerPanelObject(
      container,
      this.add
        .image(x + 22, y + 21, getManagerPortraitKey(manager.area, manager.rank))
        .setDisplaySize(34, 34)
        .setFlipX(false)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    this.addManagerPanelObject(
      container,
      this.add
        .image(x + 58, y + 21, getAbilityIconKey(manager.abilityType))
        .setDisplaySize(22, 22)
        .setAlpha(manager.isAssigned || manager.remainingCooldownTime > 0 ? 0.52 : 1)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    this.addManagerPanelObject(
      container,
      this.add
        .text(x + 76, y + 7, formatRank(manager.rank), smallUiTextStyle(11, getRankColor(manager.rank)))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    this.addManagerPanelObject(
      container,
      this.add
        .text(x + 76, y + 23, formatAbilityType(manager.abilityType), smallUiTextStyle(10, "#bdd2d8"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    if (manager.isAssigned && !assignedToDifferentShaft) {
      this.addManagerPanelObject(
        container,
        this.add
          .text(x + 224, y + 14, "Assigned", smallUiTextStyle(11, "#95f0bd"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
      return;
    }

    if (assignedToDifferentShaft) {
      this.addManagerPanelObject(
        container,
        this.add
          .text(x + 165, y + 7, `Shaft ${manager.assignedShaftId}`, smallUiTextStyle(10, "#95f0bd"))
          .setDepth(MANAGER_PANEL_TEXT_DEPTH)
      );
    }

    this.createPanelButton(
      container,
      x + 226,
      y + 8,
      62,
      26,
      assignedToDifferentShaft ? "Move" : "Assign",
      true,
      () => {
        this.applyFrame(this.viewModel.assignManager(manager.id, manager.area, targetShaftId ?? 1), this.time.now);
      }
    );
  }

  private createHireOfferEntry(container: Phaser.GameObjects.Container, offer: ManagerHireOffer, x: number, y: number): void {
    this.createPanelCard(container, x, y, MANAGER_ENTRY_WIDTH, MANAGER_ENTRY_HEIGHT, offer.canAfford ? 0x1f323c : 0x332b2b, 0.96);
    this.addManagerPanelObject(
      container,
      this.add
        .image(x + 22, y + 21, getManagerPortraitKey(offer.area, 'junior'))
        .setDisplaySize(34, 34)
        .setFlipX(false)
        .setAlpha(offer.canAfford ? 1 : 0.68)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    this.addManagerPanelObject(
      container,
      this.add
        .text(x + 70, y + 12, "Random draw + ability", smallUiTextStyle(11, "#ecf8fa"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    this.addManagerPanelObject(
      container,
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
    const graphics = this.addManagerPanelObject(container, this.add.graphics().setDepth(MANAGER_PANEL_DEPTH));
    graphics.fillStyle(fill, fillAlpha);
    graphics.fillRoundedRect(x, y, width, height, 10);
    graphics.lineStyle(1, 0xf1c96b, 0.26);
    graphics.strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, 10);
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
    const image = this.addManagerPanelObject(
      container,
      this.add
        .image(x + width / 2, y + height / 2, "button-panel")
        .setDisplaySize(width, height)
        .setAlpha(visualEnabled ? 1 : 0.64)
        .setTint(tint)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    const text = this.addManagerPanelObject(
      container,
      this.add
        .text(x + width / 2, y + height / 2 - 1, label, smallUiTextStyle(11, visualEnabled ? "#fff8de" : "#e3c7aa"))
        .setOrigin(0.5)
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );
    const zone = this.addManagerPanelObject(
      container,
      this.add
        .zone(x + width / 2, y + height / 2, width, height)
        .setOrigin(0.5)
        .setDepth(MANAGER_PANEL_INTERACTIVE_DEPTH)
    );

    if (interactive) {
      zone.setInteractive({ useHandCursor: true });
      zone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        handler();
      });
    }
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

  private activateAssignedManagerAbility(area: ManagerArea, shaftId = 1): void {
    const state = this.latestState;
    const manager =
      state === undefined
        ? undefined
        : area === "mineShaft"
          ? getAssignedManagerForShaft(state, shaftId)
          : getAssignedManagerForArea(state, area);

    if (manager === undefined) {
      return;
    }

    this.applyFrame(this.viewModel.activateManagerAbility(manager.id), this.time.now);
  }

  private handleManualAreaAction(area: ManagerArea, shaftId = 1): void {
    switch (area) {
      case "mineShaft":
        this.applyFrame(this.viewModel.manualMineAction(shaftId), this.time.now);
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
    
    if (this.miniUpgradeCards) {
      this.refreshMiniUpgradeCard("warehouse", this.miniUpgradeCards.warehouse, state);
      this.refreshMiniUpgradeCard("elevator", this.miniUpgradeCards.elevator, state);
    }
  }

  private refreshMiniUpgradeCard(target: "warehouse" | "elevator", card: MiniUpgradeCardUi, state: GameState): void {
    const preview = state.upgrades[target];
    
    const countSuffix = preview.isMaxed ? "" : ` x${preview.levelsToBuy}`;
    const baseTitle = target === "warehouse" ? "Warehouse" : "Elevator";
    card.titleText.setText(`${baseTitle}${countSuffix}`);

    card.levelText.setText(`Lvl ${preview.currentLevel}`);
    card.costText.setText(preview.isMaxed ? "MAX" : formatLargeNumber(preview.cost));
    fitTextToWidth(card.costText, 80, [11, 10, 9]);

    card.enabled = preview.canAfford && !preview.isMaxed;
    card.buttonBg.setAlpha(card.enabled ? 1 : 0.4);
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
    card.buttonZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
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

  private setMineShaftUpgradeEnabled(row: MineShaftRowUi, enabled: boolean): void {
    row.upgradeEnabled = enabled;
    row.panelFrame.setAlpha(enabled ? 1 : 0.88);
    row.levelBadge.setAlpha(enabled ? 1 : 0.76);
    row.upgradeButtonImage.setAlpha(enabled ? 1 : 0.7);
    row.upgradeButtonImage.setTint(enabled ? 0xffffff : 0x9c7f58);
    row.upgradeButtonText.setColor(enabled ? "#fff8de" : "#e0cfb3");
    row.costText.setColor(enabled ? "#5a3411" : "#a84a3a");
    row.buyCountText.setColor(enabled ? "#7b4e1d" : "#9f7e62");
    row.mainCurrentText.setAlpha(enabled ? 1 : 0.82);
    row.mainNextText.setAlpha(enabled ? 1 : 0.82);
    row.secondaryCurrentText.setAlpha(enabled ? 1 : 0.8);
    row.secondaryNextText.setAlpha(enabled ? 1 : 0.8);

    if (row.upgradeButtonZone.input) {
      row.upgradeButtonZone.input.cursor = enabled ? "pointer" : "default";
    }
  }

  private refreshSurfaceSidebarVisibility(): void {
    const visible = this.cameras.main.scrollY < SURFACE_SIDEBAR_HIDE_SCROLL_Y;

    // Buy mode bar (always visible)
    this.buyModeBarPanel.setVisible(true);
    this.buyModeBarLabel.setVisible(true);

    for (const button of this.buyModeButtons) {
      button.background.setVisible(true);
      button.label.setVisible(true);
      button.zone.setVisible(true);
      button.zone.setInteractive({ useHandCursor: true });
    }

    // Upgrade cards
    for (const card of Object.values(this.upgradeCards)) {
      const objects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible> = [
        card.frame,
        card.levelBadge,
        ...card.decorations,
        card.titleText,
        card.levelText,
        card.mainLabelText,
        card.mainCurrentText,
        card.mainNextText,
        card.secondaryLabelText,
        card.secondaryCurrentText,
        card.secondaryNextText,
        card.costText,
        card.buyCountText,
        card.buttonImage,
        card.buttonText,
        card.buttonZone
      ];

      objects.forEach((object) => object.setVisible(visible));

      if (visible && card.enabled) {
        card.buttonZone.setInteractive({ useHandCursor: true });
      } else {
        card.buttonZone.disableInteractive();
      }
    }

    if (this.miniUpgradeCards) {
      for (const card of Object.values(this.miniUpgradeCards)) {
        card.objects.forEach((object) => {
          if ("setVisible" in object && typeof (object as any).setVisible === "function") {
            (object as any).setVisible(!visible);
          }
        });

        if (!visible && card.enabled) {
          card.buttonZone.setInteractive({ useHandCursor: true });
        } else {
          card.buttonZone.disableInteractive();
        }
      }
    }
  }

  private setMineShaftRowMode(row: MineShaftRowUi, mode: "unlocked" | "locked" | "hidden"): void {
    const isUnlocked = mode === "unlocked";
    const isLocked = mode === "locked";
    const unlockedObjects = [
      row.backWall,
      row.floor,
      row.supports,
      row.pickupBox,
      row.coalDeposit,
      row.miner,
      row.storageText,
      row.routeText,
      row.panelFrame,
      row.levelBadge,
      row.titleText,
      row.levelText,
      row.mainLabelText,
      row.mainCurrentText,
      row.mainNextText,
      row.secondaryLabelText,
      row.secondaryCurrentText,
      row.secondaryNextText,
      row.costText,
      row.buyCountText,
      row.upgradeButtonImage,
      row.upgradeButtonText,
      row.upgradeButtonZone,
      ...row.decorations,
      row.managerFrame,
      row.managerTitleText,
      row.managerEmptySlotImage,
      row.managerPortraitImage,
      row.managerRankText,
      row.managerStatusText,
      row.managerTimerText,
      row.managerAbilityImage,
      row.managerAbilityZone,
      row.managerSlotZone,
      row.mineClickZone
    ];
    const lockedObjects = [
      row.lockedPlaceholderFrame,
      row.lockedTitleText,
      row.lockedHintText,
      row.unlockButtonImage,
      row.unlockButtonText,
      row.unlockButtonZone
    ];

    unlockedObjects.forEach((object) => object.setVisible(isUnlocked));
    lockedObjects.forEach((object) => object.setVisible(isLocked));
    row.mineClickOutline.setStrokeStyle(2, 0xf1c96b, 0.14);
    row.mineClickChip.setAlpha(0.74);

    if (mode === "hidden") {
      row.routeText.setVisible(false);
      row.managerAbilityZone.disableInteractive();
      row.managerSlotZone.disableInteractive();
      row.mineClickZone.disableInteractive();
      row.upgradeButtonZone.disableInteractive();
      row.unlockButtonZone.disableInteractive();
      return;
    }

    if (mode === "locked") {
      row.routeText.setVisible(false);
      row.managerAbilityZone.disableInteractive();
      row.managerSlotZone.disableInteractive();
      row.mineClickZone.disableInteractive();
      row.upgradeButtonZone.disableInteractive();
      row.unlockButtonZone.setInteractive({ useHandCursor: true });
      return;
    }

    if (mode === "unlocked") {
      row.managerAbilityZone.setInteractive({ useHandCursor: true });
      row.managerSlotZone.setInteractive({ useHandCursor: true });
      row.mineClickZone.setInteractive({ useHandCursor: true });
      row.upgradeButtonZone.setInteractive({ useHandCursor: true });
      row.unlockButtonZone.disableInteractive();
    }
  }

  private drawMineShaftPanelFrame(row: MineShaftRowUi): void {
    const top = this.getMineShaftPanelTop(row.shaftId);
    const x = UPGRADE_COLUMN_X;
    const width = UPGRADE_CARD_WIDTH;
    const height = UPGRADE_CARD_HEIGHT;

    row.panelFrame.clear();
    row.panelFrame.fillStyle(0x4b2b14, 0.98);
    row.panelFrame.fillRoundedRect(x, top, width, height, 16);
    row.panelFrame.fillStyle(0xf3d08d, 0.98);
    row.panelFrame.fillRoundedRect(x + 5, top + 5, width - 10, height - 10, 13);
    row.panelFrame.fillStyle(0x486470, 0.96);
    row.panelFrame.fillRoundedRect(x + 8, top + 8, width - 16, 28, 10);
    row.panelFrame.fillStyle(0xd8b168, 0.18);
    row.panelFrame.fillRoundedRect(x + 12, top + 112, width - 24, 20, 8);
    row.panelFrame.lineStyle(2, 0x693813, 0.92);
    row.panelFrame.strokeRoundedRect(x + 1, top + 1, width - 2, height - 2, 16);
    row.panelFrame.lineStyle(1, 0x74441a, 0.62);
    row.panelFrame.strokeLineShape(new Phaser.Geom.Line(x + 14, top + 52, x + width - 14, top + 52));
    row.panelFrame.strokeLineShape(new Phaser.Geom.Line(x + 14, top + 92, x + width - 14, top + 92));
  }

  private drawMineShaftManagerSlotFrame(
    row: MineShaftRowUi,
    automated: boolean,
    locked: boolean,
    activeAbility: boolean
  ): void {
    const fill = locked ? 0x1d2430 : automated ? 0x17382d : 0x273542;
    const innerFill = activeAbility ? 0x62bf7b : automated ? 0x2a6b50 : 0x5c7c87;
    const line = activeAbility ? 0xb5ff8d : automated ? 0x95f0bd : 0xf1c96b;

    row.managerFrame.clear();
    row.managerFrame.fillStyle(fill, locked ? 0.78 : 0.92);
    row.managerFrame.fillRoundedRect(row.managerSlotX, row.managerSlotY, MANAGER_SLOT_WIDTH, MANAGER_SLOT_HEIGHT, 14);
    row.managerFrame.fillStyle(innerFill, activeAbility ? 0.2 : 0.12);
    row.managerFrame.fillRoundedRect(row.managerSlotX + 5, row.managerSlotY + 5, MANAGER_SLOT_WIDTH - 10, MANAGER_SLOT_HEIGHT - 10, 10);
    row.managerFrame.lineStyle(1.5, line, locked ? 0.42 : 0.84);
    row.managerFrame.strokeRoundedRect(row.managerSlotX + 0.75, row.managerSlotY + 0.75, MANAGER_SLOT_WIDTH - 1.5, MANAGER_SLOT_HEIGHT - 1.5, 14);
    row.managerFrame.setAlpha(0.94);
  }

  private drawLockedShaftPlaceholder(row: MineShaftRowUi, canUnlock: boolean, previousUnlocked: boolean): void {
    const top = this.getShaftY(MINE_SHAFT_BACK_WALL_Y, row.shaftId) - LOCKED_SHAFT_PLACEHOLDER_HEIGHT / 2;
    const line = previousUnlocked ? (canUnlock ? 0x95f0bd : 0xf1c96b) : 0xa66d59;
    const fill = previousUnlocked ? 0x213440 : 0x33262a;

    row.lockedPlaceholderFrame.clear();
    row.lockedPlaceholderFrame.fillStyle(fill, 0.88);
    row.lockedPlaceholderFrame.fillRoundedRect(
      LOCKED_SHAFT_PLACEHOLDER_X,
      top,
      LOCKED_SHAFT_PLACEHOLDER_WIDTH,
      LOCKED_SHAFT_PLACEHOLDER_HEIGHT,
      16
    );
    row.lockedPlaceholderFrame.fillStyle(0x5c7c87, 0.14);
    row.lockedPlaceholderFrame.fillRoundedRect(
      LOCKED_SHAFT_PLACEHOLDER_X + 6,
      top + 6,
      LOCKED_SHAFT_PLACEHOLDER_WIDTH - 12,
      LOCKED_SHAFT_PLACEHOLDER_HEIGHT - 12,
      12
    );
    row.lockedPlaceholderFrame.lineStyle(2, line, 0.86);
    row.lockedPlaceholderFrame.strokeRoundedRect(
      LOCKED_SHAFT_PLACEHOLDER_X + 1,
      top + 1,
      LOCKED_SHAFT_PLACEHOLDER_WIDTH - 2,
      LOCKED_SHAFT_PLACEHOLDER_HEIGHT - 2,
      16
    );
  }

  private setWorldButtonEnabled(
    image: Phaser.GameObjects.Image,
    text: Phaser.GameObjects.Text,
    zone: Phaser.GameObjects.Zone,
    enabled: boolean,
    allowDisabledClick = false
  ): void {
    image.setAlpha(enabled ? 1 : 0.72);
    image.setTint(enabled ? 0xffffff : 0x8c6c58);
    text.setColor(enabled ? "#fff8de" : "#e3c7aa");

    if (enabled || allowDisabledClick) {
      zone.setInteractive({ useHandCursor: enabled });
    } else {
      zone.disableInteractive();
    }

    if (zone.input) {
      zone.input.cursor = enabled ? "pointer" : "default";
    }
  }

  private setWorldClickTargetEnabled(
    outline: Phaser.GameObjects.Rectangle,
    chip: Phaser.GameObjects.Text,
    zone: Phaser.GameObjects.Zone,
    enabled: boolean
  ): void {
    outline.setStrokeStyle(2, 0xf1c96b, enabled ? 0.14 : 0.08);
    chip.setAlpha(enabled ? 0.74 : 0.48);

    if (enabled) {
      zone.setInteractive({ useHandCursor: true });
    } else {
      zone.disableInteractive();
    }

    if (zone.input) {
      zone.input.cursor = enabled ? "pointer" : "default";
    }
  }

  private refreshElevatorShaftVisual(state: GameState): void {
    const deepestUnlockedShaftId = getDeepestUnlockedShaftId(state, this.totalMineShafts);
    const middleSegmentCount = this.getElevatorMiddleSegmentCount(deepestUnlockedShaftId);
    const middleSegmentHeight = this.getElevatorShaftMiddleSegmentHeight(deepestUnlockedShaftId);

    this.elevatorShaftTop
      .setDisplaySize(ELEVATOR_SHAFT_WIDTH, ELEVATOR_SHAFT_TOP_HEIGHT)
      .setY(this.getElevatorShaftTopY(deepestUnlockedShaftId));
    this.elevatorShaftBottom
      .setDisplaySize(ELEVATOR_SHAFT_WIDTH, ELEVATOR_SHAFT_BOTTOM_HEIGHT)
      .setY(this.getElevatorShaftBottomY(deepestUnlockedShaftId));

    this.elevatorShaftMiddleSegments.forEach((segment, index) => {
      segment
        .setDisplaySize(ELEVATOR_SHAFT_WIDTH, middleSegmentHeight)
        .setY(this.getElevatorShaftMiddleY(deepestUnlockedShaftId, index))
        .setVisible(index < middleSegmentCount);
    });

    this.updateWorldClickTarget(
      this.elevatorClickTarget,
      392,
      74,
      132,
      572 + this.getShaftOffset(deepestUnlockedShaftId)
    );
  }

  private processElevatorRouteEvents(state: GameState, events: SimulationEvent[]): void {
    if (events.length === 0) {
      return;
    }

    const routeStarted = events.find((event) => event.type === "elevatorRouteStarted");
    if (routeStarted !== undefined) {
      this.elevatorAnimationQueue = [];
      this.activeElevatorAnimation = undefined;
      this.elevatorVisualLoaded = false;

      for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
        this.shaftRouteFeedbackById[shaftId] = undefined;
      }
    }

    let queuedTargetY = this.activeElevatorAnimation?.targetY ?? this.elevatorAnimationQueue.at(-1)?.targetY ?? this.elevatorCabin.y;

    for (const event of events) {
      if (event.type === "elevatorArrivedAtShaft") {
        const targetY = this.getElevatorStopY(event.shaftId);
        this.elevatorAnimationQueue.push({
          targetY,
          durationMs: Math.abs(targetY - queuedTargetY) < 4 ? 0 : Math.max(180, Math.round(Math.abs(targetY - queuedTargetY) * 1.35)),
          holdMs: 80,
          loaded: event.carriedOre > 0
        });
        queuedTargetY = targetY;
      }

      if (event.type === "elevatorLoadedFromShaft") {
        this.shaftRouteFeedbackById[event.shaftId] = {
          text: `Load ${formatAmount(event.amount)}`,
          expiresAtSeconds: state.timeSeconds + 0.9
        };
        this.elevatorAnimationQueue.push({
          targetY: queuedTargetY,
          durationMs: 0,
          holdMs: 220,
          loaded: true
        });
      }

      if (event.type === "elevatorSkippedShaft") {
        this.shaftRouteFeedbackById[event.shaftId] = {
          text: event.reason === "no_ore" ? "Empty" : event.reason === "no_more_ore_below" ? "Return" : "Full",
          expiresAtSeconds: state.timeSeconds + 0.75
        };
      }

      if (event.type === "elevatorRouteFinished") {
        this.elevatorAnimationQueue.push({
          targetY: ELEVATOR_TOP_Y,
          durationMs: Math.max(260, Math.round(Math.abs(queuedTargetY - ELEVATOR_TOP_Y) * 1.1)),
          loaded: event.totalCollected > 0
        });
        queuedTargetY = ELEVATOR_TOP_Y;
      }
    }
  }

  private advanceElevatorAnimation(deltaMs: number): void {
    if (this.activeElevatorAnimation === undefined) {
      const nextStep = this.elevatorAnimationQueue.shift();

      if (nextStep === undefined) {
        return;
      }

      this.activeElevatorAnimation = {
        startY: this.elevatorCabin.y,
        targetY: nextStep.targetY,
        durationMs: Math.max(0, nextStep.durationMs),
        elapsedMs: 0,
        holdMs: Math.max(0, nextStep.holdMs ?? 0),
        holdElapsedMs: 0,
        loaded: nextStep.loaded ?? this.elevatorVisualLoaded
      };
      this.elevatorVisualLoaded = this.activeElevatorAnimation.loaded;
    }

    const active = this.activeElevatorAnimation;

    if (active.durationMs > 0 && active.elapsedMs < active.durationMs) {
      active.elapsedMs = Math.min(active.durationMs, active.elapsedMs + deltaMs);
      // Quantize the animation to 10 FPS (100ms steps) to match the game's aesthetic
      const visualElapsed = active.elapsedMs >= active.durationMs ? active.durationMs : Math.floor(active.elapsedMs / 100) * 100;
      const progress = Phaser.Math.Easing.Cubic.Out(visualElapsed / active.durationMs);
      this.elevatorCabin.setY(Phaser.Math.Linear(active.startY, active.targetY, progress));

      if (active.elapsedMs < active.durationMs) {
        return;
      }
    } else {
      this.elevatorCabin.setY(active.targetY);
    }

    if (active.holdMs > 0 && active.holdElapsedMs < active.holdMs) {
      active.holdElapsedMs = Math.min(active.holdMs, active.holdElapsedMs + deltaMs);
      if (active.holdElapsedMs < active.holdMs) {
        return;
      }
    }

    this.activeElevatorAnimation = undefined;

    if (this.elevatorAnimationQueue.length === 0) {
      this.elevatorVisualLoaded = false;
    }

    if (this.elevatorAnimationQueue.length > 0) {
      this.advanceElevatorAnimation(0);
    }
  }

  private pinUi<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T): T {
    gameObject.setScrollFactor(0);
    return gameObject;
  }

  private addManagerPanelObject<T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(
    container: Phaser.GameObjects.Container,
    gameObject: T
  ): T {
    container.add(this.pinUi(gameObject));
    return gameObject;
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

function formatProductionSummary(state: GameState): {
  boosted: { mine: string; elevator: string; warehouse: string };
  base: { mine: string; elevator: string; warehouse: string };
  isBoosted: boolean;
  bottleneckArea: "mine" | "elevator" | "warehouse";
} {
  const currentMineRate = Object.values(state.entities.mineShafts).reduce((sum, shaft) => {
    if (!shaft.isUnlocked) {
      return sum;
    }

    return sum + state.currentValues.mineShafts[shaft.shaftId].throughputPerSecond;
  }, 0);

  const baseMineRate = Object.values(state.entities.mineShafts).reduce((sum, shaft) => {
    if (!shaft.isUnlocked) {
      return sum;
    }

    return sum + state.baseValues.mineShafts[shaft.shaftId].throughputPerSecond;
  }, 0);

  const currentElevatorRate = state.currentValues.elevator.throughputPerSecond;
  const baseElevatorRate = state.baseValues.elevator.throughputPerSecond;

  const currentWarehouseRate = state.currentValues.warehouse.throughputPerSecond;
  const baseWarehouseRate = state.baseValues.warehouse.throughputPerSecond;

  const isBoosted =
    currentMineRate > baseMineRate + 0.001 ||
    currentElevatorRate > baseElevatorRate + 0.001 ||
    currentWarehouseRate > baseWarehouseRate + 0.001;

  // Find bottleneck (the one with the lowest throughput)
  let bottleneckArea: "mine" | "elevator" | "warehouse" = "mine";
  let minRate = currentMineRate;

  if (currentElevatorRate < minRate) {
    minRate = currentElevatorRate;
    bottleneckArea = "elevator";
  }
  if (currentWarehouseRate < minRate) {
    minRate = currentWarehouseRate;
    bottleneckArea = "warehouse";
  }

  return {
    boosted: {
      mine: `Mine ${formatRate(currentMineRate)}`,
      elevator: `Elevator ${formatRate(currentElevatorRate)}`,
      warehouse: `Warehouse ${formatRate(currentWarehouseRate)}`
    },
    base: {
      mine: `Mine ${formatRate(baseMineRate)}`,
      elevator: `Elevator ${formatRate(baseElevatorRate)}`,
      warehouse: `Warehouse ${formatRate(baseWarehouseRate)}`
    },
    isBoosted,
    bottleneckArea
  };
}

function formatRate(value: number): string {
  return `${formatAmount(value)}/s`;
}

function getDepthBackgroundKey(depthGroup: number): string {
  switch (depthGroup) {
    case 1:
      return "background-underground";
    case 2:
      return "background-underground-depth-2";
    case 3:
      return "background-underground-depth-3";
    case 4:
      return "background-underground-depth-4";
    case 5:
      return "background-underground-depth-5";
    default:
      return "background-underground-depth-6";
  }
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

function getAssignedManagerForShaft(state: GameState, shaftId: number): ManagerState | undefined {
  const assignedManagerId = state.managers.assignedManagerIdsByShaft[shaftId];

  if (assignedManagerId === null || assignedManagerId === undefined) {
    return undefined;
  }

  return state.managers.ownedManagers.find((manager) => manager.id === assignedManagerId && manager.isOwned);
}

function getDeepestUnlockedShaftId(state: GameState, totalMineShafts: number): number {
  for (let shaftId = totalMineShafts; shaftId >= 1; shaftId -= 1) {
    if (state.entities.mineShafts[shaftId]?.isUnlocked) {
      return shaftId;
    }
  }

  return 1;
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

function fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number, fontSizes: number[]): void {
  for (const fontSize of fontSizes) {
    text.setFontSize(fontSize);

    if (text.width <= maxWidth) {
      return;
    }
  }
}
