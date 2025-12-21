import { ReviewCycleId } from './review-cycle-id.vo'
import { InvalidReviewCycleIdException } from '../exceptions'

describe('ReviewCycleId', () => {
  describe('generate', () => {
    it('should generate a new ReviewCycleId with UUID v4', () => {
      const id = ReviewCycleId.generate()

      expect(id).toBeInstanceOf(ReviewCycleId)
      expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    })

    it('should generate unique IDs', () => {
      const id1 = ReviewCycleId.generate()
      const id2 = ReviewCycleId.generate()

      expect(id1.value).not.toBe(id2.value)
    })
  })

  describe('fromString', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000'

    it('should create ReviewCycleId from valid UUID string', () => {
      const id = ReviewCycleId.fromString(validUuid)

      expect(id).toBeInstanceOf(ReviewCycleId)
      expect(id.value).toBe(validUuid.toLowerCase())
    })

    it('should normalize UUID to lowercase', () => {
      const upperUuid = '550E8400-E29B-41D4-A716-446655440000'
      const id = ReviewCycleId.fromString(upperUuid)

      expect(id.value).toBe(upperUuid.toLowerCase())
    })

    it('should trim whitespace', () => {
      const id = ReviewCycleId.fromString(`  ${validUuid}  `)

      expect(id.value).toBe(validUuid)
    })

    it('should throw InvalidReviewCycleIdException for empty string', () => {
      expect(() => ReviewCycleId.fromString('')).toThrow(InvalidReviewCycleIdException)
      expect(() => ReviewCycleId.fromString('   ')).toThrow(InvalidReviewCycleIdException)
    })

    it('should throw InvalidReviewCycleIdException for null/undefined', () => {
      expect(() => ReviewCycleId.fromString(null as any)).toThrow(InvalidReviewCycleIdException)
      expect(() => ReviewCycleId.fromString(undefined as any)).toThrow(InvalidReviewCycleIdException)
    })

    it('should throw InvalidReviewCycleIdException for invalid UUID format', () => {
      expect(() => ReviewCycleId.fromString('not-a-uuid')).toThrow(InvalidReviewCycleIdException)
      expect(() => ReviewCycleId.fromString('12345')).toThrow(InvalidReviewCycleIdException)
      expect(() => ReviewCycleId.fromString('550e8400-e29b-31d4-a716-446655440000')).toThrow(InvalidReviewCycleIdException) // Not v4
    })
  })

  describe('equals', () => {
    it('should return true for equal ReviewCycleIds', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id1 = ReviewCycleId.fromString(uuid)
      const id2 = ReviewCycleId.fromString(uuid)

      expect(id1.equals(id2)).toBe(true)
    })

    it('should return false for different ReviewCycleIds', () => {
      const id1 = ReviewCycleId.generate()
      const id2 = ReviewCycleId.generate()

      expect(id1.equals(id2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const id = ReviewCycleId.generate()

      expect(id.equals(null as any)).toBe(false)
      expect(id.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the UUID string value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id = ReviewCycleId.fromString(uuid)

      expect(id.toString()).toBe(uuid)
    })
  })

  describe('value getter', () => {
    it('should return the UUID value', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const id = ReviewCycleId.fromString(uuid)

      expect(id.value).toBe(uuid)
    })
  })
})
