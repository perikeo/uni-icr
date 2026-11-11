# Exotic Petshop - AI Coding Instructions

> **Related docs**: [ARCHITECTURE.md](../docs/ARCHITECTURE.md) | [CONVENTIONS.md](../docs/CONVENTIONS.md) | [TESTING.md](../docs/TESTING.md) | [ENVIRONMENT_CONFIG.md](../docs/ENVIRONMENT_CONFIG.md) | [WORKFLOW.md](../docs/WORKFLOW.md)

---

## How Claude Must Work on This Repo

### 1. Understand First
Before any task:
- Read `ARCHITECTURE.md`, `CONVENTIONS.md` for global context
- Read module-level `README.md` for any modules you will touch
- Summarize which modules are affected and their responsibilities/invariants

### 2. Plan Before Coding
Propose a short step-by-step plan:
- Files to change / add
- Tests to add / update
- Keep steps small and logically grouped

### 3. Work in Scoped Patches
- Implement one step at a time
- Return changes as diffs/patches per file, not giant rewrites
- Preserve existing patterns; do not introduce new libraries without explicit request
- Create README.md (or update if exists) technical documentation encompassing:
  - Purpose (Business Logic and responsibilities)
  - Technical Documentation (How it works, key classes, functions, dependencies, invariants, public apis, gotchas)

### 4. Always Include Tests
- Propose (add) or update tests in the same cycle as new behavior
- Never remove tests without justification and replacement coverage

### 5. Preserve Clean Architecture
- **Backend**: Enforce layer boundaries (API → Application → Domain → Infrastructure)
- **Frontend**: Use existing patterns (signals, PrimeNG wrappers, `FetchAssetPipe`, design tokens)

### 6. Keep Docs in Sync
- Update `README.md`, `ARCHITECTURE.md`, `CONVENTIONS.md` when responsibilities change
- Propose corrections for missing or outdated docs

### 7. Ask Targeted Questions
- If ambiguous, ask specific questions (e.g., "Should overlapping reservations be allowed?")
- If instructions conflict with existing code, call it out explicitly

---

## Quick Reference

### Architecture Overview
**Monorepo**: Angular 20 frontend (`/frontend`) + .NET 10 Clean Architecture backend (`/backend`)

### Frontend (`/frontend`)
| Aspect | Convention |
|--------|------------|
| Components | Standalone, SCSS, no NgModules |
| UI Library | PrimeNG with Aura theme (`app.config.ts`) |
| Entry Point | `main.ts` (browser) |
| Pages | `views/pages/{name}/` |
| Components | `views/components/{name}/` |
| Services | `service/ui/` (state), `service/api/` (HTTP), `service/config/` |

### Backend (`/backend`) - Clean Architecture
| Layer | Responsibility |
|-------|----------------|
| API | Controllers, DTOs, middleware |
| Application | MediatR handlers, CQRS commands/queries, FluentValidation |
| Domain | Entities, value objects, domain services, business rules |
| Infrastructure | EF Core, external APIs, file system, background jobs |

### File Naming (Frontend)
```
home.ts, home.html, home.scss, home.spec.ts  ← NOT home.component.ts
```

### CDN Assets
```typescript
import { GlobalConstants } from '../../../common/global-constants';
public cdn = GlobalConstants.cdn;
// In template: {{ cdn + '/path/to/asset.svg' | fetchAsset }}
```

### Angular Signals for State
```typescript
readonly transparentNav = signal(false);
// Template: layout.transparentNav()
```

### Custom Form Controls
Wrap PrimeNG with `ControlValueAccessor`. Use `custom-` selector prefix (see `select.ts`).

### CSS Architecture
- Layers: `@layer inputs, primeng, app` (respect order)
- Variables: `--primary-*`, `--secondary-*`, `--input-border-radius: 1.75rem`

---

## Development Commands

```bash
# Frontend (from /frontend)
npm start                    # Dev server → http://localhost:4200
ng build                     # Production build
ng test                      # Karma unit tests

# Backend (from /backend)
dotnet run                   # API → http://localhost:5223, OpenAPI at /openapi/v1.json
dotnet test                  # Run all tests
```

---

## Adding New Features

