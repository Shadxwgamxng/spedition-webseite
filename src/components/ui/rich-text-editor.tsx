"use client";

import { useEffect, useRef } from "react";

/**
 * Minimaler, abhängigkeitsfreier Rich-Text-Editor (Fett/Kursiv/Unterstrichen/
 * Listen) für Felder wie den Verfahrensanweisungen-Text (s. collection-
 * manager.tsx, FieldConfig type "richtext"). Bewusst kein npm-Paket wie
 * Tiptap/Quill - das Projekt hat bisher keine Editor-Abhängigkeit und die
 * paar Formate hier lassen sich mit dem eingebauten document.execCommand
 * (funktioniert in allen Chromium-/Firefox-Browsern, die für ein internes
 * Dashboard wie dieses realistisch zum Einsatz kommen) ohne zusätzliches
 * Gewicht abdecken.
 *
 * Spiegelt den Inhalt bei jeder Änderung in ein verstecktes <input>, damit
 * das umgebende <form> (native FormData, s. CollectionManager.handleSubmit)
 * den Wert unverändert wie jedes andere Feld mitbekommt - der Editor selbst
 * braucht dafür keine Sonderbehandlung im Submit-Handler.
 *
 * Eingefügter Zwischenablage-Inhalt wird bewusst auf reinen Text reduziert
 * (kein Rich-HTML von einer fremden Seite) - Formatierung kommt ausschließlich
 * über die Toolbar-Buttons zustande. Serverseitig wird der HTML-Wert beim
 * Speichern zusätzlich über sanitizeRichText() gehärtet (s. store.ts).
 */

const TOOLBAR_COMMANDS: Array<{ command: string; label: string; content: string; italic?: boolean; underline?: boolean }> = [
  { command: "bold", label: "Fett", content: "F" },
  { command: "italic", label: "Kursiv", content: "K", italic: true },
  { command: "underline", label: "Unterstrichen", content: "U", underline: true },
  { command: "insertUnorderedList", label: "Aufzählung", content: "•" },
  { command: "insertOrderedList", label: "Nummerierte Liste", content: "1." },
];

export function RichTextEditor({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = defaultValue ?? "";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Mounten initialisieren, s. Kommentar oben an CollectionManager zum defaultValue-Verhalten nativer Felder
  }, []);

  function sync() {
    if (editorRef.current && hiddenRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }

  function exec(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
    sync();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-navy-900/15 bg-mist-50 p-1.5">
        {TOOLBAR_COMMANDS.map((c) => (
          <button
            key={c.command}
            type="button"
            title={c.label}
            aria-label={c.label}
            // Verhindert, dass der Editor beim Klick auf den Button den
            // Fokus (und damit die Text-Selektion, auf die sich execCommand
            // bezieht) verliert, bevor das Kommando ausgeführt wird.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => exec(c.command)}
            className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-xs font-bold text-navy-800 hover:bg-navy-900/10 ${
              c.italic ? "italic" : ""
            } ${c.underline ? "underline" : ""}`}
          >
            {c.content}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          sync();
        }}
        data-placeholder={placeholder}
        className="min-h-[180px] w-full rounded-b-lg border border-navy-900/15 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 empty:before:text-navy-700/40 empty:before:content-[attr(data-placeholder)]"
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue ?? ""} />
    </div>
  );
}
