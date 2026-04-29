import Phaser from "phaser";

import mapWaterTextureUrl from "../../assets/backgrounds/map_water_texture.png";
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
import mapButtonIconUrl from "../../assets/ui/map_button_icon.png";
import navigationArrowIconUrl from "../../assets/ui/navigation_arrow_icon.png";
import oreIconUrl from "../../assets/ui/ore_icon.png";
import shopIconUrl from "../../assets/ui/shop_icon.png";
import superCashIconUrl from "../../assets/ui/supercash_icon.png";
import goldOreIconUrl from "../../assets/other mines/gold/ui/ore_icon.png";
import rubyOreIconUrl from "../../assets/other mines/ruby/ui/ore_icon.png";
import diamondOreIconUrl from "../../assets/other mines/diamond/ui/ore_icon.png";
import emeraldOreIconUrl from "../../assets/other mines/emerald/ui/ore_icon.png";
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
import mineShaftBackWallLevel2Url from "../../assets/world/mine_shaft_back_wall_level2.png";
import mineShaftBackWallLevel3Url from "../../assets/world/mine_shaft_back_wall_level3.png";
import mineShaftFloorUrl from "../../assets/world/mine_shaft_floor_level1.png";
import mineShaftPickupEmptyUrl from "../../assets/world/mine_shaft_pickup_box_empty_level1.png";
import mineShaftPickupFullUrl from "../../assets/world/mine_shaft_pickup_box_full_level1.png";
import mineShaftPickupSmallUrl from "../../assets/world/mine_shaft_pickup_box_small_level1.png";
import mineShaftSupportsUrl from "../../assets/world/mine_shaft_supports_level1.png";
import islandMapRegionsUrl from "../../assets/world/island_map_regions.png";
import warehouseBuildingUrl from "../../assets/world/warehouse_building_level1.png";
import warehousePileEmptyUrl from "../../assets/world/warehouse_storage_pile_empty.png";
import warehousePileFullUrl from "../../assets/world/warehouse_storage_pile_coal_full.png";
import warehousePileSmallUrl from "../../assets/world/warehouse_storage_pile_coal_small.png";
import {
  DEFAULT_ACTIVE_MINE_ID,
  EPSILON,
  getElevatorSpeedMultiplier,
  getDepthBlockadeSkipCost,
  getManagerHireCost,
  getValidAbilityTypesForArea,
  managerRanks,
  type BalanceConfig,
  type GameState,
  type ManagerAbilityType,
  type ManagerArea,
  type ManagerRank,
  type MineId,
  type ManagerState,
  type SaveGameRepository,
  type SimulationEvent,
  type UpgradeBuyMode,
  type UpgradeTarget
} from "../core/index.ts";
import { formatLargeNumber, formatCurrency, formatDuration, formatSignificantNumber } from "../core/formatters.ts";
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
const MAP_VIEW_DEPTH = 1000;
const SUPER_CASH_ANIMATION_DEPTH = MAP_VIEW_DEPTH + 180;
const TUTORIAL_STORAGE_KEY = "idle-miner.tutorial.v2";
const TUTORIAL_DEPTH = MAP_VIEW_DEPTH + 260;
const TUTORIAL_FOCUS_PADDING = 10;

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
const DEPTH_BLOCKADE_SKIP_ICON_SIZE = 24;
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
const MONEY_PANEL_GAP = 8;
const SUPER_CASH_PANEL_X = MONEY_PANEL_X;
const SUPER_CASH_PANEL_Y = MONEY_PANEL_Y + MONEY_PANEL_HEIGHT + MONEY_PANEL_GAP;
const SUPER_CASH_PANEL_WIDTH = MONEY_PANEL_WIDTH;
const SUPER_CASH_PANEL_HEIGHT = MONEY_PANEL_HEIGHT;
const SUPER_CASH_FLY_ICON_SIZE = 40;
const CURRENCY_PANEL_ICON_SIZE = 42;
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
const MAP_BUTTON_SIZE = 78;
const MAP_BUTTON_ICON_SIZE = 74;
const MAP_BUTTON_ICON_HOVER_SIZE = 76;
const MAP_BUTTON_X = MONEY_PANEL_X + MAP_BUTTON_SIZE / 2;
const MAP_BUTTON_Y = GAME_HEIGHT - MONEY_PANEL_Y - MAP_BUTTON_SIZE / 2;
const ALL_MANAGER_ABILITIES_BUTTON_GAP = MONEY_PANEL_GAP;
const ALL_MANAGER_ABILITIES_BUTTON_X = MAP_BUTTON_X;
const ALL_MANAGER_ABILITIES_BUTTON_Y = MAP_BUTTON_Y - MAP_BUTTON_SIZE - ALL_MANAGER_ABILITIES_BUTTON_GAP;
const ALL_MANAGER_ABILITIES_ICON_SIZE = 34;
const ALL_MANAGER_ABILITIES_ICON_HOVER_SIZE = 36;
const SHOP_BUTTON_X = MAP_BUTTON_X;
const SHOP_BUTTON_Y = ALL_MANAGER_ABILITIES_BUTTON_Y - MAP_BUTTON_SIZE - MONEY_PANEL_GAP;
const SHOP_ICON_SIZE = 54;
const NAVIGATION_ARROW_ICON_SIZE = 54;
const NAVIGATION_BUTTON_X = MAP_BUTTON_X;
const NAVIGATION_BUTTON_Y = SHOP_BUTTON_Y - MAP_BUTTON_SIZE - MONEY_PANEL_GAP;
const MAP_ISLAND_ASPECT_RATIO = 1402 / 1122;
const MAP_ISLAND_DISPLAY_HEIGHT = 670;
const MAP_ISLAND_DISPLAY_WIDTH = MAP_ISLAND_DISPLAY_HEIGHT * MAP_ISLAND_ASPECT_RATIO;
const MAP_ISLAND_CENTER_X = GAME_WIDTH / 2 - GAME_WIDTH / 6 + 36;
const MAP_ISLAND_CENTER_Y = GAME_HEIGHT / 2 + 18;
const MAP_MONEY_PANEL_X = MONEY_PANEL_X;
const MAP_MONEY_PANEL_Y = MONEY_PANEL_Y;
const MAP_MONEY_PANEL_WIDTH = MONEY_PANEL_WIDTH;
const MAP_MONEY_PANEL_HEIGHT = MONEY_PANEL_HEIGHT;
const MAP_SUPER_CASH_PANEL_X = MAP_MONEY_PANEL_X;
const MAP_SUPER_CASH_PANEL_Y = MAP_MONEY_PANEL_Y + MAP_MONEY_PANEL_HEIGHT + MONEY_PANEL_GAP;
const MAP_SUPER_CASH_PANEL_WIDTH = MAP_MONEY_PANEL_WIDTH;
const MAP_SUPER_CASH_PANEL_HEIGHT = MAP_MONEY_PANEL_HEIGHT;
const MAP_MINE_AREAS = [
  { key: "coal", label: "Kohlemine", color: 0x2c3034, rect: { x: 0.17, y: 0.07, width: 0.27, height: 0.27 } },
  { key: "gold", label: "Goldmine", color: 0xf3c94e, rect: { x: 0.52, y: 0.07, width: 0.30, height: 0.28 } },
  { key: "ruby", label: "Rubinmine", color: 0xdf3f45, rect: { x: 0.08, y: 0.34, width: 0.29, height: 0.31 } },
  { key: "diamond", label: "Diamantmine", color: 0x7ed7ff, rect: { x: 0.62, y: 0.33, width: 0.30, height: 0.33 } },
  { key: "emerald", label: "Smaragdmine", color: 0x34c867, rect: { x: 0.36, y: 0.59, width: 0.30, height: 0.30 } }
] as const;
const MAP_INFO_PANEL_MARGIN = 24;
const MAP_INFO_PANEL_X = 884;
const MAP_INFO_PANEL_Y = MAP_INFO_PANEL_MARGIN;
const MAP_INFO_PANEL_WIDTH = GAME_WIDTH - MAP_INFO_PANEL_X - MAP_INFO_PANEL_MARGIN;
const MAP_INFO_PANEL_HEIGHT = GAME_HEIGHT - MAP_INFO_PANEL_MARGIN * 2;
const MAP_INFO_ROW_HEIGHT = 108;
const MAP_INFO_ROW_GAP = 8;
const MAP_COLLECT_MARKER_WIDTH = 142;
const MAP_COLLECT_MARKER_HEIGHT = 42;
const MAP_LOCK_BUTTON_WIDTH = 158;
const MAP_LOCK_BUTTON_HEIGHT = 58;

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

