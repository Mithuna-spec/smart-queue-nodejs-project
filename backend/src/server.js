require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/database");
const { Server } = require("socket.io");
const setupQueueSocket = require("./socket/queueSocket");
const { setIO } = require("./socket/socketInstance");
const { ensureSingleAdmin } =
    require("./services/adminService");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await ensureSingleAdmin();

    const server = http.createServer(app);

    const io = new Server(server, {
        cors: {
            origin: "*"
        }
    });
    setIO(io);

    setupQueueSocket(io);

    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();