### New Backend Endpoint
1. Define Command/Query in `Application/Features/{Feature}/`
2. Add FluentValidation validator (for Commands)
3. Create MediatR handler
4. Add Controller endpoint in `Controllers/`
5. Add unit tests for handler + validator
6. Update module `README.md`

### New Frontend Page
1. Create in `views/pages/{name}/` (standalone component, SCSS)
2. Add route in `app.routes.ts`
3. Create API service in `service/api/{feature}/` if needed
4. Add component tests
5. Update module `README.md`

### New Frontend Component
1. Create in `views/components/{name}/`
2. Standalone, SCSS styling
3. Use signals for local state
4. Add spec file with tests

---

## Clean Architecture Enforcement (Backend)

### Hard Rules - NEVER Violate

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| **API** | Controllers, DTOs, middleware, filters | Business logic, EF Core types, direct DB access |
| **Application** | MediatR handlers, CQRS, FluentValidation, interfaces | HTTP types, EF Core types, direct DB access |
| **Domain** | Entities, value objects, domain services, repository interfaces | ANY framework dependencies (no EF attributes, no MediatR) |
| **Infrastructure** | EF Core, repositories, external API clients, background jobs | Business rules |

### Dependency Flow
```
API → Application → Domain ← Infrastructure
                      ↑
                      └── Infrastructure implements Domain interfaces
```

### If You See Violations
- Call them out explicitly
- Propose incremental fixes
- Never silently reinforce bad patterns

---

## Frontend Conventions Enforcement

### Must Follow

| Rule | Correct | Wrong |
|------|---------|-------|
| File naming | `home.ts` | `home.component.ts` |
| State management | Angular signals | BehaviorSubjects |
| CDN assets | `GlobalConstants.cdn` + `FetchAssetPipe` | Hardcoded URLs |
| Form controls | PrimeNG wrappers with `ControlValueAccessor` | Raw PrimeNG in components |
| Styling | Design tokens (`--primary-*`) | Hardcoded colors |

### Store Page Filter Invariants
When touching store/filter logic, preserve these rules:
- **Filter independence**: Each category operates independently
- **OR within category**: Multiple values in same filter are OR-ed
- **AND across categories**: Different filter categories are AND-ed
- Example: `(breed=Golden OR breed=Husky) AND (gender=Male)`

---

## Module Memory System

### README.md as Source of Truth
Each module's `README.md` contains:
- **Purpose**: What the module does and does NOT do
- **Public API**: Entry points, inputs/outputs, key types
- **Invariants**: Rules that must always be true
- **Dependencies**: What it uses, what's forbidden
- **Gotchas**: Known issues, edge cases

### Before Editing Any Module
1. Read its `README.md` first
2. If no README exists for non-trivial module → propose one
3. If change alters responsibilities → update README

---

## Error Avoidance Protocol

### Default Posture: Do Not Guess

| Situation | Action |
|-----------|--------|
| Ambiguous business rule | Ask specific question |
| Unclear module behavior | Read README + tests first |
| Code conflicts with docs | Call out explicitly, propose resolution |
| Missing test coverage | Propose tests before implementing |

### Never Ship Changes That
- Break documented invariants
- Violate Clean Architecture boundaries
- Violate naming/structure conventions
- Remove tests without replacement coverage

---

## Git Workflow Reference

### Branch Naming
```
feature/<short-name>    # New features
fix/<short-name>        # Bug fixes
refactor/<short-name>   # Code improvements
docs/<short-name>       # Documentation only
```

### Commit Message Format
```
<type>: <short description>

Types: feat, fix, refactor, test, docs, style, chore
```

### When Proposing Changes
Structure patches so they map cleanly to commits:
- One logical change per step
- Clear commit message suggestion
- Small, focused PRs (< 400 lines ideal)

---

## Response Format for Every Task

When responding to any task:

1. **State context read**: Which docs/READMEs you reviewed
2. **Summarize understanding**: Affected modules, current behavior, invariants
3. **Present plan**: Numbered steps, files to change, tests to add
4. **Show patches**: Clearly separated diffs per file per step
5. **Show tests**: New or updated test code
6. **List doc changes**: Updates to READMEs or other docs
7. **Call out assumptions**: Any open questions or uncertainties