const mineSpecificAssetManifest = {
  // Gold
  "background-underground-depth-2-gold": new URL(
    "../../assets/other mines/gold/backgrounds/background_underground_deph_2.png",
    import.meta.url
  ).href,
  "background-underground-depth-3-gold": new URL(
    "../../assets/other mines/gold/backgrounds/background_underground_deph_3.png",
    import.meta.url
  ).href,
  "background-underground-depth-4-gold": new URL(
    "../../assets/other mines/gold/backgrounds/background_underground_deph_4.png",
    import.meta.url
  ).href,
  "background-underground-depth-5-gold": new URL(
    "../../assets/other mines/gold/backgrounds/background_underground_deph_5.png",
    import.meta.url
  ).href,
  "background-underground-depth-6-gold": new URL(
    "../../assets/other mines/gold/backgrounds/background_underground_deph_6.png",
    import.meta.url
  ).href,
  "miner-carry-gold": new URL("../../assets/other mines/gold/characters/miner_worker_carry_bag_level1.png", import.meta.url)
    .href,
  "miner-drop-gold": new URL("../../assets/other mines/gold/characters/miner_worker_drop_bag_level1.png", import.meta.url)
    .href,
  "miner-pickaxe-02-gold": new URL(
    "../../assets/other mines/gold/characters/miner_worker_pickaxe_02_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-carry-gold": new URL(
    "../../assets/other mines/gold/characters/warehouse_worker_carry_gold_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-sell-gold": new URL(
    "../../assets/other mines/gold/characters/warehouse_worker_sell_level1.png",
    import.meta.url
  ).href,
  "elevator-cabin-loaded-gold": new URL(
    "../../assets/other mines/gold/world/elevator_cabin_loaded_gold_level1.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-gold": new URL("../../assets/other mines/gold/world/mine_shaft_back_wall_level1.png", import.meta.url)
    .href,
  "mine-shaft-back-wall-level2-gold": new URL(
    "../../assets/other mines/gold/world/mine_shaft_back_wall_level2.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-level3-gold": new URL(
    "../../assets/other mines/gold/world/mine_shaft_back_wall_level3.png",
    import.meta.url
  ).href,
  "mine-pickup-small-gold": new URL(
    "../../assets/other mines/gold/world/mine_shaft_pickup_box_small_level1.png",
    import.meta.url
  ).href,
  "mine-pickup-full-gold": new URL(
    "../../assets/other mines/gold/world/mine_shaft_pickup_box_full_level1.png",
    import.meta.url
  ).href,
  "ore-deposit-gold": new URL("../../assets/other mines/gold/world/gold_deposit_small_level1.png", import.meta.url).href,
  "warehouse-building-gold": new URL("../../assets/other mines/gold/world/warehouse_building_level1.png", import.meta.url)
    .href,
  "warehouse-pile-full-gold": new URL(
    "../../assets/other mines/gold/world/warehouse_storage_pile_gold_full.png",
    import.meta.url
  ).href,
  "warehouse-pile-small-gold": new URL(
    "../../assets/other mines/gold/world/warehouse_storage_pile_gold_small.png",
    import.meta.url
  ).href,

  // Ruby
  "background-surface-ruby": new URL("../../assets/other mines/ruby/backgrounds/background_surface_clean.png", import.meta.url)
    .href,
  "background-underground-ruby": new URL(
    "../../assets/other mines/ruby/backgrounds/background_underground_clean.png",
    import.meta.url
  ).href,
  "background-underground-depth-2-ruby": new URL(
    "../../assets/other mines/ruby/backgrounds/background_underground_deph_2.png",
    import.meta.url
  ).href,
  "background-underground-depth-3-ruby": new URL(
    "../../assets/other mines/ruby/backgrounds/background_underground_deph_3.png",
    import.meta.url
  ).href,
  "background-underground-depth-4-ruby": new URL(
    "../../assets/other mines/ruby/backgrounds/background_underground_deph_4.png",
    import.meta.url
  ).href,
  "background-underground-depth-5-ruby": new URL(
    "../../assets/other mines/ruby/backgrounds/background_underground_deph_5.png",
    import.meta.url
  ).href,
  "background-underground-depth-6-ruby": new URL(
    "../../assets/other mines/ruby/backgrounds/background_underground_deph_6.png",
    import.meta.url
  ).href,
  "miner-carry-ruby": new URL("../../assets/other mines/ruby/characters/miner_worker_carry_bag_level1.png", import.meta.url)
    .href,
  "miner-drop-ruby": new URL("../../assets/other mines/ruby/characters/miner_worker_drop_bag_level1.png", import.meta.url)
    .href,
  "miner-pickaxe-02-ruby": new URL(
    "../../assets/other mines/ruby/characters/miner_worker_pickaxe_02_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-carry-ruby": new URL(
    "../../assets/other mines/ruby/characters/warehouse_worker_carry_ruby_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-sell-ruby": new URL(
    "../../assets/other mines/ruby/characters/warehouse_worker_sell_level1.png",
    import.meta.url
  ).href,
  "elevator-cabin-loaded-ruby": new URL(
    "../../assets/other mines/ruby/world/elevator_cabin_loaded_ruby_level1.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-ruby": new URL("../../assets/other mines/ruby/world/mine_shaft_back_wall_level1.png", import.meta.url)
    .href,
  "mine-shaft-back-wall-level2-ruby": new URL(
    "../../assets/other mines/ruby/world/mine_shaft_back_wall_level2.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-level3-ruby": new URL(
    "../../assets/other mines/ruby/world/mine_shaft_back_wall_level3.png",
    import.meta.url
  ).href,
  "mine-pickup-small-ruby": new URL(
    "../../assets/other mines/ruby/world/mine_shaft_pickup_box_small_level1.png",
    import.meta.url
  ).href,
  "mine-pickup-full-ruby": new URL(
    "../../assets/other mines/ruby/world/mine_shaft_pickup_box_full_level1.png",
    import.meta.url
  ).href,
  "ore-deposit-ruby": new URL("../../assets/other mines/ruby/world/ruby_deposit_small_level1.png", import.meta.url).href,
  "warehouse-building-ruby": new URL("../../assets/other mines/ruby/world/warehouse_building_level1.png", import.meta.url)
    .href,
  "warehouse-pile-full-ruby": new URL(
    "../../assets/other mines/ruby/world/warehouse_storage_pile_ruby_full.png",
    import.meta.url
  ).href,
  "warehouse-pile-small-ruby": new URL(
    "../../assets/other mines/ruby/world/warehouse_storage_pile_ruby_small.png",
    import.meta.url
  ).href,

  // Diamond
  "background-surface-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_surface_clean.png",
    import.meta.url
  ).href,
  "background-underground-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_underground_clean.png",
    import.meta.url
  ).href,
  "background-underground-depth-2-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_underground_deph_2.png",
    import.meta.url
  ).href,
  "background-underground-depth-3-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_underground_deph_3.png",
    import.meta.url
  ).href,
  "background-underground-depth-4-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_underground_deph_4.png",
    import.meta.url
  ).href,
  "background-underground-depth-5-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_underground_deph_5.png",
    import.meta.url
  ).href,
  "background-underground-depth-6-diamond": new URL(
    "../../assets/other mines/diamond/backgrounds/background_underground_deph_6.png",
    import.meta.url
  ).href,
  "miner-carry-diamond": new URL(
    "../../assets/other mines/diamond/characters/miner_worker_carry_bag_level1.png",
    import.meta.url
  ).href,
  "miner-drop-diamond": new URL("../../assets/other mines/diamond/characters/miner_worker_drop_bag_level1.png", import.meta.url)
    .href,
  "miner-pickaxe-02-diamond": new URL(
    "../../assets/other mines/diamond/characters/miner_worker_pickaxe_02_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-carry-diamond": new URL(
    "../../assets/other mines/diamond/characters/warehouse_worker_carry_diamond_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-sell-diamond": new URL(
    "../../assets/other mines/diamond/characters/warehouse_worker_sell_level1.png",
    import.meta.url
  ).href,
  "elevator-cabin-loaded-diamond": new URL(
    "../../assets/other mines/diamond/world/elevator_cabin_loaded_diamond_level1.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-diamond": new URL(
    "../../assets/other mines/diamond/world/mine_shaft_back_wall_level1.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-level2-diamond": new URL(
    "../../assets/other mines/diamond/world/mine_shaft_back_wall_level2.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-level3-diamond": new URL(
    "../../assets/other mines/diamond/world/mine_shaft_back_wall_level3.png",
    import.meta.url
  ).href,
  "mine-pickup-small-diamond": new URL(
    "../../assets/other mines/diamond/world/mine_shaft_pickup_box_small_level1.png",
    import.meta.url
  ).href,
  "mine-pickup-full-diamond": new URL(
    "../../assets/other mines/diamond/world/mine_shaft_pickup_box_full_level1.png",
    import.meta.url
  ).href,
  "ore-deposit-diamond": new URL(
    "../../assets/other mines/diamond/world/diamond_deposit_small_level1.png",
    import.meta.url
  ).href,
  "warehouse-building-diamond": new URL(
    "../../assets/other mines/diamond/world/warehouse_building_level1.png",
    import.meta.url
  ).href,
  "warehouse-pile-full-diamond": new URL(
    "../../assets/other mines/diamond/world/warehouse_storage_pile_diamond_full.png",
    import.meta.url
  ).href,
  "warehouse-pile-small-diamond": new URL(
    "../../assets/other mines/diamond/world/warehouse_storage_pile_diamond_small.png",
    import.meta.url
  ).href,

  // Emerald
  "background-surface-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_surface_clean.png",
    import.meta.url
  ).href,
  "background-underground-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_underground_clean.png",
    import.meta.url
  ).href,
  "background-underground-depth-2-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_underground_deph_2.png",
    import.meta.url
  ).href,
  "background-underground-depth-3-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_underground_deph_3.png",
    import.meta.url
  ).href,
  "background-underground-depth-4-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_underground_deph_4.png",
    import.meta.url
  ).href,
  "background-underground-depth-5-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_underground_deph_5.png",
    import.meta.url
  ).href,
  "background-underground-depth-6-emerald": new URL(
    "../../assets/other mines/emerald/backgrounds/background_underground_deph_6.png",
    import.meta.url
  ).href,
  "miner-carry-emerald": new URL(
    "../../assets/other mines/emerald/characters/miner_worker_carry_bag_level1.png",
    import.meta.url
  ).href,
  "miner-drop-emerald": new URL(
    "../../assets/other mines/emerald/characters/miner_worker_drop_bag_level1.png",
    import.meta.url
  ).href,
  "miner-pickaxe-02-emerald": new URL(
    "../../assets/other mines/emerald/characters/miner_worker_pickaxe_02_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-carry-emerald": new URL(
    "../../assets/other mines/emerald/characters/warehouse_worker_carry_emerald_level1.png",
    import.meta.url
  ).href,
  "warehouse-worker-sell-emerald": new URL(
    "../../assets/other mines/emerald/characters/warehouse_worker_sell_level1.png",
    import.meta.url
  ).href,
  "elevator-cabin-loaded-emerald": new URL(
    "../../assets/other mines/emerald/world/elevator_cabin_loaded_emerald_level1.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-emerald": new URL(
    "../../assets/other mines/emerald/world/mine_shaft_back_wall_level1.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-level2-emerald": new URL(
    "../../assets/other mines/emerald/world/mine_shaft_back_wall_level2.png",
    import.meta.url
  ).href,
  "mine-shaft-back-wall-level3-emerald": new URL(
    "../../assets/other mines/emerald/world/mine_shaft_back_wall_level3.png",
    import.meta.url
  ).href,
  "mine-pickup-small-emerald": new URL(
    "../../assets/other mines/emerald/world/mine_shaft_pickup_box_small_level1.png",
    import.meta.url
  ).href,
  "mine-pickup-full-emerald": new URL(
    "../../assets/other mines/emerald/world/mine_shaft_pickup_box_full_level1.png",
    import.meta.url
  ).href,
  "ore-deposit-emerald": new URL(
    "../../assets/other mines/emerald/world/emerald_deposit_small_level1.png",
    import.meta.url
  ).href,
  "warehouse-building-emerald": new URL(
    "../../assets/other mines/emerald/world/warehouse_building_level1.png",
    import.meta.url
  ).href,
  "warehouse-pile-full-emerald": new URL(
    "../../assets/other mines/emerald/world/warehouse_storage_pile_emerald_full.png",
    import.meta.url
  ).href,
  "warehouse-pile-small-emerald": new URL(
    "../../assets/other mines/emerald/world/warehouse_storage_pile_emerald_small.png",
    import.meta.url
  ).href
} satisfies Record<string, string>;

const coreAssetManifest = {
  "map-water-texture": mapWaterTextureUrl,
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
  "mine-shaft-back-wall-level2": mineShaftBackWallLevel2Url,
  "mine-shaft-back-wall-level3": mineShaftBackWallLevel3Url,
  "mine-shaft-supports": mineShaftSupportsUrl,
  "mine-pickup-empty": mineShaftPickupEmptyUrl,
  "mine-pickup-small": mineShaftPickupSmallUrl,
  "mine-pickup-full": mineShaftPickupFullUrl,
  "island-map-regions": islandMapRegionsUrl,
  "ore-deposit": coalDepositUrl,
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
  "map-button-icon": mapButtonIconUrl,
  "navigation-arrow-icon": navigationArrowIconUrl,
  "ore-icon": oreIconUrl,
  "shop-icon": shopIconUrl,
  "supercash-icon": superCashIconUrl,
  "ore-icon-coal": oreIconUrl,
  "ore-icon-gold": goldOreIconUrl,
  "ore-icon-ruby": rubyOreIconUrl,
  "ore-icon-diamond": diamondOreIconUrl,
  "ore-icon-emerald": emeraldOreIconUrl,
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
  "ability-cost-reduction": abilityCostReductionUrl,
} satisfies Record<string, string>;

export const assetManifest = {
  ...coreAssetManifest,
  ...mineSpecificAssetManifest
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

interface ManagerPanelButtonUi {
  image: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
  interactive: boolean;
  enabledTint?: number;
}

interface ManagerPanelHireOfferUi {
  area: ManagerArea;
  costText: Phaser.GameObjects.Text;
  button: ManagerPanelButtonUi;
}

interface ManagerPanelAssignedUi {
  managerId: string;
  timerText: Phaser.GameObjects.Text;
  abilityIcon: Phaser.GameObjects.Image;
}

interface AllManagerAbilitiesButtonUi {
  background: Phaser.GameObjects.Graphics;
  icons: Phaser.GameObjects.Image[];
  zone: Phaser.GameObjects.Zone;
  enabled: boolean;
}

interface ShopButtonUi {
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  zone: Phaser.GameObjects.Zone;
}

interface NavigationButtonUi {
  background: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  zone: Phaser.GameObjects.Zone;
  direction: "up" | "down";
}

interface MapMineAreaUi {
  mineId: MineId;
  bounds: Phaser.Geom.Rectangle;
  lockContainer: Phaser.GameObjects.Container;
  lockBg: Phaser.GameObjects.Image;
  lockText: Phaser.GameObjects.Text;
  priceText: Phaser.GameObjects.Text;
  lockZone: Phaser.GameObjects.Zone;
  markerContainer: Phaser.GameObjects.Container;
  markerBg: Phaser.GameObjects.Graphics;
  markerText: Phaser.GameObjects.Text;
  markerZone: Phaser.GameObjects.Zone;
  areaZone: Phaser.GameObjects.Zone;
}

interface MapDetailPanelUi {
  frame: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  rows: MapMineInfoRowUi[];
}

interface MapMineInfoRowUi {
  mineId: MineId;
  frame: Phaser.GameObjects.Graphics;
  oreIcon: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  statusText: Phaser.GameObjects.Text;
  productionText: Phaser.GameObjects.Text;
  prestigeText: Phaser.GameObjects.Text;
  collectText: Phaser.GameObjects.Text;
  costIcon: Phaser.GameObjects.Image;
  costText: Phaser.GameObjects.Text;
  prestigeButtonImage: Phaser.GameObjects.Image;
  prestigeButtonText: Phaser.GameObjects.Text;
  prestigeButtonZone: Phaser.GameObjects.Zone;
}

interface ManagerPanelContentContainer extends Phaser.GameObjects.Container {
  isManagerPanelContentContainer?: true;
  contentAreaY?: number;
  contentAreaHeight?: number;
  totalContentHeight?: number;
  scrollInteractiveZones?: Phaser.GameObjects.Zone[];
}

interface ManagerPanelScrollbar extends Phaser.GameObjects.Graphics {
  isScrollbar?: true;
  scrollbarHeight?: number;
}

interface WorldClickTargetUi {
  zone: Phaser.GameObjects.Zone;
  outline: Phaser.GameObjects.Rectangle;
  chip: Phaser.GameObjects.Text;
}

type TutorialStepId =
  | "manualMine"
  | "manualElevator"
  | "manualWarehouse"
  | "mineLevel2"
  | "managerUnlock"
  | "managerCash"
  | "managerSlot"
  | "managerHire"
  | "managerAssign"
  | "managerOtherAreas"
  | "managerAbility"
  | "managerAllBoost";

type TutorialBlockingActionStep = Extract<TutorialStepId, "manualMine" | "manualElevator" | "manualWarehouse">;

interface TutorialOverlayUi {
  masks: Phaser.GameObjects.Rectangle[];
  outline: Phaser.GameObjects.Rectangle;
  focusZone: Phaser.GameObjects.Zone;
  panel: Phaser.GameObjects.Graphics;
  titleText: Phaser.GameObjects.Text;
  bodyText: Phaser.GameObjects.Text;
  okButton: Phaser.GameObjects.Graphics;
  okButtonText: Phaser.GameObjects.Text;
}

interface TutorialTarget {
  rect: Phaser.Geom.Rectangle;
  isWorldSpace: boolean;
}

interface MineShaftRowUi {
  shaftId: number;
  mode?: "unlocked" | "locked" | "hidden";
  unlockedObjects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible>;
  lockedObjects: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible>;
  panelFrameDrawn?: boolean;
  managerFrameCacheKey?: string;
  lockedPlaceholderCacheKey?: string;
  staticStateKey?: string;
  lockedStateKey?: string;
  managerSlotX: number;
  managerSlotY: number;
  backWall: Phaser.GameObjects.Image;
  floor: Phaser.GameObjects.Image;
  supports: Phaser.GameObjects.Image;
  pickupBox: Phaser.GameObjects.Image;
  oreDeposit: Phaser.GameObjects.Image;
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
  skipCostIcon: Phaser.GameObjects.Image;
  buttonText: Phaser.GameObjects.Text;
  buttonZone: Phaser.GameObjects.Zone;
}

interface ElevatorAnimationStep {
  targetY: number;
  durationMs: number;
  holdMs?: number;
  loaded?: boolean;
}

interface CurrencyPanelUi {
  frame: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  text: Phaser.GameObjects.Text;
}

interface ScreenPoint {
  x: number;
  y: number;
}

type BoundedScrollObject = Phaser.GameObjects.GameObject
  & Phaser.GameObjects.Components.ScrollFactor
  & { getBounds(): Phaser.Geom.Rectangle };

export class MineScene extends Phaser.Scene {
  private readonly balance: BalanceConfig;
  private readonly viewModel: SimulationViewModel;
  private readonly totalMineShafts: number;
  private readonly worldHeight: number;

  private mineShaftRows: Record<number, MineShaftRowUi> = {};
  private depthSections: DepthSectionUi[] = [];
  private depthBlockades: DepthBlockadeUi[] = [];
  private surfaceBackground!: Phaser.GameObjects.Image;
  private warehouseBuilding!: Phaser.GameObjects.Image;
  private elevatorShaftTop!: Phaser.GameObjects.Image;
  private elevatorShaftBottom!: Phaser.GameObjects.Image;
  private elevatorShaftMiddleSegments: Phaser.GameObjects.Image[] = [];
  private elevatorClickTarget!: WorldClickTargetUi;
  private warehouseClickTarget!: WorldClickTargetUi;
  private elevatorCabin!: Phaser.GameObjects.Image;
  private flowOreIcon!: Phaser.GameObjects.Image;
  private warehouseWorker!: Phaser.GameObjects.Image;
  private warehousePile!: Phaser.GameObjects.Image;
  private warehouseFeedback!: Phaser.GameObjects.Text;
  private commandFeedback!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private superCashPanel!: CurrencyPanelUi;
  private superCashText!: Phaser.GameObjects.Text;
  private productionTextsBoosted: Phaser.GameObjects.Text[] = [];
  private productionTextsBase: Phaser.GameObjects.Text[] = [];
  private buyModeButtons: BuyModeButtonUi[] = [];
  private buyModeBarPanel!: Phaser.GameObjects.Graphics;
  private buyModeBarLabel!: Phaser.GameObjects.Text;
  private upgradeCards!: Record<"warehouse" | "elevator", UpgradeCardUi>;
  private miniUpgradeCards: Record<"warehouse" | "elevator", MiniUpgradeCardUi> | null = null;
  private managerSlots!: Record<"warehouse" | "elevator", ManagerSlotUi>;
  private allManagerAbilitiesButton: AllManagerAbilitiesButtonUi | undefined;
  private shopButton: ShopButtonUi | undefined;
  private navigationButton: NavigationButtonUi | undefined;
  private shopSoonModalObjects: Phaser.GameObjects.GameObject[] | undefined;
  private saveRepository?: SaveGameRepository;
  private activeManagerPanelArea: ManagerArea | null = null;
  private activeManagerPanelShaftId: number | null = null;
  private managerPanel: Phaser.GameObjects.Container | undefined;
  private managerPanelScrollY = 0;
  private managerPanelHireOfferUi: ManagerPanelHireOfferUi[] = [];
  private managerPanelAssignedUi: ManagerPanelAssignedUi | null = null;
  private managerPanelAssignButtonUi: ManagerPanelButtonUi | null = null;
  private mapViewContainer: Phaser.GameObjects.Container | undefined;
  private mapMoneyText: Phaser.GameObjects.Text | undefined;
  private mapSuperCashPanel: CurrencyPanelUi | undefined;
  private mapSuperCashText: Phaser.GameObjects.Text | undefined;
  private mapMineAreaUi: MapMineAreaUi[] = [];
  private mapDetailPanel: MapDetailPanelUi | undefined;
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
  private appliedMineVisualId: MineId | null = null;
  private loadingMineAssets: MineId | null = null;
  private pendingFrameAfterMineAssetLoad: { frame: SimulationFrame; time: number } | undefined;
  private renderedElevatorShaftId = -1;
  private pendingSuperCashAnimationSource: ScreenPoint | undefined;
  private displayedSuperCashValue: number | undefined;
  private activeSuperCashAnimationTweens = 0;
  private activeSuperCashAnimationIcons = new Set<Phaser.GameObjects.Image>();
  private tutorialOverlay: TutorialOverlayUi | undefined;
  private tutorialProgressIndex = 0;
  private tutorialCompleted = false;
  private tutorialPendingActionStep: TutorialBlockingActionStep | null = null;
  private tutorialManagerUnlockAcknowledged = false;
  private tutorialCompletionPending = false;
  private managerBoostHintShown = false;
  private managerBoostHintActive = false;
  private readonly hasExistingSaveGame: boolean;

  constructor(balance: BalanceConfig, saveRepository?: SaveGameRepository) {
    super("MineScene");
    this.balance = balance;
    this.totalMineShafts = Math.max(1, balance.mineShaft.totalMineShafts);
    this.worldHeight = this.computeWorldHeight(this.totalMineShafts);
    this.saveRepository = saveRepository;
    this.hasExistingSaveGame = saveRepository?.load() !== null;
    this.viewModel = new SimulationViewModel(balance, { 
      saveRepository,
      isDebug: IS_DEBUG
    });
    this.loadTutorialProgress();

    if (this.hasExistingSaveGame) {
      this.tutorialCompleted = true;
      this.tutorialProgressIndex = tutorialStepOrder.length;
      this.tutorialManagerUnlockAcknowledged = true;
      this.saveTutorialProgress();
    }
  }

  preload(): void {
    this.queueAssetManifest(coreAssetManifest);
    this.queueMineSpecificAssets(this.viewModel.getInitialFrame().state.activeMineId);
  }

  private queueAssetManifest(manifest: Record<string, string>): void {
    Object.entries(manifest).forEach(([key, url]) => {
      if (!this.textures.exists(key)) {
        this.load.image(key, url);
      }
    });
  }

  private queueMineSpecificAssets(mineId: MineId): void {
    this.queueAssetManifest(Object.fromEntries(getMineSpecificAssetEntries(mineId)));
  }

  private areMineSpecificAssetsLoaded(mineId: MineId): boolean {
    return getMineSpecificAssetEntries(mineId).every(([key]) => this.textures.exists(key));
  }

  private applyFrameWhenMineAssetsReady(frame: SimulationFrame, time: number): void {
    const mineId = frame.state.activeMineId;

    if (this.areMineSpecificAssetsLoaded(mineId)) {
      this.applyFrame(frame, time);
      return;
    }

    this.pendingFrameAfterMineAssetLoad = { frame, time };

    if (this.loadingMineAssets !== null) {
      return;
    }

    this.loadingMineAssets = mineId;
    this.queueMineSpecificAssets(mineId);
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loadingMineAssets = null;
      const pendingFrame = this.pendingFrameAfterMineAssetLoad;
      this.pendingFrameAfterMineAssetLoad = undefined;

      if (pendingFrame !== undefined) {
        this.applyFrameWhenMineAssetsReady(pendingFrame.frame, this.time.now);
      }
    });
    this.load.start();
  }

  create(): void {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);
    const initialFrame = this.viewModel.getInitialFrame();
    this.latestState = initialFrame.state;
    
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
    this.applyFrame(initialFrame, 0);
    this.advanceElevatorAnimation(0);
    this.updateTutorialOverlay(initialFrame.state);

    if (this.viewModel.offlineProgressResult !== null) {
      this.handleActiveMineOfflineCashAfterProgress();
      this.viewModel.flushSave();
    }
  }

  update(time: number, delta: number): void {
    const frame = this.viewModel.update(delta / 1000);
    this.applyFrameWhenMineAssetsReady(frame, time);
    this.advanceElevatorAnimation(delta);
  }

  private handleActiveMineOfflineCashAfterProgress(): void {
    const mineId = this.getActiveMineId();
    const mine = this.latestState?.mines[mineId];

    if (mine === undefined || !mine.isUnlocked || mine.pendingOfflineCash <= Number.EPSILON) {
      return;
    }

    if (mine.pendingOfflineSeconds < 60) {
      this.collectShortActiveMineOfflineCash();
      return;
    }

    this.showMineOfflineCashModal(mineId, {
      offlineSeconds: mine.pendingOfflineSeconds,
      moneyEarned: mine.pendingOfflineCash,
      oreSold: mine.pendingOfflineOreSold
    });
  }

  private collectShortActiveMineOfflineCash(): boolean {
    const mineId = this.getActiveMineId();
    const mine = this.latestState?.mines[mineId];

    if (
      mine === undefined ||
      !mine.isUnlocked ||
      mine.pendingOfflineCash <= Number.EPSILON ||
      mine.pendingOfflineSeconds >= 60
    ) {
      return false;
    }

    this.applyFrame(this.viewModel.collectMineOfflineCash(mineId), this.time.now);
    this.viewModel.flushSave();
    return true;
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
      if (result !== null) {
        this.applyFrame(this.viewModel.getInitialFrame(), this.time.now);
        this.handleActiveMineOfflineCashAfterProgress();
      }
    }
  };

  private getActiveMineId(): MineId {
    return this.latestState?.activeMineId ?? DEFAULT_ACTIVE_MINE_ID;
  }

  private refreshActiveMineTextures(state: GameState): void {
    if (this.appliedMineVisualId === state.activeMineId) {
      return;
    }

    this.appliedMineVisualId = state.activeMineId;
    this.surfaceBackground.setTexture(getMineTextureKey(state.activeMineId, "background-surface"));
    this.warehouseBuilding.setTexture(getMineTextureKey(state.activeMineId, "warehouse-building"));
    this.flowOreIcon.setTexture(getMapOreIconKey(state.activeMineId));

    for (const section of this.depthSections) {
      section.background
        .setTexture(getDepthBackgroundKey(section.depthGroup, state.activeMineId))
        .setTint(getDepthBackgroundTint(section.depthGroup, state.activeMineId));
    }

    for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
      const row = this.mineShaftRows[shaftId];
      row.backWall.setTexture(getMineBackWallTextureKey(state.activeMineId, shaftId));
      row.oreDeposit.setTexture(getMineTextureKey(state.activeMineId, "ore-deposit"));
    }
  }

  private createWorld(): void {
    const activeMineId = this.getActiveMineId();
    this.surfaceBackground = this.add
      .image(GAME_WIDTH / 2, SURFACE_HEIGHT / 2, getMineTextureKey(activeMineId, "background-surface"))
      .setDisplaySize(GAME_WIDTH, SURFACE_HEIGHT);
    this.depthSections = [];

    const totalDepthGroups = this.getTotalDepthGroups();

    for (let depthGroup = 1; depthGroup <= totalDepthGroups; depthGroup += 1) {
      const topY = this.getDepthGroupTopY(depthGroup);
      const bottomY = this.getDepthGroupBottomY(depthGroup);
      const height = Math.max(1, bottomY - topY);
      const background = this.add
        .image(GAME_WIDTH / 2, topY + height / 2, getDepthBackgroundKey(depthGroup, activeMineId))
        .setDisplaySize(DEPTH_SECTION_WIDTH, height)
        .setTint(getDepthBackgroundTint(depthGroup, activeMineId))
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
    this.warehouseBuilding = this.add
      .image(WAREHOUSE_BUILDING_X, WAREHOUSE_BUILDING_Y, getMineTextureKey(this.getActiveMineId(), "warehouse-building"))
      .setDisplaySize(176, 144);
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

    const initialState = this.latestState ?? this.viewModel.getInitialFrame().state;

    for (const blockade of Object.values(initialState.blockades)) {
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
      const skipCostIcon = this.add
        .image(DEPTH_BLOCKADE_CENTER_X - 36, centerY + 24, "supercash-icon")
        .setDisplaySize(DEPTH_BLOCKADE_SKIP_ICON_SIZE, DEPTH_BLOCKADE_SKIP_ICON_SIZE)
        .setDepth(UI_TEXT_DEPTH + 2)
        .setVisible(false);
      const buttonZone = this.add
        .zone(DEPTH_BLOCKADE_CENTER_X, centerY + 24, DEPTH_BLOCKADE_BUTTON_WIDTH, DEPTH_BLOCKADE_BUTTON_HEIGHT)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(UI_INTERACTIVE_DEPTH + 1)
        .setVisible(false);

      buttonZone.on("pointerdown", () => {
        const currentBlockade = this.latestState?.blockades[blockade.blockadeId];
        const frame = currentBlockade?.isRemoving
          ? this.viewModel.skipDepthBlockade(blockade.blockadeId)
          : this.viewModel.removeDepthBlockade(blockade.blockadeId);

        this.applyFrame(frame, this.time.now);
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
        skipCostIcon,
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
    this.createMapButton();
    this.createAllManagerAbilitiesButton();
    this.createShopButton();
    this.createNavigationButton();
    this.createManagerSlots();
    this.setupInputScroll();
  }

  private setupInputScroll(): void {
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (this.mapViewContainer !== undefined) {
        return;
      }

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
      this.tweens.killTweensOf(camera);
      camera.scrollY = Phaser.Math.Clamp(camera.scrollY + deltaY * CAMERA_SCROLL_STEP, 0, maxScroll);
      this.refreshNavigationButton();
    });
  }

  private scrollManagerPanel(deltaY: number): void {
    if (!this.managerPanel) {
      return;
    }

    const contentContainer = this.getManagerPanelContentContainer();

    if (!contentContainer) {
      return;
    }

    const contentAreaHeight = contentContainer.contentAreaHeight ?? (MANAGER_PANEL_HEIGHT - 72);
    const contentAreaY = contentContainer.contentAreaY ?? (MANAGER_PANEL_Y + 66);
    const totalContentHeight = contentContainer.totalContentHeight ?? 0;
    const maxScroll = Math.max(0, totalContentHeight - contentAreaHeight);

    if (maxScroll <= 0) {
      return;
    }

    this.managerPanelScrollY = Phaser.Math.Clamp(this.managerPanelScrollY - deltaY, -maxScroll, 0);
    contentContainer.setY(this.managerPanelScrollY);
    this.refreshManagerPanelScrollableInteractions(contentContainer);

    const scrollbar = this.managerPanel.list.find(
      (child) => child instanceof Phaser.GameObjects.Graphics && (child as { isScrollbar?: boolean }).isScrollbar
    ) as ManagerPanelScrollbar | undefined;

    if (!scrollbar) {
      return;
    }

    const scrollPercent = -this.managerPanelScrollY / maxScroll;
    const scrollbarHeight = scrollbar.scrollbarHeight ?? 0;
    scrollbar.setY(contentAreaY + 5 + scrollPercent * (contentAreaHeight - scrollbarHeight - 10));
  }

  private getManagerPanelContentContainer(): ManagerPanelContentContainer | undefined {
    return this.managerPanel?.list.find(
      (child): child is ManagerPanelContentContainer =>
        child instanceof Phaser.GameObjects.Container && (child as ManagerPanelContentContainer).isManagerPanelContentContainer === true
    );
  }

  private refreshManagerPanelScrollableInteractions(contentContainer: ManagerPanelContentContainer): void {
    const zones = contentContainer.scrollInteractiveZones ?? [];
    const viewportTop = contentContainer.contentAreaY ?? (MANAGER_PANEL_Y + 66);
    const viewportBottom = viewportTop + (contentContainer.contentAreaHeight ?? (MANAGER_PANEL_HEIGHT - 72));

    for (const zone of zones) {
      const zoneTop = contentContainer.y + zone.y - zone.height * zone.originY;
      const zoneBottom = zoneTop + zone.height;
      const isInsideViewport = zoneTop >= viewportTop - 0.5 && zoneBottom <= viewportBottom + 0.5;

      if (isInsideViewport) {
        if (zone.input) {
          zone.input.enabled = true;
          zone.input.cursor = "pointer";
        } else {
          zone.setInteractive({ useHandCursor: true });
        }
      } else {
        zone.disableInteractive();
      }
    }
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

  private isMineShaftRowNearViewport(shaftId: number): boolean {
    const rowCenterY = this.getShaftY(MINE_SHAFT_BACK_WALL_Y, shaftId);
    const preloadMargin = MINE_SHAFT_VERTICAL_SPACING;
    const viewportTop = this.cameras.main.scrollY - preloadMargin;
    const viewportBottom = this.cameras.main.scrollY + GAME_HEIGHT + preloadMargin;

    return rowCenterY + MINE_SHAFT_VERTICAL_SPACING >= viewportTop && rowCenterY - MINE_SHAFT_VERTICAL_SPACING <= viewportBottom;
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
      .image(
        MINE_SHAFT_CENTER_X,
        backWallY + MINE_SHAFT_BACK_WALL_VISUAL_OFFSET_Y,
        getMineBackWallTextureKey(this.getActiveMineId(), shaftId)
      )
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
    const oreDeposit = this.add
      .image(COAL_DEPOSIT_X, depositY, getMineTextureKey(this.getActiveMineId(), "ore-deposit"))
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

    const rowUi: MineShaftRowUi = {
      shaftId,
      unlockedObjects: [
        backWall,
        floor,
        supports,
        pickupBox,
        oreDeposit,
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
        ...decorations,
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
        mineClickZone
      ],
      lockedObjects: [
        lockedPlaceholderFrame,
        lockedTitleText,
        lockedHintText,
        unlockButtonImage,
        unlockButtonText,
        unlockButtonZone
      ],
      managerSlotX,
      managerSlotY,
      backWall,
      floor,
      supports,
      pickupBox,
      oreDeposit,
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

    upgradeButtonZone.on("pointerover", () => {
      if (rowUi.upgradeEnabled) {
        upgradeButtonImage.setTint(0xcccccc);
      }
    });

    upgradeButtonZone.on("pointerout", () => {
      upgradeButtonImage.setTint(rowUi.upgradeEnabled ? 0xffffff : 0x9c7f58);
    });

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
      this.queueSuperCashAnimationSourceFrom(rowUi.upgradeButtonZone);
      this.applyFrame(this.viewModel.upgradeMineShaft(shaftId), this.time.now);
    });

    unlockButtonZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.applyFrame(this.viewModel.unlockMineShaft(shaftId), this.time.now);
    });

    return rowUi;
  }

  private createTopBar(): void {
    const moneyPanel = this.createPinnedCurrencyPanel(
      MONEY_PANEL_X,
      MONEY_PANEL_Y,
      MONEY_PANEL_WIDTH,
      MONEY_PANEL_HEIGHT,
      "coin-icon",
      formatMoney
    );
    this.moneyText = moneyPanel.text;

    this.superCashPanel = this.createPinnedCurrencyPanel(
      SUPER_CASH_PANEL_X,
      SUPER_CASH_PANEL_Y,
      SUPER_CASH_PANEL_WIDTH,
      SUPER_CASH_PANEL_HEIGHT,
      "supercash-icon",
      formatSuperCash
    );
    this.superCashText = this.superCashPanel.text;
    this.setCurrencyPanelVisible(this.superCashPanel, this.isSuperCashVisible(this.latestState));

    this.createBarPanel(FLOW_PANEL_X, FLOW_PANEL_Y, FLOW_PANEL_WIDTH, FLOW_PANEL_HEIGHT);
    this.flowOreIcon = this.pinUi(
      this.add
        .image(FLOW_PANEL_X + 24, FLOW_PANEL_Y + FLOW_PANEL_HEIGHT / 2, getMapOreIconKey(this.getActiveMineId()))
        .setDisplaySize(40, 40)
        .setDepth(PINNED_UI_TEXT_DEPTH)
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
    const x = GAME_WIDTH - width - 20;
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

  private createMapButton(): void {
    const buttonLeft = MAP_BUTTON_X - MAP_BUTTON_SIZE / 2;
    const buttonTop = MAP_BUTTON_Y - MAP_BUTTON_SIZE / 2;
    const buttonBg = this.pinUi(
      this.drawRoundedPanel(buttonLeft, buttonTop, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE, {
        fill: 0xf4cb7d,
        fillAlpha: 0.98,
        innerFill: 0xffdf9a,
        innerAlpha: 0.52,
        line: 0x613212,
        radius: 18
      }).setDepth(PINNED_UI_PANEL_DEPTH + 1).setAlpha(0.96)
    );
    const buttonIcon = this.pinUi(
      this.add
        .image(MAP_BUTTON_X, MAP_BUTTON_Y, "map-button-icon")
        .setDisplaySize(MAP_BUTTON_ICON_SIZE, MAP_BUTTON_ICON_SIZE)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const buttonZone = this.pinUi(
      this.add
        .zone(MAP_BUTTON_X, MAP_BUTTON_Y, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );

    buttonZone.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.openMapView();
      }
    );

    buttonZone.on("pointerover", () => {
      buttonBg.setAlpha(1);
      buttonIcon.setDisplaySize(MAP_BUTTON_ICON_HOVER_SIZE, MAP_BUTTON_ICON_HOVER_SIZE);
    });

    buttonZone.on("pointerout", () => {
      buttonBg.setAlpha(0.96);
      buttonIcon.setDisplaySize(MAP_BUTTON_ICON_SIZE, MAP_BUTTON_ICON_SIZE);
    });
  }

  private createAllManagerAbilitiesButton(): void {
    const buttonLeft = ALL_MANAGER_ABILITIES_BUTTON_X - MAP_BUTTON_SIZE / 2;
    const buttonTop = ALL_MANAGER_ABILITIES_BUTTON_Y - MAP_BUTTON_SIZE / 2;
    const buttonBg = this.pinUi(
      this.drawRoundedPanel(buttonLeft, buttonTop, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE, {
        fill: 0x213b46,
        fillAlpha: 0.98,
        innerFill: 0x5c7c87,
        innerAlpha: 0.22,
        line: 0xf1c96b,
        radius: 18
      }).setDepth(PINNED_UI_PANEL_DEPTH + 1).setAlpha(0.72)
    );
    const iconConfigs: Array<{ area: ManagerArea; x: number; y: number }> = [
      { area: "mineShaft", x: ALL_MANAGER_ABILITIES_BUTTON_X, y: ALL_MANAGER_ABILITIES_BUTTON_Y - 17 },
      { area: "elevator", x: ALL_MANAGER_ABILITIES_BUTTON_X - 18, y: ALL_MANAGER_ABILITIES_BUTTON_Y + 16 },
      { area: "warehouse", x: ALL_MANAGER_ABILITIES_BUTTON_X + 18, y: ALL_MANAGER_ABILITIES_BUTTON_Y + 16 }
    ];
    const icons = iconConfigs.map((config) =>
      this.pinUi(
        this.add
          .image(config.x, config.y, getManagerPortraitKey(config.area, "junior"))
          .setDisplaySize(ALL_MANAGER_ABILITIES_ICON_SIZE, ALL_MANAGER_ABILITIES_ICON_SIZE)
          .setDepth(PINNED_UI_TEXT_DEPTH)
          .setAlpha(0.58)
      )
    );
    const buttonZone = this.pinUi(
      this.add
        .zone(ALL_MANAGER_ABILITIES_BUTTON_X, ALL_MANAGER_ABILITIES_BUTTON_Y, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: false })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );

    this.allManagerAbilitiesButton = {
      background: buttonBg,
      icons,
      zone: buttonZone,
      enabled: false
    };

    buttonZone.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();

        if (this.allManagerAbilitiesButton?.enabled !== true) {
          return;
        }

        this.applyFrame(this.viewModel.activateAllManagerAbilities(), this.time.now);
      }
    );

    buttonZone.on("pointerover", () => {
      if (this.allManagerAbilitiesButton?.enabled !== true) {
        return;
      }

      buttonBg.setAlpha(1);
      icons.forEach((icon) => icon.setDisplaySize(ALL_MANAGER_ABILITIES_ICON_HOVER_SIZE, ALL_MANAGER_ABILITIES_ICON_HOVER_SIZE));
    });

    buttonZone.on("pointerout", () => {
      const enabled = this.allManagerAbilitiesButton?.enabled === true;
      buttonBg.setAlpha(enabled ? 0.96 : 0.72);
      icons.forEach((icon) => icon.setDisplaySize(ALL_MANAGER_ABILITIES_ICON_SIZE, ALL_MANAGER_ABILITIES_ICON_SIZE));
    });
  }

  private createShopButton(): void {
    const buttonLeft = SHOP_BUTTON_X - MAP_BUTTON_SIZE / 2;
    const buttonTop = SHOP_BUTTON_Y - MAP_BUTTON_SIZE / 2;
    const buttonBg = this.pinUi(
      this.drawRoundedPanel(buttonLeft, buttonTop, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE, {
        fill: 0xf4cb7d,
        fillAlpha: 0.98,
        innerFill: 0xffdf9a,
        innerAlpha: 0.52,
        line: 0x613212,
        radius: 18
      }).setDepth(PINNED_UI_PANEL_DEPTH + 1).setAlpha(0.96)
    );
    const icon = this.pinUi(
      this.add
        .image(SHOP_BUTTON_X, SHOP_BUTTON_Y, "shop-icon")
        .setDisplaySize(SHOP_ICON_SIZE, SHOP_ICON_SIZE)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const buttonZone = this.pinUi(
      this.add
        .zone(SHOP_BUTTON_X, SHOP_BUTTON_Y, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );

    this.shopButton = {
      background: buttonBg,
      icon,
      zone: buttonZone
    };

    buttonZone.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.showShopSoonModal();
      }
    );

    buttonZone.on("pointerover", () => {
      buttonBg.setAlpha(1);
      icon.setScale(1.05);
    });

    buttonZone.on("pointerout", () => {
      buttonBg.setAlpha(0.96);
      icon.setScale(1);
    });
  }

  private createNavigationButton(): void {
    const buttonLeft = NAVIGATION_BUTTON_X - MAP_BUTTON_SIZE / 2;
    const buttonTop = NAVIGATION_BUTTON_Y - MAP_BUTTON_SIZE / 2;
    const buttonBg = this.pinUi(
      this.drawRoundedPanel(buttonLeft, buttonTop, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE, {
        fill: 0xf4cb7d,
        fillAlpha: 0.98,
        innerFill: 0xffdf9a,
        innerAlpha: 0.52,
        line: 0x613212,
        radius: 18
      }).setDepth(PINNED_UI_PANEL_DEPTH + 1).setAlpha(0.96)
    );
    const icon = this.pinUi(
      this.add
        .image(NAVIGATION_BUTTON_X, NAVIGATION_BUTTON_Y, "navigation-arrow-icon")
        .setDisplaySize(NAVIGATION_ARROW_ICON_SIZE, NAVIGATION_ARROW_ICON_SIZE)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    const buttonZone = this.pinUi(
      this.add
        .zone(NAVIGATION_BUTTON_X, NAVIGATION_BUTTON_Y, MAP_BUTTON_SIZE, MAP_BUTTON_SIZE)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(PINNED_UI_INTERACTIVE_DEPTH)
    );

    this.navigationButton = {
      background: buttonBg,
      icon,
      zone: buttonZone,
      direction: "down"
    };

    buttonZone.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData
      ) => {
        event.stopPropagation();
        this.handleNavigationButtonClick();
      }
    );

    buttonZone.on("pointerover", () => {
      buttonBg.setAlpha(1);
      icon.setScale(1.08);
    });

    buttonZone.on("pointerout", () => {
      buttonBg.setAlpha(0.96);
      icon.setScale(1);
    });
  }

  private handleNavigationButtonClick(): void {
    if (this.mapViewContainer !== undefined) {
      return;
    }

    if (this.isSurfaceUpgradePanelVisible()) {
      this.scrollToDeepestUnlockedMineShaft();
    } else {
      this.scrollCameraTo(0);
    }
  }

  private scrollToDeepestUnlockedMineShaft(): void {
    const state = this.latestState;

    if (state === undefined) {
      return;
    }

    const deepestUnlockedShaftId = getDeepestUnlockedShaftId(state, this.totalMineShafts);
    const targetFocusY = this.getShaftY(MINE_SHAFT_BACK_WALL_Y, deepestUnlockedShaftId);
    this.scrollCameraTo(targetFocusY - GAME_HEIGHT / 2);
  }

  private scrollCameraTo(targetScrollY: number): void {
    const state = this.latestState;
    const maxScroll = state === undefined ? 0 : this.getMaxCameraScroll(state);
    const clampedTarget = Phaser.Math.Clamp(targetScrollY, 0, maxScroll);
    const distance = Math.abs(this.cameras.main.scrollY - clampedTarget);

    this.tweens.killTweensOf(this.cameras.main);

    if (distance < 1) {
      this.cameras.main.scrollY = clampedTarget;
      this.refreshSurfaceSidebarVisibility();
      this.refreshNavigationButton();
      return;
    }

    this.tweens.add({
      targets: this.cameras.main,
      scrollY: clampedTarget,
      duration: Phaser.Math.Clamp(distance * 0.52, 260, 900),
      ease: "Cubic.easeInOut",
      onUpdate: () => {
        this.refreshSurfaceSidebarVisibility();
        this.refreshNavigationButton();
      },
      onComplete: () => {
        this.refreshSurfaceSidebarVisibility();
        this.refreshNavigationButton();
      }
    });
  }

  private isSurfaceUpgradePanelVisible(): boolean {
    return this.cameras.main.scrollY < SURFACE_SIDEBAR_HIDE_SCROLL_Y;
  }

  private openMapView(): void {
    if (this.mapViewContainer !== undefined) {
      return;
    }

    this.closeManagerPanel();

    const container = this.pinUi(this.add.container(0, 0).setDepth(MAP_VIEW_DEPTH));
    this.mapViewContainer = container;
    const addMapObject = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T): T => {
      container.add(this.pinUi(gameObject));
      return gameObject;
    };

    const water = addMapObject(
      this.add
        .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "map-water-texture")
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(MAP_VIEW_DEPTH)
        .setInteractive()
    );
    water.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });

    addMapObject(
      this.add
        .image(MAP_ISLAND_CENTER_X, MAP_ISLAND_CENTER_Y, "island-map-regions")
        .setDisplaySize(MAP_ISLAND_DISPLAY_WIDTH, MAP_ISLAND_DISPLAY_HEIGHT)
        .setDepth(MAP_VIEW_DEPTH + 1)
    );

    this.mapMineAreaUi = MAP_MINE_AREAS.map((area) => this.createMapMineArea(container, area));
    this.createMapDetailPanel(container);
    this.createMapCurrencyPanels(container);
    this.collectShortActiveMineOfflineCash();
    this.refreshMapView(this.latestState);
  }

  private createMapMineArea(
    container: Phaser.GameObjects.Container,
    area: (typeof MAP_MINE_AREAS)[number]
  ): MapMineAreaUi {
    const addMapObject = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T): T => {
      container.add(this.pinUi(gameObject));
      return gameObject;
    };
    const mineId = area.key as MineId;
    const bounds = this.getMapMineAreaBounds(area.rect);
    const centerX = bounds.centerX;
    const centerY = bounds.centerY;
    const areaZone = addMapObject(
      this.add
        .zone(bounds.x, bounds.y, bounds.width, bounds.height)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .setDepth(MAP_VIEW_DEPTH + 6)
    );
    const lockContainer = addMapObject(
      this.add.container(centerX, centerY).setDepth(MAP_VIEW_DEPTH + 8)
    );
    const lockBg = this.add
      .image(0, 0, "button-panel")
      .setDisplaySize(MAP_LOCK_BUTTON_WIDTH, MAP_LOCK_BUTTON_HEIGHT);
    const lockText = this.add
      .text(-42, -1, "🔒", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "20px",
        fontStyle: "700",
        color: "#fff1c2",
        stroke: "#2b1710",
        strokeThickness: 4
      })
      .setOrigin(0.5);
    const priceText = this.add
      .text(20, -1, "", smallUiTextStyle(13, "#fff8de"))
      .setOrigin(0.5);
    const lockZone = addMapObject(
      this.add
        .zone(centerX, centerY, MAP_LOCK_BUTTON_WIDTH, MAP_LOCK_BUTTON_HEIGHT)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(MAP_VIEW_DEPTH + 12)
    );
    lockContainer.add([lockBg, lockText, priceText]);
    lockContainer.setVisible(false);
    lockZone.setVisible(false);

    lockZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.applyFrame(this.viewModel.unlockMine(mineId), this.time.now);
    });

    const markerContainer = addMapObject(
      this.add.container(centerX, bounds.y - 8).setDepth(MAP_VIEW_DEPTH + 7)
    );
    const markerBg = this.add.graphics();
    const markerCoin = this.add.image(-MAP_COLLECT_MARKER_WIDTH / 2 + 18, 0, "coin-icon").setDisplaySize(30, 30);
    const markerText = this.add
      .text(16, -1, "", smallUiTextStyle(12, "#fff8de"))
      .setOrigin(0.5);
    const markerZone = addMapObject(
      this.add
        .zone(centerX, bounds.y - 8, MAP_COLLECT_MARKER_WIDTH, MAP_COLLECT_MARKER_HEIGHT)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(MAP_VIEW_DEPTH + 12)
    );
    markerZone.setVisible(false);

    markerBg.fillStyle(0x244632, 0.96);
    markerBg.fillRoundedRect(-MAP_COLLECT_MARKER_WIDTH / 2, -MAP_COLLECT_MARKER_HEIGHT / 2, MAP_COLLECT_MARKER_WIDTH, MAP_COLLECT_MARKER_HEIGHT, 15);
    markerBg.lineStyle(1.5, 0xb8ff91, 0.86);
    markerBg.strokeRoundedRect(-MAP_COLLECT_MARKER_WIDTH / 2 + 0.75, -MAP_COLLECT_MARKER_HEIGHT / 2 + 0.75, MAP_COLLECT_MARKER_WIDTH - 1.5, MAP_COLLECT_MARKER_HEIGHT - 1.5, 15);
    markerContainer.add([markerBg, markerCoin, markerText]);
    markerContainer.setVisible(false);
    this.tweens.add({
      targets: markerContainer,
      y: bounds.y - 20,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        markerZone.setPosition(markerContainer.x, markerContainer.y);
      }
    });

    markerZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.switchToMineFromMap(mineId, { showOfflineCashModal: true });
    });

    areaZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      const mine = this.latestState?.mines[mineId];

      if (mine?.isUnlocked !== true) {
        return;
      }

      this.switchToMineFromMap(mineId, { showOfflineCashModal: true });
    });

    return {
      mineId,
      bounds,
      lockContainer,
      lockBg,
      lockText,
      priceText,
      lockZone,
      markerContainer,
      markerBg,
      markerText,
      markerZone,
      areaZone
    };
  }

  private createMapDetailPanel(container: Phaser.GameObjects.Container): void {
    const addMapObject = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T): T => {
      container.add(this.pinUi(gameObject));
      return gameObject;
    };
    const frame = addMapObject(this.add.graphics().setDepth(MAP_VIEW_DEPTH + 8));
    frame.fillStyle(0x14222c, 0.96);
    frame.fillRoundedRect(MAP_INFO_PANEL_X, MAP_INFO_PANEL_Y, MAP_INFO_PANEL_WIDTH, MAP_INFO_PANEL_HEIGHT, 18);
    frame.fillStyle(0xf0c66c, 0.96);
    frame.fillRoundedRect(MAP_INFO_PANEL_X + 7, MAP_INFO_PANEL_Y + 7, MAP_INFO_PANEL_WIDTH - 14, 50, 14);
    frame.fillStyle(0x203642, 0.98);
    frame.fillRoundedRect(MAP_INFO_PANEL_X + 7, MAP_INFO_PANEL_Y + 66, MAP_INFO_PANEL_WIDTH - 14, MAP_INFO_PANEL_HEIGHT - 73, 14);
    frame.lineStyle(2, 0xf1c96b, 0.92);
    frame.strokeRoundedRect(MAP_INFO_PANEL_X + 1, MAP_INFO_PANEL_Y + 1, MAP_INFO_PANEL_WIDTH - 2, MAP_INFO_PANEL_HEIGHT - 2, 18);

    const titleText = addMapObject(
      this.add
        .text(MAP_INFO_PANEL_X + 22, MAP_INFO_PANEL_Y + 19, "Start Continent", topBarTextStyle(20, "#4b2709"))
        .setDepth(MAP_VIEW_DEPTH + 9)
    );

    const rows = MAP_MINE_AREAS.map((area, index) => {
      const rowTop = MAP_INFO_PANEL_Y + 76 + index * (MAP_INFO_ROW_HEIGHT + MAP_INFO_ROW_GAP);
      return this.createMapMineInfoRow(container, area.key as MineId, rowTop);
    });

    this.mapDetailPanel = {
      frame,
      titleText,
      rows
    };
  }

  private createMapMineInfoRow(
    container: Phaser.GameObjects.Container,
    mineId: MineId,
    top: number
  ): MapMineInfoRowUi {
    const addMapObject = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T): T => {
      container.add(this.pinUi(gameObject));
      return gameObject;
    };
    const left = MAP_INFO_PANEL_X + 16;
    const width = MAP_INFO_PANEL_WIDTH - 32;
    const mineConfig = getMapMineConfig(mineId);
    const frame = addMapObject(this.add.graphics().setDepth(MAP_VIEW_DEPTH + 9));
    const oreIcon = addMapObject(
      this.add
        .image(left + 22, top + 25, getMapOreIconKey(mineId))
        .setDisplaySize(34, 34)
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const nameText = addMapObject(
      this.add
        .text(left + 48, top + 9, mineConfig.label, smallUiTextStyle(13, "#fff6d8"))
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const statusText = addMapObject(
      this.add
        .text(left + width - 10, top + 10, "", smallUiTextStyle(10, "#dcecf1"))
        .setOrigin(1, 0)
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const productionText = addMapObject(
      this.add
        .text(left + 48, top + 31, "", smallUiTextStyle(10, "#dcecf1"))
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const prestigeText = addMapObject(
      this.add
        .text(left + 14, top + 58, "", smallUiTextStyle(10, "#f6e8bb"))
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const collectText = addMapObject(
      this.add
        .text(left + 14, top + 77, "", smallUiTextStyle(10, "#bdd2d8"))
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const costIcon = addMapObject(
      this.add
        .image(left + width - 162, top + 83, "coin-icon")
        .setDisplaySize(22, 22)
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const costText = addMapObject(
      this.add
        .text(left + width - 104, top + 82, "", smallUiTextStyle(10, "#fff8de"))
        .setOrigin(0.5)
        .setDepth(MAP_VIEW_DEPTH + 11)
    );
    const prestigeButtonImage = addMapObject(
      this.add
        .image(left + width - 42, top + 83, "button-panel")
        .setDisplaySize(78, 26)
        .setDepth(MAP_VIEW_DEPTH + 10)
    );
    const prestigeButtonText = addMapObject(
      this.add
        .text(left + width - 42, top + 82, "", smallUiTextStyle(10, "#fff8de"))
        .setOrigin(0.5)
        .setDepth(MAP_VIEW_DEPTH + 11)
    );
    const prestigeButtonZone = addMapObject(
      this.add
        .zone(left + width - 42, top + 83, 78, 26)
      .setOrigin(0.5)
        .setDepth(MAP_VIEW_DEPTH + 12)
    );

    frame.fillStyle(mineConfig.color, 0.22);
    frame.fillRoundedRect(left, top, width, MAP_INFO_ROW_HEIGHT, 12);
    frame.fillStyle(0x14222c, 0.58);
    frame.fillRoundedRect(left + 4, top + 4, width - 8, MAP_INFO_ROW_HEIGHT - 8, 9);
    frame.lineStyle(1.5, mineConfig.color, 0.78);
    frame.strokeRoundedRect(left + 0.75, top + 0.75, width - 1.5, MAP_INFO_ROW_HEIGHT - 1.5, 12);

    prestigeButtonZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.handleMapPrestigeAction(mineId);
    });

    return {
      mineId,
      frame,
      oreIcon,
      nameText,
      statusText,
      productionText,
      prestigeText,
      collectText,
      costIcon,
      costText,
      prestigeButtonImage,
      prestigeButtonText,
      prestigeButtonZone
    };
  }

  private createMapCurrencyPanels(container: Phaser.GameObjects.Container): void {
    const addMapObject = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T): T => {
      container.add(this.pinUi(gameObject));
      return gameObject;
    };

    const mapMoneyPanel = this.createMapCurrencyPanel(
      addMapObject,
      MAP_MONEY_PANEL_X,
      MAP_MONEY_PANEL_Y,
      MAP_MONEY_PANEL_WIDTH,
      MAP_MONEY_PANEL_HEIGHT,
      "coin-icon",
      formatMoney(this.latestState?.money ?? 0)
    );
    this.mapMoneyText = mapMoneyPanel.text;

    this.mapSuperCashPanel = this.createMapCurrencyPanel(
      addMapObject,
      MAP_SUPER_CASH_PANEL_X,
      MAP_SUPER_CASH_PANEL_Y,
      MAP_SUPER_CASH_PANEL_WIDTH,
      MAP_SUPER_CASH_PANEL_HEIGHT,
      "supercash-icon",
      formatSuperCash(this.latestState?.superCash ?? 0)
    );
    this.mapSuperCashText = this.mapSuperCashPanel.text;
    this.setCurrencyPanelVisible(this.mapSuperCashPanel, this.isSuperCashVisible(this.latestState));
  }

  private closeMapViewToMine(): void {
    for (const ui of this.mapMineAreaUi) {
      this.tweens.killTweensOf(ui.markerContainer);
    }

    this.mapViewContainer?.destroy(true);
    this.mapViewContainer = undefined;
    this.mapMoneyText = undefined;
    this.mapSuperCashPanel = undefined;
    this.mapSuperCashText = undefined;
    this.mapMineAreaUi = [];
    this.mapDetailPanel = undefined;
    this.tweens.killTweensOf(this.cameras.main);
    this.cameras.main.scrollY = 0;
  }

  private refreshMapView(state: GameState | undefined): void {
    if (this.mapViewContainer === undefined || state === undefined) {
      return;
    }

    this.setCurrencyPanelVisible(this.mapSuperCashPanel, this.isSuperCashVisible(state));
    if (this.mapMoneyText !== undefined && setTextIfChanged(this.mapMoneyText, formatMoney(state.money))) {
      fitTextToWidth(this.mapMoneyText, MAP_MONEY_PANEL_WIDTH - 52, [20, 18, 16, 14, 12]);
    }
    if (this.mapSuperCashText !== undefined && setTextIfChanged(this.mapSuperCashText, formatSuperCash(this.getDisplayedSuperCashValue(state)))) {
      fitTextToWidth(this.mapSuperCashText, MAP_SUPER_CASH_PANEL_WIDTH - 52, [20, 18, 16, 14, 12, 10, 9, 8]);
    }

    for (const ui of this.mapMineAreaUi) {
      const mine = state.mines[ui.mineId];
      const pendingCash = mine?.pendingOfflineCash ?? 0;

      if (mine === undefined) {
        ui.lockContainer.setVisible(false);
        ui.lockZone.setVisible(false).disableInteractive();
        ui.priceText.setText("");
        ui.markerContainer.setVisible(false);
        ui.markerZone.setVisible(false).disableInteractive();
        continue;
      }

      if (!mine.isUnlocked) {
        const canUnlock = state.money + Number.EPSILON >= mine.unlockCost;
        ui.lockContainer.setVisible(true);
        ui.lockZone.setVisible(true);
        ui.lockBg.setAlpha(canUnlock ? 1 : 0.72).setTint(canUnlock ? 0xffffff : 0x8c6c58);
        ui.lockText.setAlpha(canUnlock ? 1 : 0.72);
        ui.priceText.setColor(canUnlock ? "#fff8de" : "#e3c7aa");
        ui.priceText.setText(formatMoney(mine.unlockCost));
        fitTextToWidth(ui.priceText, MAP_LOCK_BUTTON_WIDTH - 74, [13, 12, 11, 10]);
        ui.markerContainer.setVisible(false);
        ui.markerZone.setVisible(false).disableInteractive();
        ui.lockZone.setInteractive({ useHandCursor: canUnlock });
        if (ui.lockZone.input) {
          ui.lockZone.input.cursor = canUnlock ? "pointer" : "default";
        }
        continue;
      }

      ui.lockContainer.setVisible(false);
      ui.lockZone.setVisible(false).disableInteractive();
      const markerVisible = pendingCash > Number.EPSILON;
      ui.markerContainer.setVisible(markerVisible);
      if (markerVisible) {
        ui.markerZone.setPosition(ui.markerContainer.x, ui.markerContainer.y);
        ui.markerZone.setVisible(true);
        ui.markerZone.setInteractive({ useHandCursor: true });
      } else {
        ui.markerZone.setVisible(false).disableInteractive();
      }
      ui.markerText.setText(formatMoney(pendingCash));
      fitTextToWidth(ui.markerText, MAP_COLLECT_MARKER_WIDTH - 64, [12, 11, 10, 9]);
    }

    this.refreshMapDetailPanel(state);
  }

  private refreshMapDetailPanel(state: GameState): void {
    const panel = this.mapDetailPanel;

    if (panel === undefined) {
      return;
    }

    for (const row of panel.rows) {
      const mine = state.mines[row.mineId];

      if (mine === undefined) {
        continue;
      }

      const mineConfig = getMapMineConfig(row.mineId);
      const isActive = row.mineId === state.activeMineId;
      const nextPrestige = mine.prestigeData.find((entry) => entry.prestigeLevel === mine.prestigeLevel + 1);
      const canUnlock = !mine.isUnlocked && state.money + Number.EPSILON >= mine.unlockCost;
      const canPrestige = mine.isUnlocked && nextPrestige !== undefined && state.money + Number.EPSILON >= nextPrestige.cost;
      const rowLeft = MAP_INFO_PANEL_X + 16;
      const rowWidth = MAP_INFO_PANEL_WIDTH - 32;
      const costValue = mine.isUnlocked ? nextPrestige?.cost : mine.unlockCost;
      const costCanAfford = mine.isUnlocked ? canPrestige : canUnlock;
      const showActionButton = mine.isUnlocked ? nextPrestige !== undefined : true;
      const showCostIcon = costValue !== undefined;
      const costTextCenterX = rowLeft + rowWidth - 116;
      const costIconX = costTextCenterX - 52;
      const pendingCashVisible = mine.pendingOfflineCash > Number.EPSILON && mine.pendingOfflineSeconds >= 60;

      row.statusText
        .setText(mine.isUnlocked ? (isActive ? "ACTIVE" : "UNLOCKED") : "LOCKED")
        .setColor(mine.isUnlocked ? (isActive ? "#95f0bd" : "#dcecf1") : "#f08e7f");
      const prestigeStars = "★".repeat(mine.prestigeLevel);
      row.nameText.setText(prestigeStars.length > 0 ? `${mine.displayName}  ${prestigeStars}` : mine.displayName);
      fitTextToWidth(row.nameText, 190, [13, 12, 11, 10]);
      row.productionText.setText(mine.isUnlocked ? `Prod ${formatRate(getMapMineProductionRate(mine, !isActive))}` : "Production locked");
      fitTextToWidth(row.productionText, 200, [10, 9, 8]);
      row.prestigeText.setText(
        nextPrestige === undefined
          ? `Prestige ${mine.prestigeLevel} · ${formatSignificantNumber(mine.currentPrestigeMultiplier)}x · MAX`
          : `Prestige ${mine.prestigeLevel} · ${formatSignificantNumber(mine.currentPrestigeMultiplier)}x`
      );
      fitTextToWidth(row.prestigeText, 206, [10, 9, 8]);
      row.collectText.setText(
        mine.isUnlocked
          ? pendingCashVisible
            ? `Collect ${formatMoney(mine.pendingOfflineCash)}`
            : "No offline cash yet"
          : "Buy on island or here"
      );
      fitTextToWidth(row.collectText, 172, [10, 9, 8]);
      row.costIcon
        .setVisible(showCostIcon)
        .setAlpha(costCanAfford || !showCostIcon ? 1 : 0.58)
        .setPosition(costIconX, row.oreIcon.y + 58);
      row.costText
        .setText(costValue === undefined ? "MAX" : formatMoney(costValue))
        .setColor(costValue === undefined ? "#bdd2d8" : costCanAfford ? "#fff8de" : "#e3c7aa")
        .setPosition(costTextCenterX, row.oreIcon.y + 57);
      fitTextToWidth(row.costText, mine.isUnlocked ? 86 : 124, [10, 9, 8]);

      row.oreIcon.setTexture(getMapOreIconKey(row.mineId));
      row.frame.clear();
      row.frame.fillStyle(mineConfig.color, mine.isUnlocked ? 0.24 : 0.13);
      row.frame.fillRoundedRect(MAP_INFO_PANEL_X + 16, row.oreIcon.y - 25, MAP_INFO_PANEL_WIDTH - 32, MAP_INFO_ROW_HEIGHT, 12);
      row.frame.fillStyle(0x14222c, mine.isUnlocked ? 0.58 : 0.74);
      row.frame.fillRoundedRect(MAP_INFO_PANEL_X + 20, row.oreIcon.y - 21, MAP_INFO_PANEL_WIDTH - 40, MAP_INFO_ROW_HEIGHT - 8, 9);
      row.frame.lineStyle(isActive ? 2 : 1.5, isActive ? 0x95f0bd : mineConfig.color, mine.isUnlocked ? 0.84 : 0.44);
      row.frame.strokeRoundedRect(MAP_INFO_PANEL_X + 16.75, row.oreIcon.y - 24.25, MAP_INFO_PANEL_WIDTH - 33.5, MAP_INFO_ROW_HEIGHT - 1.5, 12);

      row.prestigeButtonText.setText(mine.isUnlocked ? "Prestige" : "Unlock");
      row.prestigeButtonImage.setVisible(showActionButton);
      row.prestigeButtonText.setVisible(showActionButton);
      row.prestigeButtonZone.setVisible(showActionButton);
      if (showActionButton) {
        this.setWorldButtonEnabled(row.prestigeButtonImage, row.prestigeButtonText, row.prestigeButtonZone, mine.isUnlocked ? canPrestige : canUnlock, true);
      } else {
        row.prestigeButtonZone.disableInteractive();
      }
    }
  }

  private switchToMineFromMap(mineId: MineId, options: { showOfflineCashModal?: boolean } = {}): void {
    const mine = this.latestState?.mines[mineId];

    if (mine?.isUnlocked !== true) {
      return;
    }

    const pendingCash = mine.pendingOfflineCash;
    const pendingSeconds = mine.pendingOfflineSeconds;
    const pendingOreSold = mine.pendingOfflineOreSold;
    const hasPendingCash = pendingCash > Number.EPSILON;
    const shouldShowOfflineCashModal =
      options.showOfflineCashModal === true &&
      hasPendingCash &&
      pendingSeconds >= 60;

    this.applyFrameWhenMineAssetsReady(this.viewModel.setActiveMine(mineId), this.time.now);

    if (hasPendingCash && !shouldShowOfflineCashModal) {
      this.applyFrameWhenMineAssetsReady(this.viewModel.collectMineOfflineCash(mineId), this.time.now);
      this.viewModel.flushSave();
    }

    this.closeMapViewToMine();

    if (shouldShowOfflineCashModal) {
      this.showMineOfflineCashModal(mineId, {
        offlineSeconds: pendingSeconds,
        moneyEarned: pendingCash,
        oreSold: pendingOreSold
      });
    }
  }

  private handleMapPrestigeAction(mineId: MineId): void {
    const mine = this.latestState?.mines[mineId];
    const nextPrestige = mine?.prestigeData.find((entry) => entry.prestigeLevel === mine.prestigeLevel + 1);

    if (mine === undefined) {
      return;
    }

    if (!mine.isUnlocked) {
      this.applyFrame(this.viewModel.unlockMine(mineId), this.time.now);
      return;
    }

    if (nextPrestige === undefined) {
      return;
    }

    if ((this.latestState?.money ?? 0) + Number.EPSILON < nextPrestige.cost) {
      this.applyFrame(this.viewModel.prestigeMine(mineId), this.time.now);
      return;
    }

    this.showPrestigeConfirmModal(mineId, nextPrestige.cost);
  }

  private showPrestigeConfirmModal(mineId: MineId, cost: number): void {
    const mine = this.latestState?.mines[mineId];

    if (mine === undefined) {
      return;
    }

    const overlay = this.pinUi(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.68)
        .setDepth(MAP_VIEW_DEPTH + 140)
        .setInteractive()
    );
    const panelWidth = 500;
    const panelHeight = 270;
    const panelX = GAME_WIDTH / 2 - panelWidth / 2;
    const panelY = GAME_HEIGHT / 2 - panelHeight / 2;
    const panel = this.pinUi(this.add.graphics().setDepth(MAP_VIEW_DEPTH + 141));
    panel.fillStyle(0x17212a, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
    panel.lineStyle(2, 0xf1c96b, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

    const titleText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 42, "Confirm Prestige", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f6e8bb"
    }).setOrigin(0.5).setDepth(MAP_VIEW_DEPTH + 142));
    const bodyText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 92, `${mine.displayName} will reset and gain its next multiplier.`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "17px",
      color: "#dcecf1"
    }).setOrigin(0.5).setDepth(MAP_VIEW_DEPTH + 142));
    const coinIcon = this.pinUi(
      this.add.image(GAME_WIDTH / 2 - 58, panelY + 142, "coin-icon").setDisplaySize(28, 28).setDepth(MAP_VIEW_DEPTH + 142)
    );
    const costText = this.pinUi(this.add.text(GAME_WIDTH / 2 + 12, panelY + 142, formatMoney(cost), {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f6e8bb"
    }).setOrigin(0.5).setDepth(MAP_VIEW_DEPTH + 142));
    fitTextToWidth(costText, 190, [24, 22, 20, 18, 16]);

    const cancelButton = this.createModalButton(GAME_WIDTH / 2 - 92, panelY + 214, 150, 42, "Cancel", 0x5c6670, MAP_VIEW_DEPTH + 142);
    const confirmButton = this.createModalButton(GAME_WIDTH / 2 + 92, panelY + 214, 150, 42, "Prestige", 0x386641, MAP_VIEW_DEPTH + 142);
    const objects = [
      overlay,
      panel,
      titleText,
      bodyText,
      coinIcon,
      costText,
      ...cancelButton.objects,
      ...confirmButton.objects
    ];
    const close = () => objects.forEach((obj) => obj.destroy());

    cancelButton.zone.once("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.pendingSuperCashAnimationSource = undefined;
      close();
    });
    confirmButton.zone.once("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.pendingSuperCashAnimationSource = this.getScreenCenter(confirmButton.zone);
      this.applyFrame(this.viewModel.prestigeMine(mineId), this.time.now);
      close();
    });
  }

  private createModalButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    fill: number,
    depth: number
  ): { objects: Phaser.GameObjects.GameObject[]; zone: Phaser.GameObjects.Zone } {
    const bg = this.pinUi(this.add.graphics().setDepth(depth));
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(x - width / 2, y - height / 2, width, height, 9);
    const text = this.pinUi(this.add.text(x, y, label, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(depth + 1));
    const zone = this.pinUi(
      this.add.zone(x, y, width, height)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(depth + 2)
    );

    return { objects: [bg, text, zone], zone };
  }

  private showMineOfflineCashModal(
    mineId: MineId,
    result: { offlineSeconds: number; moneyEarned: number; oreSold: number }
  ): void {
    const overlay = this.pinUi(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
        .setDepth(900)
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
      color: "#f6e8bb"
    }).setOrigin(0.5).setDepth(902));
    const timeText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 100, `Offline time: ${formatOfflineDuration(result.offlineSeconds)}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      color: "#dcecf1"
    }).setOrigin(0.5).setDepth(902));

    const rowIconX = GAME_WIDTH / 2 - 88;
    const rowTextX = GAME_WIDTH / 2 - 54;
    const rowTextWidth = panelX + panelWidth - 52 - rowTextX;
    const coinIcon = this.pinUi(
      this.add.image(rowIconX, panelY + 150, "coin-icon").setDisplaySize(24, 24).setDepth(902)
    );
    const moneyText = this.pinUi(this.add.text(rowTextX, panelY + 150, `+${formatCurrency(result.moneyEarned)}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#4ee669"
    }).setOrigin(0, 0.5).setDepth(902));
    fitTextToWidth(moneyText, rowTextWidth, [24, 22, 20, 18, 16]);
    const oreIcon = this.pinUi(
      this.add.image(rowIconX, panelY + 190, getMapOreIconKey(mineId)).setDisplaySize(24, 24).setDepth(902)
    );
    const oreText = this.pinUi(this.add.text(rowTextX, panelY + 190, `${formatLargeNumber(result.oreSold)} ore sold`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      color: "#e6c94e"
    }).setOrigin(0, 0.5).setDepth(902));
    fitTextToWidth(oreText, rowTextWidth, [20, 18, 16, 14]);

    const buttonWidth = 160;
    const buttonHeight = 40;
    const buttonX = GAME_WIDTH / 2;
    const buttonY = panelY + panelHeight - 40;

    const buttonBg = this.pinUi(this.add.graphics().setDepth(901));
    buttonBg.fillStyle(0x386641, 1);
    buttonBg.fillRoundedRect(buttonX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 8);

    const buttonText = this.pinUi(this.add.text(buttonX, buttonY, "Collect", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "20px",
      fontStyle: "bold",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(902));

    const buttonZone = this.pinUi(
      this.add.zone(buttonX, buttonY, buttonWidth, buttonHeight)
        .setDepth(903)
    );

    const objects = [overlay, panel, titleText, timeText, coinIcon, moneyText, oreIcon, oreText, buttonBg, buttonText, buttonZone];
    let isClosed = false;
    const collectAndClose = () => {
      if (isClosed) {
        return;
      }

      isClosed = true;
      this.applyFrame(this.viewModel.collectMineOfflineCash(mineId), this.time.now);
      this.viewModel.flushSave();
      objects.forEach((obj) => obj.destroy());
    };
    const isInsidePanel = (pointer: Phaser.Input.Pointer) =>
      pointer.x >= panelX &&
      pointer.x <= panelX + panelWidth &&
      pointer.y >= panelY &&
      pointer.y <= panelY + panelHeight;

    this.time.delayedCall(150, () => {
      if (overlay.active) {
        overlay.setInteractive();
      }

      if (buttonZone.active) {
        buttonZone.setInteractive({ useHandCursor: true });
      }
    });

    overlay.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!isInsidePanel(pointer)) {
        collectAndClose();
      }
    });

    buttonZone.once("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      collectAndClose();
    });
  }

  private getMapMineAreaBounds(rect: { x: number; y: number; width: number; height: number }): Phaser.Geom.Rectangle {
    const islandLeft = MAP_ISLAND_CENTER_X - MAP_ISLAND_DISPLAY_WIDTH / 2;
    const islandTop = MAP_ISLAND_CENTER_Y - MAP_ISLAND_DISPLAY_HEIGHT / 2;

    return new Phaser.Geom.Rectangle(
      islandLeft + rect.x * MAP_ISLAND_DISPLAY_WIDTH,
      islandTop + rect.y * MAP_ISLAND_DISPLAY_HEIGHT,
      rect.width * MAP_ISLAND_DISPLAY_WIDTH,
      rect.height * MAP_ISLAND_DISPLAY_HEIGHT
    );
  }

  private createBarPanel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    return this.pinUi(this.drawRoundedPanel(x, y, width, height, {
      fill: 0xf4cb7d,
      fillAlpha: 0.96,
      innerFill: 0xffdf9a,
      innerAlpha: 0.52,
      line: 0x613212,
      radius: 16
    }).setDepth(PINNED_UI_PANEL_DEPTH));
  }

  private createPinnedCurrencyPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    iconKey: string,
    formatter: (value: number) => string
  ): CurrencyPanelUi {
    const frame = this.createBarPanel(x, y, width, height);
    const icon = this.pinUi(this.add.image(x + 22, y + height / 2, iconKey).setDisplaySize(CURRENCY_PANEL_ICON_SIZE, CURRENCY_PANEL_ICON_SIZE).setDepth(PINNED_UI_TEXT_DEPTH));
    const text = this.pinUi(
      this.add
        .text(x + 42, y + height / 2, formatter(0), topBarTextStyle(20, "#4b2709"))
        .setOrigin(0, 0.5)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    fitTextToWidth(text, width - 52, [20, 18, 16, 14, 12]);
    return { frame, icon, text };
  }

  private createMapCurrencyPanel(
    addMapObject: <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor>(gameObject: T) => T,
    x: number,
    y: number,
    width: number,
    height: number,
    iconKey: string,
    textValue: string
  ): CurrencyPanelUi {
    const frame = addMapObject(
      this.drawRoundedPanel(x, y, width, height, {
        fill: 0xf4cb7d,
        fillAlpha: 0.98,
        innerFill: 0xffdf9a,
        innerAlpha: 0.52,
        line: 0x613212,
        radius: 16
      }).setDepth(MAP_VIEW_DEPTH + 8)
    );
    const icon = addMapObject(
      this.add
        .image(x + 22, y + height / 2, iconKey)
        .setDisplaySize(CURRENCY_PANEL_ICON_SIZE, CURRENCY_PANEL_ICON_SIZE)
        .setDepth(MAP_VIEW_DEPTH + 9)
    );
    const text = addMapObject(
      this.add
        .text(x + 42, y + height / 2, textValue, topBarTextStyle(20, "#4b2709"))
        .setOrigin(0, 0.5)
        .setDepth(MAP_VIEW_DEPTH + 9)
    );
    fitTextToWidth(text, width - 52, [20, 18, 16, 14, 12]);
    return { frame, icon, text };
  }

  private isSuperCashVisible(state: GameState | undefined): boolean {
    const hasActiveBlockadeTimer = Object.values(state?.blockades ?? {}).some((blockade) => blockade.isRemoving && !blockade.isRemoved);
    return IS_DEBUG || (state?.superCash ?? 0) > 0 || hasActiveBlockadeTimer;
  }

  private setCurrencyPanelVisible(panel: CurrencyPanelUi | undefined, visible: boolean): void {
    if (panel === undefined) {
      return;
    }

    setVisibleIfChanged(panel.frame, visible);
    setVisibleIfChanged(panel.icon, visible);
    setVisibleIfChanged(panel.text, visible);
  }

  private refreshCurrencyPanels(state: GameState): void {
    this.setCurrencyPanelVisible(this.superCashPanel, this.isSuperCashVisible(state));
    if (setTextIfChanged(this.moneyText, formatMoney(state.money))) {
      fitTextToWidth(this.moneyText, MONEY_PANEL_WIDTH - 52, [20, 18, 16, 14, 12]);
    }

    const superCashValue = this.getDisplayedSuperCashValue(state);
    if (setTextIfChanged(this.superCashText, formatSuperCash(superCashValue))) {
      fitTextToWidth(this.superCashText, SUPER_CASH_PANEL_WIDTH - 52, [20, 18, 16, 14, 12, 10, 9, 8]);
    }

    if (this.mapMoneyText !== undefined && setTextIfChanged(this.mapMoneyText, formatMoney(state.money))) {
      fitTextToWidth(this.mapMoneyText, MAP_MONEY_PANEL_WIDTH - 52, [20, 18, 16, 14, 12]);
    }

    this.setCurrencyPanelVisible(this.mapSuperCashPanel, this.isSuperCashVisible(state));
    if (this.mapSuperCashText !== undefined && setTextIfChanged(this.mapSuperCashText, formatSuperCash(superCashValue))) {
      fitTextToWidth(this.mapSuperCashText, MAP_SUPER_CASH_PANEL_WIDTH - 52, [20, 18, 16, 14, 12, 10, 9, 8]);
    }
  }

  private getDisplayedSuperCashValue(state: GameState | undefined): number {
    return this.displayedSuperCashValue ?? state?.superCash ?? 0;
  }

  private refreshSuperCashDisplay(): void {
    const value = this.getDisplayedSuperCashValue(this.latestState);
    if (setTextIfChanged(this.superCashText, formatSuperCash(value))) {
      fitTextToWidth(this.superCashText, SUPER_CASH_PANEL_WIDTH - 52, [20, 18, 16, 14, 12, 10, 9, 8]);
    }
    if (this.mapSuperCashText !== undefined && setTextIfChanged(this.mapSuperCashText, formatSuperCash(value))) {
      fitTextToWidth(this.mapSuperCashText, MAP_SUPER_CASH_PANEL_WIDTH - 52, [20, 18, 16, 14, 12, 10, 9, 8]);
    }
  }

  private queueSuperCashAnimationSourceFrom(gameObject: BoundedScrollObject): void {
    this.pendingSuperCashAnimationSource = this.getScreenCenter(gameObject);
  }

  private getScreenCenter(gameObject: BoundedScrollObject): ScreenPoint {
    const bounds = gameObject.getBounds();
    return {
      x: bounds.centerX - this.cameras.main.scrollX * gameObject.scrollFactorX,
      y: bounds.centerY - this.cameras.main.scrollY * gameObject.scrollFactorY
    };
  }

  private processSuperCashAwardEvents(events: SimulationEvent[], state: GameState): void {
    const awards = events.filter(
      (event): event is Extract<SimulationEvent, { type: "superCashAwarded" }> =>
        event.type === "superCashAwarded" && event.amount > 0
    );

    if (awards.length === 0) {
      this.pendingSuperCashAnimationSource = undefined;
      return;
    }

    const source = this.pendingSuperCashAnimationSource ?? { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
    this.pendingSuperCashAnimationSource = undefined;

    if (this.activeSuperCashAnimationTweens <= 0) {
      this.displayedSuperCashValue = awards[0].previousSuperCash;
    }

    awards.forEach((award, index) => {
      this.animateSuperCashAward(source, award.amount, state.superCash, index * 90);
    });
  }

  private animateSuperCashAward(source: ScreenPoint, amount: number, finalSuperCash: number, startDelayMs: number): void {
    const iconCount = Math.max(1, Math.round(amount / 10));
    const baseAmountPerIcon = amount / iconCount;
    this.activeSuperCashAnimationTweens += iconCount;

    for (let i = 0; i < iconCount; i += 1) {
      const icon = this.pinUi(
        this.add
          .image(source.x, source.y, "supercash-icon")
          .setDisplaySize(SUPER_CASH_FLY_ICON_SIZE, SUPER_CASH_FLY_ICON_SIZE)
          .setAlpha(0)
          .setDepth(SUPER_CASH_ANIMATION_DEPTH)
      );
      this.activeSuperCashAnimationIcons.add(icon);
      const flyScaleX = icon.scaleX;
      const flyScaleY = icon.scaleY;
      const scatterX = Phaser.Math.Clamp(source.x + Phaser.Math.Between(-95, 95), 16, GAME_WIDTH - 16);
      const scatterY = Phaser.Math.Clamp(source.y + Phaser.Math.Between(-85, 45), 16, GAME_HEIGHT - 16);
      const target = this.getSuperCashIconTarget();
      const arrivalAmount = i === iconCount - 1
        ? amount - baseAmountPerIcon * (iconCount - 1)
        : baseAmountPerIcon;

      this.tweens.add({
        targets: icon,
        x: scatterX,
        y: scatterY,
        alpha: 1,
        scaleX: flyScaleX * 1.08,
        scaleY: flyScaleY * 1.08,
        angle: Phaser.Math.Between(-28, 28),
        duration: 170,
        delay: startDelayMs + i * 16,
        ease: "Quad.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: icon,
            x: target.x + Phaser.Math.Between(-4, 4),
            y: target.y + Phaser.Math.Between(-4, 4),
            alpha: 0.9,
            scaleX: flyScaleX * 0.68,
            scaleY: flyScaleY * 0.68,
            angle: icon.angle + Phaser.Math.Between(-55, 55),
            duration: 560,
            ease: "Cubic.easeIn",
            onComplete: () => {
              icon.destroy();
              this.activeSuperCashAnimationIcons.delete(icon);
              this.displayedSuperCashValue = Math.round((this.getDisplayedSuperCashValue(this.latestState) + arrivalAmount) * 1000) / 1000;
              this.activeSuperCashAnimationTweens = Math.max(0, this.activeSuperCashAnimationTweens - 1);
              if (this.activeSuperCashAnimationTweens === 0) {
                this.displayedSuperCashValue = finalSuperCash;
              }
              this.refreshSuperCashDisplay();
              this.pulseSuperCashIcon();
            }
          });
        }
      });
    }
  }

  private processSuperCashSpentEvents(events: SimulationEvent[], state: GameState): void {
    if (!events.some((event) => event.type === "superCashSpent")) {
      return;
    }

    this.pendingSuperCashAnimationSource = undefined;
    this.displayedSuperCashValue = state.superCash;
    this.activeSuperCashAnimationTweens = 0;

    for (const icon of this.activeSuperCashAnimationIcons) {
      this.tweens.killTweensOf(icon);
      icon.destroy();
    }

    this.activeSuperCashAnimationIcons.clear();
    this.refreshSuperCashDisplay();
  }

  private getSuperCashIconTarget(): ScreenPoint {
    return this.getScreenCenter(this.getActiveSuperCashIcon());
  }

  private getActiveSuperCashIcon(): Phaser.GameObjects.Image {
    return this.mapViewContainer !== undefined && this.mapSuperCashPanel !== undefined
      ? this.mapSuperCashPanel.icon
      : this.superCashPanel.icon;
  }

  private pulseSuperCashIcon(): void {
    const icon = this.getActiveSuperCashIcon();
    this.tweens.killTweensOf(icon);
    icon
      .setDisplaySize(CURRENCY_PANEL_ICON_SIZE, CURRENCY_PANEL_ICON_SIZE)
      .setTint(0xffffff);
    const baseScaleX = icon.scaleX;
    const baseScaleY = icon.scaleY;

    this.tweens.add({
      targets: icon,
      scaleX: baseScaleX * 1.18,
      scaleY: baseScaleY * 1.18,
      alpha: 1,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () => {
        icon
          .setDisplaySize(CURRENCY_PANEL_ICON_SIZE, CURRENCY_PANEL_ICON_SIZE)
          .clearTint()
          .setAlpha(1);
      }
    });
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
      elevator: this.createMiniUpgradeCard("elevator", startX, y, cardWidth, cardHeight),
      warehouse: this.createMiniUpgradeCard("warehouse", startX + cardWidth + 7, y, cardWidth, cardHeight)
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
        .image(x + 59, y + 27, "coin-icon")
        .setDisplaySize(28, 28)
        .setDepth(PINNED_UI_TEXT_DEPTH)
    );
    objects.push(coinIcon);

    const costText = this.pinUi(
      this.add
        .text(x + 70, y + 27, "100", smallUiTextStyle(11, "#5a3411"))
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
        this.queueSuperCashAnimationSourceFrom(buttonZone);
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

    const cardUi: UpgradeCardUi = {
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

    buttonZone.on("pointerover", () => {
      if (cardUi.enabled) {
        buttonImage.setTint(0xcccccc);
      }
    });

    buttonZone.on("pointerout", () => {
      buttonImage.setTint(cardUi.enabled ? 0xffffff : 0x9c7f58);
    });

    return cardUi;
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

  private showShopSoonModal(): void {
    if (this.shopSoonModalObjects !== undefined) {
      return;
    }

    const overlay = this.pinUi(
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.68)
        .setDepth(MAP_VIEW_DEPTH + 140)
        .setInteractive()
    );
    const panelWidth = 460;
    const panelHeight = 230;
    const panelX = GAME_WIDTH / 2 - panelWidth / 2;
    const panelY = GAME_HEIGHT / 2 - panelHeight / 2;
    const panel = this.pinUi(this.add.graphics().setDepth(MAP_VIEW_DEPTH + 141));
    panel.fillStyle(0x17212a, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
    panel.lineStyle(2, 0xf1c96b, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);

    const titleText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 42, "Shop", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f6e8bb"
    }).setOrigin(0.5).setDepth(MAP_VIEW_DEPTH + 142));
    const icon = this.pinUi(
      this.add.image(GAME_WIDTH / 2, panelY + 92, "shop-icon").setDisplaySize(SHOP_ICON_SIZE, SHOP_ICON_SIZE).setDepth(MAP_VIEW_DEPTH + 142)
    );
    const bodyText = this.pinUi(this.add.text(GAME_WIDTH / 2, panelY + 142, "Shop available soon.", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "18px",
      color: "#dcecf1"
    }).setOrigin(0.5).setDepth(MAP_VIEW_DEPTH + 142));
    const okButton = this.createModalButton(GAME_WIDTH / 2, panelY + 190, 150, 42, "OK", 0x386641, MAP_VIEW_DEPTH + 142);
    const objects = [
      overlay,
      panel,
      titleText,
      icon,
      bodyText,
      ...okButton.objects
    ];
    const close = () => {
      objects.forEach((obj) => obj.destroy());
      this.shopSoonModalObjects = undefined;
    };

    this.shopSoonModalObjects = objects;

    okButton.zone.once("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      close();
    });
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

    this.warehouseClickTarget = this.createClickTarget(138, 72, 260, 130, "Warehouse", () => {
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

    this.refreshActiveMineTextures(state);
    this.processElevatorRouteEvents(state, events);
    this.refreshDepthSections(state);
    this.refreshDepthBlockades(state);
    this.clampCameraScroll(state);
    this.refreshElevatorShaftVisual(state);
    this.refreshElevatorShaftVisibility(state);
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
    this.processSuperCashAwardEvents(events, state);
    this.processSuperCashSpentEvents(events, state);
    this.applyUiState(state, events, buyMode);
    this.updateTutorialOverlay(state);
  }

  private refreshMineShaftRows(state: GameState, visual: SimulationFrame["visual"], time: number): void {
    const nextVisibleLockedShaftId = this.getNextVisibleLockedShaftId(state);

    for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
      const row = this.mineShaftRows[shaftId];
      const shaftState = state.entities.mineShafts[shaftId];
      const shaftVisual = visual.mineShafts[shaftId];
      const previousUnlocked = shaftId === 1 || state.entities.mineShafts[shaftId - 1]?.isUnlocked === true;
      const canUnlock = previousUnlocked && state.money + Number.EPSILON >= shaftState.unlockCost;
      const rowMode =
        shaftState.isUnlocked
          ? "unlocked"
          : shaftId === nextVisibleLockedShaftId
            ? "locked"
            : "hidden";
      const nearViewport = this.isMineShaftRowNearViewport(shaftId);
      const effectiveRowMode = nearViewport ? rowMode : "hidden";

      this.setMineShaftRowMode(row, effectiveRowMode);

      if (rowMode === "hidden" || !nearViewport) {
        continue;
      }

      const routeFeedback = this.shaftRouteFeedbackById[shaftId];
      const routeVisible = routeFeedback !== undefined && routeFeedback.expiresAtSeconds > state.timeSeconds;
      setVisibleIfChanged(row.routeText, routeVisible);
      setTextIfChanged(row.routeText, routeVisible ? routeFeedback?.text ?? "" : "");

      if (!shaftState.isUnlocked) {
        const unlockButtonText = `Unlock ${formatAmount(shaftState.unlockCost)}`;
        const lockedHintText = previousUnlocked
          ? canUnlock
            ? "Deepen the mine and extend the elevator."
            : "Need more cash to unlock this shaft."
          : `Unlock Shaft ${shaftId - 1} first.`;
        const lockedStateKey = `${canUnlock ? 1 : 0}|${previousUnlocked ? 1 : 0}|${unlockButtonText}|${lockedHintText}`;

        if (row.lockedStateKey !== lockedStateKey) {
          row.lockedStateKey = lockedStateKey;
          this.drawLockedShaftPlaceholder(row, canUnlock, previousUnlocked);
          setTextIfChanged(row.unlockButtonText, unlockButtonText);
          setTextIfChanged(row.lockedHintText, lockedHintText);
          this.setWorldButtonEnabled(row.unlockButtonImage, row.unlockButtonText, row.unlockButtonZone, canUnlock, true);
        }

        continue;
      }

      const minerTexture =
        shaftVisual.miner === "pickaxe"
          ? Math.floor(time / 170) % 2 === 0
            ? "miner-pickaxe-01"
            : getMineTextureKey(state.activeMineId, "miner-pickaxe-02")
          : shaftVisual.miner === "carryBag"
            ? getMineTextureKey(state.activeMineId, "miner-carry")
            : shaftVisual.miner === "dropBag"
              ? getMineTextureKey(state.activeMineId, "miner-drop")
              : "miner-idle";
      const pickupTexture =
        shaftVisual.minePickupBox === "empty"
          ? "mine-pickup-empty"
          : shaftVisual.minePickupBox === "small"
            ? getMineTextureKey(state.activeMineId, "mine-pickup-small")
            : getMineTextureKey(state.activeMineId, "mine-pickup-full");

      setTextureIfChanged(row.miner, minerTexture);
      row.miner.setPosition(
        Phaser.Math.Linear(MINE_WORKER_MINE_X, MINE_WORKER_PICKUP_X, shaftVisual.minerPositionRatio),
        this.getShaftY(MINE_WORKER_Y, shaftId)
      );
      if (row.miner.flipX) {
        row.miner.setFlipX(false);
      }
      setTextureIfChanged(row.pickupBox, pickupTexture);
      setTextIfChanged(row.storageText, `${formatAmount(shaftState.storedOre)} / ${formatAmount(shaftState.capacity)}`);

      const preview = state.upgrades.mineShafts[shaftId];
      const assignedManager = getAssignedManagerForShaft(state, shaftId);
      const automated = state.managers.automationEnabledByShaft[shaftId] ?? false;
      const managersLocked = state.managers.systemLocked;
      const mainCurrentText = formatRate(state.baseValues.mineShafts[shaftId].throughputPerSecond);
      const mainNextText = preview.isMaxed ? "MAX" : formatRate(preview.previewStats.throughputPerSecond);
      const secondaryCurrentText = formatAmount(state.baseValues.mineShafts[shaftId].bufferCapacity);
      const secondaryNextText = preview.isMaxed ? "MAX" : formatAmount(preview.previewStats.bufferCapacity);
      const costText = preview.isMaxed ? "MAX" : formatAmount(preview.cost);
      const buyCountText = preview.isMaxed ? "" : `x${preview.levelsToBuy}`;
      const managerTimerText = assignedManager === undefined
        ? automated ? "Automated" : "Manual"
        : formatManagerTimer(assignedManager);
      const assignedManagerKey = assignedManager === undefined
        ? "none"
        : [
            assignedManager.id,
            assignedManager.rank,
            assignedManager.abilityType,
            assignedManager.isActive ? 1 : 0,
            Math.ceil(assignedManager.remainingActiveTime),
            Math.ceil(assignedManager.remainingCooldownTime)
          ].join(":");
      const staticStateKey = [
        state.activeMineId,
        shaftState.displayName,
        preview.currentLevel,
        preview.isMaxed ? 1 : 0,
        preview.canAfford ? 1 : 0,
        preview.levelsToBuy,
        mainCurrentText,
        mainNextText,
        secondaryCurrentText,
        secondaryNextText,
        costText,
        buyCountText,
        automated ? 1 : 0,
        managersLocked ? 1 : 0,
        state.managers.unlockLevel,
        assignedManagerKey,
        managerTimerText
      ].join("|");

      if (row.staticStateKey !== staticStateKey) {
        row.staticStateKey = staticStateKey;

        setTextIfChanged(row.titleText, shaftState.displayName);
        setTextIfChanged(row.levelText, `Lvl ${preview.currentLevel}`);
        setTextIfChanged(row.mainCurrentText, mainCurrentText);
        setTextIfChanged(row.mainNextText, mainNextText);
        setTextIfChanged(row.secondaryCurrentText, secondaryCurrentText);
        setTextIfChanged(row.secondaryNextText, secondaryNextText);
        setTextIfChanged(row.costText, costText);
        setTextIfChanged(row.buyCountText, buyCountText);

        fitTextToWidth(row.mainCurrentText, 88, [18, 16, 14, 12]);
        fitTextToWidth(row.mainNextText, 88, [18, 16, 14, 12]);
        fitTextToWidth(row.secondaryCurrentText, 88, [14, 13, 12, 11]);
        fitTextToWidth(row.secondaryNextText, 88, [14, 13, 12, 11]);
        fitTextToWidth(row.costText, 120, [13, 12, 11, 10]);
        fitTextToWidth(row.buyCountText, 54, [11, 10, 9]);

        this.drawMineShaftPanelFrame(row);
        this.drawMineShaftManagerSlotFrame(row, automated, managersLocked, assignedManager?.isActive ?? false);
        this.setMineShaftUpgradeEnabled(row, preview.canAfford && !preview.isMaxed);
        setVisibleIfChanged(row.managerFrame, true);
        setVisibleIfChanged(row.managerTitleText, true);
        setVisibleIfChanged(row.managerSlotZone, true);

        row.managerEmptySlotImage.setVisible(assignedManager === undefined).setAlpha(assignedManager === undefined ? (managersLocked ? 0.52 : 0.9) : 0);
        row.managerPortraitImage.setVisible(assignedManager !== undefined).setAlpha(assignedManager === undefined ? 0 : 1);
        row.managerAbilityImage.setVisible(assignedManager !== undefined).setAlpha(assignedManager === undefined ? 0 : 0.92);
        row.managerAbilityZone.setVisible(assignedManager !== undefined);
        setVisibleIfChanged(row.managerRankText, true);
        setVisibleIfChanged(row.managerStatusText, true);
        setVisibleIfChanged(row.managerTimerText, true);

        if (assignedManager === undefined) {
          row.managerEmptySlotImage.setAlpha(managersLocked ? 0.52 : 0.9);
          setTextIfChanged(row.managerRankText, managersLocked ? "Manager Locked" : "No Manager");
          row.managerRankText.setColor(managersLocked ? "#c8b39a" : "#f7f1dd");
          setTextIfChanged(row.managerStatusText, managersLocked ? `Mine Lvl ${state.managers.unlockLevel}` : "Tap to assign");
          row.managerStatusText.setColor(managersLocked ? "#f08e7f" : "#bdd2d8");
          setTextIfChanged(row.managerTimerText, managerTimerText);
          row.managerAbilityZone.disableInteractive();
        } else {
          setTextureIfChanged(row.managerPortraitImage, getManagerPortraitKey("mineShaft", assignedManager.rank));
          setTextureIfChanged(row.managerAbilityImage, getAbilityIconKey(assignedManager.abilityType));
          row.managerAbilityImage
            .setAlpha(assignedManager.isActive ? 1 : assignedManager.remainingCooldownTime > 0 ? 0.48 : 0.92)
            .clearTint();
          setTextIfChanged(row.managerRankText, formatRank(assignedManager.rank));
          row.managerRankText.setColor(getRankColor(assignedManager.rank));
          setTextIfChanged(row.managerStatusText, automated ? "Automated" : "Assigned");
          row.managerStatusText.setColor(automated ? "#95f0bd" : "#f1d389");
          setTextIfChanged(row.managerTimerText, managerTimerText);
          row.managerAbilityZone.setInteractive({ useHandCursor: true });
        }

        setTextIfChanged(row.mineClickChip, automated ? `${shaftState.displayName} Auto` : shaftState.displayName);
        this.setWorldClickTargetEnabled(row.mineClickOutline, row.mineClickChip, row.mineClickZone, !automated);
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
      setTextureIfChanged(
        this.elevatorCabin,
        loadState === "loaded" ? getMineTextureKey(state.activeMineId, "elevator-cabin-loaded") : "elevator-cabin-empty"
      );
    } else {
      setTextureIfChanged(
        this.elevatorCabin,
        this.elevatorVisualLoaded ? getMineTextureKey(state.activeMineId, "elevator-cabin-loaded") : "elevator-cabin-empty"
      );
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
    const activeMineId = this.getActiveMineId();
    const workerTexture =
      workerState === "carryCoal"
        ? getMineTextureKey(activeMineId, "warehouse-worker-carry")
        : workerState === "sell"
          ? getMineTextureKey(activeMineId, "warehouse-worker-sell")
          : "warehouse-worker-idle";
    const pileTexture =
      pileState === "empty"
        ? "warehouse-pile-empty"
        : pileState === "small"
          ? getMineTextureKey(activeMineId, "warehouse-pile-small")
          : getMineTextureKey(activeMineId, "warehouse-pile-full");

    setTextureIfChanged(this.warehouseWorker, workerTexture);
    this.warehouseWorker.setPosition(
      Phaser.Math.Linear(WAREHOUSE_WORKER_HOME_X, WAREHOUSE_WORKER_DROPOFF_X, workerPositionRatio),
      WAREHOUSE_WORKER_Y
    );
    if (this.warehouseWorker.flipX !== workerFacingLeft) {
      this.warehouseWorker.setFlipX(workerFacingLeft);
    }
    setTextureIfChanged(this.warehousePile, pileTexture);
    setVisibleIfChanged(this.warehouseFeedback, salesFeedbackVisible);
    setTextIfChanged(this.warehouseFeedback, salesFeedbackText);
    setVisibleIfChanged(this.commandFeedback, commandFeedbackVisible);
    setTextIfChanged(this.commandFeedback, commandFeedbackText);
  }

  private applyUiState(state: GameState, events: SimulationEvent[], buyMode: UpgradeBuyMode): void {
    const refreshAll = !this.uiInitialized;
    const buyModeChanged = this.activeBuyMode !== buyMode;
    const eventTypes = new Set(events.map((event) => event.type));
    const currentManagerSecond = Math.floor(state.timeSeconds);
    const upgradeStateChanged =
      refreshAll ||
      buyModeChanged ||
      eventTypes.has("activeMineChanged") ||
      eventTypes.has("moneyChanged") ||
      eventTypes.has("statsChanged") ||
      eventTypes.has("upgradePurchased") ||
      eventTypes.has("mineShaftUnlocked");
    const managerPanelStructureChanged =
      refreshAll ||
      eventTypes.has("activeMineChanged") ||
      eventTypes.has("managerPurchased") ||
      eventTypes.has("managerAssigned") ||
      eventTypes.has("managerAssignedToShaft") ||
      eventTypes.has("managerUnassigned") ||
      eventTypes.has("managerUnassignedFromShaft") ||
      eventTypes.has("managerAbilityActivated") ||
      eventTypes.has("managerAbilityExpired") ||
      eventTypes.has("managerCooldownStarted") ||
      eventTypes.has("managerCooldownFinished") ||
      eventTypes.has("automationStateChanged");
    const managerStateChanged =
      managerPanelStructureChanged ||
      eventTypes.has("activeMineChanged") ||
      eventTypes.has("statsChanged") ||
      eventTypes.has("moneyChanged");
    const managerTimerChanged = currentManagerSecond !== this.lastManagerSlotRefreshSecond;
    const managerPanelDynamicChanged =
      eventTypes.has("moneyChanged") || currentManagerSecond !== this.lastManagerPanelRefreshSecond;

    if (refreshAll || eventTypes.has("moneyChanged") || eventTypes.has("superCashAwarded") || eventTypes.has("superCashSpent")) {
      this.refreshCurrencyPanels(state);
    }

    if (
      refreshAll ||
      eventTypes.has("activeMineChanged") ||
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
      this.refreshAllManagerAbilitiesButton(state);
      this.lastManagerSlotRefreshSecond = currentManagerSecond;
    }

    if (this.activeManagerPanelArea !== null) {
      if (managerPanelStructureChanged) {
        this.rebuildManagerPanel(state);
        this.lastManagerPanelRefreshSecond = currentManagerSecond;
      } else if (managerPanelDynamicChanged) {
        this.refreshManagerPanelDynamicState(state);
        this.lastManagerPanelRefreshSecond = currentManagerSecond;
      }
    }

    this.refreshSurfaceSidebarVisibility();
    this.refreshNavigationButton();
    if (this.mapViewContainer !== undefined) {
      this.refreshMapView(state);
    }
    this.activeBuyMode = buyMode;
    this.uiInitialized = true;
  }

  private refreshDepthSections(state: GameState): void {
    const visibleDepthGroupCount = this.getVisibleDepthGroupCount(state);

    for (const section of this.depthSections) {
      setVisibleIfChanged(
        section.background,
        section.depthGroup <= visibleDepthGroupCount && this.isDepthGroupNearViewport(section.depthGroup)
      );
    }
  }

  private isDepthGroupNearViewport(depthGroup: number): boolean {
    const preloadMargin = 160;
    const viewportTop = this.cameras.main.scrollY - preloadMargin;
    const viewportBottom = this.cameras.main.scrollY + GAME_HEIGHT + preloadMargin;

    return this.getDepthGroupBottomY(depthGroup) >= viewportTop && this.getDepthGroupTopY(depthGroup) <= viewportBottom;
  }

  private refreshDepthBlockades(state: GameState): void {
    for (const ui of this.depthBlockades) {
      const blockade = state.blockades[ui.blockadeId];
      const nextDepthGroup = Math.floor((ui.unlocksShaftId - 1) / SHAFTS_PER_DEPTH_GROUP) + 1;
      const visible =
        blockade !== undefined &&
        !blockade.isRemoved &&
        this.isDepthGroupVisible(state, nextDepthGroup) &&
        this.isBlockadeNearViewport(ui.afterShaftId);

      ui.image.setVisible(visible);
      ui.panel.setVisible(visible);
      ui.titleText.setVisible(visible);
      ui.hintText.setVisible(visible);
      ui.buttonImage.setVisible(visible);
      ui.buttonText.setVisible(visible);
      ui.skipCostIcon.setVisible(visible && blockade?.isRemoving === true);
      ui.buttonZone.setVisible(visible);

      if (!visible || blockade === undefined) {
        ui.panel.clear();
        ui.skipCostIcon.setVisible(false);
        ui.buttonZone.disableInteractive();
        continue;
      }

      const canAfford = state.money + Number.EPSILON >= blockade.removalCost;
      const skipCost = getDepthBlockadeSkipCost(blockade.remainingRemovalSeconds);
      const canSkip = state.superCash + Number.EPSILON >= skipCost;
      const previousShaftUnlocked = state.entities.mineShafts[ui.afterShaftId]?.isUnlocked ?? false;
      const enabled = blockade.isRemoving
        ? canSkip
        : previousShaftUnlocked && canAfford;

      ui.buttonText
        .setText(blockade.isRemoving ? `$$${formatAmount(skipCost)}` : `Clear ${formatAmount(blockade.removalCost)}`)
        .setOrigin(blockade.isRemoving ? 0 : 0.5, 0.5)
        .setX(blockade.isRemoving ? DEPTH_BLOCKADE_CENTER_X - 20 : DEPTH_BLOCKADE_CENTER_X);
      ui.skipCostIcon
        .setVisible(blockade.isRemoving)
        .setAlpha(blockade.isRemoving ? (enabled ? 1 : 0.56) : 0)
        .setTint(enabled ? 0xffffff : 0x8c6c58);
      ui.hintText.setText(
        blockade.isRemoving
          ? canSkip
            ? `Tap to skip: ${formatDuration(blockade.remainingRemovalSeconds)} left`
            : "Need more Super Cash to skip."
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

      fitTextToWidth(ui.buttonText, blockade.isRemoving ? DEPTH_BLOCKADE_BUTTON_WIDTH - 76 : DEPTH_BLOCKADE_BUTTON_WIDTH - 22, [13, 12, 11, 10]);
      fitTextToWidth(ui.hintText, DEPTH_BLOCKADE_PANEL_WIDTH - 36, [12, 11, 10]);
      this.setWorldButtonEnabled(ui.buttonImage, ui.buttonText, ui.buttonZone, enabled, true);
    }
  }

  private isBlockadeNearViewport(afterShaftId: number): boolean {
    const blockadeY = this.getBlockadeY(afterShaftId);
    const preloadMargin = DEPTH_BLOCKADE_IMAGE_HEIGHT;
    const viewportTop = this.cameras.main.scrollY - preloadMargin;
    const viewportBottom = this.cameras.main.scrollY + GAME_HEIGHT + preloadMargin;

    return blockadeY >= viewportTop && blockadeY <= viewportBottom;
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

  private refreshAllManagerAbilitiesButton(state: GameState): void {
    if (this.allManagerAbilitiesButton === undefined) {
      return;
    }

    const enabled = getReadyAssignedManagers(state).length > 0;
    const alpha = enabled ? 0.96 : 0.72;
    const tint = enabled ? 0xffffff : 0x7a6d63;

    this.allManagerAbilitiesButton.enabled = enabled;
    this.allManagerAbilitiesButton.background.setAlpha(alpha);
    this.allManagerAbilitiesButton.icons.forEach((icon) => {
      icon
        .setAlpha(enabled ? 0.98 : 0.58)
        .setTint(tint)
        .setDisplaySize(ALL_MANAGER_ABILITIES_ICON_SIZE, ALL_MANAGER_ABILITIES_ICON_SIZE);
    });

    if (this.allManagerAbilitiesButton.zone.input) {
      this.allManagerAbilitiesButton.zone.input.cursor = enabled ? "pointer" : "default";
    }
  }

  private refreshNavigationButton(): void {
    if (this.navigationButton === undefined) {
      return;
    }

    const direction = this.isSurfaceUpgradePanelVisible() ? "down" : "up";

    if (this.navigationButton.direction !== direction) {
      this.navigationButton.direction = direction;
      this.navigationButton.icon.setAngle(direction === "down" ? 0 : 180);
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
    this.managerPanelHireOfferUi = [];
    this.managerPanelAssignedUi = null;
    this.managerPanelAssignButtonUi = null;
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
    this.managerPanelHireOfferUi = [];
    this.managerPanelAssignedUi = null;
    this.managerPanelAssignButtonUi = null;

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
      this.managerPanelHireOfferUi.push(this.createHireOfferEntry(container, offer, x, y));
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

    const contentContainer = this.pinUi(this.add.container(0, 0)) as ManagerPanelContentContainer;
    contentContainer.isManagerPanelContentContainer = true;
    contentContainer.scrollInteractiveZones = [];
    contentContainer.setMask(contentMask);
    container.add(contentContainer);
    contentContainer.contentAreaY = scrollAreaY;
    contentContainer.contentAreaHeight = scrollAreaHeight;

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
    contentContainer.totalContentHeight = totalContentHeight;
    const maxScroll = Math.max(0, totalContentHeight - scrollAreaHeight);

    // Clamp scroll Y if content height changed
    this.managerPanelScrollY = Phaser.Math.Clamp(this.managerPanelScrollY, -maxScroll, 0);
    contentContainer.setY(this.managerPanelScrollY);
    this.refreshManagerPanelScrollableInteractions(contentContainer);

    // Scrollbar
    if (maxScroll > 0) {
      const scrollbarHeight = Math.max(30, (scrollAreaHeight / totalContentHeight) * scrollAreaHeight);
      const scrollbar = this.addManagerPanelObject(container, this.add.graphics()) as ManagerPanelScrollbar;
      scrollbar.isScrollbar = true;
      scrollbar.scrollbarHeight = scrollbarHeight;
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
      const timerText = this.addManagerPanelObject(
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
      this.managerPanelAssignedUi = {
        managerId: manager.id,
        timerText,
        abilityIcon
      };

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

    const assignButton = this.createPanelButton(
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
    if (manager.area === this.activeManagerPanelArea && !assignedToDifferentShaft) {
      this.managerPanelAssignButtonUi ??= assignButton;
    }
    (container as ManagerPanelContentContainer).scrollInteractiveZones?.push(assignButton.zone);
  }

  private createHireOfferEntry(container: Phaser.GameObjects.Container, offer: ManagerHireOffer, x: number, y: number): ManagerPanelHireOfferUi {
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
    const costText = this.addManagerPanelObject(
      container,
      this.add
        .text(x + 76, y + 23, formatMoney(offer.hireCost), smallUiTextStyle(11, offer.canAfford ? "#f1d389" : "#f08e7f"))
        .setDepth(MANAGER_PANEL_TEXT_DEPTH)
    );

    const button = this.createPanelButton(
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

    return {
      area: offer.area,
      costText,
      button
    };
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
  ): ManagerPanelButtonUi {
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

    const button: ManagerPanelButtonUi = {
      image,
      text,
      zone,
      interactive,
      enabledTint
    };
    this.setPanelButtonVisualEnabled(button, visualEnabled);
    return button;
  }

  private setPanelButtonVisualEnabled(button: ManagerPanelButtonUi, visualEnabled: boolean): void {
    const tint = button.enabledTint ?? (visualEnabled ? 0xffffff : 0x8c6c58);

    button.image
      .setAlpha(visualEnabled ? 1 : 0.64)
      .setTint(tint);
    button.text.setColor(visualEnabled ? "#fff8de" : "#e3c7aa");

    if (button.zone.input) {
      button.zone.input.cursor = button.interactive ? "pointer" : "default";
    }
  }

  private refreshManagerPanelDynamicState(state: GameState): void {
    const area = this.activeManagerPanelArea;
    if (area === null || this.managerPanel === undefined) {
      return;
    }

    for (const offerUi of this.managerPanelHireOfferUi) {
      const hiredCount = state.managers.hireCountsByArea[offerUi.area];
      const hireCost = getManagerHireCost(this.balance, offerUi.area, hiredCount);
      const canAfford = state.money + Number.EPSILON >= hireCost;

      offerUi.costText
        .setText(formatMoney(hireCost))
        .setColor(canAfford ? "#f1d389" : "#f08e7f");
      this.setPanelButtonVisualEnabled(offerUi.button, canAfford);
    }

    const shaftId = area === "mineShaft" ? this.activeManagerPanelShaftId ?? 1 : null;
    const assignedManager =
      area === "mineShaft" ? getAssignedManagerForShaft(state, shaftId ?? 1) : getAssignedManagerForArea(state, area);
    const assignedUi = this.managerPanelAssignedUi;

    if (assignedManager !== undefined && assignedUi !== null && assignedUi.managerId === assignedManager.id) {
      assignedUi.timerText.setText(formatManagerTimer(assignedManager));
      assignedUi.abilityIcon.setAlpha(assignedManager.isActive ? 1 : assignedManager.remainingCooldownTime > 0 ? 0.48 : 0.92);
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

    if (!card.enabled) {
      card.buttonBg.clearTint();
    } else {
      const pointer = this.input.activePointer;
      if (card.buttonZone.getBounds().contains(pointer.x, pointer.y)) {
        card.buttonBg.setTint(0xcccccc);
      } else {
        card.buttonBg.clearTint();
      }
    }
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

      this.queueSuperCashAnimationSourceFrom(card.buttonZone);
      this.applyFrame(this.viewModel.purchaseUpgrade(target), this.time.now);
    });
  }

  private setUpgradeCardEnabled(card: UpgradeCardUi, enabled: boolean): void {
    card.enabled = enabled;
    card.frame.setAlpha(enabled ? 1 : 0.88);
    card.levelBadge.setAlpha(enabled ? 1 : 0.76);
    card.buttonImage.setAlpha(enabled ? 1 : 0.7);
    
    const pointer = this.input.activePointer;
    const isOver = card.buttonZone.getBounds().contains(pointer.x, pointer.y);
    
    if (enabled && isOver) {
      card.buttonImage.setTint(0xcccccc);
    } else {
      card.buttonImage.setTint(enabled ? 0xffffff : 0x9c7f58);
    }
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

    const pointer = this.input.activePointer;
    const isOver = row.upgradeButtonZone.getBounds().contains(pointer.x, pointer.y);

    if (enabled && isOver) {
      row.upgradeButtonImage.setTint(0xcccccc);
    } else {
      row.upgradeButtonImage.setTint(enabled ? 0xffffff : 0x9c7f58);
    }
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
    if (row.mode === mode) {
      return;
    }

    row.mode = mode;
    const isUnlocked = mode === "unlocked";
    const isLocked = mode === "locked";

    row.unlockedObjects.forEach((object) => setVisibleIfChanged(object, isUnlocked));
    row.lockedObjects.forEach((object) => setVisibleIfChanged(object, isLocked));
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
    if (row.panelFrameDrawn) {
      return;
    }

    row.panelFrameDrawn = true;
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
    const cacheKey = `${automated ? 1 : 0}|${locked ? 1 : 0}|${activeAbility ? 1 : 0}`;

    if (row.managerFrameCacheKey === cacheKey) {
      return;
    }

    row.managerFrameCacheKey = cacheKey;
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
    const cacheKey = `${canUnlock ? 1 : 0}|${previousUnlocked ? 1 : 0}`;

    if (row.lockedPlaceholderCacheKey === cacheKey) {
      return;
    }

    row.lockedPlaceholderCacheKey = cacheKey;
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

    if (deepestUnlockedShaftId === this.renderedElevatorShaftId) {
      return;
    }

    this.renderedElevatorShaftId = deepestUnlockedShaftId;
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

  private refreshElevatorShaftVisibility(state: GameState): void {
    const deepestUnlockedShaftId = getDeepestUnlockedShaftId(state, this.totalMineShafts);
    const middleSegmentCount = this.getElevatorMiddleSegmentCount(deepestUnlockedShaftId);

    setVisibleIfChanged(this.elevatorShaftTop, this.isImageNearViewport(this.elevatorShaftTop));
    setVisibleIfChanged(this.elevatorShaftBottom, this.isImageNearViewport(this.elevatorShaftBottom));

    this.elevatorShaftMiddleSegments.forEach((segment, index) => {
      setVisibleIfChanged(segment, index < middleSegmentCount && this.isImageNearViewport(segment));
    });
  }

  private isImageNearViewport(image: Phaser.GameObjects.Image, preloadMargin = 120): boolean {
    const halfHeight = image.displayHeight / 2;
    const viewportTop = this.cameras.main.scrollY - preloadMargin;
    const viewportBottom = this.cameras.main.scrollY + GAME_HEIGHT + preloadMargin;

    return image.y + halfHeight >= viewportTop && image.y - halfHeight <= viewportBottom;
  }

  private processElevatorRouteEvents(state: GameState, events: SimulationEvent[]): void {
    if (events.length === 0) {
      return;
    }

    if (events.some((event) => event.type === "activeMineChanged")) {
      this.elevatorAnimationQueue = [];
      this.activeElevatorAnimation = undefined;
      this.elevatorVisualLoaded = state.entities.elevator.carriedOre > 0;

      for (let shaftId = 1; shaftId <= this.totalMineShafts; shaftId += 1) {
        this.shaftRouteFeedbackById[shaftId] = undefined;
      }
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

  private loadTutorialProgress(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (raw === null) {
        return;
      }

      const parsed = JSON.parse(raw) as {
        completed?: unknown;
        progressIndex?: unknown;
        managerUnlockAcknowledged?: unknown;
        managerBoostHintShown?: unknown;
      };
      this.tutorialCompleted = parsed.completed === true;
      this.tutorialProgressIndex =
        typeof parsed.progressIndex === "number" && Number.isInteger(parsed.progressIndex)
          ? Phaser.Math.Clamp(parsed.progressIndex, 0, tutorialStepOrder.length)
          : 0;
      this.tutorialManagerUnlockAcknowledged = parsed.managerUnlockAcknowledged === true;
      this.managerBoostHintShown = parsed.managerBoostHintShown === true;
    } catch {
      this.tutorialProgressIndex = 0;
      this.tutorialCompleted = false;
    }
  }

  private saveTutorialProgress(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        TUTORIAL_STORAGE_KEY,
        JSON.stringify({
          completed: this.tutorialCompleted,
          progressIndex: this.tutorialProgressIndex,
          managerUnlockAcknowledged: this.tutorialManagerUnlockAcknowledged,
          managerBoostHintShown: this.managerBoostHintShown
        })
      );
    } catch {
      // Tutorial progress is best-effort and separate from the savegame.
    }
  }

  private updateTutorialOverlay(state: GameState): void {
    if (this.shouldShowManagerBoostHint(state)) {
      this.showManagerBoostHint(state);
      return;
    }

    if (this.tutorialCompleted || this.tutorialCompletionPending || this.mapViewContainer !== undefined || this.shopSoonModalObjects !== undefined) {
      this.destroyTutorialOverlay();
      return;
    }

    this.advanceCompletedTutorialAction(state);
    this.skipSatisfiedTutorialSteps(state);

    const step = tutorialStepOrder[this.tutorialProgressIndex];
    if (step === undefined) {
      this.completeTutorial();
      return;
    }

    if (step === "managerUnlock" && this.tutorialManagerUnlockAcknowledged) {
      if (!this.isManagerTutorialResumeReady(state)) {
        this.destroyTutorialOverlay();
        return;
      }

      this.advanceTutorialStep();
      return;
    }

    const target = this.getTutorialTarget(step, state);
    if (target === null) {
      this.destroyTutorialOverlay();
      return;
    }

    if (target.isWorldSpace) {
      this.scrollTutorialTargetIntoView(target.rect, state);
    }

    const screenRect = target.isWorldSpace ? this.worldRectToScreenRect(target.rect) : target.rect;
    const paddedRect = clampRectToScreen(padRect(screenRect, TUTORIAL_FOCUS_PADDING));

    const overlay = this.getOrCreateTutorialOverlay();
    this.layoutTutorialOverlay(overlay, paddedRect, step, state);
  }

  private skipSatisfiedTutorialSteps(state: GameState): void {
    let changed = false;

    while (this.isTutorialStepSatisfied(tutorialStepOrder[this.tutorialProgressIndex], state)) {
      this.tutorialProgressIndex += 1;
      changed = true;
    }

    if (this.tutorialProgressIndex >= tutorialStepOrder.length) {
      this.completeTutorial();
      return;
    }

    if (changed) {
      this.saveTutorialProgress();
    }
  }

  private isTutorialStepSatisfied(step: TutorialStepId | undefined, state: GameState): boolean {
    if (step === undefined) {
      return true;
    }

    const firstShaft = state.entities.mineShafts[1];
    const ownedMineManagers = state.managers.ownedManagers.filter((manager) => manager.area === "mineShaft" && manager.isOwned);
    const assignedMineManager = getAssignedManagerForShaft(state, 1);
    const firstMineManagerCost = getManagerHireCost(this.balance, "mineShaft", state.managers.hireCountsByArea.mineShaft);

    switch (step) {
      case "mineLevel2":
        return firstShaft.level >= 2;
      case "managerCash":
        return state.money + EPSILON >= firstMineManagerCost || ownedMineManagers.length > 0;
      case "managerSlot":
        return this.activeManagerPanelArea === "mineShaft" || ownedMineManagers.length > 0;
      case "managerHire":
        return ownedMineManagers.length > 0;
      case "managerAssign":
        return assignedMineManager !== undefined;
      case "managerAbility":
        return assignedMineManager !== undefined && (assignedMineManager.isActive || assignedMineManager.remainingCooldownTime > 0);
      default:
        return false;
    }
  }

  private getTutorialTarget(step: TutorialStepId, state: GameState): TutorialTarget | null {
    const firstShaftRow = this.mineShaftRows[1];

    switch (step) {
      case "manualMine":
        return { rect: getObjectBounds(firstShaftRow.mineClickZone), isWorldSpace: true };
      case "manualElevator":
        return { rect: getObjectBounds(this.elevatorClickTarget.zone), isWorldSpace: true };
      case "manualWarehouse":
        return { rect: getObjectBounds(this.warehouseClickTarget.zone), isWorldSpace: true };
      case "mineLevel2":
        return {
          rect: state.upgrades.mineShafts[1].canAfford
            ? getObjectBounds(firstShaftRow.upgradeButtonZone)
            : this.getNextManualCashTutorialTarget(state),
          isWorldSpace: true
        };
      case "managerUnlock":
        return {
          rect: getObjectBounds(firstShaftRow.managerSlotZone),
          isWorldSpace: true
        };
      case "managerCash":
        return { rect: this.getNextManualCashTutorialTarget(state), isWorldSpace: true };
      case "managerSlot":
        return { rect: getObjectBounds(firstShaftRow.managerSlotZone), isWorldSpace: true };
      case "managerHire":
        if (this.activeManagerPanelArea !== "mineShaft") {
          return { rect: getObjectBounds(firstShaftRow.managerSlotZone), isWorldSpace: true };
        }
        return { rect: getObjectBounds(this.managerPanelHireOfferUi[0]?.button.zone ?? firstShaftRow.managerSlotZone), isWorldSpace: false };
      case "managerAssign":
        if (this.activeManagerPanelArea !== "mineShaft") {
          return { rect: getObjectBounds(firstShaftRow.managerSlotZone), isWorldSpace: true };
        }
        return { rect: getObjectBounds(this.managerPanelAssignButtonUi?.zone ?? firstShaftRow.managerSlotZone), isWorldSpace: false };
      case "managerOtherAreas":
        return {
          rect: unionRects([
            getObjectBounds(this.managerSlots.elevator.slotZone),
            getObjectBounds(this.managerSlots.warehouse.slotZone)
          ]),
          isWorldSpace: true
        };
      case "managerAbility": {
        const assignedMineManager = getAssignedManagerForShaft(state, 1);
        if (assignedMineManager === undefined) {
          return { rect: getObjectBounds(firstShaftRow.managerSlotZone), isWorldSpace: true };
        }
        return { rect: getObjectBounds(firstShaftRow.managerAbilityZone), isWorldSpace: true };
      }
      case "managerAllBoost":
        if (this.allManagerAbilitiesButton === undefined) {
          return null;
        }

        return { rect: getObjectBounds(this.allManagerAbilitiesButton.zone), isWorldSpace: false };
    }
  }

  private shouldShowManagerBoostHint(state: GameState): boolean {
    if (!this.tutorialCompleted || this.managerBoostHintShown || this.mapViewContainer !== undefined || this.shopSoonModalObjects !== undefined) {
      return false;
    }

    if (this.activeManagerPanelArea !== null || this.managerPanel !== undefined) {
      return false;
    }

    const ownedManagerCount = state.managers.ownedManagers.filter((manager) => manager.isOwned).length;
    return ownedManagerCount >= 3;
  }

  private showManagerBoostHint(state: GameState): void {
    if (this.allManagerAbilitiesButton === undefined) {
      return;
    }

    this.managerBoostHintActive = true;
    const targetRect = getObjectBounds(this.allManagerAbilitiesButton.zone);
    const paddedRect = clampRectToScreen(padRect(targetRect, TUTORIAL_FOCUS_PADDING));
    const overlay = this.getOrCreateTutorialOverlay();

    this.layoutTutorialOverlay(overlay, paddedRect, "managerAllBoost", state);
  }

  private getNextManualCashTutorialTarget(state: GameState): Phaser.Geom.Rectangle {
    const firstShaft = state.entities.mineShafts[1];

    if (state.entities.warehouse.storedOre > EPSILON) {
      return getObjectBounds(this.warehouseClickTarget.zone);
    }

    if (firstShaft.storedOre > EPSILON || state.entities.elevator.carriedOre > EPSILON) {
      return getObjectBounds(this.elevatorClickTarget.zone);
    }

    return getObjectBounds(this.mineShaftRows[1].mineClickZone);
  }

  private getOrCreateTutorialOverlay(): TutorialOverlayUi {
    if (this.tutorialOverlay !== undefined) {
      return this.tutorialOverlay;
    }

    const masks = [
      this.pinUi(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0, 0).setDepth(TUTORIAL_DEPTH)),
      this.pinUi(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0, 0).setDepth(TUTORIAL_DEPTH)),
      this.pinUi(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0, 0).setDepth(TUTORIAL_DEPTH)),
      this.pinUi(this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setOrigin(0, 0).setDepth(TUTORIAL_DEPTH))
    ];
    masks.forEach((mask) => {
      mask.setInteractive().on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
      });
    });
    const outline = this.pinUi(
      this.add
        .rectangle(0, 0, 10, 10)
        .setOrigin(0, 0)
        .setStrokeStyle(4, 0xf6d36e, 1)
        .setDepth(TUTORIAL_DEPTH + 1)
    );
    const focusZone = this.pinUi(
      this.add
        .zone(0, 0, 10, 10)
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(TUTORIAL_DEPTH + 3)
    );
    const panel = this.pinUi(this.add.graphics().setDepth(TUTORIAL_DEPTH + 2));
    const titleText = this.pinUi(
      this.add
        .text(0, 0, "", topBarTextStyle(20, "#f7e5b2"))
        .setDepth(TUTORIAL_DEPTH + 3)
    );
    const bodyText = this.pinUi(
      this.add
        .text(0, 0, "", {
          fontFamily: UI_FONT_FAMILY,
          fontSize: "15px",
          fontStyle: "700",
          color: "#dcecf1",
          lineSpacing: 5,
          wordWrap: { width: 374, useAdvancedWrap: true }
        })
        .setDepth(TUTORIAL_DEPTH + 3)
    );
    const okButton = this.pinUi(this.add.graphics().setDepth(TUTORIAL_DEPTH + 3).setVisible(false));
    const okButtonText = this.pinUi(
      this.add
        .text(0, 0, "OK", smallUiTextStyle(15, "#fff8de"))
        .setOrigin(0.5)
        .setDepth(TUTORIAL_DEPTH + 4)
        .setVisible(false)
    );

    focusZone.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.handleTutorialFocusedClick();
    });

    this.tutorialOverlay = { masks, outline, focusZone, panel, titleText, bodyText, okButton, okButtonText };
    return this.tutorialOverlay;
  }

  private layoutTutorialOverlay(
    overlay: TutorialOverlayUi,
    focusRect: Phaser.Geom.Rectangle,
    step: TutorialStepId,
    state: GameState
  ): void {
    overlay.masks[0].setPosition(0, 0).setSize(GAME_WIDTH, focusRect.y);
    overlay.masks[1].setPosition(0, focusRect.bottom).setSize(GAME_WIDTH, Math.max(0, GAME_HEIGHT - focusRect.bottom));
    overlay.masks[2].setPosition(0, focusRect.y).setSize(focusRect.x, focusRect.height);
    overlay.masks[3].setPosition(focusRect.right, focusRect.y).setSize(Math.max(0, GAME_WIDTH - focusRect.right), focusRect.height);
    overlay.outline.setPosition(focusRect.x, focusRect.y).setSize(focusRect.width, focusRect.height);
    overlay.focusZone.setPosition(focusRect.x, focusRect.y).setSize(focusRect.width, focusRect.height);
    overlay.focusZone.setInteractive({ useHandCursor: true });

    const showOkButton = step === "managerUnlock";
    const copy = getTutorialCopy(step, state, this.balance, this.tutorialPendingActionStep === step);
    const panelWidth = 420;
    const panelHeight = showOkButton ? 128 : 142;
    const panelPosition = getTutorialPanelPosition(focusRect, panelWidth, panelHeight);

    overlay.panel.clear();
    overlay.panel.fillStyle(0x14222c, 0.98);
    overlay.panel.fillRoundedRect(panelPosition.x, panelPosition.y, panelWidth, panelHeight, 14);
    overlay.panel.fillStyle(0x2d4652, 0.7);
    overlay.panel.fillRoundedRect(panelPosition.x + 5, panelPosition.y + 5, panelWidth - 10, panelHeight - 10, 10);
    overlay.panel.lineStyle(2, 0xf6d36e, 0.92);
    overlay.panel.strokeRoundedRect(panelPosition.x + 1, panelPosition.y + 1, panelWidth - 2, panelHeight - 2, 14);
    overlay.titleText.setPosition(panelPosition.x + 22, panelPosition.y + 18).setText(copy.title);
    overlay.bodyText.setPosition(panelPosition.x + 22, panelPosition.y + 52).setText(copy.body);

    overlay.okButton.setVisible(showOkButton);
    overlay.okButtonText.setVisible(showOkButton);

    if (showOkButton) {
      const okWidth = 74;
      const okHeight = 30;
      const okX = panelPosition.x + panelWidth - okWidth - 22;
      const okY = panelPosition.y + panelHeight - okHeight - 18;

      overlay.okButton.clear();
      overlay.okButton.fillStyle(0x4f7f44, 1);
      overlay.okButton.fillRoundedRect(okX, okY, okWidth, okHeight, 8);
      overlay.okButton.lineStyle(2, 0xbff09a, 0.9);
      overlay.okButton.strokeRoundedRect(okX + 1, okY + 1, okWidth - 2, okHeight - 2, 8);
      overlay.okButtonText.setPosition(okX + okWidth / 2, okY + okHeight / 2 - 1);
      overlay.focusZone.setPosition(okX, okY).setSize(okWidth, okHeight);
      overlay.focusZone.setInteractive({ useHandCursor: true });
    } else {
      overlay.okButton.clear();
    }
  }

  private handleTutorialFocusedClick(): void {
    const state = this.latestState;
    if (state === undefined || this.tutorialCompleted || this.tutorialCompletionPending || this.tutorialPendingActionStep !== null) {
      if (state !== undefined && this.managerBoostHintActive) {
        this.dismissManagerBoostHint();
      }
      return;
    }

    if (this.managerBoostHintActive) {
      if (this.allManagerAbilitiesButton?.enabled === true) {
        this.applyFrame(this.viewModel.activateAllManagerAbilities(), this.time.now);
      }

      this.dismissManagerBoostHint();
      return;
    }

    const step = tutorialStepOrder[this.tutorialProgressIndex];

    switch (step) {
      case "manualMine":
        this.tutorialPendingActionStep = "manualMine";
        this.applyFrame(this.viewModel.manualMineAction(1), this.time.now);
        return;
      case "manualElevator":
        this.tutorialPendingActionStep = "manualElevator";
        this.applyFrame(this.viewModel.manualElevatorAction(), this.time.now);
        return;
      case "manualWarehouse":
        this.tutorialPendingActionStep = "manualWarehouse";
        this.applyFrame(this.viewModel.manualWarehouseAction(), this.time.now);
        return;
      case "mineLevel2":
        if (state.upgrades.mineShafts[1].canAfford) {
          this.queueSuperCashAnimationSourceFrom(this.mineShaftRows[1].upgradeButtonZone);
          this.applyFrame(this.viewModel.upgradeMineShaft(1), this.time.now);
        } else {
          this.handleTutorialCashClick(state);
        }
        return;
      case "managerUnlock":
        if (this.isManagerTutorialResumeReady(state)) {
          this.advanceTutorialStep();
          return;
        }

        this.tutorialManagerUnlockAcknowledged = true;
        this.saveTutorialProgress();
        this.destroyTutorialOverlay();
        return;
      case "managerCash":
        this.handleTutorialCashClick(state);
        return;
      case "managerSlot":
        this.openManagerPanel("mineShaft", state, 1);
        this.advanceTutorialStep();
        this.updateTutorialOverlay(this.latestState ?? state);
        return;
      case "managerHire":
        if (this.activeManagerPanelArea !== "mineShaft") {
          this.openManagerPanel("mineShaft", state, 1);
          return;
        }
        this.applyFrame(this.viewModel.purchaseManager("mineShaft"), this.time.now);
        return;
      case "managerAssign": {
        const manager = state.managers.ownedManagers.find((entry) => entry.area === "mineShaft" && entry.isOwned && !entry.isAssigned);
        if (manager !== undefined) {
          this.closeManagerPanel();
          this.applyFrame(this.viewModel.assignManager(manager.id, "mineShaft", 1), this.time.now);
        }
        return;
      }
      case "managerOtherAreas":
        this.advanceTutorialStep();
        this.updateTutorialOverlay(this.latestState ?? state);
        return;
      case "managerAbility":
        this.tutorialCompletionPending = true;
        this.activateAssignedManagerAbility("mineShaft", 1);
        this.time.delayedCall(0, () => {
          this.completeTutorial();
        });
        return;
      case "managerAllBoost":
        this.dismissManagerBoostHint();
        return;
    }
  }

  private dismissManagerBoostHint(): void {
    this.managerBoostHintActive = false;
    this.managerBoostHintShown = true;
    this.saveTutorialProgress();
    this.destroyTutorialOverlay();
  }

  private handleTutorialCashClick(state: GameState): void {
    const firstShaft = state.entities.mineShafts[1];

    if (state.entities.warehouse.storedOre > EPSILON) {
      this.applyFrame(this.viewModel.manualWarehouseAction(), this.time.now);
      return;
    }

    if (firstShaft.storedOre > EPSILON || state.entities.elevator.carriedOre > EPSILON) {
      this.applyFrame(this.viewModel.manualElevatorAction(), this.time.now);
      return;
    }

    this.applyFrame(this.viewModel.manualMineAction(1), this.time.now);
  }

  private advanceTutorialStep(): void {
    this.tutorialPendingActionStep = null;
    this.tutorialProgressIndex += 1;
    this.saveTutorialProgress();
    if (this.latestState !== undefined) {
      this.updateTutorialOverlay(this.latestState);
    }
  }

  private completeTutorial(): void {
    this.tutorialCompleted = true;
    this.tutorialProgressIndex = tutorialStepOrder.length;
    this.tutorialPendingActionStep = null;
    this.tutorialCompletionPending = false;
    this.tutorialManagerUnlockAcknowledged = true;
    this.saveTutorialProgress();
    this.destroyTutorialOverlay();
  }

  private destroyTutorialOverlay(): void {
    if (this.tutorialOverlay === undefined) {
      return;
    }

    this.tutorialOverlay.masks.forEach((object) => object.destroy());
    this.tutorialOverlay.outline.destroy();
    this.tutorialOverlay.focusZone.destroy();
    this.tutorialOverlay.panel.destroy();
    this.tutorialOverlay.titleText.destroy();
    this.tutorialOverlay.bodyText.destroy();
    this.tutorialOverlay.okButton.destroy();
    this.tutorialOverlay.okButtonText.destroy();
    this.tutorialOverlay = undefined;
  }

  private advanceCompletedTutorialAction(state: GameState): void {
    if (this.tutorialPendingActionStep === null) {
      return;
    }

    if (!this.isTutorialActionComplete(this.tutorialPendingActionStep, state)) {
      return;
    }

    this.advanceTutorialStep();
  }

  private isTutorialActionComplete(step: TutorialBlockingActionStep, state: GameState): boolean {
    switch (step) {
      case "manualMine":
        return state.entities.mineShafts[1].state === "idle" && state.entities.mineShafts[1].storedOre > EPSILON;
      case "manualElevator":
        return state.entities.elevator.state === "idle" && state.entities.warehouse.storedOre > EPSILON;
      case "manualWarehouse":
        return state.entities.warehouse.state === "idle" && state.money > EPSILON;
    }
  }

  private isManagerTutorialResumeReady(state: GameState): boolean {
    const firstMineManagerCost = getManagerHireCost(this.balance, "mineShaft", state.managers.hireCountsByArea.mineShaft);
    const hasMineManager = state.managers.ownedManagers.some((manager) => manager.area === "mineShaft" && manager.isOwned);

    return (
      state.entities.mineShafts[1].level >= state.managers.unlockLevel &&
      (state.money + EPSILON >= firstMineManagerCost || hasMineManager)
    );
  }

  private scrollTutorialTargetIntoView(rect: Phaser.Geom.Rectangle, state: GameState): void {
    const desiredTop = rect.y - 190;
    const desiredBottom = rect.bottom - GAME_HEIGHT + 190;
    const maxScroll = this.getMaxCameraScroll(state);
    const currentScroll = this.cameras.main.scrollY;
    let nextScroll = currentScroll;

    if (rect.y - currentScroll < 90) {
      nextScroll = desiredTop;
    } else if (rect.bottom - currentScroll > GAME_HEIGHT - 90) {
      nextScroll = desiredBottom;
    }

    this.cameras.main.scrollY = Phaser.Math.Clamp(nextScroll, 0, maxScroll);
  }

  private worldRectToScreenRect(rect: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(rect.x, rect.y - this.cameras.main.scrollY, rect.width, rect.height);
  }
}

