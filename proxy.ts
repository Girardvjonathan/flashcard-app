import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const isSignedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/sign-in");
  const isApiAuthRoute = pathname.startsWith("/api/auth");

  if (isApiAuthRoute) return NextResponse.next();

  if (!isSignedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isSignedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/flashcards", req.url));
  }

  return NextResponse.next();
});

export const proxyConfig = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
