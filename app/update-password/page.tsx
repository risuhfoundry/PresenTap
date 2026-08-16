import { Brand } from "@/components/brand";
import { UpdatePasswordForm } from "./update-password-form";

/**
 * Standalone password-reset page. Reached from the reset email (a recovery
 * session), not behind the auth layout. The server component reads the optional
 * `error` query param so the client form can surface a safe message.
 */
export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error
    ? decodeURIComponent(searchParams.error)
    : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background-subtle px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <UpdatePasswordForm initialError={error} />
      </div>
    </main>
  );
}
