"use client";

import { PenLine } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";

import NoteCard from "@/components/notes/NoteCard";
import { ListHeader } from "@/components/content/ListHeader";
import { CardGrid, EmptyState, Page, Reveal } from "@/components/ds";
import FiltersBar from "@/components/filters/FiltersBar";
import { useDebounce } from "@/hooks/useDebounce";
import {
  SORT_OPTIONS,
  matchesQuery,
  sortContent,
  uniqueSorted,
  type SortOrder,
} from "@/lib/content/sort";
import type { Note } from "@/types";

const NotesList: React.FC<{ notes: Note[] }> = ({ notes }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const query = useDebounce(searchQuery);

  const allTags = useMemo(
    () => uniqueSorted(notes.flatMap((note) => note.tags)),
    [notes],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = notes.filter((note) => {
      if (tags.length > 0 && !tags.some((tag) => note.tags.includes(tag))) {
        return false;
      }
      if (featuredOnly && !note.isFeatured) return false;

      return matchesQuery([note.title, note.excerpt, ...note.tags], needle);
    });

    return sortContent(filtered, sortOrder);
  }, [notes, tags, featuredOnly, query, sortOrder]);

  return (
    <Page as="section" data-ink="azure">
      <ListHeader
        eyebrow={`Field notes · ${notes.length} ${notes.length === 1 ? "note" : "notes"}`}
        icon={<PenLine />}
        title="Thinking out loud, mostly about systems."
        deck="Technical deep dives and honest notes from building software that has to keep working outside a demo."
      />

      <FiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOrder={sortOrder}
        onSortChange={(value) => setSortOrder(value as SortOrder)}
        filteredCount={visible.length}
        totalCount={notes.length}
        onReset={() => {
          setSearchQuery("");
          setTags([]);
          setFeaturedOnly(false);
          setSortOrder("newest");
        }}
        sections={[
          {
            type: "multiselect",
            label: "Tags",
            items: allTags.map((value) => ({ value, label: value })),
            selected: tags,
            onChange: setTags,
          },
        ]}
        showFeaturedToggle
        featuredOnly={featuredOnly}
        onFeaturedChange={setFeaturedOnly}
        searchPlaceholder="Search notes…"
        searchAriaLabel="Search notes"
        sortOptions={SORT_OPTIONS}
      />

      {visible.length > 0 ? (
        <CardGrid className="pb-24">
          {visible.map((note, index) => (
            <Reveal key={note._id} delay={Math.min(index, 5) * 60}>
              <NoteCard note={note} priority={index < 3} />
            </Reveal>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="No notes match that."
          hint="Try a different search term or tag."
          className="mb-24"
        />
      )}
    </Page>
  );
};

export default NotesList;
