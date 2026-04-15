/**
 * Converts plain-text post/event content to safe HTML.
 *
 * Handles the format used by the admin textarea:
 *   - Lines starting with "* " → <ul><li> bullets
 *   - Blank lines → paragraph breaks
 *   - URLs → clickable <a> links
 *   - If content already contains HTML tags, returns it as-is
 */
export function renderTextContent(text: string): string {
  if (!text) return "";

  // If it already has HTML structure, render as-is (future rich-text editor content)
  if (/<(p|ul|ol|li|h[1-6]|br|strong|em|div)\b/i.test(text)) {
    return text;
  }

  // Escape HTML to prevent XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // Convert URLs to links (after escaping, URLs have &amp; for & params)
  const linked = escaped.replace(
    /(https?:\/\/[^\s<>"]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-brand-600 underline underline-offset-2 hover:text-brand-800">$1</a>'
  );

  // Split into lines and process
  const lines = linked.split("\n");
  const output: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.match(/^\*\s+/) || line.match(/^•\s*/)) {
      // Bullet line
      const content = line.replace(/^\*\s+/, "").replace(/^•\s*/, "");
      if (!inList) {
        output.push('<ul class="my-3 list-disc pl-6 space-y-1">');
        inList = true;
      }
      output.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        output.push("</ul>");
        inList = false;
      }

      if (line === "") {
        // Blank line → paragraph break (skip consecutive blanks)
        if (output.length > 0 && output[output.length - 1] !== "") {
          output.push("");
        }
      } else {
        output.push(line);
      }
    }
  }

  if (inList) output.push("</ul>");

  // Group non-bullet lines into <p> tags
  const html: string[] = [];
  let paragraph: string[] = [];

  for (const line of output) {
    if (line.startsWith("<ul") || line.startsWith("</ul>") || line.startsWith("<li>")) {
      if (paragraph.length > 0) {
        html.push(`<p>${paragraph.join("<br>")}</p>`);
        paragraph = [];
      }
      html.push(line);
    } else if (line === "") {
      if (paragraph.length > 0) {
        html.push(`<p>${paragraph.join("<br>")}</p>`);
        paragraph = [];
      }
    } else {
      paragraph.push(line);
    }
  }

  if (paragraph.length > 0) {
    html.push(`<p>${paragraph.join("<br>")}</p>`);
  }

  return html.join("\n");
}
