/**
 * Generic utility functions for Employee Lifecycle Management (ELM) API routes.
 * Provides snake_case ↔ camelCase conversion for all ELM tables.
 */

/** Convert a snake_case string to camelCase */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Convert a camelCase string to snake_case */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Convert a snake_case DB row to camelCase object */
export function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }
  return result;
}

/** Convert a camelCase payload to snake_case DB insert payload */
export function denormalizePayload(
  payload: Record<string, unknown>,
  excludeKeys: string[] = []
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (excludeKeys.includes(key)) continue;
    result[camelToSnake(key)] = value;
  }
  return result;
}

/** Build a standard ELM list response */
export function buildListResponse(
  data: Record<string, unknown>[],
  total: number,
  page: number,
  limit: number,
  message = 'Records fetched successfully'
) {
  return {
    success: true,
    data: data.map(normalizeRow),
    message,
    errors: null,
    meta: { page, limit, total },
  };
}

/** Build a standard ELM single record response */
export function buildSingleResponse(
  data: Record<string, unknown>,
  message = 'Record fetched successfully'
) {
  return {
    success: true,
    data: normalizeRow(data),
    message,
    errors: null,
  };
}
