# Firebase Setup Guide

## Enable Google Sign-In

To fix the `auth/configuration-not-found` error, you need to enable Google Sign-In in your Firebase Console:

### Steps:

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Select your project: `oscar-51ecf`

2. **Enable Google Authentication**
   - Navigate to **Authentication** in the left sidebar
   - Click on **Sign-in method** tab
   - Find **Google** in the list of providers
   - Click on it and toggle **Enable**
   - Enter your project support email (required)
   - Click **Save**

3. **Configure Authorized Domains** (if needed)
   - In the same Authentication section, go to **Settings** tab
   - Scroll to **Authorized domains**
   - Make sure your domain is listed (localhost is included by default for development)
   - For production, add your domain (e.g., `yourdomain.com`)

4. **Test the Configuration**
   - After enabling, try signing in again
   - The error should be resolved

### Additional Notes:

- The app will work offline with local storage even without authentication
- Progress sync to cloud requires authentication
- Google Sign-In is the only authentication method currently implemented

### Troubleshooting:

If you still see errors after enabling Google Sign-In:

1. **Check Firebase Project Settings**
   - Ensure your Firebase config in `src/lib/firebase/config.ts` matches your project
   - Verify the `projectId` is correct

2. **Check Browser Console**
   - Look for any additional error messages
   - Check network tab for failed requests

3. **Verify OAuth Consent Screen** (for production)
   - In Google Cloud Console, ensure OAuth consent screen is configured
   - This is usually done automatically by Firebase, but worth checking

