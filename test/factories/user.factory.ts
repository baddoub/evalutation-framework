/**
 * Factory for creating test user data
 */
export class UserFactory {
  static createUserData(overrides?: Partial<UserData>): UserData {
    return {
      id: overrides?.id ?? 'test-user-id',
      email: overrides?.email ?? 'test@example.com',
      name: overrides?.name ?? 'Test User',
      keycloakId: overrides?.keycloakId ?? 'keycloak-test-id',
      roles: overrides?.roles ?? ['user'],
      isActive: overrides?.isActive ?? true,
      createdAt: overrides?.createdAt ?? new Date(),
      updatedAt: overrides?.updatedAt ?? new Date(),
    }
  }

  static createAdminUserData(overrides?: Partial<UserData>): UserData {
    return this.createUserData({
      ...overrides,
      email: overrides?.email ?? 'admin@example.com',
      name: overrides?.name ?? 'Admin User',
      roles: ['admin'],
    })
  }

  static createManagerUserData(overrides?: Partial<UserData>): UserData {
    return this.createUserData({
      ...overrides,
      email: overrides?.email ?? 'manager@example.com',
      name: overrides?.name ?? 'Manager User',
      roles: ['manager'],
    })
  }
}

interface UserData {
  id: string
  email: string
  name: string
  keycloakId: string
  roles: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
