import fs from 'fs'

import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'
import express from 'express'
import { Server as SocketIOServer } from "socket.io"
import morgan from 'morgan'
import cors from "cors";
import mongoose from 'mongoose'

import config from "./config"
import router from "./routes/"

const app = express();
app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use("/", router);

const server = config.useSSL ? 
    createHttpsServer({
        key: fs.readFileSync(config.ssl_key).toString(),
        cert: fs.readFileSync(config.ssl_cert).toString(),
        ca: fs.readFileSync(config.ssl_ca).toString(),
    }, app)
    : createHttpServer(app);

const io = new SocketIOServer(server, {
    serveClient: false
});
app.set('socketio', io); // currently no use

mongoose.connect(config.mongo_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
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