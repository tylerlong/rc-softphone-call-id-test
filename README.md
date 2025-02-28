# RingCentral Softphone SDK call ID test

This test is for https://github.com/ringcentral/ringcentral-softphone-ts

When you make an outbound phone call using the softphone SDK, you will be able
to find Telephony Session ID from SIP message headers.

But when you receive an inbound phone call using the softphone SDK, SIP server
doesn't provide the Telephony Session ID for the call.

## Workaround solution

Subscribe to
`/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true&sipData=true`

Ref:
https://developers.ringcentral.com/api-reference/Detailed-Extension-Presence-with-SIP-Event

Whenever there is an inbound call, You will get a SIP INVITE message:

```
INVITE sip:12012345678@10.32.14.81:53131;transport=TLS;ob SIP/2.0
Call-ID: 32b1c547-7b46-4a83-b4e3-f8528c98be99
CSeq: 17282 INVITE
....
```

You will also get an event when the call is connected:

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
        "partyId": "p-a0d7bd72b77dez19548d8007fz97f9f60000-2",
        "telephonySessionId": "s-a0d7bd72b77dez19548d8007fz97f9f60000"
      }
    ],
    ...
  }
}
```

And you will find that `sipMessage.headers['Call-ID']` equals to
`notification.body.activeCalls[0].id`. You will be able to find
`telephoneSessionId` from `notification.body.activeCalls[0].telephonySessionId`.

Note, as I tested, you will need to wait for the `CallConnected` event. For
`Ringing` event, `sipMessage.headers['Call-ID']` does NOT equal to
`notification.body.activeCalls[0].id`.

## Solution 2

### Account level

Or you could subscribe to account level events:
"/restapi/v1.0/account/~/telephony/sessions?sipData=true&statusCode=Answered&direction=Inbound"

Ref:
https://developers.ringcentral.com/api-reference/Account-Telephony-Sessions-Event

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

`notification.body.parties[0].sipData.callId === sipMessage.headers['Call-Id']`

### Extension level

This event provides extension level counterpart:
`/restapi/v1.0/account/~/extension/~/telephony/sessions?sipData=true&statusCode=Answered&direction=Inbound`

Ref:
https://developers.ringcentral.com/api-reference/Extension-Telephony-Sessions-Event

## Notes

If you subscribe to extension level events, you will need to make sure that you
use the same extension to login softphone and to create the subscription.
Otherwise you will not get notifications due to extension mismatch.
