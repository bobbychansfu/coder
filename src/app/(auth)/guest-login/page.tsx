import GuestLoginPage from "@/fe/auth/page/GuestLoginPage";

export default function GuestLoginRoute() {
  const showGuestLogin = process.env.NEXT_PUBLIC_GUEST_LOGIN_ENABLED === "true";
  const showSignup = process.env.NEXT_PUBLIC_EXTERNAL_SIGNUP_ENABLED === "true";

  return <GuestLoginPage enabled={showGuestLogin || showSignup} showSignup={showSignup} />;
}
