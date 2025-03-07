import process from "node:process";
import Softphone from "ringcentral-softphone";
import RingCentral from "@rc-ex/core";
import WebSocketExtension from "@rc-ex/ws";

const softphone = new Softphone({
  outboundProxy: process.env.SIP_INFO_OUTBOUND_PROXY!,
  username: process.env.SIP_INFO_USERNAME!,
  password: process.env.SIP_INFO_PASSWORD!,
  authorizationId: process.env.SIP_INFO_AUTHORIZATION_ID!,
  domain: process.env.SIP_INFO_DOMAIN!,
});
softphone.enableDebugMode(); // print all SIP messages

const rc = new RingCentral({
  server: process.env.RINGCENTRAL_SERVER_URL,
  clientId: process.env.RINGCENTRAL_CLIENT_ID,
  clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET,
});

const main = async () => {
  await softphone.register();
  softphone.on("invite", async (inviteMessage) => {
    await softphone.answer(inviteMessage);
    console.log("Answered");
  });

  await rc.authorize({
    jwt: process.env.RINGCENTRAL_JWT_TOKEN!,
  });
  const wsExt = new WebSocketExtension();
  await rc.installExtension(wsExt);

  // const extInfo = await rc.restapi().account().extension().get();
  // console.log(JSON.stringify(extInfo, null, 2));

  const subInfo = await wsExt.subscribe([
    // "/restapi/v1.0/account/~/telephony/sessions?sipData=true&statusCode=Answered&direction=Inbound",
    "/restapi/v1.0/account/~/extension/~/telephony/sessions?sipData=true&statusCode=Answered&direction=Inbound",
    // "/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true&sipData=true",
  ], (event) => {
    console.log(JSON.stringify(event, null, 2));
  });
  console.log(JSON.stringify(subInfo.subscriptionInfo, null, 2));
};
main();
