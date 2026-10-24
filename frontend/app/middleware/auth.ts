export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const { user, ready, restore } = useSession()
  if (!ready.value) await restore()
  if (!user.value) return navigateTo('/auth/login')
})
