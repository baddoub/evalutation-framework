import { Narrative } from './narrative.vo'
import { NarrativeExceedsWordLimitException } from '../exceptions'

describe('Narrative', () => {
  describe('fromText', () => {
    it('should create Narrative with valid text', () => {
      const text = 'This is a valid narrative with some content.'
      const narrative = Narrative.fromText(text)

      expect(narrative).toBeInstanceOf(Narrative)
      expect(narrative.text).toBe(text)
    })

    it('should create Narrative with empty text', () => {
      const narrative = Narrative.fromText('')

      expect(narrative.text).toBe('')
      expect(narrative.wordCount).toBe(0)
    })

    it('should calculate word count correctly', () => {
      const text = 'This is a test narrative'
      const narrative = Narrative.fromText(text)

      expect(narrative.wordCount).toBe(5)
    })

    it('should handle multiple spaces between words', () => {
      const text = 'This    has    multiple    spaces'
      const narrative = Narrative.fromText(text)

      expect(narrative.wordCount).toBe(4)
    })

    it('should trim whitespace', () => {
      const text = '  This is trimmed  '
      const narrative = Narrative.fromText(text)

      expect(narrative.wordCount).toBe(3)
    })

    it('should accept narrative with exactly 1000 words', () => {
      const words = Array(1000).fill('word')
      const text = words.join(' ')
      const narrative = Narrative.fromText(text)

      expect(narrative.wordCount).toBe(1000)
    })

    it('should throw NarrativeExceedsWordLimitException for > 1000 words', () => {
      const words = Array(1001).fill('word')
      const text = words.join(' ')

      expect(() => Narrative.fromText(text)).toThrow(NarrativeExceedsWordLimitException)
    })

    it('should throw with correct word count in error', () => {
      const words = Array(1500).fill('word')
      const text = words.join(' ')

      expect(() => Narrative.fromText(text)).toThrow(/1500/)
    })

    it('should handle newlines and tabs', () => {
      const text = 'This\nhas\tnewlines\rand\ttabs'
      const narrative = Narrative.fromText(text)

      expect(narrative.wordCount).toBe(5)
    })
  })

  describe('text getter', () => {
    it('should return the narrative text', () => {
      const text = 'This is the narrative text'
      const narrative = Narrative.fromText(text)

      expect(narrative.text).toBe(text)
    })
  })

  describe('wordCount getter', () => {
    it('should return correct word count', () => {
      const text = 'One two three four five'
      const narrative = Narrative.fromText(text)

      expect(narrative.wordCount).toBe(5)
    })

    it('should return 0 for empty text', () => {
      const narrative = Narrative.fromText('')

      expect(narrative.wordCount).toBe(0)
    })
  })

  describe('equals', () => {
    it('should return true for equal narratives', () => {
      const text = 'Same text'
      const narrative1 = Narrative.fromText(text)
      const narrative2 = Narrative.fromText(text)

      expect(narrative1.equals(narrative2)).toBe(true)
    })

    it('should return false for different narratives', () => {
      const narrative1 = Narrative.fromText('Text one')
      const narrative2 = Narrative.fromText('Text two')

      expect(narrative1.equals(narrative2)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      const narrative = Narrative.fromText('Text')

      expect(narrative.equals(null as any)).toBe(false)
      expect(narrative.equals(undefined as any)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return the narrative text', () => {
      const text = 'This is the narrative'
      const narrative = Narrative.fromText(text)

      expect(narrative.toString()).toBe(text)
    })
  })
})
