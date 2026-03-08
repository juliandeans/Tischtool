# Drizzle Schema Spec

## Ziel

Das Schema soll von Anfang an konkret sein, damit Codex nicht erst ein halbes Schema mit `any`-Feldern baut.

## Empfehlung

- PostgreSQL
- Drizzle ORM
- UUIDs als Primary Keys
- JSONB für flexible Settings/Usage-Felder
- Timestamps mit `defaultNow()`

## Tabellen – Drizzle-Konzept

### users

- id: uuid pk
- email: text unique not null
- name: text nullable
- createdAt: timestamp not null default now

### projects

- id: uuid pk
- userId: uuid fk users.id not null
- name: text not null
- description: text nullable
- coverImageId: uuid nullable
- createdAt: timestamp not null default now
- updatedAt: timestamp not null default now

### images

- id: uuid pk
- projectId: uuid fk projects.id not null
- userId: uuid fk users.id not null
- parentImageId: uuid nullable
- generationId: uuid nullable
- type: text not null
- filePath: text not null
- thumbnailPath: text nullable
- mimeType: text not null
- width: integer nullable
- height: integer nullable
- placementX: integer nullable
- placementY: integer nullable
- placementWidth: integer nullable
- placementHeight: integer nullable
- promptSnapshot: jsonb nullable
- settingsSnapshot: jsonb nullable
- createdAt: timestamp not null default now

### generations

- id: uuid pk
- projectId: uuid fk projects.id not null
- userId: uuid fk users.id not null
- sourceImageId: uuid fk images.id not null
- provider: text not null
- model: text not null
- mode: text not null
- promptText: text not null
- systemPromptText: text nullable
- settingsJson: jsonb nullable
- variantsRequested: integer not null default 1
- variantsReturned: integer not null default 0
- usageJson: jsonb nullable
- estimatedCost: numeric nullable
- actualCost: numeric nullable
- status: text not null
- createdAt: timestamp not null default now

### presets

- id: uuid pk
- userId: uuid nullable
- category: text not null
- name: text not null
- promptFragment: text not null
- isDefault: boolean not null default false
- createdAt: timestamp not null default now

### costLogs

- id: uuid pk
- generationId: uuid fk generations.id not null
- provider: text not null
- model: text not null
- unitType: text not null
- quantity: numeric not null
- unitPrice: numeric not null
- totalPrice: numeric not null
- currency: text not null default 'EUR'
- createdAt: timestamp not null default now

## Enums als Text im MVP

Für schnellen Start im MVP:

- `mode`
- `status`
- `type`
- `category`

dürfen als `text` modelliert werden, aber nur über TypeScript-Literal-Types benutzt werden.

## Zulässige Werte

### image.type

- `original`
- `generated`
- `upload`

### generation.mode

- `environment_edit`
- `material_edit`
- `room_insert`

### generation.status

- `pending`
- `running`
- `succeeded`
- `failed`

### preset.category

- `style`
- `light`
- `environment`
