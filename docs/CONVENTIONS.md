# Coding Conventions

> Consistent patterns and naming conventions for the Exotic Petshop codebase.

---

## General Principles

1. **Explicit over implicit** - Clear naming, no magic strings
2. **Fail fast** - Validate early, throw meaningful exceptions
3. **Single responsibility** - Small, focused classes and functions
4. **Immutability preferred** - Especially for DTOs and value objects

---

## Backend Conventions (.NET)

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `DogService`, `CreateDogCommand` |
| Interfaces | I-prefix + PascalCase | `IDogRepository` |
| Methods | PascalCase, verb-first | `GetById()`, `CreateAsync()` |
| Properties | PascalCase | `FirstName`, `IsActive` |
| Private fields | _camelCase | `_logger`, `_repository` |
| Constants | PascalCase | `MaxPageSize` |
| Local variables | camelCase | `dogList`, `currentUser` |

### Code Style

- **Nullable enabled** – treat nullable warnings as errors; avoid `!` unless you can prove it's safe.
- **Async naming** – async methods end with `Async` (e.g., `GetByIdAsync`).
- **CancellationToken** – handlers, controllers, and repositories accept and pass `CancellationToken`.
- **Exception handling** – centralized middleware maps `DomainException` → 400, `NotFoundException` → 404, validation errors → 400, unhandled → 500. Don't catch exceptions in handlers unless you need to translate them.
- **Transactions** – commands own their transactions (via pipeline behavior or handler); one command = one transaction. Controllers never manage transactions.

### File Organization

```
Feature/
├── Commands/
│   └── CreateDog/
│       ├── CreateDogCommand.cs       # Request object
│       ├── CreateDogCommandHandler.cs # Handler
│       └── CreateDogCommandValidator.cs # Validation
├── Queries/
│   └── GetDogs/
│       ├── GetDogsQuery.cs
│       ├── GetDogsQueryHandler.cs
│       └── DogDto.cs                 # Response DTO
└── README.md                         # Module documentation
```

### CQRS Patterns

**Commands (Write Operations):**
```csharp
// CreateDogCommand.cs
public record CreateDogCommand(
    string Name,
    string Breed,
    int AgeMonths
) : IRequest<Guid>;

// CreateDogCommandHandler.cs
public class CreateDogCommandHandler : IRequestHandler<CreateDogCommand, Guid>
{
    private readonly IDogRepository _repository;
    
    public CreateDogCommandHandler(IDogRepository repository)
    {
        _repository = repository;
    }
    
    public async Task<Guid> Handle(CreateDogCommand request, CancellationToken ct)
    {
        var dog = Dog.Create(request.Name, request.Breed, request.AgeMonths);
        await _repository.AddAsync(dog, ct);
        return dog.Id;
    }
}

// CreateDogCommandValidator.cs
public class CreateDogCommandValidator : AbstractValidator<CreateDogCommand>
{
    public CreateDogCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100);
        
        RuleFor(x => x.Breed)
            .NotEmpty();
        
        RuleFor(x => x.AgeMonths)
            .GreaterThan(0);
    }
}
```

**Queries (Read Operations):**
```csharp
// GetDogByIdQuery.cs
public record GetDogByIdQuery(Guid Id) : IRequest<DogDto?>;

// DogDto.cs (in same folder or shared DTOs)
public record DogDto(
    Guid Id,
    string Name,
    string Breed,
    int AgeMonths,
    decimal Price
);
```

#### CQRS Semantics

- **Commands** are write-focused: they modify state, may start transactions, and return minimal results (ID, success flag, or void).
- **Queries** are read-only: they return DTOs, have no side effects, and should never modify data.
- Keep this separation strict—mixing reads and writes in one handler makes testing and caching harder.

### Controller Patterns

```csharp
[ApiController]
[Route("api/[controller]")]
public class DogsController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public DogsController(IMediator mediator)
    {
        _mediator = mediator;
    }
    
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DogDto>> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDogByIdQuery(id), ct);
        return result is null ? NotFound() : Ok(result);
    }
    
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> Create(CreateDogCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, id);
    }
}
```

