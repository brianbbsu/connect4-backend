import express from 'express'
import createError from 'http-errors'
import { wrap } from 'async-middleware'

import User from '../models/user'

const { NotFound } = createError;

const router = express.Router();

router.get('/', wrap(async (req, res, next) => {
    const users = await User.find({}).select('username');
    res.status(200).json({
        ok: true,
        users: users,
    });
}));

router.get('/:username', wrap(async (req, res, next) => {
    const username = req.params.username;
    const user = await User.findOne({ username });
    if (!user)
        return next(NotFound('The user does not exist.'));
    res.status(200).json({
        ok: true,
        user: user
    });
}));

exports.usersRouter = router;