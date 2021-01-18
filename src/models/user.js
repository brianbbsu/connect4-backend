import mongoose from 'mongoose'
import _ from 'lodash'

const Schema = mongoose.Schema;

const UserSchema = Schema({
    username: { // username should match /[a-zA-Z0-9-_]{1, 24}/
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    gameFinished: {
        type: Number,
        default: 0,
    },
    gameWon: {
        type: Number,
        default: 0,
    },
    gameTied: {
        type: Number,
        default: 0,
    },
    gameLost: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

UserSchema.methods.toJSON = function() {
    return _.pick(this, ["username", "createdAt", "gameFinished", "gameWon", "gameTied", "gameLost"]);
}

const User = mongoose.model("User", UserSchema);

export default User;
