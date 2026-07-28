"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { ErrorNote } from "@/admin/components/primitives";
import { useAdminAuth } from "@/admin/providers/AdminAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const LoginPage: React.FC = () => {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setIsLoading(true);
    setError(null);
    try {
      await login({
        username: String(form.get("username") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      router.replace("/admin");
    } catch (loginError) {
      setError(
        (loginError as Error)?.message ?? "Those details did not work.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div data-ink="azure" className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-[1.35rem] font-semibold tracking-[-0.025em] text-ink">
            Mathis Lambert<span className="text-coral">.</span>
          </p>
          <p className="t-eyebrow mt-2 text-ink-faint">Console</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="username" className="t-eyebrow text-ink">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="t-eyebrow text-ink">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? <ErrorNote message={error} /> : null}

          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="t-meta text-ink-muted no-underline hover:text-ink"
          >
            Back to the site
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
