type LoginAttempt = {
  count: number;
  blockedUntil: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 30 * 1000;

export const checkLoginRateLimit = (email: string) => {
  const now = Date.now();
  const attempt = loginAttempts.get(email);

  if (!attempt) {
    return {
      allowed: true,
      remainingSeconds: 0,
    };
  }

  if (attempt.blockedUntil > now) {
    return {
      allowed: false,
      remainingSeconds: Math.ceil(
        (attempt.blockedUntil - now) / 1000,
      ),
    };
  }

  if (attempt.blockedUntil !== 0) {
    loginAttempts.delete(email);
  }

  return {
    allowed: true,
    remainingSeconds: 0,
  };
};

export const recordFailedLogin = (email: string) => {
  const now = Date.now();

  const attempt = loginAttempts.get(email);

  if (!attempt) {
    loginAttempts.set(email, {
      count: 1,
      blockedUntil: 0,
    });
    return;
  }

  attempt.count++;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_TIME_MS;
  }

  loginAttempts.set(email, attempt);
};

export const clearFailedLogin = (email: string) => {
  loginAttempts.delete(email);
};