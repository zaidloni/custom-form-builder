# Form Builder Frontend

A complete React + TypeScript frontend for the Custom Form Builder system. This application provides a user-friendly interface for creating forms, managing submissions, and viewing form data.

## Features

- **Form Builder**: Create and edit forms with drag-and-drop field reordering
- **Field Types**: Support for text, textarea, number, email, dropdown, checkbox, and date fields
- **Validation**: Comprehensive client-side and server-side validation
- **Public Forms**: Public-facing form submission interface
- **Submissions Grid**: View, search, filter, and export form submissions
- **CSV Export**: Export filtered submissions to CSV format

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **TanStack Query** for data fetching
- **React Hook Form + Zod** for form validation
- **@dnd-kit** for drag-and-drop functionality
- **TanStack Table** for data grid
- **date-fns** for date formatting

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend documentation)

## Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# User Email (for x-user-email header in authenticated requests)
# This is a temporary solution until proper authentication is implemented
VITE_USER_EMAIL=user@example.com
```

**Note:** The `x-user-email` header is used for authentication. In production, this should be replaced with proper authentication (JWT tokens, sessions, etc.).

3. **Start the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Development

### Project Structure

```
frontend/
├── src/
│   ├── api/              # API client functions
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── forms/            # Form schemas and validation
│   ├── hooks/            # Custom React hooks
│   ├── providers/        # Context providers
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── styles/           # Global styles
│   ├── router.tsx        # Route configuration
│   ├── App.tsx           # Root component
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML template
└── package.json          # Dependencies and scripts
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### API Configuration

The frontend communicates with the backend API. Ensure the backend is running and accessible at the URL specified in `VITE_API_BASE_URL`.

**API Endpoints Used:**

- `POST /api/v1/forms` - Create form
- `PUT /api/v1/forms/:formId` - Edit form
- `GET /api/v1/forms` - List forms
- `GET /forms/:slug` - Get form by slug (public)
- `POST /forms/:slug/submit` - Submit form (public)
- `GET /api/v1/forms/:formId/submissions` - List submissions

### Authentication

Currently, authentication is handled via the `x-user-email` header. The email is taken from:

1. `VITE_USER_EMAIL` environment variable
2. `localStorage.getItem('user-email')`
3. Default fallback: `user@example.com`

**This is a temporary solution.** In production, implement proper authentication (JWT tokens, OAuth, etc.).

### Field Types

The following field types are supported:

- `single-line-text` - Single line text input
- `textarea` - Multi-line text input
- `number` - Numeric input
- `email` - Email input with validation
- `dropdown` - Select dropdown (requires options array)
- `checkbox` - Boolean checkbox
- `date` - Date picker

### Validation

Validation rules are configured per field:

- **Text/Textarea**: min/max length, regex pattern
- **Number**: min/max value
- **Email**: email format, allowed domains policy
- **All fields**: required/optional

### Frontend-Only Features

Some features are frontend-only and not sent to the backend:

- **Column Layout**: Fields can be assigned to 1 or 2 columns
- **Section Grouping**: Fields can be grouped into sections
- **Dropdown Options**: Options array for dropdown fields (may not be supported by backend)

These are stored in the field object but are filtered out before sending to the API.

### Form Versions

The backend creates a new version of a form each time it's edited. The frontend always works with the latest version for editing, but displays the version number in the UI.

### CSV Export

Submissions can be exported to CSV format. The export:

- Includes all visible columns (submitted_at + all field labels)
- Respects current filters and search query
- Uses field labels as column headers
- Matches backend CSV format

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Troubleshooting

### API Connection Issues

- Verify the backend is running
- Check `VITE_API_BASE_URL` matches the backend URL
- Check browser console for CORS errors

### Authentication Errors

- Ensure `VITE_USER_EMAIL` is set to a valid email
- Check that the backend accepts the `x-user-email` header

### Form Submission Errors

- Verify form validation passes
- Check that all required fields are filled
- Review browser console for error messages

## Notes

- The frontend assumes the backend API contracts as defined in the backend codebase
- Field key generation matches backend logic (lowercase, underscores, trimmed)
- CSV export format matches backend CSV exporter
- All user-rendered content is sanitized to prevent XSS attacks

## License

ISC

