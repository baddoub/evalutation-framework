# Security Documentation

## Overview

This document outlines the security architecture, best practices, and known considerations for the Performance Evaluation Framework.

## Authentication & Authorization

### Authentication Flow

The application uses JWT (JSON Web Tokens) with a dual-token approach:

1. **Access Token** - Short-lived (15 minutes), used for API authentication
2. **Refresh Token** - Long-lived (7 days), used to obtain new access tokens

#### Token Storage

- **Access Token**: Sent in response body, stored in client memory/localStorage
- **Refresh Token**: Stored in HTTP-only, secure cookies (not accessible via JavaScript)

#### Login Flow

```
1. User submits credentials (POST /auth/login)
2. Server validates credentials
3. Server generates access_token + refresh_token
4. Refresh token set as HTTP-only cookie
5. Access token returned in response body
6. Client stores access token for API calls
```

#### Token Refresh Flow

```
1. Access token expires (15 minutes)
2. Client requests new token (POST /auth/refresh)
3. Server validates refresh token from cookie
4. Server generates new access_token + refresh_token pair
5. Old refresh token invalidated (token rotation)
6. New tokens issued to client
```

### Authorization Model

The system implements Role-Based Access Control (RBAC) with four roles:

#### USER (Default Role)
- Complete self-reviews
- Nominate peer reviewers
- Provide peer feedback
- View own final scores

#### MANAGER
- All USER permissions
- View team member reviews
- Submit manager evaluations
- View team final scores
- Mark feedback as delivered
- Request score adjustments post-calibration

#### CALIBRATOR
- Participate in calibration sessions
- View calibration dashboard
- Apply score adjustments during calibration

#### HR_ADMIN
- All permissions
- Create and manage review cycles
- Lock/unlock final scores
- Approve/reject score adjustment requests
- Full system administration

### Authorization Guards

All performance review endpoints are protected by two guards:

1. **JwtAuthGuard** - Validates JWT token and extracts user info
2. **ReviewAuthorizationGuard** - Checks role-based permissions

Example:
```typescript
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@RequiresReviewRole('MANAGER')
async getTeamReviews() { ... }
```

## Input Validation

### DTO Validation

All request payloads are validated using `class-validator` decorators:

- **Type Safety**: TypeScript ensures type correctness
- **Validation Rules**: Applied via decorators (@IsString, @IsInt, @Min, @Max, etc.)
- **Automatic Validation**: NestJS ValidationPipe validates all DTOs

Example:
```typescript
export class CreateReviewCycleDto {
  @IsString()
  @MaxLength(100)
  name: string

  @IsInt()
  @Min(new Date().getFullYear())
  year: number
}
```

### Score Validation

Performance scores (1-5 scale) are validated at multiple levels:

1. **DTO Level**: @Min(1) @Max(5) decorators
2. **Value Object Level**: PillarScore.fromValue() validates range
3. **Domain Level**: Business rules enforce valid combinations

## SQL Injection Protection

The application uses Prisma ORM, which provides:

- **Parameterized Queries**: All queries are automatically parameterized
- **Type Safety**: TypeScript types prevent malformed queries
- **No Raw SQL**: Application avoids raw SQL queries

Example (safe):
```typescript
await this.prisma.reviewCycle.findUnique({
  where: { id: cycleId } // Automatically parameterized
})
```

## Cross-Origin Resource Sharing (CORS)

