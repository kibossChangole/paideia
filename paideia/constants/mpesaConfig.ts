/**
 * Daraja M-Pesa Configuration Template
 *
 * Replace placeholders with your actual credentials from the Safaricom Developer Portal.
 * Sandbox: https://developer.safaricom.co.ke/
 */

export const MPESA_CONFIG = {
  // Found in 'My Apps' section of the Safaricom Developer Portal
  consumerKey: "YOUR_CONSUMER_KEY",
  consumerSecret: "YOUR_CONSUMER_SECRET",

  // For Sandbox use '174379'
  businessShortCode: "174379",

  // For Sandbox use 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
  passKey: "YOUR_PASSKEY",

  // API Endpoints
  // Sandbox tokens: https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
  // Sandbox STK Push: https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
  tokenUrl:
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  stkPushUrl: "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",

  // Callback URL (Must be a publicly accessible URL)
  // For development, you can use services like Ngrok or a backend endpoint
  callbackUrl: "https://your-domain.com/api/mpesa/callback",
};
