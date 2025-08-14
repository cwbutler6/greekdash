import { Resend } from 'resend';

// Initialize Resend with API key
export const resend = new Resend(process.env.RESEND_API_KEY);

// Define email template types for type safety
export type EmailTemplate = 'passwordReset' | 'chapterInvite' | 'memberApproval' | 'chapterBroadcast' | 'donationConfirmation';

// Email templates
export const emailTemplates = {
  // Password reset template
  passwordReset: (resetLink: string, userName: string) => ({
    subject: 'Reset Your GreekDash Password',
    react: null, // We're using HTML for now, but could use React templates in the future
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Reset Your GreekDash Password</h2>
        <p>Hello ${userName || 'there'},</p>
        <p>We received a request to reset your password for your GreekDash account. If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below (link expires in 1 hour):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${resetLink}</p>
        <p>This password reset link will expire in 1 hour for security reasons.</p>
        <p>If you have any questions, please contact support.</p>
        <p>Thank you,<br>The GreekDash Team</p>
      </div>
    `,
    text: `
      Reset Your GreekDash Password
      
      Hello ${userName || 'there'},
      
      We received a request to reset your password for your GreekDash account. If you didn't make this request, you can safely ignore this email.
      
      To reset your password, visit the following link (expires in 1 hour):
      
      ${resetLink}
      
      This password reset link will expire in 1 hour for security reasons.
      
      If you have any questions, please contact support.
      
      Thank you,
      The GreekDash Team
    `
  }),
  
  // Chapter invite template
  chapterInvite: (inviteLink: string, chapterName: string, inviterName: string, roleName: string) => ({
    subject: `You've been invited to join ${chapterName} on GreekDash`,
    react: null,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Chapter Invitation</h2>
        <p>Hello,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${chapterName}</strong> as a <strong>${roleName}</strong> on GreekDash.</p>
        <p>GreekDash is a platform for managing fraternity and sorority chapter operations.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${inviteLink}</p>
        <p>This invitation expires in 7 days.</p>
        <p>If you weren't expecting this invitation, you can ignore this email.</p>
        <p>Thank you,<br>The GreekDash Team</p>
      </div>
    `,
    text: `
      Chapter Invitation to ${chapterName}
      
      Hello,
      
      ${inviterName} has invited you to join ${chapterName} as a ${roleName} on GreekDash.
      
      GreekDash is a platform for managing fraternity and sorority chapter operations.
      
      To accept this invitation, visit the following link (expires in 7 days):
      
      ${inviteLink}
      
      If you weren't expecting this invitation, you can ignore this email.
      
      Thank you,
      The GreekDash Team
    `
  }),
  
  // Member approval notification
  memberApproval: (loginLink: string, chapterName: string, memberName: string) => ({
    subject: `Your membership has been approved for ${chapterName}`,
    react: null,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Membership Approved</h2>
        <p>Hello ${memberName},</p>
        <p>Your membership request for <strong>${chapterName}</strong> has been approved!</p>
        <p>You now have access to the chapter's portal and resources.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to Chapter Portal</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;">${loginLink}</p>
        <p>Thank you,<br>The GreekDash Team</p>
      </div>
    `,
    text: `
      Membership Approved for ${chapterName}
      
      Hello ${memberName},
      
      Your membership request for ${chapterName} has been approved!
      
      You now have access to the chapter's portal and resources.
      
      To access your chapter portal, visit:
      
      ${loginLink}
      
      Thank you,
      The GreekDash Team
    `
  }),
  
  // Chapter broadcast message
  chapterBroadcast: (chapterName: string, subject: string, message: string, senderName: string) => ({
    subject: `${subject} - ${chapterName} Announcement`,
    react: null,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">${chapterName} Announcement</h2>
        <p>Hello,</p>
        <div style="border-left: 4px solid #4f46e5; padding-left: 15px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p>Sent by: ${senderName}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This is an official message from your chapter administrators on GreekDash.</p>
      </div>
    `,
    text: `
      ${chapterName} Announcement: ${subject}
      
      Hello,
      
      ${message}
      
      Sent by: ${senderName}
      
      This is an official message from your chapter administrators on GreekDash.
    `
  }),
  // Donation confirmation template
  donationConfirmation: (donorName: string, amount: number, chapterName: string, campaignTitle?: string, receiptUrl?: string) => ({
    subject: `Thank you for your donation to ${chapterName}`,
    react: null,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Donation Confirmation</h2>
        <p>Dear ${donorName},</p>
        <p>Thank you for your generous donation to <strong>${chapterName}</strong>!</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b;">Donation Details</h3>
          <p style="margin: 5px 0;"><strong>Amount:</strong> $${amount.toFixed(2)}</p>
          ${campaignTitle ? `<p style="margin: 5px 0;"><strong>Campaign:</strong> ${campaignTitle}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Your contribution makes a meaningful difference and helps support our chapter's mission and activities.</p>
        
        ${receiptUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${receiptUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Receipt</a>
        </div>
        ` : ''}
        
        <p>If you have any questions about your donation, please don't hesitate to contact us.</p>
        
        <p>With gratitude,<br>The ${chapterName} Team</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">This is a confirmation of your donation processed securely through Stripe.</p>
      </div>
    `,
    text: `
      Donation Confirmation - ${chapterName}
      
      Dear ${donorName},
      
      Thank you for your generous donation to ${chapterName}!
      
      Donation Details:
      Amount: $${amount.toFixed(2)}
      ${campaignTitle ? `Campaign: ${campaignTitle}\n` : ''}Date: ${new Date().toLocaleDateString()}
      
      Your contribution makes a meaningful difference and helps support our chapter's mission and activities.
      
      ${receiptUrl ? `View your receipt: ${receiptUrl}\n\n` : ''}If you have any questions about your donation, please don't hesitate to contact us.
      
      With gratitude,
      The ${chapterName} Team
      
      This is a confirmation of your donation processed securely through Stripe.
    `
  }),
};

// Interface for email data
interface EmailData {
  // For password reset
  link?: string;
  name?: string;
  
  // For chapter invites
  inviteLink?: string;
  chapterName?: string;
  inviterName?: string;
  roleName?: string;
  
  // For member approval
  loginLink?: string;
  memberName?: string;
  
  // For chapter broadcasts
  subject?: string;
  message?: string;
  senderName?: string;
  
  // For donation confirmation
  donorName?: string;
  amount?: number;
  campaignTitle?: string;
  receiptUrl?: string;
}

/**
 * Send an email using Resend
 * @param to Recipient email address
 * @param template Email template to use
 * @param data Template data
 * @returns Object with success status and info or error
 */
export async function sendEmail(to: string, template: EmailTemplate, data: EmailData) {
  try {
    // Determine which template to use and generate the email content
    let emailContent;
    
    switch (template) {
      case 'passwordReset':
        emailContent = emailTemplates.passwordReset(data.link || '', data.name || '');
        break;
      case 'chapterInvite':
        emailContent = emailTemplates.chapterInvite(
          data.inviteLink || '',
          data.chapterName || '',
          data.inviterName || '',
          data.roleName || 'Member'
        );
        break;
      case 'memberApproval':
        emailContent = emailTemplates.memberApproval(
          data.loginLink || '',
          data.chapterName || '',
          data.memberName || ''
        );
        break;
      case 'chapterBroadcast':
        emailContent = emailTemplates.chapterBroadcast(
          data.chapterName || '',
          data.subject || 'Important Announcement',
          data.message || '',
          data.senderName || 'Chapter Admin'
        );
        break;
      case 'donationConfirmation':
        emailContent = emailTemplates.donationConfirmation(
          data.donorName || 'Donor',
          data.amount || 0,
          data.chapterName || '',
          data.campaignTitle,
          data.receiptUrl
        );
        break;
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
    
    // Send the email via Resend
    const { subject, html, text } = emailContent;
    
    const from = process.env.EMAIL_FROM || 'noreply@greekdash.com';
    
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text
    });
    
    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`);
    }
    
    // Log email details in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent successfully:', {
        to,
        subject,
        template,
        id: result.data?.id
      });
    }
    
    return { success: true, info: result.data };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
