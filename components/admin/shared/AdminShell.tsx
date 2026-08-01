"use client";

import { ExternalLink, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { ADMIN_NAV, inkForPath } from "@/components/admin/config/navigation";
import { useAdminAuth } from "@/components/admin/providers/AdminAuthProvider";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/admin";

  return (
    <nav className="flex flex-col gap-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.label} data-ink={group.ink}>
          <p className="t-eyebrow mb-2 px-3 text-ink-faint">{group.label}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-2 px-3 py-2 font-mono text-[0.7rem] uppercase tracking-wider no-underline transition-colors duration-150",
                      active
                        ? "bg-brand-wash font-semibold text-brand"
                        : "text-ink-muted hover:bg-paper-sink hover:text-ink",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Rail({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAdminAuth();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-3 pt-1">
        <p className="font-display text-[1.0625rem] font-semibold leading-none tracking-[-0.025em] text-ink">
          Mathis Lambert<span className="text-coral">.</span>
        </p>
        <p className="t-eyebrow mt-1.5 text-ink-faint">Console</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href="/"
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "justify-start")}
        >
          <ExternalLink /> View site
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          className="justify-start text-ink-muted hover:text-destructive"
        >
          <LogOut /> Sign out
        </Button>
      </div>
    </div>
  );
}

/**
 * The console shell.
 *
 * `data-ink` on the whole frame is set from the current section, so every brand
 * colour inside a screen tracks where you are: blue while reading the audience,
 * coral while publishing, green in the CV.
 *
 * Responsive: a rail on wide screens, the same nav in a sheet on narrow ones.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  // Closed from the link's own click handler, not from an effect on the path.
  const [navOpen, setNavOpen] = useState(false);
  const isEditorialWorkspace = /^\/admin\/(notes|projects)\/(new|[^/]+)$/.test(pathname);

  if (isEditorialWorkspace) {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  return (
    <div data-ink={inkForPath(pathname)} className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-paper-lift lg:block">
        <Rail />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper-lift/90 px-4 backdrop-blur lg:hidden">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
              />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <Rail onNavigate={() => setNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <p className="font-display text-[0.9375rem] font-semibold tracking-[-0.02em]">
          Console
        </p>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-[80rem] px-5 py-7 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
