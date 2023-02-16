/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-array-index-key */

import {
  MouseEventHandler,
  useCallback, useEffect, useRef, useState,
} from 'react';
import classNames from 'classnames';
import { useModal } from '@ebay/nice-modal-react';

import { ByteRange, ByteRangeByte } from '../../../types';
import ByteRangeAnnotator from './ByteRangeAnnotator';

function getNodesInSelectionInContainer(
  selection: Selection,
  range: Range,
  allowedNodeNames: string[],
  container: Node,
): Node[] {
  const { focusNode } = selection;
  let { endContainer } = range;
  const nodes: Node[] = [];

  if (
    endContainer.nodeType !== Node.TEXT_NODE
    && focusNode
    && endContainer !== focusNode
  ) {
    endContainer = focusNode;
  }

  let currentNode = container.firstChild;

  if (currentNode?.nodeType === Node.TEXT_NODE
    && allowedNodeNames.includes(container.nodeName.toLowerCase())) {
    nodes.push(container);
  }

  while (currentNode) {
    if (currentNode !== endContainer) {
      if (selection.containsNode(currentNode, true)) {
        const childNodes = getNodesInSelectionInContainer(
          selection,
          range,
          allowedNodeNames,
          currentNode,
        );

        nodes.push(...childNodes);
      }
    }

    currentNode = currentNode.nextSibling;
  }

  return nodes;
}

function getNodesInSelection(selection: Selection) {
  const range = selection.getRangeAt(0);

  const { commonAncestorContainer, collapsed } = range;

  const nodes: Node[] = [];

  if (!collapsed) {
    if (commonAncestorContainer.nodeType === Node.ELEMENT_NODE) {
      const nodesInSelection = getNodesInSelectionInContainer(
        selection,
        range,
        ['td'],
        commonAncestorContainer,
      );

      nodes.push(...nodesInSelection);
    } else if (commonAncestorContainer.parentNode) {
      nodes.push(commonAncestorContainer.parentNode);
    }
  }

  return nodes;
}

interface DOMByteRange {
  startNode: Node | undefined,
  endNode: Node | undefined,
}

interface PacketViewerProps {
  data: any[],
  handleByteRangeSelection: (start: string, end: string) => void,
  byteRangeMap: Map<string, ByteRange>,
  byteRangeByteMap: Map<string, ByteRangeByte>,
}

