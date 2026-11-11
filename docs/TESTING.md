# Testing Guide

> Testing conventions and practices for the Exotic Petshop codebase.

---

## Test Philosophy

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Fast feedback loop** - Unit tests should run in seconds
3. **Pyramid structure** - Many unit tests, fewer integration tests, minimal E2E
4. **Tests as documentation** - Test names describe expected behavior

---

## Test Pyramid

```
        ┌─────────┐
        │   E2E   │  Few, critical user journeys
        ├─────────┤
        │  Integ  │  API endpoints, database
        ├─────────┤
        │  Unit   │  Domain, handlers, components
        └─────────┘
```

| Type | Speed | Scope | When to Write |
|------|-------|-------|---------------|
| Unit | Fast (<100ms) | Single class/function | Always for logic |
| Integration | Medium (<5s) | Multiple components | API endpoints, DB |
| E2E | Slow (<30s) | Full user flow | Critical paths only |

---

## Backend Testing

### Test Project Structure

> **Note:** Backend tests are not yet implemented. When adding tests, use this structure.

**Proposed structure:**
```
backend/
├── Controllers/
├── Application/
├── Domain/
├── Infrastructure/
└── Tests/                       # Add when creating tests
    ├── Domain.UnitTests/
    │   └── Entities/
    │       └── DogTests.cs
    ├── Application.UnitTests/
    │   └── Features/
    │       └── Dogs/
    │           ├── GetDogsQueryHandlerTests.cs
    │           └── GetDogByIdQueryHandlerTests.cs
    └── API.IntegrationTests/
        └── Controllers/
            └── DogsControllerTests.cs
```

**Current actual structure (flat layout):**
```
backend/
├── Controllers/        # API endpoints
├── Application/        # CQRS handlers, interfaces
├── Domain/             # Entities, enums
├── Infrastructure/     # EF Core persistence
└── Program.cs
```

### Naming Convention

```
{MethodName}_{Scenario}_{ExpectedBehavior}
```

Examples:
- `Create_WithValidInput_ReturnsDog`
- `Create_WithEmptyName_ThrowsDomainException`
- `Handle_WithNonExistentId_ReturnsNull`

### Unit Test Patterns

**Domain Entity Tests:**
```csharp
public class DogTests
{
    [Fact]
    public void Create_WithValidInput_ReturnsDog()
    {
        // Arrange
        var name = "Buddy";
        var breed = "Golden Retriever";
        var ageMonths = 12;
        
        // Act
        var dog = Dog.Create(name, breed, ageMonths);
        
        // Assert
        Assert.NotNull(dog);
        Assert.Equal(name, dog.Name);
        Assert.Equal(breed, dog.Breed);
        Assert.Equal(ageMonths, dog.AgeMonths);
        Assert.NotEqual(Guid.Empty, dog.Id);
    }
    
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void Create_WithInvalidName_ThrowsDomainException(string invalidName)
    {
        // Act & Assert
        var exception = Assert.Throws<DomainException>(() => 
            Dog.Create(invalidName, "Breed", 12));
        
        Assert.Contains("name", exception.Message, StringComparison.OrdinalIgnoreCase);
    }
}
```

**Handler Tests:**
```csharp
public class CreateDogCommandHandlerTests
{
    private readonly Mock<IDogRepository> _repositoryMock;
    private readonly CreateDogCommandHandler _handler;
    
    public CreateDogCommandHandlerTests()
    {
        _repositoryMock = new Mock<IDogRepository>();
        _handler = new CreateDogCommandHandler(_repositoryMock.Object);
    }
    
    [Fact]
    public async Task Handle_WithValidCommand_CreatesDogAndReturnsId()
    {
        // Arrange
        var command = new CreateDogCommand("Buddy", "Golden Retriever", 12);
        _repositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Dog>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        
        // Act
        var result = await _handler.Handle(command, CancellationToken.None);
        
        // Assert
        Assert.NotEqual(Guid.Empty, result);
        _repositoryMock.Verify(
            r => r.AddAsync(It.Is<Dog>(d => d.Name == "Buddy"), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
```

**Validator Tests:**
```csharp
public class CreateDogCommandValidatorTests
{
    private readonly CreateDogCommandValidator _validator;
    
    public CreateDogCommandValidatorTests()
    {
        _validator = new CreateDogCommandValidator();
    }
    
    [Fact]
    public void Validate_WithValidCommand_ReturnsSuccess()
    {
        var command = new CreateDogCommand("Buddy", "Golden Retriever", 12);
        var result = _validator.Validate(command);
        Assert.True(result.IsValid);
    }
    
    [Fact]
    public void Validate_WithEmptyName_ReturnsError()
    {
        var command = new CreateDogCommand("", "Breed", 12);
        var result = _validator.Validate(command);
        
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "Name");
    }
    
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_WithInvalidAge_ReturnsError(int invalidAge)
    {
        var command = new CreateDogCommand("Buddy", "Breed", invalidAge);
        var result = _validator.Validate(command);
        
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == "AgeMonths");
    }
}
```

### Integration Test Patterns

```csharp
public class DogsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    
    public DogsControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }
    
    [Fact]
    public async Task GetById_WithExistingId_ReturnsOk()
    {
        // Arrange - seed data in test setup
        var dogId = Guid.Parse("...");
        
        // Act
        var response = await _client.GetAsync($"/api/dogs/{dogId}");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var dog = await response.Content.ReadFromJsonAsync<DogDto>();
        Assert.NotNull(dog);
        Assert.Equal(dogId, dog.Id);
    }
    
    [Fact]
    public async Task Create_WithInvalidInput_ReturnsBadRequest()
    {
        // Arrange
        var request = new { Name = "", Breed = "Test", AgeMonths = 12 };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/dogs", request);
        
        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

### Running Backend Tests

```bash
# Run all tests
dotnet test

