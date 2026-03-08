# API Contracts

## Ziel

Codex soll API-Routen nicht erraten. Diese Datei definiert Request- und Response-Formate für den MVP.

## 1. GET /api/projects

### Response 200
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Esstisch Müller",
      "description": null,
      "coverImageId": "uuid",
      "updatedAt": "2026-03-08T12:00:00.000Z"
    }
  ]
}
```

## 2. POST /api/projects

### Request
```json
{
  "name": "Esstisch Müller",
  "description": "Kundin mit gelbem Wohnzimmer"
}
```

### Response 201
```json
{
  "project": {
    "id": "uuid",
    "name": "Esstisch Müller"
  }
}
```

## 3. POST /api/uploads

Multipart Upload.

### Felder
- `projectId`
- `file`
- `type`

### Response 201
```json
{
  "image": {
    "id": "uuid",
    "projectId": "uuid",
    "type": "upload",
    "filePath": "/..."
  }
}
```

## 4. GET /api/projects/:id/images

### Response 200
```json
{
  "images": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "parentImageId": null,
      "thumbnailPath": "/..."
    }
  ]
}
```

## 5. POST /api/generations

### Request
```json
{
  "projectId": "uuid",
  "sourceImageId": "uuid",
  "mode": "environment_edit",
  "variantsRequested": 3,
  "stylePreset": "editorial",
  "lightPreset": "evening",
  "instructions": "Gelbe Wand und Hängepflanzen",
  "preserveObject": true,
  "preservePerspective": true,
  "placement": null
}
```

### Für room_insert
```json
{
  "projectId": "uuid",
  "sourceImageId": "uuid",
  "mode": "room_insert",
  "variantsRequested": 2,
  "stylePreset": "original",
  "lightPreset": "original",
  "instructions": "",
  "preserveObject": true,
  "preservePerspective": true,
  "placement": {
    "roomImageId": "uuid",
    "x": 420,
    "y": 310,
    "width": 240,
    "height": 180
  }
}
```

### Response 201
```json
{
  "generation": {
    "id": "uuid",
    "status": "succeeded",
    "variantsReturned": 2
  },
  "images": [
    {
      "id": "uuid",
      "parentImageId": "uuid",
      "thumbnailPath": "/..."
    }
  ]
}
```

## 6. GET /api/costs/summary

### Response 200
```json
{
  "today": 0.42,
  "month": 6.11,
  "averagePerImage": 0.07,
  "mostExpensiveProject": {
    "projectId": "uuid",
    "name": "Esstisch Müller",
    "total": 2.90
  }
}
```

## 7. GET /api/costs/logs

### Response 200
```json
{
  "logs": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "projectName": "Esstisch Müller",
      "model": "imagen",
      "totalPrice": 0.08,
      "createdAt": "2026-03-08T12:00:00.000Z"
    }
  ]
}
```

## 8. GET /api/images/:id/download

Antwort ist die Bilddatei oder ein Redirect auf eine signierte URL.
