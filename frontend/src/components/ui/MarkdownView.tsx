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
    h1: ({ className, ...props }) => (
      <h1
        className={cn(
          'text-3xl mt-8 mb-4 leading-tight tracking-tight',
          className,
        )}
        {...props}
      />
    ),
    h2: ({ className, ...props }) => (
      <h2
        className={cn(
          'text-2xl mt-8 mb-3 leading-tight tracking-tight',
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, ...props }) => (
      <h3
        className={cn('text-xl mt-6 mb-2 leading-snug', className)}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p
        className={cn('mb-5 mt-5 leading-7 first:mt-0 last:mb-0', className)}
        {...props}
      />
    ),
    a: ({ className, ...props }) => (
      <a
        className={cn(
          'underline decoration-dotted underline-offset-4 text-blue-600 dark:text-blue-400 hover:decoration-solid',
          className,
        )}
        target={props.href?.startsWith('http') ? '_blank' : undefined}
        rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        {...props}
      />
    ),
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn(
          'my-6 border-l-4 border-blue-400/60 dark:border-blue-500/60 pl-4 italic text-gray-700 dark:text-gray-300',
          className,
        )}
        {...props}
      />
    ),
    ul: ({ className, ...props }) => (
      <ul
        className={cn('my-4 list-disc pl-6 space-y-2', className)}
        {...props}
      />
    ),
    ol: ({ className, ...props }) => (
      <ol
        className={cn('my-4 list-decimal pl-6 space-y-2', className)}
        {...props}
      />
    ),
    li: ({ className, ...props }) => (
      <li className={cn('leading-7', className)} {...props} />
    ),
    img: ({ className, ...props }) => (
      // ReactMarkdown's img props are compatible with img element
      <img
        className={cn(
          'rounded-xl border border-white/20 dark:border-white/10 mx-auto',
          className,
        )}
        {...props}
      />
    ),
    hr: (props) => (
      <hr className="my-8 border-white/20 dark:border-white/10" {...props} />
    ),
    table: ({ className, ...props }) => (
      <div className="my-6 w-full overflow-x-auto rounded-md border border-white/20 dark:border-white/10">
        <table className={cn('w-full text-left', className)} {...props} />
      </div>
    ),
    th: ({ className, ...props }) => (
      <th
        className={cn(
          'bg-white/40 dark:bg-gray-800/40 px-3 py-2 text-sm font-semibold',
          className,
        )}
        {...props}
      />
    ),
    td: ({ className, ...props }) => (
      <td className={cn('px-3 py-2 text-sm align-top', className)} {...props} />
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

      type MdNode = {
        position?: { start: { line: number }; end: { line: number } };
        value?: string;
      };
      const mdNode = node as unknown as MdNode | undefined;
      const isBlock =
        mdNode?.position?.start.line !== mdNode?.position?.end.line ||
        (mdNode?.value?.includes('\n') ?? false);

      if (isBlock && match) {
        return (
          <div className="code-block relative group my-6 rounded-xl border border-white/10 bg-[#0b1020]/90 text-sm shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs font-semibold text-gray-200">
                {language}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-70 hover:opacity-100 transition-opacity text-gray-200"
                onClick={handleCopy}
                aria-label="Copier le code"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="overflow-x-auto rounded-b-xl">
              <SyntaxHighlighter
                style={oneDark}
                language={language}
                PreTag="div"
                className="!p-4"
              >
                {codeString}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else {
        return (
          <code
            className={`inline-block px-1 py-0.5 bg-white/40 dark:bg-gray-800/50 text-gray-800 dark:text-gray-100 rounded-sm font-mono text-[0.9em] ${className || ''}`}
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
    <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
        children={content}
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
