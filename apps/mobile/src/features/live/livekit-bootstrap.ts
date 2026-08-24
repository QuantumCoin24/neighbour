let registered = false;

export async function registerNeighbourLiveKit(): Promise<void> {
  if (registered) {
    return;
  }

  const livekit = await import('@livekit/react-native');

  livekit.registerGlobals();

  registered = true;
}
