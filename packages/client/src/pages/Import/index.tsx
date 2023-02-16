import {
  ChangeEvent,
  useCallback,
  useContext, useRef,
} from 'react';
import { Link, useNavigate } from 'raviger';
import { FileDrop } from 'react-file-drop';
import { useModal } from '@ebay/nice-modal-react';

import { TinybaseContext } from '../../contexts/Tinybase';
import { AnnotatedPacket } from '../../types';
import ImportError from './components/ImportError';

function Import() {
  const importError = useModal(ImportError);
  const navigate = useNavigate();
  const { store, queries } = useContext(TinybaseContext);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileRead = useCallback((importData: string) => {
    try {
      const annotatedPacket = JSON.parse(importData) as AnnotatedPacket;

      if (!annotatedPacket.id || !annotatedPacket.data || !annotatedPacket.byteRanges) {
        importError.show({
          error: 'Imported AnnotatedPacket missing expected properties.',
        });

        return;
      }

      const {
        id, byteRanges, data, description, name,
      } = annotatedPacket;

      const existingPacket = store.getCell('packets', id, 'id');

      if (existingPacket) {
        importError.show({
          error: `Imported AnnotatedPacket with id '${id}' already exists.`,
        });

        return;
      }

      queries.setQueryDefinition('importPacketExistingByteRanges', 'byteRanges', ({ select, where }) => {
        select('id');
        select('packetId');
        select('start');
        select('end');
        select('name');
        select('description');
        select('color');
        where('packetId', id);
      });

      const importingPacketExistingByteRangesTable = queries.getResultTable('importPacketExistingByteRanges');
      const importingPacketByteRanges = Object.entries(byteRanges);

      importingPacketByteRanges.forEach(([importingByteRangeId, importingByteRange]) => {
        if (importingPacketExistingByteRangesTable[importingByteRangeId]) {
          throw new Error(`Tried to import ByteRange with id '${importingByteRangeId}' but it already exists.`);
        }

        store.setRow('byteRanges', importingByteRangeId, {
          id: importingByteRange.id,
          packetId: importingByteRange.packetId,
          name: importingByteRange.name,
          start: importingByteRange.start,
          end: importingByteRange.end,
          description: importingByteRange.description ?? '',
          color: importingByteRange.color,
          foregroundColor: importingByteRange.foregroundColor ?? '',
        });
      });

      store.setRow('packets', id, {
        id,
        data: data.join(','),
        description: description ?? '',
        name: name ?? id,
      });

      navigate(`/packets/${id}`);
    } catch (err) {
      console.error(err);
    }
  }, [importError, navigate, queries, store]);

  const handleFileUpload = useCallback((files: FileList) => {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];

      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          handleFileRead(reader.result as string);
        }
      };

      reader.readAsText(file);
    }
  }, [handleFileRead]);

  const onFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;

    if (files) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const onFileDrop = useCallback((
    files: FileList | null,
  ) => {
    if (files) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const onTargetClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="container">
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li>Import Annotated Packet</li>
        </ul>
      </nav>
      <FileDrop
        onDrop={onFileDrop}
        onTargetClick={onTargetClick}
      >
        Drop a annotated packet file here, or click to Browse.
      </FileDrop>
      <input
        onChange={onFileInputChange}
        ref={fileInputRef}
        type="file"
        className="hidden"
      />
    </div>
  );
}

export default Import;
