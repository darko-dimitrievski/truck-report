require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Increase express body size limit
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Multer (memory storage, 25MB per file, 100MB total)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,   // 25MB per file
    files: 20,
    fieldSize: 100 * 1024 * 1024  // 100MB total fields
  }
});

// ========================
// POST /api/send-report
// ========================
app.post('/api/send-report', upload.array('photos'), async (req, res) => {
  try {
    const {
      name,
      truckNumber,
      trailerNumber,
      loadNumber,
      loadStatus,
      location,
      breakdown,
      safety
    } = req.body;

    const files = req.files || [];

    // CC recipients from checkboxes
    let cc = req.body.cc || [];
    if (typeof cc === 'string') cc = [cc];

    // Validate required fields
    if (!name || !truckNumber || !trailerNumber || !loadStatus || !location || !breakdown) {
      return res.status(400).send('Missing required fields.');
    }

    if (files.length === 0) {
      return res.status(400).send('At least one photo is required.');
    }

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'reporttruck6@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Email body
    const emailBody = `
TRUCK BREAKDOWN REPORT
======================

Driver Name:      ${name}
Location:         ${location}

Truck Number:     ${truckNumber}
Trailer Number:   ${trailerNumber}
Load Number:      ${loadNumber || '-'}
Load Status:      ${loadStatus}

Nature of Breakdown:
${breakdown}

Safety Concerns:
${safety || 'None reported'}

--
Submitted via Truck Report App
`.trim();

    // Attachments
    const attachments = files.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    await transporter.sendMail({
      from: '"Truck Report App" <reporttruck6@gmail.com>',
      to: 'roadassist@gavrofreight.com',
      cc: cc.length > 0 ? cc.join(', ') : undefined,
      subject: `Breakdown Report — Truck ${truckNumber} | ${new Date().toLocaleDateString('en-GB')}`,
      text: emailBody,
      attachments
    });

    res.status(200).send('Report sent successfully.');
  } catch (err) {
    console.error('SERVER ERROR:', err);
    res.status(500).send('Failed to send report. Please try again.');
  }
});

// Catch-all: serve index.html for PWA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});