import { User } from '../../domain/entities/user.entity';
import { KeycloakUserDataDto } from '../dto/keycloak-user-data.dto';
export declare class UserSynchronizationService {
    synchronizeUser(user: User, keycloakData: KeycloakUserDataDto): void;
}