const tutorialStepOrder: readonly TutorialStepId[] = [
  "manualMine",
  "manualElevator",
  "manualWarehouse",
  "mineLevel2",
  "managerUnlock",
  "managerCash",
  "managerSlot",
  "managerHire",
  "managerAssign",
  "managerOtherAreas",
  "managerAbility"
] as const;

function getTutorialCopy(
  step: TutorialStepId,
  state: GameState,
  balance: BalanceConfig,
  isWaiting = false
): { title: string; body: string } {
  const managerLevel = state.managers.unlockLevel;
  const managerCost = getManagerHireCost(balance, "mineShaft", state.managers.hireCountsByArea.mineShaft);

  switch (step) {
    case "manualMine":
      return {
        title: isWaiting ? "Mining in progress" : "Mine ore",
        body: isWaiting
          ? "Wait until the miner finishes and drops ore into the shaft box."
          : "Click the shaft. The miner digs ore and drops it into the box."
      };
    case "manualElevator":
      return {
        title: isWaiting ? "Elevator moving" : "Move ore",
        body: isWaiting
          ? "Wait until the elevator finishes its trip and delivers ore to the surface."
          : "Click the elevator. It collects ore from the shaft and brings it to the surface."
      };
    case "manualWarehouse":
      return {
        title: isWaiting ? "Selling ore" : "Sell ore",
        body: isWaiting
          ? "Wait until the warehouse worker finishes the sale and cash is added."
          : "Click the warehouse. The worker sells the ore and earns cash."
      };
    case "mineLevel2":
      return {
        title: "Upgrade the mine to level 2",
        body: state.upgrades.mineShafts[1].canAfford
          ? "Buy the first shaft upgrade. More levels increase production and storage."
          : "Earn enough cash with the mine, elevator, and warehouse. Then buy the upgrade here."
      };
    case "managerUnlock":
      return {
        title: `Managers unlock at level ${managerLevel}`,
        body: `Managers automate work. They unlock when this mine shaft reaches level ${managerLevel}.`
      };
    case "managerCash":
      return {
        title: "Prepare for a manager",
        body: `A mine manager costs ${formatMoney(managerCost)}. Keep running the core loop until you have enough cash.`
      };
    case "managerSlot":
      return {
        title: "Open managers",
        body: "Click the shaft manager slot. This is where you hire and assign managers."
      };
    case "managerHire":
      return {
        title: "Hire a manager",
        body: "Hire a manager for the shaft. Every manager comes with a random ability."
      };
    case "managerAssign":
      return {
        title: "Assign the manager",
        body: "Assign the hired manager to the shaft. The mine will start working automatically."
      };
    case "managerOtherAreas":
      return {
        title: "Every area needs a manager",
        body: "The elevator and warehouse also need their own managers before the full production chain is automated."
      };
    case "managerAbility":
      return {
        title: "Use the ability",
        body: "Click the manager ability icon. Abilities give short, powerful production or cost bonuses."
      };
    case "managerAllBoost":
      return {
        title: "Boost all managers",
        body: "This button activates every ready manager ability at once."
      };
  }
}

