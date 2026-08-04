'use client';

import { useState } from 'react';

import { createSecurityReport } from '@neighbour/api-client';

import { NeighbourButton, NeighbourCard } from '@neighbour/design-system';

export default function CreateReportForm() {
  const [targetType, setTargetType] = useState('POST');

  const [targetId, setTargetId] = useState('');

  const [reason, setReason] = useState('');

  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');

  async function submit() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setMessage('No active session.');

      return;
    }

    try {
      await createSecurityReport(
        token,

        {
          targetType,

          targetId,

          reason,

          description,
        },
      );

      setMessage('Report submitted successfully.');

      setTargetId('');
      setReason('');
      setDescription('');
    } catch {
      setMessage('Unable to submit report.');
    }
  }

  return (
    <NeighbourCard
      style={{
        marginTop: '24px',
      }}
    >
      <h2>Create Safety Report</h2>

      <select
        value={targetType}

        onChange={(e) => setTargetType(e.target.value)}

        style={{
          padding: '12px',
          borderRadius: '12px',
          marginTop: '16px',
        }}
      >
        <option value="POST">Post</option>

        <option value="USER">User</option>

        <option value="COMMENT">Comment</option>

        <option value="MESSAGE">Message</option>

        <option value="EVENT">Event</option>
      </select>

      <input
        placeholder="Target ID"

        value={targetId}

        onChange={(e) => setTargetId(e.target.value)}

        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          marginTop: '16px',
          border: '1px solid #ddd',
        }}
      />

      <input
        placeholder="Reason"

        value={reason}

        onChange={(e) => setReason(e.target.value)}

        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          marginTop: '16px',
          border: '1px solid #ddd',
        }}
      />

      <textarea
        placeholder="Description"

        value={description}

        onChange={(e) => setDescription(e.target.value)}

        style={{
          display: 'block',
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          marginTop: '16px',
          minHeight: '120px',
          border: '1px solid #ddd',
        }}
      />

      <div
        style={{
          marginTop: '20px',
        }}
      >
        <NeighbourButton onClick={submit}>Submit Report</NeighbourButton>
      </div>

      {message && (
        <p
          style={{
            marginTop: '16px',
          }}
        >
          {message}
        </p>
      )}
    </NeighbourCard>
  );
}
