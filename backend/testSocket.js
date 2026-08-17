const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Connected to Socket.IO:", socket.id);

    const queueId = "6a81b7dcdae922388656c371";

    socket.emit("joinQueue", queueId);

    console.log("Joined queue:", queueId);
});

socket.on("TOKEN_CALLED", (data) => {
    console.log("TOKEN CALLED:");
    console.log(data);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

const userId = "YOUR_USER_ID";

socket.on("connect", () => {
    console.log("Connected:", socket.id);

    socket.emit("joinQueue", queueId);
    socket.emit("joinUser", userId);
});

socket.on("YOUR_TOKEN_CALLED", (data) => {
    console.log("🔔 YOUR TOKEN CALLED");
    console.log(data);
});