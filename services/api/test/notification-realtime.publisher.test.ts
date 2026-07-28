import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { NotificationRealtimePublisher } from '../src/notification/events/notification-realtime.publisher';
import { RealtimeEvents } from '../src/realtime/constants/realtime-events.constant';

interface Emission {
  userId: string;
  event: string;
  payload: unknown;
}

function createHarness() {
  const emissions: Emission[] = [];

  const realtime = {
    emitToUser: (userId: string, event: string, payload: unknown): void => {
      emissions.push({
        userId,
        event,
        payload,
      });
    },
  };

  return {
    publisher: new NotificationRealtimePublisher(realtime as never),
    emissions,
  };
}

describe('NotificationRealtimePublisher', () => {
  it('publishes a created notification to the recipient room', () => {
    const { publisher, emissions } = createHarness();

    const notification = {
      id: 'notification-1',
      type: 'COMMENT',
      actor: null,
      postId: 'post-1',
      commentId: 'comment-1',
      communityId: null,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    publisher.notificationCreated('recipient-1', notification as never);

    assert.equal(emissions.length, 1);
    assert.equal(emissions[0]?.userId, 'recipient-1');
    assert.equal(emissions[0]?.event, RealtimeEvents.NOTIFICATION_CREATED);

    const envelope = emissions[0]?.payload as {
      event: string;
      occurredAt: string;
      data: unknown;
    };

    assert.equal(envelope.event, RealtimeEvents.NOTIFICATION_CREATED);
    assert.equal(Number.isNaN(Date.parse(envelope.occurredAt)), false);
    assert.strictEqual(envelope.data, notification);
  });

  it('publishes a single-notification read event', () => {
    const { publisher, emissions } = createHarness();

    publisher.notificationRead({
      notificationId: 'notification-2',
      recipientId: 'recipient-2',
      readAt: new Date().toISOString(),
      updatedCount: 1,
      all: false,
    });

    assert.equal(emissions.length, 1);
    assert.equal(emissions[0]?.userId, 'recipient-2');
    assert.equal(emissions[0]?.event, RealtimeEvents.NOTIFICATION_READ);

    const envelope = emissions[0]?.payload as {
      event: string;
      data: {
        notificationId: string;
        updatedCount: number;
        all: boolean;
      };
    };

    assert.equal(envelope.event, RealtimeEvents.NOTIFICATION_READ);
    assert.equal(envelope.data.notificationId, 'notification-2');
    assert.equal(envelope.data.updatedCount, 1);
    assert.equal(envelope.data.all, false);
  });

  it('publishes a mark-all-read summary', () => {
    const { publisher, emissions } = createHarness();

    publisher.notificationRead({
      notificationId: null,
      recipientId: 'recipient-3',
      readAt: new Date().toISOString(),
      updatedCount: 7,
      all: true,
    });

    const envelope = emissions[0]?.payload as {
      data: {
        notificationId: null;
        updatedCount: number;
        all: boolean;
      };
    };

    assert.equal(envelope.data.notificationId, null);
    assert.equal(envelope.data.updatedCount, 7);
    assert.equal(envelope.data.all, true);
  });

  it('uses one deterministic private-user delivery', () => {
    const { publisher, emissions } = createHarness();

    publisher.notificationCreated('recipient-4', {
      id: 'notification-4',
    } as never);

    assert.deepEqual(
      emissions.map((emission) => [emission.userId, emission.event]),
      [['recipient-4', RealtimeEvents.NOTIFICATION_CREATED]],
    );
  });
});
