require('dotenv').config();

if (!process.env.MONGO_URL) {
    console.error('Missing mongo url!!');
    process.exit(1);
}

if (!process.env.AI_USERNAME) {
    console.error('Missing AI Username!!');
    process.exit(1);
}

if (!process.env.AI_MODEL_PATH) {
    console.error('Missing AI Model Path!!');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
    if (!process.env.SSL_KEY || !process.env.SSL_CERT || !process.env.SSL_CA) {
        console.error('Missing path to ssl key, ssl cert, or ssl ca');
        process.exit(1);
    }
    if (!process.env.FRONTEND_URL) {
        console.error('Missing frontend url!!');
        process.exit(1);
    }
}

const config = {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || '3000',
    mongo_url: process.env.MONGO_URL,
    
    AIUsername: process.env.AI_USERNAME,
    AIModelPath: process.env.AI_MODEL_PATH,

    useSSL: process.env.NODE_ENV === 'production',
    ssl_key: process.env.SSL_KEY || "",
    ssl_cert: process.env.SSL_CERT || "",
    ssl_ca: process.env.SSL_CA || "",

    frontendURL: process.env.FRONTEND_URL || "",
};



export default config;