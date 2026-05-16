import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

class EmailService:
    """
    Enterprise-grade SMTP email service for procurement inquiries.
    """
    
    def __init__(self):
        self._load_credentials()
        self.smtp_server = "smtp.gmail.com"
        self.smtp_port = 587

    def _load_credentials(self):
        load_dotenv() # Force reload .env
        self.smtp_email = os.getenv("SMTP_EMAIL")
        self.smtp_password = os.getenv("SMTP_PASSWORD")

    def send_procurement_inquiry(self, 
                                 supplier_name: str, 
                                 supplier_email: str, 
                                 subject: str, 
                                 body_html: str):
        """
        Sends a professional procurement inquiry via Gmail SMTP.
        """
        if not self.smtp_email or not self.smtp_password:
            self._load_credentials()
            
        if not self.smtp_email or not self.smtp_password:
            print("[EmailService] Error: SMTP credentials missing in .env")
            # For development/MVP simulation, we'll log it
            return {"status": "simulated", "message": "SMTP credentials missing. Email simulated."}

        try:
            # TEST OVERRIDE: Redirect all supplier mail to the user for validation
            test_recipient = "adulavivekgoud@gmail.com"
            print(f"[EmailService] TEST MODE: Redirecting email from {supplier_email} to {test_recipient}")
            
            msg = MIMEMultipart()
            msg['From'] = self.smtp_email
            msg['To'] = test_recipient
            msg['Subject'] = f"{subject} [To: {supplier_name}]"

            msg.attach(MIMEText(body_html, 'html'))

            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_email, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            print(f"[EmailService] Inquiry sent successfully to {supplier_email}")
            return {"status": "success", "message": f"Email sent to {supplier_email}"}
        except Exception as e:
            print(f"[EmailService] Failed to send email: {str(e)}")
            return {"status": "error", "message": str(e)}

    def generate_html_template(self, supplier_name: str, message: str):
        """
        Generates a professional HTML email template for procurement.
        """
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
                <h2 style="color: #1a365d; border-bottom: 2px solid #1a365d; padding-bottom: 10px;">Procurement Inquiry — ProcureAI Global Sourcing Network</h2>
                <p>Dear {supplier_name},</p>
                <p>We are initiating a procurement sourcing discussion for the following requirements.</p>
                
                <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1a365d;">
                    <p style="white-space: pre-wrap;">{message}</p>
                </div>
                
                <p>Please respond with:</p>
                <ul>
                    <li>MOQ (Minimum Order Quantity)</li>
                    <li>Production Lead Time</li>
                    <li>Pricing Tiers (Volume-based)</li>
                    <li>Production Capacity</li>
                    <li>Export Certifications</li>
                </ul>
                
                <p>Regards,<br><strong>ProcureAI Autonomous Procurement Agent</strong></p>
                
                <div style="margin-top: 30px; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                    This is an automated procurement inquiry sent via the ProcureAI Orchestration Layer.
                </div>
            </div>
        </body>
        </html>
        """
