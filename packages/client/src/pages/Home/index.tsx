import { Link } from 'raviger';

function Home() {
  return (
    <div className="container">
      <nav aria-label="breadcrumb">
        <ul>
          <li>Home</li>
        </ul>
      </nav>
      <aside>
        <nav>
          <ul>
            <li><Link href="/packets">View Packets</Link></li>
            <li><Link href="/upload">Upload Packet</Link></li>
            <li><Link href="/import">Import Annotated Packet</Link></li>
          </ul>
        </nav>
      </aside>
    </div>
  );
}

export default Home;
