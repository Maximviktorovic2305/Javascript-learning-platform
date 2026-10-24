import type { Progress } from '#shared/types/api'
export function useProgress() {
  const { user } = useSession()
  const api = useApi()
  return useAsyncData(
    computed(() => `private:progress:${user.value?.id ?? 'guest'}`),
    (_app, { signal }) =>
      user.value
        ? api<Progress>('/profile/progress', { signal })
        : Promise.resolve(null),
    { server: false },
  )
}
