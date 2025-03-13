import React, { JSX } from 'react';
import ReactMarkdown, { ExtraProps } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
        code: (props: JSX.IntrinsicElements['code'] & ExtraProps) => {
          const { children, className, style, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';

          const handleCopy = () => {
            navigator.clipboard.writeText(String(children));
          };

          return match ? (
            <div className="code-block">
              <div className="code-header">
                <span className="language">{language}</span>
                <button className="copy-button" onClick={handleCopy}>
                  Copy
                </button>
              </div>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-expect-error */}
              <SyntaxHighlighter
                {...rest}
                children={String(children).replace(/\n$/, '')}
                PreTag="div"
                className="code-value"
                language={language}
                style={materialDark}
              />
            </div>
          ) : (
            <code className={className} style={style} {...rest}>
              {children}
            </code>
          );
        },
        pre({ ...props }) {
          return <pre {...props} />;
        },
        br() {
          return <br />;
        }
      }}
    >
      {content.replace(/\n/g, '  \n')}
    </ReactMarkdown>
  );
};

export default MarkdownView;
