const JUST_RETURNED_KEY = "summify.auth.justReturned";
const JUST_RETURNED_COOKIE = "summify_auth_just_returned";

export function markAuthJustReturned(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(JUST_RETURNED_KEY, "1");
}

export function consumeAuthJustReturned(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  const fromStorage = sessionStorage.getItem(JUST_RETURNED_KEY) === "1";
  if (fromStorage) {
    sessionStorage.removeItem(JUST_RETURNED_KEY);
  }

  let fromCookie = false;
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((row) => row.startsWith(`${JUST_RETURNED_COOKIE}=`));
    if (match?.endsWith("=1")) {
      fromCookie = true;
      document.cookie = `${JUST_RETURNED_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
  }

  return fromStorage || fromCookie;
}

export function peekAuthJustReturned(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  if (sessionStorage.getItem(JUST_RETURNED_KEY) === "1") return true;
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((row) => row.startsWith(`${JUST_RETURNED_COOKIE}=1`));
}

export const AUTH_JUST_RETURNED_COOKIE = JUST_RETURNED_COOKIE;
