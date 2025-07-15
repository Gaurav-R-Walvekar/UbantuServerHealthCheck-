import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState(null);
  // Removed processes state and related variables
  const [loading, setLoading] = useState(true);
  const [rebooting, setRebooting] = useState(false);
  const [rebootMsg, setRebootMsg] = useState('');
  const [error, setError] = useState('');
  const [pm2List, setPm2List] = useState([]);
  const [pm2Loading, setPm2Loading] = useState(true);
  const [pm2Error, setPm2Error] = useState('');
  const [pm2Restarting, setPm2Restarting] = useState('');
  const [pm2RestartMsg, setPm2RestartMsg] = useState('');
  const [pm2Log, setPm2Log] = useState('');
  const [pm2LogApp, setPm2LogApp] = useState('');
  const [pm2LogLoading, setPm2LogLoading] = useState(false);
  const [pm2ClearLogMsg, setPm2ClearLogMsg] = useState('');

  useEffect(() => {
    fetch('https://serverstatus.aisoft.it.com/serverApp/api/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setError('Failed to fetch server status.'));

    // Removed fetch for processes
    // fetch('https://serverstatus.aisoft.it.com/serverApp/api/processes')
    //   .then(res => res.json())
    //   .then(data => {
    //     setProcesses(data.slice(0, 10)); // Show top 10 processes
    //     setProcLoading(false);
    //   })
    //   .catch(() => setError('Failed to fetch processes.'));

    fetch('https://serverstatus.aisoft.it.com/serverApp/api/pm2/list')
      .then(res => res.json())
      .then(data => {
        setPm2List(data);
        setPm2Loading(false);
      })
      .catch(() => {
        setPm2Error('Failed to fetch PM2 app list.');
        setPm2Loading(false);
      });
  }, []);

  const handleReboot = () => {
    if (!window.confirm('Are you sure you want to reboot the server?')) return;
    setRebooting(true);
    setRebootMsg('');
    fetch('https://serverstatus.aisoft.it.com/serverApp/api/reboot', { method: 'POST' })
      .then(res => res.json())
      .then(data => setRebootMsg(data.message || 'Reboot initiated.'))
      .catch(() => setRebootMsg('Failed to initiate reboot.'))
      .finally(() => setRebooting(false));
  };

  const handlePm2Restart = (name) => {
    if (!window.confirm(`Restart PM2 app '${name}'?`)) return;
    setPm2Restarting(name);
    setPm2RestartMsg('');
    fetch('https://serverstatus.aisoft.it.com/serverApp/api/pm2/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then(res => res.json())
      .then(data => setPm2RestartMsg(data.message || 'Restarted.'))
      .catch(() => setPm2RestartMsg('Failed to restart app.'))
      .finally(() => setPm2Restarting(''));
  };

  const fetchPm2Log = (name) => {
    setPm2Log('');
    setPm2LogApp(name);
    setPm2LogLoading(true);
    fetch(`https://serverstatus.aisoft.it.com/serverApp/api/pm2/logs?name=${encodeURIComponent(name)}&type=err&lines=100`)
      .then(res => res.json())
      .then(data => setPm2Log(data.log || 'No log found.'))
      .catch(() => setPm2Log('Failed to fetch log.'))
      .finally(() => setPm2LogLoading(false));
  };

  const clearPm2Log = (name) => {
    if (!window.confirm(`Are you sure you want to clear the error log for '${name}'?`)) return;
    setPm2ClearLogMsg('');
    fetch('https://serverstatus.aisoft.it.com/serverApp/api/pm2/clear-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type: 'err' })
    })
      .then(res => res.json())
      .then(data => {
        setPm2ClearLogMsg(data.message || 'Log cleared.');
        // If log is open for this app, refresh it
        if (pm2LogApp === name) fetchPm2Log(name);
      })
      .catch(() => setPm2ClearLogMsg('Failed to clear log.'));
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
        {/* Removed Running Processes (Top 10) section */}
        <section style={{ marginBottom: 32 }}>
          <h2>PM2 Applications</h2>
          {pm2Loading ? (
            <p>Loading PM2 apps...</p>
          ) : pm2Error ? (
            <div style={{ color: 'red' }}>{pm2Error}</div>
          ) : (
            <table className="process-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>PID</th>
                  <th>CPU%</th>
                  <th>Mem MB</th>
                  <th>Restarts</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pm2List.map(app => (
                  <tr key={app.pm_id}>
                    <td>{app.name}</td>
                    <td>{app.pm2_env?.status}</td>
                    <td>{app.pid}</td>
                    <td>{app.monit?.cpu}</td>
                    <td>{app.monit?.memory ? (app.monit.memory/1048576).toFixed(1) : ''}</td>
                    <td>{app.pm2_env?.restart_time}</td>
                    <td>
                      <button
                        onClick={() => handlePm2Restart(app.name)}
                        disabled={pm2Restarting === app.name}
                        style={{ padding: '4px 16px', fontSize: 15 }}
                      >
                        {pm2Restarting === app.name ? 'Restarting...' : 'Restart'}
                      </button>
                      <button
                        onClick={() => fetchPm2Log(app.name)}
                        style={{ padding: '4px 16px', fontSize: 15, marginLeft: 8 }}
                      >
                        View Error Log
                      </button>
                      <button
                        onClick={() => clearPm2Log(app.name)}
                        style={{ padding: '4px 16px', fontSize: 15, marginLeft: 8 }}
                      >
                        Clear Error Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {pm2RestartMsg && <div style={{ marginTop: 12 }}>{pm2RestartMsg}</div>}
        </section>
        {pm2LogApp && (
          <div style={{ marginTop: 16, background: '#222', color: '#fff', padding: 16, borderRadius: 8 }}>
            <h3>Error Log for {pm2LogApp}</h3>
            {pm2LogLoading ? <p>Loading...</p> : <pre style={{ maxHeight: 300, overflow: 'auto' }}>{pm2Log}</pre>}
            {pm2ClearLogMsg && <div style={{ color: '#0f0', marginTop: 8 }}>{pm2ClearLogMsg}</div>}
            <button onClick={() => setPm2LogApp('')}>Close</button>
          </div>
        )}
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
