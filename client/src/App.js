import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procLoading, setProcLoading] = useState(true);
  const [rebooting, setRebooting] = useState(false);
  const [rebootMsg, setRebootMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/serverApp/api/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setError('Failed to fetch server status.'));

    fetch('http://localhost:5000/serverApp/api/processes')
      .then(res => res.json())
      .then(data => {
        setProcesses(data.slice(0, 10)); // Show top 10 processes
        setProcLoading(false);
      })
      .catch(() => setError('Failed to fetch processes.'));
  }, []);

  const handleReboot = () => {
    if (!window.confirm('Are you sure you want to reboot the server?')) return;
    setRebooting(true);
    setRebootMsg('');
    fetch('http://localhost:5000/serverApp/api/reboot', { method: 'POST' })
      .then(res => res.json())
      .then(data => setRebootMsg(data.message || 'Reboot initiated.'))
      .catch(() => setRebootMsg('Failed to initiate reboot.'))
      .finally(() => setRebooting(false));
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ubuntu Server Health Dashboard</h1>
      </header>
      <main style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <section style={{ marginBottom: 32 }}>
          <h2>Server Status</h2>
          {loading ? (
            <p>Loading status...</p>
          ) : status ? (
            <div className="status-grid">
              <div><b>CPU Load:</b> {status.cpu?.toFixed(2)}%</div>
              <div><b>Memory:</b> {((status.memory.used / status.memory.total) * 100).toFixed(1)}% used</div>
              <div><b>Disk:</b> {status.disk.map(d => `${d.fs}: ${(d.used/1e9).toFixed(1)}GB / ${(d.size/1e9).toFixed(1)}GB (${((d.used/d.size)*100).toFixed(1)}%)`).join(', ')}</div>
              <div><b>Uptime:</b> {Math.floor(status.uptime/3600)}h {Math.floor((status.uptime%3600)/60)}m</div>
              <div><b>OS:</b> {status.os.distro} {status.os.release}</div>
            </div>
          ) : <p>No status data.</p>}
        </section>
        <section style={{ marginBottom: 32 }}>
          <h2>Running Processes (Top 10)</h2>
          {procLoading ? (
            <p>Loading processes...</p>
          ) : (
            <table className="process-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>Name</th>
                  <th>User</th>
                  <th>CPU%</th>
                  <th>Mem%</th>
                </tr>
              </thead>
              <tbody>
                {processes.map(proc => (
                  <tr key={proc.pid}>
                    <td>{proc.pid}</td>
                    <td>{proc.name}</td>
                    <td>{proc.user}</td>
                    <td>{(proc.pcpu ?? 0).toFixed(1)}</td>
                    <td>{(proc.pmem ?? 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section>
          <h2>Server Controls</h2>
          <button onClick={handleReboot} disabled={rebooting} style={{ fontSize: 18, padding: '8px 24px' }}>
            {rebooting ? 'Rebooting...' : 'Reboot Server'}
          </button>
          {rebootMsg && <div style={{ marginTop: 12 }}>{rebootMsg}</div>}
        </section>
      </main>
    </div>
  );
}

export default App;
