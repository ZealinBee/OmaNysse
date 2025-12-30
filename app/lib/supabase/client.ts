import { createBrowserClient } from "@supabase/ssr";

// Singleton instance to ensure consistent auth state
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookieOptions: {
        // Set cookies to expire in 1 year (maximum reasonable value)
        maxAge: 60 * 60 * 24 * 365,
        // Ensure cookies persist across browser sessions
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    }
  );

  return client;
}
