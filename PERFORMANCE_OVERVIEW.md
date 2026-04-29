# Performance-Uebersicht

Stand: 2026-04-29

## Messbasis

- `npm run build`: erfolgreich.
- `npm test`: 105 Tests erfolgreich.
- Keine Browsertests/FPS-Messung, auf Wunsch nicht ausgefuehrt.
- Node-Mikrobenchmark der Simulations-/ViewModel-Schicht:
  - `MineSimulation.update()` ohne State-Snapshot: ca. `0.001 ms` pro Update.
  - `MineSimulation.getState()` bei 5 Minen und 30 Schaechten: ca. `0.158 ms` pro Aufruf.
  - `SimulationViewModel.update()` inkl. State und Visual-State: ca. `0.166 ms` pro Frame.

## Aktueller Zustand

Die reine Core-Simulation ist aktuell nicht der Engpass. Die teuereren Risiken liegen beim Laden vieler Bildassets, beim grossen Phaser/Spiel-Bundle und bei sehr vielen Phaser-UI-Aktualisierungen pro Frame.

| Bereich | Status | Bewertung |
| --- | --- | --- |
| Core-Loop CPU | Sehr leichtgewichtig in Node | Unkritisch |
| State-Snapshot | Voller Snapshot aller Minen pro Frame | Mittel, aber noch nicht kritisch |
| Rendering/UI | Viele `setText`, `setTexture`, `setVisible` und Graphics-Redraws pro Frame | Wahrscheinlich groesster Runtime-Hebel |
| Initial Load | `dist` enthaelt ca. 57 MiB, davon ca. 55.8 MiB PNGs | Kritisch fuer Ladezeit und Speicher |
| JS-Bundle | Ein JS-Chunk mit ca. 1.68 MiB raw / 394 KiB gzip | Mittel |
| Savegame | Autosave alle 10 Sekunden, voller Export | Aktuell unkritisch |

## Wichtige Befunde

1. Alle Assets werden im `MineScene.preload()` geladen.
   - `src/scenes/MineScene.ts` laedt via `Object.entries(assetManifest)` jedes Manifest-Bild.
   - Das Manifest enthaelt ca. 153 Eintraege.
   - Der Build enthaelt 149 PNG-Dateien mit zusammen ca. 55.8 MiB.

2. Es sind viele Assets fuer weitere Minen im First-Load.
   - `assets/other mines` belegt ca. 44 MiB.
   - Das widerspricht dem aktuellen Projektziel "nur erste Mine" und erzeugt sehr hohen Lade- und Texturspeicher-Aufwand.

3. Sehr grosse Hintergrundbilder dominieren die Groesse.
   - 32 Dateien im Build sind groesser als 1 MiB.
   - Diese 32 Dateien machen zusammen ca. 52.6 MiB aus.

4. Die Szene aktualisiert pro Frame sehr viel UI.
   - `MineScene.update()` ruft jedes Frame `viewModel.update()`, `applyFrame()` und Elevator-Animation auf.
   - `applyFrame()` ruft unter anderem Textur-, Depth-, Shaft-, Warehouse-, UI- und Map-Refreshes auf.
   - `refreshMineShaftRows()` iteriert ueber alle 30 Schaechte und setzt viele Texte/Texturen auch dann neu, wenn sich Werte nicht geaendert haben.
   - `applyUiState()` ruft am Ende jedes Frame `refreshMapView(state)` auf; die Methode returnt zwar, wenn die Map nicht existiert, ist aber dennoch ein vermeidbarer globaler Refresh-Pfad.

5. `getState()` baut pro Frame mehr State als fuer die normale Mine-Ansicht noetig ist.
   - Es wird ein aktiver Snapshot gebaut und danach noch einmal ein Snapshot fuer jede Mine.
   - Bei 5 Minen und 30 Schaechten bedeutet das ca. 180 Shaft-Snapshots pro Frame plus Upgrade-Preview-Berechnungen.
   - Aktuell kostet das in Node nur ca. `0.158 ms`, wird aber mit mehr Features, Textformatierung und UI-Verbrauch teurer.

