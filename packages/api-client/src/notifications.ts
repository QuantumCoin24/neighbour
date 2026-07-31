import { apiRequest } from "./index";


export interface NotificationActor {
  id:string;
  displayName:string;
  username:string|null;
  avatarUrl:string|null;
}


export interface Notification {
  id:string;
  type:string;
  actor:NotificationActor|null;
  postId:string|null;
  commentId:string|null;
  communityId:string|null;
  readAt:string|null;
  createdAt:string;
  updatedAt:string;
}


export interface NotificationFeed {
  items:Notification[];
  nextCursor:string|null;
  unreadCount:number;
}


export function getNotifications(
  token:string,
){
  return apiRequest<NotificationFeed>(
    "/notifications",
    {
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}


export function getUnreadNotificationCount(
  token:string,
){
  return apiRequest<{
    unreadCount:number;
  }>(
    "/notifications/unread-count",
    {
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}


export function markNotificationRead(
  token:string,
  notificationId:string,
){
  return apiRequest<Notification>(
    `/notifications/${notificationId}/read`,
    {
      method:"PATCH",
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}


export function markAllNotificationsRead(
  token:string,
){
  return apiRequest<{
    updatedCount:number;
  }>(
    "/notifications/read-all",
    {
      method:"PATCH",
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}


export function dismissNotification(
  token:string,
  notificationId:string,
){
  return apiRequest<void>(
    `/notifications/${notificationId}`,
    {
      method:"DELETE",
      headers:{
        Authorization:`Bearer ${token}`,
      },
    },
  );
}
