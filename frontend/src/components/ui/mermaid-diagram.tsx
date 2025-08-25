import React, { useEffect, useRef } from 'react';

export const MermaidDiagram: React.FC<{ source: string }> = ({ source }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

    (async () => {
      if (typeof window === 'undefined') return; // SSR guard
      const mod = await import('mermaid');
      const mermaid = mod.default ?? mod; // safe with TS
      mermaid.initialize({ startOnLoad: false });
      try {
        // mermaid.render renvoie une Promise
        const result = await mermaid.render(id, source);
        const svg =
          typeof result === 'string' ? result : (result.svg ?? result);
        if (mounted && ref.current) ref.current.innerHTML = svg;
      } catch (err) {
        if (mounted && ref.current)
          ref.current.textContent = 'Erreur mermaid: ' + String(err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [source]);

  return <div ref={ref} className="my-4 prose-mermaid" aria-hidden />;
};
