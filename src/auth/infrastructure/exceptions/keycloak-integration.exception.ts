/**
 * KeycloakIntegrationException
 *
 * Thrown when Keycloak integration fails
 * Could be due to network errors, invalid tokens, or Keycloak server issues
 */
export class KeycloakIntegrationException extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message)
    this.name = 'KeycloakIntegrationException'
  }
}
