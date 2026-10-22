export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ok<T>(data: T, status = 200) {
  return Response.json({ data }, { status });
}

export function fail(error: string, status = 500) {
  return Response.json({ error }, { status });
}

export function nowIso() {
  return new Date().toISOString();
}
