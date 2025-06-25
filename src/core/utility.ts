import path from 'path';

export const sanitizeAbsolutePath = (p: string): string => {
  if (!p) throw new Error('Path is required');
  return path.normalize(path.resolve(p));
};
