"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useTransition } from "react";

import ResumeView from "@/components/resume/ResumeView";
import { type ResumeLocale } from "@/lib/resume/localization";
import type { ResumeData } from "@/types/resume";

export function ResumePageContent({
  resume,
  initialLocale,
}: {
  resume: ResumeData | null;
  initialLocale: ResumeLocale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // The URL is the source of truth; the optimistic value only covers the gap
  // while the transition lands, which is what the old prop-syncing effect was
  // reaching for the long way round.
  const [locale, setLocale] = useOptimistic<ResumeLocale>(initialLocale);

  const onLocaleChange = (nextLocale: ResumeLocale) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextLocale === "fr") {
      nextParams.set("lang", "fr");
    } else {
      nextParams.delete("lang");
    }

    const nextUrl = nextParams.size
      ? `${pathname}?${nextParams.toString()}`
      : pathname;

    startTransition(() => {
      setLocale(nextLocale);
      router.replace(nextUrl, { scroll: false });
    });
  };

  return (
    <ResumeView
      resumeData={resume}
      locale={locale}
      onLocaleChange={onLocaleChange}
      localePending={isPending}
    />
  );
}
