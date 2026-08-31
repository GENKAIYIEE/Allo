require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      // Remove spaces if any
      pass: process.env.SMTP_PASS.replace(/\s+/g, ''),
    },
  });

  try {
    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('SMTP Connection Successful!');
  } catch (error) {
    console.error('SMTP Connection Failed:', error.message);
  }
}

testSMTP();
