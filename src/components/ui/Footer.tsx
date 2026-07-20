"use client";

import { ArrowUpRight, Copy, Github, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "2.3.0";
const email = "mathislambert.dev@gmail.com";

const Footer = () => {
  const copyEmail = async () => {
    await navigator.clipboard.writeText(email);
    toast.success("Email copied to your clipboard");
  };

  return (
    <footer id="site-footer" className="relative z-[100] px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.25rem] bg-foreground text-background">
        <div className="grid gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:px-14 lg:py-14">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-background/60"><span className="size-2 rounded-full bg-[#f6bd60]" /> One more good idea?</p>
            <h2 className="font-display max-w-2xl text-4xl font-semibold leading-tight sm:text-6xl">Let&apos;s make it real.</h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-background/65">I&apos;m always happy to compare notes on AI infrastructure, useful products, and ambitious engineering problems.</p>
            <button type="button" onClick={copyEmail} className="group mt-7 inline-flex items-center gap-3 rounded-2xl bg-[#f6bd60] px-5 py-3.5 font-black text-[#263238] transition-transform hover:-translate-y-1">
              <Mail className="size-4" /> {email} <Copy className="size-4 opacity-50 transition-opacity group-hover:opacity-100" />
            </button>
          </div>

          <div className="flex flex-col justify-between gap-8 lg:items-end">
            <nav className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-sm" aria-label="Footer navigation">
              {[
                ["Projects", "/projects"],
                ["Notes", "/blog"],
                ["Resume", "/resume"],
                ["Admin", "/admin"],
              ].map(([label, href]) => (
                <Link key={href} href={href} className="flex items-center justify-between rounded-xl border border-background/10 px-4 py-3 text-sm font-bold text-background/75 transition-colors hover:bg-background/10 hover:text-background">{label}<ArrowUpRight className="size-3.5" /></Link>
              ))}
            </nav>
            <div className="flex gap-2">
              <Link href="https://github.com/mathis-lambert" target="_blank" rel="noopener noreferrer" aria-label="Mathis on GitHub" className="grid size-11 place-items-center rounded-xl border border-background/15 text-background/70 transition-colors hover:bg-background hover:text-foreground"><Github className="size-4.5" /></Link>
              <Link href="https://www.linkedin.com/in/mathis-lambert/" target="_blank" rel="noopener noreferrer" aria-label="Mathis on LinkedIn" className="grid size-11 place-items-center rounded-xl border border-background/15 text-background/70 transition-colors hover:bg-background hover:text-foreground"><Linkedin className="size-4.5" /></Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-background/10 px-6 py-5 text-[11px] font-bold uppercase tracking-[0.12em] text-background/45 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
          <p>© {new Date().getFullYear()} Mathis Lambert · Made with care in Marseille</p>
          <p>v{appVersion}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
