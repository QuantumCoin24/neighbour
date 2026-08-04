'use client';

import { useEffect, useState } from 'react';

import { getMySecurityReports, type SecurityReport } from '@neighbour/api-client';

import { NeighbourBadge, NeighbourButton, NeighbourCard } from '@neighbour/design-system';

import PageContainer from '../../components/layout/PageContainer';
import CreateReportForm from '../../components/security/CreateReportForm';

export default function SecurityPage() {
  const [reports, setReports] = useState<SecurityReport[]>([]);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        return;
      }

      try {
        const response = await getMySecurityReports(token);

        setReports(response);
      } catch {
        setReports([]);
      }
    }

    load();
  }, []);

  return (
    <PageContainer>
      <h1>🛡️ Trust & Safety</h1>

      <p>Help keep Neighbour™ safe for everyone.</p>

      <CreateReportForm />

      <NeighbourCard
        style={{
          marginTop: '24px',
        }}
      >
        <h2>Your Reports</h2>

        {reports.length === 0 ? (
          <p>No reports submitted.</p>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              style={{
                marginTop: '16px',
              }}
            >
              <NeighbourBadge>{report.status}</NeighbourBadge>

              <p>{report.reason}</p>
            </div>
          ))
        )}
      </NeighbourCard>
    </PageContainer>
  );
}
