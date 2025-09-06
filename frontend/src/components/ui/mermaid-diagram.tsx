import React, { useEffect, useRef } from 'react';

type MmdTheme = 'default' | 'base' | 'dark' | 'forest' | 'neutral' | undefined;
type Layout = 'dagre' | 'elk' | undefined;

const FRONTMATTER_RE = /^\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

function extractConfigAndBody(src: string): {
  theme?: MmdTheme;
  layout?: Layout;
  body: string;
} {
  const m = src.match(FRONTMATTER_RE);
  if (!m) return { body: src };

  const front = m[1];
  const body = src.slice(m[0].length).replace(/^\s+/, '');

  // chercher bloc "config:" puis lignes indentées "key: value"
  const cfgStart = front.search(/(^|\r?\n)config:\s*\r?$/m);
  if (cfgStart === -1) return { body };

  const after = front.slice(cfgStart).split(/\n/g).slice(1);

  let theme: MmdTheme | undefined;
  let layout: Layout | undefined;

  for (const raw of after) {
    const m2 = raw.match(/^\s*([\w-]+):\s*(.+?)\s*$/);
    if (!m2) continue;
    const key = m2[1];
    const val = m2[2].replace(/^["']|["']$/g, '');
    if (key === 'theme') theme = val as MmdTheme;
    if (key === 'layout') layout = val as Layout;
  }

  return { theme, layout, body };
}

export const MermaidDiagram: React.FC<{
  source: string;
  className?: string;
}> = ({ source, className }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    (async () => {
      if (typeof window === 'undefined') return;
      const mod = await import('mermaid');
      const mermaid = mod.default ?? mod;

      const { theme, layout, body } = extractConfigAndBody(source);

      mermaid.initialize({ startOnLoad: false, theme: theme, layout: layout });

      try {
        const res = await mermaid.render(id, body);
        const svg = typeof res === 'string' ? res : (res.svg ?? res);
        if (mounted && ref.current) ref.current.innerHTML = svg;
      } catch (e) {
        if (mounted && ref.current)
          ref.current.textContent = 'Erreur mermaid: ' + String(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [source]);

  return <div ref={ref} className={className ?? 'my-4 prose-mermaid'} />;
};
