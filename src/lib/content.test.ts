import { describe, expect, it } from "vitest";
import { renderTextContent } from "@/lib/content";
import { escapeHtml } from "@/lib/html";

describe("renderTextContent", () => {
  it("strips scripts and event handlers from HTML content", () => {
    const html = renderTextContent(
      '<p>Hola</p><script>alert(1)</script><img src="x" onerror="alert(1)">'
    );

    expect(html).toContain("<p>Hola</p>");
    expect(html).not.toMatch(/<script|onerror|alert\(1\)/i);
  });

  it("drops javascript: links but keeps https links", () => {
    const html = renderTextContent(
      '<p><a href="javascript:alert(1)">x</a> <a href="https://apto.org.mx">ok</a></p>'
    );

    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://apto.org.mx"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("keeps YouTube embeds and classes but drops iframes from other hosts", () => {
    const html = renderTextContent(
      '<p class="lead">Video</p>' +
        '<iframe src="https://www.youtube.com/embed/abc"></iframe>' +
        '<iframe src="https://evil.example/x"></iframe>'
    );

    expect(html).toContain('<p class="lead">');
    expect(html).toContain('src="https://www.youtube.com/embed/abc"');
    expect(html).not.toContain("evil.example");
  });

  it("escapes plain text and linkifies URLs", () => {
    const html = renderTextContent("<b>no</b> & visita https://apto.org.mx");

    expect(html).toContain("&lt;b&gt;no&lt;/b&gt; &amp;");
    expect(html).toContain('<a href="https://apto.org.mx"');
  });
});

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;"
    );
  });
});
