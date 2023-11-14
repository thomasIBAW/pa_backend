import express from 'express';
import calendarRouter from './routes/calendarRoutes.js';
import peopleRouter from './routes/peopleRoutes.js';
import tagsRouter from './routes/tagsRoutes.js';
import {logger} from './middlewares/loggers.js'

const app = express();
const port = 3005;

app.use(express.json());
app.use('/calendar', calendarRouter)
app.use('/people', peopleRouter)
app.use('/tags', tagsRouter)


// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      // Handle the error here
      console.error('Bad JSON');
      logger.error(err)
      res.status(400).send('Bad JSON');
    } else {
      // Pass on to the next error handler
      next(err);
    }
  });


app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})
