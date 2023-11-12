import express from 'express';
import calendarRouter from './routes/calendarRoutes.js';
import peopleRouter from './routes/peopleRoutes.js';
const app = express();
const port = 3005;

app.use(express.json());
app.use('/calendar', calendarRouter)
app.use('/people', peopleRouter)

app.listen(port, () => {
    console.log(`Server listening on port ${port}...`)
})
