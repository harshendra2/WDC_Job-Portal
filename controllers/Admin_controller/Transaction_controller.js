const companyTransaction = require("../../models/CompanyTransactionSchema");
const candidateTransaction = require("../../models/CandidateTransactionSchema");

exports.GetAllTransaction = async (req, res) => {
  try {
    const companytransaction = await companyTransaction.aggregate([
      {
        $lookup: {
          from: "companies",
          localField: "company_id",
          foreignField: "_id",
          as: "companydetails",
        },
      },
      {
        $project: {
          "companydetails.company_name": 1,
          type: 1,
          plane_name: 1,
          price: 1,
          payment_method: 1,
          transaction_Id: 1,
          purchesed_data: 1,
          Expire_date: 1,
        },
      },
    ]);

    if (companytransaction.length > 0) {
      return res.status(200).send(companytransaction);
    } else {
      return res.status(400).json({ error: "Empty database" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.GetAllCandidateTransation = async (req, res) => {
    try {
      const candidateTransactions = await candidateTransaction.aggregate([
        {
          $lookup: {
            from: "candidates",
            localField: "candidate_id",
            foreignField: "_id",
            as: "candidatedetails",
          },
        },
        {
          $unwind: "$candidatedetails",
        },
        {
          $lookup: {
            from: "candidate_basic_details",
            localField: "candidatedetails.basic_details",
            foreignField: "_id",
            as: "basicdetails",
          },
        },
        {
          $unwind: "$basicdetails",
        },
        {
          $project: {
            type: 1,
          plane_name: 1,
          price: 1,
          payment_method: 1,
          transaction_Id: 1,
          purchesed_data: 1,
          Expire_date: 1,
            "basicdetails.name": 1,
          },
        },
      ]);
  
      return res.status(200).send(candidateTransactions);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  