import { config } from '../../config';
import {
  projectAccessEmailHtml,
  otpEmailHtml,
  passwordResetEmailHtml,
} from '../../resources/emails';
import ProjectAccessGrantedTemplate from '../../resources/email_templates/project_access_granted.json';

type EmailTemplate = typeof ProjectAccessGrantedTemplate;

export type ProjectAccessEmailData = {
  to: string;
  project_title: string;
  organization_name: string;
  access_duration: string;
  project_link: string;
};

type OtpEmailData = {
  to: string;
  otp: string;
};

type PasswordResetEmailData = {
  to: string;
  reset_url: string;
};

export class EmailTemplateGenerator {
  static generateProjectAccessTemplate(
    projectAccessEmailData: ProjectAccessEmailData,
  ): EmailTemplate {
    return {
      from: config.aws.ses.senderEmail,
      to: projectAccessEmailData.to,
      subject: `You've been granted access to ${projectAccessEmailData.project_title} by ${projectAccessEmailData.organization_name}`,
      html: projectAccessEmailHtml({
        project_title: projectAccessEmailData.project_title,
        organization_name: projectAccessEmailData.organization_name,
        access_duration: projectAccessEmailData.access_duration,
        project_link: projectAccessEmailData.project_link,
      }),
      attachments: [],
    };
  }

  static generateOtpTemplate(otpEmailData: OtpEmailData): EmailTemplate {
    return {
      from: config.aws.ses.senderEmail,
      to: otpEmailData.to,
      subject: 'Your InteractAI Verification Code',
      html: otpEmailHtml({ otp: otpEmailData.otp }),
      attachments: [],
    };
  }

  static generatePasswordResetTemplate(
    passwordResetEmailData: PasswordResetEmailData,
  ): EmailTemplate {
    return {
      from: config.aws.ses.senderEmail,
      to: passwordResetEmailData.to,
      subject: 'Reset Your InteractAI Password',
      html: passwordResetEmailHtml({
        reset_link: passwordResetEmailData.reset_url,
      }),
      attachments: [],
    };
  }
}
