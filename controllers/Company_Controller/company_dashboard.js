const mongoose = require('mongoose');
const moment=require('moment')
const CompanySubscription=require("../../models/Company_SubscriptionSchema");
const subscription=require("../../models/SubscriptionSchema");
const CompanyJob=require("../../models/JobSchema");

exports.getCompanyDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = new mongoose.Types.ObjectId(id);

    const [subscriptionData, jobData] = await Promise.all([
      CompanySubscription.aggregate([
        { $match: { company_id: objectId, expiresAt: { $gte: new Date() } } },
        {
          $lookup: {
            from: "subscriptionplanes",
            localField: "subscription_id",
            foreignField: "_id",
            as: "AdminSubscription",
          },
        },
      ]),
      CompanyJob.find({ company_id: objectId }),
    ]);
    if (subscriptionData && subscriptionData.length > 0) {
      const formattedSubscriptionData = subscriptionData.map((subscription) => {
        if (subscription.createdDate) {
          subscription.createdDate = moment(subscription.createdDate).format(
            "MMMM Do YYYY, h:mm:ss a"
          );
        }
        if (subscription.expiresAt) {
          subscription.expiresAt = moment(subscription.expiresAt).format(
            "MMMM Do YYYY, h:mm:ss a"
          );
        }
        if (
          Array.isArray(subscription.topUp) &&
          subscription.topUp.length > 0
        ) {
          subscription.topUp = subscription.topUp.map((topUp) => {
            if (topUp.Date) {
              topUp.Date = moment(topUp.Date).format("MMMM Do YYYY, h:mm:ss a");
            }
            if (topUp.ExpireDate) {
              topUp.ExpireDate = moment(topUp.ExpireDate).format(
                "MMMM Do YYYY, h:mm:ss a"
              );
            }
            return topUp;
          });
        }

        return subscription;
      });
      let ApplicationCount = 0;
      let HiredCount = 0;
      for (const temp of jobData) {
        ApplicationCount += temp?.applied_candidates?.length || 0;
        HiredCount += temp?.hired_candidate?.length || 0;
      }

      return res.status(200).json({
        subscriptionData: formattedSubscriptionData,
        jobCreatedCount: jobData.length,
        applicationRecieved: ApplicationCount,
        HiredCount,
      });
    } else {
      return res.status(404).json({ error: "No subscription data found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.OfferVerifier = async (req, res) => {
  const { companyId,PAN} = req.params;
  try {
    const objectId = new mongoose.Types.ObjectId(companyId);

    const data = await CompanyJob.aggregate([
      { $match: { company_id: objectId } },
      { $unwind: '$Job_offer' },
      {
        $lookup: {
          from: 'candidates',
          localField: 'Job_offer.candidate_id',
          foreignField: '_id',
          as: 'candidateDetails'
        }
      },
      { $unwind: '$candidateDetails' },
      {
        $lookup: {
          from: 'candidate_basic_details',
          localField: 'candidateDetails.basic_details',
          foreignField: '_id',
          as: 'basicDetails'
        }
      },
      { $unwind: '$basicDetails' },
      {
        $lookup: {
          from: 'candidate_personal_details',
          localField: 'candidateDetails.personal_details',
          foreignField: '_id',
          as: 'personalDetails'
        }
      },
      { $unwind: '$personalDetails' },
      {
        $match: {
          'personalDetails.PAN': PAN 
        }
      },
      {
        $group: {
          _id: '$candidateDetails._id',
          candidateDetails: { $first: '$candidateDetails' },
          personalDetails: { $first: '$personalDetails' },
          basicDetails: { $first: '$basicDetails' }
        }
      }
    ]);

    if (data.length > 0) {
      const name = data[0]?.basicDetails?.name || "Unknown";
      return res.status(200).json({ message: `The PAN user ${name} currently has a job offer in hand`, data });
    } else {
      return res.status(200).json({ message: "No job offer found for this candidate." });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
