import { registerGlobals } from '@livekit/react-native';

let registered = false;

/**
 * Installs the WebRTC globals required by LiveKit.
 *
 * This must execute before any LiveKit room is created.
 */
export function registerNeighbourLiveKit(): void {
  if (registered) {
    return;
  }

  registerGlobals();
  registered = true;
}
