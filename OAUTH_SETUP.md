# TickTick OAuth Setup Guide

## Step 1: Register Your App

1. Go to [TickTick Developer Portal](https://developer.ticktick.com/)
2. Click "Manage Apps" in the top right corner
3. Login with your TickTick credentials
4. Click "+App Name" to create a new app
5. Enter an app name (required)
6. Set OAuth Redirect URL to `http://localhost:8000/callback` (or your preferred callback URL)
7. Save your **Client ID** and **Client Secret**

## Step 2: Get OAuth Tokens

### Manual Method (Browser)

1. **Authorization Request**: Open this URL in your browser (replace YOUR_CLIENT_ID):
   ```
   https://ticktick.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:8000/callback&response_type=code&scope=tasks:read tasks:write
   ```

2. **Grant Permission**: Click "Allow" to authorize your app

3. **Get Authorization Code**: You'll be redirected to your callback URL with a code parameter:
   ```
   http://localhost:8000/callback?code=AUTHORIZATION_CODE
   ```

4. **Exchange Code for Tokens**: Make a POST request to get access tokens:
   ```bash
   curl -X POST https://ticktick.com/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&code=AUTHORIZATION_CODE&grant_type=authorization_code&redirect_uri=http://localhost:8000/callback"
   ```

5. **Save Tokens**: Copy the `access_token` and `refresh_token` from the response

## Step 3: Configure Your .env File

Create a `.env` file with your tokens:

```env
TICKTICK_ACCESS_TOKEN=your_access_token_here
TICKTICK_REFRESH_TOKEN=your_refresh_token_here
TICKTICK_CLIENT_ID=your_client_id_here
TICKTICK_CLIENT_SECRET=your_client_secret_here
```

## OAuth Flow Details

- **Authorization URL**: `https://ticktick.com/oauth/authorize`
- **Token URL**: `https://ticktick.com/oauth/token`
- **Scopes**: `tasks:read tasks:write`
- **Token Type**: Bearer

## Security Notes

- Never share your Client Secret
- Store tokens securely
- Refresh tokens when they expire
- Use HTTPS in production