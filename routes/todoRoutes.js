import express from "express";
import {Todo} from '../classes/classes.js';
import { write, findAll, findOne, deleteOne , patchOne} from "../connectors/dbConnector.js";
import {logger} from '../middlewares/loggers.js'
import date from 'date-and-time';
import { todoSchema } from "../classes/schemas.js";;

const router = express.Router();
const collection = "todos";


router.get('/', (req, res) =>{
    
    findAll(collection)
    .then((d) => {
        logger.info('Received a list request for ToDos');
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
        logger.info(`Received a request for Todo ${req.params.uuid}`);
        res.status(200).json(d)
    })
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.post('/', async (req, res) =>{
   
    try {
    const value = await todoSchema.validateAsync(req.body)


    let subject = req.body.subject, 
    creator = req.body.creator || "Unknown", 
    deadline = req.body.deadline, 
    fullDay = req.body.fullDay || false , 
    attendees = req.body.attendees || [], 
    note = req.body.note || "", 
    tags = req.body.tags || [],
    important = req.body.important || false, 
    created = date.format(new Date(), 'DD.MM.YYYY HH:MM')

        let todo = new Todo(subject, creator, deadline, fullDay, attendees, note, important,created , tags)

        await write(collection, todo )
            .then( s => {
                console.log(s)
                logger.info(`created a new Todo ${JSON.stringify({s, todo})}`);

                res.status(200).json({s, todo})
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
        logger.info(`Deleted todo ${req.params.uuid}`)
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
        logger.info(`Updated Todo ${req.params.uuid}`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})


export default router



