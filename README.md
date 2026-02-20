# 🤖 Quantum AI Model Marketplace

A comprehensive platform for publishing, discovering, and subscribing to Quantum AI models. Publishers can showcase their Quantum AI models with detailed documentation, pricing, and collaboration features, while buyers can browse, subscribe to, and download models.

## ✨ Features

### For Publishers
- **Model Management**: Create, edit, and publish Quantum AI models with rich descriptions
- **Collaboration**: Add collaborators to co-manage models
- **Analytics Dashboard**: Track views, subscribers, ratings, and revenue
- **File Management**: Upload model files or link external resources
- **API Documentation**: Provide comprehensive API specs in JSON, YAML, or Markdown
- **Real-time Notifications**: Get notified of subscriptions, ratings, and discussions

### For Buyers
- **Model Discovery**: Browse and search through published Quantum AI models
- **Subscription Management**: Subscribe to models and track active subscriptions
- **Ratings & Reviews**: Rate models and participate in discussions
- **Activity Tracking**: View your subscription and interaction history
- **Real-time Updates**: Receive notifications for model updates and replies

### Platform Features
- **Dual Role System**: Users can be both buyers and publishers
- **Real-time Notifications**: Powered by Supabase Realtime
- **Secure Authentication**: Google OAuth and email/password login
- **Row Level Security**: Database-level access control
- **MIMOS Brand Integration**: Custom themed UI with brand colors

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS v4** - Utility-first styling
- **Wouter** - Lightweight routing
- **TanStack Query** - Server state management
- **React Hook Form** - Form management
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **React Markdown** - Markdown rendering
- **React Syntax Highlighter** - Code syntax highlighting

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Google OAuth, Email/Password)
  - Row Level Security (RLS)
  - Realtime subscriptions
  - Storage (for file uploads)
- **Express.js** - Server-side API endpoints
- **Node.js** - Runtime environment

