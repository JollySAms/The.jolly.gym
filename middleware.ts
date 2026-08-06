import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isSignInPage = createRouteMatcher(["/sign-in"]);
const isProtectedRoute = createRouteMatcher([
  '/agenda(.*)',
  '/groups(.*)',
  '/workouts(.*)',
  '/attendance(.*)',
  '/client-progress(.*)',
  '/home(.*)',
  '/sessions(.*)',
  '/progression(.*)',
]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    // Redirect authenticated users away from sign-in page
    if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/");
    }
    // Redirect unauthenticated users to sign-in
    if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/sign-in");
    }
  },
  {
    // Persist auth cookies for 90 days so users stay logged in
    // even after closing the app. Without this, cookies are "session"
    // cookies that get cleared when the browser/PWA is closed.
    cookieConfig: { maxAge: 60 * 60 * 24 * 90 }, // 90 days (matches inactiveDurationMs)
  },
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
