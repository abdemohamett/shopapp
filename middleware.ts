import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthed = request.cookies.get("auth")?.value === "true";
  const { pathname } = request.nextUrl;

  const isAsset = pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.[a-zA-Z0-9]+$/.test(pathname);

  const isPublicPath = pathname === "/" || isAsset;

  if (!isAuthed && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"],
};


