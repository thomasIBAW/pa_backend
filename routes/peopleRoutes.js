import express from "express";
import {Person} from '../classes/classes.js';
import { write, findAll, findOne, deleteOne , patchOne} from "../connectors/dbConnector.js";
import date from 'date-and-time';

const router = express.Router();
const collection = "people";


router.get('/', (req, res) =>{
    
    findAll(collection)
    .then((d) => res.status(200).json(d))
    .catch((err) => res.status(404).json(err))

})

router.get('/:uuid', (req, res) =>{
    
    findOne(collection, req.params.uuid)
    .then((d) => res.status(200).json(d))
    .catch((err) => res.status(404).json(err))
    
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
            .then(console.log)
            .catch(console.error)
            .finally(() => {
                res.status(200).json(person)
            });

        }
    })

router.delete('/:uuid', (req, res) =>{
    
    deleteOne(collection, req.params.uuid)
    .then((d) => res.status(200).json(d))
    .catch((err) => res.status(404).json(err))
    
})

router.patch('/:uuid', (req, res) =>{
    
    if (!req.body) return res.status(404).json('Missing body...')

    patchOne(collection, req.params.uuid, req.body)
    .then((d) => res.status(200).json(d))
    .catch((err) => res.status(404).json(err))
    
})


export default router



