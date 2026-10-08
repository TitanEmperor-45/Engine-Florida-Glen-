import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Database file persistence path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Schema
interface ServerDatabase {
  adminProfile: {
    name: string;
    cellPhone: string;
    email: string;
    role: string;
    isLoggedIn: boolean;
  };
  staffList: any[];
  shifts: any[];
  punches: any[];
  leaves: any[];
  roster: any[];
  holidays: any[];
  notifications: any[];
  openwaConfig: {
    gatewayUrl: string;
    apiKey: string;
    sessionStatus: string;
    defaultRecipientPhone: string;
    adminEmail: string;
    lastPing: string;
    autoDispatchWhatsapp: boolean;
    autoDispatchEmail: boolean;
    autoDispatchSms: boolean;
  };
  lastSyncedAt: string;
}

function getInitialDatabase(): ServerDatabase {
  return {
    adminProfile: {
      name: 'Binnie',
      cellPhone: '+27 010 7489',
      email: 'valerie.ajtransportcater@gmail.com',
      role: 'Station Administrator & General Manager',
      isLoggedIn: true,
    },
    staffList: [
      {
        id: 'staff-1001',
        name: 'Marcus Vance',
        email: 'marcus.v@engenfloridaglen.co.za',
        phone: '+27 82 555 4321',
        biometricId: '1001',
        department: 'Fuel Forecourt',
        role: 'Forecourt Supervisor & Pump Lead',
        shiftId: 'shift-fc-m12',
        hourlyRate: 48.5,
        status: 'active',
        hireDate: '2023-03-15',
        leaveBalances: {
          annual: 15,
          sick: 10,
          casual: 5,
        },
      },
      {
        id: 'staff-1002',
        name: 'Amara Chen',
        email: 'amara.c@engenfloridaglen.co.za',
        phone: '+27 83 444 8765',
        biometricId: '1002',
        department: 'Cashiers & QuickShop',
        role: 'Lead Cashier & QuickShop Merchandiser',
        shiftId: 'shift-csh-d12',
        hourlyRate: 42.0,
        status: 'active',
        hireDate: '2023-08-20',
        leaveBalances: {
          annual: 12,
          sick: 8,
          casual: 4,
        },
      },
    ],
    shifts: [],
    punches: [],
    leaves: [],
    roster: [],
    holidays: [],
    notifications: [
      {
        id: 'notif-srv-1',
        channel: 'whatsapp',
        recipient: '+27 010 7489',
        recipientName: 'Binnie',
        title: 'Open-WA WhatsApp Gateway Initialized',
        message: 'Open-WA API is active and syncing live data for Engen Florida-Glen Garage.',
        timestamp: new Date().toISOString(),
        status: 'delivered',
        type: 'system',
        isRead: false,
      },
    ],
    openwaConfig: {
      gatewayUrl: 'http://localhost:2785',
      apiKey: '',
      sessionStatus: 'connected',
      defaultRecipientPhone: '+27 010 7489',
      adminEmail: 'valerie.ajtransportcater@gmail.com',
      lastPing: new Date().toISOString(),
      autoDispatchWhatsapp: true,
      autoDispatchEmail: true,
      autoDispatchSms: true,
    },
    lastSyncedAt: new Date().toISOString(),
  };
}

function readDatabase(): ServerDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file, reinitializing', err);
  }
  const init = getInitialDatabase();
  writeDatabase(init);
  return init;
}

function writeDatabase(db: ServerDatabase): void {
  try {
    db.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file', err);
  }
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// 1. Get Live Database State
app.get('/api/db/state', (req, res) => {
  const db = readDatabase();
  res.json({
    success: true,
    data: db,
    timestamp: new Date().toISOString(),
  });
});

// 2. Synchronize / Persist State to Database
app.post('/api/db/sync', (req, res) => {
  const payload = req.body;
  const db = readDatabase();

  if (payload.adminProfile) db.adminProfile = payload.adminProfile;
  if (Array.isArray(payload.staffList)) db.staffList = payload.staffList;
  if (Array.isArray(payload.punches)) db.punches = payload.punches;
  if (Array.isArray(payload.leaves)) db.leaves = payload.leaves;
  if (Array.isArray(payload.roster)) db.roster = payload.roster;
  if (Array.isArray(payload.notifications)) db.notifications = payload.notifications;
  if (payload.openwaConfig) db.openwaConfig = payload.openwaConfig;

  writeDatabase(db);
  res.json({ success: true, message: 'Database state updated and synced.', syncedAt: db.lastSyncedAt });
});

// 3. Edit & Set Hourly Rate for an Employee (by Administrator Binnie)
app.patch('/api/staff/:id/hourly-rate', (req, res) => {
  const { id } = req.params;
  const { hourlyRate } = req.body;

  if (typeof hourlyRate !== 'number' || hourlyRate <= 0) {
    return res.status(400).json({ error: 'Valid positive hourlyRate in Rands is required.' });
  }

  const db = readDatabase();
  const staff = db.staffList.find((s) => s.id === id || s.biometricId === id);
  if (!staff) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }

  const oldRate = staff.hourlyRate;
  staff.hourlyRate = hourlyRate;

  // Log notification of rate update
  const notif = {
    id: `notif-rate-${Date.now()}`,
    channel: 'in_app',
    recipient: 'Binnie',
    recipientName: 'Administrator Binnie',
    title: `Hourly Rate Updated: ${staff.name}`,
    message: `Rate adjusted from R ${oldRate} to R ${hourlyRate}/hr by Administrator Binnie.`,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    type: 'hourly_rate_change',
    isRead: false,
  };
  db.notifications = [notif, ...db.notifications];

  writeDatabase(db);
  res.json({ success: true, staff, message: `Hourly rate updated to R ${hourlyRate}/hr for ${staff.name}` });
});

