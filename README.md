# FormForge

A modern, full-stack dynamic form builder application that allows users to create, manage, and collect submissions from custom forms.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Form Field Types](#form-field-types)
- [Grid-Based Positioning](#grid-based-positioning)

---

## Features

- **Dynamic Form Builder**: Drag-and-drop interface to create forms with various field types
- **Grid-Based Layout**: Organize fields in a flexible grid system (rows A-Z, columns 1-4)
- **Field Validation**: Built-in validation rules for text length, number ranges, email policies, and regex patterns
- **Public Form Sharing**: Generate unique shareable URLs for each form
- **Submission Management**: View, filter by date range, and export submissions as CSV
- **Form Versioning**: Each edit creates a new independent form with version-appended naming
- **Simple Authentication**: Email-based user identification (no password required)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (React + TypeScript)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Login     │  │  Dashboard  │  │ FormBuilder │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ PublicForm  │  │ Submissions │                               │
│  └─────────────┘  └─────────────┘                               │
│                         │                                        │
│              Axios + React Query                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTP/REST
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
│                   (Fastify + TypeScript)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     Routes Layer                         │    │
│  │  POST /api/v1/forms          - Create form               │    │
│  │  PUT  /api/v1/forms/:formId  - Edit form (new version)   │    │
│  │  GET  /api/v1/forms          - List user's forms         │    │
│  │  GET  /forms/:slug           - Render public form        │    │
│  │  POST /forms/:slug/submit    - Submit form data          │    │
│  │  GET  /api/v1/forms/:formId/submissions - Get submissions│    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Validation Layer                       │    │
│  │  - JSON Schema validation (Fastify built-in)             │    │
│  │  - Position validator (grid contiguity)                  │    │
│  │  - Submission validator (field-level validation)         │    │
│  │  - Email validator (domain policies)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Mongoose ODM
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB                                   │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  FormDefinition  │  │    Submission    │                     │
│  │  - formId        │  │  - formId        │                     │
│  │  - slug          │  │  - formVersion   │                     │
│  │  - name          │  │  - slug          │                     │
│  │  - fields[]      │  │  - data          │                     │
│  │  - version       │  │  - submittedAt   │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Form Creation**: User builds form in React UI → POST to `/api/v1/forms` → Validates schema & positions → Saves to MongoDB
2. **Form Sharing**: Form gets unique slug → Public URL: `/forms/{slug}` → Anyone can access and submit
3. **Form Submission**: Public user fills form → POST to `/forms/{slug}/submit` → Validates against field definitions → Saves submission
4. **View Submissions**: Form owner fetches from `/api/v1/forms/{formId}/submissions` → Supports date filtering & CSV export

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Fastify** | High-performance web framework |
| **TypeScript** | Type-safe JavaScript |
| **MongoDB** | NoSQL database for flexible form schemas |
| **Mongoose** | MongoDB ODM for schema validation |
| **nanoid** | Short unique ID generation for slugs |
| **uuid** | UUID generation for form IDs |
| **Zod** | Runtime type validation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI library |
| **TypeScript** | Type-safe components |
| **Vite** | Fast build tool and dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **React Query** | Server state management |
| **React Hook Form** | Form state management |
| **dnd-kit** | Drag-and-drop functionality |
| **Axios** | HTTP client |
| **Lucide React** | Icon library |

---

## Project Structure

```
/
├── backend/
│   ├── index.ts                    # Application entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── routes/
│       │   ├── index.ts            # Route registration
│       │   └── form.routes.ts      # All form & submission endpoints
│       ├── schemas/
│       │   └── form.schema.ts      # JSON Schema definitions
│       ├── db/
│       │   └── models/
│       │       ├── formDefinition.ts   # Form model
│       │       └── submission.ts       # Submission model
│       ├── middlewares/
│       │   └── authorize.ts        # Auth middleware
│       └── utils/
│           ├── csvExporter.ts      # CSV export utility
│           ├── urlHash.ts          # URL hashing utility
│           └── validator/
│               ├── index.ts
│               ├── position.validator.ts    # Grid position validation
│               ├── submission.validator.ts  # Field validation
│               └── isValidEmail.validator.ts
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx               # React entry point
│       ├── App.tsx                # Router setup
│       ├── index.css              # Global styles
│       ├── api/
│       │   └── client.ts          # API client
│       ├── components/
│       │   ├── ui/                # Reusable UI components
│       │   ├── form-builder/      # Form builder components
│       │   └── form-renderer/     # Public form renderer
│       ├── contexts/
│       │   └── AuthContext.tsx    # Auth state management
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Dashboard.tsx
│       │   ├── FormBuilder.tsx
│       │   ├── PublicForm.tsx
│       │   └── Submissions.tsx
│       ├── types/
│       │   └── form.ts            # TypeScript types
│       └── lib/
│           ├── utils.ts           # Utility functions
│           └── validation.ts      # Form validation
│
└── README.md
```

---

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local or cloud instance like MongoDB Atlas)

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Or create manually:
echo "MONGODB_URI=mongodb://localhost:27017/formforge
PORT=3000
APP_DOMAIN=http://localhost:5173" > .env
```

**Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/formforge` |
| `PORT` | Backend server port | `3000` |
| `APP_DOMAIN` | Frontend URL (for form links) | `http://localhost:5173` |

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

The frontend connects to `http://localhost:3000` by default. To change this, edit `src/api/client.ts`.

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

---

## API Endpoints

### Protected Endpoints (require `x-user-email` header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/forms` | Create a new form |
| `PUT` | `/api/v1/forms/:formId` | Edit form (creates new version) |
| `GET` | `/api/v1/forms` | List all forms for user |
| `GET` | `/api/v1/forms/:formId/submissions` | Get submissions with filters |

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/forms/:slug` | Get form definition for rendering |
| `POST` | `/forms/:slug/submit` | Submit form data |

### Query Parameters for Submissions

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |
| `from` | string | Start date filter (ISO format) |
| `to` | string | End date filter (ISO format) |
| `export` | boolean | If true, returns CSV file |

---

## Data Models

### FormDefinition

```typescript
{
  formId: string       // UUID - unique identifier
  slug: string         // nanoid - used in public URL
  formUrl: string      // Full public URL
  urlHash: string      // SHA-256 hash for fast lookups
  name: string         // Form name (includes version suffix)
  description: string  // Form description
  fields: FormField[]  // Array of field definitions
  createdBy: string    // User email
  updatedBy: string    // User email
  version: number      // Always 1 (new form per edit)
  createdAt: Date
  updatedAt: Date
}
```

### Submission

```typescript
{
  formId: string           // Reference to form
  formVersion: number      // Form version at submission time
  slug: string             // Form slug
  data: Record<string, any> // Submitted field values
  submittedAt: Date
}
```

---

## Form Field Types

| Type | Description | Validation Options |
|------|-------------|-------------------|
| `single-line-text` | Single line input | `minLength`, `maxLength` |
| `textarea` | Multi-line text | `minLength`, `maxLength` |
| `number` | Numeric input | `min`, `max` |
| `email` | Email input | `emailPolicy`: `any` or `allowed-domains` |
| `dropdown` | Select dropdown | `options[]` |
| `checkbox` | Boolean checkbox | - |
| `date` | Date picker | - |

---

## Grid-Based Positioning

Fields are positioned using a grid system:

- **Rows**: A-Z (letters)
- **Columns**: 1-4 (numbers)
- **Format**: `{Row}{Column}` (e.g., `A1`, `B3`, `C4`)

### Rules

1. **Rows must start from A** - Cannot have row B without row A
2. **Rows must be contiguous** - Cannot skip rows (A, C without B)
3. **Columns must start from 1** - Each row starts at column 1
4. **Columns must be contiguous** - No gaps within a row

### Valid Examples

```
A1              ✓ Single field
A1, A2          ✓ Two fields in row A
A1, A2, B1      ✓ Two rows, contiguous
A1, B1, B2, C1  ✓ Three rows, all start at column 1
```

### Invalid Examples

```
B1              ✗ Missing row A
A1, C1          ✗ Gap between rows A and C
A2              ✗ Row A doesn't start at column 1
A1, A3          ✗ Gap in columns (missing A2)
```

---

## License

ISC

