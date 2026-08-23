'use client';

import {
  createMarketplaceListing,
  type MarketplaceListingCategory,
  type MarketplaceListingCondition,
  type MarketplaceListingStatus,
} from '@neighbour/api-client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import MediaPicker from '../../../components/media/MediaPicker';
import {
  CATEGORIES,
  CONDITIONS,
  label,
} from '../../../components/marketplace/marketplace-ui';
import {
  uploadWebMedia,
  type WebPendingMedia,
} from '../../../lib/media/upload';

export default function CreateMarketplaceListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] =
    useState<MarketplaceListingCategory>('OTHER');
  const [condition, setCondition] =
    useState<MarketplaceListingCondition>('GOOD');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);

  const [collectionAvailable, setCollectionAvailable] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [postageAvailable, setPostageAvailable] = useState(false);
  const [localArea, setLocalArea] = useState('');
  const [postcodeDistrict, setPostcodeDistrict] = useState('');
  const [media, setMedia] = useState<WebPendingMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const pricePence = useMemo(() => {
    if (isFree) return undefined;

    const parsed = Number.parseFloat(price.trim());

    return Number.isFinite(parsed) && parsed >= 0
      ? Math.round(parsed * 100)
      : undefined;
  }, [isFree, price]);

  async function submit(status: MarketplaceListingStatus) {
    if (busy) return;

    if (title.trim().length < 3) {
      setError('Add a clear listing title.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Add a fuller item description.');
      return;
    }

    if (!isFree && pricePence === undefined) {
      setError('Enter a valid price or mark the item as free.');
      return;
    }

    if (
      !collectionAvailable &&
      !deliveryAvailable &&
      !postageAvailable
    ) {
      setError('Select at least one way for the buyer to receive the item.');
      return;
    }

    setBusy(true);
    setError('');
    setProgress(0);

    try {
      const uploaded = [];

      for (let index = 0; index < media.length; index += 1) {
        const result = await uploadWebMedia(
          media[index],
          (fileProgress) => {
            setProgress(
              (index + fileProgress) / Math.max(1, media.length),
            );
          },
        );

        uploaded.push(result);
      }

      const listing = await createMarketplaceListing({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        status,
        isFree,
        acceptsOffers: false,
        collectionAvailable,
        deliveryAvailable,
        postageAvailable,
        ...(pricePence !== undefined ? { pricePence } : {}),
        ...(localArea.trim()
          ? { localArea: localArea.trim() }
          : {}),
        ...(postcodeDistrict.trim()
          ? {
              postcodeDistrict:
                postcodeDistrict.trim().toUpperCase(),
            }
          : {}),
        ...(uploaded.length
          ? { mediaIds: uploaded.map((item) => item.id) }
          : {}),
      });

      media.forEach((item) =>
        URL.revokeObjectURL(item.previewUrl),
      );

      router.replace(`/marketplace/${listing.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The listing could not be saved.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <button
        type="button"
        disabled={busy}
        onClick={() => router.back()}
        style={back}
      >
        ← Marketplace
      </button>

      <div style={{ marginTop: 22 }}>
        <div style={eyebrow}>Neighbour Marketplace™</div>
        <h1 style={heading}>Create a listing</h1>
        <p style={subheading}>
          Sell or give something to people nearby.
        </p>
      </div>

      <section style={card}>
        <MediaPicker
          disabled={busy}
          items={media}
          onChange={(items) => {
            setMedia(items);
            setError('');
          }}
        />

        <Field label="Listing title">
          <input
            maxLength={120}
            disabled={busy}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you selling?"
            style={input}
          />
        </Field>

        <Field label="Description">
          <textarea
            maxLength={5000}
            disabled={busy}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, age, size and anything a neighbour should know."
            style={{ ...input, minHeight: 150, paddingTop: 13 }}
          />
        </Field>

        <div style={twoColumn}>
          <Field label="Category">
            <select
              disabled={busy}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as MarketplaceListingCategory)
              }
              style={input}
            >
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Condition">
            <select
              disabled={busy}
              value={condition}
              onChange={(e) =>
                setCondition(
                  e.target.value as MarketplaceListingCondition,
                )
              }
              style={input}
            >
              {CONDITIONS.map((value) => (
                <option key={value} value={value}>
                  {label(value)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label style={check}>
          <input
            type="checkbox"
            checked={isFree}
            disabled={busy}
            onChange={(e) => setIsFree(e.target.checked)}
          />
          Give this away for free
        </label>

        {!isFree ? (
          <Field label="Price">
            <div style={{ position: 'relative' }}>
              <span style={currency}>£</span>
              <input
                inputMode="decimal"
                disabled={busy}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                style={{ ...input, paddingLeft: 34 }}
              />
            </div>
          </Field>
        ) : null}

        

        <h3 style={{ marginTop: 28 }}>How can buyers receive it?</h3>

        <label style={check}>
          <input
            type="checkbox"
            checked={collectionAvailable}
            onChange={(e) =>
              setCollectionAvailable(e.target.checked)
            }
          />
          Collection
        </label>

        <label style={check}>
          <input
            type="checkbox"
            checked={deliveryAvailable}
            onChange={(e) =>
              setDeliveryAvailable(e.target.checked)
            }
          />
          Local delivery
        </label>

        <label style={check}>
          <input
            type="checkbox"
            checked={postageAvailable}
            onChange={(e) =>
              setPostageAvailable(e.target.checked)
            }
          />
          Postage
        </label>

        <div style={twoColumn}>
          <Field label="Local area">
            <input
              value={localArea}
              onChange={(e) => setLocalArea(e.target.value)}
              placeholder="e.g. Blackley"
              style={input}
            />
          </Field>

          <Field label="Postcode district">
            <input
              value={postcodeDistrict}
              onChange={(e) =>
                setPostcodeDistrict(e.target.value)
              }
              placeholder="e.g. M9"
              style={input}
            />
          </Field>
        </div>

        {busy && media.length ? (
          <div style={progressBox}>
            Uploading photos — {Math.round(progress * 100)}%
          </div>
        ) : null}

        {error ? <p style={errorStyle}>{error}</p> : null}

        <div style={actions}>
          <button
            disabled={busy}
            type="button"
            onClick={() => void submit('DRAFT')}
            style={secondary}
          >
            Save draft
          </button>

          <button
            disabled={busy}
            type="button"
            onClick={() => void submit('PUBLISHED')}
            style={primary}
          >
            {busy ? 'Saving…' : 'Publish listing'}
          </button>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'block', marginTop: 20 }}>
      <strong style={{ display: 'block', marginBottom: 7 }}>
        {label}
      </strong>
      {children}
    </label>
  );
}

const shell: React.CSSProperties = {
  maxWidth: 880,
  margin: '0 auto',
  padding: '38px 40px 90px',
};

const back: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: '#08714a',
  cursor: 'pointer',
  fontWeight: 800,
};

const eyebrow: React.CSSProperties = {
  color: '#08714a',
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
};

const heading: React.CSSProperties = {
  margin: '7px 0 0',
  fontSize: 44,
};

const subheading: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#697a70',
};

const card: React.CSSProperties = {
  marginTop: 24,
  padding: 26,
  border: '1px solid #dfe8e2',
  borderRadius: 24,
  background: '#fff',
};

const input: React.CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 46,
  border: '1px solid #d9e5de',
  borderRadius: 12,
  padding: '0 13px',
  background: '#fbfcfb',
  color: '#10251b',
  font: 'inherit',
};

const twoColumn: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
  gap: 14,
};

const check: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  marginTop: 15,
  fontWeight: 650,
};

const currency: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: 12,
  fontWeight: 800,
};

const progressBox: React.CSSProperties = {
  marginTop: 20,
  padding: 13,
  borderRadius: 12,
  background: '#eef7f2',
  color: '#08714a',
  fontWeight: 750,
};

const errorStyle: React.CSSProperties = {
  marginTop: 17,
  color: '#aa322d',
};

const actions: React.CSSProperties = {
  marginTop: 26,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
};

const primary: React.CSSProperties = {
  padding: '12px 20px',
  border: 0,
  borderRadius: 999,
  background: '#08714a',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 850,
};

const secondary: React.CSSProperties = {
  ...primary,
  border: '1px solid #ceded4',
  background: '#fff',
  color: '#315143',
};
