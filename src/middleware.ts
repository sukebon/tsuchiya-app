import { decode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import * as nextauth from "next-auth/react";
import {cookies} from "next/headers"

export default async function middleware(req: NextRequest) {
  // const token =  req.cookies.get("authjs.session-token")?.value
  const token = cookies().get("authjs.session-token")?.value
  return decode({
    token,
    salt: "authjs.session-token" as string,
    secret: process.env.AUTH_SECRET as string,
  })
    .then((decoded) => {
      if (decoded?.uid) {
        return null;
      }
      return NextResponse.redirect(req.nextUrl.origin + "/auth/login");
    })
    .catch((e) => {
      console.log(e);
      return NextResponse.redirect(req.nextUrl.origin + "/auth/login");
    });
}

export const config = {
  matcher: ["/", "/products/:path*", "/dashboard/:path*"],
};
