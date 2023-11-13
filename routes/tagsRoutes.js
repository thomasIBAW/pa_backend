import express from "express";
import {Tag} from '../classes/classes.js';
import {logger} from '../middlewares/loggers.js'
import { write, findAll, findOne, deleteOne , patchOne} from "../connectors/dbConnector.js";
import { verifyToken } from "../middlewares/middlewares.js";

import date from 'date-and-time';

const router = express.Router();
const collection = "tags";

router.get('/', (req, res) =>{
    
    findAll(collection)
    .then((d) => res.status(200).json(d))
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})

})

router.get('/:uuid', (req, res) =>{
    
    findOne(collection, req.params.uuid)
    .then((d) => res.status(200).json(d))
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.post('/',  (req, res) =>{
    
    let tagName = req.body.tagName, 
    tagColor = req.body.tagColor || ""

    if (!tagName) return res.status(400).json('tagName is missing');
    else {
        let tag = new Tag(tagName,tagColor)
        console.log(tag);

        write(collection, tag )
            .then(console.log)
            .catch((err) => {
                logger.error(err)
                res.status(404).json(err)})
            .finally(() => {
                res.status(200).json(tag)
            });

        }
    })

router.delete('/:uuid', (req, res) =>{
    
    deleteOne(collection, req.params.uuid)
    .then((d) => res.status(200).json(d))
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})

router.patch('/:uuid', (req, res) =>{
    
    if (!req.body) return res.status(404).json('Missing body...')

    patchOne(collection, req.params.uuid, req.body)
    .then((d) => res.status(200).json(d))
    .catch((err) => {
        logger.error(err)
        res.status(404).json(err)})
    
})


export default router



