import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the request cookies
          request.cookies.set({ name, value, ...options });
          // Update the response cookies
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete( {name,  ...options } );
          supabaseResponse.cookies.delete({ name,  ...options });
        },
      },
    },
  );

  // This refreshes the session if it's expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect the /chat route
  if (!user && request.nextUrl.pathname.startsWith("/chat")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // MUST return the modified supabaseResponse, not a new NextResponse.next()
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Added auth/callback to the ignore list
    "/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
