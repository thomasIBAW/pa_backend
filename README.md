# Backend
# IBAW Web Engineering - Project 

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