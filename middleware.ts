import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Inline the updateSession helper to avoid Edge Function module resolution issues
async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, supabaseResponse };
}

// Routes that require authentication
const protectedPrefixes = ["/student", "/kiosk", "/admin"];

// Role-based home routes
const roleHomeRoutes: Record<string, string> = {
  student: "/student/home",
  kiosk_owner: "/kiosk/items",
  super_admin: "/admin/kiosks",
};

// Auth routes (redirect away if already logged in)
const authRoutes = ["/auth/student", "/auth/kiosk", "/x-control-9f3k"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh Supabase auth session
  const { supabase, user, supabaseResponse } = await updateSession(request);

  // Add X-Robots-Tag: noindex for super admin route
  if (pathname.startsWith("/x-control-9f3k")) {
    supabaseResponse.headers.set("X-Robots-Tag", "noindex");
  }

  // Check if route is protected
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Block unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth routes to their role home
  if (user && (isAuthRoute || pathname === "/")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        const homeRoute = roleHomeRoutes[profile.role as string];
        if (homeRoute && pathname !== homeRoute) {
          const url = request.nextUrl.clone();
          url.pathname = homeRoute;
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // Profile may not exist yet (e.g., during initial signup flow)
    }
  }

  // For protected routes, verify the user has the correct role
  if (isProtectedRoute && user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role) {
        const rolePrefixMap: Record<string, string> = {
          student: "/student",
          kiosk_owner: "/kiosk",
          super_admin: "/admin",
        };
        const allowedPrefix = rolePrefixMap[profile.role as string];

        if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
          const homeRoute = roleHomeRoutes[profile.role as string];
          if (homeRoute) {
            const url = request.nextUrl.clone();
            url.pathname = homeRoute;
            return NextResponse.redirect(url);
          }
        }
      }
    } catch {
      // Allow request to continue if profile check fails
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
