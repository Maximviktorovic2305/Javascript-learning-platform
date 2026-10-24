export function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    error.data &&
    typeof error.data === 'object' &&
    'message' in error.data
  ) {
    const message: unknown = error.data.message
    if (typeof message === 'string') return message
    if (
      Array.isArray(message) &&
      message.every((value) => typeof value === 'string')
    )
      return message.join('. ')
  }
  return 'Не удалось связаться с сервером. Проверьте подключение и попробуйте снова.'
}
