import SocketIO, { Socket } from 'socket.io'
import { Error as MongooseError } from 'mongoose';

import { authSocket, tokenTracker } from "./";
import Game, { GAME_STATUS } from "../models/game"

/**
 * @typedef {Object} Move
 * @property {Number} col column - zero indexed from 0 to 6 (left to right)
 * @property {Number} row row - zero indexed from 0 to 5 (bottom to top)
 */

export const applyGamesNS = (ns: SocketIO.Namespace) => {
    ns.use(authSocket);
    ns.use(tokenTracker);
    ns.on('connect', async (socket: SocketIO.Socket) => {
        socket.on('join', async (gameId: Number, callback: Function) => {
            if (socket.gameId !== undefined) // Shouldn't happen actually
                socket.leave(socket.gameId);
            const game = await Game.findById(gameId);
            if (!game)
                return callback(null);
            socket.gameId = gameId;
            socket.join(socket.gameId);
            callback(game);
        });

        socket.on('makemove', async (move: Move) => {
            if (socket.username === undefined || socket.gameId === undefined)
                return;
            const newStatus = await Game.makeMove(socket.gameId, socket.username, move);
            if (!newStatus) return; // Invalid move
            ns.to(socket.gameId).emit("newmove", {
                move: move,
                status: newStatus,
            });
        });

        socket.on('leave', () => {
            if (socket.gameId !== undefined) {
                socket.leave(socket.gameId);
                delete socket.gameId;
            }
        });
    });
};