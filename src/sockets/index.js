import socketIO from 'socket.io'

import { applyChatsNS } from "./chats";
import { applyGamesNS } from "./games";
import { applyPairNS } from "./pair";
import AuthToken from "../models/authToken";

// Auth middleware
export const authSocket = async (socket: socketIO.Socket, next) => {
    const token = socket.handshake.auth.token;
    if (token === undefined)
        return next();
    const authToken = await AuthToken.findOne({ token });
    if (!authToken)
        return next();
    // Success authentication
    socket.username = authToken.username;
    socket.token = authToken.token;
    next();
};

const tokenToSockets = new Map();
// Token tracking middleware (to disconnect sockets upon logout).
export const tokenTracker = (socket: socketIO.Socket, next) => {
    const token = socket.token;
    if (token === undefined) return next();
    /** @type Set<socketIO.Socket> */
    let set = tokenToSockets.get(token);
    if (set === undefined) {
        set = new Set([socket,]);
        tokenToSockets.set(token, set);
    }
    else
        set.add(socket);
    socket.on('disconnect', reason => {
        set.delete(socket);
        if (set.size === 0)
            tokenToSockets.delete(token);
    });
    next();
};

// Function to disconnect all currently connected sockets authorized with the specific token.
export const disconnectByToken = (token: String) => {
    const set = tokenToSockets.get(token);
    if (set === undefined) return;
    const arr = [...set];
    arr.forEach((socket: socketIO.Socket) => {
        socket.disconnect(false);
    });
};

export const applySocket = (io: socketIO.Server) => {
    applyChatsNS(io.of("/chats"));
    applyGamesNS(io.of("/games"));
    applyPairNS(io.of("/pair"));
};