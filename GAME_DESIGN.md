# Game Design Document

## Projektzuschnitt

Der Prototyp bildet die erste Mine von *Idle Miner Tycoon* in stark reduzierter Form nach: eine einzelne, vertikal aufgebaute Mine mit klar lesbarer Produktionskette aus **Abbau**, **Transport** und **Verkauf**. Ziel ist kein vollständiger Klon, sondern ein sauberer MVP, der die Kernfantasie eines Idle-Mining-Tycoon-Spiels trägt.

Die Mine ist thematisch eine **Kohlemine** und spielmechanisch eine **Durchsatzmaschine**. Der eigentliche Spielreiz entsteht nicht durch komplexe Regeln, sondern durch das Erkennen und Beheben von **Engpässen**.

## Designprinzipien

- **Lesbare Core-Loop:** Der Spieler soll jederzeit sehen, wo der Fluss stockt.
- **Wenige, aber wichtige Entscheidungen:** Cash wird laufend zwischen Schacht, Aufzug und Lager verteilt.
- **Schnelles Early Game:** Die ersten Minuten sollen unmittelbar Fortschritt und Automatisierung freischalten.
- **Idle statt nur Clicker:** Manuelles Starten ist nur der Einstieg; danach trägt die Mine sich zunehmend selbst.
- **Kompakter Scope:** Nur ein Minensegment, keine Meta-Systeme, keine sekundären Währungen.

## Core Gameplay Loop

1. Arbeiter bauen Erz in offenen Schächten ab.
2. Das Erz sammelt sich pro Schacht in einem kleinen Puffer.
3. Der Aufzug holt Erz aus den Schächten ab und bringt es an die Oberfläche.
4. Das Lager verkauft die angelieferte Menge und wandelt sie in Cash um.
5. Der Spieler investiert Cash in Upgrades und neue Schächte.
6. Die Produktion steigt, ein neuer Engpass entsteht, und die Schleife beginnt erneut.

Die Kernregel lautet: **Ertrag wird immer vom langsamsten Teil der Kette begrenzt.**

## Wichtige Entities

| Entity | Rolle im Spiel | Spielerinteraktion |
|---|---|---|
| **Mine** | Container für alle Systeme der ersten Mine | Übersicht, Fortschritt, Savegame |
| **Schacht** | Produziert Erz in festen Zyklen | Freischalten, leveln, automatisieren |
| **Minenarbeiter** | Stellen die Produktion eines Schachts dar | indirekt über Schacht-Upgrades |
| **Schachtpuffer** | Zeigt Rückstau im jeweiligen Schacht | visuelles Bottleneck-Signal |
| **Aufzug** | Transportiert Erz von unten nach oben | leveln, automatisieren |
| **Oberflächenpuffer** | Zwischenlager zwischen Aufzug und Verkauf | visuelles Bottleneck-Signal |
| **Lager** | Verkauft Erz und erzeugt Cash | leveln, automatisieren |
| **Transporter** | Stellen die Leistung des Lagers dar | indirekt über Lager-Upgrades |
| **Spieler** | Priorisiert Investitionen und beschleunigt den Start | tippen, upgraden, freischalten |

## Ressourcenfluss

**Erz im Schacht** -> **Schachtpuffer** -> **Aufzugsladung** -> **Oberflächenpuffer** -> **Verkauftes Erz** -> **Cash**

Wichtige Designfolgen:

- Ein voller **Schachtpuffer** bedeutet: der Aufzug ist zu langsam.
- Ein voller **Oberflächenpuffer** bedeutet: das Lager ist zu langsam.
- Leere Puffer bei geringem Cash-Zuwachs bedeuten: die Schächte produzieren zu wenig.
- Cash ist die einzige ausgebbare Ressource im MVP.

## Upgrades

Das Upgradesystem ist bewusst einfach und verständlich. Jede Hauptstation besitzt einen eigenen Upgradepfad.

| Upgradebereich | Zweck | Wirkung im Spiel |
|---|---|---|
| **Schacht-Level** | Mehr Erz erzeugen | höhere Förderrate pro Zyklus |
| **Schacht-Automation** | Schacht ohne manuelle Eingabe betreiben | echter Übergang zum Idle-Spiel |
| **Aufzug-Level** | Mehr Erz schneller transportieren | höhere Transportkapazität und kürzere Umläufe |
| **Aufzug-Automation** | Aufzug fährt selbstständig | stabilisiert die Kette |
| **Lager-Level** | Erz schneller monetarisieren | höherer Verkaufsdurchsatz |
| **Lager-Automation** | Verkauf läuft automatisch | schließt die Idle-Loop |
| **Neuer Schacht** | Tiefere, profitablere Produktionsquelle | größerer Gesamtdurchsatz, neue Investitionsoption |

