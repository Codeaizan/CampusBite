import { NextResponse, type NextRequest } from "next/server";

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars missing, pass through
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Add X-Robots-Tag: noindex for super admin route
  if (pathname.startsWith("/x-control-9f3k")) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Only run auth checks on protected or auth routes (or landing page)
  if (!isProtectedRoute && !isAuthRoute && pathname !== "/") {
    return response;
  }

  // Get user from Supabase auth cookies using raw fetch (Edge-compatible)
  let user: { id: string } | null = null;

  try {
    // Read Supabase auth tokens from cookies
    const accessToken = getSupabaseCookie(request, "access_token");
    const refreshToken = getSupabaseCookie(request, "refresh_token");

    if (accessToken) {
      // Verify the access token by calling Supabase auth API
      const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseAnonKey,
        },
      });

      if (authRes.ok) {
        const userData = await authRes.json();
        user = { id: userData.id };
      } else if (refreshToken) {
        // Try refresh
        const refreshRes = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }
        );

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          user = { id: refreshData.user.id };

          // Set refreshed cookies on the response
          const cookieBase = getSupabaseCookieBase(request);
          if (cookieBase) {
            response.cookies.set(`${cookieBase}-access-token`, refreshData.access_token, {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: true,
              maxAge: refreshData.expires_in,
            });
            response.cookies.set(`${cookieBase}-refresh-token`, refreshData.refresh_token, {
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: true,
              maxAge: 60 * 60 * 24 * 365, // 1 year
            });
          }
        }
      }
    }
  } catch {
    // Auth check failed — treat as unauthenticated
  }

  // Block unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth/landing to role home
  if (user && (isAuthRoute || pathname === "/")) {
    const role = await getUserRole(supabaseUrl, supabaseAnonKey, user.id);
    if (role) {
      const homeRoute = roleHomeRoutes[role];
      if (homeRoute && pathname !== homeRoute) {
        const url = request.nextUrl.clone();
        url.pathname = homeRoute;
        return NextResponse.redirect(url);
      }
    }
  }

  // Verify role-based access on protected routes
  if (isProtectedRoute && user) {
    const role = await getUserRole(supabaseUrl, supabaseAnonKey, user.id);
    if (role) {
      const rolePrefixMap: Record<string, string> = {
        student: "/student",
        kiosk_owner: "/kiosk",
        super_admin: "/admin",
      };
      const allowedPrefix = rolePrefixMap[role];
      if (allowedPrefix && !pathname.startsWith(allowedPrefix)) {
        const homeRoute = roleHomeRoutes[role];
        if (homeRoute) {
          const url = request.nextUrl.clone();
          url.pathname = homeRoute;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return response;
}

// Helper: Get user role from profiles table via Supabase REST API
async function getUserRole(
  supabaseUrl: string,
  supabaseAnonKey: string,
  userId: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=role&id=eq.${userId}&limit=1`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) return data[0].role;
    }
  } catch {
    // Failed to fetch role
  }
  return null;
}

// Helper: Extract Supabase auth cookie base name
function getSupabaseCookieBase(request: NextRequest): string | null {
  const cookies = request.cookies.getAll();
  for (const cookie of cookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token.0")) {
      return cookie.name.replace("-auth-token.0", "");
    }
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-access-token")) {
      return cookie.name.replace("-access-token", "");
    }
  }
  return null;
}

// Helper: Get specific Supabase auth cookie value
function getSupabaseCookie(request: NextRequest, type: "access_token" | "refresh_token"): string | null {
  const cookies = request.cookies.getAll();
  const suffix = type === "access_token" ? "-access-token" : "-refresh-token";

  // Check for chunked cookie (sb-xxx-auth-token.0, .1, etc.)
  const chunkedPrefix = cookies.find((c) =>
    c.name.startsWith("sb-") && c.name.endsWith("-auth-token.0")
  );

  if (chunkedPrefix) {
    // Supabase stores session as JSON in chunked cookies
    const base = chunkedPrefix.name.replace("-auth-token.0", "");
    let fullValue = "";
    let i = 0;
    while (true) {
      const chunk = request.cookies.get(`${base}-auth-token.${i}`);
      if (!chunk) break;
      fullValue += chunk.value;
      i++;
    }
    try {
      const session = JSON.parse(fullValue);
      return type === "access_token" ? session.access_token : session.refresh_token;
    } catch {
      return null;
    }
  }

  // Check for individual token cookies (new format)
  for (const cookie of cookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith(suffix)) {
      return cookie.value;
    }
  }

  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
