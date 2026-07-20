"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, MessageCircle, Moon, Sun, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useTheme } from "@/components/theme-provider";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Notes" },
  { href: "/resume", label: "Resume" },
];

const Navbar = () => {
  const pathname = usePathname();
  const { openChat } = useChat();
  const { resolvedTheme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  const startChat = useCallback(() => {
    setIsMenuOpen(false);
    openChat();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [openChat]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-[1001] px-3 pt-3 sm:px-6 sm:pt-4">
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="paper-surface mx-auto flex h-16 max-w-6xl items-center justify-between rounded-[1.4rem] px-2.5 sm:px-3"
      >
        <Link
          href="/"
          onClick={() => setIsMenuOpen(false)}
          className="group flex items-center gap-2.5 rounded-2xl p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Mathis Lambert, home"
        >
          <span className="relative">
            <Image
              src="/images/me.jpeg"
              alt=""
              width={42}
              height={42}
              priority
              className="size-10 rounded-xl object-cover ring-1 ring-foreground/10 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105"
            />
            <span className="absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-card bg-emerald-500" />
          </span>
          <span className="hidden leading-tight xs:block">
            <span className="font-display block text-[1.05rem] font-semibold">Mathis Lambert</span>
            <span className="block text-[0.64rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">AI · Systems · Web</span>
          </span>
        </Link>

        <nav className="hidden items-center rounded-2xl bg-foreground/[0.045] p-1 lg:flex" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "relative rounded-xl px-3.5 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground",
                isActive(link.href) && "bg-card text-foreground shadow-sm",
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId="active-navigation-dot"
                  className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle color theme"
          >
            <Sun className="hidden size-4.5 dark:block" />
            <Moon className="size-4.5 dark:hidden" />
          </button>
          <button
            type="button"
            onClick={startChat}
            className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-[0_6px_0_color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none sm:flex"
          >
            <MessageCircle className="size-4" /> Ask my AI
          </button>
          <Link
            href="https://www.linkedin.com/in/mathis-lambert/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden size-10 place-items-center rounded-xl border border-foreground/10 bg-card transition-transform hover:-rotate-3 hover:scale-105 sm:grid"
            aria-label="Connect with Mathis on LinkedIn"
          >
            <ArrowUpRight className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-xl border border-foreground/10 bg-card lg:hidden"
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            id="mobile-navigation"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="paper-surface mx-auto mt-2 max-w-6xl overflow-hidden rounded-[1.4rem] p-3 lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="grid gap-1">
              {navLinks.map((link, index) => (
                <motion.div key={link.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "font-display flex items-center justify-between rounded-2xl px-4 py-3 text-2xl font-semibold",
                      isActive(link.href) ? "bg-secondary/70" : "hover:bg-foreground/[0.04]",
                    )}
                  >
                    {link.label}<span className="text-sm font-sans text-muted-foreground">0{index + 1}</span>
                  </Link>
                </motion.div>
              ))}
              <button type="button" onClick={startChat} className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-primary-foreground">
                <MessageCircle className="size-4" /> Ask my AI
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
