import { Card } from "@/components/ui/primitives";
import { DiscordIcon, MailIcon, PhoneIcon } from "@/components/ui/icons";
import type { CollectionName, TeamMemberRecord } from "@/lib/server/db-types";

export function TeamPersonCard({
  person,
  collection,
}: {
  person: TeamMemberRecord;
  collection: CollectionName;
}) {
  const hasContact = Boolean(person.phone || person.email || person.discord);
  return (
    <Card className="flex flex-col items-start">
      {person.photoMimeType ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded photo served from our own API route, not a static site asset
        <img
          src={`/api/admin/${collection}/${person.id}/photo`}
          alt={person.name}
          className="h-16 w-16 rounded-2xl object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-lg font-bold text-amber-400">
          {person.initials}
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-navy-900">{person.name}</h3>
      <div className="text-sm font-medium text-amber-600">{person.role}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-navy-700/50">{person.department}</div>
      <p className="mt-3 text-sm leading-relaxed text-navy-700/75">{person.bio}</p>
      {hasContact ? (
        <div className="mt-4 flex w-full flex-col gap-1.5 border-t border-navy-900/8 pt-3 text-xs text-navy-700/70">
          {person.phone ? (
            <a href={`tel:${person.phone}`} className="inline-flex items-center gap-1.5 hover:text-navy-900">
              <PhoneIcon className="h-3.5 w-3.5" /> {person.phone}
            </a>
          ) : null}
          {person.email ? (
            <a href={`mailto:${person.email}`} className="inline-flex items-center gap-1.5 hover:text-navy-900">
              <MailIcon className="h-3.5 w-3.5" /> {person.email}
            </a>
          ) : null}
          {person.discord ? (
            <span className="inline-flex items-center gap-1.5">
              <DiscordIcon className="h-3.5 w-3.5" /> {person.discord}
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
