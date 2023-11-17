import JoiBase from "joi";
import JoiDate from '@joi/date'
const Joi = JoiBase.extend(JoiDate)


//Uses Joi to validate the provided payload in POST calls.

export const personSchema = Joi.object({
    firstName: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
    lastName: Joi.string()
        .alphanum()
        .min(3)
        .max(30),
    nickName: Joi.string()
        .alphanum()
        .min(3)
        .max(30),
    dob: Joi.date()
        .format('DD.MM.YYYY'),
    email: Joi.string()
        .email()
});

export const calendarSchema = Joi.object({
    subject: Joi.string()
        .min(3)
        .max(30)
        .required(),
    creator: Joi.string()
        .alphanum()
        .min(3)
        .max(30),
    dateTimeStart: Joi.date()
        .required(),
    dateTimeEnd: Joi.date()
        .required(),
    attendees: Joi.array(),
    tags: Joi.array(),
    note: Joi.string()
        .max(150),
    fullDay: Joi.boolean(),
    important: Joi.boolean()
});

export const tagsSchema = Joi.object({
    tagName: Joi.string()
        .alphanum()
        .min(3)
        .max(15)
        .required(),
    tagColor: Joi.string()
        .pattern(/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/)
});

export const todoSchema = Joi.object({
    subject: Joi.string()
        .min(3)
        .max(30)
        .required(),
    creator: Joi.string()
        .min(3)
        .max(30),
    deadline: Joi.date(),
    attendees: Joi.array(),
    tags: Joi.array(),
    note: Joi.string(),
    fullDay: Joi.boolean(),
    important: Joi.boolean()
});