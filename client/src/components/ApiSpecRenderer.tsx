import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ApiSpecRendererProps {
  content: string;
  format: "json" | "yaml" | "markdown" | "text";
  className?: string;
}

export function ApiSpecRenderer({ content, format, className = "" }: ApiSpecRendererProps) {
  const renderedContent = useMemo(() => {
    if (!content || content.trim() === "") {
      return <p className="text-muted-foreground text-sm">No API specification provided</p>;
    }

    try {
      switch (format) {
        case "json":
          // Parse and pretty-print JSON
          const parsedJson = JSON.parse(content);
          const prettyJson = JSON.stringify(parsedJson, null, 2);
          return (
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
              showLineNumbers
            >
              {prettyJson}
            </SyntaxHighlighter>
          );

        case "yaml":
          // Syntax highlight YAML
          return (
            <SyntaxHighlighter
              language="yaml"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
              showLineNumbers
            >
              {content}
            </SyntaxHighlighter>
          );

        case "markdown":
          // Render Markdown to HTML
          return (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  // Customize code blocks within markdown
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match;
                    return !isInline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus as any}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          fontSize: "0.875rem",
                          borderRadius: "0.375rem",
                        }}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          );

        case "text":
        default:
          // Display as plain text
          return (
            <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-secondary/20 p-4 rounded-lg border border-border">
              {content}
            </pre>
          );
      }
    } catch (error) {
      // If JSON parsing fails or any other error, show raw content
      console.error("Error rendering API spec:", error);
      return (
        <div className="space-y-2">
          <p className="text-destructive text-sm">
            Error rendering {format.toUpperCase()}. Showing raw content:
          </p>
          <pre className="font-mono text-xs whitespace-pre-wrap break-words bg-secondary/20 p-4 rounded-lg border border-destructive">
            {content}
          </pre>
        </div>
      );
    }
  }, [content, format]);

  return <div className={className}>{renderedContent}</div>;
}
