type GoogleProfileInput = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  picture?: unknown;
};

export type GoogleProfile = {
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
};

export function parseGoogleProfile(profile: unknown): GoogleProfile | null {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const candidate = profile as GoogleProfileInput;

  if (typeof candidate.email !== "string") {
    return null;
  }

  return {
    email: candidate.email,
    emailVerified: candidate.email_verified === true,
    name: typeof candidate.name === "string" ? candidate.name : null,
    image: typeof candidate.picture === "string" ? candidate.picture : null,
  };
}
