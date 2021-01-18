import express from 'express'
import createError from 'http-errors'
import { wrap } from 'async-middleware'

import Game from '../models/game'

const { NotFound, BadRequest, UnprocessableEntity } = createError;

const router = express.Router();

router.get('/', wrap(async (req, res, next) => {
    let filter = {};
    if (req.query.username !== undefined) {
        const username = req.query.username;
        filter = {
            $or: [
                { player1: username },
                { player2: username },
            ],
        };
    }
    const games = await Game.
        find(filter).
        sort('-_id').
        select('player1 player2 status createdAt');
    res.status(200).json({
        ok: true,
        games: games,
    });
}));

// TODO: Delete this. Only for testing purpose.
router.post('/', wrap(async (req, res, next) => {
    if (!req.body.player1 || !req.body.player2)
        return next(BadRequest('Missing player1 or player2.'));
    const { player1, player2 } = req.body;
    if (player1 === player2)
        return next(UnprocessableEntity('Two players should be different.'));
    const game = await Game.create({
        player1,
        player2,
    });
    res.status(200).json({
        ok: true,
        gameId: game._id,
    });
}));

router.get('/:id', wrap(async (req, res, next) => {
    const gameId = req.params.id;
    const game = await Game.findById(gameId);
    if (!game)
        return next(NotFound('The game does not exist.'));
    res.status(200).json({
        ok: true,
        game: game
    });
}));

exports.gamesRouter = router;