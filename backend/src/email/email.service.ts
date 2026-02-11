import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('✅ Resend email service initialized');
    } else {
      this.logger.warn('⚠️  RESEND_API_KEY not set - email functionality will be disabled');
      this.logger.warn('📧 Emails will be logged to console instead');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your KHY CRM account. Click the button below to create a new password:</p>

            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${resetUrl}</p>

            <div class="warning">
              <strong>⚠️ Security Note:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>

            <p>Best regards,<br>The KHY Group Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from KHY CRM. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.\n\nBest regards,\nThe KHY Group Team`;

    try {
      if (!this.resend) {
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('📧 [DEV MODE] Password Reset Email');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: Reset Your Password - KHY CRM`);
        this.logger.log(`Reset URL: ${resetUrl}`);
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Reset Your Password - KHY CRM',
        html,
        text,
      });

      this.logger.log(`✅ Password reset email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email: string, userName: string, tempPassword?: string): Promise<void> {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .credentials { background: white; border: 2px solid #2563eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to KHY CRM! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Your account has been created successfully! You now have access to the KHY CRM Dashboard.</p>

            ${tempPassword ? `
              <div class="credentials">
                <p><strong>Your Login Credentials:</strong></p>
                <p>Email: <strong>${email}</strong></p>
                <p>Temporary Password: <strong>${tempPassword}</strong></p>
                <p style="color: #f59e0b; margin-top: 15px;">⚠️ Please change your password after first login</p>
              </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to KHY CRM</a>
            </div>

            <p>If you have any questions or need assistance, please contact your administrator.</p>

            <p>Best regards,<br>The KHY Group Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message from KHY CRM.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nWelcome to KHY CRM! Your account has been created successfully.\n\n${tempPassword ? `Your temporary password is: ${tempPassword}\n\nPlease change it after first login.\n\n` : ''}Login at: ${loginUrl}\n\nBest regards,\nThe KHY Group Team`;

    try {
      if (!this.resend) {
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('📧 [DEV MODE] Welcome Email');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: Welcome to KHY CRM`);
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Welcome to KHY CRM',
        html,
        text,
      });

      this.logger.log(`✅ Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send welcome email to ${email}:`, error);
      // Don't throw error for welcome emails - it's not critical
    }
  }

  async sendPasswordChangedEmail(email: string, userName: string): Promise<void> {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Password Changed</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>This is to confirm that your password was successfully changed.</p>

            <div class="alert">
              <strong>⚠️ Didn't make this change?</strong>
              <p style="margin: 10px 0;">If you didn't change your password, please contact your administrator immediately.</p>
            </div>

            <p>Best regards,<br>The KHY Group Team</p>
          </div>
          <div class="footer">
            <p>This is an automated security notification from KHY CRM.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Hi ${userName},\n\nThis is to confirm that your password was successfully changed.\n\nIf you didn't make this change, please contact your administrator immediately.\n\nBest regards,\nThe KHY Group Team`;

    try {
      if (!this.resend) {
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('📧 [DEV MODE] Password Changed Email');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log(`To: ${email}`);
        this.logger.log(`Subject: Password Changed - KHY CRM`);
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }

      await this.resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Password Changed - KHY CRM',
        html,
        text,
      });

      this.logger.log(`✅ Password changed email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send password changed email to ${email}:`, error);
      // Don't throw error - it's a notification email
    }
  }
}
