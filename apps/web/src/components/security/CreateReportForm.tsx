'use client';

import {
  useState,
} from 'react';

import {
  createSecurityReport,
} from '@neighbour/api-client';

export default function CreateReportForm() {
  const [
    targetType,
    setTargetType,
  ] = useState('POST');

  const [targetId, setTargetId] =
    useState('');

  const [reason, setReason] =
    useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [message, setMessage] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  async function submit() {
    const token =
      localStorage.getItem(
        'accessToken',
      );

    if (!token) {
      setMessage(
        'No active session.',
      );

      return;
    }

    if (
      !targetId.trim() ||
      !reason.trim() ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      await createSecurityReport(
        token,
        {
          targetType,
          targetId:
            targetId.trim(),
          reason:
            reason.trim(),
          description:
            description.trim(),
        },
      );

      setMessage(
        'Report submitted successfully.',
      );

      setTargetId('');
      setReason('');
      setDescription('');
    } catch {
      setMessage(
        'Unable to submit report.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="direct-report">
      <div className="direct-report-heading">
        <span>ADVANCED REPORT</span>

        <h2>
          Report specific content
        </h2>

        <p>
          Most content can be reported directly
          from its Report button. Use this form
          when you already have the exact target
          reference.
        </p>
      </div>

      <div className="direct-report-grid">
        <label>
          <span>Content type</span>

          <select
            value={targetType}
            onChange={(event) =>
              setTargetType(
                event.target.value,
              )
            }
          >
            <option value="POST">
              Post
            </option>

            <option value="USER">
              User
            </option>

            <option value="COMMENT">
              Comment
            </option>

            <option value="MESSAGE">
              Message
            </option>

            <option value="EVENT">
              Event
            </option>
          </select>
        </label>

        <label>
          <span>Target reference</span>

          <input
            value={targetId}
            onChange={(event) =>
              setTargetId(
                event.target.value,
              )
            }
            placeholder="Exact target ID"
          />
        </label>
      </div>

      <label className="direct-report-field">
        <span>Reason</span>

        <input
          value={reason}
          onChange={(event) =>
            setReason(
              event.target.value,
            )
          }
          placeholder="Why are you reporting this?"
        />
      </label>

      <label className="direct-report-field">
        <span>
          Additional details
        </span>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value,
            )
          }
          placeholder="Add any useful context"
        />
      </label>

      <div className="direct-report-footer">
        <span>
          Reports are submitted to the
          Neighbour™ Trust & Safety system.
        </span>

        <button
          type="button"
          disabled={
            busy ||
            !targetId.trim() ||
            !reason.trim()
          }
          onClick={() =>
            void submit()
          }
        >
          {busy
            ? 'Submitting…'
            : 'Submit report'}
        </button>
      </div>

      {message ? (
        <div
          className="direct-report-message"
          role="status"
        >
          {message}
        </div>
      ) : null}

      <style>{`
        .direct-report {
          padding: 20px;
          border: 1px solid #e1e7e3;
          border-radius: 17px;
          background: #fff;
        }

        .direct-report-heading > span {
          color: #0a6945;
          font-size: 8px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .direct-report-heading h2 {
          margin: 6px 0 0;
          color: #102019;
          font-size: 18px;
        }

        .direct-report-heading p {
          margin: 5px 0 0;
          max-width: 680px;
          color: #7b8881;
          font-size: 9px;
          line-height: 1.5;
        }

        .direct-report-grid {
          display: grid;
          grid-template-columns:
            190px minmax(0,1fr);
          gap: 10px;
          margin-top: 17px;
        }

        .direct-report label {
          display: grid;
          gap: 6px;
        }

        .direct-report label > span {
          color: #405249;
          font-size: 9px;
          font-weight: 800;
        }

        .direct-report input,
        .direct-report select,
        .direct-report textarea {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #dce4df;
          border-radius: 11px;
          background: #fbfcfb;
          font: inherit;
          font-size: 10px;
        }

        .direct-report input,
        .direct-report select {
          min-height: 42px;
          padding: 0 11px;
        }

        .direct-report-field {
          margin-top: 11px;
        }

        .direct-report textarea {
          min-height: 110px;
          padding: 11px;
          resize: vertical;
        }

        .direct-report-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 13px;
        }

        .direct-report-footer > span {
          color: #8a9690;
          font-size: 8px;
        }

        .direct-report-footer button {
          padding: 10px 13px;
          border: 0;
          border-radius: 10px;
          background: #086240;
          color: #fff;
          font: inherit;
          font-size: 9px;
          font-weight: 800;
          cursor: pointer;
        }

        .direct-report-footer button:disabled {
          opacity: .45;
          cursor: default;
        }

        .direct-report-message {
          margin-top: 11px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #f2f6f4;
          color: #566a60;
          font-size: 9px;
        }

        @media (max-width: 700px) {
          .direct-report-grid {
            grid-template-columns: 1fr;
          }

          .direct-report-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
