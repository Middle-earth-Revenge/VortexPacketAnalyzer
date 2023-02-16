import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { navigate } from 'raviger';
import { useCallback, useContext } from 'react';
import { TinybaseContext } from '../../../contexts/Tinybase';

interface DeletePacketConfirmProps {
  packetId: string
}

export default NiceModal.create(
  ({ packetId }: DeletePacketConfirmProps) => {
    const modal = useModal();
    const { store, queries } = useContext(TinybaseContext);

    const handleCancel = useCallback(() => {
      modal.hide();
    }, [modal]);

    const handleConfirm = useCallback(() => {
      queries.setQueryDefinition('deletingPacketByteRanges', 'byteRanges', ({ select, where }) => {
        select('id');
        select('packetId');
        select('start');
        select('end');
        select('name');
        select('description');
        select('color');
        where('packetId', packetId);
      });

      const deletingPacketByteRangesTable = queries.getResultTable('deletingPacketByteRanges');
      const deletingPacketByteRanges = Object.entries(deletingPacketByteRangesTable);

      deletingPacketByteRanges.forEach(([byteRangeId]) => {
        store.delRow('byteRanges', byteRangeId);
      });

      store.delRow('packets', packetId);

      modal.hide();

      navigate('/packets');
    }, [modal, packetId, queries, store]);

    return (
      <dialog open={modal.visible}>
        <article>
          <a
            href="#close"
            aria-label="Close"
            className="close"
            onClick={handleCancel}
          />
          <h3>Confirm your action!</h3>
          <p>
            This will delete the Packet and all associated analysis.
            Are you sure?
          </p>
          <footer>
            <a
              href="#cancel"
              role="button"
              className="secondary"
              onClick={handleCancel}
            >
              Cancel
            </a>
            <a
              href="#confirm"
              role="button"
              onClick={handleConfirm}
            >
              Confirm
            </a>
          </footer>
        </article>
      </dialog>
    );
  },
);
