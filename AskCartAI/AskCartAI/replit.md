# AskCart AI - Smart E-commerce Assistant

## Overview

AskCart AI is an intelligent e-commerce shopping assistant that provides personalized product recommendations, comparisons, and customer support through an interactive chat widget. The system is built as a full-stack web application with real-time chat capabilities, AI-powered responses using Google's Gemini AI, and comprehensive admin dashboard for analytics and configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Component-based UI using React 18 with full TypeScript support
- **Shadcn/ui + Tailwind CSS**: Design system using Radix UI primitives with Tailwind for styling
- **Vite**: Build tool and development server for fast development and optimized production builds
- **TanStack Query**: Server state management for API calls and caching
- **Wouter**: Lightweight client-side routing solution

### Backend Architecture
- **Express.js + TypeScript**: RESTful API server with WebSocket support for real-time chat
- **WebSocket Server**: Real-time bidirectional communication for chat functionality
- **Drizzle ORM**: Type-safe database queries and schema management
- **Session Management**: Using connect-pg-simple for PostgreSQL-backed session storage

### Database Design
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Core Tables**:
  - `users`: User authentication and profiles
  - `products`: Product catalog with specifications and metadata
  - `conversations`: Chat session tracking
  - `messages`: Individual chat messages with AI metadata
  - `widget_configs`: Customizable widget settings per store
  - `analytics`: Performance metrics and user behavior tracking

### AI Integration
- **Google Gemini AI**: Primary AI model for generating contextual responses
- **Product Recommendations**: AI-driven suggestions based on user queries and behavior
- **Intent Recognition**: Understanding user needs for targeted assistance
- **Review Synthesis**: AI-powered analysis and summarization of product reviews

### Real-time Communication
- **WebSocket Architecture**: Persistent connections for instant messaging
- **Session Management**: Unique session tracking across widget interactions
- **Message Queuing**: Handling multiple concurrent chat sessions

### Widget System
- **Embeddable Widget**: Customizable chat widget for integration into any e-commerce site
- **Dynamic Configuration**: Per-store customization of colors, positioning, and behavior
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Auto-open Logic**: Intelligent timing for proactive customer engagement

### Admin Dashboard
- **Analytics Overview**: Real-time metrics on conversations, conversions, and performance
- **Widget Configuration**: Visual customization tools for widget appearance and behavior
- **Conversation Management**: Live monitoring and intervention capabilities
- **Integration Tools**: Code generation for easy website embedding

## External Dependencies

### Third-party Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Gemini AI**: Generative AI service for chat responses and recommendations
- **Replit Platform**: Development and hosting environment with specialized plugins

### Key Libraries
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Form Handling**: React Hook Form with Zod validation schemas
- **Data Fetching**: TanStack Query for server state management
- **Real-time**: Native WebSocket API with custom connection management
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tools**: Vite with TypeScript support and development optimizations

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Fast bundling for production server builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer