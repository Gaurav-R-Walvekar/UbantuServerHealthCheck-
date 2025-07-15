const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const { exec } = require('child_process');

const app = express();
const PORT = 5051;

app.use(cors());
app.use(express.json());

// Get server status
app.get('/serverApp/api/status', async (req, res) => {
  try {
    const [cpu, mem, disk, osInfo, uptime] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.time()
    ]);
    res.json({
      cpu: cpu.currentLoad,
      memory: { total: mem.total, used: mem.used, free: mem.free },
      disk: disk.map(d => ({ fs: d.fs, size: d.size, used: d.used, use: d.use })),
      os: osInfo,
      uptime: uptime.uptime
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get status', details: err.message });
  }
});

// Get running processes
app.get('/serverApp/api/processes', async (req, res) => {
  try {
    const processes = await si.processes();
    res.json(processes.list);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get processes', details: err.message });
  }
});

// Reboot server (POST for safety)
app.post('/serverApp/api/reboot', (req, res) => {
  // Optional: Add authentication or secret here
  exec('sudo reboot', (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to reboot', details: stderr });
    }
    res.json({ message: 'Rebooting...' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 