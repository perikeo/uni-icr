# Development Workflow

> Git workflow, branching strategy, and development practices for Exotic Petshop.

---

## Branch Strategy

### Main Branches

| Branch | Purpose | Deployable? |
|--------|---------|-------------|
| `main` | Production-ready code | ✅ Always |
| `develop` | Integration branch (optional) | Staging |

### Feature Branches

```
feature/<short-name>    # New features
fix/<short-name>        # Bug fixes
refactor/<short-name>   # Code improvements
docs/<short-name>       # Documentation only
```

**Examples:**
- `feature/dog-breed-filter`
- `fix/reservation-null-check`
- `refactor/extract-validation-service`
- `docs/update-api-readme`

### Branch Lifecycle

```
main
 │
 ├─── feature/dog-filter ──────┐
 │         │                   │
 │         │ (commits)         │
 │         │                   │
 │         └───── PR ─────────►├─── merge to main
 │                             │
 └─────────────────────────────┘
```

---

## Commit Conventions

### Format

```
<type>: <short description>

[optional body]

[optional footer]
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding/updating tests |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `chore` | Build, tooling, dependencies |

### Examples

```bash
# Feature
feat: add breed filter to store page

# Bug fix
fix: handle null owner in reservation validation

# Refactor
refactor: extract price calculation to domain service

# Test
test: add unit tests for CreateDogCommandHandler

# Multiple changes
feat: implement dog search

- Add SearchDogsQuery and handler
- Create search API endpoint
- Add frontend search component

Closes #42
```

### Rules

- **Imperative mood**: "add feature" not "added feature"
- **Lowercase**: "fix: handle error" not "Fix: Handle error"
- **No period** at end of subject line
- **Max 72 chars** for subject line
- **Reference issues** in footer: `Closes #42`, `Fixes #17`

---

## Pull Request Process

### Before Creating PR

1. ✅ All tests pass locally
2. ✅ Code follows conventions
3. ✅ New code has tests
4. ✅ Documentation updated if needed
5. ✅ Branch is rebased on latest `main`

### PR Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Other (describe)

## Changes Made
- Added X
- Modified Y
- Removed Z

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Screenshots (if UI changes)

## Related Issues
Closes #XX

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No new warnings
```

### PR Review Guidelines

**Reviewer:**
- Focus on logic, architecture, and maintainability
- Check for test coverage
- Verify docs are updated
- Approve or request changes within 24h

**Author:**
- Keep PRs small and focused (< 400 lines ideal)
- Respond to feedback promptly
- Don't merge until approved

---

## CI/CD Pipeline

### On Pull Request

```yaml
# .github/workflows/pr.yml
on: pull_request

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '7.0.x'
      - name: Restore
        run: dotnet restore
      - name: Build
        run: dotnet build --no-restore
      - name: Test
        run: dotnet test --no-build --verbosity normal

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install
        run: cd frontend && npm ci
      - name: Lint
        run: cd frontend && npm run lint
      - name: Test
        run: cd frontend && ng test --no-watch --browsers=ChromeHeadless
      - name: Build
        run: cd frontend && ng build
```

### On Merge to Main

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... build steps ...
      - name: Deploy
        run: # deployment commands
```

---

## Local Development

### Quick Start

```bash
# Clone
git clone <repo-url>
cd exotic-petshop

# Backend
cd backend
dotnet restore
dotnet run

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Common Tasks

| Task | Command |
|------|---------|
| Run backend | `cd backend && dotnet run` |
| Run frontend | `cd frontend && npm start` |
| Run backend tests | `cd backend && dotnet test` |
| Run frontend tests | `cd frontend && ng test` |
| Build frontend | `cd frontend && ng build` |
| Lint frontend | `cd frontend && npm run lint` |

### Debugging

**Backend (VS Code):**
```json
// .vscode/launch.json
{
  "configurations": [
    {
      "name": ".NET Core Launch",
      "type": "coreclr",
      "request": "launch",
      "program": "${workspaceFolder}/backend/bin/Debug/net7.0/backend.dll",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

**Frontend:**
- Use browser DevTools
- Angular DevTools extension
- `debugger;` statements in code

---

## Code Review Checklist

### Architecture

- [ ] Follows Clean Architecture boundaries
- [ ] No business logic in controllers/components
- [ ] Uses CQRS pattern for new backend features
- [ ] Uses signals for new frontend state

### Code Quality

- [ ] Meaningful names
- [ ] No magic strings/numbers
- [ ] Error handling in place
- [ ] No commented-out code

### Testing

- [ ] Unit tests for new logic
- [ ] Tests cover happy path and edge cases
- [ ] No broken tests

### Security

- [ ] No secrets in code
- [ ] Input validation present
- [ ] Auth checks where needed

### Performance

- [ ] No N+1 queries
- [ ] Reasonable data fetching
- [ ] No memory leaks (observables cleaned up)

---

## Release Process

### Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Steps

1. Ensure `main` is stable and tested
2. Create release tag: `git tag v1.2.3`
3. Push tag: `git push origin v1.2.3`
4. CI/CD deploys automatically
5. Update changelog

### Hotfix Process

```
main
 │
 ├─── fix/critical-bug ────────┐
 │         │                   │
 │         │ (minimal fix)     │
 │         │                   │
 │         └───── PR ─────────►├─── merge to main
 │                             │
 │                             ├─── tag: v1.2.4
 │                             │
 └─────────────────────────────┘
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check dependencies
dotnet restore

# Clear build
dotnet clean
dotnet build

# Check secrets
dotnet user-secrets list
```

### Frontend Won't Start

```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear Angular cache
rm -rf .angular

# Check Node version
node --version  # Should be 20.x
```

### Tests Failing

```bash
# Backend - run specific test
dotnet test --filter "FullyQualifiedName~TestClassName"

# Frontend - run specific test
ng test --include=**/specific.spec.ts
```
