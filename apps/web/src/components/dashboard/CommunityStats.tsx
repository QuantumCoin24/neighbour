'use client';

interface Props {
  communityName: string | null;
  memberCount: number | null;
}

export default function CommunityStats({ communityName, memberCount }: Props) {
  const count = memberCount ?? 0;

  const activityLabel = count > 50 ? 'Active network' : 'Growing network';

  return (
    <section className="snapshot-card">
      <div className="snapshot-kicker">COMMUNITY SNAPSHOT</div>

      <h2>{communityName ?? 'Your community'}</h2>

      <p>Your local connection at a glance.</p>

      <div className="snapshot-stats">
        <div>
          <strong>{count}</strong>
          <span>Neighbours</span>
        </div>

        <div>
          <strong>{count > 0 ? 'Live' : 'New'}</strong>
          <span>{activityLabel}</span>
        </div>
      </div>

      <div className="snapshot-status">
        <span />
        Connected local hub
      </div>

      <style>{`
        .snapshot-card {
          padding: 20px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 20px;
          background:
            linear-gradient(
              145deg,
              #ffffff,
              #f7faf8
            );
          box-shadow:
            0 12px 34px
            rgba(19,45,34,.04);
        }

        .snapshot-kicker {
          color: #8c9892;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .13em;
        }

        .snapshot-card h2 {
          margin: 8px 0 0;
          color: #102019;
          font-size: 18px;
          letter-spacing: -.02em;
        }

        .snapshot-card > p {
          margin: 6px 0 0;
          color: #7a8781;
          font-size: 11px;
        }

        .snapshot-stats {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0,1fr));
          gap: 8px;
          margin-top: 17px;
        }

        .snapshot-stats > div {
          padding: 12px;
          border-radius: 13px;
          background: #fff;
          border: 1px solid #edf1ee;
        }

        .snapshot-stats strong {
          display: block;
          color: #0b6846;
          font-size: 17px;
        }

        .snapshot-stats span {
          display: block;
          margin-top: 3px;
          color: #85908b;
          font-size: 9px;
        }

        .snapshot-status {
          display: flex;
          gap: 7px;
          align-items: center;
          margin-top: 14px;
          color: #53655d;
          font-size: 10px;
          font-weight: 750;
        }

        .snapshot-status span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #21aa67;
          box-shadow:
            0 0 0 3px
            rgba(33,170,103,.1);
        }
      `}</style>
    </section>
  );
}
