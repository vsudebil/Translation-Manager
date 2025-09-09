# Translation Manager Application

## Overview

A web-based translation management system that allows users to upload, organize, and edit translation files for internationalization. The application supports uploading ZIP files containing locale-specific JSON translation files, provides an interface for editing translations in real-time, and includes features for filtering, searching, and managing translation keys across multiple languages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod for validation

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for CRUD operations
- **File Processing**: Multer for file uploads and JSZip for ZIP file processing
- **Development**: Custom Vite integration for hot reloading in development

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Two main tables - translation_projects and translation_files
- **In-Memory Fallback**: MemStorage class for development/testing without database
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Key Design Patterns
- **Shared Schema**: Common TypeScript types and Zod schemas used across client and server
- **Modular Storage Interface**: IStorage interface allows switching between database and in-memory storage
- **Component Composition**: Reusable UI components following atomic design principles
- **Server-Side Processing**: ZIP file parsing and translation key extraction on the backend

### Project Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Common schemas and types
- `components/ui/` - Shadcn/ui component library
- `migrations/` - Database migration files

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database (@neondatabase/serverless)
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### UI and Styling
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with React plugin and custom error overlay
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast bundling for production builds

### File Processing
- **JSZip**: JavaScript library for reading and writing ZIP files
- **Multer**: Middleware for handling multipart/form-data file uploads

### State Management
- **TanStack React Query**: Data fetching and caching library
- **React Hook Form**: Performant forms with easy validation

### Additional Libraries
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **CLSX**: Utility for constructing className strings conditionally