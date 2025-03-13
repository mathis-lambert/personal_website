import { Button, CloseButton, Dialog, Portal } from '@chakra-ui/react';
import './Dialog.scss';

const MainDialog = ({
                      title,
                      message,
                      validationLabel,
                      cancelLabel,
                      isOpen,
                      onClose
                    }: {
  title: string
  message: string
  validationLabel: string
  cancelLabel?: string
  isOpen: boolean
  onClose: () => void
}) => {
  if (!isOpen) {
    return null;
  }
  return (
    <Dialog.Root open={isOpen} placement={'center'} size={'sm'} motionPreset={'slide-in-bottom'}>
      <Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Positioner>
          <Dialog.Content margin={4} background={'hsla(0,0%,100%,0.5)'} borderRadius={8} border={'1px solid'}
                          borderColor={'white'}>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <p>
                {message}
              </p>
            </Dialog.Body>
            <Dialog.Footer>
              {cancelLabel && (
                <Dialog.ActionTrigger asChild>
                  <Button colorPalette="teal" variant="outline" onClick={onClose}>{cancelLabel}</Button>
                </Dialog.ActionTrigger>
              )}
              <Button  colorPalette="teal" variant="surface" onClick={onClose}>{validationLabel}</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default MainDialog;
