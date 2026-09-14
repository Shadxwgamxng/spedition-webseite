const DISCORD_API = "https://discord.com/api/v10";

export type DiscordDmResult = { ok: true } | { ok: false; error: string };

async function openDmChannel(discordId: string, token: string): Promise<{ ok: true; channelId: string } | { ok: false; error: string }> {
  const channelRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: discordId }),
  });
  if (!channelRes.ok) {
    return { ok: false, error: `Discord-DM-Kanal konnte nicht erstellt werden (Status ${channelRes.status}).` };
  }
  const channel = (await channelRes.json()) as { id: string };
  return { ok: true, channelId: channel.id };
}

/**
 * Sends a DM to a Discord user via the bot API. Requires DISCORD_BOT_TOKEN
 * (a bot attached to the same Discord application used for OAuth login, see
 * README) and only works if that bot shares at least one server with the
 * recipient — a fundamental Discord platform requirement, not something this
 * code can work around.
 */
export async function sendDiscordDm(discordId: string, content: string): Promise<DiscordDmResult> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "DISCORD_BOT_TOKEN ist serverseitig nicht konfiguriert." };
  }

  try {
    const channel = await openDmChannel(discordId, token);
    if (!channel.ok) return channel;

    const messageRes = await fetch(`${DISCORD_API}/channels/${channel.channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!messageRes.ok) {
      return { ok: false, error: `Discord-Nachricht konnte nicht gesendet werden (Status ${messageRes.status}).` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Verbindung zur Discord-API fehlgeschlagen." };
  }
}

/** Same as sendDiscordDm, but attaches a file (e.g. the generated Arbeitsvertrag-PDF). */
export async function sendDiscordDmWithFile(
  discordId: string,
  content: string,
  file: { fileName: string; mimeType: string; bytes: Uint8Array },
): Promise<DiscordDmResult> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "DISCORD_BOT_TOKEN ist serverseitig nicht konfiguriert." };
  }

  try {
    const channel = await openDmChannel(discordId, token);
    if (!channel.ok) return channel;

    const form = new FormData();
    form.append("payload_json", JSON.stringify({ content }));
    form.append("files[0]", new Blob([Uint8Array.from(file.bytes)], { type: file.mimeType }), file.fileName);

    const messageRes = await fetch(`${DISCORD_API}/channels/${channel.channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}` },
      body: form,
    });
    if (!messageRes.ok) {
      return { ok: false, error: `Discord-Nachricht mit Anhang konnte nicht gesendet werden (Status ${messageRes.status}).` };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Verbindung zur Discord-API fehlgeschlagen." };
  }
}

export function buildWelcomeDm(name: string, roleLabel: string): string {
  return (
    `Hallo ${name},\n\n` +
    `für dich wurde ein Mitarbeiter-Konto bei der Baltic Freight GmbH angelegt (Rolle: ${roleLabel}).\n\n` +
    `Du kannst dich ab sofort mit diesem Discord-Account im Mitarbeiterbereich anmelden:\n` +
    `https://baltic-freight.de/mitarbeiter/login`
  );
}

export function buildContractDm(name: string): string {
  return (
    `Hallo ${name},\n\n` +
    `deine Personalakte ist jetzt vollständig — anbei erhältst du deinen Arbeitsvertrag als PDF.\n\n` +
    `Bitte prüfe die Angaben und wende dich bei Rückfragen an die Geschäftsführung.`
  );
}

const APPLICATION_STATUS_TEXT: Record<string, string> = {
  Neu: "Deine Bewerbung ist bei uns eingegangen und wird in Kürze gesichtet.",
  "In Prüfung": "Deine Bewerbung wird aktuell von unserem Recruiting-Team geprüft. Wir melden uns zeitnah bei dir.",
  Eingeladen:
    "Wir möchten dich gerne zu einem persönlichen Kennenlernen einladen! Wir melden uns in Kürze bei dir, um einen Termin zu vereinbaren.",
  Angenommen:
    "Herzlichen Glückwunsch — deine Bewerbung wurde angenommen! Wir freuen uns, dich bald im Team der Baltic Freight GmbH begrüßen zu dürfen.",
  Abgelehnt:
    "Leider können wir dir aktuell keine Zusage geben. Wir bedanken uns für dein Interesse an der Baltic Freight GmbH und wünschen dir für deine Zukunft alles Gute.",
};

export function buildApplicationStatusDm(input: { name: string; position: string; status: string }): string {
  const positionText = input.position ? `für die Position „${input.position}"` : "als Initiativbewerbung";
  const statusText = APPLICATION_STATUS_TEXT[input.status] ?? `Neuer Status: ${input.status}.`;
  return (
    `Hallo ${input.name},\n\n` +
    `deine Bewerbung bei der Baltic Freight GmbH ${positionText} hat ein Update erhalten:\n\n` +
    `${statusText}`
  );
}
