# 🗄️ Database Setup Guide

This folder contains all SQL scripts needed to recreate the AI Model Marketplace database in your Supabase project.

## 📋 Files Overview

| File | Purpose | Must Run? |
|------|---------|-----------|
| `01_schema.sql` | Create all tables and constraints | ✅ Required |
| `02_functions.sql` | Custom PostgreSQL functions | ✅ Required |
| `03_triggers.sql` | Automatic triggers | ✅ Required |
| `04_rls.sql` | Row Level Security policies | ✅ Required |
| `05_indexes.sql` | Performance indexes | ✅ Required |
| `06_seed.sql` | Initial data (roles, categories) | ✅ Required |

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to https://app.supabase.com/
2. Click "New Project"
3. Enter project details and create

### Step 2: Run SQL Scripts

Go to **SQL Editor** in your Supabase dashboard and run each file **in order**:

#### 1️⃣ Schema (Tables)
```sql
-- Copy all contents from: 01_schema.sql
-- Paste into SQL Editor
-- Click "Run"
```
✅ Creates: 15 tables with all columns, constraints, and relationships

#### 2️⃣ Functions
```sql
-- Copy all contents from: 02_functions.sql
-- Paste and Run
```
✅ Creates: 6 custom functions for authorization and utilities

#### 3️⃣ Triggers
```sql
-- Copy all contents from: 03_triggers.sql
-- Paste and Run
```
✅ Creates: 5 triggers for auto-updating timestamps

#### 4️⃣ RLS Policies
```sql
-- Copy all contents from: 04_rls.sql
-- Paste and Run
```
✅ Creates: 40+ security policies for data protection

#### 5️⃣ Indexes
```sql
-- Copy all contents from: 05_indexes.sql
-- Paste and Run
```
✅ Creates: 30+ indexes for query performance

#### 6️⃣ Seed Data
```sql
-- Copy all contents from: 06_seed.sql
-- Paste and Run
```
✅ Inserts: 2 roles (buyer, publisher) + 10 categories

#### 7️⃣ Enable Realtime
```sql
-- Type this directly in SQL Editor:
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```
✅ Enables: Real-time notifications subscription

### Step 3: Verify Setup

Run this verification query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected Result**: Should return 15 tables:
- categories
- collaborators
- comments
- discussions
- model_categories
- model_files
- models
- notifications
- ratings
- roles
- subscriptions
- user_activities
- user_roles
- users
- views

## 🔍 What Each Component Does

### Tables (01_schema.sql)
- **users**: User profiles
- **roles** + **user_roles**: Dual-role system (buyer/publisher)
- **models**: AI model listings
- **categories** + **model_categories**: Model categorization
- **collaborators**: Multi-user model management
- **subscriptions**: Buyer-model relationships
- **ratings**: 5-star rating system
- **discussions** + **comments**: Community features
- **notifications**: Real-time alerts
- **views**: Page view analytics
- **user_activities**: Activity tracking
- **model_files**: File management

### Functions (02_functions.sql)
1. `update_updated_at_column()` - Auto-update timestamps
2. `is_model_owner()` - Check model ownership
3. `is_collaborator_by_email()` - Check collaborator status
4. `create_user_with_role()` - User creation with role
5. `create_notification()` - Notification creation
6. `add_email_identity_to_user()` - Add password to Google accounts

### Triggers (03_triggers.sql)
- Auto-update `updated_at` on:
  - models
  - users
  - discussions
  - comments
  - ratings

### RLS Policies (04_rls.sql)
Security rules ensuring:
- Users see only their data
- Published models are public
- Draft models are private
- Collaborators have proper access
- Subscribers can access files
- Privacy for notifications and activities

### Indexes (05_indexes.sql)
Performance optimizations for:
- Foreign key lookups
- Common filter queries (status, dates)
- Search operations
- Join operations

### Seed Data (06_seed.sql)
Initial data:
- **Roles**: buyer, publisher
- **Categories**: NLP, Computer Vision, Speech Recognition, etc.

## ⚠️ Important Notes

### Do NOT Skip Files
- Files must be run in order (dependencies exist)
- Skipping files will cause errors in later steps

### RLS is Critical
- Never disable RLS without understanding impact
- RLS policies protect user data
- Application security depends on proper RLS

### Backup Before Changes
- Export existing data before modifications
- Use Supabase dashboard backup features

## 🐛 Troubleshooting

### "relation does not exist"
**Cause**: Skipped schema file or typo in table name
**Fix**: Run `01_schema.sql` again

### "function does not exist"
**Cause**: Functions not created
**Fix**: Run `02_functions.sql`

### "permission denied"
**Cause**: RLS blocking access
**Fix**: Check RLS policies or use service role key for testing

### "duplicate key value violates unique constraint"
**Cause**: Re-running seed data
**Fix**: Normal - seed uses `ON CONFLICT DO NOTHING`

## 📊 Database Stats

After complete setup:
- **Tables**: 15
- **Functions**: 6
- **Triggers**: 5
- **RLS Policies**: 40+
- **Indexes**: 30+
- **Foreign Keys**: 25+
- **Check Constraints**: 10+

## 🔐 Security Features

✅ Row Level Security enabled on all tables
✅ Foreign key constraints enforce referential integrity
✅ Check constraints validate data
✅ Unique constraints prevent duplicates
✅ Cascade deletes maintain data consistency
✅ Security definer functions for admin operations

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQL Tutorial**: https://www.postgresqltutorial.com/

---

Need help? Check the main `README.md` in the project root.
