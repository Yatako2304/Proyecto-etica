import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/env";

const PUBLIC_PATHS = ["/", "/login", "/registro", "/configurar"];
const GUEST_ONLY_PATHS = ["/", "/login", "/registro"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!isSupabaseConfigured()) {
    if (path === "/configurar") return NextResponse.next();
    return NextResponse.redirect(new URL("/configurar", request.url));
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = (target: string) => {
    const redirect = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && !PUBLIC_PATHS.includes(path)) {
    return redirectTo(`/login?next=${encodeURIComponent(path + request.nextUrl.search)}`);
  }
  if (user && GUEST_ONLY_PATHS.includes(path)) {
    return redirectTo("/explorar");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|ico)$).*)"],
};
