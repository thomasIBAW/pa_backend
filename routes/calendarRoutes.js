import express from "express";
import {Appointment} from '../classes/classes.js';
import { write, findAll } from "../connectors/dbConnector.js";
import date from 'date-and-time';

const router = express.Router();


router.get('/', (req, res) =>{
    
    findAll('appointments')
    .then((d) => res.status(200).json(d))
    .catch((err) => res.status(404).json(err))
    
})


router.post('/', (req, res) =>{
    
    let subject = req.body.subject, 
    creator = req.body.creator || "NA", 
    dateTimeStart = req.body.dateTimeStart, 
    dateTimeEnd = req.body.dateTimeEnd, 
    fullDay = req.body.fullDay || false , 
    attendees = req.body.attendees, 
    note = req.body.note || "", 
    important = req.body.important || false, 
    created = date.format(new Date(), 'DD.MM.YYYY - HH:MM')

    if (!subject) return res.status(400).json('Subject is missing');
    if (!dateTimeEnd) return res.status(400).json('End Date is missing');
    if (!dateTimeStart) return res.status(400).json('Start Date is missing');
    else {
        let appointment = new Appointment(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important,created )
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



