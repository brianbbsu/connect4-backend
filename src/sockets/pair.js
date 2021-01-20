import SocketIO from 'socket.io'

import { authSocket, tokenTracker } from "./";
import config from "../config"
import Game from "../models/game"

/** @type SocketIO.Socket */
let currentWaitingPlayer = null;

export const applyPairNS = (ns: SocketIO.Namespace) => {
    ns.use(authSocket);
    ns.use(tokenTracker);
    ns.on('connect', async (socket: SocketIO.Socket) => {
        socket.on('pair', async (withAI: Boolean, callback: Function) => {
            if (socket.username === undefined) // Shouldn't happen actually
                return callback("Login first.");
            const username = socket.username;
            if (withAI) {
                const game = await Game.create({
                    player1: username,
                    player2: config.AIUsername,
                });
                socket.emit("paired", game.id);
                return;
            }
            if (currentWaitingPlayer !== null && username === currentWaitingPlayer.username)
                return callback("Already waiting.");
            if (currentWaitingPlayer === null) {
                currentWaitingPlayer = socket;
                return;
            }
            let player1 = username, player2 = currentWaitingPlayer.username;
            if (Math.random() < 0.5) // 1/2 probability
                [player1, player2] = [player2, player1]; // swap
            const game = await Game.create({player1, player2});
            socket.emit("paired", game.id);
            currentWaitingPlayer.emit("paired", game.id);
            currentWaitingPlayer = null;
        });

        const removeFromQueue = () => {
            if (currentWaitingPlayer !== null && socket === currentWaitingPlayer)
                currentWaitingPlayer = null;
        };
        socket.on('leave', removeFromQueue);
        socket.on("disconnet", removeFromQueue);
    });
};