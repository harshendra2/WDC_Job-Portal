const cron = require('node-cron');
const CompanySubscriptionPlane = require('../models/Company_SubscriptionSchema');;

cron.schedule('0 0 * * *', async () => {
    try {
        const expiredSubscriptions = await CompanySubscriptionPlane.updateMany(
            { expiresAt: { $lte: new Date() } },
            {
                $set: {
                    available_candidate: false,
                    download_email_limit: false,
                    download_cv_limit: false,
                }
            }
        );

        console.log('Expired subscriptions updated:', expiredSubscriptions);
    } catch (error) {
        console.error('Error updating expired subscriptions:', error);
    }
});
