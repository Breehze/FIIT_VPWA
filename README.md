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

## Boriskov ultra insane git workflow 

### 1. Create a branch

Always branch off `main`. Name your branch using the convention:

```
<type>/<short-description>
```

Examples:
```
feature/user-authentication
fix/login-redirect-bug
chore/update-dependencies
```

### 2. Make commits

Use the following **commit types**:

| Type | When to use |
|------|-------------|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `chore` | Maintenance, deps, tooling, config |
| `refactor` | Code change that's not a fix or feature |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons, etc. |
| `test` | Adding or fixing tests |

Format:
```
<type>: <short description in lowercase>
```

Examples:
```
feat: add login page
fix: correct redirect after logout
chore: update pnpm to 12.5.0
docs: add git workflow to readme
```

> Keep the description short (under 72 chars). Use the commit body for details if needed.

### 3. Rebase before opening a PR

Before pushing, rebase your branch on top of the latest `main` to keep history clean:

```bash
git fetch origin
git rebase origin/main
```

If there are conflicts, resolve them, then:
```bash
git add .
git rebase --continue
```

### 4. Push & open a PR

```bash
git push origin feature/your-branch-name
```

If you already pushed before rebasing, the rebase rewrites history so you'll need to force push. Always use `--force-with-lease` instead of `--force` — it's safer because it will refuse to push if someone else pushed to the same branch in the meantime:

```bash
git push --force-with-lease origin feature/your-branch-name
```

Then open a Pull Request on GitHub targeting `main`.

- PR title should follow the same convention as commits: `feat: add login page`
- Describe **what** changed and **why** in the PR body **(Optional)**

### 5. Merge

- Use **Squash and merge(!ALWAYS!)** for feature branches (keeps `main` history clean)
- Delete the branch after merging

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
