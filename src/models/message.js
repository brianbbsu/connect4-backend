import mongoose from 'mongoose'
import _ from 'lodash'

const Schema = mongoose.Schema;

const MessageSchema = Schema({
    from: {
        type: String,
        required: true,
    },
    chatId: { // 0: Reserved for lobby, >= 1: game ID
        type: Number,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

MessageSchema.methods.toJSON = function() {
    return _.pick(this, ["from", "content", "createdAt"]);
}

const Message = mongoose.model("Message", MessageSchema);

export default Message;