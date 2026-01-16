const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
//const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.EXPO_PUBLIC_DATABASE_URL
    });
} else {
    admin.app();
}

const db = admin.database();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * M-Pesa Callback Webhook
 * This endpoint will receive the final payment notification from Safaricom.
 */
app.post('/api/webhook', async (req, res) => {
    console.log('\n=========================================');
    console.log('--- M-PESA CALLBACK RECEIVED ---');
    console.log('Timestamp:', new Date().toLocaleString());
    console.log('-----------------------------------------');

    try {
        const body = req.body.Body;
        if (!body || !body.stkCallback) {
            console.log('❌ INVALID CALLBACK BODY');
            return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid body" });
        }

        const callbackData = body.stkCallback;
        const resultCode = callbackData.ResultCode;
        const resultDesc = callbackData.ResultDesc;
        const merchantRequestID = callbackData.MerchantRequestID;
        const checkoutRequestID = callbackData.CheckoutRequestID;

        // 1. Log the raw callback to Realtime Database for audit purposes
        await db.ref(`mpesa_callbacks/${checkoutRequestID}`).set({
            callbackData: callbackData,
            receivedAt: new Date().toISOString(),
            status: resultCode === 0 ? 'SUCCESS' : 'FAILED'
        });

        if (resultCode === 0) {
            // SUCCESSFUL PAYMENT
            const metaData = callbackData.CallbackMetadata.Item;
            const amount = metaData.find(item => item.Name === 'Amount').Value;
            const mpesaReceiptNumber = metaData.find(item => item.Name === 'MpesaReceiptNumber').Value;
            const phoneNumber = metaData.find(item => item.Name === 'PhoneNumber').Value;

            console.log('✅ PAYMENT SUCCESS');
            console.log(`Amount: KES ${amount}`);
            console.log(`Receipt: ${mpesaReceiptNumber}`);
            console.log(`Phone: ${phoneNumber}`);
            console.log(`CheckoutID: ${checkoutRequestID}`);

            // 2. Find the studentId by searching the payments node
            // This is a naive search. For scale, consider a reverse index { checkoutId: studentId }
            const paymentsSnap = await db.ref('payments').once('value');
            let studentIdForPayment = null;
            
            if (paymentsSnap.exists()) {
                const allPayments = paymentsSnap.val();
                for (const studentId in allPayments) {
                    if (allPayments[studentId][checkoutRequestID]) {
                        studentIdForPayment = studentId;
                        break;
                    }
                }
            }

            if (studentIdForPayment) {
                console.log(`Found Student ID: ${studentIdForPayment}`);

                // 3. Update the payment record status to 'success'
                await db.ref(`payments/${studentIdForPayment}/${checkoutRequestID}`).update({
                    status: 'success',
                    mpesaReceipt: mpesaReceiptNumber,
                    paidAt: new Date().toISOString()
                });

                // 4. Update the student's balance (feeStructure)
                const studentRef = db.ref(`students`);
                const studentSnap = await studentRef.orderByChild('id').equalTo(studentIdForPayment).once('value');

                if (studentSnap.exists()) {
                    const studentKey = Object.keys(studentSnap.val())[0];
                    const currentBalance = studentSnap.val()[studentKey].feeStructure || 0;
                    const newBalance = Math.max(0, currentBalance - amount);

                    await db.ref(`students/${studentKey}`).update({
                        feeStructure: newBalance
                    });
                    console.log(`Updated balance for ${studentIdForPayment}: KES ${newBalance}`);
                }
            } else {
                console.log(`⚠️ Could not find student record for CheckoutID: ${checkoutRequestID}`);
            }

        } else {
            // FAILED OR CANCELLED
            console.log('❌ PAYMENT FAILED / CANCELLED');
            console.log(`Result Code: ${resultCode}`);
            console.log(`Description: ${resultDesc}`);
            
            // Optionally update the payment record to 'failed' if studentId is found
        }

    } catch (error) {
        console.error('❌ ERROR PROCESSING CALLBACK:', error);
        // We still return 200 to M-Pesa to avoid infinite retries if the error is on our end
    }

    console.log('=========================================\n');

    // M-Pesa expects a 200 OK response to stop retrying the callback
    res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
});

app.listen(port, () => {
    console.log(`\n🚀 Webhook server is running at http://localhost:${port}`);
    console.log(`👉 Point your Ngrok to this port: ngrok http ${port}`);
    console.log(`👉 Your Callback URL in mpesaConfig.ts should be: {YOUR_NGROK_URL}/api/webhook`);
});
