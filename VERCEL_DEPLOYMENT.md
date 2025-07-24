# Vercel Deployment Guide for polarsou

## 🚀 Quick Fix for Vercel Deployment

If you're getting the "No Next.js version detected" error, follow these steps:

### Method 1: Manual Configuration (Recommended)

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import from GitHub: `TerenceTan/polarsou`

3. **Configure Build Settings**
   - **Framework Preset**: Select "Vite" (not Next.js)
   - **Root Directory**: `.` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_URL=https://your-app-name.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app

### Method 2: Using vercel.json (Already Included)

The repository now includes a `vercel.json` file that automatically configures:
- Framework detection as Vite
- Proper build commands
- SPA routing support
- Security headers
- Service worker caching

### Method 3: CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project directory
cd /path/to/polarsou

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: polarsou (or your preferred name)
# - Directory: ./ (current directory)
```

## 🔧 Troubleshooting Vercel Issues

### Issue 1: "No Next.js version detected"
**Solution**: Manually select "Vite" as the framework preset in Vercel dashboard

### Issue 2: Build fails with TypeScript errors
**Solution**: The build process will skip TypeScript errors automatically

### Issue 3: Environment variables not working
**Solution**: 
1. Go to Project Settings > Environment Variables
2. Add all required variables
3. Redeploy the project

### Issue 4: Social login not working
**Solution**:
1. Update Supabase Site URL to your Vercel domain
2. Add Vercel domain to OAuth redirect URLs
3. Ensure HTTPS is enabled (automatic on Vercel)

## 📋 Complete Deployment Checklist

### Before Deployment:
- [ ] GitHub repository is accessible
- [ ] Supabase project is set up
- [ ] OAuth credentials are configured (Google/Facebook)

### During Deployment:
- [ ] Select "Vite" as framework (not Next.js)
- [ ] Set build command to `npm run build`
- [ ] Set output directory to `dist`
- [ ] Add all environment variables
- [ ] Deploy and wait for build completion

### After Deployment:
- [ ] Update Supabase Site URL to Vercel domain
- [ ] Test social login functionality
- [ ] Test bill creation and splitting
- [ ] Verify PWA installation works
- [ ] Check mobile responsiveness

## 🌐 Alternative Deployment Options

### Option 1: Netlify
```bash
# Build the project
npm run build

# Drag and drop the 'dist' folder to Netlify
# Or connect GitHub repository
```

### Option 2: GitHub Pages
```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"homepage": "https://TerenceTan.github.io/polarsou",
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

### Option 3: Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

## 🔑 Environment Variables Setup

### Required Variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-app.vercel.app
```

### Optional Variables:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

## 📱 Post-Deployment Configuration

### 1. Supabase Settings
- **Site URL**: Update to your Vercel domain
- **Redirect URLs**: Add `https://your-app.vercel.app/**`

### 2. OAuth Configuration
- **Google**: Add Vercel domain to authorized origins
- **Facebook**: Add Vercel domain to app domains

### 3. Email Templates
- Update email templates with your Vercel domain
- Test confirmation and password reset emails

## 🎯 Performance Optimization

Vercel automatically provides:
- ✅ **Global CDN** - Fast loading worldwide
- ✅ **Automatic compression** - Gzip and Brotli
- ✅ **Image optimization** - Automatic WebP conversion
- ✅ **Edge caching** - Static assets cached globally
- ✅ **HTTPS** - SSL certificate included

## 📞 Support

If you encounter issues:

1. **Check Vercel Build Logs**
   - Go to your project dashboard
   - Click on the failed deployment
   - Review build logs for errors

2. **Verify Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Test Locally First**
   ```bash
   npm run build
   npm run preview
   ```

4. **Common Solutions**
   - Clear Vercel cache and redeploy
   - Check GitHub repository permissions
   - Verify Supabase configuration

## 🎉 Success!

Once deployed successfully:
- Your app will be live at `https://your-app.vercel.app`
- Automatic deployments on every GitHub push
- Global CDN for fast loading
- HTTPS enabled for social authentication
- PWA functionality working

**polarsou is now live and ready for Malaysian users!** 🇲🇾

