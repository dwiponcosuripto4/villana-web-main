import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  return {
    user: event.locals.user,
    session: event.locals.session,
    cookies: event.cookies.getAll(),
    pathname: event.url.pathname,
  };
};
