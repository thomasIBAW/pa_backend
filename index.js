import express from 'express';
import {logger} from './middlewares/loggers.js'
import genericRoutes from "./routes/genericRoutes.js";
import loginRoutes from "./routes/login.js";
import cookieParser from "cookie-parser";

const app = express();
const port = 3005;

app.use(express.json());
app.use(cookieParser())

app.use(genericRoutes);
app.use('/login', loginRoutes)
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

