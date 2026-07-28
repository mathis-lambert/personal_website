import { Action, Eyebrow, Lead, Page, Title } from "@/components/ds";

export default function NotFoundPage() {
  return (
    <Page narrow className="grid min-h-dvh place-items-center py-24">
      <div className="text-center">
        <Eyebrow brand className="mb-5 justify-center">
          404
        </Eyebrow>
        <Title level={1}>This page went missing.</Title>
        <Lead className="mx-auto mt-6">
          The link may be out of date, or the page may have moved. The work is
          all still here.
        </Lead>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Action href="/" tone="ink">
            Back home
          </Action>
          <Action href="/projects">Browse the projects</Action>
        </div>
      </div>
    </Page>
  );
}
