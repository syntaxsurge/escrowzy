export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // TODO: Implement email sending with Resend or other service
  console.log('Email would be sent:', options)
}
