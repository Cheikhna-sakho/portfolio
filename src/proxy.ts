import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales, segments, type Locale } from "@/i18n/config";

function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return (ranked.find((entry) => hasLocale(entry.lang))?.lang as Locale) ?? defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, first, second, ...rest] = pathname.split("/");

  if (!first || !hasLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  if (!second) return NextResponse.next();

  // Each locale has its own public segment name; the file system uses the English one.
  for (const [internal, names] of Object.entries(segments)) {
    const tail = rest.length ? `/${rest.join("/")}` : "";
    if (second === names[first]) {
      if (second === internal) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = `/${first}/${internal}${tail}`;
      return NextResponse.rewrite(url);
    }
    // Wrong-locale segment (e.g. /fr/projects): redirect to the canonical one.
    if (locales.some((l) => names[l] === second)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${first}/${names[first]}${tail}`;
      return NextResponse.redirect(url, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|cv/|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|.*\\..*).*)"],
};
