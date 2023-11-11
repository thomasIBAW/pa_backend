import express from "express";
import {Appointment} from '../classes/classes.js';
import { write } from "../connectors/dbConnector.js";

const router = express.Router();


router.get('/', (req, res) =>{
    res.json('Hello')
})


router.post('/', (req, res) =>{
    
    let subject = req.body.subject, 
    creator = req.body.creator || "NA", 
    dateTimeStart = req.body.dateTimeStart, 
    dateTimeEnd = req.body.dateTimeEnd, 
    fullDay = req.body.fullDay || false , 
    attendees = req.body.attendees, 
    note = req.body.note || "", 
    important = req.body.important || false

    if (!subject) return res.status(400).json('Subject is missing');
    if (!dateTimeEnd) return res.status(400).json('End Date is missing');
    if (!dateTimeStart) return res.status(400).json('Start Date is missing');
    else {
        let appointment = new Appointment(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important )
        console.log(appointment);

    write("appointments", appointment )
        .then(console.log)
        .catch(console.error)
        .finally(() => {
            res.status(200).json(appointment)
        });

    }
})


export default router



