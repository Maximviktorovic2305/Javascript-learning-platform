export function useTheme() {
  const preference = useCookie<'dark' | 'light'>('sl_theme', {
    default: () => 'light',
    sameSite: 'lax',
    maxAge: 31536000,
  })
  useHead({ htmlAttrs: { 'data-theme': () => preference.value } })
  return {
    theme: preference,
    toggle: () => {
      preference.value = preference.value === 'dark' ? 'light' : 'dark'
    },
  }
}
