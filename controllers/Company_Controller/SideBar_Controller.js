const company=require('../../models/Onboard_Company_Schema');

exports.CompanyProfileStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const data = await company.findById(id);

        if (!data) {
            return res.status(404).json({ error: "Company not found" });
        }
        const fields = [
            'company_name', 'email', 'mobile', 'overView', 'address',
            'industry', 'company_size', 'GST', 'GST_image', 'PAN',
            'PAN_image', 'website_url', 'location','contact_email',
            'contact_No', 'headQuater_add', 'profile'
        ];

        let filledFields = 0;
        fields.forEach(field => {
            if (data[field]) {
                filledFields++;
            }
        });
        const profileCompletionPercentage = Math.round((filledFields / fields.length) * 100);

        return res.status(200).json({
            message: "Profile completion status retrieved successfully",
            profileCompletionPercentage
        });
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};
