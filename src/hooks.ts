import { setLocale, deLocalizeUrl } from "$lib/paraglide/runtime";

setLocale("id");

export const reroute = (request) => deLocalizeUrl(request.url).pathname;
