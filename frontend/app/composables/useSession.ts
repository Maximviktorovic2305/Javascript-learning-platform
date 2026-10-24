import type { User } from "#shared/types/api";
export function useSession() {
  const { user, ready, revision } = useSessionState();
  const api = useApi();
  async function restore() {
    const current = revision.value;
    try {
      const account = await api<User>("/auth/me");
      if (current === revision.value) user.value = account;
    } catch {
      if (current === revision.value) user.value = null;
    } finally {
      ready.value = true;
    }
  }
  async function signIn(
    mode: "login" | "register",
    values: {
      email: string;
      password: string;
      name?: string;
      termsAccepted?: boolean;
      dataConsent?: boolean;
      legalVersion?: string;
    },
  ) {
    const current = ++revision.value;
    const account = await api<User>(`/auth/${mode}`, {
      method: "POST",
      body: values,
    });
    if (current === revision.value) {
      clearNuxtData((key) => key.startsWith("private:"));
      user.value = account;
      ready.value = true;
    }
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    revision.value++;
    user.value = null;
    clearNuxtData((key) => key.startsWith("private:"));
    if (import.meta.client) {
      const channel = new BroadcastChannel("script-lab-session");
      channel.postMessage("logout");
      channel.close();
    }
    await navigateTo("/");
  }
  function clear() {
    revision.value++;
    user.value = null;
    clearNuxtData((key) => key.startsWith("private:"));
  }
  return { user, ready, restore, signIn, logout, clear };
}
