import express from 'express'
import createError from 'http-errors'
import bcrypt from 'bcrypt'
import { wrap } from 'async-middleware'
import crypto from 'crypto'

import User from "../models/user"
import AuthToken from "../models/authToken"

const { BadRequest, Conflict, UnprocessableEntity, Unauthorized } = createError;

const router = express.Router();

export const authRequired = wrap(async (req, res, next) => {
    if (!req.headers.authorization)
        return next(Unauthorized('Login required. Missing Authorization header.'));
    const [type, token, ...rest] = req.headers.authorization.split(' ');
    if (type === undefined || token === undefined || type !== "Token")
        return next(Unauthorized('Login required. Malformed Authorization header.'));
    const authToken = await AuthToken.findOne({ token });
    if (!authToken)
        return next(Unauthorized('Login required. Invalid token.'));
    const user = await User.findOne({ username: authToken.username });
    req.user = user;
    next();
});

router.post("/register", wrap(async (req, res, next) => {
    if (!req.body.username || !req.body.password)
        return next(BadRequest('Missing username or password field.'));
    const { username, password } = req.body;
    const usernameRegex = /^[a-zA-Z0-9-_]{1,32}$/;
    const passwordMinLength = 6;
    if (!usernameRegex.test(username))
        return next(UnprocessableEntity(`Username should match /${usernameRegex.source}/.`));
    if (password.length < passwordMinLength)
        return next(UnprocessableEntity(`Password should be at least ${passwordMinLength} characters long`));
    
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const user = new User({
        username: username,
        password: hash,
    });
    await user.save().catch(err => {
        if (err.name === 'MongoError' && err.code === 11000) // already exists
            throw Conflict(`User "${username}" already exists.`);
        throw err;
    });

    // Login the user right away
    const token = crypto.randomBytes(16).toString('hex');
    await AuthToken.create({
        token: token,
        username: username,
    });
    res.status(200).json({
        ok: true,
        token: token,
    });
}));

router.post("/login", wrap(async (req, res, next) => {
    if (!req.body.username || !req.body.password)
        return next(BadRequest('Missing username or password field.'));
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });
    if (!user)
        return next(Unauthorized(`Incorrect username or password.`));
    const match = await bcrypt.compare(password, user.password);
    if (!match)
        return next(Unauthorized(`Incorrect username or password.`));
    const token = crypto.randomBytes(16).toString('hex');
    await AuthToken.create({
        token: token,
        username: username,
    });
    res.status(200).json({
        ok: true,
        token: token
    });
}));

router.post("/logout", authRequired, wrap(async (req, res, next) => {
    const [type, token, ...rest] = req.headers.authorization.split(' ');
    await AuthToken.deleteOne({ token });
    res.status(200).json({
        ok: true,
    });
}));

exports.authRouter = router;