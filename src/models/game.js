import mongoose from 'mongoose'
import _ from 'lodash'

import { autoIncrement } from "./utils";
import User from "./user"
import { AIModel } from "../ai";
import config from "../config"

const Schema = mongoose.Schema;

export const GAME_STATUS = {
    ONGOING: 'ongoing',
    PLAYER1_WINS: 'player1_wins',
    PLAYER2_WINS: 'player2_wins',
    TIE: 'tie',
};

const GameSchema = Schema({
    player1: {
        type: String,
        required: true,
    },
    player2: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: GAME_STATUS.ONGOING,
    },
    moves: [{
        row: {
            type: Number,
            required: true,
        },
        col: {
            type: Number,
            required: true,
        },
    }],
}, {
    timestamps: true,
    optimisticConcurrency: true,
});

GameSchema.plugin(autoIncrement.plugin, {
    model: 'Game',
    startAt: 1,
});

GameSchema.methods.toJSON = function () {
    const game = this.toObject();
    game.id = game._id;
    return _.pick(game, ["id", "player1", "player2", "status", "moves", "createdAt"]);
}

GameSchema.virtual('currentPlayer').get(function () {
    if (this.status !== GAME_STATUS.ONGOING)
        return null;
    // Player1 goes first
    return this.moves.length % 2 === 0 ? this.player1 : this.player2;
});

GameSchema.methods.isValidLocation = function (move) {
    if (!_.isInteger(move.col) || !_.isInteger(move.row) || !_.inRange(move.col, 0, 7) || !_.inRange(move.row, 0, 6))
        return false;
    const max = _.reduce(this.moves, (cur, { row, col }) => {
        return col === move.col && row > cur ? row : cur;
    }, -1);
    return move.row === max + 1;
};

GameSchema.methods.updateStatus = function () {
    const board = _.chunk(Array(6 * 7).fill(0), 6); // 7 * 6
    _.forEach(this.moves, ({ col, row }, idx) => {
        board[col][row] = (idx % 2 == 0) ? 1 : 2;
    });
    const inBoardRange = (col, row) => {
        return _.inRange(col, 0, 7) && _.inRange(row, 0, 6);
    }
    const checkLine = (x, y, dx, dy) => {
        if (board[x][y] === 0) return false;
        if (!inBoardRange(x, y)) return false;
        for (let i = 0; i < 3; i += 1) {
            if (!inBoardRange(x + dx, y + dy)) return false;
            if (board[x][y] != board[x + dx][y + dy])
                return false;
            x += dx; y += dy;
        }
        return true;
    };
    let winner = 0;
    for (let col = 0; col < 7; col += 1)
        for (let row = 0; row < 6; row += 1) {
            if (checkLine(col, row, 1, 0) || checkLine(col, row, 0, 1) ||
                checkLine(col, row, 1, 1) || checkLine(col, row, 1, -1))
                winner = board[col][row];
        }
    if (winner !== 0)
        this.status = winner === 1 ? GAME_STATUS.PLAYER1_WINS : GAME_STATUS.PLAYER2_WINS;
    else if (this.moves.length === 6 * 7)
        this.status = GAME_STATUS.TIE;
    else
        this.status = GAME_STATUS.ONGOING;
    return;
};


/**
 * Return new status if the move succeed. False if failed.
 * @param {Number} gameId
 * @param {String} username
 * @param {Object} move
 * @param {Number} move.col
 * @param {Number} move.row
 * @returns {String} New status / false
 */
GameSchema.statics.makeMove = async function (gameId, username, move) {
    let game = await this.findById(gameId);
    if (!game) return false;
    if (game.status !== GAME_STATUS.ONGOING || game.currentPlayer !== username)
        return false; // The game is finished / It is not your turn
    if (!game.isValidLocation(move))
        return false; // This is not a valid location
    game.moves.push(move);
    game.updateStatus();
    try {
        game = await game.save();
    } catch (err) {
        if (err instanceof MongooseError.VersionError)
            return false; // Race condition. This is not a valid move.
        console.log(err);
        return false;
    }
    if (game.status !== GAME_STATUS.ONGOING) {
        // Update statistics
        let doc1 = {}, doc2 = {};
        doc1.gameFinished = 1; doc2.gameFinished = 1;
        if (game.status === GAME_STATUS.PLAYER1_WINS)
            doc1.gameWon = 1, doc2.gameLost = 1;
        else if (game.status === GAME_STATUS.PLAYER2_WINS)
            doc1.gameLost = 1, doc2.gameWon = 1;
        else // TIE
            doc1.gameTied = 1, doc2.gameTied = 1;
        await User.updateOne({username: game.player1}, { $inc: doc1 });
        await User.updateOne({username: game.player2}, { $inc: doc2 });
    }
    return game.status;
}

GameSchema.statics.checkAI = async function (gameId) {
    const game = await this.findById(gameId);
    if (!game) return false;
    if (game.status !== GAME_STATUS.ONGOING || game.currentPlayer !== config.AIUsername)
        return false;
    const AIPlayerNum = game.player1 === config.AIUsername ? 1 : 2;
    const pick = await AIModel.decide(game.moves, AIPlayerNum);
    const max = _.reduce(game.moves, (cur, { row, col }) => {
        return col === pick && row > cur ? row : cur;
    }, -1);
    const AImove = {
        col: pick,
        row: max + 1,
    };
    const AIStatus = await this.makeMove(gameId, config.AIUsername, AImove);
    return { AIStatus, AImove };
}

const Game = mongoose.model("Game", GameSchema);

export default Game;