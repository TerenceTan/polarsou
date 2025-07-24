# Supabase Setup Instructions

## Step 1: Database Schema Setup

1. **Go to your Supabase Dashboard**
   - Navigate to your project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Database Migration**
   - Copy the entire SQL script from `database/migrations/001_initial_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `users`
     - `sessions`
     - `participants`
     - `bill_items`
     - `bill_item_participants`
     - `payment_methods`

## Step 2: Get Your Credentials

1. **Navigate to Project Settings**
   - Click on "Settings" in the left sidebar
   - Click on "API" in the settings menu

2. **Copy Your Credentials**
   - **Project URL**: Copy the URL (looks like `https://your-project-id.supabase.co`)
   - **Anon Key**: Copy the `anon` `public` key (this is safe to use in frontend)

## Step 3: Configure Your Local Environment

1. **Create Environment File**
   - In your project root, create a file named `.env.local`
   - Add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. **Restart Your Development Server**
   - Stop the current dev server (Ctrl+C)
   - Run `pnpm run dev --host` again
   - The app will now use Supabase instead of localStorage

## Step 4: Test the Connection

1. **Check Browser Console**
   - Open your app in the browser
   - Open Developer Tools (F12)
   - Look for a console message saying "Using Supabase for data persistence"

2. **Test Session Creation**
   - Try creating a new bill session
   - Check your Supabase dashboard → Table Editor → sessions table
   - You should see the new session appear

## Step 5: Enable Authentication (Optional)

If you want to enable user authentication:

1. **Go to Authentication Settings**
   - Click "Authentication" in the left sidebar
   - Click "Settings" tab

2. **Configure Providers**
   - Enable Email authentication
   - Optionally enable Google, GitHub, etc.

3. **Set Site URL**
   - Add your development URL: `http://localhost:3000`
   - For production, add your deployed URL

## Troubleshooting

### Common Issues:

1. **"relation does not exist" error**
   - Make sure you ran the complete SQL migration script
   - Check that all tables were created in Table Editor

2. **RLS Policy errors**
   - The migration script includes Row Level Security policies
   - For development, you can temporarily disable RLS on tables if needed

3. **CORS errors**
   - Make sure your site URL is configured in Authentication settings

4. **Environment variables not loading**
   - Make sure the file is named `.env.local` (not `.env`)
   - Restart your development server after creating the file

### Verification Checklist:

- [ ] All 6 tables created successfully
- [ ] Environment variables configured
- [ ] Development server restarted
- [ ] Console shows "Using Supabase for data persistence"
- [ ] Can create and view sessions in Supabase dashboard

## Security Notes

- The `anon` key is safe to use in frontend applications
- Never share your `service_role` key publicly
- Row Level Security (RLS) is enabled to protect data
- Anonymous sessions are supported for users without accounts

## Next Steps

Once Supabase is configured:
1. Test creating sessions and adding participants
2. Verify data appears in your Supabase dashboard
3. Test the bill calculation functionality
4. Add payment methods and test the complete flow

