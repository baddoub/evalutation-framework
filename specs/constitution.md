<!--
Sync Impact Report:
- Version change: none → 1.0.0 (Initial constitution)
- Modified principles: N/A (Initial creation)
- Added sections:
  * Core Principles (SOLID, Clean Architecture, Test-Driven Development, TypeScript Type Safety, NestJS Best Practices)
  * Architecture Standards
  * Development Workflow
  * Governance
- Removed sections: N/A
- Templates status:
  ✅ specs/templates/plan-template.md (downloaded)
  ✅ specs/templates/spec-template.md (downloaded)
  ✅ specs/templates/spec-checklist.md (downloaded)
  ✅ specs/templates/tasks-template.md (downloaded)
- Follow-up TODOs: None
-->

# Evaluation Framework Constitution

## Core Principles

### I. SOLID Principles (NON-NEGOTIABLE)

All code MUST adhere to SOLID principles:

- **Single Responsibility Principle**: Each class/module has one reason to change
- **Open/Closed Principle**: Open for extension, closed for modification
- **Liskov Substitution Principle**: Subtypes must be substitutable for base types
- **Interface Segregation Principle**: Clients should not depend on interfaces they don't use
- **Dependency Inversion Principle**: Depend on abstractions, not concretions

**Rationale**: SOLID principles ensure maintainable, testable, and extensible code that scales
with project complexity without introducing technical debt.

### II. Clean Architecture (NON-NEGOTIABLE)

The project MUST follow Clean Architecture with clear layer separation:

- **Domain Layer**: Business entities, value objects, domain logic (innermost, no dependencies)
- **Application Layer**: Use cases, application services, DTOs, ports/interfaces
- **Infrastructure Layer**: External concerns (database, HTTP, file system, third-party APIs)
- **Presentation Layer**: Controllers, presenters, view models

**Dependencies flow inward only**: Outer layers depend on inner layers, never the reverse. Use
dependency injection and interface-based contracts.

**Rationale**: Clean Architecture enables independent testing, framework independence, and clear
separation of concerns, making the codebase resilient to change.

### III. Test-Driven Development (NON-NEGOTIABLE)

TDD MUST be followed for all feature development and bug fixes:

- Write tests first, get user/team approval
- Verify tests fail (Red)
- Implement minimal code to pass (Green)
- Refactor while keeping tests green (Refactor)
- Unit tests for domain logic, integration tests for cross-boundary operations
- Minimum 80% code coverage for critical paths

**Rationale**: TDD ensures requirements are testable, catches regressions early, and produces
well-designed, decoupled code by design.

### IV. TypeScript Type Safety (NON-NEGOTIABLE)

All code MUST leverage TypeScript's type system:

- Strict mode enabled (`strict: true` in tsconfig.json)
- No `any` types without explicit justification and approval
- Interfaces over type aliases for object shapes
- Enums for constant values
- Export all types by default
- Type guards instead of type assertions
- Discriminated unions for complex state modeling

**Rationale**: Strong typing catches errors at compile time, improves refactoring safety, serves
as living documentation, and enables superior IDE support.

### V. NestJS Best Practices

The project uses NestJS as the backend framework and MUST follow these conventions:

- **Modules**: Feature-based module organization aligned with domain boundaries
- **Dependency Injection**: Use constructor injection, avoid property injection
- **Guards**: Authentication/authorization via guards, not middleware
- **Interceptors**: Cross-cutting concerns (logging, transformation, caching)
- **Pipes**: Input validation and transformation at controller boundaries
- **Exception Filters**: Consistent error handling and response formatting
- **Configuration**: Environment-based config via `@nestjs/config`, validated schemas
- **Documentation**: OpenAPI/Swagger annotations for all public endpoints

**Rationale**: NestJS provides structure that aligns naturally with Clean Architecture and SOLID,
reducing boilerplate while maintaining testability.

## Architecture Standards

### Dependency Management

- Use abstractions (interfaces/abstract classes) for cross-layer communication
- Infrastructure implementations injected via NestJS providers
- Domain layer has zero framework dependencies
- Application layer depends only on domain abstractions

### Module Organization

```
src/
  [domain]/
    domain/        # Entities, value objects, domain services
    application/   # Use cases, DTOs, port interfaces
    infrastructure/# Repositories, adapters, external services
    presentation/  # Controllers, request/response models
```

### Data Flow

- **Inbound**: Controller → Use Case → Domain → Repository
- **Outbound**: Repository → Domain → Use Case → Controller
- DTOs at boundaries only, never expose domain entities directly

## Development Workflow

### Code Review Requirements

All code changes MUST:

- Pass automated tests (unit + integration)
- Maintain or improve code coverage
- Follow SOLID principles (verified by reviewer)
- Respect layer boundaries (no dependency violations)
- Include appropriate type annotations
- Update relevant documentation

### Quality Gates

Before merge, verify:

- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Linting passes (ESLint configured for SOLID/Clean Architecture rules)
- ✅ Architecture boundaries respected (checked via tooling if available)
- ✅ Code coverage meets threshold

### Refactoring Protocol

When refactoring:

- Tests MUST remain green throughout
- Refactor in small, atomic commits
- Do not mix refactoring with feature work
- Document architectural decisions in ADRs (Architecture Decision Records)

## Governance

This constitution supersedes all other development practices and conventions. Any deviation MUST
be explicitly justified, documented, and approved by the team.

### Amendment Process

1. Propose amendment with rationale
2. Team review and discussion
3. Approval required from technical lead
4. Update version following semantic versioning
5. Propagate changes to dependent templates and documentation

### Compliance Verification

- All PRs MUST verify compliance with this constitution
- Complexity must be justified; simplicity preferred (YAGNI)
- Regular architecture reviews to ensure principles are maintained
- Use `CLAUDE.md` for runtime development guidance

### Versioning Policy

- **MAJOR**: Breaking changes to core principles or architecture mandates
- **MINOR**: New principle additions or material expansions
- **PATCH**: Clarifications, typo fixes, non-semantic refinements

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
