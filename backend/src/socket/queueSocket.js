const setupQueueSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("joinQueue", (queueId) => {
            socket.join(`queue:${queueId}`);

            console.log(
                `Client ${socket.id} joined queue ${queueId}`
            );
        });

        socket.on("joinUser", (userId) => {
            socket.join(`user:${userId}`);

            console.log(
                `Client ${socket.id} joined user room ${userId}`
            );
        });

        socket.on("leaveQueue", (queueId) => {
            socket.leave(`queue:${queueId}`);
        });

        socket.on("disconnect", () => {
            console.log(
                "Client disconnected:",
                socket.id
            );
        });
    });
};

module.exports = setupQueueSocket;