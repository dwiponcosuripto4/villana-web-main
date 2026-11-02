import { sequence } from "@sveltejs/kit/hooks";
import * as auth from "$lib/server/auth";
import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";

import { loadEnv } from "$lib/server/utils/env";
loadEnv();

const handleLogging: Handle = async ({ event, resolve }) => {
  // const url = new URL(event.request.url);
  // const hostname = url.hostname;
  // const origin = event.request.headers.get("origin");
  // const host = event.request.headers.get("host");

  // console.log(`[REQUEST] ${event.request.method} ${event.url.pathname}`);
  // console.log(`[HOSTNAME] ${hostname}`);
  // console.log(`[HOST_HEADER] ${host}`);
  // console.log(`[ORIGIN_HEADER] ${origin}`);
  // console.log("---");

  return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace("%paraglide.lang%", locale),
    });
  });

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    auth.deleteSessionTokenCookie(event);
  }

  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
};

export const handle: Handle = sequence(
  handleLogging,
  handleParaglide,
  handleAuth,
);