function getObjectBounds(object: Phaser.GameObjects.Zone): Phaser.Geom.Rectangle {
  return object.getBounds(new Phaser.Geom.Rectangle());
}

function unionRects(rects: Phaser.Geom.Rectangle[]): Phaser.Geom.Rectangle {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));

  return new Phaser.Geom.Rectangle(left, top, right - left, bottom - top);
}

function padRect(rect: Phaser.Geom.Rectangle, padding: number): Phaser.Geom.Rectangle {
  return new Phaser.Geom.Rectangle(
    rect.x - padding,
    rect.y - padding,
    rect.width + padding * 2,
    rect.height + padding * 2
  );
}

function clampRectToScreen(rect: Phaser.Geom.Rectangle): Phaser.Geom.Rectangle {
  const left = Phaser.Math.Clamp(rect.left, 0, GAME_WIDTH);
  const top = Phaser.Math.Clamp(rect.top, 0, GAME_HEIGHT);
  const right = Phaser.Math.Clamp(rect.right, left + 1, GAME_WIDTH);
  const bottom = Phaser.Math.Clamp(rect.bottom, top + 1, GAME_HEIGHT);

  return new Phaser.Geom.Rectangle(left, top, right - left, bottom - top);
}

function getTutorialPanelPosition(
  focusRect: Phaser.Geom.Rectangle,
  panelWidth: number,
  panelHeight: number
): { x: number; y: number } {
  const margin = 18;
  const gap = 16;
  const centeredX = Phaser.Math.Clamp(focusRect.centerX - panelWidth / 2, margin, GAME_WIDTH - panelWidth - margin);
  const centeredY = Phaser.Math.Clamp(focusRect.centerY - panelHeight / 2, margin, GAME_HEIGHT - panelHeight - margin);
  const candidates = [
    { x: centeredX, y: focusRect.bottom + gap },
    { x: centeredX, y: focusRect.y - panelHeight - gap },
    { x: focusRect.right + gap, y: centeredY },
    { x: focusRect.x - panelWidth - gap, y: centeredY }
  ];

  for (const candidate of candidates) {
    const panelRect = new Phaser.Geom.Rectangle(candidate.x, candidate.y, panelWidth, panelHeight);
    const isInsideScreen =
      panelRect.left >= margin &&
      panelRect.top >= margin &&
      panelRect.right <= GAME_WIDTH - margin &&
      panelRect.bottom <= GAME_HEIGHT - margin;

    if (isInsideScreen && !Phaser.Geom.Intersects.RectangleToRectangle(panelRect, focusRect)) {
      return candidate;
    }
  }

  const fallback = candidates.find((candidate) => {
    const panelRect = new Phaser.Geom.Rectangle(
      Phaser.Math.Clamp(candidate.x, margin, GAME_WIDTH - panelWidth - margin),
      Phaser.Math.Clamp(candidate.y, margin, GAME_HEIGHT - panelHeight - margin),
      panelWidth,
      panelHeight
    );

    return !Phaser.Geom.Intersects.RectangleToRectangle(panelRect, focusRect);
  });

  if (fallback !== undefined) {
    return {
      x: Phaser.Math.Clamp(fallback.x, margin, GAME_WIDTH - panelWidth - margin),
      y: Phaser.Math.Clamp(fallback.y, margin, GAME_HEIGHT - panelHeight - margin)
    };
  }

  return {
    x: margin,
    y: GAME_HEIGHT - panelHeight - margin
  };
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
    if (!shaft.isUnlocked || !state.managers.automationEnabledByShaft[shaft.shaftId]) {
      return sum;
    }

    return sum + state.currentValues.mineShafts[shaft.shaftId].throughputPerSecond;
  }, 0);

  const baseMineRate = Object.values(state.entities.mineShafts).reduce((sum, shaft) => {
    if (!shaft.isUnlocked || !state.managers.automationEnabledByShaft[shaft.shaftId]) {
      return sum;
    }

    return sum + state.baseValues.mineShafts[shaft.shaftId].throughputPerSecond;
  }, 0);

  const currentElevatorRate = state.managers.automationEnabledByArea.elevator
    ? state.currentValues.elevator.throughputPerSecond
    : 0;
  const baseElevatorRate = state.managers.automationEnabledByArea.elevator
    ? state.baseValues.elevator.throughputPerSecond
    : 0;

  const currentWarehouseRate = state.managers.automationEnabledByArea.warehouse
    ? state.currentValues.warehouse.throughputPerSecond
    : 0;
  const baseWarehouseRate = state.managers.automationEnabledByArea.warehouse
    ? state.baseValues.warehouse.throughputPerSecond
    : 0;

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

