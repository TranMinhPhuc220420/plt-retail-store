export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const generateCacheKey = (prefix: string, ...args: (string | number)[]): string => {
  return `${prefix}:${args.join(':')}`;
}