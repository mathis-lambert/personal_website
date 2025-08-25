import React, { useEffect, useRef } from 'react';

const parseTopConfig = (src: string): Record<string, string> | null => {
    // match frontmatter at the very top delimited by ---
    const fmMatch = src.match(/^\s*---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
    if (!fmMatch) return null;

    const frontmatter = fmMatch[1];

    // find config: block inside the frontmatter
    const cfgMatch = frontmatter.match(/(^|\r?\n)config:\s*\r?\n([\s\S]*)$/);
    if (!cfgMatch) return null;

    const cfgBody = cfgMatch[2];
    const lines = cfgBody.split(/\r?\n/);
    const cfg: Record<string, string> = {};

    for (const rawLine of lines) {
        const line = rawLine.replace(/\t/g, '    ');
        if (line.trim() === '') break; // stop at first empty line

        // accept "  key: value" or "key: value"
        const m = line.match(/^\s*([\w-]+):\s*(.+?)\s*$/);
        if (!m) break;

        const key = m[1];
        let value = m[2];

        // strip surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        cfg[key] = value;
    }

    return Object.keys(cfg).length ? cfg : null;
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
