# Database Structure

> PostgreSQL database schema for the Paws monorepo.

---

## Overview

The database uses PostgreSQL 18 with custom enum types for type-safe status fields.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   breeds    │       │    dogs     │       │    sizes    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ breed_id    │       │ id (PK)     │
│ breed       │       │ size_id     ├──────►│ size        │
└─────────────┘       │ id (PK)     │       └─────────────┘
                      │ name        │
                      │ description │
                      │ gender      │
                      │ origin      │
                      │ price       │
                      │ age         │
                      │ *_image_url │
                      └──────┬──────┘
                             │
                             │ (dog_id)
                             ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │◄──────┤reservations │       │   reviews   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │◄──────┤reservation_id│
│ email       │       │ user_id     │       │ id (PK)     │
│ full_name   │       │ dog_id      │       │ rating      │
│ ...         │       │ status      │       │ review      │
└──────┬──────┘       │ reserved_at │       └─────────────┘
       │              └─────────────┘
       │
       │ (user_id)
       ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  addresses  │       │ users_roles │       │    roles    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ user_id     │       │ user_id     ├──────►│ role        │
│ country     │       │ role_id     │       └─────────────┘
│ city        │       └─────────────┘
│ shipping_*  │
└─────────────┘
```

---

## Custom Types (Enums)

### `dog_gender`
```sql
CREATE TYPE public.dog_gender AS ENUM ('boy', 'girl');
```

### `reservation_status`
```sql
CREATE TYPE public.reservation_status AS ENUM (
    'reserved',
    'in-transit',
    'delivered',
    'cancelled'
);
```

### `user_account_status`
```sql
CREATE TYPE public.user_account_status AS ENUM (
    'active',
    'inactive',
    'disabled',
    'deleted'
);
```

---

## Tables

### `dogs`

Core product table for available pets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `name` | `text` | NOT NULL | Dog's name |
| `description` | `text` | NOT NULL | Care/behavior description |
| `breed_id` | `bigint` | FK → breeds.id, NOT NULL | Breed reference |
| `size_id` | `bigint` | FK → sizes.id, NOT NULL | Size category |
| `gender` | `dog_gender` | NOT NULL | 'boy' or 'girl' |
| `origin` | `text` | NOT NULL | Country of origin |
| `price` | `bigint` | NOT NULL, CHECK > 0 | Price in cents/smallest unit |
| `age` | `integer` | NOT NULL, CHECK >= 0 | Age in months |
| `thumbnail_image_url` | `text` | NOT NULL | Grid card thumbnail |
| `main_image_url` | `text` | NOT NULL | Detail page main image |
| `side_image_urls` | `text[]` | NOT NULL | Gallery images array |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | | Last update timestamp |

### `breeds`

Lookup table for dog breeds.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `breed` | `text` | NOT NULL, UNIQUE | Breed name |

**Seeded values:** Cocker Spaniel, Doberman, Boerboel, French Bulldog, Dachshund, Papillon, Golden Retriever, Husky, Wolfdog

### `sizes`

Lookup table for size categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `size` | `text` | NOT NULL, UNIQUE | Size label |

**Seeded values:** small, medium, large

### `users`

User accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `email` | `text` | NOT NULL, UNIQUE | Login email |
| `password_hash` | `text` | NOT NULL | Hashed password |
| `full_name` | `text` | | Display name |
| `phone_number_e164` | `text` | UNIQUE | Phone in E.164 format |
| `status` | `text` | | Account status |
| `twofa_enabled` | `boolean` | | 2FA flag |
| `last_login_at` | `timestamptz` | | Last login time |
| `password_updated_at` | `timestamptz` | | Password change time |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | | Last update timestamp |
| `deleted_at` | `timestamptz` | | Soft delete timestamp |

### `addresses`

User shipping addresses (one per user).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `user_id` | `bigint` | FK → users.id, UNIQUE, NOT NULL | Owner reference |
| `shipping_address` | `text` | | Street address |
| `country` | `text` | | Country |
| `city` | `text` | | City |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | | Last update timestamp |

### `roles`

Authorization roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `role` | `text` | NOT NULL | Role name |

### `users_roles`

Many-to-many join table for user roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `user_id` | `bigint` | FK → users.id, NOT NULL | User reference |
| `role_id` | `bigint` | FK → roles.id, NOT NULL | Role reference |

**Constraint:** `UNIQUE(user_id, role_id)`

### `reservations`

Dog reservations/purchases.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `user_id` | `bigint` | FK → users.id, NOT NULL | Buyer reference |
| `dog_id` | `bigint` | FK → dogs.id, NOT NULL | Dog reference |
| `status` | `reservation_status` | NOT NULL | Current status |
| `reserved_at` | `timestamptz` | NOT NULL, DEFAULT now() | Reservation time |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | `timestamptz` | | Last update timestamp |

### `reviews`

Reviews linked to completed reservations (one per reservation).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `bigint` | PK, auto-increment | Unique identifier |
| `reservation_id` | `bigint` | FK → reservations.id, UNIQUE, NOT NULL | Reservation reference |
| `rating` | `integer` | NOT NULL, CHECK 1-5 | Star rating |
| `review` | `text` | | Review text |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | Creation timestamp |

---

## Key Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| dogs → breeds | Many-to-One | Each dog has one breed |
| dogs → sizes | Many-to-One | Each dog has one size category |
| reservations → users | Many-to-One | Each reservation belongs to one user |
| reservations → dogs | Many-to-One | Each reservation is for one dog |
| reviews → reservations | One-to-One | One review per completed reservation |
| addresses → users | One-to-One | One address per user |
| users_roles → users | Many-to-One | User can have multiple roles |
| users_roles → roles | Many-to-One | Role can be assigned to multiple users |

---

## Indexes

The following indexes are implicitly created via constraints:

- `dogs_pkey` on `dogs(id)`
- `breeds_pkey` on `breeds(id)`
- `sizes_pkey` on `sizes(id)`
- `users_pkey` on `users(id)`
- `reservations_pkey` on `reservations(id)`
- `reviews_pkey` on `reviews(id)`
- `email_unique` on `users(email)`
- `breed_unique` on `breeds(breed)`
- `size_unique` on `sizes(size)`

---

## Frontend Filter Mapping

| Filter Category | Database Field | Filter Logic |
|-----------------|----------------|--------------|
| Breed | `dogs.breed_id` → `breeds.breed` | Match breed name |
| Gender | `dogs.gender` | Enum: 'boy' / 'girl' |
| Age | `dogs.age` | Range buckets (in months) |
| Size | `dogs.size_id` → `sizes.size` | Match size label |
| Price | `dogs.price` | Range buckets (in cents) |

### Age Range Mapping

| UI Label | Age Range (months) |
|----------|-------------------|
| 0.5 - 1.5 yrs | 6 - 18 |
| 1.5 - 3 yrs | 18 - 36 |
| 3 - 7 yrs | 36 - 84 |
| 7+ yrs | 84+ |

### Price Range Mapping

| UI Label | Price Range (€) |
|----------|----------------|
| €0 - €150 | 0 - 15000 |
| €150 - €500 | 15000 - 50000 |
| €500 - €1250 | 50000 - 125000 |
| €1250+ | 125000+ |

> **Note:** Prices stored in cents (bigint). Divide by 100 for display.
