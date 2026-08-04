import {
  getAllNotes,
  getAllProjects,
  getExperiences,
  getStudies,
} from "@/lib/data/content";
import type { Note, Project } from "@/types/content";
import { HomePageContent } from "@/components/home/HomePageContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { byNewest } from "@/lib/content/sort";
import { SITE_SOCIALS, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/" },
};

/**
 * Who the site is about, so a search for the name can resolve to a person
 * rather than to whichever page happened to rank.
 */
const identity = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Mathis Lambert",
      url: SITE_URL,
      jobTitle: "Software & AI Engineer",
      sameAs: SITE_SOCIALS,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Mathis Lambert",
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export default async function HomePage() {
  const [projects, notes, experiences, studies] = await Promise.all([
    getAllProjects(),
    getAllNotes(),
    getExperiences(),
    getStudies(),
  ]);

  const featuredProjects: Project[] = (() => {
    const featured = projects.filter((p) => p.isFeatured);
    const pool = featured.length ? featured : projects;
    return [...pool].sort(byNewest).slice(0, 3);
  })();

  const latestNotes: Note[] = [...notes].sort(byNewest).slice(0, 3);

  return (
    <>
      <JsonLd data={identity} />
      <HomePageContent
        featuredProjects={featuredProjects}
        latestNotes={latestNotes}
        experiences={experiences}
        studies={studies}
      />
    </>
  );
}
