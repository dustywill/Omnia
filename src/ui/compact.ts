export const compactNestedData = (data: unknown, depth: number): unknown => {
  if (depth < 0) {
    return '[...]';
  }
  if (Array.isArray(data)) {
    if (depth === 0) return '[...]';
    return data.map((item) => compactNestedData(item, depth - 1));
  }
  if (data && typeof data === 'object') {
    if (depth === 0) return '[...]';
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = compactNestedData(value, depth - 1);
    }
    return result;
  }
  return data;
};