function getMapMineConfig(mineId: MineId): (typeof MAP_MINE_AREAS)[number] {
  return MAP_MINE_AREAS.find((area) => area.key === mineId) ?? MAP_MINE_AREAS[0];
}

type MineVariantTextureKey =
  | "background-surface"
  | "background-underground"
  | "background-underground-depth-2"
  | "background-underground-depth-3"
  | "background-underground-depth-4"
  | "background-underground-depth-5"
  | "background-underground-depth-6"
  | "elevator-cabin-loaded"
  | "mine-shaft-back-wall"
  | "mine-shaft-back-wall-level2"
  | "mine-shaft-back-wall-level3"
  | "mine-pickup-full"
  | "mine-pickup-small"
  | "miner-carry"
  | "miner-drop"
  | "miner-pickaxe-02"
  | "ore-deposit"
  | "ore-icon"
  | "warehouse-building"
  | "warehouse-pile-full"
  | "warehouse-pile-small"
  | "warehouse-worker-carry"
  | "warehouse-worker-sell";

function getMineTextureKey(mineId: MineId, key: MineVariantTextureKey): string {
  const candidate = `${key}-${mineId}`;
  return mineId !== DEFAULT_ACTIVE_MINE_ID && candidate in assetManifest ? candidate : key;
}

