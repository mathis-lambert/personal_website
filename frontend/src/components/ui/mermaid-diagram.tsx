import React, { useEffect, useRef } from 'react';

const parseTopConfig = (src: string) => {
    // parse très simple de "config:\n  key: value\n  key2: value2\n\n"
    if (!src.startsWith('config:')) return null;
    const lines = src.split('\n').slice(1);
    const cfg: Record<string, string> = {};
    for (const l of lines) {
        if (l.trim() === '') break;
        const m = l.match(/^\s*([\w-]+):\s*(.+)\s*$/);
        if (m) cfg[m[1]] = m[2];
    }
    return cfg;
};

type MmdTheme = "default" | "base" | "dark" | "forest" | "neutral" | "null" | undefined

export const MermaidDiagram: React.FC<{ source: string }> = ({ source }) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let mounted = true;
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

        (async () => {
            if (typeof window === 'undefined') return;
            const mod = await import('mermaid');
            const mermaid = mod.default ?? mod;

            // extraire config simple si présent en tête
            const cfg = parseTopConfig(source);

            console.log("Mermaid Config", cfg)

            mermaid.initialize({
                startOnLoad: false,
                theme: cfg?.theme as MmdTheme,
                layout: cfg?.layout,
            });

            try {
                // si tu veux forcer une init inline (utile pour layout/options par-diagramme)
                const init = cfg
                    ? `%%{init: ${JSON.stringify({ theme: cfg.theme, layout: cfg.layout })}}%%\n`
                    : '';
                const finalSource = init + source.replace(/^config:[\s\S]*?\n\n/, '');

                const result = await mermaid.render(id, finalSource);
                const svg = typeof result === 'string' ? result : result.svg ?? result;
                if (mounted && ref.current) ref.current.innerHTML = svg;
            } catch (err) {
                if (mounted && ref.current) ref.current.textContent = 'Erreur mermaid: ' + String(err);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [source]);

    return <div ref={ref} className="my-4 prose-mermaid" aria-hidden />;
};