# Run specific project
dotnet test tests/Domain.UnitTests

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test
dotnet test --filter "FullyQualifiedName~CreateDogCommandHandlerTests"
```

---

## Frontend Testing

### Test File Location

Tests live next to the code they test:

```
views/pages/home/
├── home.ts
├── home.html
├── home.scss
└── home.spec.ts    ← Test file
```

### Component Test Patterns

**Basic Component Test:**
```typescript
// home.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { Layout } from '../../../service/ui/layout/layout';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let layoutService: Layout;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [Layout]
    }).compileComponents();
    
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    layoutService = TestBed.inject(Layout);
    fixture.detectChanges();
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should set transparent nav on init', () => {
    expect(layoutService.transparentNav()).toBeTrue();
  });
  
  it('should reset transparent nav on destroy', () => {
    component.ngOnDestroy();
    expect(layoutService.transparentNav()).toBeFalse();
  });
});
```

**Service Test:**
```typescript
// dogs-api.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DogsApi, DogDto } from './dogs-api';
import { environment } from '../../../../environments/environment';

describe('DogsApi', () => {
  let service: DogsApi;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DogsApi]
    });
    
    service = TestBed.inject(DogsApi);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
  
  it('should fetch all dogs', () => {
    const mockDogs: DogDto[] = [
      { id: '1', name: 'Buddy', breed: 'Golden', ageMonths: 12, price: 500 }
    ];
    
    service.getAll().subscribe(dogs => {
      expect(dogs).toEqual(mockDogs);
    });
    
    const req = httpMock.expectOne(`${environment.apiUrl}/api/dogs`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDogs);
  });
});
```

**Component with Inputs:**
```typescript
describe('FilterAccordion', () => {
  let component: FilterAccordion;
  let fixture: ComponentFixture<FilterAccordion>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterAccordion]
    }).compileComponents();
    
    fixture = TestBed.createComponent(FilterAccordion);
    component = fixture.componentInstance;
  });
  
  it('should emit selection change when option toggled', () => {
    component.title = 'Breed';
    component.options = [
      { label: 'Golden', value: 'golden' },
      { label: 'Husky', value: 'husky' }
    ];
    fixture.detectChanges();
    
    spyOn(component.selectionChange, 'emit');
    
    component.toggleOption('golden');
    
    expect(component.selectionChange.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ value: 'golden', selected: true })
    );
  });
});
```

### Running Frontend Tests

```bash
# From /frontend directory

# Run all tests
ng test

# Run tests once (CI mode)
ng test --no-watch --browsers=ChromeHeadless

# Run with coverage
ng test --code-coverage

# Run specific test file
ng test --include=**/home.spec.ts
```

---

## E2E Testing (Playwright)

### Setup

```bash
# Install Playwright
npm init playwright@latest
```

### Test Structure

```
frontend/
└── e2e/
    ├── fixtures/
    │   └── test-data.ts
    ├── pages/
    │   ├── home.page.ts
    │   └── store.page.ts
    └── tests/
        ├── home.spec.ts
        └── store-filters.spec.ts
```

### Page Object Pattern

```typescript
// e2e/pages/store.page.ts
import { Page, Locator } from '@playwright/test';

export class StorePage {
  readonly page: Page;
  readonly filterButton: Locator;
  readonly breedFilter: Locator;
  readonly productGrid: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.breedFilter = page.getByTestId('breed-filter');
    this.productGrid = page.getByTestId('product-grid');
  }
  
  async goto() {
    await this.page.goto('/store');
  }
  
  async selectBreed(breed: string) {
    await this.breedFilter.click();
    await this.page.getByRole('checkbox', { name: breed }).check();
  }
  
  async getProductCount(): Promise<number> {
    return await this.productGrid.locator('.product-card').count();
  }
}
```

### E2E Test Example

```typescript
// e2e/tests/store-filters.spec.ts
import { test, expect } from '@playwright/test';
import { StorePage } from '../pages/store.page';

test.describe('Store Filters', () => {
  test('should filter products by breed', async ({ page }) => {
    const storePage = new StorePage(page);
    await storePage.goto();
    
    const initialCount = await storePage.getProductCount();
    
    await storePage.selectBreed('Golden Retriever');
    
    const filteredCount = await storePage.getProductCount();
    expect(filteredCount).toBeLessThan(initialCount);
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test store-filters.spec.ts

# Debug mode
npx playwright test --debug
```

---

## Test Coverage Requirements

| Layer | Minimum Coverage | Focus Areas |
|-------|------------------|-------------|
| Domain | 90% | All entity methods, value objects |
| Application | 80% | All handlers, validators |
| API | 60% | Happy path + error cases |
| Frontend Components | 70% | Components with logic |
| E2E | N/A | Critical user journeys |

---

## When to Write Which Test

| Scenario | Unit | Integration | E2E |
|----------|------|-------------|-----|
| New domain entity | ✅ | | |
| New CQRS handler | ✅ | | |
| New validator | ✅ | | |
| New API endpoint | ✅ | ✅ | |
| New complex component | ✅ | | |
| New user journey | | | ✅ |
| Bug fix | ✅ (regression) | Maybe | Maybe |

---

## Test Data Management

### Backend

- Use in-memory database for unit tests
- Use test containers for integration tests
- Never share state between tests

### Frontend

- Mock HTTP calls with `HttpTestingController`
- Use factory functions for test data
- Reset state in `beforeEach`

```typescript
// test-factories.ts
export function createMockDog(overrides: Partial<DogDto> = {}): DogDto {
  return {
    id: crypto.randomUUID(),
    name: 'Test Dog',
    breed: 'Test Breed',
    ageMonths: 12,
    price: 500,
    ...overrides
  };
}
```
