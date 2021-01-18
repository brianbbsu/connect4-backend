import express from 'express'
import createError from 'http-errors'

import { authRouter, authRequired } from './auth'
import { usersRouter } from './users'
import { gamesRouter } from './games'

/** @param {express.Express} app */
export const applyRoute = (app) => {
    app.get('/ping', (req, res) => {
        res.status(200).json({
            ok: true,
            message: 'pong',
        });
    });

    app.get('/me', authRequired, (req, res) => {
        res.status(200).json({
            ok: true,
            username: req.user.username,
        });
    });

    app.use('/auth', authRouter);
    app.use('/users', usersRouter);
    app.use('/games', gamesRouter);

    // error message handling
    app.use((err, req, res, next) => {
        if (!createError.isHttpError(err)) next(err);
        return res.status(err.status || 500).json({
            ok: false,
            message: err.expose && err.message ? err.message : "Unknown error.",
        });
    });
};