### Entity Patterns (Rich Domain Model)

```csharp
public class Dog : Entity
{
    public string Name { get; private set; }
    public string Breed { get; private set; }
    public int AgeMonths { get; private set; }
    public Money Price { get; private set; }
    
    private Dog() { } // EF constructor
    
    public static Dog Create(string name, string breed, int ageMonths)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Dog name cannot be empty");
        
        return new Dog
        {
            Id = Guid.NewGuid(),
            Name = name,
            Breed = breed,
            AgeMonths = ageMonths,
            Price = Money.Zero
        };
    }
    
    public void UpdatePrice(Money newPrice)
    {
        if (newPrice.Amount < 0)
            throw new DomainException("Price cannot be negative");
        
        Price = newPrice;
    }
}
```

### Data Access / EF Core

Performance is **mandatory**, not optional. Design every query to minimize round-trips.

#### Core Rules

| # | Rule | Enforcement |
|---|------|-------------|
| 1 | **One API call = 1–2 SQL queries** | Design handlers so the common path executes a single well-shaped query. Max 2 queries for complex cases (e.g., data + count). |
| 2 | **Joins over lazy loading** | Use `Include()` / `ThenInclude()` or explicit joins to fetch related entities in one query. |
| 3 | **No N+1 – ever** | Never query inside a loop. If you see `foreach` + DB call, refactor immediately. |
| 4 | **`AsNoTracking()` for reads** | All query handlers returning DTOs must disable tracking. |
| 5 | **Project to DTOs in LINQ** | Use `Select(x => new Dto { ... })` to fetch only needed columns. |
| 6 | **Lookup tables: 1 query max** | Breeds, Sizes, Genders fetched once per request, not per entity. Enums/constants never hit DB. |
| 7 | **Pagination at DB level** | Use `Skip()` / `Take()` in the query, not in memory. |

#### Recommended Practices

- **Prefer projection over `Include`** – use navigation properties inside `Select()` to let EF generate optimal joins. Reserve `Include()` for when you need full entity graphs (e.g., updates).
- **Index frequently filtered/sorted columns** – add indexes via EF migrations for fields used in `Where`, `OrderBy`, or foreign keys.
- **Advanced tuning** – compiled queries, split queries, and raw SQL are options if profiling shows a specific bottleneck; don't over-optimize upfront.

#### ❌ Bad: N+1 Pattern (FORBIDDEN)

```csharp
// DON'T: Executes 1 + N queries (1 for dogs, N for breeds)
public async Task<List<DogDto>> Handle(GetDogsQuery request, CancellationToken ct)
{
    var dogs = await _context.Dogs.ToListAsync(ct);
    
    var result = new List<DogDto>();
    foreach (var dog in dogs)
    {
        // ❌ Query inside loop = N+1 disaster
        var breed = await _context.Breeds.FindAsync(dog.BreedId);
        result.Add(new DogDto(dog.Id, dog.Name, breed?.Name ?? ""));
    }
    return result;
}
```

#### ✅ Good: Single Query with Join + Projection

```csharp
// DO: Single query with join and projection
public async Task<List<DogDto>> Handle(GetDogsQuery request, CancellationToken ct)
{
    return await _context.Dogs
        .AsNoTracking()
        .Include(d => d.Breed)       // Join in single query
        .Include(d => d.Size)
        .Where(d => !d.IsDeleted)
        .Select(d => new DogDto(     // Project to DTO
            d.Id,
            d.Name,
            d.Breed.Name,
            d.Size.Name,
            d.Price
        ))
        .ToListAsync(ct);
}
```

#### ✅ Good: Filtered List with Pagination (1–2 Queries)

