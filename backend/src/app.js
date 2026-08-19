const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const queueRoutes = require("./routes/queueRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const appointmentSlotRoutes = require(
    "./routes/appointmentSlotRoutes"
);
const organizationStaffRoutes =
    require("./routes/organizationStaffRoutes");
const counterRoutes =
    require("./routes/counterRoutes");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());


app.get("/", (req, res) => {
    res.json({
        message: "Smart Queue API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/queues", queueRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/appointments",appointmentRoutes);
app.use(
    "/api/appointment-slots",
    appointmentSlotRoutes
);
app.use(
    "/api/organization-staff",
    organizationStaffRoutes
);
app.use(
    "/api/counters",
    counterRoutes
);


module.exports = app;