function getMineBackWallTextureKey(mineId: MineId, shaftId: number): string {
  if (shaftId >= 21) {
    return getMineTextureKey(mineId, "mine-shaft-back-wall-level3");
  }

  if (shaftId >= 11) {
    return getMineTextureKey(mineId, "mine-shaft-back-wall-level2");
  }

  return getMineTextureKey(mineId, "mine-shaft-back-wall");
}

function getMapOreIconKey(mineId: MineId): string {
  return getMineTextureKey(mineId, "ore-icon");
}

function getMapMineProductionRate(mine: GameState["mines"][MineId], useBaseValues = false): number {
  const values = useBaseValues ? mine.baseValues : mine.currentValues;
  const mineRate = Object.values(mine.entities.mineShafts).reduce((sum, shaft) => {
    if (!shaft.isUnlocked || !mine.managers.automationEnabledByShaft[shaft.shaftId]) {
      return sum;
    }

    return sum + values.mineShafts[shaft.shaftId].throughputPerSecond;
  }, 0);
  const elevatorRate = mine.managers.automationEnabledByArea.elevator
    ? values.elevator.throughputPerSecond
    : 0;
  const warehouseRate = mine.managers.automationEnabledByArea.warehouse
    ? values.warehouse.throughputPerSecond
    : 0;

  return Math.min(mineRate, elevatorRate, warehouseRate);
}