```csharp
public async Task<PagedResult<DogDto>> Handle(GetDogsQuery request, CancellationToken ct)
{
    var query = _context.Dogs
        .AsNoTracking()
        .Include(d => d.Breed)
        .Include(d => d.Size)
        .Where(d => !d.IsDeleted);
    
    // Apply filters
    if (request.BreedIds.Any())
        query = query.Where(d => request.BreedIds.Contains(d.BreedId));
    
    // Query 1: Get count (optional, only if client needs total)
    var totalCount = await query.CountAsync(ct);
    
    // Query 2: Get paginated data with projection
    var items = await query
        .OrderBy(d => d.Name)
        .Skip((request.Page - 1) * request.PageSize)
        .Take(request.PageSize)
        .Select(d => new DogDto(
            d.Id,
            d.Name,
            d.Breed.Name,
            d.Size.Name,
            d.Price
        ))
        .ToListAsync(ct);
    
    return new PagedResult<DogDto>(items, totalCount, request.Page, request.PageSize);
}
```

#### ✅ Good: Fetching Filter Options (One Query per Table)

```csharp
public async Task<FilterOptionsDto> Handle(GetFilterOptionsQuery request, CancellationToken ct)
{
    // One query per lookup table – NOT per dog
    var breeds = await _context.Breeds
        .AsNoTracking()
        .OrderBy(b => b.Name)
        .Select(b => new OptionDto(b.Id, b.Name))
        .ToListAsync(ct);
    
    var sizes = await _context.Sizes
        .AsNoTracking()
        .OrderBy(s => s.SortOrder)
        .Select(s => new OptionDto(s.Id, s.Name))
        .ToListAsync(ct);
    
    // Genders are an enum – no DB query needed
    var genders = Enum.GetValues<Gender>()
        .Select(g => new OptionDto((int)g, g.ToString()))
        .ToList();
    
    return new FilterOptionsDto(breeds, sizes, genders);
}
```

#### Verification Checklist

Before committing a query handler:

- [ ] Ran query with EF Core logging enabled (`LogLevel.Information` for `Microsoft.EntityFrameworkCore.Database.Command`)
- [ ] Confirmed 1–2 SQL statements in output
- [ ] No `SELECT` statements appearing inside what should be a single operation
- [ ] Large result sets use pagination (`Skip`/`Take`)

---

## Frontend Conventions (Angular)

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase class, lowercase files | `Home` in `home.ts` |
| Services | PascalCase + descriptive | `Layout`, `DogsApi` |
| Pipes | camelCase name | `fetchAsset` |
| Signals | camelCase, descriptive | `transparentNav`, `isLoading` |
| Interfaces/Types | PascalCase | `Dog`, `FilterOption` |
| Files | lowercase, no suffix | `home.ts` NOT `home.component.ts` |

### File Structure

```
feature/
├── feature.ts           # Component class
├── feature.html         # Template
├── feature.scss         # Styles
├── feature.spec.ts      # Tests
└── README.md            # Module docs (if non-trivial)
```

> **Note:** We intentionally avoid `.component.ts` / `.service.ts` suffixes. If Angular CLI generates files with those suffixes, rename them to match our convention.

### State Management

- **Signals** – use for local/UI state (form values, toggles, computed display values).
- **Observables** – use for async streams (HTTP responses, real-time data, complex async flows).
- **Loading & error state** – pages that call APIs should expose `isLoading` and `error` signals for consistent UX.

### Component Patterns

**Basic Component:**
```typescript
import { Component } from '@angular/core';
import { GlobalConstants } from '../../../common/global-constants';

@Component({
  selector: 'app-feature',
  standalone: true,
  imports: [],
  templateUrl: './feature.html',
  styleUrl: './feature.scss'
})
export class Feature {
  public cdn = GlobalConstants.cdn;
}
```

**Component with State:**
```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './store.html',
  styleUrl: './store.scss'
})
export class Store {
  // State
  readonly filters = signal<FilterState>({ breed: [], gender: [] });
  readonly isLoading = signal(false);
  
  // Computed
  readonly hasFilters = computed(() => 
    Object.values(this.filters()).some(arr => arr.length > 0)
  );
  
  // Methods
  updateFilter(key: string, values: string[]): void {
    this.filters.update(f => ({ ...f, [key]: values }));
  }
}
```

