require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 20,
    fieldSize: 100 * 1024 * 1024
  }
});

app.post('/api/send-report', upload.array('photos'), async (req, res) => {
  try {
    const {
      name,
      phone,
      truckNumber,
      trailerNumber,
      loadNumber,
      loadStatus,
      location,
      breakdown,
      safety,
      dockRisk
    } = req.body;

    const files = req.files || [];

    if (!name || !phone || !truckNumber || !trailerNumber || !loadStatus || !location || !breakdown) {
      return res.status(400).send('Missing required fields.');
    }
    if (files.length === 0) return res.status(400).send('At least one photo is required.');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'reporttruck6@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailBody = `
TRUCK BREAKDOWN REPORT
======================

Driver Name:      ${name}
Phone:            ${phone}
Location:         ${location}

Truck Number:     ${truckNumber}
Trailer Number:   ${trailerNumber}
Load Number:      ${loadNumber || '-'}
Load Status:      ${loadStatus}
At Risk of Missing Dock Time: ${dockRisk === 'Yes' ? 'Yes' : 'No'}

Nature of Breakdown:
${breakdown}

Safety Concerns:
${safety || 'None reported'}

--
Submitted via Truck Report App
`.trim();

    const attachments = files.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    const recipients = [
      //'roadassist@gavrofreight.com',
      //'shop@gavrofreight.com',
      //'dispatch@gavrofreight.com'
      'dare_rn@hotmail.com'
    ];

    await transporter.sendMail({
      from: '"Truck Report App" <reporttruck6@gmail.com>',
      to: recipients.join(', '),
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));