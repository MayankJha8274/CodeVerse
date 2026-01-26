# OAuth Setup Guide

This guide will walk you through setting up Google and GitHub OAuth authentication for your CodeVerse application.

## Prerequisites

- Google account (for Google OAuth)
- GitHub account (for GitHub OAuth)
- Your application running on:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:5000`

---

## 1. Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top left) and select "New Project"
3. Enter project name: `CodeVerse` (or any name you prefer)
4. Click "Create"

### Step 2: Enable Google+ API

1. In the left sidebar, go to **APIs & Services > Library**
2. Search for "Google+ API"
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services > OAuth consent screen**
2. Select **External** user type
3. Click "Create"
4. Fill in the required fields:
   - **App name**: CodeVerse
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. Skip the "Scopes" section (click "Save and Continue")
7. Add test users (your email) if you're in testing mode
8. Click "Save and Continue"

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services > Credentials**
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Select **Web application** as application type
4. Fill in:
   - **Name**: CodeVerse Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:5000`
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback`
5. Click "Create"
6. **Copy your credentials** (you'll need these for .env):
   - Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - Client Secret

---

## 2. GitHub OAuth Setup

### Step 1: Register a New OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "OAuth Apps" in the left sidebar
3. Click "New OAuth App"

### Step 2: Fill in Application Details

1. Fill in the form:
   - **Application name**: CodeVerse
   - **Homepage URL**: `http://localhost:5173`
   - **Application description**: (Optional) Platform for aggregating coding stats
   - **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
2. Click "Register application"

### Step 3: Generate Client Secret

1. After registration, you'll see your **Client ID** on the page
2. Click "Generate a new client secret"
3. **Copy both the Client ID and Client Secret** immediately (you can't see the secret again!)

---

## 3. Configure Environment Variables

Now add the OAuth credentials to your backend `.env` file:

### Open your .env file

Navigate to: `CODEVERSE-PROJECT/backend/.env`

### Add these environment variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# URLs (keep these as is)
FRONTEND_URL=http://localhost:5173
```

**Replace** `your_google_client_id_here`, `your_google_client_secret_here`, etc. with your actual credentials.

### Complete .env example:

```env
# Server
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/codeverse

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production

# URLs
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678
 
# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12
```

---

## 4. Restart Your Backend Server

After updating the `.env` file:

1. Stop your backend server (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   cd backend
   npm run dev
   ```

---

## 5. Test OAuth Login

1. Open your browser to `http://localhost:5173`
2. Click on the "Login" button
3. Click "Continue with Google" or "Continue with GitHub"
4. You should be redirected to Google/GitHub for authentication
5. After successful authentication, you'll be redirected back to your dashboard

---

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch" error**
   - Make sure your redirect URIs in Google/GitHub exactly match:
     - Google: `http://localhost:5000/api/auth/google/callback`
     - GitHub: `http://localhost:5000/api/auth/github/callback`

2. **"Client ID not found" error**
   - Double-check your .env file has the correct Client IDs
   - Make sure you restarted the backend server after updating .env

3. **"Invalid client secret" error**
   - Regenerate the client secret and update your .env file
   - Make sure there are no extra spaces in your .env file

4. **OAuth consent screen shows "unverified app" warning**
   - This is normal in development mode
   - Click "Advanced" → "Go to CodeVerse (unsafe)" to continue
   - For production, you'll need to verify your app with Google

### Still having issues?

- Check backend console for error messages
- Ensure MongoDB is running
- Verify all environment variables are set correctly
- Make sure both frontend and backend are running on the correct ports

---

## Security Notes

- **Never commit your .env file** to version control (it's already in .gitignore)
- Use strong, random values for JWT_SECRET in production
- For production deployment, update:
  - Authorized origins/redirect URIs to your production domain
  - FRONTEND_URL in .env to your production frontend URL
  - OAuth app settings in Google Cloud Console and GitHub

---

## Next Steps

Once OAuth is working:
- Users can sign up and log in with Google or GitHub
- Link coding platform accounts (LeetCode, Codeforces, etc.) from the Platforms page
- Sync stats automatically
- Compare with friends in Rooms

Enjoy using CodeVerse! 🚀
