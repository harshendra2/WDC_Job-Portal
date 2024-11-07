const CompanyJob=require('../../models/JobSchema');
exports.OfferVerifier = async (req, res) => {
  const { companyId, PAN } = req.params;
  try {
      const data = await CompanyJob.aggregate([
          { $unwind: '$Shortlisted' },
          { $match: { 'Shortlisted.shorted_status': true } },
          {
              $lookup: {
                  from: 'candidates',
                  localField: 'Shortlisted.candidate_id',
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
          { $match: { 'personalDetails.PAN': PAN } },
          {
              $group: {
                  _id: '$candidateDetails._id',
                  candidateDetails: { $first: '$candidateDetails' },
                  personalDetails: { $first: '$personalDetails' },
                  basicDetails: { $first: '$basicDetails' },
                  offers: {
                      $push: {
                          company_id: "$company_id",
                          offer_date: "$Shortlisted.short_Candidate.offer_date",
                          offer_status: "$Shortlisted.short_Candidate.offer_accepted_status",
                          hired_date: "$Shortlisted.short_Candidate.hired_date"
                      }
                  }
              }
          },
          {
              $addFields: {
                  offersCount: { $size: "$offers" },
                  acceptedCount: {
                      $size: {
                          $filter: {
                              input: "$offers",
                              as: "offer",
                              cond: { $eq: ["$$offer.offer_status", ""] }
                          }
                      }
                  },
                  rejectedCount: {
                      $size: {
                          $filter: {
                              input: "$offers",
                              as: "offer",
                              cond: { $eq: ["$$offer.offer_status", "Rejected"] }
                          }
                      }
                  },
                  averageProcessingTime: {
                      $avg: {
                          $map: {
                              input: "$offers",
                              as: "offer",
                              in: { $subtract: ["$$offer.hired_date", "$$offer.offer_date"] }
                          }
                      }
                  },
                  jobSearchFrequency: {
                      $divide: [
                          { $subtract: [new Date(), "$candidateDetails.createdDate"] },
                          { $size: "$offers" }
                      ]
                  }
              }
          },
          {
              $project: {
                  candidateDetails: 1,
                  personalDetails: 1,
                  basicDetails: 1,
                  offers: 1,
                  offersCount: 1,
                  acceptedCount: 1,
                  rejectedCount: 1,
                  averageProcessingTime: 1,
                  jobSearchFrequency: 1,
                  creditScore: {
                      $multiply: [
                          {
                              $add: [
                                  { $multiply: [{ $divide: ["$acceptedCount", "$offersCount"] }, 0.2] },
                                  { $multiply: [{ $divide: ["$averageProcessingTime", 1000 * 60 * 60 * 24] }, 0.15] }, // Days
                                  { $multiply: [{ $divide: ["$jobSearchFrequency", 1000 * 60 * 60 * 24 * 365] }, 0.3] }, // Years
                                  { $multiply: [{ $divide: ["$acceptedCount", "$offersCount"] }, 0.15] }
                              ]
                          },
                          1000
                      ]
                  }
              }
          }
      ]);

      if (data.length > 0) {
          const name = data[0]?.basicDetails?.name || "Unknown";
          return res.status(200).json({
              message: `The PAN user ${name} has ${data[0].offersCount} offers, ${data[0].acceptedCount} accepted, and ${data[0].rejectedCount} rejected.`,
              creditScore: data[0].creditScore,
              data
          });
      } else {
          return res.status(200).json({ message: "No job offer found for this candidate." });
      }
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal server error" });
  }
};
