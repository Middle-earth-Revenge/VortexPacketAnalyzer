import {
  useCallback, useContext, useEffect, useInsertionEffect, useMemo,
} from 'react';
import { Link } from 'raviger';
import { useResultTable } from 'tinybase/ui-react';
import { useModal } from '@ebay/nice-modal-react';

import { TinybaseContext } from '../../contexts/Tinybase';
import chunk from '../../utils/chunk';

import PacketViewer from './components/PacketViewer';
import ByteRangeAnnotator from './components/ByteRangeAnnotator';
import PacketPropertiesEditor from './components/PacketPropertiesEditor';
import DeletePacketConfirm from './components/DeletePacketConfirm';
import type {
  AnnotatedPacket,
  ByteRange, ByteRangeByte, Packet, RenderablePacket,
} from '../../types';

interface PacketViewProps {
  packetId: Packet['id']
}

type PartialPacket = Pick<Packet, 'id' | 'data'> & Partial<Packet>;

const isInserted = new Set();

function PacketView({ packetId }: PacketViewProps) {
  const deletePacketConfirmation = useModal(DeletePacketConfirm);
  const byteRangeAnnotator = useModal(ByteRangeAnnotator);
  const packetPropertiesEditor = useModal(PacketPropertiesEditor);

  const { queries } = useContext(TinybaseContext);
  const packetTable = useResultTable('viewingPacket', queries);
  const byteRangesTable = useResultTable('viewingPacketByteRanges', queries);

  useInsertionEffect(() => {
    const byteRangesTableRows = Object.entries(byteRangesTable) as [string, ByteRange][];

    byteRangesTableRows.forEach(([byteRangeId, { color, foregroundColor }]) => {
      const finalForegroundColor = foregroundColor ?? '';
      const byteRangeStyle = `
<style>
  .byteRanges details.byteRange_${byteRangeId} {
    border: 1px solid ${color};
  }
  .byteRanges details.byteRange_${byteRangeId}_hover {
    background-color: ${color};
  }
  table tr > td.byteRange_${byteRangeId} {
    border-top: 1px solid ${color};
    border-bottom: 1px solid ${color};
    color: ${finalForegroundColor};
  }
  table tr > td.byteRange_${byteRangeId}_hover {
    background-color: ${color};
    border: none !important;
  }
  table tr > td.byteRangeStart_${byteRangeId} {
    border-left: 1px solid ${color} !important;
  }
  table tr > td.byteRangeEnd_${byteRangeId} {
    border-right: 1px solid ${color} !important;
  }
</style>
`;
      if (!isInserted.has(byteRangeStyle)) {
        isInserted.add(byteRangeStyle);
        document.head.insertAdjacentHTML('beforeend', byteRangeStyle);
      }
    });
  }, [byteRangesTable]);

  const packet: RenderablePacket | null = useMemo(() => {
    const packetTableRows = Object.entries(packetTable);

    if (!packetTable || packetTableRows.length === 0) {
      return null;
    }

    if (packetTableRows.length > 1) {
      throw new Error(`Found multiple packets with id: ${packetId}`);
    }

    const [, packetTableRow] = packetTableRows[0] as [string, PartialPacket];

    const byteRangesTableRows = Object.entries(byteRangesTable) as [string, ByteRange][];

    const byteRangeMap = new Map<string, ByteRange>();
    const byteRangeByteMap = new Map<string, ByteRangeByte>();

    byteRangesTableRows.forEach(([, byteRange]) => {
      const { start, end, id } = byteRange;
      byteRangeMap.set(id, byteRange);

      const rangeStart = parseInt(start, 16);
      const rangeEnd = parseInt(end, 16);

      for (let i = rangeStart; i <= rangeEnd; i += 1) {
        const offset = i.toString(16).padStart(2, '0');

        const byte: ByteRangeByte = {
          byteRangeId: id,
          offset,
        };

        byteRangeByteMap.set(offset, byte);
      }
    });

    return {
      ...packetTableRow,
      data: chunk((packetTableRow.data).split(','), 16),
      byteRangeMap,
      byteRangeByteMap,
    };
  }, [packetTable, byteRangesTable, packetId]);

  useEffect(() => {
    queries.setQueryDefinition('viewingPacket', 'packets', ({ select, where }) => {
      select('id');
      select('name');
      select('description');
      select('data');
      where('id', packetId);
    });

    queries.setQueryDefinition('viewingPacketByteRanges', 'byteRanges', ({ select, where }) => {
      select('id');
      select('packetId');
      select('start');
      select('end');
      select('name');
      select('description');
      select('color');
      where('packetId', packetId);
    });
  }, [packetId, queries]);

  const openDeletePacketConfirm = useCallback(() => {
    deletePacketConfirmation.show({
      packetId,
    });
  }, [deletePacketConfirmation, packetId]);

  const openPacketPropertiesEditor = useCallback(() => {
    if (packet) {
      packetPropertiesEditor.show({
        packet,
      });
    }
  }, [packet, packetPropertiesEditor]);

  const openByteRangeAnnotator = useCallback((start: string, end: string) => {
    byteRangeAnnotator.show({
      byteRange: {
        packetId,
        start,
        end,
      },
    });
  }, [byteRangeAnnotator, packetId]);

  const downloadAnnotatedPacket = useCallback(() => {
    if (packet) {
      const {
        data, byteRangeMap, name, description, id,
      } = packet;
      const flatData = data.flat();
      const byteRanges = Object.fromEntries(byteRangeMap);

      const annotatedPacket: AnnotatedPacket = {
        data: flatData,
        byteRanges,
        description,
        id,
      };

      const fileName = name ?? id;

      const a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([JSON.stringify(annotatedPacket)], { type: 'application/json' }));
      a.download = `${fileName}.json`;

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
    }
  }, [packet]);

  if (!packet) {
    return (
      <progress />
    );
  }

  const { data, byteRangeMap, byteRangeByteMap } = packet;

  return (
    <>
      <div className="container">
        <nav aria-label="breadcrumb">
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/packets">Packets</Link></li>
            <li>{packet.name ?? packetId}</li>
          </ul>
        </nav>
      </div>
      <div className="container-fluid">
        <div className="row">
          <PacketViewer
            data={data}
            byteRangeMap={byteRangeMap}
            byteRangeByteMap={byteRangeByteMap}
            handleByteRangeSelection={openByteRangeAnnotator}
          />
        </div>
        <aside>
          <nav>
            <ul>
              <li>
                <button
                  type="button"
                  className="outline"
                  onClick={openPacketPropertiesEditor}
                >
                  Modify Packet Properties
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="warning outline"
                  onClick={openDeletePacketConfirm}
                >
                  Delete Packet
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="secondary outline"
                  onClick={downloadAnnotatedPacket}
                >
                  Download Annotated Packet
                </button>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
}

export default PacketView;
