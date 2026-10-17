import GuestLoginPage from "@/fe/auth/page/GuestLoginPage";

interface GuestLoginRouteProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function GuestLoginRoute({ searchParams }: GuestLoginRouteProps) {
  const showGuestLogin = process.env.NEXT_PUBLIC_GUEST_LOGIN_ENABLED === "true";
  const showSignup = process.env.NEXT_PUBLIC_EXTERNAL_SIGNUP_ENABLED === "true";
  const { next } = await searchParams;

  return (
    <GuestLoginPage
      enabled={showGuestLogin || showSignup}
      showSignup={showSignup}
      next={typeof next === "string" ? next : null}
    />
  );
}
