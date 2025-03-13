import React from 'react';
import ReactMarkdown from 'react-markdown';
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
        code(props) {
          const { children, className, node, ...rest } = props;
          const match = /language-(\w+)/.exec(className || '')
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
                style={materialDark}
                PreTag="div"
                className="code-value"
                children={String(children).replace(/\n$/, '')}
                language={language}
                {...rest}
              />
            </div>
          );
        },
        pre(props) {
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
