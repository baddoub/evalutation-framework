import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }

  /**
   * Enable soft delete filtering by default
   * Automatically excludes records with deletedAt != null
   */
  async enableSoftDelete(): Promise<void> {
    ;(this as any).$use(async (params: any, next: any) => {
      // Filter soft-deleted users in queries
      if (params.model === 'User') {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst'
          params.args.where = {
            ...params.args.where,
            deletedAt: null,
          }
        }
        if (params.action === 'findMany') {
          if (params.args.where) {
            if (!params.args.where.deletedAt) {
              params.args.where.deletedAt = null
            }
          } else {
            params.args.where = { deletedAt: null }
          }
        }
      }
      return next(params)
    })
  }

  /**
   * Helper method for soft delete
   */
  async softDelete(model: 'User', id: string): Promise<void> {
    await (this as any)[model.toLowerCase()].update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
