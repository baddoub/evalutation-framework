# Implementation Plan: Keycloak OAuth Authentication

**Branch**: `001-keycloak-auth` | **Date**: 2025-12-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-keycloak-auth/spec.md`

**Note**: This plan outlines the implementation approach for Keycloak OAuth authentication using Clean Architecture principles.

## Summary

This feature adds secure user authentication to the evaluation framework using Keycloak OAuth 2.0. The implementation follows Clean Architecture with four distinct layers: Domain (business entities and logic), Application (use cases and orchestration), Infrastructure (Keycloak integration, database, JWT handling), and Presentation (REST API controllers and guards). The system will use Authorization Code Flow with PKCE, stateless JWT validation, HTTP-only cookies for refresh tokens, and Prisma ORM with PostgreSQL for user storage. Key technical components include the nest-keycloak-connect library for Keycloak integration, JWT signature verification with JWKS, refresh token rotation for security, and comprehensive testing using keycloak-mock.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20.x LTS
**Primary Dependencies**: NestJS 10.x, Prisma 5.x, nest-keycloak-connect, @nestjs/jwt, jwks-rsa, bcrypt
**Storage**: PostgreSQL 15+ (user profiles, refresh tokens, sessions)
**Testing**: Jest, @nestjs/testing, supertest, keycloak-node-mock
**Target Platform**: Linux/macOS server (Docker containerized)
**Project Type**: Web backend API (NestJS monolith)
**Performance Goals**: <100ms p95 for token validation, support 100 concurrent logins, <1s for token refresh
**Constraints**: 15-minute access token lifetime (NFR-007), 7-day refresh token lifetime (NFR-008), stateless validation, HTTPS only in production
**Scale/Scope**: Single authentication domain, 5 REST endpoints, 3 database tables, ~2500 LOC excluding tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SOLID Principles**: ✅ PASS
  - Single Responsibility: Each use case, entity, repository, and controller has one clear purpose
  - Open/Closed: Interfaces (IUserRepository, IKeycloakAdapter, ITokenService) allow extension without modification
  - Liskov Substitution: Repository implementations can be swapped (Prisma, TypeORM, in-memory for testing)
  - Interface Segregation: Narrow, focused interfaces (separate concerns for token generation, validation, storage)
  - Dependency Inversion: All layers depend on abstractions, not concrete implementations

- **Clean Architecture**: ✅ PASS
  - Domain Layer: User entity, Email/Role value objects, domain services (zero dependencies)
  - Application Layer: Use cases (AuthenticateUser, RefreshTokens, Logout), port interfaces
  - Infrastructure Layer: Prisma repositories, Keycloak adapter, JWT service implementations
  - Presentation Layer: NestJS controllers, guards, DTOs
  - Dependencies flow inward only: Presentation → Application → Domain ← Infrastructure

- **Test-Driven Development**: ✅ PASS
  - Tests must be written before implementation for all use cases
  - Unit tests for domain entities (90%+ coverage)
  - Integration tests for repositories and adapters (70%+ coverage)
  - E2E tests for authentication flows (main user journeys)
  - keycloak-mock for testing without real Keycloak instance

- **TypeScript Type Safety**: ✅ PASS
  - Strict mode enabled
  - No `any` types (domain entities, DTOs, interfaces fully typed)
  - Interfaces for all contracts (IUserRepository, IKeycloakAdapter)
  - Type guards for token validation
  - Discriminated unions for authentication states

- **NestJS Best Practices**: ✅ PASS
  - Feature-based module organization (AuthModule)
  - Constructor dependency injection throughout
  - Guards for authentication (JwtAuthGuard, RolesGuard)
  - Pipes for DTO validation (class-validator)
  - Exception filters for consistent error responses
  - Environment-based configuration with validation
  - Swagger documentation for all endpoints

**Verdict**: All constitutional requirements met. Proceed with implementation.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── auth/                                  # Authentication feature module
│   ├── domain/                            # Domain Layer (Pure business logic)
│   │   ├── entities/
│   │   │   ├── user.entity.ts             # User aggregate root
│   │   │   └── session.entity.ts          # Session entity
│   │   ├── value-objects/
│   │   │   ├── email.vo.ts                # Email value object with validation
│   │   │   ├── user-id.vo.ts              # User ID value object
│   │   │   └── role.vo.ts                 # Role value object
│   │   ├── services/
│   │   │   └── user-authorization.service.ts  # Domain service for authorization
│   │   ├── repositories/
│   │   │   └── user.repository.interface.ts   # Repository contract (port)
│   │   └── exceptions/
│   │       ├── invalid-user.exception.ts
│   │       └── authorization-failed.exception.ts
│   │
│   ├── application/                       # Application Layer (Use cases)
│   │   ├── use-cases/
│   │   │   ├── authenticate-user/
│   │   │   │   ├── authenticate-user.use-case.ts
│   │   │   │   ├── authenticate-user.input.ts
│   │   │   │   └── authenticate-user.output.ts
│   │   │   ├── refresh-tokens/
│   │   │   │   ├── refresh-tokens.use-case.ts
│   │   │   │   ├── refresh-tokens.input.ts
│   │   │   │   └── refresh-tokens.output.ts
│   │   │   ├── logout-user/
│   │   │   │   ├── logout-user.use-case.ts
│   │   │   │   └── logout-user.input.ts
│   │   │   └── validate-session/
│   │   │       ├── validate-session.use-case.ts
│   │   │       └── validate-session.input.ts
│   │   ├── ports/                         # Interfaces for infrastructure
│   │   │   ├── keycloak-adapter.interface.ts
│   │   │   ├── token-service.interface.ts
│   │   │   └── session-manager.interface.ts
│   │   ├── dto/
│   │   │   ├── user.dto.ts
│   │   │   └── token-pair.dto.ts
│   │   └── exceptions/
│   │       ├── authentication-failed.exception.ts
│   │       └── token-expired.exception.ts
│   │
│   ├── infrastructure/                    # Infrastructure Layer (External concerns)
│   │   ├── adapters/
│   │   │   ├── keycloak/
│   │   │   │   ├── keycloak.adapter.ts    # IKeycloakAdapter implementation
│   │   │   │   ├── keycloak.config.ts
│   │   │   │   └── keycloak-client.factory.ts
│   │   │   ├── jwt/
│   │   │   │   ├── jwt-token.service.ts   # ITokenService implementation
│   │   │   │   ├── jwt-validator.service.ts
│   │   │   │   └── jwt-generator.service.ts
│   │   │   └── session/
│   │   │       └── session-manager.service.ts
│   │   ├── persistence/
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   ├── schema.prisma
│   │   │   │   └── migrations/
│   │   │   ├── repositories/
│   │   │   │   ├── prisma-user.repository.ts
│   │   │   │   └── prisma-session.repository.ts
│   │   │   └── entities/
│   │   │       ├── user.orm-entity.ts     # Prisma entity mapping
│   │   │       ├── session.orm-entity.ts
│   │   │       └── refresh-token.orm-entity.ts
│   │   ├── mappers/
│   │   │   ├── user.mapper.ts             # Domain ↔ ORM mapping
│   │   │   └── session.mapper.ts
│   │   └── config/
│   │       └── auth.config.ts
│   │
│   ├── presentation/                      # Presentation Layer (HTTP API)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts         # /auth endpoints
│   │   │   └── user.controller.ts         # /users/me endpoint
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts          # JWT authentication guard
│   │   │   ├── roles.guard.ts             # Role-based authorization
│   │   │   └── keycloak-auth.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  # Extract current user from request
│   │   │   ├── roles.decorator.ts         # Declare required roles
│   │   │   └── public.decorator.ts        # Mark public endpoints
│   │   ├── dto/
│   │   │   ├── requests/
│   │   │   │   ├── auth-callback.dto.ts
│   │   │   │   └── refresh-token.dto.ts
│   │   │   └── responses/
│   │   │       ├── auth-response.dto.ts
│   │   │       └── user-response.dto.ts
│   │   ├── filters/
│   │   │   └── auth-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── auth-logging.interceptor.ts
│   │   └── validators/
│   │       └── auth-callback.validator.ts
│   │
│   └── auth.module.ts                     # NestJS module configuration
│
├── common/                                # Shared utilities
│   ├── exceptions/
│   │   └── base.exception.ts
│   └── interfaces/
│       └── use-case.interface.ts
│
└── main.ts                                # Application entry point

tests/
├── unit/                                  # Unit tests (90%+ coverage)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── user.entity.spec.ts
│   │   │   └── session.entity.spec.ts
│   │   ├── value-objects/
│   │   │   ├── email.vo.spec.ts
│   │   │   └── role.vo.spec.ts
│   │   └── services/
│   │       └── user-authorization.service.spec.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── authenticate-user.use-case.spec.ts
│   │       ├── refresh-tokens.use-case.spec.ts
│   │       └── logout-user.use-case.spec.ts
│   └── presentation/
│       ├── guards/
│       │   ├── jwt-auth.guard.spec.ts
│       │   └── roles.guard.spec.ts
│       └── controllers/
│           └── auth.controller.spec.ts
│
├── integration/                           # Integration tests (70%+ coverage)
│   ├── repositories/
│   │   └── prisma-user.repository.integration.spec.ts
│   └── adapters/
│       ├── keycloak.adapter.integration.spec.ts
│       └── jwt-token.service.integration.spec.ts
│
└── e2e/                                   # End-to-end tests (main flows)
    ├── auth.e2e-spec.ts
    └── protected-routes.e2e-spec.ts
```

**Structure Decision**:
This feature uses Clean Architecture with strict layer separation within a NestJS monolith structure. The `src/auth` module contains four distinct layers aligned with Clean Architecture principles:

1. **Domain Layer**: Pure business logic with zero framework dependencies (entities, value objects, interfaces)
2. **Application Layer**: Use case orchestration and port definitions (framework-independent)
3. **Infrastructure Layer**: External integrations (Keycloak, PostgreSQL via Prisma, JWT)
4. **Presentation Layer**: HTTP/REST API concerns (NestJS controllers, guards, DTOs)

This structure ensures:
- Clear separation of concerns
- Testability at each layer (unit, integration, E2E)
- Framework independence for core business logic
- Easy substitution of implementations (repositories, adapters)
- Compliance with SOLID principles and NestJS best practices

## Complexity Tracking

No constitutional violations. All complexity is justified by Clean Architecture requirements and authentication security needs.
