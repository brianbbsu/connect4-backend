import mongoose from 'mongoose'

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
});

const User = mongoose.model("User", UserSchema);

export default User;
