# Growatt ARK-XH — Nederlandse snelstart

[← Projectoverzicht](../README.md) · [Uitgebreide Engelstalige handleiding](INSTALLATION.md) · [14 BMS-metingen](BMS-CAPABILITIES.md)

Deze communityfork van de Homey Growatt-app draait op **Growatt 2.6.0** en voegt **14 uitleesbare BMS-metingen** toe voor een ondersteunde Growatt SPH/MIX-installatie met een ARK-XH hoogspanningsbatterij.

**Belangrijk:** installeer de branch **`custom/ark-xh`**. De standaardbranch `main` is niet bedoeld voor installatie op Homey.

## Vereisten

- Homey Pro waarop je apps via de ontwikkelaars-CLI kunt installeren
- Node.js **22 of hoger**, Git en een werkende Growatt-koppeling
- Homey CLI, ingelogd op je eigen Homey-account
- Bij vervanging van een bestaande installatie: maak vooraf een Homey-back-up

De app heeft nog steeds ID **`com.growatt`**. Installeer de fork dus niet als een tweede, aparte Growatt-app; de developerinstallatie gebruikt dezelfde app-ID.

## Eerste installatie met Windows PowerShell

```powershell
npm.cmd install --global homey
homey.cmd login
homey.cmd select

cd C:\Temp
git clone -b custom/ark-xh https://github.com/pascalsaul/com.growatt.git com.growatt-arkxh
cd .\com.growatt-arkxh

npm.cmd ci
homey.cmd app validate
npm.cmd test
homey.cmd app install
```

`homey.cmd login` en `homey.cmd select` zijn alleen nodig als je nog niet bent ingelogd of de verkeerde Homey geselecteerd is.

## Later bijwerken

```powershell
cd C:\Temp\com.growatt-arkxh
git fetch origin
git switch custom/ark-xh
git pull --ff-only origin custom/ark-xh

npm.cmd ci
homey.cmd app validate
npm.cmd test
homey.cmd app install
```

Controleer eerst of de upstream-wijzigingen beoordeeld en getest zijn. Gebruik geen `npm audit fix` als standaard installatiestap: dat verandert mogelijk de geteste dependencies.

**Verwijder de Growatt-app of bestaande batterij-apparaten niet.** De app kan bestaande apparaten migreren. Verwijderen en opnieuw koppelen kan Flows en Insights-geschiedenis beschadigen.

## Wat krijg je?

- 11 aanvullende BMS-meetwaarden: laadcycli, batterijspanning en -stroom, BMS-temperatuur, minimale/maximale celspanning, verschil tussen celspanningen, minimale/maximale celtemperatuur en laad-/ontlaadstroomlimieten.
- 3 BMS-alarmen: laden verboden, ontladen verboden en samengevoegde BMS-fout-/waarschuwingsindicatie.
- Ondersteuning voor Homey Insights bij deze extra gegevens.

**Battery health/SOH**, **Battery temperature** en **Connectivity alarm** komen uit de officiële Growatt 2.6.0-code van Robin en worden niet dubbel toegevoegd.

De 14 metingen zijn afhankelijk van de velden die Growatt via de API aanbiedt. Niet ieder inverter- of batterijmodel wordt ondersteund. Bij vragen: [Troubleshooting](TROUBLESHOOTING.md).

Heb je een **oude testversie** met de extra velden `measure_battery_soh` en `measure_temperature_battery`? Lees dan eerst de [migratie-instructies](ARK-XH-MAINTENANCE.md#soh-and-temperature-use-upstream-capabilities): die twee oude velden moeten veilig in twee stappen worden verwijderd.
