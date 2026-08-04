/**
 * A schema.org graph, for the crawlers. Rendered as a plain script tag because
 * that is what they parse — nothing here is visible or interactive.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
