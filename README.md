# VPWA

## Prehľad implementácie prípadov použitia (TODO)

- [x] **1. Registrácia, prihlásenie a odhlásenie používateľa**
  - [x] Registrácia používateľa (meno, priezvisko, nickName, email, heslo)
  - [x] Prihlásenie používateľa
  - [x] Odhlásenie používateľa
- [x] **2. Správa a zoznam kanálov**
  - [x] Zoznam kanálov, ktorých je používateľ členom
  - [x] Rozlíšenie verejných (`#`) a súkromných (`🔒`) kanálov
  - [x] Pripnutie a zvýraznenie kanála s pozvánkou na vrchu zoznamu
  - [x] Vytvorenie kanála cez používateľské rozhranie (nastavenie tvorcu ako správcu)
  - [x] Opustenie kanála cez používateľské rozhranie
  - [x] Zrušenie kanála správcom cez používateľské rozhranie
  - [x] Odstránenie kanála zo zoznamu po opustení alebo vyhodení
- [x] **3. Fixný príkazový riadok a odosielanie správ**
  - [x] Fixný príkazový riadok ukotvený na spodku aplikácie
  - [x] Odosielanie správ do kanála, v ktorom je používateľ členom
- [x] **4. Správa kanálov cez príkazy (Command Line)**
  - [x] Príkaz `/join channelName [private]` (vytvorenie alebo pripojenie do kanála)
  - [x] Príkaz `/invite nickName` (pozvanie používateľa do kanála)
  - [x] Príkaz `/revoke nickName` (odobratie používateľa zo súkromného kanála správcom)
  - [x] Príkaz `/kick nickName` (vyhodenie používateľa: správca okamžite, členovia hlasovaním po 3 hlasoch)
  - [x] Obnovenie prístupu pre vyhodeného používateľa cez príkaz `/invite`
  - [x] Príkaz `/quit` (zatvorenie/zrušenie kanála správcom)
- [x] **5. Zrušenie členstva v kanáli cez príkaz**
  - [x] Príkaz `/cancel` (používateľ opustí kanál; ak je správcom, kanál zaniká)
- [x] **6. Adresovanie správ a zmienky (@nickname)**
  - [x] Adresovanie správy konkrétnemu používateľovi cez `@nickname`
  - [x] Zvýraznenie adresovanej správy pre daného používateľa v zozname správ
  - [x] Autocomplete / popup pri písaní znaku `@` v príkazovom riadku
- [x] **7. História správ a infinite scroll**
  - [x] Zobrazenie kompletnej histórie správ
  - [x] Efektívny reverzný infinite scroll pri scrollovaní nahor
- [x] **8. Notifikácie a Quasar App Visibility**
  - [x] Zobrazenie notifikácie iba ak aplikácia nie je v stave "visible" (Quasar AppVisibility)
  - [x] Notifikácia obsahuje odosielateľa a úryvok správy
  - [x] Nastavenie preferencie: notifikácie iba pre správy adresované používateľovi (@nick)
- [x] **9. Používateľský stav (Online, DND, Offline)**
  - [x] Nastavenie a zobrazenie stavu (Online, DND, Offline)
  - [x] Režim DND: potlačenie prichádzajúcich notifikácií
  - [x] Režim Offline: pozastavenie prichádzajúcich správ a automatická synchronizácia po návrate do Online
- [x] **10. Zoznam členov kanála**
  - [x] Príkaz `/list` (otvorenie panelu so zoznamom členov aktuálneho kanála)
  - [x] Zobrazenie členov so stavom a označením správcu
- [x] **11. Indikátor písania a náhľad rozpísanej správy (Draft Peek)**
  - [x] Indikátor v stavovej lište o tom, kto aktuálne píše správu (napr. "Ed is typing...")
  - [x] Živý náhľad rozpísaného textu v reálnom čase po kliknutí na nickName používateľa

---

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
