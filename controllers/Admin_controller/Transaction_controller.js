const companyTransaction = require("../../models/CompanyTransactionSchema");
const candidateTransaction = require("../../models/CandidateTransactionSchema");

exports.GetAllTransaction = async (req, res) => {
  const {page,limit}=req.params;
  try {
    const skip=parseInt(page-1)*parseInt(limit);
    const companyTransactionCount = await companyTransaction.countDocuments();
    const totalPage = Math.ceil(companyTransactionCount / parseInt(limit));
    const companytransaction = await companyTransaction.aggregate([
      {$skip:skip},
      {$limit:parseInt(limit)},
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
          Plane_name: 1,
          price: 1,
          payment_method: 1,
          transaction_Id: 1,
          purchesed_data: 1,
          Expire_date: 1,
        },
      },
    ]);

    if (companytransaction.length > 0) {
      return res.status(200).send({data:companytransaction,totalPage,page});
    } else {
      return res.status(400).json({ error: "Empty database" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.SearchCompanyTransacation=async(req,res)=>{
  const {search}=req.body;
  try{
    const data = await companyTransaction.aggregate([
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
          Plane_name: 1,
          price: 1,
          payment_method: 1,
          transaction_Id: 1,
          purchesed_data: 1,
          Expire_date: 1,
        },
      },
    ]);
    const filteredData = data.filter(item => {
      const companyName =
          item?.companydetails[0]?.company_name?.toLowerCase() || '';
      const type = item?.type?.toLowerCase() || '';
      const planName = item?.Plane_name?.toLowerCase() || '';
      const searchTerm = search.toLowerCase();

      return (
          companyName.includes(searchTerm) ||
          type.includes(searchTerm) ||
          planName.includes(searchTerm)
      );
  });

  return res.status(200).send(filteredData);
  }catch(error){
    console.log(error)
return res.status(500).json({error:"Internal server error"});
  }
}

exports.GetAllCandidateTransation = async (req, res) => {
  const {page,limit}=req.params;
    try {
      const skip=parseInt(page-1)*parseInt(limit);
      const companyTransactionCount = await companyTransaction.countDocuments();
      const totalPage = Math.ceil(companyTransactionCount / parseInt(limit));
      const candidateTransactions = await candidateTransaction.aggregate([
        {$skip:skip},
        {$limit:parseInt(limit)},
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
          Plane_name: 1,
          price: 1,
          payment_method: 1,
          transaction_Id: 1,
          purchesed_data: 1,
          Expire_date: 1,
            "basicdetails.name": 1,
          },
        },
      ]);
  
      return res.status(200).send({data:candidateTransactions,totalPage});
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  

  exports.SearchCandidateTransaction=async(req,res)=>{
    const {search}=req.body;
    try{
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
          Plane_name: 1,
          price: 1,
          payment_method: 1,
          transaction_Id: 1,
          purchesed_data: 1,
          Expire_date: 1,
            "basicdetails.name": 1,
          },
        },
      ]);

        const filteredData = candidateTransactions?.filter(item => {
        const companyName = item?.basicdetails?.name.toLowerCase();
        const type = item?.type.toLowerCase();
        const planName = item?.Plane_name.toLowerCase();
        const searchTerm = search.toLowerCase();

        return (
            companyName.includes(searchTerm) ||
            type.includes(searchTerm) ||
            planName.includes(searchTerm)
        );
    });

    return res.status(200).send(filteredData||[]);
    }catch(error){
      return res.status(500).json({error:"Internal server error"});
    }
  }