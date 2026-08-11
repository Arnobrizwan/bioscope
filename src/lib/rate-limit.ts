type WindowState = { count: number; resetsAt: number };

const windows = new Map<string, WindowState>();

// Lightweight per-instance protection suitable for a prototype. Production multi-region
// deployments should replace this with a shared store such as Vercel KV or Upstash.
export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetsAt <= now) {
    windows.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
  };
}

export function requestIdentity(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"
  );
}
