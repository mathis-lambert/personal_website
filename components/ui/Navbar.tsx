"use client";

import { Menu, MessageCircle, Moon, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Action, IconAction, LiftText, Wordmark } from "@/components/ds";
import { useTheme } from "@/components/theme-provider";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Work" },
  { href: "/notes", label: "Notes" },
  { href: "/resume", label: "Resume" },
];

/**
 * A floating glass bar, inset from the page edges so the blur picks up colour
 * from the ambient field behind it. One breakpoint (`md`).
 */
const Navbar = () => {
  const pathname = usePathname();
  const { openChat } = useChat();
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const startChat = useCallback(() => {
    setMenuOpen(false);
    openChat();
  }, [openChat]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-[200] pt-3 sm:pt-4">
      <div className="page">
        <div className="glass flex h-16 items-center justify-between gap-3 rounded-full pl-4 pr-2.5 sm:pl-5 sm:pr-3">
          <Link
            href="/"
            className="group flex items-center gap-2.5 no-underline"
            aria-label="Mathis Lambert, home"
          >
            <Wordmark
              name="Mathis Lambert"
              accent="."
              className="font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.025em] text-ink"
            />
          </Link>

          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Primary"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={isActive(link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className="link-slide text-sm font-bold no-underline"
              >
                <LiftText rise={0.22} reach={44}>
                  {link.label}
                </LiftText>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <IconAction
              tone="ghost"
              label="Toggle colour theme"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun className="hidden dark:block" />
              <Moon className="dark:hidden" />
            </IconAction>

            <Action
              tone="ink"
              size="sm"
              onClick={startChat}
              className="hidden md:inline-flex"
            >
              <MessageCircle /> Ask my AI
            </Action>

            <IconAction
              tone="ghost"
              label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden"
            >
              {menuOpen ? <X /> : <Menu />}
            </IconAction>
          </div>
        </div>

        {/* Kept mounted and inert when closed so it can animate shut. */}
        <div className="sheet md:hidden" data-open={menuOpen}>
          <div>
            <nav
              id="mobile-nav"
              aria-label="Primary"
              aria-hidden={!menuOpen}
              className="glass mt-2 rounded-4 p-2"
            >
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  tabIndex={menuOpen ? undefined : -1}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    transitionDelay: menuOpen ? `${70 + index * 45}ms` : "0ms",
                  }}
                  className={cn(
                    "t-h3 flex items-baseline justify-between rounded-3 px-3 py-3 no-underline",
                    "transition-[opacity,transform] duration-200 ease-(--ease-paper)",
                    menuOpen
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-2 opacity-0",
                    isActive(link.href)
                      ? "bg-brand-wash text-brand"
                      : "text-ink hover:bg-paper-sink",
                  )}
                >
                  {link.label}
                  <span className="t-meta">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
              <Action
                tone="ink"
                size="lg"
                onClick={startChat}
                tabIndex={menuOpen ? undefined : -1}
                className="mt-2 w-full"
              >
                <MessageCircle /> Ask my AI
              </Action>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
