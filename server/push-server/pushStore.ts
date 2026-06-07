import type { PushSubscription } from "web-push";

export type UserRole = "bereaved" | "home" | "vendor";

export interface StoredPushSubscription {
  userId: string;
  role: UserRole;
  endpoint: string;
  subscription: PushSubscription;
  createdAt: string;
}

const subscriptions = new Map<string, StoredPushSubscription>();

export const pushStore = {
  save(input: { userId: string; role: UserRole; subscription: PushSubscription }) {
    subscriptions.set(input.subscription.endpoint, {
      userId: input.userId,
      role: input.role,
      endpoint: input.subscription.endpoint,
      subscription: input.subscription,
      createdAt: new Date().toISOString(),
    });
  },

  removeByEndpoint(endpoint?: string) {
    if (endpoint) subscriptions.delete(endpoint);
  },

  findByUserId(userId: string) {
    return Array.from(subscriptions.values()).filter((item) => item.userId === userId);
  },

  findByRole(role: UserRole) {
    return Array.from(subscriptions.values()).filter((item) => item.role === role);
  },

  all() {
    return Array.from(subscriptions.values());
  },
};
