import { Injectable } from '@nestjs/common'
import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface'
import {
  ManagerEvaluation,
  ManagerEvaluationId,
} from '../../../domain/entities/manager-evaluation.entity'
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo'
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service'
import { ManagerEvaluationMapper } from '../mappers/manager-evaluation.mapper'

/**
 * PrismaManagerEvaluationRepository
 *
 * Responsibilities:
 * - Implement IManagerEvaluationRepository using Prisma ORM
 * - Handle all ManagerEvaluation persistence operations
 * - Implement soft delete pattern
 *
 * SOLID Principles:
 * - SRP: Only responsible for ManagerEvaluation persistence
 * - DIP: Implements domain interface, depends on abstractions
 * - Infrastructure Layer: Uses Prisma and NestJS
 */
@Injectable()
export class PrismaManagerEvaluationRepository implements IManagerEvaluationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find manager evaluation by ID
   * @param id - ManagerEvaluationId
   * @returns ManagerEvaluation entity or null if not found
   */
  async findById(id: ManagerEvaluationId): Promise<ManagerEvaluation | null> {
    const prismaEvaluation = await this.prisma.managerEvaluation.findUnique({
      where: { id: id.value, deletedAt: null },
    })

    return prismaEvaluation ? ManagerEvaluationMapper.toDomain(prismaEvaluation) : null
  }

  /**
   * Find manager evaluation by employee and cycle
   * @param employeeId - UserId of employee
   * @param cycleId - ReviewCycleId
   * @returns ManagerEvaluation entity or null if not found
   */
  async findByEmployeeAndCycle(
    employeeId: UserId,
    cycleId: ReviewCycleId,
  ): Promise<ManagerEvaluation | null> {
    const prismaEvaluation = await this.prisma.managerEvaluation.findUnique({
      where: {
        cycleId_employeeId: {
          cycleId: cycleId.value,
          employeeId: employeeId.value,
        },
        deletedAt: null,
      },
    })

    return prismaEvaluation ? ManagerEvaluationMapper.toDomain(prismaEvaluation) : null
  }

  /**
   * Find all manager evaluations by manager in a cycle
   * @param managerId - UserId of manager
   * @param cycleId - ReviewCycleId
   * @returns Array of ManagerEvaluation entities
   */
  async findByManagerAndCycle(
    managerId: UserId,
    cycleId: ReviewCycleId,
  ): Promise<ManagerEvaluation[]> {
    const prismaEvaluations = await this.prisma.managerEvaluation.findMany({
      where: {
        managerId: managerId.value,
        cycleId: cycleId.value,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    return prismaEvaluations.map((evaluation) => ManagerEvaluationMapper.toDomain(evaluation))
  }

  /**
   * Find all manager evaluations in a cycle
   * @param cycleId - ReviewCycleId
   * @returns Array of ManagerEvaluation entities
   */
  async findByCycle(cycleId: ReviewCycleId): Promise<ManagerEvaluation[]> {
    const prismaEvaluations = await this.prisma.managerEvaluation.findMany({
      where: { cycleId: cycleId.value, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    return prismaEvaluations.map((evaluation) => ManagerEvaluationMapper.toDomain(evaluation))
  }

  /**
   * Save (create or update) a manager evaluation
   * @param evaluation - ManagerEvaluation entity to save
   * @returns Saved ManagerEvaluation entity
   */
  async save(evaluation: ManagerEvaluation): Promise<ManagerEvaluation> {
    const prismaData = ManagerEvaluationMapper.toPrisma(evaluation)

    const saved = await this.prisma.managerEvaluation.upsert({
      where: { id: evaluation.id.value },
      create: prismaData,
      update: prismaData,
    })

    return ManagerEvaluationMapper.toDomain(saved)
  }

  /**
   * Soft delete a manager evaluation
   * @param id - ManagerEvaluationId to delete
   */
  async delete(id: ManagerEvaluationId): Promise<void> {
    await this.prisma.managerEvaluation.update({
      where: { id: id.value },
      data: { deletedAt: new Date() },
    })
  }
}
