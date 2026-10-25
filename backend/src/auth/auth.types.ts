export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  timezone: true,
  timezoneAuto: true,
  dailyGoal: true,
  createdAt: true,
} as const;
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  timezoneAuto: boolean;
  dailyGoal: number;
  createdAt: Date;
}
export type AuthenticatedRequest = import('express').Request & {
  user: AuthenticatedUser;
};
export const SESSION_COOKIE = 'sl_session';
export const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
