# Firebase Deployment Guide

## Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Verify Firebase project**:
   ```bash
   firebase projects:list
   ```
   Make sure `oscar-51ecf` is in the list.

## Deployment Steps

### 1. Build the Application

```bash
npm run build
```

This will create a static export in the `out` directory.

### 2. Deploy to Firebase Hosting

**Option A: Deploy everything (build + deploy)**
```bash
npm run deploy
```

**Option B: Deploy only hosting (if already built)**
```bash
npm run deploy:hosting
```

**Option C: Manual deployment**
```bash
firebase deploy --only hosting
```

### 3. Verify Deployment

After deployment, Firebase will provide you with a hosting URL like:
- `https://oscar-51ecf.web.app`
- `https://oscar-51ecf.firebaseapp.com`

## Configuration Files

- **firebase.json**: Firebase Hosting configuration
- **.firebaserc**: Firebase project configuration
- **next.config.js**: Next.js configured for static export

## Important Notes

1. **Static Export**: The app is configured for static export, which means:
   - All pages are pre-rendered at build time
   - No server-side rendering at runtime
   - Client-side routing is handled by Next.js

2. **Environment Variables**: If you need environment variables:
   - For build-time: Use `NEXT_PUBLIC_*` prefix
   - They will be embedded in the build
   - Don't use server-side only variables

3. **Firebase Configuration**: 
   - Firebase config is in `src/lib/firebase/config.ts`
   - Make sure Google Sign-In is enabled in Firebase Console

4. **Custom Domain** (Optional):
   ```bash
   firebase hosting:channel:deploy preview
   ```
   Or set up a custom domain in Firebase Console under Hosting settings.

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check for TypeScript errors: `npm run lint`
- Verify Next.js version compatibility

### Deployment Errors
- Verify you're logged in: `firebase login`
- Check project ID matches: `firebase use oscar-51ecf`
- Ensure Firebase Hosting is enabled in Firebase Console

### Runtime Errors
- Check browser console for errors
- Verify Firebase configuration is correct
- Ensure all Firebase services (Auth, Firestore) are enabled

## Continuous Deployment (Optional)

You can set up GitHub Actions or similar CI/CD to automatically deploy on push:

1. Add Firebase token as GitHub secret
2. Create `.github/workflows/deploy.yml`
3. Configure to run on push to main branch

## Rollback

If you need to rollback to a previous version:
```bash
firebase hosting:clone SOURCE_SITE_ID:TARGET_SITE_ID
```

Or use the Firebase Console to rollback to a previous deployment.

