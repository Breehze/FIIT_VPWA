# VPWA

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
