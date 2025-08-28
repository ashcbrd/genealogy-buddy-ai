# 👑 Admin Account Setup Guide

## Quick Setup

### Method 1: Using the Script (Recommended)

```bash
# Create an admin account
npx tsx scripts/create-admin.ts admin admin@yourcompany.com your-secure-password "Admin Name"

# List existing admin accounts
npx tsx scripts/create-admin.ts list
```

### Method 2: Using the API Endpoint
Once you have one admin account, you can create more via the admin panel:

```bash
curl -X POST http://localhost:3000/api/admin/create-account \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newadmin@company.com",
    "password": "secure-password",
    "name": "New Admin",
    "tier": "ADMIN"
  }'
```

## Admin Privileges

### Unlimited Access
✅ **Documents**: Unlimited  
✅ **DNA Analysis**: Unlimited  
✅ **Family Trees**: Unlimited  
✅ **Research Chat**: Unlimited  
✅ **Photo Analysis**: Unlimited  
✅ **GEDCOM Export**: Yes  
✅ **API Access**: Yes  
✅ **Priority Support**: Yes  

### Admin Panel Access
- **URL**: `http://localhost:3000/admin`
- **Features**: Full administrative dashboard
- **Permissions**: Create other admin accounts, view system stats

## Security Notes

1. **Strong Passwords**: Use secure passwords for admin accounts
2. **Email Verification**: Admin accounts are auto-verified
3. **Database Access**: Admin accounts are stored in the `User` table with `SubscriptionTier.ADMIN`
4. **Session Management**: Use NextAuth for secure authentication

## Verification

After creating an admin account, verify it works:

1. **Login**: Go to `http://localhost:3000/login`
2. **Admin Panel**: Access `http://localhost:3000/admin`  
3. **Test Tools**: Try any genealogy tool - should have unlimited access
4. **Usage Check**: Verify no limits are enforced

## Technical Details

### Database Schema
```sql
-- Admin users have tier = 'ADMIN'
SELECT u.email, u.name, s.tier 
FROM "User" u 
JOIN "Subscription" s ON u.id = s."userId" 
WHERE s.tier = 'ADMIN';
```

### Subscription Limits
```typescript
ADMIN: {
  documents: -1,    // unlimited
  dna: -1,          // unlimited  
  trees: -1,        // unlimited
  research: -1,     // unlimited
  photos: -1,       // unlimited
  gedcomExport: true,
  apiAccess: true,
  prioritySupport: true,
}
```

## Troubleshooting

### Script Issues
```bash
# If tsx is not installed
npm install -g tsx

# Check if database connection works
npx prisma db pull
```

### Access Issues
- Verify the user exists in database
- Check subscription tier is set to 'ADMIN'
- Clear browser cookies and retry login
- Check server logs for authentication errors

## First-Time Setup

If this is your first admin account:

```bash
# 1. Make sure database is up to date
npx prisma db push

# 2. Create your first admin account
npx tsx scripts/create-admin.ts admin your-email@domain.com your-password "Your Name"

# 3. Start the development server
npm run dev

# 4. Login at http://localhost:3000/login
# 5. Access admin panel at http://localhost:3000/admin
```

That's it! Your admin account now has unlimited access to all genealogy tools and admin features. 🎉