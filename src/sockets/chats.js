import SocketIO, { Socket } from 'socket.io'

import { authSocket, tokenTracker } from "./";
import Message from "../models/message"
import Game from "../models/game"

export const applyChatsNS = (ns: SocketIO.Namespace) => {
    ns.use(authSocket);
    ns.use(tokenTracker);
    ns.on('connect', async (socket: SocketIO.Socket) => {
        socket.on('join', async (chatId: Number, callback: Function) => {
            if (socket.chatId !== undefined) // Shouldn't happen actually
                socket.leave(socket.chatId);

            // Check if the chat exists. Currently all chats belongs to games.
            const game = await Game.findById(chatId);
            if (!game)
                return callback(null);

            socket.chatId = chatId;
            socket.join(socket.chatId);
            const messages = await Message.find({ chatId }).sort('createdAt');
            callback(messages);
        });

        socket.on('sendmsg', async (content: String) => {
            if (socket.username === undefined || socket.chatId === undefined || !content)
                return;
            const message = await Message.create({
                chatId: socket.chatId,
                from: socket.username,
                content: content,
            });
            ns.to(socket.chatId).emit("newmsg", message);
        });

        socket.on('leave', () => {
            if (socket.chatId !== undefined) {
                socket.leave(socket.chatId);
                delete socket.chatId;
            }
        });
    });
};