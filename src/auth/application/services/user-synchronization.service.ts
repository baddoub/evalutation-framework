import { Injectable } from '@nestjs/common'
import { User } from '../../domain/entities/user.entity'
import { KeycloakUserDataDto } from '../dto/keycloak-user-data.dto'
import { Email } from '../../domain/value-objects/email.vo'

/**
 * UserSynchronizationService
 *
 * Service to synchronize user data from Keycloak to local database.
 * This ensures that user information stays up-to-date with Keycloak.
 */
@Injectable()
export class UserSynchronizationService {
  /**
   * Synchronize user data from Keycloak
   *
   * Updates user name and email if they have changed in Keycloak.
   * This method is called during authentication to keep user data in sync.
   *
   * @param user - Domain user entity to update
   * @param keycloakData - Latest user data from Keycloak
   */
  synchronizeUser(user: User, keycloakData: KeycloakUserDataDto): void {
    // Use the domain entity's synchronization method
    user.synchronizeFromKeycloak({
      name: keycloakData.name,
      email: Email.create(keycloakData.email),
      roles: user.roles, // Keep existing roles
    })
  }
}
