# AGENTS.md — DulceriaCar

## Project Context

This repository is for **DulceriaCar**, a web project originally exported from Replit.

The current goal is to clean up, restructure, and rebuild the project into a maintainable production-ready web application.

This is **not intended to be a native mobile application** at this stage. The target is a **mobile-first responsive web application**, optimized for users accessing it from mobile browsers.

The existing functionality from the Replit version should be preserved unless explicitly instructed otherwise.

## Primary Objectives

Cursor should help plan and execute the project migration with the following goals:

1. Clean up the exported Replit project.
2. Identify the current frontend, backend, data model, configuration, and business logic.
3. Create a clean project structure suitable for long-term maintenance.
4. Prepare the project to be hosted on **Railway**, including frontend and backend deployment.
5. Set up the project to live in a GitHub repository named:

```text
DulceriaCar
```

6. Introduce a database-backed configuration system.
7. Allow configuration parameters to be managed by an authenticated administrator user.
8. Preserve the current user-facing functionality from the original Replit project.
9. Prioritize mobile-first web UX over desktop-first layouts.

---

## Important Workspace Assumption

The folder `DULCERIA-CAR` is already added to the Cursor workspace.

Cursor should inspect the existing files in this folder before suggesting or applying changes.

Do not assume the current architecture is correct. First analyze what exists, then propose a migration plan.

---

## Current Known Requirements

### Repository

The project should be prepared for a GitHub repository named:

```text
DulceriaCar
```

Tasks may include:

* Cleaning unnecessary Replit files.
* Adding or improving `.gitignore`.
* Creating a clean `README.md`.
* Creating environment variable documentation.
* Preparing the initial commit structure.
* Making sure no secrets are committed.
* Ensuring the project can be cloned and run locally.

---

### Deployment Target

The project must be deployable on **Railway**.

Railway should host:

* Frontend.
* Backend.
* Database.

The final architecture may be either:

1. A monorepo with separate frontend and backend apps.
2. A single full-stack app if that better fits the existing project.

Cursor should inspect the exported project before deciding.

Preferred outcome:

```text
DULCERIA-CAR/
  frontend/
  backend/
  README.md
  AGENTS.md
  .gitignore
```

However, this structure is not mandatory if the current stack makes another structure more appropriate.

---

### Application Type

This project should be a **mobile-first web application**, not a native mobile app.

Do not introduce:

* React Native.
* Flutter.
* Capacitor.
* Expo.
* Native iOS or Android build pipelines.

Do prioritize:

* Responsive layout.
* Mobile viewport optimization.
* Touch-friendly UI.
* Fast loading.
* Simple navigation.
* Clean visual hierarchy.
* Browser compatibility.
* Progressive enhancement where useful.

---

## Configuration Management Requirement

Some application parameters must be stored in a database.

These parameters should be:

* Editable by an administrator.
* Loaded by the application when needed.
* Validated before saving.
* Safe to expose only when appropriate.
* Easy to extend over time.

Examples of configurable parameters may include, depending on existing functionality:

* Business name.
* Contact information.
* WhatsApp number.
* Delivery settings.
* Service availability.
* Store hours.
* Promotional messages.
* Product/category visibility.
* Minimum order amount.
* Delivery fee.
* Payment instructions.
* Homepage messages.
* Feature toggles.

Cursor should inspect the current Replit project to identify which parameters are currently hardcoded and propose moving them to database-backed configuration.

---

## Admin Requirement

The application must include an administrator user experience for managing configuration.

At minimum, the admin system should support:

* Admin login.
* Protected admin routes or pages.
* Configuration list/edit screen.
* Validation of configuration values.
* Save/update functionality.
* Clear success and error states.

Cursor should propose the simplest secure implementation appropriate for the project.

Do not over-engineer role-based access control unless needed.

A minimal `admin` role or protected admin user is acceptable for the first version.

---

## Database Requirement

The project should use a database suitable for Railway deployment.

Cursor should inspect the existing project before selecting or confirming the database technology.

Preferred default:

```text
PostgreSQL
```

The database should be used for:

* Configuration parameters.
* Admin user/account data.
* Any existing dynamic data from the Replit app that should not remain hardcoded.

The project should include:

* Database schema.
* Migration strategy.
* Seed strategy for initial admin user and default configuration.
* Local development setup instructions.
* Railway environment variable setup instructions.

---

## Security Guidelines

Cursor must avoid committing secrets.

Sensitive values must be stored in environment variables.

Examples:

```text
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD
SESSION_SECRET
JWT_SECRET
NODE_ENV
```

The exact variables depend on the selected stack.

Admin authentication must not store plaintext passwords.

Use password hashing if credentials are stored in the database.

Recommended baseline:

* Hash passwords with bcrypt or equivalent.
* Use secure sessions or signed tokens.
* Protect admin routes.
* Validate all admin inputs.
* Never expose private configuration values to public frontend code.
* Keep public and private configuration separated.

---

## Migration Strategy

Cursor should not immediately rewrite the entire project.

Follow this phased approach:

### Phase 1 — Discovery

Inspect the current `DULCERIA-CAR` folder.

Identify:

* Current framework.
* Frontend files.
* Backend/server files.
* API routes.
* Database or storage usage.
* Hardcoded configuration.
* Replit-specific files.
* Build scripts.
* Runtime assumptions.
* Environment variables.
* Existing functionality.

Output a concise findings summary before making major changes.

---

### Phase 2 — Cleanup Plan

Propose a cleanup plan including:

* Files to keep.
* Files to delete.
* Files to move.
* Dependencies to remove.
* Dependencies to add.
* Project structure recommendation.
* Risks or unknowns.

