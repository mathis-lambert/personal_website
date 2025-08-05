import React, { type JSX, useState } from 'react';
import ReactMarkdown, { type ExtraProps, type Options } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Check, Clipboard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils.ts'; // Import Loader2

interface MarkdownViewProps {
  content: string;
  loading?: boolean; // Prop pour indiquer l'état de chargement/streaming
}

type CodeProps = JSX.IntrinsicElements['code'] & ExtraProps;

const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  loading = false,
}) => {
  const markdownComponents: Options['components'] = {
    p: ({ className, ...props }) => (
      <p
        className={cn('mb-5 mt-5 leading-7 first:mt-0 last:mb-0', className)}
        {...props}
      />
    ),
    code: ({ node, className, children, style, ...props }: CodeProps) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [isCopied, setIsCopied] = useState(false);
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';
      const codeString = String(children).replace(/\n$/, '');

      const handleCopy = () => {
        navigator.clipboard.writeText(codeString).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        });
      };

      const isBlock =
        (node as any)?.position?.start.line !==
          (node as any)?.position?.end.line ||
        (node as any)?.value?.includes('\n');

      if (isBlock && match) {
        return (
          <div className="code-block relative group my-4 rounded-md border bg-muted text-sm">
            <div className="flex items-center justify-between px-4 py-1.5 border-b bg-muted/50">
              <span className="text-xs font-semibold text-muted-foreground">
                {language}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity"
                onClick={handleCopy}
                aria-label="Copier le code"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="overflow-x-auto rounded-b-md">
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-expect-error */}
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                className="!p-4"
                {...props}
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else {
        return (
          <code
            className={`inline-block px-1 py-0.5 bg-muted text-muted-foreground rounded-sm font-mono text-[0.9em] ${className || ''}`}
            style={style}
            {...props}
          >
            {children}
          </code>
        );
      }
    },
  };

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
        // Utilisation de GFM, la gestion des sauts de ligne est plus standard
        children={content.replace(/\n/g, '  \r\n\n')}
      />
      {/* Afficher le spinner à la fin si loading est vrai */}
      {loading && (
        <span className="inline-flex items-center ml-2">
          {' '}
          {/* Use span for inline flow */}
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </span>
      )}
    </div>
  );
};

export default MarkdownView;
