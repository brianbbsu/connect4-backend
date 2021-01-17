import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const AuthTokenSchema = Schema({
    token: {
        type: String,
        unique: true,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
});

const AuthToken = mongoose.model("AuthToken", AuthTokenSchema);

export default AuthToken;