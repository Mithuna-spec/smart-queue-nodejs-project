const User = require("../models/User");

const ensureSingleAdmin = async () => {
    const adminCount = await User.countDocuments({
        role: "ADMIN"
    });

    if (adminCount > 1) {
        throw new Error(
            "Invalid database state: multiple ADMIN accounts exist"
        );
    }

    return adminCount;
};

module.exports = {
    ensureSingleAdmin
};