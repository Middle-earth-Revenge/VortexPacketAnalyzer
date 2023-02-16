import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useCallback } from 'react';

interface ImportErrorProps {
  error: string
}

export default NiceModal.create(
  ({ error }: ImportErrorProps) => {
    const modal = useModal();

    const handleCancel = useCallback(() => {
      modal.hide();
    }, [modal]);

    return (
      <dialog open={modal.visible}>
        <article>
          <a
            href="#close"
            aria-label="Close"
            className="close"
            onClick={handleCancel}
          />
          <h3>Import Error</h3>
          <p>
            {error}
          </p>
          <footer>
            <a
              href="#cancel"
              role="button"
              onClick={handleCancel}
            >
              OK
            </a>
          </footer>
        </article>
      </dialog>
    );
  },
);