Do not delete large parts of the project without explaining why.

---

### Phase 3 — New Structure

Create or refactor into a clean structure.

Recommended default:

```text
DULCERIA-CAR/
  frontend/
    src/
    public/
    package.json
  backend/
    src/
    package.json
  README.md
  AGENTS.md
  .gitignore
```

Alternative structures are allowed if better suited to the existing code.

---

### Phase 4 — Local Development

Ensure the project can run locally.

Add or update scripts such as:

```text
npm install
npm run dev
npm run build
npm run start
```

If using separate frontend/backend:

```text
cd backend && npm run dev
cd frontend && npm run dev
```

Document how to run both.

---

### Phase 5 — Database Configuration

Design and implement database-backed configuration.

Suggested table concept:

```text
app_config
- id
- key
- value
- value_type
- is_public
- description
- created_at
- updated_at
```

Alternative schema is acceptable if the existing app requires a different structure.

The configuration system should support:

* Reading public config for the frontend.
* Reading private/admin config only for admins.
* Updating config from the admin UI.
* Seeding default values.
* Validation by type.

---

### Phase 6 — Admin Area

Implement protected admin functionality.

Suggested routes:

```text
/admin/login
/admin
/admin/config
```

Suggested backend endpoints:

```text
POST /api/admin/login
GET /api/admin/config
PUT /api/admin/config/:key
GET /api/public/config
```

Adjust route names depending on the chosen framework.

---

### Phase 7 — Railway Deployment

Prepare Railway deployment.

Include:

* Build commands.
* Start commands.
* Required environment variables.
* Database connection instructions.
* Health check endpoint if backend exists.
* Production-ready CORS configuration.
* Frontend/backend URL configuration.

If monorepo is used, document how Railway should deploy each service.

Example Railway services:

```text
dulceriacar-frontend
dulceriacar-backend
dulceriacar-db
```

---

### Phase 8 — GitHub Preparation

Prepare repository for GitHub.

Checklist:

* Confirm `.gitignore`.
* Remove secrets.
* Add `.env.example`.
* Add `README.md`.
* Add setup instructions.
* Add deployment instructions.
* Add basic project description.
* Ensure the repository name is documented as `DulceriaCar`.

Do not attempt to push to GitHub unless explicitly instructed.

---

## Coding Standards

Cursor should follow these rules:

* Prefer simple, maintainable code.
* Avoid unnecessary abstractions.
* Do not introduce complex frameworks without justification.
* Keep mobile-first UX in mind.
* Use clear naming.
* Add comments only where useful.
* Validate inputs.
* Handle loading, empty, success, and error states.
* Keep public and admin concerns separated.
* Avoid hardcoded business configuration when it belongs in the database.

---

## UI Guidelines

The user-facing site should be:

* Mobile-first.
* Fast.
* Clean.
* Easy to navigate.
* Touch-friendly.
* Suitable for customers browsing from a phone.

Admin pages should be:

* Simple.
* Functional.
* Clear.
* Not over-designed.
* Easy to use from desktop or mobile.

Avoid designing this as a native mobile app.

---

## Do Not Do

Do not:

* Convert the project into a native mobile app.
* Introduce Capacitor, React Native, Flutter, or Expo.
* Delete existing functionality without approval.
* Hardcode configurable business values.
* Commit secrets.
* Assume the Replit export is production-ready.
* Skip local run instructions.
* Skip Railway deployment considerations.
* Over-engineer authentication or permissions for the first version.
* Make major architectural decisions before inspecting the current files.

---

## Expected Cursor Workflow

When starting work, Cursor should first respond with:

1. A summary of what it found in the current project.
2. The detected stack.
3. The existing functionality.
4. Replit-specific files or assumptions.
5. Recommended target architecture.
6. Proposed migration phases.
7. Any questions that are truly blocking.

Cursor should avoid asking unnecessary questions. If a decision can be reasonably made from the codebase, make a recommendation and continue.

---

## Initial Prompt for Cursor

Use this prompt to start:

```text
You are working inside the DULCERIA-CAR folder, which has already been added to this Cursor workspace.

This project was exported from Replit. I want to clean it up and rebuild it into a maintainable mobile-first web application, not a native mobile app.

Please inspect the current files first. Identify the existing stack, current functionality, Replit-specific files, hardcoded configuration, backend/frontend structure, and any deployment assumptions.

The target project should be prepared for a GitHub repository named DulceriaCar and deployed on Railway, including frontend, backend, and database.

Important requirement: application configuration parameters that are currently hardcoded or should be editable must be stored in a database and managed through an authenticated admin user. The admin should be able to view and edit configuration values.

Please do not rewrite everything immediately. First give me:
1. A concise findings summary.
2. Recommended target architecture.
3. Cleanup plan.
4. Database/configuration plan.
5. Admin area plan.
6. Railway deployment plan.
7. Step-by-step implementation plan.

Remember: this is a mobile-first responsive web app, not a native mobile application.
```

---

## Definition of Done

The project cleanup and migration should be considered complete when:

* The app runs locally.
* Existing Replit functionality is preserved.
* Replit-specific unnecessary files are removed.
* The project has a clean structure.
* The app is mobile-first responsive.
* Configuration values are stored in the database.
* Admin user can log in and modify configuration.
* Public frontend can read necessary public configuration.
* Private config is not exposed publicly.
* Database migrations or setup scripts exist.
* `.env.example` exists.
* `README.md` explains setup and deployment.
* The project is ready to be pushed to GitHub as `DulceriaCar`.
* The project is ready to deploy on Railway.