function PacketViewer({
  data,
  handleByteRangeSelection,
  byteRangeMap,
  byteRangeByteMap,
} : PacketViewerProps) {
  const byteRangeAnnotator = useModal(ByteRangeAnnotator);
  const tableRef = useRef<HTMLTableElement>(null);
  const [byteRange, setByteRange] = useState<DOMByteRange>({
    startNode: undefined,
    endNode: undefined,
  });

  useEffect(() => {
    if (tableRef.current) {
      const tbl = tableRef.current;
      let selectionStart: Node;
      let selectionEnd: Node;

      const selectionChangeHandler = () => {
        const selection = document.getSelection();

        if (selection) {
          const previouslySelectedNodes = tbl.querySelectorAll('.selected');

          previouslySelectedNodes.forEach((previouslySelectedNode) => {
            previouslySelectedNode.classList.remove('selected', 'selected-first', 'selected-last');
          });

          const nodes = getNodesInSelection(selection);

          nodes.forEach((node) => {
            (node as HTMLElement).classList.add('selected');
          });

          const { 0: a, [nodes.length - 1]: b } = nodes;

          selectionStart = a;
          selectionEnd = b;

          if (selectionStart) {
            (selectionStart as HTMLElement).classList.add('selected-first');
          }

          if (selectionEnd) {
            (selectionEnd as HTMLElement).classList.add('selected-last');
          }
        }
      };

      const mouseUpHandler = () => {
        document.removeEventListener('selectionchange', selectionChangeHandler);
        document.removeEventListener('mouseup', mouseUpHandler);

        setByteRange({
          startNode: selectionStart,
          endNode: selectionEnd,
        });
      };

      const selectStartHandler = () => {
        document.addEventListener('selectionchange', selectionChangeHandler);
        document.addEventListener('mouseup', mouseUpHandler);
      };

      tableRef.current.addEventListener('selectstart', selectStartHandler);

      return () => {
        tbl.removeEventListener('selectstart', selectStartHandler);
      };
    }

    return undefined;
  }, [tableRef]);

  const handleTableClick = useCallback((
    event: React.MouseEvent<HTMLTableSectionElement, MouseEvent>,
  ) => {
    const { target } = event;
    const { startNode, endNode } = byteRange;

    /**
     * 'onClick' after drag has a target of the tr or the tbody
     */
    if ((target as HTMLElement).nodeName.toLowerCase() === 'td') {
      (target as HTMLElement).classList.add('selected');
    }

    if (startNode && target !== startNode) {
      (startNode as HTMLElement).classList.remove('selected');
    }

    if (startNode && endNode && startNode !== endNode) {
      const startOffset = (startNode as HTMLElement).dataset.offset;
      const endOffset = (endNode as HTMLElement).dataset.offset;

      if (startOffset && endOffset) {
        handleByteRangeSelection(startOffset, endOffset);

        if (tableRef.current) {
          const selectedNodes = tableRef.current.querySelectorAll('.selected');

          selectedNodes.forEach((selectedNode) => {
            selectedNode.classList.remove('selected', 'selected-first', 'selected-last');
          });
        }
      }
    }

    setByteRange({
      startNode: target as HTMLElement,
      endNode: undefined,
    });
  }, [byteRange, handleByteRangeSelection, tableRef]);

  const handleByteClick: MouseEventHandler<HTMLTableCellElement> = useCallback((
    event,
  ) => {
    if (event.target instanceof HTMLElement) {
      event.stopPropagation();

      const { target } = event;
      const { byterangeid: byteRangeId } = target.dataset;

      if (byteRangeId) {
        const byteRangeAtByte = byteRangeMap.get(byteRangeId);

        if (byteRangeAtByte) {
          byteRangeAnnotator.show({
            byteRange: byteRangeAtByte,
          });
        }
      }
    }
  }, [byteRangeAnnotator, byteRangeMap]);

  const handleByteMouseEnter: MouseEventHandler<HTMLElement> = useCallback((
    event,
  ) => {
    if (event.target instanceof HTMLElement) {
      const { target } = event;
      const { byterangeid: byteRangeId } = target.dataset;

      if (byteRangeId) {
        const byteRangeElements = document.querySelectorAll(`.byteRange_${byteRangeId}`);

        byteRangeElements.forEach((node) => {
          node.classList.add(`byteRange_${byteRangeId}_hover`);
        });
      }
    }
  }, []);

  const handleByteMouseLeave: MouseEventHandler<HTMLElement> = useCallback((
    event,
  ) => {
    if (event.target instanceof HTMLElement) {
      const { target } = event;
      const { byterangeid: byteRangeId } = target.dataset;

      if (byteRangeId) {
        const byteRangeElements = document.querySelectorAll(`.byteRange_${byteRangeId}`);

        byteRangeElements.forEach((node) => {
          node.classList.remove(`byteRange_${byteRangeId}_hover`);
        });
      }
    }
  }, []);

  return (
    <>
      <div className="col-2">
        <div className="byteRanges">
          { Array.from(byteRangeMap).map(([byteRangeId, currentByteRange]) => (
            <details
              key={byteRangeId}
              className={`byteRange byteRange_${byteRangeId}`}
              data-byterangeid={byteRangeId}
              onMouseEnter={handleByteMouseEnter}
              onMouseLeave={handleByteMouseLeave}
            >
              <summary>{currentByteRange.name}</summary>
              <p>{currentByteRange.description}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="col-7">
        <table
          ref={tableRef}
          className="packet"
        >
          <thead>
            <tr>
              <th className="text-transform-none">Offset(h)</th>
              <th scope="col">00</th>
              <th scope="col">01</th>
              <th scope="col">02</th>
              <th scope="col">03</th>
              <th scope="col">04</th>
              <th scope="col">05</th>
              <th scope="col">06</th>
              <th scope="col">07</th>
              <th scope="col">08</th>
              <th scope="col">09</th>
              <th scope="col">0A</th>
              <th scope="col">0B</th>
              <th scope="col">0C</th>
              <th scope="col">0D</th>
              <th scope="col">0E</th>
              <th scope="col">0F</th>
            </tr>
          </thead>
          <tbody onClick={handleTableClick}>
            {
          data.map((val: any[], idx) => (
            <tr key={idx}>
              <th scope="row">{(idx * 16).toString(16).padStart(8, '0')}</th>
              {
                val.map((cval, inneridx) => {
                  const offset = ((idx * 16) + inneridx).toString(16).padStart(2, '0');
                  const byteAtOffset = byteRangeByteMap.get(offset);
                  let byteRangeId = '';
                  let isByteRangeStart = false;
                  let isByteRangeEnd = false;

                  if (byteAtOffset) {
                    const byteRangeAtOffset = byteRangeMap.get(byteAtOffset.byteRangeId);

                    if (!byteRangeAtOffset) {
                      throw new Error(`Byte at offset '${offset}' refers to a ByteRange of id '${byteAtOffset.byteRangeId}' that doesn't exist`);
                    }

                    byteRangeId = byteRangeAtOffset.id;
                    isByteRangeStart = byteRangeAtOffset.start === offset;
                    isByteRangeEnd = byteRangeAtOffset.end === offset;
                  }

                  return (
                    <td
                      key={`${idx}-${inneridx}`}
                      data-offset={offset}
                      data-byterangeid={byteRangeId}
                      onMouseEnter={handleByteMouseEnter}
                      onMouseLeave={handleByteMouseLeave}
                      onClick={handleByteClick}
                      className={classNames({
                        byteRange: true,
                        [`byteRange_${byteRangeId}`]: !!byteRangeId,
                        [`byteRangeStart_${byteRangeId}`]: isByteRangeStart,
                        [`byteRangeEnd_${byteRangeId}`]: isByteRangeEnd,
                      })}
                    >
                      {parseInt(cval, 10).toString(16).padStart(2, '0')}
                    </td>
                  );
                })
              }
            </tr>
          ))
        }
          </tbody>
        </table>
      </div>
      <div className="col-3">
        <table className="packetData">
          <thead>
            <tr>
              <th colSpan={17}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {
          data.map((val: any[], idx) => (
            <tr key={idx}>
              <th scope="row">&nbsp;</th>
              {
              val.map((cval, inneridx) => {
                const offset = ((idx * 16) + inneridx).toString(16).padStart(2, '0');
                const byteAtOffset = byteRangeByteMap.get(offset);
                let byteRangeId = '';
                let isByteRangeStart = false;
                let isByteRangeEnd = false;

                if (byteAtOffset) {
                  const byteRangeAtOffset = byteRangeMap.get(byteAtOffset.byteRangeId);

                  if (!byteRangeAtOffset) {
                    throw new Error(`Byte at offset '${offset}' refers to a ByteRange of id '${byteAtOffset.byteRangeId}' that doesn't exist`);
                  }

                  byteRangeId = byteRangeAtOffset.id;
                  isByteRangeStart = byteRangeAtOffset.start === offset;
                  isByteRangeEnd = byteRangeAtOffset.end === offset;
                }

                const str = String.fromCharCode(cval);
                // eslint-disable-next-line no-control-regex
                const printable = str.replaceAll(/[\x00-\x20\x7F-\xA0\xAD]/g, '.');
                return (
                  <td
                    key={`${idx}-${inneridx}`}
                    data-offset={offset}
                    data-byterangeid={byteRangeId}
                    onMouseEnter={handleByteMouseEnter}
                    onMouseLeave={handleByteMouseLeave}
                    className={classNames({
                      byteRange: true,
                      [`byteRange_${byteRangeId}`]: !!byteRangeId,
                      [`byteRangeStart_${byteRangeId}`]: isByteRangeStart,
                      [`byteRangeEnd_${byteRangeId}`]: isByteRangeEnd,
                    })}
                  >
                    {printable}
                  </td>
                );
              })
}
            </tr>
          ))
}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default PacketViewer;
