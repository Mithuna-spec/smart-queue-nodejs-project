const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { joinQueue } = require("./controllers/queueController");

async function run() {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-queue";
        console.log("Connecting to:", mongoUri);
        await mongoose.connect(mongoUri);
        console.log("Connected.");

        // Simulate Express request and response objects
        const req = {
            params: {
                queueId: "6a85f76f51d22ab5817082a7" // valid queue ID from Fee payment queue
            },
            body: {},
            user: {
                userId: "6a856443eca660e8ee6786d4", // testuser@gmail.com
                role: "USER"
            }
        };

        const res = {
            statusCode: 200,
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                console.log(`\n--- Response (Status: ${this.statusCode}) ---`);
                console.log(JSON.stringify(data, null, 2));
                return this;
            }
        };

        console.log("Executing joinQueue...");
        await joinQueue(req, res);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
