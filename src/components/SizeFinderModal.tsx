'use client';

import { useState } from 'react';
import { RING_SIZES, type RingSizeRow } from '@/data/catalog';

interface SizeFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSize: (size: RingSizeRow) => void;
}

export function SizeFinderModal({ isOpen, onClose, onSaveSize }: SizeFinderModalProps) {
  const [mode, setMode] = useState<'diameter' | 'circumference'>('diameter');
  const [rawValue, setRawValue] = useState<number>(17.3);

  if (!isOpen) return null;

  const findClosest = (val: number, currentMode: 'diameter' | 'circumference'): RingSizeRow => {
    const key = currentMode === 'diameter' ? 'diameterMm' : 'circumferenceMm';
    let best = RING_SIZES[0];
    let bestDiff = Infinity;
    for (const s of RING_SIZES) {
      const diff = Math.abs(s[key] - val);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = s;
      }
    }
    return best;
  };

  const matched = findClosest(rawValue, mode);
  const norm = (matched.diameterMm - 15.7) / (21.4 - 15.7);
  const circlePx = Math.round(76 + norm * 58);

  const switchMode = (nextMode: 'diameter' | 'circumference') => {
    setMode(nextMode);
    setRawValue(nextMode === 'diameter' ? matched.diameterMm : matched.circumferenceMm);
  };

  const pickChartSize = (row: RingSizeRow) => {
    setRawValue(mode === 'diameter' ? row.diameterMm : row.circumferenceMm);
  };

  return (
    <div className="modal size-modal" role="dialog" aria-modal="true" aria-labelledby="sizeModalTitle">
      <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close size finder">
        ✕
      </button>

      <div className="size-modal-body">
        <span className="section-eyebrow">MADE FOR YOU</span>
        <h2 id="sizeModalTitle">30-Second Ring Size Finder</h2>
        <p className="modal-lead">
          Measure the inside width of a ring you already love—or wrap a paper strip around your finger—and drag the
          slider to match your ZEVORA stainless steel ring fit.
        </p>

        <div className="size-mode-tabs">
          <button
            type="button"
            className={`size-mode-btn ${mode === 'diameter' ? 'active' : ''}`}
            onClick={() => switchMode('diameter')}
          >
            Inside Diameter (Existing Ring)
          </button>
          <button
            type="button"
            className={`size-mode-btn ${mode === 'circumference' ? 'active' : ''}`}
            onClick={() => switchMode('circumference')}
          >
            Finger Circumference (Paper Strip)
          </button>
        </div>

        <div className="size-interactive-box">
          <div className="ring-visual-preview">
            <div className="ring-circle-stage">
              <div className="ring-circle-outline" style={{ width: `${circlePx}px`, height: `${circlePx}px` }}>
                <span>{matched.diameterMm} mm</span>
              </div>
            </div>
            <span className="ring-visual-caption">
              {mode === 'diameter'
                ? 'Match against the inside width of a ring you wear comfortably'
                : 'Measured circumference around the base of your finger'}
            </span>
          </div>

          <div className="size-result-panel">
            <span className="result-kicker">Your Recommended ZEVORA Fit</span>
            <div className="result-size-readout">
              <strong>{matched.us}</strong>
              <span>
                {matched.eu} · {matched.diameterMm} mm Ø
              </span>
            </div>

            <label className="slider-label" htmlFor="sizeSliderNext">
              <span>{mode === 'diameter' ? 'Inside Diameter:' : 'Finger Circumference:'}</span>
              <strong>{rawValue.toFixed(1)} mm</strong>
            </label>
            <input
              id="sizeSliderNext"
              type="range"
              className="size-slider"
              min={mode === 'diameter' ? 15.7 : 49.3}
              max={mode === 'diameter' ? 21.4 : 67.2}
              step={mode === 'diameter' ? 0.1 : 0.2}
              value={rawValue}
              onChange={(e) => setRawValue(Number(e.target.value))}
            />
            <div className="slider-ticks">
              <span>{mode === 'diameter' ? '15.7 mm (US 5)' : '49.3 mm (US 5)'}</span>
              <span>{mode === 'diameter' ? '21.4 mm (US 12)' : '67.2 mm (US 12)'}</span>
            </div>

            <div className="size-tips-box">
              <strong>Stylist Tip:</strong> Between two sizes? Choose the larger size for wider bands (like our Art
              Deco or Signet rings), and measure in the evening when fingers are warm.
            </div>

            <button type="button" className="btn btn-gold btn-full" onClick={() => onSaveSize(matched)}>
              Save {matched.us} ({matched.eu}) Across Storefront
            </button>
          </div>
        </div>

        <div className="size-chart-wrap">
          <h4>Quick Conversion Chart</h4>
          <div className="size-chart-grid">
            {RING_SIZES.map((s) => (
              <button
                key={s.us}
                type="button"
                className={`size-chart-pill ${matched.us === s.us ? 'active' : ''}`}
                onClick={() => pickChartSize(s)}
              >
                <strong>{s.us}</strong>
                <span>
                  {s.eu} · {s.diameterMm}mm
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
