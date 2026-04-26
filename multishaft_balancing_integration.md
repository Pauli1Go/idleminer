# Multi-Shaft Balancing – neue Parameter

## Ziel

Neue Minen sollen später verfügbar sein, beim Upgrade teurer wirken als alte Minen, dafür aber größere Produktionssprünge geben.  
Alte Minen bleiben günstiger und effizient für kleine, regelmäßige Upgrades. Aufzug und Warehouse sollen langfristig mit der Summe aller Minen mithalten.

---

## Neue Parameter in `balance.json`

### `mineShaftProduction`

```json
"mineShaftProduction": {
  "firstAdditionalShaftMultiplier": 32,
  "additionalShaftBaseMultiplier": 2.4,
  "additionalShaftDecay": 0.82,
  "decayStartsAtShaft": 3,
  "effectiveShaftMultipliers": [
    1,
    32,
    76.8,
    151.1424,
    297.4482432
  ]
}
```

`effectiveShaftMultipliers` ist die direkt verwendbare Variante.  
Shaft 1 nutzt `1`, Shaft 2 nutzt `32`, Shaft 3 nutzt `76.8`, usw.

---

### `mineShaftUnlock`

```json
"mineShaftUnlock": {
  "baseUnlockCostShaft2": 2500000,
  "unlockCostMultiplierPerShaft": 80,
  "explicitUnlockCosts": [
    2500000,
    150000000,
    9000000000,
    500000000000
  ]
}
```

Die Unlock-Kosten gelten für Shaft 2 bis Shaft 5.

---

### `upgradeCosts.mineShaft`

```json
"mineShaft": {
  "baseUpgradeCostForLevel2": 20,
  "costGrowthMultiplierPerLevel": 1.092,
  "milestoneCostSpikeMultiplier": 3,
  "upgradeCostShaftMultiplierMode": "explicitArray",
  "explicitShaftUpgradeCostMultipliers": [
    1,
    38,
    95,
    210,
    450
  ]
}
```

Wichtig: `baseUpgradeCostForLevel2` bleibt bei `20`.

---

## Integration im Code

### Produktions-Multiplier pro Mine

```ts
function getShaftProductionMultiplier(balance: Balance, shaftIndex: number): number {
  return balance.mineShaftProduction.effectiveShaftMultipliers[shaftIndex] ?? 1;
}
```

`shaftIndex` ist 0-basiert:

```ts
Shaft 1 -> shaftIndex = 0
Shaft 2 -> shaftIndex = 1
Shaft 3 -> shaftIndex = 2
```

---

## Mine-Produktion berechnen

```ts
function getMineShaftProductionRate(
  balance: Balance,
  shaftIndex: number,
  level: number
): number {
  const baseOre = balance.miner.baseOreProducedPerCycle;
  const cycleTime = balance.productionTimesSeconds.minerMiningCycleTime;

  const levelMultiplier =
    balance.upgradeMultipliers.mineShaft.oreProducedPerCycleMultiplierPerLevel ** (level - 1);

  const reachedMilestones = balance.mineShaft.largeBoostLevels
    .filter((milestoneLevel) => milestoneLevel <= level)
    .length;

  const milestoneMultiplier =
    balance.upgradeMultipliers.mineShaft.milestoneProductionBoostMultiplier ** reachedMilestones;

  const shaftMultiplier = getShaftProductionMultiplier(balance, shaftIndex);

  return (baseOre * levelMultiplier * milestoneMultiplier * shaftMultiplier) / cycleTime;
}
```

---

## Mine-Upgradepreis berechnen

```ts
function getMineShaftUpgradeCost(
  balance: Balance,
  shaftIndex: number,
  level: number
): number {
  const costConfig = balance.upgradeCosts.mineShaft;

  const reachedMilestones = balance.mineShaft.largeBoostLevels
    .filter((milestoneLevel) => milestoneLevel <= level)
    .length;

  const shaftCostMultiplier =
    costConfig.explicitShaftUpgradeCostMultipliers[shaftIndex] ?? 1;

  return (
    costConfig.baseUpgradeCostForLevel2 *
    costConfig.costGrowthMultiplierPerLevel ** (level - 1) *
    costConfig.milestoneCostSpikeMultiplier ** reachedMilestones *
    shaftCostMultiplier
  );
}
```

---

## Aufzug und Warehouse

Damit die Gesamtproduktion aller Minen nicht dauerhaft Aufzug und Warehouse überholt:

```json
"elevator": {
  "baseUpgradeCostForLevel2": 60
}
```

```json
"warehouse": {
  "baseUpgradeCostForLevel2": 80
}
```

Der Aufzug ist bewusst etwas günstiger, weil sein Basisdurchsatz niedriger ist.

---

## Wichtig

Nicht mehr diese alte Formel verwenden:

```ts
productionMultiplier ** upgradeCostProductionScalingFactor
```

Die neue Variante mit `explicitShaftUpgradeCostMultipliers` ist besser kontrollierbar und sorgt dafür, dass neue Minen teuer, aber lohnenswert sind.
