// Minimal allowlist-Sanitizer für den Verfahrensanweisungen-Rich-Text
// (siehe rich-text-editor.tsx) - bewusst kein voller HTML-Parser, sondern
// ein enges Feature-Set: der Editor selbst erzeugt nur Fett/Kursiv/
// Unterstrichen/Listen über document.execCommand, hier wird serverseitig
// nochmal hart durchgesetzt, dass beim Speichern NICHTS anderes ankommt
// (z. B. über eingefügten Clipboard-Inhalt, den der Editor clientseitig
// zwar schon als Klartext einfügt, aber ein manueller API-Aufruf könnte
// den Client umgehen). Entfernt <script>/<style> samt Inhalt, wirft jeden
// nicht erlaubten Tag weg (Inhalt bleibt erhalten) und streicht bei JEDEM
// verbleibenden Tag restlos alle Attribute - damit ist die gesamte
// Angriffsfläche über onerror=/onclick=/href="javascript:"/style= u. Ä.
// kategorisch ausgeschlossen, unabhängig vom Tag-Namen.
const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "ul", "ol", "li", "br", "p", "div", "span"]);

export function sanitizeRichText(html: string): string {
  if (typeof html !== "string") return "";
  let out = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  out = out.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>/g, (_match, closing: string, tagName: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return "";
    return `<${closing}${tag}>`;
  });
  return out;
}
