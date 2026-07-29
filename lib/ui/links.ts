/** Leaves the site. `mailto:`/`tel:` count; they just don't get a new tab. */
export const isExternalHref = (href: string) =>
  /^(https?:)?\/\/|^mailto:|^tel:/.test(href);

/** Spread onto an anchor. Returns nothing for internal links. */
export const externalLinkProps = (href: string) =>
  /^(https?:)?\/\//.test(href)
    ? ({ target: "_blank", rel: "noopener noreferrer" } as const)
    : null;
