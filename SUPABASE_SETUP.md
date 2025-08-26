# Supabase Migration Guide

This guide helps you migrate your Genealogy AI application from a local PostgreSQL database to Supabase.

## Prerequisites

- Node.js 18+ installed
- Existing Genealogy AI application
- Supabase account

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new account or sign in
2. Click "New Project" 
3. Choose your organization
4. Enter project details:
   - **Name**: `genealogy-ai`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
5. Click "Create new project" and wait for setup to complete

## Step 2: Get Supabase Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
3. Go to **Settings** → **API**
4. Copy your:
   - **Project URL** (`https://[PROJECT-REF].supabase.co`)
   - **anon public** key
   - **service_role** key

## Step 3: Update Environment Variables

Update your `.env` file with the Supabase credentials:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

Replace the placeholders:
- `[YOUR-PASSWORD]`: Your database password
- `[PROJECT-REF]`: Your project reference (e.g., `abcdefghijklmnop`)
- `[YOUR-ANON-KEY]`: Your anon public key
- `[YOUR-SERVICE-ROLE-KEY]`: Your service role key

## Step 4: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 5: Set Up Supabase

Run the setup script to configure storage buckets and extensions:

```bash
npm run supabase:setup
```

This script will:
- Test the Supabase connection
- Enable required PostgreSQL extensions
- Create storage buckets for documents and photos
- Set up initial configuration

## Step 6: Push Database Schema

Push your Prisma schema to Supabase:

```bash
npm run db:push
```

This will create all your tables in Supabase based on your Prisma schema.

## Step 7: Migrate Existing Data (Optional)

If you have existing data in a local database, you can migrate it:

1. Set your old database URL as `OLD_DATABASE_URL` in `.env`:
   ```env
   OLD_DATABASE_URL="postgresql://user:password@localhost:5432/genealogyai"
   ```

2. Run the migration script:
   ```bash
   npm run supabase:migrate
   ```

This will copy all your existing data to Supabase.

## Step 8: Test Your Application

1. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Test key functionality:
   - User registration and login
   - Document upload and analysis
   - Family tree creation
   - Photo management

## Step 9: Configure Storage (Optional)

If your app uses file uploads, configure storage buckets in Supabase:

1. Go to **Storage** in your Supabase dashboard
2. Verify the buckets were created:
   - `documents` (private)
   - `photos` (private)
   - `processed-images` (public)
3. Configure bucket policies if needed

## Step 10: Set Up Row Level Security (RLS)

Enable RLS for data security:

1. Go to **Authentication** → **Policies**
2. Enable RLS on tables that need user-level access control
3. Create policies for user data access

Example policies are included in the setup script.

## Troubleshooting

### Connection Issues

If you can't connect to Supabase:
1. Double-check your credentials in `.env`
2. Ensure your IP is not blocked (Supabase allows all IPs by default)
3. Verify the database password is correct

### Migration Errors

If data migration fails:
1. Check the migration logs for specific errors
2. Ensure your old database is accessible
3. Try migrating smaller batches of data

### Schema Issues

If `db:push` fails:
1. Check for conflicting table names
2. Ensure all required extensions are enabled
3. Review any foreign key constraints

### File Upload Issues

If file uploads don't work:
1. Verify storage buckets exist
2. Check bucket policies and permissions
3. Ensure your API keys have storage access

## Performance Optimization

### Connection Pooling

Supabase provides built-in connection pooling. For production, consider:
1. Using the connection pooling URL for better performance
2. Configuring connection limits in Prisma
3. Implementing query optimization

### Indexing

Add indexes for frequently queried fields:

```sql
-- Example indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_user_id ON documents("userId");
CREATE INDEX idx_family_trees_user_id ON family_trees("userId");
```

## Monitoring

Set up monitoring in Supabase:
1. **Database** → **Reports** for query performance
2. **Authentication** → **Users** for user activity
3. **Storage** → **Usage** for file storage metrics

## Backup Strategy

Supabase provides automatic backups, but consider:
1. Regular manual backups for critical data
2. Export important data periodically
3. Test backup restoration procedures

## Next Steps

1. **Production Deployment**: Update production environment variables
2. **Domain Configuration**: Set up custom domain if needed
3. **SSL/TLS**: Ensure HTTPS is properly configured
4. **Monitoring**: Set up application monitoring and alerts
5. **Security Review**: Review and update security policies

## Support

If you need help:
1. Check [Supabase Documentation](https://supabase.com/docs)
2. Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Review application logs for specific error messages

---

## Quick Reference

### Useful Commands

```bash
# Set up Supabase
npm run supabase:setup

# Push schema changes
npm run db:push

# Generate Prisma client
npm run db:generate

# Open database studio
npm run db:studio

# Migrate existing data
npm run supabase:migrate

# Check database
npm run db:migrate
```

### Important Environment Variables

```env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### File Structure

```
├── lib/
│   ├── prisma.ts          # Prisma client config
│   └── supabase.ts        # Supabase client config
├── scripts/
│   ├── setup-supabase.js  # Initial setup script
│   └── migrate-to-supabase.js  # Data migration script
├── prisma/
│   └── schema.prisma      # Database schema
└── .env                   # Environment variables
```