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
- **State Management**: Local component state and localStorage for persistence
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod for validation
- **File Processing**: Client-side ZIP file processing using JSZip
- **Data Storage**: Browser localStorage for project and translation data
- **Table Virtualization**: TanStack Virtual for efficient rendering of large datasets

### Key Design Patterns
- **Client-Side Processing**: All ZIP file parsing and translation management done in the browser
- **Component Composition**: Reusable UI components following atomic design principles
- **Virtualized Rendering**: Efficient handling of large translation datasets using virtual scrolling
- **Local Storage Persistence**: Browser localStorage for maintaining project state between sessions

### Project Structure
- `client/` - React frontend application (main application)
- `shared/` - Common TypeScript interfaces and types
- `components/ui/` - Shadcn/ui component library

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with React plugin and custom error overlay
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast bundling for production builds

### File Processing
- **JSZip**: JavaScript library for reading and writing ZIP files in the browser

### Virtual Scrolling
- **TanStack Virtual**: High-performance virtualization for large lists and tables

### State Management
- **React Hook Form**: Performant forms with easy validation
- **Browser localStorage**: Client-side persistence for translation projects

### Additional Libraries
- **Date-fns**: Date manipulation and formatting
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **CLSX**: Utility for constructing className strings conditionally