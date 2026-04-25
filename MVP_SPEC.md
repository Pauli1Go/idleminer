# MVP Spec

## Ziel

Dieser MVP definiert ein kleines Idle-Mining-Spiel mit genau **einer Mine**, **einem Mine Shaft**, **einem Miner**, **einem Elevator** und **einem Warehouse**. Der Fokus liegt auf einer klar lesbaren Produktionskette und einem einfachen Upgrade-Loop. Der MVP soll die Grundidee eines Idle-Mining-Spiels tragen, ohne die Breite des Originalspiels nachzubauen.

## 1. MVP-Featureliste

- Eine einzige Spielszene mit einer Mine im seitlichen Querschnitt
- Genau **ein Mine Shaft**
- Genau **ein Miner**, der automatisch Rohstoff abbaut
- Genau **ein Elevator**, der Rohstoff vom Shaft zur Oberfläche transportiert
- Genau **ein Warehouse**, das Rohstoff verkauft
- **Geld** als einzige Währung
- **Rohstoffspeicher** als sichtbare Puffer im Produktionsfluss
- Kontinuierlicher Ressourcenfluss von Abbau zu Verkauf
- Upgrade-System für **Mine Shaft**, **Elevator** und **Warehouse**
- Sichtbare Level und Upgrade-Kosten für alle drei Hauptsysteme
- Laufende Anzeige von Geld, Rohstoffmengen und Produktionsstatus
- Einfache Debug-UI für Test- und Balancing-Zwecke
- Platzhaltergrafiken mit eigener, generischer Optik

## 2. Nicht-MVP-Featureliste

- Mehrere Minen
- Mehrere Schächte
- Freischaltbare Tiefenebenen
- Prestige oder Reset-Systeme
- Events
- Shop
- Echtgeldkäufe
- Ads
- Offline-Fortschritt
- Missionen oder Quest-Systeme
- Komplexe Manager oder Managerfähigkeiten
- Forschung, Skill-Trees oder Meta-Progression
- Seltene Rohstoffe oder mehrere Rohstofftypen
- Originale Assets, exakte UI-Kopien oder exakte Gameplay-Kopien der Vorlage

## 3. Entities mit Eigenschaften

### Mine

Die Mine ist der Container für den gesamten Spielzustand.

| Eigenschaft | Bedeutung |
|---|---|
| `id` | Feste ID der Mine |
| `name` | Anzeigename der Mine |
| `money` | Aktuelles Geld des Spielers |
| `oreValue` | Geldwert pro verkaufter Rohstoffeinheit |
| `tickState` | Laufender Simulationszustand |

### Mine Shaft

Der Mine Shaft erzeugt Rohstoff und besitzt einen lokalen Puffer.

| Eigenschaft | Bedeutung |
|---|---|
| `level` | Aktuelles Upgrade-Level |
| `baseOrePerCycle` | Grundmenge pro Förderzyklus |
| `cycleTime` | Dauer eines Förderzyklus |
| `bufferCurrent` | Aktuell gelagerter Rohstoff im Shaft |
| `bufferCapacity` | Maximale Puffergröße |
| `upgradeCost` | Kosten für das nächste Upgrade |
| `throughputPerSecond` | Effektiver Durchsatz pro Sekunde |

### Miner

Der Miner ist dem einen Shaft fest zugeordnet und erzeugt Rohstoff.

| Eigenschaft | Bedeutung |
|---|---|
| `assignedShaftId` | Referenz auf den Mine Shaft |
| `active` | Ob der Miner arbeitet |
| `orePerCycle` | Aktuelle Fördermenge pro Zyklus |
| `cycleTime` | Aktuelle Dauer pro Förderzyklus |
| `state` | Zum Beispiel `mining` oder `blocked` |

### Elevator

Der Elevator transportiert Rohstoff vom Shaft zur Oberfläche.

| Eigenschaft | Bedeutung |
|---|---|
| `level` | Aktuelles Upgrade-Level |
| `loadCapacity` | Maximale Rohstoffmenge pro Fahrt |
| `tripTime` | Dauer einer vollständigen Transportfahrt |
| `carriedOre` | Aktuelle Ladung |
| `upgradeCost` | Kosten für das nächste Upgrade |
| `throughputPerSecond` | Effektiver Durchsatz pro Sekunde |
| `state` | Zum Beispiel `loading`, `moving`, `unloading`, `idle` |

### Warehouse

Das Warehouse verkauft angelieferten Rohstoff und erzeugt Geld.

| Eigenschaft | Bedeutung |
|---|---|
| `level` | Aktuelles Upgrade-Level |
| `storedOre` | Rohstoffmenge im Oberflächenlager |
| `storageCapacity` | Maximale Lagerkapazität |
| `sellCapacityPerCycle` | Verkaufsmenge pro Verkaufszyklus |
| `sellCycleTime` | Dauer eines Verkaufszyklus |
| `upgradeCost` | Kosten für das nächste Upgrade |
| `throughputPerSecond` | Effektiver Verkaufsdurchsatz |
| `state` | Zum Beispiel `selling` oder `idle` |

### Debug-UI

Die Debug-UI ist kein Spielsystem für Spielerprogression, sondern ein Testwerkzeug.

| Funktion | Bedeutung |
|---|---|
| `pause/resume` | Simulation anhalten und fortsetzen |
| `addMoney` | Testweise Geld hinzufügen |
| `setLevel` | Level von Shaft, Elevator oder Warehouse setzen |
| `addOre` | Rohstoff in Shaft- oder Warehouse-Puffer legen |
| `speedMultiplier` | Simulation beschleunigen |
| `resetRun` | Aktuellen Lauf auf Startzustand zurücksetzen |
| `debugStats` | Aktuelle Werte und Durchsätze sichtbar machen |

