'use client';
import { useState } from 'react';
import { X, Link, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMacroContext } from '../context/MacroContext';
import { useMealPlanContext } from '../context/MealPlanContext';
import { createShareableLink } from '../utils/shareUtils';
import { getDatesInRange } from '../utils/utils';

function filterMealsToRange(mealplan, start, end) {
  const dates = getDatesInRange(new Date(start + 'T12:00:00'), new Date(end + 'T12:00:00'))
    .map((d) => d.toISOString().slice(0, 10));
  const filtered = {};
  for (const date of dates) {
    if (mealplan[date]) filtered[date] = mealplan[date];
  }
  return filtered;
}

export default function SharePlanModal({ startDate, endDate, onClose }) {
  const { user } = useAuth();
  const { effectiveMacroProfile } = useMacroContext();
  const { mealplan, slots, nutritionMap } = useMealPlanContext();

  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd]     = useState(endDate);
  const [title, setTitle]           = useState('');
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl]     = useState('');
  const [copied, setCopied]         = useState(false);
  const [error, setError]           = useState('');

  async function handleGenerate() {
    setError('');
    setGenerating(true);
    try {
      const meals = filterMealsToRange(mealplan, rangeStart, rangeEnd);
      const shareId = await createShareableLink({
        meals,
        macroProfile: effectiveMacroProfile ?? null,
        slots,
        nutritionMap,
        dateRange: { start: rangeStart, end: rangeEnd },
        title: title.trim() || null,
        ownerDisplayName: user?.displayName ?? null,
        ownerId: user?.uid ?? null,
      });
      setShareUrl(`${window.location.origin}/plan/${shareId}`);
    } catch {
      setError('Failed to generate link. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal__header">
          <h2><Link size={16} strokeWidth={1.75} /> Share Meal Plan</h2>
          <button className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Close">
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="share-modal__body">
          {!shareUrl ? (
            <>
              <div className="share-modal__field">
                <label>Date range</label>
                <div className="share-modal__date-row">
                  <input
                    type="date"
                    value={rangeStart}
                    max={rangeEnd}
                    onChange={(e) => setRangeStart(e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={rangeEnd}
                    min={rangeStart}
                    onChange={(e) => setRangeEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="share-modal__field">
                <label>Plan title <span className="optional">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Week of Apr 28"
                  value={title}
                  maxLength={80}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {error && <p className="share-modal__error">{error}</p>}

              <button
                className="btn btn--primary share-modal__generate-btn"
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating…' : 'Generate Link'}
              </button>
            </>
          ) : (
            <>
              <p className="share-modal__success-label">Your shareable link is ready</p>
              <div className="share-modal__url-row">
                <input type="text" readOnly value={shareUrl} onClick={(e) => e.target.select()} />
                <button
                  className="btn btn--outline btn--icon"
                  onClick={handleCopy}
                  title="Copy link"
                >
                  {copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.75} />}
                </button>
              </div>
              <p className="share-modal__expiry">Link expires in 30 days. Anyone with the link can view the plan.</p>
              <button className="btn btn--ghost share-modal__new-link-btn" onClick={() => setShareUrl('')}>
                Generate another link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
