import express from 'express';
import {logger} from './middlewares/loggers.js'
import genericRoutes from "./routes/genericRoutes.js";
import loginRoutes from "./routes/login.js";
import cookieParser from "cookie-parser";
import {getFamilyCheck, verifyJWTToken} from "./middlewares/middlewares.js";

const app = express();
const port = 3005;

app.use(express.json());
app.use(cookieParser())

app.use('/login', loginRoutes)

app.post('/demo', getFamilyCheck, verifyJWTToken, (req, res) => {
    console.log(`Family Admins are: ${req.familyAdmin}`)
    console.log(`Authenticated user is ${req.decoded.username}`)
    res.status(200).json(`Family Admins are: ${req.familyAdmin}`)
})

app.use(genericRoutes);

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


app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})

