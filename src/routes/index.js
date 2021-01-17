import express from 'express'
import createError from 'http-errors'

import { userRouter, authRequired } from './user'

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

    app.use('/user', userRouter);

    // error message handling
    app.use((err, req, res, next) => {
        if (!createError.isHttpError(err)) next(err);
        return res.status(err.status || 500).json({
            ok: false,
            message: err.expose && err.message ? err.message : "Unknown error.",
        });
    });
};