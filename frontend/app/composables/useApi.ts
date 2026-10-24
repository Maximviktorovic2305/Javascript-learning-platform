export function useApi() {
  const fetcher = useRequestFetch()
  const { user, revision } = useSessionState()
  return <T>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
      body?: object
      signal?: AbortSignal
    } = {},
  ) => {
    const current = revision.value
    return fetcher<T, string, 'GET' | 'POST' | 'PATCH' | 'DELETE'>(
      `/api${path}`,
      {
        ...options,
        headers: { 'x-lab-request': '1' },
        retry: 0,
      },
    ).catch((error: unknown) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        error.statusCode === 401 &&
        !['/auth/login', '/auth/register', '/profile/password'].includes(
          path,
        ) &&
        current === revision.value
      ) {
        revision.value++
        user.value = null
        clearNuxtData((key) => key.startsWith('private:'))
      }
      throw error
    })
  }
}
