import SocketIO, { Socket } from 'socket.io'
import { Error as MongooseError } from 'mongoose';

import { authSocket, tokenTracker } from "./";
import Game, { GAME_STATUS } from "../models/game"

/**
 * @typedef {Object} Move
 * @property {Number} col column - zero indexed from 0 to 6 (left to right)
 * @property {Number} row row - zero indexed from 0 to 5 (bottom to top)
 */
const queue = new Set()
export const applyJionNS = (ns: SocketIO.Namespace) => {
    ns.use(authSocket);
    ns.use(tokenTracker);
    ns.on('connect', async (socket: SocketIO.Socket) => {
        socket.on('join', async (callback: Function) => {
            if (socket.username === undefined) // Shouldn't happen actually
                return callback({status:"Error", content:"Login first."});
            if (queue.size === 0) {
                queue.add(socket);
                return callback({status:"Waiting", content:""});
            }
            if (queue.size === 1) {
                for (let skt of queue) {
                    if (skt.username == socket.username)
                        return callback({status:"Error", content:"Already waiting."});
                    // TODO: create new game

                    queue.delete(skt)
                }
                
            }
            console.log("queue size error!")
        });

        socket.on('leave', () => {
            if (socket.gameId !== undefined) {
                socket.leave(socket.gameId);
                delete socket.gameId;
            }
        });
    });
};