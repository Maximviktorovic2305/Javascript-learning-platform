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
// One city for each Russian time zone, UTC and a few common world destinations.
// Keep a user's saved or detected zone even when it is outside the short list.
const commonZones = [
  'UTC',
  'Europe/Kaliningrad',
  'Europe/Moscow',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Tokyo',
  'America/New_York',
]
export function timezoneOptions(current: string, detected: string) {
  return [...new Set([...commonZones, current, detected])]
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
        label: `${cityNames[value] ?? value.replaceAll('_', ' ')}${offset ? ` · ${offset.replace('GMT', 'UTC')}` : ''}`,
      }
    })
}
