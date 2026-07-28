export class RoomNameFactory {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static conversation(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  static community(communityId: string): string {
    return `community:${communityId}`;
  }

  static business(businessId: string): string {
    return `business:${businessId}`;
  }

  static organisation(organisationId: string): string {
    return `organisation:${organisationId}`;
  }

  static event(eventId: string): string {
    return `event:${eventId}`;
  }
}
