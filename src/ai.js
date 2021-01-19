import * as tf from '@tensorflow/tfjs-node'
import _ from 'lodash'

import config from './config'
import User from './models/user'

export const AIModel = {
    load: async function() {
        this.model = await tf.loadGraphModel('file://' + config.AIModelPath);
        console.log('Loaded AI model.');
        const AIUser = await User.findOne({ username: config.AIUsername });
        if (AIUser) return;
        // The user does not exist
        const newUser = await User.create({
            username: config.AIUsername,
            password: "DUMMY_PASSWORD",
        });
        console.log(`Created AI user: ${newUser.username}.`);
    },
    decide: async function(moves: Array<Move>, AIPlayerNum: Number) {
        const board = _.chunk(Array(6 * 7).fill(0), 7); // 6 * 7
        const player1 = (AIPlayerNum === 1 ? 1 : 2);
        const player2 = (AIPlayerNum === 2 ? 1 : 2);
        _.forEach(moves, ({ col, row }, idx) => {
            board[5 - row][col] = (idx % 2 == 0) ? player1 : player2;
        });
        const input_tensor = tf.oneHot(tf.tensor(board).toInt().expandDims(0), 3);
        const result = this.model.execute(input_tensor.toFloat());
        const pick = await result.squeeze().argMax().array();
        return pick;
    },
};