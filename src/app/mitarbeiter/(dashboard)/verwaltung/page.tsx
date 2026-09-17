"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { EmployeePageHeader } from "@/components/employee/page-header";
import { CollectionManager, type FieldConfig } from "@/components/employee/collection-manager";
import { EmployeeManager } from "@/components/employee/employee-manager";
import { CompanyForm } from "./company-form";
import { AboutPageForm } from "./about-page-form";

const teamFields: FieldConfig[] = [
  { key: "name", label: "Name", required: true },
  { key: "role", label: "Position", required: true },
  { key: "department", label: "Abteilung", required: true },
  { key: "bio", label: "Kurzprofil", type: "textarea", required: true },
  { key: "initials", label: "Kürzel", required: true, placeholder: "z. B. TW", help: "2 Buchstaben" },
];

const ABOUT_ICON_OPTIONS = ["shield", "truck", "globe", "users", "clock", "check", "warehouse", "route"];

const tabs = [
  { key: "news", label: "News" },
  { key: "jobs", label: "Stellenangebote" },
  { key: "services", label: "Leistungen" },
  { key: "ueberUns", label: "Über uns" },
  { key: "management", label: "Geschäftsführung" },
  { key: "keyPositions", label: "Wichtige Positionen" },
  { key: "fleetCategories", label: "Fuhrpark (Kategorien)" },
  { key: "reviews", label: "Rezensionen" },
  { key: "partners", label: "Partner" },
  { key: "unternehmen", label: "Unternehmensdaten" },
  { key: "mitarbeiter", label: "Mitarbeiter-Konten" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function VerwaltungPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>("news");

  if (!user || user.roleKey !== "geschaeftsfuehrung") {
    return <p className="text-sm text-navy-700/60">Kein Zugriff.</p>;
  }

  return (
    <div>
      <EmployeePageHeader
        title="Verwaltung"
        description="Inhalte der öffentlichen Website und Mitarbeiter-Konten pflegen. Änderungen erscheinen sofort live."
      />

      <div className="flex flex-wrap gap-2 border-b border-navy-900/8 pb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-navy-900 text-white" : "bg-white text-navy-700 hover:bg-navy-900/5"
            } border border-navy-900/10`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "news" ? (
          <CollectionManager
            collection="news"
            idField="slug"
            titleField="title"
            subtitleField="category"
            emptyLabel="Noch keine News-Beiträge."
            newLabel="News-Beitrag erstellen"
            fields={[
              { key: "slug", label: "URL-Kürzel (slug)", required: true, placeholder: "z-b-neuer-lkw-fuhrpark" },
              { key: "title", label: "Titel", required: true },
              { key: "category", label: "Kategorie", required: true, placeholder: "z. B. Unternehmen" },
              { key: "date", label: "Datum", type: "date", required: true },
              { key: "excerpt", label: "Kurztext (Vorschau)", type: "textarea", required: true },
              { key: "content", label: "Inhalt", type: "list", help: "ein Absatz pro Zeile" },
            ]}
          />
        ) : null}

        {tab === "jobs" ? (
          <CollectionManager
            collection="jobs"
            idField="slug"
            titleField="title"
            subtitleField="location"
            emptyLabel="Noch keine Stellenangebote."
            newLabel="Stellenangebot erstellen"
            fields={[
              { key: "slug", label: "URL-Kürzel (slug)", required: true, placeholder: "z-b-disponent" },
              { key: "title", label: "Titel", required: true },
              { key: "location", label: "Standort", required: true },
              { key: "type", label: "Art", required: true, placeholder: "z. B. Vollzeit" },
              { key: "department", label: "Abteilung", required: true },
              { key: "description", label: "Beschreibung", type: "textarea", required: true },
              { key: "tasks", label: "Aufgaben", type: "list", help: "eine pro Zeile" },
              { key: "requirements", label: "Anforderungen", type: "list", help: "eine pro Zeile" },
            ]}
          />
        ) : null}

        {tab === "services" ? (
          <CollectionManager
            collection="services"
            idField="slug"
            titleField="title"
            subtitleField="short"
            emptyLabel="Noch keine Leistungen."
            newLabel="Leistung erstellen"
            fields={[
              { key: "slug", label: "URL-Kürzel (slug)", required: true, placeholder: "z-b-nationale-transporte" },
              { key: "title", label: "Titel", required: true },
              { key: "short", label: "Kurzbeschreibung", type: "textarea", required: true },
              { key: "description", label: "Ausführliche Beschreibung", type: "textarea", required: true },
              { key: "points", label: "Stichpunkte", type: "list", help: "einer pro Zeile" },
              {
                key: "icon",
                label: "Icon",
                type: "select",
                options: ["truck", "warehouse", "route", "globe", "shield", "clock"],
              },
            ]}
          />
        ) : null}

        {tab === "ueberUns" ? (
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy-900">Texte</h2>
              <AboutPageForm />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy-900">Meilensteine (Zeitleiste)</h2>
              <CollectionManager
                collection="aboutMilestones"
                idField="id"
                titleField="year"
                subtitleField="text"
                emptyLabel="Noch keine Meilensteine."
                newLabel="Meilenstein hinzufügen"
                fields={[
                  { key: "year", label: "Jahr", required: true, placeholder: "z. B. 2026" },
                  { key: "text", label: "Text", type: "textarea", required: true },
                ]}
              />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy-900">Werte</h2>
              <CollectionManager
                collection="aboutValues"
                idField="id"
                titleField="title"
                subtitleField="text"
                emptyLabel="Noch keine Werte."
                newLabel="Wert hinzufügen"
                fields={[
                  { key: "title", label: "Titel", required: true },
                  { key: "text", label: "Text", type: "textarea", required: true },
                  { key: "icon", label: "Icon", type: "select", options: ABOUT_ICON_OPTIONS },
                ]}
              />
            </div>
            <div>
              <h2 className="mb-3 text-sm font-semibold text-navy-900">Vorteile-Kacheln (unterer Bereich)</h2>
              <CollectionManager
                collection="aboutHighlights"
                idField="id"
                titleField="title"
                subtitleField="text"
                emptyLabel="Noch keine Einträge."
                newLabel="Kachel hinzufügen"
                fields={[
                  { key: "title", label: "Titel", required: true },
                  { key: "text", label: "Text", type: "textarea", required: true },
                  { key: "icon", label: "Icon", type: "select", options: ABOUT_ICON_OPTIONS },
                ]}
              />
            </div>
          </div>
        ) : null}

        {tab === "management" ? (
          <CollectionManager
            collection="management"
            idField="id"
            titleField="name"
            subtitleField="role"
            emptyLabel="Noch keine Einträge."
            newLabel="Mitglied hinzufügen"
            fields={teamFields}
          />
        ) : null}

        {tab === "keyPositions" ? (
          <CollectionManager
            collection="keyPositions"
            idField="id"
            titleField="name"
            subtitleField="role"
            emptyLabel="Noch keine Einträge."
            newLabel="Position hinzufügen"
            fields={teamFields}
          />
        ) : null}

        {tab === "fleetCategories" ? (
          <CollectionManager
            collection="fleetCategories"
            idField="id"
            titleField="category"
            subtitleField="description"
            emptyLabel="Noch keine Fuhrpark-Kategorien."
            newLabel="Kategorie hinzufügen"
            fields={[
              { key: "category", label: "Kategorie", required: true, placeholder: "z. B. Sattelzugmaschinen" },
              { key: "count", label: "Anzahl", type: "number", required: true },
              { key: "description", label: "Beschreibung", type: "textarea", required: true },
              { key: "features", label: "Merkmale", type: "list", help: "eines pro Zeile" },
            ]}
          />
        ) : null}

        {tab === "reviews" ? (
          <CollectionManager
            collection="reviews"
            idField="id"
            titleField="author"
            subtitleField="company"
            emptyLabel="Noch keine Rezensionen."
            newLabel="Rezension hinzufügen"
            fields={[
              { key: "author", label: "Name", required: true },
              { key: "company", label: "Unternehmen", required: true },
              { key: "rating", label: "Bewertung (1–5)", type: "number", required: true },
              { key: "text", label: "Text", type: "textarea", required: true },
              { key: "date", label: "Datum", type: "date", required: true },
            ]}
          />
        ) : null}

        {tab === "partners" ? (
          <CollectionManager
            collection="partners"
            idField="id"
            titleField="name"
            subtitleField="category"
            emptyLabel="Noch keine Partner."
            newLabel="Partner hinzufügen"
            fields={[
              { key: "name", label: "Name", required: true },
              { key: "category", label: "Kategorie", required: true, placeholder: "z. B. Transportnetzwerk" },
            ]}
          />
        ) : null}

        {tab === "unternehmen" ? <CompanyForm /> : null}

        {tab === "mitarbeiter" ? <EmployeeManager /> : null}
      </div>
    </div>
  );
}
