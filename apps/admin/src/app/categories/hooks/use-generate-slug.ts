import { useMemo } from 'react';

export function useGenerateSlug(name: string): string {
  return useMemo(() => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [name]);
}
