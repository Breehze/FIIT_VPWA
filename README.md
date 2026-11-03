# VPWA

## Prehľad implementácie prípadov použitia (TODO)

- [ ] **1. Registrácia, prihlásenie a odhlásenie používateľa**
  - [ ] Registrácia používateľa 
  - [ ] Prihlásenie a overovanie identity pri chránených operáciách
  - [ ] Odhlásenie so zneplatnením prístupu
- [ ] **2. Správa a zoznam kanálov**
  - [ ] Zoznam kanálov, ktorých je používateľ členom, s rozlíšením verejných a súkromných kanálov
  - [ ] Údaje o pozvánkach na pripnutie a zvýraznenie kanálov vo frontende
  - [ ] Vytvorenie kanála cez API pre používateľské rozhranie (unikátny názov, tvorca ako správca a člen)
  - [ ] Opustenie kanála a zrušenie kanála správcom cez API
  - [ ] Aktualizácia zoznamov po opustení, trvalom vyhodení alebo zrušení kanála
  - [ ] Automatické zrušenie kanála po viac ako 30 dňoch bez novej správy a uvoľnenie jeho názvu
- [ ] **3. Fixný príkazový riadok a odosielanie správ**
  - [ ] Prijatie a uloženie správy iba od člena príslušného kanála
  - [ ] Doručenie novej správy oprávneným členom v reálnom čase
  - [ ] Aktualizácia času poslednej aktivity kanála pri novej správe
  - [ ] Serverová validácia správ a operácií vyvolaných príkazovým riadkom 
- [ ] **4. Správa kanálov cez príkazy (Command Line)**
  - [ ] `/join channelName [private]`: vytvorenie neexistujúceho kanála alebo vstup do existujúceho verejného kanála bez banu
  - [ ] `/invite nickName`: v súkromnom kanáli iba správca, vo verejnom ľubovoľný člen
  - [ ] Evidencia pozvánok, ich stavov a spracovanie odpovede pozvaného používateľa
  - [ ] `/revoke nickName`: odobratie používateľa zo súkromného kanála iba správcom
  - [ ] `/kick nickName`: vo verejnom kanáli trvalý ban po hlasoch aspoň troch rôznych členov, bez opakovaného započítania hlasu
  - [ ] `/kick nickName` od správcu: okamžitý trvalý ban bez hlasovania
  - [ ] Obnovenie prístupu používateľovi s banom cez `/invite` od správcu
  - [ ] `/quit`: zrušenie kanála iba správcom
  - [ ] Kontrola členstva, oprávnení a banu pri každej operácii na serveri
- [ ] **5. Zrušenie členstva v kanáli cez príkaz**
  - [ ] `/cancel`: zrušenie členstva používateľa
  - [ ] Zrušenie celého kanála, ak `/cancel` vykoná správca
  - [ ] Informovanie dotknutých klientov o zmene členstva alebo zániku kanála
- [ ] **6. Adresovanie správ a zmienky (@nickname)**
  - [ ] Spracovanie `@nickname` a uloženie adresátov správy
  - [ ] Vrátenie údajov potrebných na zvýraznenie adresovanej správy vo frontende
- [ ] **7. História správ a infinite scroll**
  - [ ] Sprístupnenie kompletnej histórie správ iba členom kanála
  - [ ] Efektívne stránkovanie histórie pre infinite scroll so stabilným poradím správ
- [ ] **8. Notifikácie a Quasar App Visibility**
  - [ ] Poskytnutie odosielateľa, úryvku správy a údajov o adresovaní na vytvorenie notifikácie
  - [ ] Ukladanie preferencie notifikácií iba pre adresované správy
  - [ ] Rešpektovanie DND a preferencie adresovaných správ pri prípadnom serverovom odosielaní notifikácií
  - [ ] Dodanie údajov frontendu, ktorý zobrazuje notifikácie iba pri neviditeľnej aplikácii cez Quasar AppVisibility
- [ ] **9. Používateľský stav (Online, DND, Offline)**
  - [ ] Ukladanie a zmena stavu používateľa (`Online`, `DND`, `Offline`)
  - [ ] Sprístupnenie stavov ostatným oprávneným používateľom a ich aktualizácia v reálnom čase
  - [ ] Poskytnutie stavu DND na potlačenie notifikácií
  - [ ] V stave Offline nedoručovať nové správy naživo
  - [ ] Po návrate do Online umožniť automatickú synchronizáciu zmeškaných správ a zmien kanálov
- [ ] **10. Zoznam členov kanála**
  - [ ] `/list`: vrátenie členov kanála iba používateľovi, ktorý je tiež jeho členom
  - [ ] Vrátenie stavov členov a označenia správcu
- [ ] **11. Indikátor písania a náhľad rozpísanej správy (Draft Peek)**
  - [ ] Prenos informácie o aktuálne píšucich používateľoch iba členom príslušného kanála
  - [ ] Prenos každej zmeny rozpísaného textu pre živý náhľad
  - [ ] Kontrola členstva pri odosielaní aj odbere udalostí písania a náhľadu

## Getting Started

```bash
# Install dependencies
pnpm install

# Start frontend dev server
pnpm dev:frontend
```

---

## Project Structure

```
vpwa/
├── apps/
│   ├── frontend/     # Quasar (Vue 3) app
│   └── backend/      # API server (coming soon)
├── packages/         # Shared libraries (coming soon)
├── package.json
└── pnpm-workspace.yaml
```
