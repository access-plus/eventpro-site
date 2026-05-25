const STORAGE_KEYS = {
  accessToken: "accessToken",
  guestCart: "eventpro_cart",
  guestCartSavedAt: "eventpro_cart_saved_at",
  recentlyViewed: "eventpro_recently_viewed",
  notificationPreferences: "eventpro_notification_preferences",
  language: "eventpro_language",
  profilePrivacy: "eventpro_profile_privacy",
  identityDraft: "eventpro_identity_check_draft",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function remove(keys: string[]) {
  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

export const appStorage = {
  keys: STORAGE_KEYS,
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),
  setAccessToken: (token: string) => localStorage.setItem(STORAGE_KEYS.accessToken, token),
  clearAccessToken: () => localStorage.removeItem(STORAGE_KEYS.accessToken),
  readJson,
  writeJson,
  remove,
  clearGuestCart: () => remove([STORAGE_KEYS.guestCart, STORAGE_KEYS.guestCartSavedAt]),
  clearUserScopedState: () =>
    remove([
      STORAGE_KEYS.accessToken,
      STORAGE_KEYS.guestCart,
      STORAGE_KEYS.guestCartSavedAt,
      STORAGE_KEYS.profilePrivacy,
      STORAGE_KEYS.identityDraft,
    ]),
};
