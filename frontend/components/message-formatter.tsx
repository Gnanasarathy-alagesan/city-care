import { ExternalLink } from "lucide-react";

interface MessageFormatterProps {
  message: string;
  className?: string;
}

export function MessageFormatter({
  message,
  className = "",
}: MessageFormatterProps) {
  const formatMessage = (text: string) => {
    // Split the message into paragraphs
    const paragraphs = text.split("\n\n").filter((p) => p.trim());

    return paragraphs.map((paragraph, index) => {
      // Check if paragraph contains bullet points
      if (paragraph.includes("•") || paragraph.includes("*")) {
        const lines = paragraph.split("\n").filter((line) => line.trim());
        const listItems: string[] = [];
        const nonListContent: string[] = [];

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("•") || trimmed.startsWith("*")) {
            listItems.push(trimmed.substring(1).trim());
          } else if (trimmed) {
            nonListContent.push(trimmed);
          }
        });

        return (
          <div key={index} className="space-y-3">
            {nonListContent.length > 0 && (
              <div className="space-y-2">
                {nonListContent.map((content, i) => (
                  <p key={i} className="leading-relaxed">
                    {formatInlineContent(content)}
                  </p>
                ))}
              </div>
            )}
            {listItems.length > 0 && (
              <ul className="space-y-2 ml-4">
                {listItems.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-blue-500 font-bold mt-1 text-sm">
                      •
                    </span>
                    <span className="flex-1">{formatInlineContent(item)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      } else {
        // Regular paragraph
        return (
          <p key={index} className="leading-relaxed mb-3 last:mb-0">
            {formatInlineContent(paragraph)}
          </p>
        );
      }
    });
  };

  const formatInlineContent = (text: string) => {
    // Handle links - match [text](url) format and plain URLs
    const linkRegex = /\[([^\]]+)\]$$([^)]+)$$|https?:\/\/[^\s]+/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // Markdown-style link [text](url)
        parts.push(
          <a
            key={match.index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2 inline-flex items-center gap-1 font-medium"
          >
            {match[1]}
            <ExternalLink className="h-3 w-3" />
          </a>,
        );
      } else {
        // Plain URL
        parts.push(
          <a
            key={match.index}
            href={match[0]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-2 inline-flex items-center gap-1 font-medium break-all"
          >
            {match[0]}
            <ExternalLink className="h-3 w-3" />
          </a>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return <div className={`text-sm ${className}`}>{formatMessage(message)}</div>;
}
