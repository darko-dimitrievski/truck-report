const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Multer configuration (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per file
});

// API route
app.post('/api/send-report', upload.array('photos'), async (req, res) => {
  try {
    const { name, surname, truckNumber, trailerNumber, email, location } = req.body;
    const files = req.files || [];

    // Validate required fields
    if (!name || !surname || !truckNumber || !email) {
      return res.status(400).send('Missing required fields');
    }

    if (files.length === 0) {
      return res.status(400).send('At least one photo is required');
    }

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'reporttruck6@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      }
    });

    // Prepare attachments from memory
    const attachments = files.map(file => ({
      filename: file.originalname,
      content: file.buffer
    }));

    const emailBody = `
Name: ${name}
Surname: ${surname}
Truck Number: ${truckNumber}
Trailer Number: ${trailerNumber || '-'}
Location: ${location || '-'}
`;

    await transporter.sendMail({
      from: 'reporttruck6@gmail.com',
      to: email,
      subject: `Truck Report: ${truckNumber}`,
      text: emailBody,
      attachments
    });

    res.status(200).send('Report sent successfully');
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).send('Failed to send report');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
