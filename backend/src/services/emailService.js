import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;
const testOutbox = [];

export const isEmailConfigured = () => Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_PASSWORD);

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASSWORD },
    });
  }
  return transporter;
}

/**
 * Sends an email via SMTP. When SMTP is not configured nothing is sent and { sent: false } is returned
 * (no fake success). Under NODE_ENV=test messages are captured in memory so tests can read reset links.
 */
export async function sendEmail({ to, subject, text, html }) {
  if (env.isTest) {
    testOutbox.push({ to, subject, text, html });
    return { sent: true, captured: true };
  }
  if (!isEmailConfigured()) {
    logger.warn(`SMTP not configured; email "${subject}" to ${to} was not sent`);
    return { sent: false, reason: 'not_configured' };
  }
  try {
    await getTransporter().sendMail({ from: env.EMAIL_FROM, to, subject, text, html });
    return { sent: true };
  } catch (err) {
    logger.error(`Email delivery failed: ${err.message}`);
    return { sent: false, reason: 'delivery_failed' };
  }
}

export const getTestOutbox = () => testOutbox;
