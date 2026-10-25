import { describe, expect, it } from 'vitest'
import { timezoneOptions } from '../app/utils/timezones'

describe('Compact timezone choices', () => {
  it('covers all eleven Russian offsets without listing every IANA city', () => {
    const options = timezoneOptions('Asia/Vladivostok', 'Asia/Vladivostok')
    expect(options).toHaveLength(17)
    const russian = options.slice(1, 12)
    const offsets = russian.map(
      ({ value }) =>
        new Intl.DateTimeFormat('en', {
          timeZone: value,
          timeZoneName: 'shortOffset',
        })
          .formatToParts(new Date('2026-01-01'))
          .find((part) => part.type === 'timeZoneName')?.value,
    )
    expect(offsets).toEqual(
      Array.from({ length: 11 }, (_, index) => `GMT+${index + 2}`),
    )
    expect(
      options.find((option) => option.value === 'Europe/Moscow')?.label,
    ).toBe('Москва · UTC+3')
  })
  it('preserves an uncommon saved choice and the detected device timezone', () => {
    const options = timezoneOptions('Pacific/Auckland', 'America/Los_Angeles')
    expect(options).toHaveLength(19)
    expect(options.some((option) => option.value === 'Pacific/Auckland')).toBe(
      true,
    )
    expect(
      options.some((option) => option.value === 'America/Los_Angeles'),
    ).toBe(true)
    expect(new Set(options.map((option) => option.value)).size).toBe(
      options.length,
    )
  })
})
