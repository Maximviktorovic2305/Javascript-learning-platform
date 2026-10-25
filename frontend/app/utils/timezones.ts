export function systemTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
const cityNames: Record<string, string> = {
  'Europe/Moscow': 'Москва',
  'Europe/Kaliningrad': 'Калининград',
  'Europe/Samara': 'Самара',
  'Asia/Yekaterinburg': 'Екатеринбург',
  'Asia/Omsk': 'Омск',
  'Asia/Novosibirsk': 'Новосибирск',
  'Asia/Krasnoyarsk': 'Красноярск',
  'Asia/Irkutsk': 'Иркутск',
  'Asia/Yakutsk': 'Якутск',
  'Asia/Vladivostok': 'Владивосток',
  'Asia/Magadan': 'Магадан',
  'Asia/Kamchatka': 'Камчатка',
  'Europe/London': 'Лондон',
  'Europe/Berlin': 'Берлин',
  'Asia/Dubai': 'Дубай',
  'Asia/Tokyo': 'Токио',
  'America/New_York': 'Нью-Йорк',
  UTC: 'Всемирное время',
}
export function timezoneOptions(current: string, detected: string) {
  const zones =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : Object.keys(cityNames)
  return [
    ...new Set(['UTC', current, detected, ...Object.keys(cityNames), ...zones]),
  ]
    .filter(Boolean)
    .map((value) => {
      let offset = ''
      try {
        offset =
          new Intl.DateTimeFormat('ru', {
            timeZone: value,
            timeZoneName: 'shortOffset',
          })
            .formatToParts(new Date())
            .find((part) => part.type === 'timeZoneName')?.value ?? ''
      } catch {
        /* Invalid persisted values are separately validated. */
      }
      return {
        value,
        label: `${cityNames[value] ?? value.replaceAll('_', ' ')} · ${offset} · ${value}`,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}
