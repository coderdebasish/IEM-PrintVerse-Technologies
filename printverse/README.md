# IEM PrintVerse Technologies 🚀

An industrial-grade, end-to-end e-commerce and automated 3D printing quotation platform. Built using **Next.js 16 (Turbopack)**, **Tailwind CSS v4**, **Supabase**, and **Razorpay**, PrintVerse allows users to upload 3D models (STL files), get instant price estimations based on custom printer/material parameters, place orders securely, and track manufacturing progress in real-time.

---

## 🌟 Core Features

- **Automated STL File Parser & Estimation**: Client-side parsing of binary and ASCII STL files to calculate model volume, dimensions (X, Y, Z), and surface area, yielding instant manufacturing cost estimation.
- **Dynamic 3D Visualization**: Built-in 3D viewer for uploaded models so users can inspect their designs before placing an order.
- **Secure Payment Gateway**: Fully integrated with **Razorpay** checkout workflows and robust serverless webhook verification.
- **Real-Time Order Tracking**: Interactive step-by-step progress tracking for customers from submission, manufacturing, to packaging and dispatch.
- **Product Catalog & Cart**: A complete e-commerce storefront showcasing standard pre-printed products and components with integrated payment routes.
- **Advanced Admin Management Portal**:
  - Comprehensive dashboard showing order volumes, sales charts, and recent activity.
  - Granular control over order status (Pending, Slicing, Manufacturing, Completed, Dispatched).
  - Dynamic printer settings configuration (adjusting filament cost/g, printer rate/hour, markup, shipping thresholds).
  - One-click PDF Invoice generation powered by `@react-pdf/renderer`.
- **Row-Level Security (RLS)**: Secure Postgres queries using Supabase RLS policies and JWT auth middleware.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.10 (App Router, Turbopack)
- **Frontend Core**: React 19, TypeScript, Tailwind CSS v4
- **State & Form Validation**: React Hook Form, Zod
- **Database & Storage**: Supabase (PostgreSQL, Storage Buckets, Auth)
- **Payment Processing**: Razorpay API & Webhooks
- **Transactional Emails**: Resend API
- **Document Rendering**: `@react-pdf/renderer` (Server-side & client-side PDF invoices)
- **Icons**: Lucide React

---

## 📂 Project Structure

```text
printverse/
├── src/
│   ├── app/                      # Next.js App Router Pages & API Routes
│   │   ├── (admin-auth)/         # Admin Authentication Group
│   │   ├── (public)/             # Public Pages (Quote, Track, Catalog)
│   │   ├── admin/                # Admin Panel Routes
│   │   ├── api/                  # Serverless API routes (Webhooks, Invoice/STL URLs)
│   │   ├── layout.tsx            # Global layout wrapper
│   │   └── page.tsx              # Root index router (redirects to /home)
│   ├── components/               # Shared & Page-specific UI Components
│   │   ├── admin/                # Sidebar, Charts, Order Cards
│   │   ├── public/               # Quote Forms, Catalog Items, 3D STL Viewer
│   │   └── ui/                   # Core reusable UI atoms
│   ├── lib/                      # Helper modules and clients
│   │   ├── email.ts              # Resend email templates & handlers
│   │   ├── supabase/             # Supabase clients (Anon, SSR, Service Role)
│   │   └── utils.ts              # Shared helpers (class names, calculations)
│   ├── types/                    # Global TypeScript interfaces
│   └── proxy.ts                  # Next.js Request Interceptor (Auth & Redirect Guard)
├── public/                       # Static Assets & SVGs
├── supabase_migration.sql        # Database Migrations & Postgres Policies
├── tsconfig.json                 # TypeScript Configuration
├── next.config.ts                # Next.js Build Configuration
└── package.json                  # Dependencies & Build Scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20.x` or higher
- npm (Node Package Manager)
- A Supabase Project
- A Razorpay Account (API keys)
- A Resend Account (API key)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/coderdebasish/IEM-PrintVerse-Technologies.git

# Navigate to project folder
cd IEM-PrintVerse-Technologies/printverse

# Install dependencies
npm install
```

### 2. Environment Variables Setup
Create a `.env.local` file in the `printverse/` directory and populate it with the following parameters:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay Keys
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Resend Email Config
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=onboarding@resend.dev # Or your verified domain email
ADMIN_EMAIL=your-admin-email@example.com

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=918101206698
```

### 3. Database Migration
Apply the database schema, stored procedures, triggers, and RLS policies from [supabase_migration.sql](./supabase_migration.sql) directly in your Supabase SQL Editor.

Ensure you create the following **Storage Buckets** in Supabase with RLS enabled:
- `product-images` (Public read, authenticated write)
- `invoices` (Private, restricted to service role reads/writes)
- `stl-files` (Private, restricted to service role reads/writes)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application locally.

---

## ⚡ Deployment (Vercel)

The easiest way to deploy this application is using **Vercel**:

1. Import your repository into the Vercel Dashboard.
2. In the project setup, set the **Root Directory** to `printverse`.
3. Verify that the **Framework Preset** is auto-detected as **Next.js**.
4. In the **Environment Variables** section, add all keys from your `.env.local` file.
5. Click **Deploy**.

---

## 📄 License
This project is proprietary. All rights reserved. Built for IEM PrintVerse Technologies.
