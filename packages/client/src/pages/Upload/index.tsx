import {
  ChangeEvent, useCallback, useContext, useRef,
} from 'react';
import { Link, useNavigate } from 'raviger';
import { nanoid } from 'nanoid';
import { FileDrop } from 'react-file-drop';

import { TinybaseContext } from '../../contexts/Tinybase';

function Upload() {
  const navigate = useNavigate();
  const { store } = useContext(TinybaseContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((files: FileList) => {
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];

      const reader = new FileReader();

      reader.onload = () => {
        if (reader.result) {
          const view = new Uint8Array(reader.result as ArrayBuffer);
          const packetId = nanoid();

          store.setRow('packets', packetId, {
            id: packetId,
            data: view.toString(),
          });

          navigate(`/packets/${packetId}`);
        }
      };

      reader.readAsArrayBuffer(file);
    }
  }, [navigate, store]);

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
          <li>Upload</li>
        </ul>
      </nav>
      <FileDrop
        onDrop={onFileDrop}
        onTargetClick={onTargetClick}
      >
        Drop a packet file here, or click to Browse.
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

export default Upload;
