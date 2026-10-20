"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthDivider } from "@/components/auth/auth-divider";
import { LocalDevLoginSlot } from "@/components/auth/local-dev-login";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { authClient } from "@/lib/auth-client";
import { getCallbackURL } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

function getNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "User";
  }

  return localPart.replace(/[^a-zA-Z0-9._-]/g, " ") || "User";
}

function getAuthErrorMessage(code: string | null) {
  switch (code) {
    case "new_user_signup_disabled":
      return "This email is not registered yet. Request a new sign-in link to create your account.";
    case "INVALID_TOKEN":
    case "token_expired":
      return "That sign-in link has expired. Request a new one below.";
    default:
      return code
        ? "We could not sign you in. Request a new link and try again."
        : null;
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    setError(getAuthErrorMessage(searchParams.get("error")));
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { error: signInError } = await authClient.signIn.magicLink({
      email,
      name: getNameFromEmail(email),
      callbackURL: getCallbackURL("/s"),
      errorCallbackURL: getCallbackURL("/login"),
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message ?? "Unable to log in. Please try again.");
      return;
    }

    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="border-border bg-card rounded-none border px-4 py-5 text-center shadow-xs">
        <p className="text-card-foreground text-sm font-semibold">
          Check your email
        </p>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          We sent a sign-in link to{" "}
          <span className="text-foreground font-medium">{email}</span>. Click
          the link to continue to Devin.
        </p>
      </div>
    );
  }

  return (
    <>
      <LocalDevLoginSlot disabled={isSubmitting} />

      <SocialAuthButtons />

      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={cn(
            "border-input bg-background w-full rounded-none border px-4 py-2.5",
            "text-foreground placeholder:text-muted-foreground text-sm shadow-xs",
            "focus:border-ring focus:ring-ring transition-colors outline-none focus:ring-1",
          )}
        />

        {error ? (
          <p className="text-destructive text-center text-xs">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "bg-primary text-primary-foreground w-full cursor-pointer rounded-none px-4 py-2.5 text-sm font-semibold shadow-xs",
            "hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting ? "Sending link..." : "Log in"}
        </button>
      </form>
    </>
  );
}
