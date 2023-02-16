import { useForm, SubmitHandler } from 'react-hook-form';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useCallback, useContext } from 'react';
import slugify from 'slugify';

import { TinybaseContext } from '../../../contexts/Tinybase';
import type { Packet, PickRenameMulti, RenderablePacket } from '../../../types';

interface PacketPropertiesEditorProps {
  packet: RenderablePacket,
}

type FormValues = PickRenameMulti<Required<Pick<Packet, 'name' | 'description'>>, { name: 'packetName', description: 'packetDescription' }>;

export default NiceModal.create(
  ({ packet }: PacketPropertiesEditorProps) => {
    const {
      id: packetId,
      description,
      name,
    } = packet;

    const modal = useModal();
    const { store } = useContext(TinybaseContext);

    const {
      register, handleSubmit, formState: { errors },
    } = useForm<FormValues>();

    const handleCancel = useCallback(() => {
      modal.hide();
    }, [modal]);

    const handleConfirm: SubmitHandler<FormValues> = useCallback((
      { packetName, packetDescription },
    ) => {
      if (packetName !== packetId) {
        store.setCell('packets', packetId, 'name', slugify(packetName));
      }

      if (packetDescription !== description) {
        store.setCell('packets', packetId, 'description', packetDescription);
      }

      modal.hide();
    }, [description, modal, packetId, store]);

    return (
      <dialog open={modal.visible}>
        <article>
          <a
            href="#close"
            aria-label="Close"
            className="close"
            onClick={handleCancel}
          />
          <h3>Packet properties</h3>
          <form onSubmit={handleSubmit(handleConfirm)} id="packetPropertiesEditor">
            <label htmlFor="packetName">
              Packet Name
              <input
                type="text"
                defaultValue={name ?? packetId}
                {...register('packetName', { required: true })}
                {...(errors.packetName && { 'aria-invalid': true })}
              />
            </label>
            <small>We&apos;ll make this URL friendly.</small>
            <label htmlFor="packetDescription">
              Packet Description
              <textarea
                rows={5}
                cols={33}
                defaultValue={description}
                {...register('packetDescription')}
              />
            </label>
          </form>
          <footer>
            <div className="grid">
              <button
                type="button"
                className="secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="packetPropertiesEditor"
              >
                Save
              </button>
            </div>
          </footer>
        </article>
      </dialog>
    );
  },
);
