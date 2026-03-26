"use client";

import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import Resume from "@/components/ui/Resume";
import type { ResumeData } from "@/types";
import { type ResumeLocale } from "@/lib/resume/localization";

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
  const [locale, setLocale] = useState<ResumeLocale>(initialLocale);

  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  const onLocaleChange = (nextLocale: ResumeLocale) => {
    setLocale(nextLocale);

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
      router.replace(nextUrl, { scroll: false });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: "easeOut" }}
    >
      <Resume
        resumeData={resume}
        locale={locale}
        onLocaleChange={onLocaleChange}
        localePending={isPending}
      />
    </motion.div>
  );
}
