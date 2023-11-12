# Backend
# IBAW Web Engineering - Project 

[Backend](#backend)
- [Backend](#backend)
- [IBAW Web Engineering - Project](#ibaw-web-engineering---project)
  - [Calendar](#calendar)
    - [Add Calendar entry](#add-calendar-entry)
    - [Find all Calendar entries](#find-all-calendar-entries)
    - [Find one Calendar entry](#find-one-calendar-entry)
    - [Update one Calendar entry](#update-one-calendar-entry)
    - [Delete one Calendar entry](#delete-one-calendar-entry)

## Calendar

### Add Calendar entry 

Endpoint `POST` `/calendar` 
 
Payload (JSON)
```
{
  "subject": "Test",
  "creator": "Thomas",
  "dateTimeStart": "2023-11-13T10:18:00.186Z",
  "dateTimeEnd": "2023-11-13T15:18:00.186Z",
  "attendees": [
    "Lionel",
    "Lu"
  ],
  "tags": ["schule", "Wald"]
  "note": "none",
  "fullDay": false,
  "important": true,
}
```

where `subject`, `dateTimeStart` and `dateTimeEnd` are mandatory.

### Find all Calendar entries

Endpoint `GET`  `/calendar` 

Payload (JSON)
`none`

### Find one Calendar entry

Endpoint `GET`  `/calendar/<UUID>` 

Payload (JSON)
`none`

### Update one Calendar entry

Endpoint `PATCH`  `/calendar/<UUID>` 

Payload (JSON)
```
{
  "attendees": [
    "Lionel",
    "Lu"
  ],
  "tags": ["schule", "Wald"]
}
```
NO need to patch everthing. Just add the changed Data into the JSON payload.

### Delete one Calendar entry

Endpoint `DELETE`  `/calendar/<UUID>` 

Payload (JSON)
`none`

> [!WARNING]
> No Confirmation asked. Cannot be undone.