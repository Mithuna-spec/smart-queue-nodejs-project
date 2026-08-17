const { getIO } = require("./socketInstance");

const emitTokenCalled = (queueId, token) => {
    const io = getIO();

    io.to(`queue:${queueId}`).emit("TOKEN_CALLED", {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        displayToken: `Q${String(token.tokenNumber).padStart(3, "0")}`,
        status: token.status
    });
};

const emitTokenStarted = (queueId, token) => {
    const io = getIO();

    io.to(`queue:${queueId}`).emit("TOKEN_STARTED", {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        displayToken: `Q${String(token.tokenNumber).padStart(3, "0")}`,
        status: token.status
    });
};

const emitTokenCompleted = (queueId, token) => {
    const io = getIO();

    io.to(`queue:${queueId}`).emit("TOKEN_COMPLETED", {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        displayToken: `Q${String(token.tokenNumber).padStart(3, "0")}`,
        status: token.status
    });
};
const emitUserTokenCalled = (userId, token) => {
    const io = getIO();

    io.to(`user:${userId}`).emit("YOUR_TOKEN_CALLED", {
        tokenId: token._id,
        tokenNumber: token.tokenNumber,
        displayToken: `Q${String(token.tokenNumber).padStart(3, "0")}`,
        status: token.status,
        message: `Your token Q${String(token.tokenNumber).padStart(3, "0")} has been called.`
    });
};

const emitQueueUpdated = (queueId, data) => {
    const io = getIO();

    io.to(`queue:${queueId}`).emit("QUEUE_UPDATED", {
        queueId,
        ...data
    });
};

module.exports = {
    emitTokenCalled,
    emitTokenStarted,
    emitTokenCompleted,
    emitUserTokenCalled,
    emitQueueUpdated
};