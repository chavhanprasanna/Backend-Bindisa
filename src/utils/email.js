import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import config from '../config/env.js';
import logger from './logger.js';
import { ApiError } from './apiError.js';

// Create a test account for development
const createTestAccount = async() => {
  if (config.NODE_ENV === 'development' && !config.EMAIL_HOST) {
    const testAccount = await nodemailer.createTestAccount();
    return {
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    };
  }

  return {
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT || 587,
    secure: config.EMAIL_SECURE === 'true',
    auth: {
      user: config.EMAIL_USERNAME,
      pass: config.EMAIL_PASSWORD
    }
  };
};

// Create transporter
const createTransporter = async() => {
  const smtpConfig = await createTestAccount();

  return nodemailer.createTransport({
    ...smtpConfig,
    tls: {
      rejectUnauthorized: false
    },
    logger: config.NODE_ENV === 'development',
    debug: config.NODE_ENV === 'development'
  });
};

// Compile email template
const compileTemplate = async(templateName, data) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      'emails',
      `${templateName}.hbs`
    );

    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateContent);
    return template(data);
  } catch (error) {
    logger.error('Error compiling email template:', error);
    throw new ApiError(500, 'Failed to compile email template');
  }
};

// Send email
const sendEmail = async(options) => {
  try {
    const {
      to,
      subject,
      template,
      context = {},
      attachments = [],
      from = `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_EMAIL}>`
    } = options;

    // Validate required fields
    if (!to) {
      throw new ApiError(400, 'Recipient email is required');
    }

    if (!subject) {
      throw new ApiError(400, 'Email subject is required');
    }

    // Compile template if provided
    let html;
    if (template) {
      html = await compileTemplate(template, context);
    }

    // Create transporter
    const transporter = await createTransporter();

    // Send email
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text: html ? undefined : context.text,
      attachments
    });

    // Log email info in development
    if (config.NODE_ENV === 'development') {
      logger.info('Message sent: %s', info.messageId);
      logger.info('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw new ApiError(500, 'Failed to send email');
  }
};

// Email templates
const emailTemplates = {
  // Welcome email
  sendWelcomeEmail: async(user, token) => {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Our Platform',
      template: 'welcome', // welcome.hbs
      context: {
        name: user.name || 'User',
        verificationUrl,
        supportEmail: config.SUPPORT_EMAIL,
        appName: config.APP_NAME
      }
    });
  },

  // Password reset email
  sendPasswordResetEmail: async(user, token) => {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset', // password-reset.hbs
      context: {
        name: user.name || 'User',
        resetUrl,
        expiresIn: '1 hour',
        supportEmail: config.SUPPORT_EMAIL,
        appName: config.APP_NAME
      }
    });
  },

  // Email verification
  sendVerificationEmail: async(user, token) => {
    const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: 'email-verification', // email-verification.hbs
      context: {
        name: user.name || 'User',
        verificationUrl,
        expiresIn: '24 hours',
        supportEmail: config.SUPPORT_EMAIL,
        appName: config.APP_NAME
      }
    });
  },

  // Generic notification
  sendNotification: async(user, subject, message) => {
    await sendEmail({
      to: user.email,
      subject,
      template: 'notification', // notification.hbs
      context: {
        name: user.name || 'User',
        message,
        appName: config.APP_NAME,
        supportEmail: config.SUPPORT_EMAIL
      }
    });
  }
};

export { sendEmail, emailTemplates };
