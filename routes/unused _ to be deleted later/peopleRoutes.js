import express from "express";
import {Person} from '../../classes/classes.js';
import {logger} from '../../middlewares/loggers.js'
import {write, findAll, findOne, deleteOne, patchOne, findSome} from "../../connectors/dbConnector.js";
import { personSchema } from "../../classes/schemas.js";
import date from 'date-and-time';
const pattern = date.compile('DD.MM.YYYY')

const router = express.Router();
const collection = "people";

router.post('/filter', (req, res) =>{
    //if (typeof (req.params.filterArray) != 'object') {throw new Error('Not an Array')}
    const body = req.body
    console.log(body)
    findSome(collection, body)
        .then((d) => {
            logger.info('Received a list request for appointments');
            res.status(200).json(d)
        })
        .catch((err) => {
            logger.error(err)
            res.status(404).json(err)
        })

})

router.get('/', (req, res) =>{
    
    findAll(collection)
    .then((d) => {
        logger.info(`Requested all people entries`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})

})

router.get('/:uuid', (req, res) =>{
    
    findOne(collection, req.params.uuid)
    .then((d) => {
        logger.info(`Requested Details about person ${req.params.uuid}`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.post('/', async (req, res) =>{
    
    try {
        const value = await personSchema.validateAsync(req.body)

        let firstName = value.firstName, 
        lastName = value.lastName || "",
        nickName = value.nickName || value.firstName,
        dob = date.format(new Date(value.dob), pattern) || "",
        email = value.email || ""
    
        let person = new Person(firstName, lastName, nickName, dob, email)
        console.log(person);
    
        write(collection, person )
            .then( s => {
                console.log(s);
                logger.info(`created a new person ${JSON.stringify({s, person})}`);
                res.status(200).json(person)
            })
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)})
    }

    catch  (err) {
        logger.error(err)
        res.status(404).json(err.message)
    }

})

router.delete('/:uuid', (req, res) =>{
    
    deleteOne(collection, req.params.uuid)
    .then((d) => {
        logger.info(`Deleted person ${req.params.uuid}`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.patch('/:uuid', (req, res) =>{
    
    if (!req.body) return res.status(404).json('Missing body...')

    patchOne(collection, req.params.uuid, req.body)
    .then((d) => {
        logger.info(`Updated person ${req.params.uuid}`)
        res.status(200).json(d)})
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})


export default router



