"use client";

import { Action, Eyebrow } from "@/components/ds";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function MaintenanceDialog() {
  return (
    <Dialog defaultOpen modal>
      <DialogContent className="r-stone sm:max-w-md">
        <DialogHeader>
          <Eyebrow brand className="mb-2">
            Work in progress
          </Eyebrow>
          <DialogTitle className="t-h3">
            This site is still being built.
          </DialogTitle>
          <DialogDescription className="t-body pt-2">
            Some pages are unfinished. In the meantime, the assistant knows the
            projects, the writing and the resume — ask it anything.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 pt-4">
          <Action size="sm" onClick={() => window.location.reload()}>
            Reload
          </Action>
          <DialogClose asChild>
            <Action tone="ink" size="sm">
              Have a look around
            </Action>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
