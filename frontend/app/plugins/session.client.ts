export default defineNuxtPlugin(async (nuxtApp) => {
  const session = useSession()
  await session.restore()
  const channel = new BroadcastChannel('script-lab-session')
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (event.data === 'logout') session.clear()
  }
  nuxtApp.vueApp.onUnmount(() => channel.close())
})
