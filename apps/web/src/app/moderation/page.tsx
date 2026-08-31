'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import {
  getModerationReports,
  updateModerationReport,
  type ModerationReport,
} from '@neighbour/api-client';

import { NeighbourBadge, NeighbourButton, NeighbourCard } from '@neighbour/design-system';

import ModerationStats from '../../components/moderation/ModerationStats';

export default function ModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [status, setStatus] = useState('');

  const [targetType, setTargetType] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return;
    }

    try {
      const result = await getModerationReports(token, {
        status: status || undefined,
        targetType: targetType || undefined,
        search: search || undefined,
      });

      setReports(result);
    } catch {
      setReports([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [status, targetType, search]);

  async function update(id: string, value: string) {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      return;
    }

    await updateModerationReport(token, id, {
      status: value,
      notes: 'Reviewed from Safety Centre',
    });

    await load();
  }

  if (loading) {
    return <main style={{ padding: '40px' }}>Loading Safety Centre...</main>;
  }

  return (
    <main
      style={{
        padding: '40px',
        maxWidth: '1000px',
        margin: 'auto',
      }}
    >
      <h1>🛡️ Neighbour™ Safety Centre</h1>

      <NeighbourCard>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 6px' }}>Business Verification</h2>
            <p style={{ margin: 0 }}>
              Review and manage business verification requests.
            </p>
          </div>

          <Link href="/moderation/business-verifications">
            <NeighbourButton>Open Verification Centre</NeighbourButton>
          </Link>
        </div>
      </NeighbourCard>

      <ModerationStats token={localStorage.getItem('accessToken') ?? ''} />

      <NeighbourCard>
        <h2>Report Filters</h2>

        <input
          placeholder="Search reports..."

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid #ddd',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <select
            value={status}

            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>

            <option value="PENDING">Pending</option>

            <option value="UNDER_REVIEW">Under Review</option>

            <option value="RESOLVED">Resolved</option>

            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={targetType}

            onChange={(e) => setTargetType(e.target.value)}
          >
            <option value="">All Types</option>

            <option value="POST">Post</option>

            <option value="COMMENT">Comment</option>

            <option value="MESSAGE">Message</option>

            <option value="EVENT">Event</option>

            <option value="USER">User</option>
          </select>
        </div>
      </NeighbourCard>

      {reports.length === 0 ? (
        <NeighbourCard
          style={{
            marginTop: '20px',
          }}
        >
          <h2>No reports found</h2>
        </NeighbourCard>
      ) : (
        reports.map((report) => (
          <NeighbourCard
            key={report.id}
            style={{
              marginTop: '20px',
            }}
          >
            <h2>🚩 {report.targetType}</h2>

            <NeighbourBadge>{report.status}</NeighbourBadge>

            <p>Reason: {report.reason}</p>

            <p>Reporter: {report.reporter?.displayName ?? 'Unknown'}</p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '20px',
                flexWrap: 'wrap',
              }}
            >
              <Link href={`/moderation/${report.id}`}>
                <NeighbourButton>Review Case</NeighbourButton>
              </Link>

              <NeighbourButton onClick={() => update(report.id, 'RESOLVED')}>
                Resolve
              </NeighbourButton>

              <NeighbourButton variant="secondary" onClick={() => update(report.id, 'DISMISSED')}>
                Dismiss
              </NeighbourButton>
            </div>
          </NeighbourCard>
        ))
      )}
    </main>
  );
}
