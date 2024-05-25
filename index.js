import express from 'express';
import {logger} from './middlewares/loggers.js'
import genericRoutes from "./routes/genericRoutes.js";
import family from "./routes/family.js";
import logoutRoutes from "./routes/logout.js";
import loginRoutes from "./routes/login.js";
import signupRoutes from "./routes/signup.js"
import cookieParser from "cookie-parser";
import meRoutes from "./routes/me.js";
import users from "./routes/users.js";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";


import 'dotenv/config'

import {getFamilyCheck, verifyJWTToken} from "./middlewares/middlewares.js";


const app = express();
const port = process.env.port || 3005;
const secret = process.env.mySecret
const backend = process.env.BACKEND || "unknown"  //to be set in Env variables

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost", "http://localhost:5173", "https://app.famcal.ch", "https://admin.socket.io"], // Update these to match the client URLs
        methods: ["GET", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        credentials: true
    }
});

instrument(io, {
    auth: {
    type: "basic",
    username: "admin",
    password: "$2a$10$w5JWi3X5stYarpOZ2eyX8.sMprYGX2MXBk.MmKV4o8rxIhhpW0Pau"
    },
    namespaceName: "/admin",
    mode: "development",
  });

//Checking if a secret is defined in .env file. If not the app will crash immediately
if (!secret) {
    throw new Error('Missing mySecret in .env file. See github wiki for details.');
} else (logger.info('mySecret found in .env file at backend start.'))

app.use(express.json());
app.use(cookieParser())

app.use(cors({
    origin: ['http://localhost', 'http://localhost:5173', "https://app.famcal.ch", "frontend"], // Or a more restrictive setting for security
    methods: "GET,PUT,PATCH,POST,DELETE",
    credentials: true,
}));

//Adding a route for family
app.use('/api/family', family)

//Adding a route for family
app.use('/api/users', users)

//Adding a route for Login (no token needed, returns a token if authentication succeeded)
app.use('/login', loginRoutes)

//Adding a route for Login (no token needed, returns a token if authentication succeeded)
app.use('/logout', logoutRoutes)

//Adding a route fir signup (no token needed to create a new user and new family)
app.use('/signup', signupRoutes)

app.use('/me', meRoutes)

//Adding generic route for all other requests
app.use(genericRoutes);

//used to debug entrypoints and middlewares, not used in production
/*app.post('/demo', getFamilyCheck, verifyJWTToken, (req, res) => {
    console.log(`Family Admins are: ${req.familyAdmin}`)
    console.log(`Authenticated user is ${req.decoded.username}`)
    res.status(200).json(`Family Admins are: ${req.familyAdmin}`)
})*/

// API Error handling (express middleware)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // Handle the error here
        logger.error(err)
        res.status(400).send('Bad JSON in Payload. Check for typos');
    } else {
        // Pass on to the next error handler
        next(err);
    }
});


io.on("connection", (socket) => {
    logger.debug(`Socket connection opened - Socket id: ${socket.id}`); // Log the socket ID
    socket.on('join_room', (room) => {
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined room ${room}`);
    });
});



httpServer.listen(port, () => {
    logger.info(`Server ${backend} started. Listening on port ${port}...`)
})

