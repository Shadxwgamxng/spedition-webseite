import { Container, Eyebrow } from "@/components/ui/primitives";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <Container className="relative py-16 sm:py-20">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{description}</p> : null}
        {children}
      </Container>
    </section>
  );
}
