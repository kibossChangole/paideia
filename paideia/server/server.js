const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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
const port = process.env.PORT || 3000;

// Debug: Check if WEBHOOK_SECRET is loaded
const webhookSecret = process.env.WEBHOOK_SECRET || process.env.EXPO_PUBLIC_WEBHOOK_SECRET;
console.log('-----------------------------------------');
console.log('SECRET STATUS:', webhookSecret ? '✅ LOADED' : '❌ MISSING');
console.log('PORT:', port);
console.log('-----------------------------------------');

// Middleware to parse JSON bodies
app.use(express.json());

/**
 * M-Pesa Callback Webhook
 * Receives final payment notification from Safaricom.
 */
app.post('/api/webhook', async (req, res) => {
    console.log('📡 Webhook Hit at:', new Date().toISOString());
    const { secret } = req.query;

    // 1. SECURITY: Verify Secret Key
    const expectedSecret = process.env.WEBHOOK_SECRET || process.env.EXPO_PUBLIC_WEBHOOK_SECRET;
    
    if (!secret || secret !== expectedSecret) {
        console.log('⚠️ UNAUTHORIZED WEBHOOK ATTEMPT');
        console.log('Reason:', !secret ? 'Secret missing in URL' : 'Secret mismatch');
        
        // Debugging mismatch without leaking full secret
        if (secret && expectedSecret) {
            console.log('--- Debug Mismatch ---');
            console.log(`Received Length: ${secret.length}`);
            console.log(`Expected Length: ${expectedSecret.length}`);
            console.log(`Match Start: ${secret.substring(0, 5) === expectedSecret.substring(0, 5)}`);
            console.log(`Match End: ${secret.slice(-3) === expectedSecret.slice(-3)}`);
            console.log('----------------------');
        }

        if (!expectedSecret) console.log('CRITICAL: WEBHOOK_SECRET is NOT SET on the server!');
        return res.status(401).json({ ResultCode: 1, ResultDesc: "Unauthorized" });
    }


    try {
        const body = req.body.Body;
        if (!body || !body.stkCallback) {
            console.log('❌ INVALID CALLBACK BODY');
            return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid body" });
        }

        const callbackData = body.stkCallback;
        const resultCode = callbackData.ResultCode;
        const resultDesc = callbackData.ResultDesc;
        const checkoutRequestID = callbackData.CheckoutRequestID;

        // 2. IDEMPOTENCY: Check if already processed
        const auditRef = db.ref(`mpesa_callbacks/${checkoutRequestID}`);
        const auditSnap = await auditRef.once('value');
        if (auditSnap.exists() && auditSnap.val().processedAt) {
            console.log(`♻️ SKIPPING: CheckoutID ${checkoutRequestID} already processed.`);
            return res.status(200).json({ ResultCode: 0, ResultDesc: "Duplicate" });
        }

        // Log raw callback immediately
        await auditRef.update({
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

            console.log(`✅ PAYMENT SUCCESS: KES ${amount} (Receipt: ${mpesaReceiptNumber})`);

            // 3. PERFORMANCE: O(1) Lookup
            // We search for the studentId mapped to this checkoutRequestID
            // Note: We'll need to ensure the App populates 'pending_payments' node
            const pendingRef = db.ref(`pending_payments/${checkoutRequestID}`);
            const pendingSnap = await pendingRef.once('value');
            
            let studentId = null;
            if (pendingSnap.exists()) {
                studentId = pendingSnap.val().studentId;
            } else {
                // Fallback to naive search if pending node is missing (Legacy/Transition)
                console.log('⚠️ PENDING NODE MISSING: Falling back to naive search...');
                const paymentsSnap = await db.ref('payments').once('value');
                if (paymentsSnap.exists()) {
                    const allPayments = paymentsSnap.val();
                    for (const sId in allPayments) {
                        if (allPayments[sId][checkoutRequestID]) {
                            studentId = sId;
                            break;
                        }
                    }
                }
            }

            if (studentId) {
                // 4. DATA INTEGRITY: Transactional Balance Update
                const studentQuery = db.ref('students').orderByChild('id').equalTo(studentId);
                const studentSnap = await studentQuery.once('value');

                if (studentSnap.exists()) {
                    const studentKey = Object.keys(studentSnap.val())[0];
                    const balanceRef = db.ref(`students/${studentKey}/feeStructure`);

                    await balanceRef.transaction((currentBalance) => {
                        if (currentBalance === null) return 0;
                        return Math.max(0, currentBalance - amount);
                    });

                    // 5. UPDATE RECORDS
                    await db.ref(`payments/${studentId}/${checkoutRequestID}`).update({
                        status: 'success',
                        mpesaReceipt: mpesaReceiptNumber,
                        paidAt: new Date().toISOString()
                    });

                    console.log(`Updated balance for Student ${studentId}`);
                }
            } else {
                console.log(`⚠️ FAILED: No student found for CheckoutID ${checkoutRequestID}`);
            }
        }

        // Mark as processed
        await auditRef.update({ processedAt: new Date().toISOString() });

    } catch (error) {
        console.error('❌ ERROR PROCESSING CALLBACK:', error);
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
});

app.listen(port, () => {
    console.log(`\n🚀 Secure Webhook Server Running`);
});

