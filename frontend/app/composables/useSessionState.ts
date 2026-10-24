import type { User } from '#shared/types/api'
export function useSessionState() {
  return {
    user: useState<User | null>('session:user', () => null),
    ready: useState('session:ready', () => false),
    revision: useState('session:revision', () => 0),
  }
}
