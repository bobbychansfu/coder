import LoginPage from "@/fe/auth/page/LoginPage";

export default function LoginRoutePage() {
  const showDevQuickAccess = process.env.NEXT_PUBLIC_AUTH_MODE === "dev";

  return <LoginPage showDevQuickAccess={showDevQuickAccess} />;
}
