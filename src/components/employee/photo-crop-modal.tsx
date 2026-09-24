"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { CheckIcon, CloseIcon } from "@/components/ui/icons";

// 4:5-Hochformat - passt zur Team-Karte (src/components/site/team-person-card.tsx,
// dort ebenfalls aspect-[4/5]), damit das Ergebnis hier exakt dem entspricht,
// was später auf der Website zu sehen ist.
const FRAME_W = 320;
const FRAME_H = 400;
const OUTPUT_W = 800;
const OUTPUT_H = 1000;

export function PhotoCropModal({
  file,
  onCancel,
  onCropped,
}: {
  file: File;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}) {
  // Lazy-initialisiert statt in einem Effect gesetzt - der Modal wird pro
  // Datei frisch gemountet (siehe collection-manager.tsx: `{cropTarget ? ... :
  // null}`), ein Objekt-URL pro Mount reicht deshalb.
  const [imgUrl] = useState(() => URL.createObjectURL(file));
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // "Cover"-Skalierung: das Bild deckt den Rahmen komplett ab, ohne Lücken -
      // Ausgangspunkt, von dem aus der Nutzer weiter reinzoomen kann.
      const cover = Math.max(FRAME_W / img.width, FRAME_H / img.height);
      setNaturalSize({ w: img.width, h: img.height });
      setMinScale(cover);
      setScale(cover);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imgUrl;
    return () => URL.revokeObjectURL(imgUrl);
  }, [imgUrl]);

  function clampOffset(next: { x: number; y: number }, atScale: number, size: { w: number; h: number }) {
    const w = size.w * atScale;
    const h = size.h * atScale;
    const maxX = Math.max(0, (w - FRAME_W) / 2);
    const maxY = Math.max(0, (h - FRAME_H) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, next.x)), y: Math.min(maxY, Math.max(-maxY, next.y)) };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, startOffset: offset };
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current || !naturalSize) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setOffset(clampOffset({ x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy }, scale, naturalSize));
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleScaleChange(next: number) {
    if (!naturalSize) return;
    setScale(next);
    setOffset((prev) => clampOffset(prev, next, naturalSize));
  }

  function handleConfirm() {
    if (!imgUrl || !naturalSize) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_W;
      canvas.height = OUTPUT_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const outputScale = OUTPUT_W / FRAME_W;
      const drawW = naturalSize.w * scale * outputScale;
      const drawH = naturalSize.h * scale * outputScale;
      const drawX = OUTPUT_W / 2 - drawW / 2 + offset.x * outputScale;
      const drawY = OUTPUT_H / 2 - drawH / 2 + offset.y * outputScale;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      canvas.toBlob(
        (blob) => {
          if (blob) onCropped(blob);
        },
        "image/jpeg",
        0.9,
      );
    };
    img.src = imgUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy-900">Foto zuschneiden</h3>
          <button type="button" onClick={onCancel} className="text-navy-700/60 hover:text-navy-900">
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-xl bg-navy-900/5"
          style={{ width: FRAME_W, height: FRAME_H }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {imgUrl && naturalSize ? (
            // eslint-disable-next-line @next/next/no-img-element -- freshly picked local file (object URL), not a static site asset
            <img
              src={imgUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
              style={{
                width: naturalSize.w * scale,
                height: naturalSize.h * scale,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
          ) : null}
        </div>

        {naturalSize ? (
          <input
            type="range"
            min={minScale}
            max={minScale * 3}
            step={minScale / 100}
            value={scale}
            onChange={(event) => handleScaleChange(Number(event.target.value))}
            className="mt-4 w-full"
          />
        ) : null}
        <p className="mt-1 text-center text-xs text-navy-700/50">Ziehen zum Verschieben, Regler zum Zoomen</p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold text-navy-700 hover:bg-navy-900/5"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!naturalSize}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-amber-400 disabled:opacity-60"
          >
            <CheckIcon className="h-4 w-4" />
            Übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}
