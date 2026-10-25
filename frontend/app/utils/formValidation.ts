export function nameError(value: string): string {
  const length = Array.from(value.trim()).length
  if (!length) return 'Введите имя.'
  return length < 2 || length > 60
    ? 'Имя должно содержать от 2 до 60 символов.'
    : ''
}

export function emailError(value: string): string {
  if (!value.trim()) return 'Введите электронную почту.'
  return value.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
    ? 'Введите корректный адрес электронной почты, например name@example.com.'
    : ''
}

export function passwordError(value: string): string {
  if (!value) return 'Введите пароль.'
  const length = Array.from(value).length
  return length < 10 || length > 128
    ? 'Пароль должен содержать от 10 до 128 символов.'
    : ''
}

export function timezoneError(value: string): string {
  try {
    if (!value || value.length > 80) throw new Error('Invalid timezone')
    new Intl.DateTimeFormat('ru', { timeZone: value })
    return ''
  } catch {
    return 'Укажите существующий часовой пояс, например Asia/Vladivostok.'
  }
}
export function dailyGoalError(value: number | string): string {
  const goal = Number(value)
  return value === '' ||
    !Number.isInteger(goal) ||
    goal < 1 ||
    goal > 2147483647
    ? 'Укажите положительное целое число XP.'
    : ''
}

export function projectUrlError(value: string): string {
  if (!value) return 'Введите ссылку на репозиторий или демо.'
  try {
    const url = new URL(value)
    if (
      value.length > 2000 ||
      url.protocol !== 'https:' ||
      !url.hostname.includes('.')
    )
      throw new Error('Invalid URL')
    return ''
  } catch {
    return 'Введите полную HTTPS-ссылку, например https://github.com/you/project.'
  }
}
