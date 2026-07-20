export interface AvUser {
  name: string;
}

const EVENT = "av-user-change";

let cachedRaw: string | null = null;
let cachedUser: AvUser | null = null;

export function getAvUser(): AvUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("av_user");
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedUser = raw ? JSON.parse(raw) : null;
    } catch {
      cachedUser = null;
    }
  }
  return cachedUser;
}

export function setAvUser(user: AvUser | null) {
  localStorage.setItem("av_user", JSON.stringify(user));
  window.dispatchEvent(new Event(EVENT));
}

export function clearAvUser() {
  localStorage.removeItem("av_user");
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeAvUser(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