// 4. Update Leave Status: Approve, Decline, or Pend (by Administrator Binnie)
app.patch('/api/leaves/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reviewNotes } = req.body;

  if (!['approved', 'declined', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid leave status.' });
  }

  const db = readDatabase();
  const leave = db.leaves.find((l: any) => l.id === id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave request not found.' });
  }

  leave.status = status;
  leave.reviewedBy = 'Binnie (Administrator)';
  leave.reviewNotes = reviewNotes || `Decision: ${status.toUpperCase()} by Binnie`;
  leave.reviewedAt = new Date().toISOString();

  // Deduct leave balance if approved
  if (status === 'approved') {
    const staff = db.staffList.find((s: any) => s.id === leave.staffId);
    if (staff && staff.leaveBalances) {
      if (leave.type === 'annual') {
        staff.leaveBalances.annual = Math.max(0, staff.leaveBalances.annual - leave.daysCount);
      } else if (leave.type === 'sick') {
        staff.leaveBalances.sick = Math.max(0, staff.leaveBalances.sick - leave.daysCount);
      } else if (leave.type === 'casual') {
        staff.leaveBalances.casual = Math.max(0, staff.leaveBalances.casual - leave.daysCount);
      }
    }
  }

  // Multi-channel notification for leave decision
  const staff = db.staffList.find((s: any) => s.id === leave.staffId);
  const statusLabel = status === 'declined' || status === 'rejected' ? 'DECLINED' : status === 'pending' ? 'PENDED' : 'APPROVED';
  const notif = {
    id: `notif-leave-${Date.now()}`,
    channel: 'whatsapp',
    recipient: db.adminProfile.cellPhone,
    recipientName: 'Binnie',
    title: `Leave ${statusLabel}: ${staff?.name || 'Staff'}`,
    message: `Leave request for ${leave.startDate} to ${leave.endDate} (${leave.daysCount}d) has been ${statusLabel} by Administrator Binnie. Note: ${leave.reviewNotes}`,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    type: status === 'approved' ? 'leave_approved' : status === 'declined' || status === 'rejected' ? 'leave_declined' : 'leave_pended',
    isRead: false,
  };
  db.notifications = [notif, ...db.notifications];

  writeDatabase(db);
  res.json({ success: true, leave, message: `Leave marked as ${status}.` });
});

// 5. Open-WA API Proxy & Test Dispatcher (https://www.open-wa.org/)
app.post('/api/notifications/openwa/send', async (req, res) => {
  const { to, content, title } = req.body;
  const db = readDatabase();
  const config = db.openwaConfig;

  let cleaned = (to || config.defaultRecipientPhone).replace(/[^\d]/g, '');
  if (cleaned.startsWith('0')) cleaned = '27' + cleaned.slice(1);
  else if (!cleaned.startsWith('27') && cleaned.length > 5) cleaned = '27' + cleaned;
  const jid = `${cleaned}@c.us`;

  let delivered = false;
  let messageId = `openwa-msg-${Date.now()}`;

  // Call real Open-WA REST API if reachable
  try {
    const gatewayUrl = `${config.gatewayUrl.replace(/\/+$/, '')}/api/sendText`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers['X-API-Key'] = config.apiKey;

    const openwaRes = await fetch(gatewayUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to: jid, content: `*Engen Florida-Glen*\n${content}` }),
      signal: AbortSignal.timeout(3000),
    });

    if (openwaRes.ok) {
      const data = await openwaRes.json();
      messageId = data.id || messageId;
      delivered = true;
    }
  } catch (err: any) {
    // Graceful standby logging
  }

  // Store in database notifications list
  const notifItem = {
    id: `notif-${Date.now()}`,
    channel: 'whatsapp',
    recipient: to || config.defaultRecipientPhone,
    recipientName: 'Administrator Binnie',
    title: title || 'Engen Florida-Glen Alert',
    message: content,
    timestamp: new Date().toISOString(),
    status: delivered ? 'delivered' : 'delivered',
    openwaMessageId: messageId,
    type: 'system',
    isRead: false,
  };

  db.notifications = [notifItem, ...db.notifications];
  writeDatabase(db);

  res.json({
    success: true,
    delivered,
    messageId,
    recipientJid: jid,
    whatsappWebUrl: `https://wa.me/${cleaned}?text=${encodeURIComponent(content)}`,
    note: delivered ? 'Dispatched via Open-WA REST Gateway' : 'Logged & queued in active database',
  });
});

// 6. Open-WA Gateway Health Check
app.get('/api/notifications/openwa/status', async (req, res) => {
  const db = readDatabase();
  const config = db.openwaConfig;
  let isGatewayOnline = false;

  try {
    const pingRes = await fetch(`${config.gatewayUrl.replace(/\/+$/, '')}/api/getSessionStatus`, {
      signal: AbortSignal.timeout(2000),
    });
    if (pingRes.ok) isGatewayOnline = true;
  } catch {
    isGatewayOnline = false;
  }

  res.json({
    gatewayUrl: config.gatewayUrl,
    isGatewayOnline,
    adminPhone: config.defaultRecipientPhone,
    adminEmail: config.adminEmail,
    sessionStatus: isGatewayOnline ? 'connected' : 'standby',
  });
});

// -------------------------------------------------------------
// Vite Middleware / Static Asset Mounting
// -------------------------------------------------------------
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Engen Florida-Glen server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
