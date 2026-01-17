import { MPESA_CONFIG } from "../constants/mpesaConfig";

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export class MpesaService {
  /**
   * Generates the OAuth Access Token required for M-Pesa API calls.
   */
  private static async getAccessToken(): Promise<string> {
    const credentials = `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`;
    // Use btoa for base64 encoding in React Native/Web
    const encodedCredentials = btoa(credentials);

    try {
      const response = await fetch(MPESA_CONFIG.tokenUrl, {
        method: "GET",
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
        },
      });

      const data = await response.json();
      if (data.access_token) {
        return data.access_token;
      } else {
        throw new Error("Failed to get access token: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error("M-Pesa Token Error:", error);
      throw error;
    }
  }

  /**
   * Formats the timestamp for M-Pesa requests (YYYYMMDDHHmmss).
   */
  private static getTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generates the password for STK Push.
   */
  private static getPassword(timestamp: string): string {
    const data =
      MPESA_CONFIG.businessShortCode + MPESA_CONFIG.passKey + timestamp;
    return btoa(data);
  }

  /**
   * Initiates an STK Push (Lipa Na M-Pesa Online).
   *
   * @param phoneNumber - Customer phone number (format: 254XXXXXXXXX)
   * @param amount - Amount to charge
   * @param accountReference - Reference for the transaction (e.g., Student ID)
   */
  public static async initiateStkPush(
    phoneNumber: string,
    amount: number,
    accountReference: string
  ): Promise<StkPushResponse> {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.getPassword(timestamp);

      // Ensure phone number is in the correct format (254...)
      let formattedPhone = phoneNumber.replace(/[\s\+]/g, "");
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "254" + formattedPhone.substring(1);
      } else if (
        formattedPhone.startsWith("7") ||
        formattedPhone.startsWith("1")
      ) {
        formattedPhone = "254" + formattedPhone;
      }

      const body = {
        BusinessShortCode: MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: MPESA_CONFIG.businessShortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: MPESA_CONFIG.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: `School Fee Payment - ${accountReference}`,
      };

      console.log(
        "📡 Initiating STK Push with CallbackURL:",
        MPESA_CONFIG.callbackUrl
      );

      const response = await fetch(MPESA_CONFIG.stkPushUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.ResponseCode === "0") {
        return data as StkPushResponse;
      } else {
        throw new Error(
          data.errorMessage || data.ResponseDescription || "STK Push failed"
        );
      }
    } catch (error) {
      console.error("STK Push Error:", error);
      throw error;
    }
  }
}
