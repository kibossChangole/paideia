/**
 * Daraja M-Pesa Configuration Template
 *
 * Replace placeholders with your actual credentials from the Safaricom Developer Portal.
 * Sandbox: https://developer.safaricom.co.ke/
 */

export const MPESA_CONFIG = {
  // Found in 'My Apps' section of the Safaricom Developer Portal
  consumerKey: process.env.EXPO_PUBLIC_MPESA_CONSUMER_KEY,
  consumerSecret: process.env.EXPO_PUBLIC_MPESA_CONSUMER_SECRET,

  // For Sandbox use '174379'
  businessShortCode:
    process.env.EXPO_PUBLIC_MPESA_BUSINESS_SHORT_CODE || "174379",

  // For Sandbox use 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
  passKey:
    process.env.EXPO_PUBLIC_MPESA_PASSKEY ||
    "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",

  // API Endpoints
  // Sandbox tokens: https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
  // Sandbox STK Push: https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
  tokenUrl:
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  stkPushUrl: "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",

  // Callback URL (Must be a publicly accessible URL)
  // For development, you can use services like Ngrok or a backend endpoint
  callbackUrl:
    "https://paideia-mpesa-callback.onrender.com/api/webhook?secret=paideia_secure_2026_webhook_key",
};

//visit this site https://paideia-mpesa-callback.onrender.com to cold start the server. Render has a free tier that sleeps after 15 minutes of inactivity.
