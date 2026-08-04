export const RealtimeEvents = {
  CONNECTION_READY: 'connection.ready',

  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACKNOWLEDGED: 'heartbeat.acknowledged',

  PRESENCE_ONLINE: 'presence.online',
  PRESENCE_OFFLINE: 'presence.offline',
  PRESENCE_CHANGED: 'presence.changed',

  ROOM_JOIN: 'room.join',
  ROOM_JOINED: 'room.joined',
  ROOM_LEAVE: 'room.leave',
  ROOM_LEFT: 'room.left',

  TYPING_START: 'typing.start',
  TYPING_STOP: 'typing.stop',

  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGE_READ: 'message.read',

  CONVERSATION_UPDATED: 'conversation.updated',

  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',
} as const;

export type RealtimeEvent = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];
