import GuestLoginPage from "@/fe/auth/page/GuestLoginPage";

export default function GuestLoginRoute() {
  return <GuestLoginPage enabled={process.env.NEXT_PUBLIC_GUEST_LOGIN_ENABLED === "true"} />;
}