## Konkrete Verbesserungen mit Impact

| Massnahme | Konkreter Ansatz | Impact | Aufwand |
| --- | --- | --- | --- |
| Nicht benoetigte Minenassets aus First-Load entfernen | `assetManifest` auf Kohlemine/Core-UI reduzieren; andere Minen nur erhalten, wenn sie wirklich gebraucht werden | Hoch: potenziell ca. 40+ MiB weniger initiale Assets | Mittel |
| Lazy Loading fuer Mine-spezifische Assets | Nur aktuelle Mine und sichtbare Depth-Gruppe laden; spaetere Minen/Depths bei Bedarf nachladen | Hoch: bessere Ladezeit und geringerer Texturspeicher | Mittel-Hoch |
| Grosse PNG-Hintergruende optimieren | WebP/AVIF oder kleinere Zielaufloesungen fuer Backgrounds verwenden | Hoch: wahrscheinlich 50-80% weniger Asset-Gewicht bei Backgrounds | Mittel |
| UI-Diffing einfuehren | `setText`, `setTexture`, `setVisible` nur ausfuehren, wenn sich der Wert wirklich geaendert hat | Mittel-Hoch: weniger Text-Layout, weniger GC, stabilere FPS | Mittel |
| Nur sichtbare Shaft-Zeilen aktualisieren | Statt alle 30 Schaechte jedes Frame zu refreshen, nur sichtbare/nahe Viewport-Zeilen und geaenderte Zeilen aktualisieren | Mittel-Hoch bei tiefem Scroll/30 Schaechten | Mittel |
| Map-Refresh nur bei offener Map | `refreshMapView` nur ausfuehren, wenn die Map sichtbar ist oder relevante Map-Events auftreten | Mittel: weniger pro-Frame-Arbeit | Niedrig |
| Graphics-Redraws reduzieren | Frame- und Panel-Graphics nicht jedes Frame clearen/neuzeichnen; nur bei Statuswechsel redrawen | Mittel | Mittel |
| State-Snapshot splitten | `getFrameState()` fuer aktive Mine und `getMapState()` nur fuer Map/Offline/Save verwenden | Mittel, langfristig hoch | Mittel |
| Upgrade-Previews cachen | Mine-Shaft-, Elevator- und Warehouse-Previews nur bei Money/Level/BuyMode/Manager-Boost-Aenderung neu berechnen | Mittel | Mittel |
| JS-Code-Splitting | Phaser als separaten Vendor-Chunk, optionale Panels/Map dynamisch laden | Mittel fuer Caching/Parse, weniger fuer absolute Erstlast | Niedrig-Mittel |
| Elevator-Sortierung vermeiden | Sortierte Shaft-Liste einmal halten statt bei jeder Entladung `sort()` auf Kopie | Niedrig aktuell, sauber fuer Wachstum | Niedrig |
| Autosave weiter beobachten | Aktuell alle 10s ok; bei Jank Save-Snapshot throttlen oder auf Idle/Lifecycle verschieben | Niedrig | Niedrig |

## Priorisierte Empfehlung

1. First-Load verschlanken: andere Minenassets aus `assetManifest` entfernen oder lazy laden.
2. Backgrounds komprimieren/ersetzen: die grossen PNGs sind der groesste messbare Kostenblock.
3. UI-Diffing in `MineScene` einziehen: zuerst `refreshMineShaftRows`, `applyWarehouseVisual`, `applyElevatorVisual`, `refreshCurrencyPanels`.
4. `refreshMapView` nur bei sichtbarer Map oder relevanten Events ausfuehren.
5. Danach State-Snapshot auf aktive Mine fuer die normale Frame-Ansicht reduzieren.

## Backwards Compatibility

Alle vorgeschlagenen Aenderungen koennen savegame-kompatibel umgesetzt werden. Wichtig ist: vorhandene Save-Felder fuer mehrere Minen, Manager, Blockaden und Prestige nicht entfernen. Selbst wenn die UI wieder auf die erste Mine fokussiert wird, sollten alte Saves weiter normalisiert und geladen werden.
