import ResetPasswordClient from "./reset-password-client";

export const metadata = {
  title: "Choose a New Password | VictoryCity Revival Ministry",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <ResetPasswordClient initialError={error === "invalid_link"} />
  );
}
