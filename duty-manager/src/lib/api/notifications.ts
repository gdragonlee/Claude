import type { Notification } from '../types';
import { generateId, getStore, setStore } from './client';

const NOTIFICATIONS_KEY = 'duty_notifications';

export async function getNotifications(userId: string): Promise<Notification[]> {
  const notifications = getStore<Notification>(NOTIFICATIONS_KEY);
  return notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const notifications = getStore<Notification>(NOTIFICATIONS_KEY);
  return notifications.filter((n) => n.userId === userId && !n.isRead).length;
}

export async function markAsRead(id: string): Promise<void> {
  const notifications = getStore<Notification>(NOTIFICATIONS_KEY);
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifications[idx].isRead = true;
    setStore(NOTIFICATIONS_KEY, notifications);
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  const notifications = getStore<Notification>(NOTIFICATIONS_KEY);
  notifications.forEach((n) => {
    if (n.userId === userId) n.isRead = true;
  });
  setStore(NOTIFICATIONS_KEY, notifications);
}

export async function createNotification(data: {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  relatedId?: string;
}): Promise<Notification> {
  const notifications = getStore<Notification>(NOTIFICATIONS_KEY);
  const notification: Notification = {
    id: generateId(),
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    isRead: false,
    relatedId: data.relatedId || null,
    createdAt: new Date().toISOString(),
  };
  notifications.push(notification);
  setStore(NOTIFICATIONS_KEY, notifications);
  return notification;
}
