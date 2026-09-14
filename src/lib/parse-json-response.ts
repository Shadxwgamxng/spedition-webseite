/**
 * Safely parses a fetch Response as JSON. A reverse proxy in front of the app
 * (e.g. nginx) can reject an oversized request itself — before it ever
 * reaches this app's route handlers — and answer with its own plain-text/HTML
 * error page (e.g. "413 Request Entity Too Large"), which isn't valid JSON
 * and would otherwise throw as an unhandled promise rejection.
 */
export async function parseJsonResponse(res: Response): Promise<{ ok: boolean; error?: string; [key: string]: unknown }> {
  try {
    return await res.json();
  } catch {
    if (res.status === 413) {
      return {
        ok: false,
        error: "Die Datei ist dem Server zu groß (413). Falls die Website hinter nginx läuft, muss dort client_max_body_size erhöht werden (siehe README).",
      };
    }
    return { ok: false, error: `Unerwartete Antwort vom Server (Status ${res.status}).` };
  }
}
