# Backend
# IBAW Web Engineering - Project 

## Calendar

### Add Calendar entry 

Endpoint `/calendar` 
 `POST`

Payload (JSON)
```
{
  "subject": "Demo",
  "creator": "Thomas",
  "dateTimeStart": "2023-11-11T21:18:00.186Z",
  "dateTimeEnd": "2023-11-11T22:18:00.186Z",
  "attendees": [
    "thomas",
    "Lu"
  ],
  "note": "none",
  "fullDay": false,
  "important": true
}
```

where `subject`, `dateTimeStart` and `dateTimeEnd` are mandatory.