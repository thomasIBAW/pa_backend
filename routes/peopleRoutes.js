import express from "express";
import {Person} from '../classes/classes.js';
import {logger} from '../middlewares/loggers.js'
import { write, findAll, findOne, deleteOne , patchOne} from "../connectors/dbConnector.js";
import date from 'date-and-time';

const router = express.Router();
const collection = "people";


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

router.post('/', (req, res) =>{
    
    let firstName = req.body.firstName, 
    lastName = req.body.lastName || "",
    nickName = req.body.nickName || req.body.firstName,
    dob = req.body.dob || "",
    email = req.body.email || ""

    if (!firstName) return res.status(400).json('Firstname is missing');
    else {
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



