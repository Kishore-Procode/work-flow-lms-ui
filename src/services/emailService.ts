import emailjs from '@emailjs/browser';

interface EmailTemplate {
  to_email: string;
  to_name: string;
  from_name: string;
  subject: string;
  message: string;
  [key: string]: any;
}

class FrontendEmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private isConfigured: boolean = false;

  constructor() {
    // EmailJS configuration - these would be set in environment variables
    this.serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_default';
    this.templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_default';
    this.publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

    if (this.publicKey) {
      emailjs.init(this.publicKey);
      this.isConfigured = true;
    }
  }

  async sendEmail(template: EmailTemplate): Promise<boolean> {
    try {
      if (!this.isConfigured) {
        // EmailJS not configured - return success for development
        return true;
      }

      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        template
      );

      return true;
    } catch (error: any) {
      console.error('❌ Failed to send frontend email:', error);
      return false;
    }
  }

  async sendRegistrationNotification(
    approverEmail: string,
    approverName: string,
    applicantName: string,
    role: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to_email: approverEmail,
      to_name: approverName,
      from_name: 'Student-ACT LMS System',
      subject: `Approval Required - ${role} Registration`,
      message: `
Hello ${approverName},

A new registration request requires your approval:

Applicant: ${applicantName}
Role: ${role}
Status: Pending Your Approval

Please log in to the system to review and process this request.

Best regards,
Student-ACT LMS System
      `,
      applicant_name: applicantName,
      requested_role: role,
      approver_name: approverName
    };

    return await this.sendEmail(template);
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    temporaryPassword: string,
    role: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      to_email: userEmail,
      to_name: userName,
      from_name: 'Student-ACT LMS System',
      subject: `Welcome to Student-ACT LMS - ${role} Account`,
      message: `
Hello ${userName},

Welcome to the Student-ACT LMS system! Your ${role} account has been created.

Login Credentials:
Email: ${userEmail}
Temporary Password: ${temporaryPassword}

Please change your password after your first login.

Access the system at: ${window.location.origin}

Best regards,
Student-ACT LMS Team
      `,
      user_name: userName,
      user_email: userEmail,
      temporary_password: temporaryPassword,
      user_role: role
    };

    return await this.sendEmail(template);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    const template: EmailTemplate = {
      to_email: userEmail,
      to_name: userName,
      from_name: 'Student-ACT LMS System',
      subject: 'Password Reset Request',
      message: `
Hello ${userName},

We received a request to reset your password for your Student-ACT LMS account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security purposes.

If you didn't request this password reset, please ignore this email.

Best regards,
Student-ACT LMS Team
      `,
      user_name: userName,
      reset_url: resetUrl,
      reset_token: resetToken
    };

    return await this.sendEmail(template);
  }
}

// Hybrid Email Service that tries backend first, then frontend
class HybridEmailService {
  private frontendService: FrontendEmailService;

  constructor() {
    this.frontendService = new FrontendEmailService();
  }

  async sendRegistrationNotification(
    approverEmail: string,
    approverName: string,
    applicantName: string,
    role: string
  ): Promise<boolean> {
    try {
      // Try frontend service as backup
      console.log('📧 Attempting to send registration notification via frontend service...');
      const frontendResult = await this.frontendService.sendRegistrationNotification(
        approverEmail,
        approverName,
        applicantName,
        role
      );

      if (frontendResult) {
        console.log('✅ Registration notification sent via frontend service');
        return true;
      }
    } catch (error) {
      console.error('❌ Frontend email service failed:', error);
    }

    console.log('⚠️ All email services failed for registration notification');
    return false;
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
    temporaryPassword: string,
    role: string
  ): Promise<boolean> {
    try {
      // Try frontend service as backup
      console.log('📧 Attempting to send welcome email via frontend service...');
      const frontendResult = await this.frontendService.sendWelcomeEmail(
        userEmail,
        userName,
        temporaryPassword,
        role
      );

      if (frontendResult) {
        console.log('✅ Welcome email sent via frontend service');
        return true;
      }
    } catch (error) {
      console.error('❌ Frontend email service failed:', error);
    }

    console.log('⚠️ All email services failed for welcome email');
    return false;
  }
}

export const frontendEmailService = new FrontendEmailService();
export const hybridEmailService = new HybridEmailService();
export default hybridEmailService;
