import ForgotPasswordClient from "./forgot-password-client";

export const metadata = {
  title: "Reset Password | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
