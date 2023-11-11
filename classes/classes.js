import date from 'date-and-time';
import {v4 as uuid} from 'uuid';

const pattern = date.compile('DD.MM.YYYY - HH:MM')

export class Appointment {
    constructor(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important){

        this.subject = subject
        this.fullDay = fullDay
        if (fullDay) {
            this.dateTimeStart = date.format(new Date(dateTimeStart), 'DD.MM.YYYY - 00:00')
            this.dateTimeEnd = date.format(new Date(dateTimeEnd), 'DD.MM.YYYY - 23:59')
        } else {
            this.dateTimeStart = date.format(new Date(dateTimeStart), pattern)
            this.dateTimeEnd = date.format(new Date(dateTimeEnd), pattern)
        };
        this.attendees = attendees
        this.note = note
        this.deleted = false
        this.done = false
        this.important = important
        this.creator = creator
        this.created = date.format(new Date(), pattern)
        this.uuid = uuid()
    }
}