### Upgrade-Logik

- Der Prototyp startet mit **einem offenen Schacht**.
- Insgesamt enthält der MVP **fünf Schächte**.
- Tiefere Schächte sind teurer, aber profitabler.
- Automation wird früh freigeschaltet, damit der Prototyp schnell vom manuellen Start in eine echte Idle-Schleife kippt.
- Große Sprungmomente entstehen durch **neuen Schacht freischalten** und **Automation aktivieren**.

## UI-Screens

### 1. Hauptscreen: Mine

Der Hauptscreen ist die zentrale Spielansicht und zeigt fast das komplette Spiel.

- Vertikale Mine mit bis zu fünf Schächten
- Aufzug in der Mitte
- Lager an der Oberfläche
- Cash-Anzeige oben
- Klar sichtbare Upgrade-Buttons an Schacht, Aufzug und Lager
- Lesbare Puffer-/Füllstandsindikatoren
- Kurze Statushinweise wie „Aufzug ist Engpass“

### 2. Upgrade-Panel

Ein kompaktes Panel für das aktuell ausgewählte Objekt.

- Name des Objekts
- Aktuelles Level
- Kerneffekt des nächsten Upgrades
- Upgrade-Kosten
- Automation-Status

### 3. Offline-Einnahmen-Modal

Beim Zurückkehren ins Spiel erscheint ein kurzer Überblick.

- Abwesenheitszeit
- verdientes Cash
- Button zum Einsammeln

### 4. Pause/Optionen

Sehr reduzierter Utility-Screen.

- Spiel fortsetzen
- Spielstand zurücksetzen
- Audio an/aus

## Texturen und Visual Style

Der Prototyp übernimmt die Grundrichtung der Vorlage: **helle, freundliche Cartoon-Cutaway-Mine** statt realistischer Bergbau-Simulation.

### Art Direction

- **Perspektive:** seitlicher Querschnitt durch die Mine
- **Formensprache:** weich, lesbar, leicht überzeichnet
- **Farbpalette:** Erd- und Ockertöne im Untergrund, Stahlblau für Technik, Sicherheitsorange für Interaktionspunkte, dunkles Kohleschwarz für Erz
- **Charaktere:** kleine, klar erkennbare Arbeiter mit Helm und einfacher Silhouette
- **UI:** große, kontrastreiche Buttons und eindeutige Statusanzeigen

### Textur- und Animationsbedarf

- Untergrund mit einfachen Gesteinslayern
- wiederholbare Tunnel- und Schachtsegmente
- Aufzugskabine und Seilsystem
- Lagergebäude an der Oberfläche
- Erzbrocken/Kisten als gut lesbare Pickup-Einheit
- kurze Loop-Animationen für Hacken, Tragen, Fahren und Verkaufen
- kleine Partikel- und Zahlenfeedbacks für Produktion und Cash

Der visuelle Fokus liegt nicht auf Detailreichtum, sondern auf **Informationsklarheit**: Der Spieler soll Rückstau und Fluss auf einen Blick erkennen.

## Was im MVP enthalten ist

- Eine einzige Mine
- Ein Erztyp
- Ein Startschacht plus vier freischaltbare tiefere Schächte
- Produktionskette aus Schacht, Aufzug und Lager
- Manuelles Early Game mit frühem Übergang in Automation
- Cash als einzige Währung
- Upgrades für Schacht, Aufzug und Lager
- Sichtbare Bottlenecks und Puffer
- Offline-Einnahmen in einfacher Form
- Speichern und Laden des Fortschritts
- Basales Onboarding über UI-Hinweise

## Was bewusst weggelassen wird

- Weitere Minen oder Kontinente
- Barrieren zwischen Schachtblöcken
- Prestige
- Super Cash oder andere Premium-Währungen
- Shop, IAPs, Werbung oder Boosts
- Events, Expeditionen oder Weltkarte
- Forschung, Skill-Tree oder Meta-Progression
- Chests, Collectibles oder seltene Manager
- Komplexe Missionen oder Story
- Multiplayer- oder Social-Features

## Zielbild des Prototyps

Am Ende soll der Prototyp in einer einzigen Session klar zeigen, warum die erste Mine funktioniert: **Der Spieler erkennt Engpässe, investiert sinnvoll, automatisiert die Kette und erlebt einen stetig beschleunigten Ressourcenfluss.**
