# Datenmodell und Storage

## Tabellen

### users
- id
- email
- name
- created_at

### projects
- id
- user_id
- name
- description
- cover_image_id
- created_at
- updated_at

### images
- id
- project_id
- user_id
- parent_image_id
- generation_id
- type
- file_path
- thumbnail_path
- mime_type
- width
- height
- placement_x
- placement_y
- placement_width
- placement_height
- prompt_snapshot
- settings_snapshot
- created_at

### generations
- id
- project_id
- user_id
- source_image_id
- provider
- model
- mode
- prompt_text
- system_prompt_text
- settings_json
- variants_requested
- variants_returned
- usage_json
- estimated_cost
- actual_cost
- status
- created_at

### presets
- id
- user_id nullable
- category
- name
- prompt_fragment
- is_default
- created_at

### cost_logs
- id
- generation_id
- provider
- model
- unit_type
- quantity
- unit_price
- total_price
- currency
- created_at

## Modi

`mode` in `generations`:
- `environment_edit`
- `material_edit`
- `room_insert`

## Parent-Child-Kette

Beispiel:
- Originalbild
  - Variante A
    - Variante A1
  - Variante B

## Storage

Empfohlen:
S3-kompatibler Storage, z. B. R2, S3, Supabase Storage oder MinIO.

## Pfadstruktur

```text
/users/{userId}/projects/{projectId}/originals/
users/{userId}/projects/{projectId}/generated/
users/{userId}/projects/{projectId}/thumbs/
users/{userId}/projects/{projectId}/masks/
```

## Warum Snapshots wichtig sind

Zu jedem generierten Bild speichern:
- finaler Prompt
- Systemprompt
- gewählte Presets
- UI-Werte
- Modus