function formatRate(value: number): string {
  return `${formatAmount(value)}/s`;
}

function formatOfflineDuration(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  return `${d > 0 ? `${d}d ` : ""}${h}h ${m}m`;
}

function getDepthBackgroundKey(depthGroup: number, mineId: MineId): string {
  switch (depthGroup) {
    case 1:
      return getMineTextureKey(mineId, "background-underground");
    case 2:
      return getMineTextureKey(mineId, "background-underground-depth-2");
    case 3:
      return getMineTextureKey(mineId, "background-underground-depth-3");
    case 4:
      return getMineTextureKey(mineId, "background-underground-depth-4");
    case 5:
      return getMineTextureKey(mineId, "background-underground-depth-5");
    default:
      return getMineTextureKey(mineId, "background-underground-depth-6");
  }
}

function getDepthBackgroundTint(depthGroup: number, mineId: MineId): number {
  if (mineId !== DEFAULT_ACTIVE_MINE_ID && mineId !== "emerald" && depthGroup >= 2 && depthGroup <= 6) {
    return 0xd8d8d8;
  }

  return 0xffffff;
}

function formatSpeedMultiplier(value: number): string {
  return `${formatSignificantNumber(value)}x`;
}

function formatMoney(value: number): string {
  return formatCurrency(value);
}

