import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Refreshes the auth session on every request and guards protected routes.
 *
 * This is the FIRST of two layers. RLS in the database is the second, and the
 * one that actually matters (Memory.md D-006). A bug here must not become a
 * data breach.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Customer area requires a session.
  if (path.startsWith("/account") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Admin area requires a staff role. Anything else gets a 404, not a 403 —
  // the existence of /admin is not information a customer needs.
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const staffRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR"];
    if (!profile || !staffRoles.includes(profile.role as string)) {
      return NextResponse.rewrite(new URL("/404", request.url));
    }
  }

  return response;
}
