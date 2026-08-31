'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ApiClientError,
  getBusinessVerificationQueue,
  reviewBusinessVerification,
  type BusinessVerificationQueueItem,
} from '@neighbour/api-client';
import {
  NeighbourBadge,
  NeighbourButton,
  NeighbourCard,
} from '@neighbour/design-system';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

const filters: Array<{
  value: VerificationStatus;
  label: string;
}> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function BusinessVerificationCentrePage() {
  const [status, setStatus] = useState<VerificationStatus>('PENDING');
  const [items, setItems] = useState<BusinessVerificationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyBusinessId, setBusyBusinessId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    setForbidden(false);

    try {
      const result = await getBusinessVerificationQueue(status);
      setItems(result);
    } catch (error) {
      setItems([]);

      if (error instanceof ApiClientError && error.status === 403) {
        setForbidden(true);
        setMessage(
          'Your account does not have permission to review business verification requests.',
        );
      } else if (error instanceof ApiClientError && error.status === 401) {
        setMessage('Please sign in to access the Business Verification Centre.');
      } else {
        setMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load business verification requests.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(
    item: BusinessVerificationQueueItem,
    nextStatus: 'APPROVED' | 'REJECTED',
  ) {
    if (busyBusinessId) {
      return;
    }

    const reviewNotes = notes[item.businessId]?.trim() ?? '';

    if (nextStatus === 'REJECTED' && !reviewNotes) {
      setMessage(
        `Add a rejection reason before rejecting ${item.business.name}.`,
      );
      return;
    }

    setBusyBusinessId(item.businessId);
    setMessage('');

    try {
      await reviewBusinessVerification(item.businessId, {
        status: nextStatus,
        ...(reviewNotes ? { notes: reviewNotes } : {}),
      });

      setNotes((current) => ({
        ...current,
        [item.businessId]: '',
      }));

      setMessage(
        nextStatus === 'APPROVED'
          ? `${item.business.name} has been approved.`
          : `${item.business.name} has been rejected.`,
      );

      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Business verification review failed.',
      );
    } finally {
      setBusyBusinessId(null);
    }
  }

  return (
    <main
      style={{
        padding: '40px',
        maxWidth: '1100px',
        margin: 'auto',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '20px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              color: '#0a6945',
              fontSize: '10px',
              fontWeight: 850,
              letterSpacing: '.15em',
              marginBottom: '8px',
            }}
          >
            NEIGHBOUR™ TRUST & SAFETY
          </div>

          <h1 style={{ margin: 0 }}>✓ Business Verification Centre</h1>

          <p
            style={{
              margin: '8px 0 0',
              color: '#68766f',
              lineHeight: 1.5,
            }}
          >
            Review verification requests and manage trusted business status.
          </p>
        </div>

        <Link href="/moderation">← Safety Centre</Link>
      </header>

      <NeighbourCard>
        <h2 style={{ marginTop: 0 }}>Verification Queue</h2>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {filters.map((filter) => (
            <NeighbourButton
              key={filter.value}
              variant={status === filter.value ? 'primary' : 'ghost'}
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </NeighbourButton>
          ))}
        </div>
      </NeighbourCard>

      {message ? (
        <div
          role="status"
          style={{
            marginTop: '18px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#F7F9FC',
            color: '#102019',
          }}
        >
          {message}
        </div>
      ) : null}

      {loading ? (
        <NeighbourCard style={{ marginTop: '20px' }}>
          <h2>Loading verification requests…</h2>
        </NeighbourCard>
      ) : forbidden ? null : items.length === 0 ? (
        <NeighbourCard style={{ marginTop: '20px' }}>
          <h2>No {status.toLowerCase()} verification requests</h2>
          <p>The queue is currently clear.</p>
        </NeighbourCard>
      ) : (
        items.map((item) => {
          const busy = busyBusinessId === item.businessId;

          return (
            <NeighbourCard
              key={item.id}
              style={{
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '18px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#0a6945',
                      letterSpacing: '.08em',
                    }}
                  >
                    {item.business.category}
                  </div>

                  <h2
                    style={{
                      margin: '6px 0',
                    }}
                  >
                    {item.business.name}
                  </h2>

                  <NeighbourBadge>{item.status}</NeighbourBadge>
                </div>

                <div
                  style={{
                    textAlign: 'right',
                    fontSize: '13px',
                    color: '#68766f',
                  }}
                >
                  <div>
                    <strong>Submitted:</strong>{' '}
                    {formatDate(item.submittedAt)}
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <strong>Reviewed:</strong>{' '}
                    {formatDate(item.reviewedAt)}
                  </div>
                </div>
              </div>

              <p
                style={{
                  marginTop: '18px',
                  lineHeight: 1.6,
                }}
              >
                {item.business.description || 'Neighbour™ business profile.'}
              </p>

              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: '#F7F9FC',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                <div>
                  <strong>Business ID:</strong> {item.business.id}
                </div>
                <div>
                  <strong>Community ID:</strong> {item.business.communityId}
                </div>
                <div>
                  <strong>Owner ID:</strong> {item.business.ownerId}
                </div>
                <div>
                  <strong>Current trust state:</strong>{' '}
                  {item.business.verified ? 'Verified' : 'Not verified'}
                </div>
              </div>

              {item.notes ? (
                <div
                  style={{
                    marginTop: '16px',
                  }}
                >
                  <strong>Submission notes</strong>
                  <p
                    style={{
                      margin: '6px 0 0',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {item.notes}
                  </p>
                </div>
              ) : null}

              {item.status === 'PENDING' ? (
                <>
                  <label
                    htmlFor={`review-notes-${item.id}`}
                    style={{
                      display: 'block',
                      marginTop: '20px',
                      fontWeight: 700,
                    }}
                  >
                    Review notes
                  </label>

                  <textarea
                    id={`review-notes-${item.id}`}
                    value={notes[item.businessId] ?? ''}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [item.businessId]: event.target.value,
                      }))
                    }
                    placeholder="Optional for approval. Required for rejection."
                    rows={4}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #ddd',
                      resize: 'vertical',
                      font: 'inherit',
                    }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <NeighbourButton
                      onClick={() => void review(item, 'APPROVED')}
                    >
                      {busy ? 'Reviewing…' : 'Approve Business'}
                    </NeighbourButton>

                    <NeighbourButton
                      variant="secondary"
                      onClick={() => void review(item, 'REJECTED')}
                    >
                      {busy ? 'Reviewing…' : 'Reject Business'}
                    </NeighbourButton>
                  </div>
                </>
              ) : item.notes ? (
                <div
                  style={{
                    marginTop: '18px',
                  }}
                >
                  <strong>Review record:</strong> {item.notes}
                </div>
              ) : null}
            </NeighbourCard>
          );
        })
      )}
    </main>
  );
}
