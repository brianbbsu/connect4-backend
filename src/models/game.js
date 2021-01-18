import mongoose from 'mongoose'
import _ from 'lodash'

import { autoIncrement } from "./utils";

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
});

GameSchema.plugin(autoIncrement.plugin, {
    model: 'Game',
    startAt: 1,
});

GameSchema.methods.toJSON = function() {
    const game = this.toObject();
    game.id = game._id;
    return _.pick(game, ["id", "player1", "player2", "status", "moves", "createdAt"]);
}

const Game = mongoose.model("Game", GameSchema);

export default Game;