CORS is configured to allow requests only from trusted origins:

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
})
```

## Sensitive Data Protection

### What is NOT Exposed

- **Passwords**: Never returned in API responses, always hashed with bcrypt
- **Refresh Tokens**: Stored in HTTP-only cookies, not accessible via JS
- **Internal IDs**: UUIDs used instead of sequential integers
- **Deleted Records**: Soft-deleted data not returned in queries

### Data Sanitization

- User input sanitized before storage
- Output encoding prevents XSS attacks
- Sensitive fields excluded from response DTOs

### Peer Feedback Anonymization

Peer feedback is **anonymized** to protect reviewer identity:

- Individual feedback not attributable to specific reviewers
- Only aggregated scores and anonymized comments returned
- Reviewee cannot see who provided feedback

## Rate Limiting

Recommended production setup (not included by default):

```typescript
import rateLimit from 'express-rate-limit'

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  })
)
```

## Security Headers

Recommended production headers (use helmet.js):

```typescript
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}))
```

## Environment Variables Security

### Required Secrets

Store securely in environment variables, **NEVER** commit to git:

```bash
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-secret>
DATABASE_URL=<connection-string>
```

### Secret Generation

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Production Recommendations

- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets regularly (every 90 days)
- Use different secrets for each environment
- Enable audit logging for secret access

## Known Security Considerations

### 1. Deadline Enforcement

**Issue**: Deadline checks rely on server time
**Mitigation**: Use UTC timestamps consistently
**Risk**: Low - timestamps are server-controlled

### 2. Manager Authorization

**Issue**: Managers can only evaluate direct reports
**Current**: Trust-based, verified by business logic
**Improvement**: Database-level manager-employee relationships
**Risk**: Low - enforced in use cases

### 3. Calibration Access

**Issue**: Calibrators can view all employee data
**Current**: Role-based, requires HR_ADMIN or CALIBRATOR role
**Recommendation**: Add department-based filtering
**Risk**: Medium - mitigated by role assignment

### 4. Score Adjustment Workflow

**Issue**: Post-calibration adjustments can bypass calibration
**Current**: Requires HR_ADMIN approval
**Improvement**: Add audit trail and justification requirements
**Risk**: Low - requires approval workflow

### 5. Token Theft Protection

**Issue**: Access tokens can be stolen (XSS, browser compromise)
**Mitigation**:
- Short token expiration (15 minutes)
- Refresh token rotation
- HTTP-only cookies for refresh tokens
**Risk**: Medium - requires multiple controls

### 6. Concurrent Updates

**Issue**: Multiple users updating same record simultaneously
**Current**: Last-write-wins
**Improvement**: Optimistic locking with version numbers
**Risk**: Low - rare in practice

## Security Best Practices

### For Developers

1. **Never log sensitive data** (passwords, tokens, PII)
2. **Always validate input** at multiple layers
3. **Use TypeScript strictly** to catch type errors
4. **Follow principle of least privilege** in role assignments
5. **Keep dependencies updated** to patch vulnerabilities
6. **Write security tests** for critical flows

### For Deployers

1. **Use HTTPS only** in production
2. **Enable rate limiting** to prevent abuse
3. **Configure CORS** to trusted domains only
4. **Use strong secrets** (32+ characters, random)
5. **Enable database connection pooling** and limits
6. **Set up monitoring and alerting** for suspicious activity
7. **Regular security audits** and penetration testing

### For Users

1. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
2. **Never share credentials** with colleagues
3. **Log out** when finished, especially on shared devices
4. **Report suspicious activity** to security team
5. **Keep browser updated** to latest version

## Vulnerability Reporting

If you discover a security vulnerability, please report it to:

**Email**: security@company.com
**Expected Response Time**: 48 hours

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Security Audit Checklist

- [x] All endpoints require authentication (except /auth/register, /auth/login)
- [x] Authorization guards on all protected routes
- [x] Input validation on all request DTOs
- [x] SQL injection protection via Prisma ORM
- [x] Password hashing with bcrypt (cost factor 10)
- [x] JWT tokens with expiration
- [x] Refresh token rotation
- [x] HTTP-only cookies for refresh tokens
- [x] CORS configured for trusted origins
- [x] No sensitive data in API responses
- [x] Peer feedback anonymization
- [x] No console.log of sensitive data
- [x] TypeScript strict mode enabled
- [x] Error handling without information leakage
- [ ] Rate limiting (recommended for production)
- [ ] Security headers via helmet.js (recommended for production)
- [ ] Automated security scanning (recommended)
- [ ] Regular dependency updates (recommended)

## Compliance Considerations

### GDPR (if applicable)

- **Right to Access**: Users can view their own review data
- **Right to Rectification**: Updates allowed before submission deadlines
- **Right to Erasure**: Not applicable - performance data is business record
- **Data Minimization**: Only necessary data collected
- **Purpose Limitation**: Data used only for performance reviews

### SOC 2 (if applicable)

- **Access Control**: Role-based access control implemented
- **Audit Logging**: All critical actions should be logged (recommended enhancement)
- **Encryption**: HTTPS for data in transit, encrypted at rest (database-level)
- **Availability**: No single point of failure in architecture

## Security Changelog

### Version 1.0 (December 2025)
- Initial security implementation
- JWT authentication with refresh tokens
- Role-based authorization
- Input validation on all endpoints
- Prisma ORM for SQL injection protection
- Peer feedback anonymization
- HTTP-only cookies for refresh tokens

---

**Last Updated**: December 22, 2025
**Security Review Date**: December 22, 2025
**Next Review Date**: March 22, 2026
