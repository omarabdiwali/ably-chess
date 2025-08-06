// utils/ablyClient.js
import Ably from 'ably';

let client;

export function getAblyClient() {
  if (!client) {
    client = new Ably.Realtime({
      authUrl: '/api/ably-token',
      echoMessages: false,
      closeOnUnload: true // lets Ably close on page unload automatically
    });
  }
  return client;
}
