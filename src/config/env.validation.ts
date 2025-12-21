import { plainToInstance } from 'class-transformer'
import { IsEnum, IsNumber, IsString, IsUrl, validateSync } from 'class-validator'

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development

  @IsNumber()
  PORT: number = 3000

  @IsString()
  DATABASE_URL!: string

  @IsUrl({ require_tld: false })
  KEYCLOAK_URL!: string

  @IsString()
  KEYCLOAK_REALM!: string

  @IsString()
  KEYCLOAK_CLIENT_ID!: string

  @IsString()
  KEYCLOAK_CLIENT_SECRET!: string

  @IsUrl({ require_tld: false })
  KEYCLOAK_REDIRECT_URI!: string

  @IsString()
  ACCESS_TOKEN_SECRET!: string

  @IsString()
  REFRESH_TOKEN_SECRET!: string

  @IsString()
  ACCESS_TOKEN_EXPIRY: string = '15m'

  @IsString()
  REFRESH_TOKEN_EXPIRY: string = '7d'

  @IsString()
  ALLOWED_ORIGINS: string = 'http://localhost:3001'
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }
  return validatedConfig
}
