# Keycloak Setup Guide

## Access Keycloak Admin Console

1. Open your browser and navigate to: http://localhost:8080
2. Click "Administration Console"
3. Login with:
   - **Username**: `admin`
   - **Password**: `admin`

---

## Create Realm for the Application

1. In the top-left corner, click the dropdown (currently shows "Master")
2. Click "Create Realm"
3. Enter:
   - **Realm name**: `evaluation-framework`
4. Click "Create"

---

## Create Client for NestJS Application

1. In the left sidebar, click "Clients"
2. Click "Create client"
3. **General Settings**:
   - **Client type**: `OpenID Connect`
   - **Client ID**: `nest-api`
   - Click "Next"
4. **Capability config**:
   - Enable: ✅ Client authentication
   - Enable: ✅ Authorization
   - Authentication flow:
     - ✅ Standard flow
     - ✅ Direct access grants
   - Click "Next"
5. **Login settings**:
   - **Root URL**: `http://localhost:3000`
   - **Home URL**: `http://localhost:3000`
   - **Valid redirect URIs**: `http://localhost:3000/api/v1/auth/callback`
   - **Valid post logout redirect URIs**: `http://localhost:3000`
   - **Web origins**: `http://localhost:3000`
   - Click "Save"

---

## Get Client Secret

1. After creating the client, click on the "Credentials" tab
2. Copy the **Client secret** value
3. Update your `.env` file:
   ```env
   KEYCLOAK_CLIENT_SECRET=<paste-the-client-secret-here>
   ```

---

## Create Test User

1. In the left sidebar, click "Users"
2. Click "Add user"
3. Enter:
   - **Username**: `testuser`
   - **Email**: `test@example.com`
   - **First name**: `Test`
   - **Last name**: `User`
   - **Email verified**: ✅ ON
4. Click "Create"
5. Go to the "Credentials" tab
6. Click "Set password"
7. Enter:
   - **Password**: `testpass123`
   - **Temporary**: ❌ OFF (turn this off so password doesn't need to be changed on first login)
8. Click "Save"

---

## Verify Configuration

Your `.env` file should now have:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/evaluation_framework?schema=public"

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=evaluation-framework
KEYCLOAK_CLIENT_ID=nest-api
KEYCLOAK_CLIENT_SECRET=<your-actual-client-secret>
KEYCLOAK_REDIRECT_URI=http://localhost:3000/api/v1/auth/callback

# JWT
ACCESS_TOKEN_SECRET=your-access-token-secret-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-in-production
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Application
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

---

## Test the OAuth Flow

Once you downgrade to Node.js 20 and start the application:

### 1. Start the Application
```bash
npm run start:dev
```

### 2. Initiate Login
```bash
curl http://localhost:3000/api/v1/auth/login
```

You should receive a response with an authorization URL:
```json
{
  "authorizationUrl": "http://localhost:8080/realms/evaluation-framework/protocol/openid-connect/auth?client_id=nest-api&..."
}
```

### 3. Manual Testing Flow

1. Copy the authorization URL from the response
2. Paste it in your browser
3. Login with:
   - **Username**: `testuser`
   - **Password**: `testpass123`
4. You'll be redirected to `http://localhost:3000/api/v1/auth/callback?code=...&state=...`
5. The application will exchange the code for tokens and create a session

### 4. Test Protected Endpoint

After successful authentication, you'll receive an access token. Use it to test:

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <your-access-token>"
```

You should receive your user information:
```json
{
  "id": "uuid...",
  "email": "test@example.com",
  "name": "Test User",
  "roles": ["USER"]
}
```

### 5. Test Token Refresh

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your-refresh-token>"}'
```

### 6. Test Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your-refresh-token>"}'
```

---

## Troubleshooting

### Issue: "Invalid redirect URI"
- Verify the redirect URI in Keycloak client settings matches exactly: `http://localhost:3000/api/v1/auth/callback`

### Issue: "Client not found"
- Verify `KEYCLOAK_CLIENT_ID` in `.env` matches the client ID in Keycloak (`nest-api`)
- Verify you're using the correct realm (`evaluation-framework`)

### Issue: "Invalid client secret"
- Copy the client secret again from Keycloak Admin Console → Clients → nest-api → Credentials
- Update `.env` file with the correct secret
- Restart the application

### Issue: "User not found" after successful Keycloak login
- This is expected on first login! The application automatically creates the user in the local database
- The user will be synchronized from Keycloak with their email, name, and Keycloak ID

---

## Database Verification

After successful authentication, verify the user was created:

```bash
docker exec evaluation-framework-db psql -U postgres -d evaluation_framework -c "SELECT id, email, name, keycloak_id FROM users;"
```

You should see the test user in the database!

---

## Next Steps

1. Configure additional OAuth scopes if needed
2. Set up role mappings in Keycloak
3. Implement role-based access control in your application
4. Add more test users or integrate with your organization's identity provider
5. Configure session expiration policies
6. Set up refresh token rotation policies

---

**Keycloak Admin Console**: http://localhost:8080
**Application Base URL**: http://localhost:3000
**API Base URL**: http://localhost:3000/api/v1
