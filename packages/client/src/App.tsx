import { useRoutes } from 'raviger';
import NiceModal from '@ebay/nice-modal-react';

import { TinybaseProvider } from './contexts/Tinybase';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Import from './pages/Import';
import PacketList from './pages/PacketList';
import PacketView from './pages/PacketView';

const routes = {
  '/': () => <Home />,
  '/upload': () => <Upload />,
  '/import': () => <Import />,
  '/packets': () => <PacketList />,
  '/packets/:packetId': ({ packetId }: { packetId: string }) => <PacketView packetId={packetId} />,
};

function App() {
  const route = useRoutes(routes);

  return (
    <TinybaseProvider>
      <NiceModal.Provider>
        { route }
      </NiceModal.Provider>
    </TinybaseProvider>
  );
}

export default App;
