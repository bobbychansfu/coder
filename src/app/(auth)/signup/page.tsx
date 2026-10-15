import SignupPage from "@/fe/auth/page/SignupPage";

export default function SignupRoutePage() {
  const showDevSignup = process.env.NEXT_PUBLIC_AUTH_MODE === "dev";
  const showEmailSignup = process.env.NEXT_PUBLIC_EXTERNAL_SIGNUP_ENABLED === "true";

  return <SignupPage showDevSignup={showDevSignup} showEmailSignup={showEmailSignup} />;
}
