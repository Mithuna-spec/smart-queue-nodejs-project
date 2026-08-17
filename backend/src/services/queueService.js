const Token = require("../models/Token");
const Queue = require("../models/Queue");

const DEFAULT_PRIORITY_ORDER = [
    "URGENT",
    "PRIORITY",
    "NORMAL"
];

const getTokenPosition = async (token) => {
    const queue = await Queue.findById(token.queueId);

    if (!queue) {
        return {
            peopleAhead: 0,
            position: null
        };
    }

    const waitingTokens = await Token.find({
        queueId: token.queueId,
        status: "WAITING"
    });

    // --------------------------------------------------------
    // FIFO
    // --------------------------------------------------------

    if (queue.queuePolicy === "FIFO") {
        waitingTokens.sort(
            (a, b) => a.tokenNumber - b.tokenNumber
        );
    }

    // --------------------------------------------------------
    // PRIORITY
    // --------------------------------------------------------

    else if (queue.queuePolicy === "PRIORITY") {
        const priorityOrder =
            queue.priorityOrder?.length
                ? queue.priorityOrder
                : DEFAULT_PRIORITY_ORDER;

        waitingTokens.sort((a, b) => {
            const priorityA =
                priorityOrder.indexOf(a.priority);

            const priorityB =
                priorityOrder.indexOf(b.priority);

            // Unknown priority goes to the end
            const safePriorityA =
                priorityA === -1
                    ? priorityOrder.length
                    : priorityA;

            const safePriorityB =
                priorityB === -1
                    ? priorityOrder.length
                    : priorityB;

            if (
                safePriorityA !==
                safePriorityB
            ) {
                return (
                    safePriorityA -
                    safePriorityB
                );
            }

            // Same priority → FIFO
            return (
                a.tokenNumber -
                b.tokenNumber
            );
        });
    }

    // --------------------------------------------------------
    // Find current token
    // --------------------------------------------------------

    const index = waitingTokens.findIndex(
        item =>
            item._id.toString() ===
            token._id.toString()
    );

    if (index === -1) {
        return {
            peopleAhead: 0,
            position: null
        };
    }

    return {
        peopleAhead: index,
        position: index + 1
    };
};

const getEstimatedWaitTime = async (token) => {
    const queue = await Queue.findById(token.queueId);

    if (!queue) {
        return 0;
    }

    // Get recent completed services
    const completedTokens = await Token.find({
        queueId: token.queueId,
        status: "COMPLETED",
        serviceTime: {
            $gt: 0
        }
    })
        .sort({ completedAt: -1 })
        .limit(50);

    let averageServiceTime = 10;

    if (completedTokens.length > 0) {
        const totalServiceTime =
            completedTokens.reduce(
                (sum, item) =>
                    sum + item.serviceTime,
                0
            );

        averageServiceTime = Math.round(
            totalServiceTime /
            completedTokens.length
        );
    }

    // ---------------------------------------------
    // Current token being served
    // ---------------------------------------------

    const activeToken = await Token.findOne({
        queueId: token.queueId,
        status: "IN_SERVICE"
    });

    let activeRemainingTime = 0;

    if (activeToken && activeToken.startedAt) {
        const elapsed =
            (Date.now() - activeToken.startedAt) /
            (1000 * 60);

        activeRemainingTime = Math.max(
            0,
            averageServiceTime - elapsed
        );
    }

    // ---------------------------------------------
    // Tokens ahead
    // ---------------------------------------------

    const positionData =
        await getTokenPosition(token);

    const estimatedWaitTime =
        activeRemainingTime +
        (
            positionData.peopleAhead *
            averageServiceTime
        );

    return {
        averageServiceTime,
        estimatedWaitTime: Math.max(
            0,
            Math.round(estimatedWaitTime)
        )
    };
};

module.exports = {
    getTokenPosition,
    getEstimatedWaitTime
};