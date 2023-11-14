import express from "express";
import {Appointment} from '../classes/classes.js';
import { write, findAll, findOne, deleteOne , patchOne} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';
import { calendarSchema } from "../classes/schemas.js";;

const router = express.Router();
const collection = "appointments";


router.get('/', (req, res) =>{
    
    findAll(collection)
    .then((d) => {
        logger.info('Received a list request for appointments');
        res.status(200).json(d)
    })
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)
    })

})

router.get('/:uuid', (req, res) =>{
    
    findOne(collection, req.params.uuid)
    .then((d) => {
        logger.info(`Received a request for appointment ${req.params.uuid}`);
        res.status(200).json(d)
    })
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.post('/', async (req, res) =>{
   
    try {
    const value = await calendarSchema.validateAsync(req.body)


    let subject = req.body.subject, 
    creator = req.body.creator || "Unknown", 
    dateTimeStart = req.body.dateTimeStart, 
    dateTimeEnd = req.body.dateTimeEnd, 
    fullDay = req.body.fullDay || false , 
    attendees = req.body.attendees || [], 
    note = req.body.note || "", 
    tags = req.body.tags || [],
    important = req.body.important || false, 
    created = date.format(new Date(), 'DD.MM.YYYY HH:MM')

        let appointment = new Appointment(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important,created , tags)
        // console.log(appointment);

        await write(collection, appointment )
            .then( s => {
                console.log(s)
                logger.info(`created a new appointment ${JSON.stringify({s, appointment})}`);

                res.status(200).json({s, appointment})
            })
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)})

        }

    catch  (err) {
        logger.error(err)
        res.status(404).json(err.message)
    }

    }
    
)

router.delete('/:uuid', (req, res) =>{
    
    deleteOne(collection, req.params.uuid)
    .then((d) => {
        logger.info(`Deleted appointment ${req.params.uuid}`)
        res.status(200).json(d)
    })
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.patch('/:uuid', (req, res) =>{
    
    if (!req.body) return res.status(404).json('Missing body...')

    patchOne(collection, req.params.uuid, req.body)
    .then((d) => {
        logger.info(`Updted appointment ${req.params.uuid}`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})


export default router



