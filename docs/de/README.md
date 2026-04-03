![Logo](../../admin/harmony.png)

# ioBroker.harmony — Dokumentation

## Übersicht
Der Harmony-Adapter ermöglicht die Steuerung von Logitech Harmony Hubs aus ioBroker. Version 2.x fügt eine Konfigurations-Oberfläche hinzu, mit der Hub-Einstellungen ohne die Logitech-Cloud angezeigt und bearbeitet werden können.

## Konfigurations-Tab
Der Adapter fügt einen "Harmony"-Tab in der ioBroker-Admin-Seitenleiste hinzu. Dieser Tab bietet:

- **Hub-Übersicht** — Status, Firmware-Version, Aktivitäten- und Geräteanzahl
- **Aktivitäten-Editor** — Aktivitäten bearbeiten, Geräterollen zuweisen, Einschaltsequenzen und FixIt-Regeln konfigurieren
- **Geräte-Editor** — Geräte bearbeiten, Befehle anzeigen, Ein-/Ausschaltfunktionen konfigurieren
- **Einrichtungsassistent** — Neue Geräte mit der IR-Code-Datenbank hinzufügen
- **Konfigurations-Backup** — Hub-Konfigurationen als JSON exportieren und importieren

## Zustände-Referenz

| Zustand | Typ | Schreibbar | Beschreibung |
|---------|-----|------------|--------------|
| `harmony.X.hubConnected` | boolean | nein | Hub-Verbindungsstatus |
| `harmony.X.hubBlocked` | boolean | nein | Hub ist mit einer Operation beschäftigt |
| `harmony.X.activities.currentActivity` | string | nein | Name der aktuellen Aktivität |
| `harmony.X.activities.currentStatus` | number | ja | 0=gestoppt, 1=startet, 2=läuft, 3=stoppt |
| `harmony.X.activities.<Name>` | number | ja | Aktivitätsstatus (schreiben zum Starten/Stoppen) |
| `harmony.X.<Gerät>.<Befehl>` | number | ja | IR-Befehl senden (Wert = Haltedauer in ms) |

## Einrichtung
1. Adapter installieren
2. Subnetz oder manuelle Hub-IPs in den Adaptereinstellungen konfigurieren
3. Den "Harmony"-Tab in der Seitenleiste öffnen, um die Hub-Konfiguration zu verwalten
