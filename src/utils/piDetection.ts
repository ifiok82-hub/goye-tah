export const isPiBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Pi || navigator.userAgent.includes('PiBrowser');
};
