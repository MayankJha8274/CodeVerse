# 🚀 Setup Instructions

## MongoDB Setup (Choose One Option)

### Option 1: MongoDB Atlas (Cloud - EASIEST)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0 - Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace in `.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codeverse?retryWrites=true&w=majority
   ```
   (Replace username and password with your actual credentials)

### Option 2: MongoDB Local
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB runs on: mongodb://localhost:27017
4. Your `.env` is already configured for this!

---

## 🧪 Testing APIs with Postman

### Step 1: Download Postman
- Download from: https://www.postman.com/downloads/
- Or use Thunder Client extension in VS Code

### Step 2: Test Health Check
**Request:**
```
GET http://localhost:5000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-20T..."
}
```

---

### Step 3: Register a User
**Request:**
```
POST http://localhost:5000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "fullName": "Test User"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Test User",
      "avatar": null
    }
  }
}
```

**IMPORTANT:** Copy the `token` from response!

---

### Step 4: Login
**Request:**
```
POST http://localhost:5000/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

---

### Step 5: Get User Profile (Protected Route)
**Request:**
```
GET http://localhost:5000/api/auth/me
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with the token you copied from register/login response.

---

### Step 6: Update Profile
**Request:**
```
PUT http://localhost:5000/api/auth/profile
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "fullName": "Updated Name",
  "bio": "I am a coding enthusiast",
  "platforms": {
    "leetcode": "my_leetcode_username",
    "github": "my_github_username",
    "codeforces": "my_codeforces_handle"
  }
}
```

---

### Step 7: Update Password
**Request:**
```
PUT http://localhost:5000/api/auth/password
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

**Body (JSON):**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

---

## 📋 Quick Postman Setup Guide

### In Postman:
1. Create a new Collection called "CodeVerse API"
2. Add Environment Variables:
   - `base_url` = `http://localhost:5000`
   - `token` = (leave empty, will be set after login)
3. For each request:
   - Use `{{base_url}}/api/auth/register` instead of full URL
   - For protected routes, add header: `Authorization: Bearer {{token}}`
   - After login/register, manually copy token to environment variable

---

## 🐛 Common Errors & Solutions

### Error: "User already exists"
- Solution: Use a different email/username or login with existing credentials

### Error: "Not authorized, no token provided"
- Solution: Add `Authorization: Bearer YOUR_TOKEN` header

### Error: "Invalid credentials"
- Solution: Check email and password are correct

### Error: "MongoDB Connection Error"
- Solution: Make sure MongoDB is running (local) or connection string is correct (Atlas)

---

## ✅ What to Test:
1. ✅ Register new user
2. ✅ Login with created user
3. ✅ Get profile with token
4. ✅ Update profile
5. ✅ Update password

Once all tests pass, you're ready for Phase 2! 🚀
