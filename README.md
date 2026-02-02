# UniEasy

A work-in-progress academic front-end prototype for helping university students explore campus-adjacent services (food, accommodation, study zones, essentials, and nearby places).

## Problem Statement

Students who are new to a campus often struggle to quickly identify trusted and convenient nearby options for daily needs (food, stay, study-friendly locations, and essential services). Information is usually scattered across maps, social media, and word-of-mouth.

## Project Objective

To build a single, student-friendly web interface that organizes common campus-area needs into clear categories and presents listings and details in a simple, mobile-friendly UI.

## Current Development Status

- Front-end UI and navigation are implemented using client-side routing.
- Pages currently use mock/static data and demo UI flows.
- No backend, database, or real authentication is connected yet.

## Implemented Components

Based on the current source code, the following is implemented:

- **Routing & Pages (React Router)**
	- Landing page with primary calls-to-action (Get Started / Explore as Guest)
	- Home page with hero, category cards, highlights, and informational sections
	- Category detail pages: Food, Accommodation, Explore Nearby, Study Zones, Essentials (currently mock data)
	- Profile page (placeholder user information and UI sections)
	- Contact form page (simulated submission with toast notification)
	- Terms of Service and Privacy Policy pages (static content)
	- Not Found (404) page

- **Signup Flow (2 steps)**
	- Step 1: basic information + password rules
	- Step 2: university details + terms agreement
	- Client-side validation is implemented; navigation between steps uses session storage
	- Account creation is currently simulated (no persistence)

- **Merchant Portal (UI prototype)**
	- Merchant login/register UI (navigation-only)
	- Advertisement dashboard with image upload preview (client-side FileReader), form entry, and “submitted” success state
	- No real merchant authentication, approval workflow, or storage is connected

- **UI/UX Utilities**
	- Light/Dark theme toggle with persistence via local storage
	- Toast notifications
	- Reusable UI components (button/input/checkbox/etc.) using a component library pattern

## Planned Features / Future Scope

The following items are planned and will be implemented in later iterations:

- Backend integration for listings, search, and filtering (replacing mock data)
- Database-backed storage for users, merchants, advertisements, and listings
- Real authentication and role-based access (student/merchant/admin)
- Reviews/ratings submission and moderation
- Admin tools for content verification and advertisement approvals
- API-driven state management and caching (current data fetching is not wired)
- Improved accessibility and automated test coverage

## Tech Stack

Derived from the current configuration and dependencies:

- **Frontend:** React 18, TypeScript
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS, tailwindcss-animate
- **UI Components:** Radix UI primitives + local reusable UI components
- **Forms & Validation:** React Hook Form, Zod (client-side validation)
- **Notifications:** Sonner + toast/toaster components
- **Build Tooling:** Vite (React SWC plugin)
- **Testing:** Vitest, Testing Library, JSDOM
- **Linting:** ESLint

## Local Setup Instructions

Prerequisites:

- Node.js (LTS recommended)
- npm

Steps:

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build
npm run preview
npm run lint
npm test
```

## Project Structure Overview

```text
public/                 Static assets
src/
	components/           Reusable app components (Header/Footer/sections)
		ui/                 Reusable UI primitives (button, input, etc.)
	hooks/                Custom React hooks (theme, toast helpers)
	lib/                  Shared utilities and validations
	pages/                Route-level pages/screens
	test/                 Vitest setup and sample test
	App.tsx               Route definitions and providers
	main.tsx              React entry point
```

## Academic Note

This project is developed as an academic web application prototype. The current submission focuses on UI structure, routing, and front-end validation flows; data persistence and backend integration are planned for subsequent phases.
