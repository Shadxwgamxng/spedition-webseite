const DISCORD_API = "https://discord.com/api/v10";

export type DiscordDmResult = { ok: true } | { ok: false; error: string };

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
    const channelRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: discordId }),
    });
    if (!channelRes.ok) {
      return { ok: false, error: `Discord-DM-Kanal konnte nicht erstellt werden (Status ${channelRes.status}).` };
    }
    const channel = (await channelRes.json()) as { id: string };

    const messageRes = await fetch(`${DISCORD_API}/channels/${channel.id}/messages`, {
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

export function buildWelcomeDm(name: string, roleLabel: string): string {
  return (
    `Hallo ${name},\n\n` +
    `für dich wurde ein Mitarbeiter-Konto bei der Baltic Freight GmbH angelegt (Rolle: ${roleLabel}).\n\n` +
    `Du kannst dich ab sofort mit diesem Discord-Account im Mitarbeiterbereich anmelden:\n` +
    `https://baltic-freight.de/mitarbeiter/login`
  );
}
