import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const DASHBOARD_PATHS = ["/dashboard", "/audit", "/recommendations", "/settings", "/billing"];
const AUTH_PATHS = ["/login", "/signup"];

function matchesPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Refresh the Supabase session inside middleware and attach the
 * updated response cookies. Redirects unauthenticated users away
 * from protected pages and authenticated users away from auth pages.
 *
 * This function is intentionally defensive: if Supabase env vars are
 * missing or the session refresh fails for any reason, it degrades to
 * a plain pass-through response instead of throwing and taking down
 * every page with a 500 MIDDLEWARE_INVOCATION_FAILED.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, do not attempt session logic.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT: do not run code between createServerClient and getUser()
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    if (!user && matchesPath(pathname, DASHBOARD_PATHS)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (user && matchesPath(pathname, AUTH_PATHS)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    // Never let middleware throw and 500 the whole site.
    return NextResponse.next({ request });
  }
}
