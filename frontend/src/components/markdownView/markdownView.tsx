import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import './markdownView.scss';

interface MarkdownViewProps {
  content: string;
}

const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';
          const handleCopy = () => {
            navigator.clipboard.writeText(String(children));
          };
          return (
            <div className="code-block">
              <div className="code-header">
                <span className="language">{language}</span>
                <button className="copy-button" onClick={handleCopy}>
                  Copy
                </button>
              </div>
              <SyntaxHighlighter
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                style={darcula}
                language={language}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            </div>
          );
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        inlineCode({ children, ...props }) {
          return (
            <code className="fira-code" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownView;
