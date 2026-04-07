import SignupPage from "@/fe/auth/page/SignupPage";

export default function SignupRoutePage() {
  const showDevSignup = process.env.NEXT_PUBLIC_AUTH_MODE === "dev";

  return <SignupPage showDevSignup={showDevSignup} />;
}
