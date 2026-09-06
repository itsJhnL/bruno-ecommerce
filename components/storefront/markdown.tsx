import { Fragment } from "react";

/**
 * A deliberately tiny markdown renderer for CMS long-form copy.
 *
 * It handles exactly what the journal and CMS pages use — paragraphs, `##`
 * headings, `**bold**`, and `- ` lists — and escapes everything else by
 * rendering it as text. No `dangerouslySetInnerHTML`, so CMS content cannot
 * inject markup.
 */
export function Markdown({ content }: { content: string }) {
  const blocks = content.split("\n\n").filter((block) => block.trim().length > 0);

  return (
    <div className="prose-house text-[0.9375rem]">
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="display-s mt-12 mb-4 text-ink-primary first:mt-0">
              {inline(trimmed.slice(3))}
            </h2>
          );
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-10 mb-3 display-s text-ink-primary">
              {inline(trimmed.slice(4))}
            </h3>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <ul key={i} className="my-5 space-y-2.5 pl-5">
              {trimmed.split("\n").map((line, j) => (
                <li key={j} className="list-disc marker:text-accent-quiet">
                  {inline(line.replace(/^-\s*/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        return <p key={i}>{inline(trimmed)}</p>;
      })}
    </div>
  );
}

/** Splits on **bold** and returns React nodes. Everything else stays text. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
