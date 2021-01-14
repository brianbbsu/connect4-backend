require('dotenv').config();

if (!process.env.MONGO_URL) {
    console.error('Missing mongo url!!');
    process.exit(1);
}

if (!process.env.APP_SECRET) {
    console.error('Missing app secret!!');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
    if (!process.env.SSL_KEY || !process.env.SSL_CERT || !process.env.SSL_CA) {
        console.error('Missing path to ssl key, ssl cert, or ssl ca');
        process.exit(1);
    }
}

const config = {
    host: process.env.HOST || 'localhost',
    port: process.env.PORT || '3000',
    mongo_url: process.env.MONGO_URL,
    secret: process.env.APP_SECRET,
    
    useSSL: process.env.NODE_ENV === 'production',
    ssl_key: process.env.SSL_KEY || "",
    ssl_cert: process.env.SSL_CERT || "",
    ssl_ca: process.env.SSL_CA || "",
};



export default config;