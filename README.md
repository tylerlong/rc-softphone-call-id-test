# RingCentral Softphone SDK call ID test

This test is for https://github.com/ringcentral/ringcentral-softphone-ts

When you make an outbound phone call using the softphone SDK, you will be able
to find Telephony Session ID from SIP message headers.

But when you receive an inbound phone call using the softphone SDK, SIP server
doesn't provide the Telephony Session ID for the call.

## Workaround solutions

Whenever there is an inbound call, You will get a SIP INVITE message:

```
INVITE sip:12012345678@10.32.14.81:53131;transport=TLS;ob SIP/2.0
Call-ID: 32b1c547-7b46-4a83-b4e3-f8528c98be99
CSeq: 17282 INVITE
....
```

### Extension level

Subscribe to this event:
`/restapi/v1.0/account/~/extension/~/telephony/sessions?sipData=true&statusCode=Answered&direction=Inbound`

Ref:
https://developers.ringcentral.com/api-reference/Extension-Telephony-Sessions-Event

Sample event:

```json
{
  "uuid": "8593269783951502957",
  "subscriptionId": "a09a6bd5-18c4-4224-80d6-c677dd6484e7",
  "body": {
    "telephonySessionId": "s-a0d17b72b8218z1954dd290daz19754f10000",
    "parties": [
      {
        "sipData": {
          "callId": "d75f18b2-320f-403d-9150-9e05bef80365",
          "toTag": "2225ca18-fdfd-4e0e-8ef1-6bc151b1523e",
          "fromTag": "10.13.23.238-5070-ab65c1bb-5d48-4108"
        },
        "status": {
          "code": "Answered",
        },
      }
    ],
    ...
  }
}
```

You can filter the events by
`notification.body.parties[0].sipData.callId === sipMessage.headers['Call-ID']`
and get the `telephonySessionId` from `notification.body.telephonySessionId`.

### Another extension level event

This one requires your RingCentral app has ReadPresence permission. Otherwise
there will be no events.

Subscribe to
`/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true&sipData=true`

Ref:
https://developers.ringcentral.com/api-reference/Detailed-Extension-Presence-with-SIP-Event

You will get an event when the call is connected:

```json
{
  "uuid": "6682202022092728770",
  "body": {
    "telephonyStatus": "CallConnected",
    "activeCalls": [
      {
        "id": "32b1c547-7b46-4a83-b4e3-f8528c98be99",
        "direction": "Inbound",
        "telephonyStatus": "CallConnected",
        "sipData": {
          "toTag": "f099102a-4048-4709-82c3-f044fd369e4e",
          "fromTag": "10.13.123.208-5070-f581cbbd-3875-4cc",
          "remoteUri": "-",
          "localUri": "-"
        },
        "partyId": "p-a0d7bd72b77dez19548d8007fz97f9f60000-2",
        "telephonySessionId": "s-a0d7bd72b77dez19548d8007fz97f9f60000"
      }
    ],
    ...
  }
}
```

You can filter the events by
`notification.body.activeCalls[0].id === sipMessage.headers['Call-ID']` and get
the `telephonySessionId` from
`notification.body.activeCalls[0].telephonySessionId`.

Note, as I tested, for `CallConnected` event, `sipMessage.headers['Call-ID']`
does equals to `notification.body.activeCalls[0].id`. However, for `Ringing`
event, `sipMessage.headers['Call-ID']` does NOT equal to
`notification.body.activeCalls[0].id`.

## Notes

If you subscribe to extension level events, you will need to make sure that you
use the same extension to login softphone and to create the subscription.
Otherwise you will not get notifications due to extension mismatch.

### Account level events

Normally you don't need account level events. Since your softphone is just an
extension. You probably should choose extension level events.

Or you could subscribe to account level events:
`/restapi/v1.0/account/~/telephony/sessions?sipData=true&statusCode=Answered&direction=Inbound`

Ref:
https://developers.ringcentral.com/api-reference/Account-Telephony-Sessions-Event

But even you subscribe to account level notifications, and you can get all
notifications from all extensions, NOT all of them contain "sipData". This is by
design. You can only receive "sipData" if you have the permission to answer the
call.

To grant subscriber the permission to answer the call:

- Go to service.ringcentral.com, login as super admin
- Go the settings of the extension which is going to receive the call
- Click "Devices & Numbers", click "Presence", click "Permissions"
- Go to bottom part of the page, find "Select users permitted to answer my
  calls"
- Add subscriber to the users list.