### Development Tools
- **ESBuild** - Fast bundler
- **TSX** - TypeScript execution
- **Cross-env** - Environment variables
- **Zod** - Schema validation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Supabase Account** - [Sign up free](https://supabase.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd AI-Marketplace
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

#### Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Quantum AI Marketplace
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for setup to complete

#### Run Database Setup Scripts

Once your project is ready:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run each SQL file from `supabase_database/` folder in order:

```sql
-- 1. Create tables and constraints
-- Copy and paste contents of: supabase_database/01_schema.sql
-- Click "Run"

-- 2. Create custom functions
-- Copy and paste contents of: supabase_database/02_functions.sql
-- Click "Run"

-- 3. Create triggers
-- Copy and paste contents of: supabase_database/03_triggers.sql
-- Click "Run"

-- 4. Enable Row Level Security
-- Copy and paste contents of: supabase_database/04_rls.sql
-- Click "Run"

-- 5. Create performance indexes
-- Copy and paste contents of: supabase_database/05_indexes.sql
-- Click "Run"

-- 6. Seed initial data (roles and categories)
-- Copy and paste contents of: supabase_database/06_seed.sql
-- Click "Run"

-- 7. Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

**✅ Verification**: After setup, run this query to verify:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
You should see 15+ tables listed.

#### Set Up Storage Bucket for Model Files

The Quantum AI Marketplace uses Supabase Storage for model file uploads. You need to create a storage bucket and configure access policies:

1. **Create Storage Bucket**:
   - In Supabase Dashboard, go to **Storage** (left sidebar)
   - Click **New Bucket**
   - Configure:
     - **Name**: `model-files`
     - **Public bucket**: ❌ **Keep disabled** (private bucket with controlled access)
     - **File size limit**: `52428800` (50 MB)
   - Click **Create bucket**

2. **Set Up Storage Policies** (Choose Method A or Method B):

   Storage policies control who can upload, download, and delete files. You need to create 3 policies total.

   ### Method A: Using SQL Editor (Recommended - Easier)

   1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
   2. Click **New Query**
   3. Copy and paste ALL THREE policy statements below into the editor
   4. Click **Run** (or press Ctrl+Enter)

   ```sql
   -- Policy 1: Allow owners and collaborators to upload
   CREATE POLICY "Allow owners and collaborators to upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'model-files' AND (
       (storage.foldername(name))[1] = auth.uid()::text
       OR
       EXISTS (
         SELECT 1
         FROM models m
         JOIN collaborators c ON c.model_id = m.id
         JOIN users u ON u.id = auth.uid()
         WHERE (storage.foldername(objects.name))[1] = m.publisher_id::text
           AND (storage.foldername(objects.name))[2] = m.id::text
           AND lower(c.email) = lower(u.email)
       )
     )
   );

   -- Policy 2: Allow owners, subscribers, and collaborators to download
   CREATE POLICY "Allow owners, subscribers, and collaborators to download"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'model-files' AND (
       (storage.foldername(name))[1] = auth.uid()::text
       OR
       EXISTS (
         SELECT 1
         FROM model_files mf
         JOIN subscriptions s ON s.model_id = mf.model_id
         WHERE mf.file_path = objects.name
           AND s.buyer_id = auth.uid()
           AND s.status = 'active'
       )
       OR
       EXISTS (
         SELECT 1
         FROM model_files mf
         JOIN collaborators c ON c.model_id = mf.model_id
         JOIN users u ON u.id = auth.uid()
         WHERE mf.file_path = objects.name
           AND lower(c.email) = lower(u.email)
       )
     )
   );

   -- Policy 3: Allow owners and collaborators to delete
   CREATE POLICY "Allow owners and collaborators to delete"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'model-files' AND (
       (storage.foldername(name))[1] = auth.uid()::text
       OR
       EXISTS (
         SELECT 1
         FROM model_files mf
         JOIN collaborators c ON c.model_id = mf.model_id
         JOIN users u ON u.id = auth.uid()
         WHERE mf.file_path = objects.name
           AND lower(c.email) = lower(u.email)
       )
     )
   );
   ```

   ✅ You should see "Success. No rows returned" for each policy.

   ---

   ### Method B: Using Storage UI (Alternative)

   If you prefer the UI, create each policy separately:

   #### Policy 1: Upload Policy

   1. Go to **Storage** → `model-files` bucket → **Policies** tab
   2. Click **New Policy**
   3. Click **For full customization**
   4. Fill in the form:

   **Policy name** field - paste:
   ```
   Allow owners and collaborators to upload
   ```

   **Allowed operation** dropdown - select:
   ```
   INSERT
   ```

   **Target roles** dropdown - select:
   ```
   authenticated
   ```

   **WITH CHECK** field - paste this EXACT code:
   ```sql
   bucket_id = 'model-files' AND (
     (storage.foldername(name))[1] = auth.uid()::text
     OR
     EXISTS (
       SELECT 1
       FROM models m
       JOIN collaborators c ON c.model_id = m.id
       JOIN users u ON u.id = auth.uid()
       WHERE (storage.foldername(objects.name))[1] = m.publisher_id::text
         AND (storage.foldername(objects.name))[2] = m.id::text
         AND lower(c.email) = lower(u.email)
     )
   )
   ```

   5. Click **Review** → **Save policy**

   #### Policy 2: Download Policy

   1. Click **New Policy** again
   2. Click **For full customization**
   3. Fill in the form:

   **Policy name** field - paste:
   ```
   Allow owners, subscribers, and collaborators to download
   ```

   **Allowed operation** dropdown - select:
   ```
   SELECT
   ```

   **Target roles** dropdown - select:
   ```
   authenticated
   ```

   **USING** field - paste this EXACT code:
   ```sql
   bucket_id = 'model-files' AND (
     (storage.foldername(name))[1] = auth.uid()::text
     OR
     EXISTS (
       SELECT 1
       FROM model_files mf
       JOIN subscriptions s ON s.model_id = mf.model_id
       WHERE mf.file_path = objects.name
         AND s.buyer_id = auth.uid()
         AND s.status = 'active'
     )
     OR
     EXISTS (
       SELECT 1
       FROM model_files mf
       JOIN collaborators c ON c.model_id = mf.model_id
       JOIN users u ON u.id = auth.uid()
       WHERE mf.file_path = objects.name
         AND lower(c.email) = lower(u.email)
     )
   )
   ```

   4. Click **Review** → **Save policy**

   #### Policy 3: Delete Policy

   1. Click **New Policy** again
   2. Click **For full customization**
   3. Fill in the form:

   **Policy name** field - paste:
   ```
   Allow owners and collaborators to delete
   ```

   **Allowed operation** dropdown - select:
   ```
   DELETE
   ```

   **Target roles** dropdown - select:
   ```
   authenticated
   ```

   **USING** field - paste this EXACT code:
   ```sql
   bucket_id = 'model-files' AND (
     (storage.foldername(name))[1] = auth.uid()::text
     OR
     EXISTS (
       SELECT 1
       FROM model_files mf
       JOIN collaborators c ON c.model_id = mf.model_id
       JOIN users u ON u.id = auth.uid()
       WHERE mf.file_path = objects.name
         AND lower(c.email) = lower(u.email)
     )
   )
   ```

   4. Click **Review** → **Save policy**

   ---

3. **Verify Storage Setup**:

   Go to **SQL Editor** and run:
   ```sql
   -- Check bucket exists
   SELECT id, name, public, file_size_limit
   FROM storage.buckets
   WHERE name = 'model-files';

   -- Check policies are active (should return 3 policies)
   SELECT policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'storage'
     AND tablename = 'objects'
     AND policyname LIKE '%model-files%'
   ORDER BY policyname;
   ```

   Expected results:
   - ✅ Bucket `model-files` exists with `public = false`
   - ✅ Three policies: INSERT, SELECT, DELETE

### 4. Configure Environment Variables

1. Copy the example environment file by running this command in your terminal at your project's root directory:
```bash
cp .env.example .env.local
```

2. Get your Supabase credentials:
   - Go to your Supabase project dashboard
   - Click **Project Settings** in the left sidebar
   - Click **Data API** → Copy the **Project URL**
   - Click **API Keys** → Under "Legacy anon, service_role API keys":
     - Copy the **anon public** key
     - Copy the **service_role** key

3. Update `.env.local` with your values:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 5. Configure Authentication

#### Enable Google OAuth (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Sign In / Providers**
2. Find **Google** and click "Enable"
3. Follow the instructions to set up Google OAuth:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
   - Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

#### Enable Email Auth

1. In Supabase Dashboard, go to **Authentication** → **Sign In / Providers**
2. **Email** should be enabled by default
3. Configure email templates if needed under **Authentication** → **Email Templates**

### 6. Run the Application

#### Development Mode

Run the server using the following command:

```bash
# Terminal: Start server
npm run dev
```

The application will be available at: http://localhost:5000

#### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📱 Using the Application

### First-Time Setup

1. **Create an Account**:
   - Go to http://localhost:5000
   - Click "Sign In"
   - Sign up with Google or email/password
   - Choose your role (Buyer, Publisher, or Both)

2. **As a Publisher**:
   - Go to "My Models" from the sidebar
   - Click "Create New Model"
   - Fill in model details:
     - Basic info (name, description, version)
     - Technical details (accuracy, response time)
     - Categories
     - Pricing (free or paid)
     - API documentation (supports JSON, YAML, Markdown)
     - Upload files or add external URLs
   - Click "Save as Draft" or "Publish"

3. **As a Buyer**:
   - Browse the Marketplace
   - Use filters to find models (category, price, search)
   - Click on a model to view details
   - Click "Subscribe" to access the model
   - View your subscriptions in "My Subscriptions"

### Key Features to Try

- **Rate Models**: Give 1-5 star ratings on model detail pages
- **Discussions**: Start conversations and reply to comments
- **Notifications**: Real-time updates in the notification center (bell icon)
- **Collaboration**: Publishers can add collaborators to manage models together
- **Analytics**: Publishers can view detailed stats on their dashboard
- **Activity Log**: Track all your actions in the dashboard

## 🐛 Troubleshooting

### Build Errors

**Problem**: TypeScript or build errors

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run clean  # (if you add this script)
```

## 📝 Available Scripts

```bash
# Development (Recommended)
npm run dev              # Start full-stack server (frontend + backend on port 5000)
npm run dev:client       # [Alternative] Start only Vite frontend dev server

# Build
npm run build            # Build for production
npm run check            # TypeScript type checking

# Production
npm start                # Start production server
```
**Note**: You only need `npm run dev` for development. It runs the Express server with integrated Vite middleware, serving both frontend and backend on port 5000.

---

Made with ❤️ for MIMOS Berhad