require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE_MB = 1;
const MAX_FILES = 4;
const MAX_TOTAL_ATTACHMENTS_MB = 4;

const bytesFromMb = (mb) => mb * 1024 * 1024;
const maxFileSizeBytes = bytesFromMb(MAX_FILE_SIZE_MB);
const maxTotalAttachmentsBytes = bytesFromMb(MAX_TOTAL_ATTACHMENTS_MB);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '4.5mb' }));
app.use(express.urlencoded({ limit: '4.5mb', extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSizeBytes,
    files: MAX_FILES,
    fieldSize: 4.5 * 1024 * 1024
  }
});

app.post('/api/send-report', upload.array('photos'), async (req, res) => {
  try {

    const {
      name,
      phone,
      driverEmail,
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
    const totalAttachmentBytes = files.reduce((sum, file) => sum + file.size, 0);

    if (!name || !phone || !driverEmail || !truckNumber || !trailerNumber || !loadStatus || !location || !breakdown) {
      return res.status(400).send('Missing required fields.');
    }

    if (files.length === 0) {
      return res.status(400).send('At least one photo is required.');
    }

    if (totalAttachmentBytes > maxTotalAttachmentsBytes) {
      return res.status(400).send(`Total photo size is too large. Keep all photos under ${MAX_TOTAL_ATTACHMENTS_MB} MB combined.`);
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'reporttruck6@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const emailBody = `
    🚛 TRUCK BREAKDOWN REPORT

    Truck: ${truckNumber}
    Location: ${location}
    Load Status: ${loadStatus}
    Dock Risk: ${dockRisk === 'Yes' ? '⚠ YES' : 'No'}

    ----------------------------------------

    👤 DRIVER
    Name: ${name}
    Phone: ${phone}
    Email: ${driverEmail}

    ----------------------------------------

    🚚 VEHICLE
    Truck Number: ${truckNumber}
    Trailer Number: ${trailerNumber}
    Load Number: ${loadNumber || '-'}

    ----------------------------------------

    🔧 BREAKDOWN DETAILS
    ${breakdown}

    ----------------------------------------

    ⚠ SAFETY CONCERNS
    ${safety || 'None reported'}

    ----------------------------------------

    Gavro Freight | Breakdown Report System
    `.trim();

    const attachments = files.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    }));

    const recipients = [
      'roadassist@gavrofreight.com',
      'shop@gavrofreight.com',
      'dispatch@gavrofreight.com',
      'jewel@gavrofreight.com'
    ];

    await transporter.sendMail({
      from: '"Truck Report App" <reporttruck6@gmail.com>',
      to: recipients.join(', '),

      // driver receives copy
      cc: driverEmail || undefined,

      subject: `Breakdown Report — Truck ${truckNumber} | ${new Date().toLocaleDateString('en-GB')}`,
      text: emailBody,
      attachments
    });

    res.status(200).send('Report sent successfully.');

  } catch (err) {
    console.error('SERVER ERROR:', err);

    // SMTP authentication failure
    if (err.code === 'EAUTH' || (err.responseCode >= 530 && err.responseCode <= 538)) {
      return res.status(502).send('EMAIL_AUTH_FAILURE');
    }

    // SMTP connection / timeout
    if (err.code === 'ECONNECTION' || err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') {
      return res.status(502).send('EMAIL_CONNECTION_FAILURE');
    }

    res.status(500).send('Failed to send report. Contact the administrator or try again later.');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send(`A photo is too large. Max per photo: ${MAX_FILE_SIZE_MB} MB.`);
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).send(`Too many photos. Max allowed: ${MAX_FILES}.`);
    }

    if (err.code === 'LIMIT_FIELD_SIZE') {
      return res.status(400).send('One of the form fields is too large.');
    }

    return res.status(400).send(`Upload failed: ${err.message}`);
  }

  return next(err);
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));