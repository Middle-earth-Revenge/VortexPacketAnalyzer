import { useContext } from 'react';
import { Link } from 'raviger';

import { TinybaseContext } from '../../contexts/Tinybase';

function PacketList() {
  const { store } = useContext(TinybaseContext);
  const packets = store.getTable('packets');

  return (
    <div className="container">
      <nav aria-label="breadcrumb">
        <ul>
          <li><Link href="/">Home</Link></li>
          <li>Packets</li>
        </ul>
      </nav>
      <table role="grid" className="packets">
        <thead>
          <tr>
            <th>
              Name
            </th>
            <th>
              Description
            </th>
            <th>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {
            Object.entries(packets).map(([packetId, { name, description }]) => (
              <tr key={packetId}>
                <td><Link href={`/packets/${packetId}`}>{name ?? 'Unknown'}</Link></td>
                <td>{description ?? 'Unknown'}</td>
                <td>{packetId}</td>
              </tr>
            ))
          }
        </tbody>
      </table>
      <aside>
        <nav>
          <ul>
            <li><Link href="/upload">Upload Packet</Link></li>
            <li><Link href="/import">Import Annotated Packet</Link></li>
          </ul>
        </nav>
      </aside>
    </div>
  );
}

export default PacketList;
