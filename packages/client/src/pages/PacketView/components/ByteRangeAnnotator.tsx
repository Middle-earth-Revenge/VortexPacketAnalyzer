import {
  useCallback, useContext, useEffect,
} from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { nanoid } from 'nanoid';

import type { ByteRange, PickRenameMulti } from '../../../types';
import { TinybaseContext } from '../../../contexts/Tinybase';

type InitialByteRange = Partial<ByteRange> & Required<Pick<ByteRange, 'start' | 'end' | 'packetId'>>;

interface ByteRangeAnnotatorProps {
  byteRange: ByteRange | InitialByteRange,
}

type FormValues = PickRenameMulti<
Pick<ByteRange, 'name' | 'description' | 'color' | 'foregroundColor' | 'start' | 'end'>, {
  name: 'byteRangeName',
  description: 'byteRangeDescription',
  color: 'byteRangeColor',
  foregroundColor: 'byteRangeForegroundColor'
  start: 'byteRangeStart',
  end: 'byteRangeEnd',
}>;

export default NiceModal.create(
  ({ byteRange }: ByteRangeAnnotatorProps) => {
    const {
      id,
      packetId,
      start,
      end,
      name,
      description,
      color,
      foregroundColor,
    } = byteRange;

    if (!packetId) {
      throw new Error('Expected a packetId but it was undefined');
    }

    const { store, queries } = useContext(TinybaseContext);

    const modal = useModal();

    const {
      register, handleSubmit, formState: { errors }, reset, setError,
    } = useForm<FormValues>();

    const handleCancel = useCallback(() => {
      modal.hide();
    }, [modal]);

    useEffect(() => {
      const handleKeypress = (ev: KeyboardEvent) => {
        if (ev.key === 'Escape') {
          modal.hide();
        }
      };

      if (modal.visible) {
        document.addEventListener('keyup', handleKeypress);
      } else {
        document.removeEventListener('keyup', handleKeypress);
      }

      return () => {
        document.removeEventListener('keyup', handleKeypress);
      };
    }, [modal]);

    useEffect(() => {
      if (modal.visible) {
        reset();
      }
    }, [modal.visible, reset]);

    const handleConfirm: SubmitHandler<FormValues> = useCallback(({
      byteRangeName,
      byteRangeStart, byteRangeEnd, byteRangeDescription, byteRangeColor, byteRangeForegroundColor,
    }) => {
      let isValidByteRange = true;

      if (!id) {
        queries.setQueryDefinition('byteRangeWithName', 'byteRanges', ({ select, where }) => {
          select('id');
          where('name', byteRangeName);
        });

        queries.setQueryDefinition('byteRangeWithDescription', 'byteRanges', ({ select, where }) => {
          select('id');
          where('description', byteRangeDescription);
        });

        queries.setQueryDefinition('byteRangeWithColor', 'byteRanges', ({ select, where }) => {
          select('id');
          where('color', byteRangeColor);
        });

        queries.setQueryDefinition('byteRangeWithOverlap', 'byteRanges', ({ select, where }) => {
          select('id');
          where((getTableCell) => {
            const currentRangePacket = getTableCell('packetId');

            if (currentRangePacket !== packetId) {
              return false;
            }

            const currentRangeStart = getTableCell('start');
            const currentRangeEnd = getTableCell('end');

            if (!currentRangeStart || !currentRangeEnd) {
              throw new Error('Got a ByteRange without a start/end');
            }

            const currentRangeStartInt = parseInt(currentRangeStart as string, 16);
            const currentRangeEndInt = parseInt(currentRangeEnd as string, 16);

            const insertRangeStartInt = parseInt(byteRangeStart, 16);
            const insertRangeEndInt = parseInt(byteRangeEnd, 16);

            if (
              insertRangeStartInt >= currentRangeStartInt
            && insertRangeStartInt <= currentRangeEndInt
            ) {
              return true;
            }

            if (
              insertRangeEndInt <= currentRangeEndInt
            && insertRangeEndInt >= currentRangeStartInt
            ) {
              return true;
            }

            return false;
          });
        });

        const byteRangeWithNameTable = queries.getResultTable('byteRangeWithName');
        const byteRangeWithDescriptionTable = queries.getResultTable('byteRangeWithDescription');
        const byteRangeWithColorTable = queries.getResultTable('byteRangeWithColor');
        const byteRangeWithOverlapTable = queries.getResultTable('byteRangeWithOverlap');

        const isExistingByteRangeWithName = Object.entries(
          byteRangeWithNameTable,
        ).length > 0;
        const isExistingByteRangeWithDescription = Object.entries(
          byteRangeWithDescriptionTable,
        ).length > 0;
        const isExistingByteRangeWithColor = Object.entries(
          byteRangeWithColorTable,
        ).length > 0;
        const isExistingByteRangeInLocation = Object.entries(
          byteRangeWithOverlapTable,
        ).length > 0;

        isValidByteRange = !isExistingByteRangeWithName
      && !isExistingByteRangeWithDescription
      && !isExistingByteRangeWithColor
      && !isExistingByteRangeInLocation;

        if (isExistingByteRangeWithName) {
          setError('byteRangeName', { type: 'custom', message: 'A ByteRange with this name already exists' });
        }

        if (isExistingByteRangeWithDescription) {
          setError('byteRangeDescription', { type: 'custom', message: 'A ByteRange with this description already exists' });
        }

        if (isExistingByteRangeWithColor) {
          setError('byteRangeColor', { type: 'custom', message: 'A ByteRange with this color already exists' });
        }

        if (isExistingByteRangeInLocation) {
          setError('byteRangeStart', { type: 'custom', message: 'A ByteRange in this location already exists' });
          setError('byteRangeEnd', { type: 'custom', message: 'A ByteRange in this location already exists' });
        }
      }

      if (!id && isValidByteRange) {
        const byteRangeId = nanoid();

        store.setRow('byteRanges', byteRangeId, {
          id: byteRangeId,
          packetId,
          name: byteRangeName,
          start: byteRangeStart,
          end: byteRangeEnd,
          description: byteRangeDescription,
          color: byteRangeColor,
          foregroundColor: byteRangeForegroundColor ?? '',
        });

        modal.hide();
      } else if (id && isValidByteRange) {
        store.setRow('byteRanges', id, {
          id,
          packetId,
          name: byteRangeName,
          start: byteRangeStart,
          end: byteRangeEnd,
          description: byteRangeDescription,
          color: byteRangeColor,
          foregroundColor: byteRangeForegroundColor ?? '',
        });

        modal.hide();
      }
    }, [id, modal, packetId, queries, setError, store]);

    return (
      <dialog open={modal.visible}>
        <article>
          <a
            href="#close"
            aria-label="Close"
            className="close"
            onClick={handleCancel}
          />
          <h3>Annotate Bytes</h3>
          <form onSubmit={handleSubmit(handleConfirm)} id="byteRangeAnnotator">
            <div className="row">
              <div className="col-4">
                <label htmlFor="byteRangeName">
                  Byte Range Name
                </label>
              </div>
              <div className="col-4">
                <input
                  type="text"
                  defaultValue={name}
                  {...register('byteRangeName', { required: true })}
                  {
                  ...(errors.byteRangeName && { 'aria-invalid': true })
                }
                />
              </div>
              <div className="col-4">
                <small>
                  Unique name of this datapart within the packet (e.g. &apos;header0&apos;)
                </small>
              </div>
            </div>
            {errors.byteRangeName && (
            <div className="row">
              <div className="col offset-4 error">
                <small>{errors.byteRangeName.message}</small>
              </div>
            </div>
            )}
            <div className="row">
              <div className="col-4">
                <label>
                  Start / End
                </label>
              </div>
              <div className="col-4 grid">
                <input
                  type="text"
                  className="text-transform-uppercase "
                  defaultValue={start}
                  {...register('byteRangeStart', { required: true })}
                  {
                  ...(errors.byteRangeStart && { 'aria-invalid': true })
                }
                />
                <input
                  type="text"
                  className="text-transform-uppercase "
                  defaultValue={end}
                  {...register('byteRangeEnd', { required: true })}
                  {
                  ...(errors.byteRangeEnd && { 'aria-invalid': true })
                }
                />
              </div>
              <div className="col-4">
                <small>First and last byte of datapart in packet</small>
              </div>
            </div>
            {(errors.byteRangeStart || errors.byteRangeEnd) && (
            <div className="row">
              <div className="col offset-4 error">
                <small>{errors.byteRangeStart?.message ?? errors.byteRangeEnd?.message}</small>
              </div>
            </div>
            )}
            <div className="row">
              <div className="col-4">
                <label htmlFor="byteRangeDescription">
                  Description
                </label>
              </div>
              <div className="col-4">
                <textarea
                  defaultValue={description}
                  {...register('byteRangeDescription', { required: true })}
                  {
                  ...(errors.byteRangeDescription && { 'aria-invalid': true })
                }
                />
              </div>
              <div className="col-4">
                <small>Human readable description of this datapart</small>
              </div>
            </div>
            {errors.byteRangeDescription && (
            <div className="row">
              <div className="col offset-4 error">
                <small>{errors.byteRangeDescription.message}</small>
              </div>
            </div>
            )}
            <div className="row">
              <div className="col-4">
                <label htmlFor="byteRangeColor">
                  Color
                </label>
              </div>
              <div className="col-4">
                <input
                  type="color"
                  defaultValue={color ?? `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                  {...register('byteRangeColor', { required: true })}
                  {
                  ...(errors.byteRangeColor && { 'aria-invalid': true })
                }
                />
              </div>
              <div className="col-4">
                <small>Color to be used for this datapart</small>
              </div>
            </div>
            {errors.byteRangeColor && (
            <div className="row">
              <div className="col offset-4 error">
                <small>{errors.byteRangeColor.message}</small>
              </div>
            </div>
            )}
            <div className="row">
              <div className="col-4">
                <label htmlFor="byteRangeForegroundColor">
                  Foreground Color
                </label>
              </div>
              <div className="col-4">
                <input
                  type="color"
                  defaultValue={foregroundColor}
                  {...register('byteRangeForegroundColor')}
                />
              </div>
              <div className="col-4">
                <small>Foreground color to be used for this datapart (optional)</small>
              </div>
            </div>
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
                form="byteRangeAnnotator"
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
