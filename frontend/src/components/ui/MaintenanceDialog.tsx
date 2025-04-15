import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle
} from '@/components/ui/dialog';

export function MaintenanceDialog() {
  return (
    <Dialog defaultOpen modal>
      <DialogOverlay className={'fixed inset-0 bg-black/50 dark:bg-white/10 backdrop-blur'} />
      <DialogContent
        className="
          sm:max-w-[425px]
          bg-white/10 dark:bg-gray-900/20
          backdrop-blur-lg
          border border-white/20 dark:border-gray-700/30
          shadow-xl
          text-gray-900 dark:text-gray-100
          rounded-xl
        "
      >
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            ⚠️ Information importante ⚠️
          </DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-300 pt-2">
            Ce site est actuellement en cours de construction 👷🏼‍♂️ 🚧 ! Pour patienter vous pouvez utiliser Nexia 🤖, mon
            assistant personnel qui saura répondre à toutes vos questions. À très vite !
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="
              border-gray-400/50 dark:border-gray-600/50
              text-gray-700 dark:text-gray-300
              bg-white/5 dark:bg-black/10
              hover:bg-white/20 dark:hover:bg-white/10
              hover:border-gray-500 dark:hover:border-gray-500
              hover:scale-105 transition-all duration-300
            "
          >
            Actualiser
          </Button>
          <DialogClose>
            <Button
              variant="default"
              className="
              ml-2
              bg-blue-600 hover:bg-blue-700 /* Keep primary color solid */
              text-white
              hover:scale-105 hover:shadow-md hover:shadow-blue-500/30 hover:-rotate-3
              transition-all duration-300
              dark:bg-blue-600 dark:hover:bg-blue-700 /* Ensure dark mode consistency */
            "
            >
              Découvrir
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}