### API Service Pattern

```typescript
// service/api/dogs/dogs-api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DogDto {
  id: string;
  name: string;
  breed: string;
  ageMonths: number;
  price: number;
}

export interface CreateDogRequest {
  name: string;
  breed: string;
  ageMonths: number;
}

@Injectable({ providedIn: 'root' })
export class DogsApi {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/dogs`;
  
  getAll(): Observable<DogDto[]> {
    return this.http.get<DogDto[]>(this.baseUrl);
  }
  
  getById(id: string): Observable<DogDto> {
    return this.http.get<DogDto>(`${this.baseUrl}/${id}`);
  }
  
  create(request: CreateDogRequest): Observable<string> {
    return this.http.post<string>(this.baseUrl, request);
  }
}
```

### Custom Form Control Pattern (PrimeNG Wrapper)

```typescript
// views/components/inputs/select/select.ts
import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Select as PrimeSelect } from 'primeng/select';

@Component({
  selector: 'custom-select',
  standalone: true,
  imports: [PrimeSelect],
  templateUrl: './select.html',
  styleUrl: './select.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => Select),
    multi: true
  }]
})
export class Select implements ControlValueAccessor {
  @Input() options: any[] = [];
  @Input() placeholder = '';
  
  value: any = null;
  disabled = false;
  
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};
  
  writeValue(value: any): void {
    this.value = value;
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  
  onValueChange(value: any): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }
}
```

---

## CSS Conventions

### Layer Order

```scss
@layer inputs, primeng, app;
```

Always respect this order. Component styles go in `app` layer by default.

### Design Tokens

```scss
// Use variables, don't hardcode colors
.button {
  background: var(--button-primary-normal);
  border-radius: var(--input-border-radius);
  
  &:hover {
    background: var(--button-primary-hover);
  }
}
```

### Key Variables

| Variable | Value | Usage |
|----------|-------|-------|
| `--primary-blue-black` | `#10162D` | Main text, dark backgrounds |
| `--primary-cream-regular` | `#FFFCF5` | Page backgrounds |
| `--secondary-purple` | `#8297E9` | Accents, links |
| `--input-border-radius` | `1.75rem` | All rounded inputs |

### Component Scoping

```scss
// In component SCSS file
:host {
  display: block;
}

.component-root {
  // Component-specific styles
}
```

---

## Import Conventions

### Backend

```csharp
// System namespaces first
using System;
using System.Collections.Generic;

// Third-party
using MediatR;
using FluentValidation;

// Project namespaces (by layer)
using ExoticPetshop.Domain.Entities;
using ExoticPetshop.Application.Common;
```

### Frontend

```typescript
// Angular core
import { Component, signal } from '@angular/core';

// Angular modules
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Third-party
import { Select } from 'primeng/select';

// Project imports (relative paths)
import { GlobalConstants } from '../../../common/global-constants';
import { DogsApi } from '../../../service/api/dogs/dogs-api';
```

---

## Comment Conventions

### When to Comment

- **Do**: Complex business logic, non-obvious decisions, public API docs
- **Don't**: Obvious code, every method, commented-out code

### Backend

```csharp
/// <summary>
/// Calculates the total price including applicable discounts.
/// </summary>
/// <param name="basePrice">Original price before discounts</param>
/// <param name="discountPercent">Discount as a percentage (0-100)</param>
/// <returns>Final price after discount, minimum 0</returns>
public Money CalculatePrice(Money basePrice, int discountPercent)
{
    // Business rule: discount cannot reduce price below zero
    var discount = basePrice.Amount * (discountPercent / 100m);
    return new Money(Math.Max(0, basePrice.Amount - discount));
}
```

### Frontend

```typescript
/**
 * Fetches and caches SVG assets for inline rendering.
 * Uses shareReplay to prevent duplicate HTTP requests.
 */
getSvg(url: string): Observable<SafeHtml> {
  // Return cached value immediately if available
  if (this.cache.has(url)) {
    return of(this.cache.get(url)!);
  }
  // ...
}
```
