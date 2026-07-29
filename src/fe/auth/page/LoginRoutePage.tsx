import LoginPage from "@/fe/auth/page/LoginPage";

export default function LoginRoutePage() {
  const showDevQuickAccess = process.env.NEXT_PUBLIC_AUTH_MODE === "dev";
  const showGuestLogin = process.env.NEXT_PUBLIC_GUEST_LOGIN_ENABLED === "true";

  return <LoginPage showDevQuickAccess={showDevQuickAccess} showGuestLogin={showGuestLogin} />;
}
