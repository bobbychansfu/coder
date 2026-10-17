import SignupPage from "@/fe/auth/page/SignupPage";

interface SignupRouteProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function SignupRoutePage({ searchParams }: SignupRouteProps) {
  const showDevSignup = process.env.NEXT_PUBLIC_AUTH_MODE === "dev";
  const showEmailSignup = process.env.NEXT_PUBLIC_EXTERNAL_SIGNUP_ENABLED === "true";
  const { next } = await searchParams;

  return (
    <SignupPage
      showDevSignup={showDevSignup}
      showEmailSignup={showEmailSignup}
      next={typeof next === "string" ? next : null}
    />
  );
}
