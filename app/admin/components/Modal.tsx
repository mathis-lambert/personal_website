import * as DialogPrimitive from "@radix-ui/react-dialog";
import React from "react";

const ModalRoot = DialogPrimitive.Root;
const ModalTrigger = DialogPrimitive.Trigger;
const ModalClose = DialogPrimitive.Close;

const ModalContent: React.FC<
  { title?: string; children: React.ReactNode } & React.ComponentProps<"div">
> = ({ title, children, className }) => {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />
      <DialogPrimitive.Content
        className={
          "fixed right-0 top-0 h-full w-full max-w-xl bg-card text-card-foreground shadow-xl outline-none focus:outline-none" +
          (className ? ` ${className}` : "")
        }
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="text-lg font-semibold">{title}</div>
          <DialogPrimitive.Close className="border rounded-md px-3 py-1">
            Close
          </DialogPrimitive.Close>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
};

export const Modal = Object.assign(ModalRoot, {
  Trigger: ModalTrigger,
  Close: ModalClose,
  Content: ModalContent,
});

export default Modal;