## 4. Core-Loop als Schrittfolge

1. Der Miner fördert Rohstoff im Mine Shaft.
2. Der Rohstoff landet im lokalen Shaft-Puffer.
3. Wenn Rohstoff im Shaft-Puffer liegt, lädt der Elevator bis zu seiner Kapazität.
4. Der Elevator transportiert die Ladung an die Oberfläche.
5. Der Elevator entlädt den Rohstoff in das Warehouse-Lager.
6. Das Warehouse verkauft Rohstoff in festen Intervallen.
7. Der Spieler erhält Geld entsprechend der verkauften Rohstoffmenge.
8. Der Spieler investiert Geld in Upgrades für Shaft, Elevator oder Warehouse.
9. Durch die Upgrades verschiebt sich der Engpass innerhalb der Produktionskette.
10. Der Spieler beobachtet den neuen Engpass und investiert erneut.

## 5. Einfache Startwerte fürs Balancing

Die folgenden Werte sind bewusst einfach gehalten. Sie dienen als erste spielbare Balancebasis und nicht als finale Feintuning-Werte.

### Globale Startwerte

| Wert | Startwert |
|---|---:|
| Startgeld | 100 |
| Geld pro 1 Rohstoff | 1 |
| Simulationsgeschwindigkeit | 1x |

### Mine Shaft Startwerte

| Wert | Startwert |
|---|---:|
| Level | 1 |
| Rohstoff pro Zyklus | 1 |
| Zyklusdauer | 1,0 s |
| Pufferkapazität | 10 |
| Upgrade-Kosten auf Level 2 | 25 |

**Vorschlag für Upgrade-Effekt:**  
Jedes Shaft-Upgrade erhöht den Durchsatz um **+20 %**.  
Die Upgrade-Kosten steigen pro Level mit Faktor **1,6**.

### Elevator Startwerte

| Wert | Startwert |
|---|---:|
| Level | 1 |
| Ladekapazität pro Fahrt | 2 |
| Fahrtdauer gesamt | 2,0 s |
| Upgrade-Kosten auf Level 2 | 40 |

**Vorschlag für Upgrade-Effekt:**  
Jedes Elevator-Upgrade erhöht den Transportdurchsatz um **+20 %**.  
Die Upgrade-Kosten steigen pro Level mit Faktor **1,7**.

### Warehouse Startwerte

| Wert | Startwert |
|---|---:|
| Level | 1 |
| Lagerkapazität | 20 |
| Verkaufsmenge pro Zyklus | 2 |
| Verkaufszyklus | 1,5 s |
| Upgrade-Kosten auf Level 2 | 40 |

**Vorschlag für Upgrade-Effekt:**  
Jedes Warehouse-Upgrade erhöht den Verkaufsdurchsatz um **+20 %**.  
Die Upgrade-Kosten steigen pro Level mit Faktor **1,7**.

### Erwartetes Verhalten mit Startwerten

- Der Shaft produziert anfangs ungefähr **1 Rohstoff pro Sekunde**.
- Der Elevator transportiert anfangs ungefähr **1 Rohstoff pro Sekunde**.
- Das Warehouse verkauft anfangs ungefähr **1,33 Rohstoff pro Sekunde**.
- Der erste natürliche Engpass liegt damit leicht bei **Shaft oder Elevator**.
- Nach einem frühen Shaft-Upgrade wird der Elevator typischerweise zum sichtbaren Bottleneck.

## 6. Akzeptanzkriterien

- Das Spiel zeigt genau **eine Mine** mit **einem Shaft**, **einem Miner**, **einem Elevator** und **einem Warehouse**.
- Der Miner erzeugt automatisch Rohstoff, ohne dass ein Manager-System nötig ist.
- Der Rohstoff wird sichtbar in einem Puffer gesammelt und vom Elevator abtransportiert.
- Der Elevator liefert Rohstoff sichtbar an das Warehouse.
- Das Warehouse wandelt Rohstoff automatisch in Geld um.
- Geld steigt bei laufender Produktion nachvollziehbar an.
- Für Shaft, Elevator und Warehouse existiert jeweils genau **ein funktionierender Upgrade-Pfad**.
- Ein Upgrade verändert den Durchsatz des jeweiligen Systems messbar.
- Wenn der Shaft schneller produziert als der Elevator transportiert, füllt sich der Shaft-Puffer sichtbar.
- Wenn mehr Rohstoff oben ankommt als verkauft wird, füllt sich der Warehouse-Puffer sichtbar.
- Upgrades kosten Geld und können nur bei ausreichendem Geldstand ausgelöst werden.
- Die Debug-UI kann mindestens Simulation pausieren, Geld hinzufügen, Level setzen und zentrale Werte anzeigen.
- Der MVP enthält keine zusätzlichen Minen, keine weiteren Schächte, kein Prestige, keine Ads, keinen Shop und keine Echtgeldkäufe.
- Die Präsentation nutzt nur generische Platzhalter oder eigene Assets und vermeidet erkennbare 1:1-Kopien der Vorlage.

## Scope-Satz

Wenn dieser MVP funktioniert, kann ein Spieler in wenigen Minuten verstehen:  
**Rohstoff abbauen, transportieren, verkaufen, Geld reinvestieren und Engpässe durch Upgrades verschieben.**
