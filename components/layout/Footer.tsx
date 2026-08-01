"use client";

import {
  ArrowUpRight,
  Check,
  Copy,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Eyebrow, Page, Title } from "@/components/ds";
import { externalLinkProps, isExternalHref } from "@/lib/ui/links";

/**
 * In production this is the release tag (`v3.0.1`), set from `github.ref_name`
 * in `cd.yaml`; the local fallback below has no prefix. Stripping a leading
 * "v" before the template adds its own is what keeps both cases rendering as
 * `v3.0.1` instead of the prod one rendering as `vv3.0.1`.
 */
const appVersion = (process.env.NEXT_PUBLIC_APP_VERSION || "2.3.0").replace(
  /^v/i,
  "",
);
const email = "mathislambert.dev@gmail.com";

const columns = [
  {
    heading: "Pages",
    links: [
      { label: "Projects", href: "/projects" },
      { label: "Notes", href: "/notes" },
      { label: "Resume", href: "/resume" },
    ],
  },
  {
    heading: "Elsewhere",
    links: [
      { label: "GitHub", href: "https://github.com/mathis-lambert" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/mathis-lambert/",
      },
    ],
  },
];

const Footer = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Email copied to your clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`Copy failed. The address is ${email}`);
    }
  };

  return (
    <footer id="site-footer" className="mt-16 bg-paper-invert text-ink-invert">
      <Page className="py-14 sm:py-18">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Eyebrow className="mb-4 text-ink-invert/55">
              <Mail className="size-3" />
              One more good idea?
            </Eyebrow>
            <Title level={2} className="max-w-xl text-ink-invert">
              Let&apos;s make it real.
            </Title>
            <p className="measure mt-5 text-ink-invert/65">
              Always happy to compare notes on AI infrastructure, useful
              products, and engineering problems that don&apos;t have a clean
              answer yet. Mail is the fastest way to reach me.
            </p>

            {/* The address is the button: nothing to hunt for, one tap to copy. */}
            <button
              type="button"
              onClick={copyEmail}
              className="group mt-7 inline-flex items-center gap-3 border-b border-ink-invert/30 pb-2 text-left font-display text-[clamp(1.1rem,2.6vw,1.6rem)] leading-tight text-ink-invert transition-colors duration-200 ease-(--ease-paper) hover:border-brand"
            >
              {email}
              {copied ? (
                <Check className="size-4 shrink-0 text-brand" />
              ) : (
                <Copy className="size-4 shrink-0 opacity-45 transition-opacity duration-200 group-hover:opacity-100" />
              )}
            </button>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            {columns.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <Eyebrow as="h2" className="mb-4 text-ink-invert/45">
                  {column.heading}
                </Eyebrow>
                <ul className="space-y-2.5">
                  {column.links.map((link) => {
                    const external = isExternalHref(link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          {...externalLinkProps(link.href)}
                          className="group inline-flex items-center gap-1.5 text-sm font-bold text-ink-invert/70 no-underline transition-colors duration-200 hover:text-ink-invert"
                        >
                          {link.label}
                          {external ? (
                            <ArrowUpRight className="size-3.5 transition-transform duration-200 ease-(--ease-paper) group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-ink-invert/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-meta text-ink-invert/45">
            © {new Date().getFullYear()} Mathis Lambert · written and built in
            Marseille
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/mathis-lambert"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mathis on GitHub"
              className="text-ink-invert/55 transition-colors duration-200 hover:text-ink-invert"
            >
              <Github className="size-4.5" />
            </Link>
            <Link
              href="https://www.linkedin.com/in/mathis-lambert/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mathis on LinkedIn"
              className="text-ink-invert/55 transition-colors duration-200 hover:text-ink-invert"
            >
              <Linkedin className="size-4.5" />
            </Link>
            <span className="t-meta text-ink-invert/35">v{appVersion}</span>
          </div>
        </div>
      </Page>
    </footer>
  );
};

export default Footer;
