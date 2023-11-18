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

export const userSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),
    email: Joi.string()
        .email(),
    password: Joi.string()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,60}$')),
    repeat_password: Joi.ref('password'),
    remember: Joi.boolean(),
    linkedPerson: Joi.string(),
    linkedFamily: Joi.string(),
    isAdmin: Joi.boolean(),
    isFamilyAdmin : Joi.boolean()
})
    .xor('password', 'access_token')
    .with('password', 'repeat_password');

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

export const familySchema = Joi.object({
    familyName: Joi.string()
        .min(3)
        .max(15)
        .required(),
    familyColor: Joi.string()
        .pattern(/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/),
    createdBy : Joi.string()
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