function formatSuperCash(value: number): string {
  return `$$${formatExplicitAmount(value)}`;
}

function formatAmount(value: number): string {
  return formatLargeNumber(value);
}

function formatExplicitAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  const roundedValue = Math.round(value);
  return roundedValue.toLocaleString("en-US", { maximumFractionDigits: 0 });
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

function getMineSpecificAssetEntries(mineId: MineId): Array<[string, string]> {
  if (mineId === DEFAULT_ACTIVE_MINE_ID) {
    return [];
  }

  return Object.entries(mineSpecificAssetManifest).filter(([key]) => key.endsWith(`-${mineId}`));
}

function getAssignedManagerForShaft(state: GameState, shaftId: number): ManagerState | undefined {
  const assignedManagerId = state.managers.assignedManagerIdsByShaft[shaftId];

  if (assignedManagerId === null || assignedManagerId === undefined) {
    return undefined;
  }

  return state.managers.ownedManagers.find((manager) => manager.id === assignedManagerId && manager.isOwned);
}

function getReadyAssignedManagers(state: GameState): ManagerState[] {
  return state.managers.ownedManagers.filter(
    (manager) =>
      manager.isOwned &&
      manager.isAssigned &&
      !manager.isActive &&
      manager.remainingCooldownTime <= EPSILON
  );
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

function setTextIfChanged(text: Phaser.GameObjects.Text, value: string): boolean {
  if (text.text === value) {
    return false;
  }

  text.setText(value);
  return true;
}

function setTextureIfChanged(image: Phaser.GameObjects.Image, key: string): boolean {
  if (image.texture.key === key) {
    return false;
  }

  image.setTexture(key);
  return true;
}

function setVisibleIfChanged(
  object: Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible,
  visible: boolean
): boolean {
  if (object.visible === visible) {
    return false;
  }

  object.setVisible(visible);
  return true;
}

function fitTextToWidth(text: Phaser.GameObjects.Text, maxWidth: number, fontSizes: number[]): void {
  for (const fontSize of fontSizes) {
    text.setFontSize(fontSize);

    if (text.width <= maxWidth) {
      return;
    }
  }
}
