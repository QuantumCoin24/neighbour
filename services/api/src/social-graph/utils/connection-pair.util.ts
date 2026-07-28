export interface ConnectionPair {
  userAId: string;
  userBId: string;
}

export function createConnectionPair(firstUserId: string, secondUserId: string): ConnectionPair {
  if (firstUserId === secondUserId) {
    throw new Error('A user cannot form a connection pair with themselves.');
  }

  return firstUserId.localeCompare(secondUserId) < 0
    ? {
        userAId: firstUserId,
        userBId: secondUserId,
      }
    : {
        userAId: secondUserId,
        userBId: firstUserId,
      };
}

export function getOtherUserId(currentUserId: string, pair: ConnectionPair): string {
  if (pair.userAId === currentUserId) {
    return pair.userBId;
  }

  if (pair.userBId === currentUserId) {
    return pair.userAId;
  }

  throw new Error('The current user does not belong to this connection pair.');
}
