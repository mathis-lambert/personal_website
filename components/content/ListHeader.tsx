import type { ReactNode } from "react";

import { Display, Eyebrow, Lead } from "@/components/ds";

/** The masthead every index page shares: kicker, display title, standfirst. */
export function ListHeader({
  eyebrow,
  icon,
  title,
  deck,
}: {
  eyebrow: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  deck?: ReactNode;
}) {
  return (
    <header className="pb-10 pt-8 sm:pb-12 sm:pt-12">
      <Eyebrow brand className="mb-4">
        {icon ? <span className="[&_svg]:size-3.5">{icon}</span> : null}
        {eyebrow}
      </Eyebrow>
      <Display>{title}</Display>
      {deck ? <Lead className="mt-5">{deck}</Lead> : null}
    </header>
  );
}
