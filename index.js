import express from 'express';
import {logger} from './middlewares/loggers.js'
import genericRoutes from "./routes/genericRoutes.js";
import family from "./routes/family.js";
import logoutRoutes from "./routes/logout.js";
import loginRoutes from "./routes/login.js";
import signupRoutes from "./routes/signup.js"
import cookieParser from "cookie-parser";
import users from "./routes/users.js";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import 'dotenv/config'

import {getFamilyCheck, verifyJWTToken} from "./middlewares/middlewares.js";


const app = express();
const port = process.env.port || 3005;
const secret = process.env.mySecret

const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost", "http://localhost:5173", "https://app.famcal.ch", "https://admin.socket.io/"], // Update these to match the client URLs
        methods: ["GET", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        credentials: true
    }
});

//Checking if a secret is defined in .env file. If not the app will crash immediately
if (!secret) {
    throw new Error('Missing mySecret in .env file. See github wiki for details.');
} else (console.log('mySecret found in .env file'))

app.use(express.json());
app.use(cookieParser())

app.use(cors({
    allowedHeaders: ['Content-Type', 'api_key', 'family_uuid'], // Include custom headers here
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
    console.log(socket.id); // Log the socket ID
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
    });
});



httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

