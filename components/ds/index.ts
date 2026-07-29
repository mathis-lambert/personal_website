/**
 * Paper & Ink — the design system surface.
 *
 * Components import from here, never from the individual files, so the set of
 * available building blocks stays visible and finite. If something you need
 * isn't here, add it here rather than inventing it locally.
 */

export { CardGrid, EmptyState, Page, Section, SectionHeader } from "./Page";
export { Surface } from "./Surface";
export { Display, Eyebrow, Lead, Meta, Prose, Rule, Title } from "./Text";
export { Tag, TagList } from "./Tag";
export { Action, ActionLink, IconAction } from "./Action";
export { Reveal } from "./Reveal";
export { LiftText } from "./LiftText";
export { Squiggle } from "./Squiggle";
export { Wordmark } from "./Wordmark";
export { AmbientField } from "./AmbientField";
export { TokenStream, type StreamSegment } from "./TokenStream";
