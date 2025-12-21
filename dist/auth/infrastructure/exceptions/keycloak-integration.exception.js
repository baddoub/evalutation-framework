"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakIntegrationException = void 0;
class KeycloakIntegrationException extends Error {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
        this.name = 'KeycloakIntegrationException';
    }
}
exports.KeycloakIntegrationException = KeycloakIntegrationException;
//# sourceMappingURL=keycloak-integration.exception.js.map