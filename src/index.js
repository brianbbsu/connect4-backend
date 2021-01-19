import fs from 'fs'

import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import express from 'express'
import { Server as SocketIOServer } from "socket.io"
import morgan from 'morgan'
import cors from "cors";
import bodyParser from 'body-parser';
import mongoose from 'mongoose'

import config from "./config"
import { applyRoute } from "./routes/"
import { applySocket } from "./sockets/";

const app = express();
app.set('etag', false); // Prevent 304
app.set('x-powered-by', false); // For security

// Setup middlewares
app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Setup route
applyRoute(app);

// Setup both http/https server and socket.io server
const server = config.useSSL ? // Use SSL in production
    createHttpsServer({
        key: fs.readFileSync(config.ssl_key).toString(),
        cert: fs.readFileSync(config.ssl_cert).toString(),
        ca: fs.readFileSync(config.ssl_ca).toString(),
    }, app)
    : createHttpServer(app);
const io = new SocketIOServer(server, {
    serveClient: false,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Setup socket
applySocket(io);

// Open mongoose connection and start the app
mongoose.connect(config.mongo_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});
const db = mongoose.connection;
db.on('error', error => console.log(error));
db.once('open', () => {
    console.log('MongoDB connected');
    server.listen(config.port, config.host, () => {
        if (config.useSSL)
            console.log(`HTTPS server is now listening on ${config.host}:${config.port}!`)
        else
            console.log(`HTTP server is now listening on ${config.host}:${config.port}!`)
    });
});