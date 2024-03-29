import date from 'date-and-time';
import {v4 as uuid} from 'uuid';

const pattern = date.compile('YYYY-MM-DDTHH:mm')

export class Appointment {
    constructor(subject, creator, dateTimeStart, dateTimeEnd, fullDay, attendees, note, important,created, tags){

        this.subject = subject
        this.fullDay = fullDay
        if (fullDay) {
            this.dateTimeStart = date.format(new Date(dateTimeStart),'YYYY-MM-DDTHH:mm')
            this.dateTimeEnd = date.format(new Date(dateTimeEnd), 'YYYY-MM-DDTHH:mm')
        } else {
            this.dateTimeStart = date.format(new Date(dateTimeStart), 'YYYY-MM-DDTHH:mm')
            this.dateTimeEnd = date.format(new Date(dateTimeEnd), 'YYYY-MM-DDTHH:mm')
        };
        this.attendees = attendees
        this.note = note
        this.tags = tags
        this.deleted = false
        this.done = false
        this.important = important
        this.creator = creator
        this.created = created
        this.uuid = uuid()
    }
}

export class Person {
    constructor(firstName, lastName, nickName, dob, email){
        this.firstName = firstName
        this.lastName = lastName
        this.nickName = nickName
        this.dob = dob
        this.email = email
        this.uuid = uuid()
    }
}

export class User {
    constructor(username,password, remember, isAdmin, isFamilyAdmin,linkedPerson, linkedFamily, created, email){
        this.username = username
        this.password = password
        this.remember = remember
        this.isAdmin = isAdmin
        this.isFamilyAdmin = isFamilyAdmin
        this.linkedPerson = linkedPerson
        this.linkedFamily = linkedFamily
        this.email = email
        this.created = created
        this.uuid = uuid()
    }
}

export class Tag {
    constructor(name, color){
        this.tagName = name
        this.tagColor = color
        this.uuid = uuid()
    }

}export class Family {
    constructor(familyName, familyColor){
        this.familyName = familyName
        this.familyColor = familyColor
        this.uuid = uuid()
    }
}

export class Todo {
    constructor(subject, creator, deadline , fullDay, attendees, note, important,created, tags){

        this.subject = subject
        this.fullDay = fullDay
        this.deadline = date.format(new Date(deadline), pattern)
        this.attendees = attendees
        this.note = note
        this.tags = tags
        this.deleted = false
        this.done = false
        this.important = important
        this.creator = creator
        this.created = created
        this.uuid = uuid()
    }
}
