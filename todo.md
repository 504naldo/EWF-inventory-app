# Inventory App TODO

- [x] Database schema: inventory_items table with all fields
- [x] Database schema: profiles table for user roles
- [x] RLS-style logic: admin full access, tech quantity-only updates
- [x] Login page with email/password auth
- [x] Inventory page with category tabs
- [x] Search functionality for product code and description
- [x] Table display with all columns including calculated Value
- [x] Quick quantity buttons (-1, +1, +5) for both roles
- [x] Add/Edit modal (admin only)
- [x] Delete functionality (admin only)
- [x] Low stock highlight (quantity <= 2)
- [x] Seed data for 10 sample items

## Branding Updates
- [x] Extract and save Earth Wind and Fire logo assets
- [x] Create favicon from three-square mark
- [x] Add logo to inventory page header (left side, clickable)
- [x] Add logo to login screen (centered above form)
- [x] Update color scheme based on logo colors
- [x] Apply clean industrial styling

## UI Updates
- [x] Change background to pure white

## Logo Updates
- [x] Re-extract logo with white background

- [x] Replace with correct logo file

## Responsive Redesign
- [x] Mobile view: card-based layout with large tap targets
- [x] Desktop view: table layout with category tabs
- [x] Mobile: dropdown or scrollable tabs for categories
- [x] Mobile: sticky header with search
- [x] Responsive breakpoints (mobile <=768px, desktop >=1024px)
- [x] Optimistic updates for quantity changes
- [x] PWA manifest and icons

## User Management
- [x] Admin management page to view and promote users
- [x] Backend endpoints for listing users and updating roles

## REST API for Mobile App
- [x] Add POST /api/auth/login endpoint
- [x] Add POST /api/auth/logout endpoint
- [x] Add GET /api/inventory endpoint with category and search filters
- [x] Add GET /api/inventory/:id endpoint
- [x] Add POST /api/inventory endpoint
- [x] Add PATCH /api/inventory/:id endpoint
- [x] Test all REST endpoints

## Authentication & API Documentation
- [x] Implement email/password authentication for mobile app
- [x] Create API documentation page
- [x] Update native mobile app with production API URL

- [x] Add GET /api/auth/me endpoint for mobile app
