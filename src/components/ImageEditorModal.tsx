import { useEffect, useRef, useState } from 'react';
import {
  Check,
  FlipHorizontal,
  RotateCcw,
  RotateCw,
  Sliders,
  Type,
  X,
  ZoomIn,
} from 'lucide-react';

type AspectPreset = '4:3' | '1:1' | '16:9' | 'original';

interface ImageEditorModalProps {
  isOpen: boolean;
  sourceUrl: string | null;
  filename?: string;
  onClose: () => void;
  onApply: (editedDataUrl: string, filename: string) => Promise<void> | void;
}

export function ImageEditorModal({
  isOpen,
  sourceUrl,
  filename = 'edited_product.jpg',
  onClose,
  onApply,
}: ImageEditorModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [aspect, setAspect] = useState<AspectPreset>('4:3');
  const [rotation, setRotation] = useState<number>(0);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturate, setSaturate] = useState<number>(100);
  const [stampText, setStampText] = useState<string>('');
  const [showStamp, setShowStamp] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );

  useEffect(() => {
    if (!isOpen || !sourceUrl) return;
    setLoadError(null);
    setRotation(0);
    setFlipX(false);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setShowStamp(false);
    setStampText('VLXD Huệ Hảo');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLoadedImg(img);
    img.onerror = () => setLoadError('Không thể tải ảnh vào trình chỉnh sửa.');
    img.src = sourceUrl;
  }, [isOpen, sourceUrl]);

  const getOutputSize = (img: HTMLImageElement, preset: AspectPreset) => {
    const isQuarterTurn = rotation % 180 !== 0;
    const natW = isQuarterTurn ? img.naturalHeight : img.naturalWidth;
    const natH = isQuarterTurn ? img.naturalWidth : img.naturalHeight;

    if (preset === '1:1') return { width: 900, height: 900 };
    if (preset === '16:9') return { width: 1200, height: 675 };
    if (preset === '4:3') return { width: 1000, height: 750 };

    const maxDim = 1100;
    const scale = Math.min(1, maxDim / Math.max(natW, natH));
    return {
      width: Math.max(320, Math.round(natW * scale)),
      height: Math.max(240, Math.round(natH * scale)),
    };
  };

  useEffect(() => {
    if (!isOpen || !loadedImg || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getOutputSize(loadedImg, aspect);
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

    const isQuarterTurn = rotation % 180 !== 0;
    const srcW = isQuarterTurn ? loadedImg.naturalHeight : loadedImg.naturalWidth;
    const srcH = isQuarterTurn ? loadedImg.naturalWidth : loadedImg.naturalHeight;

    // Cover-fit scale at zoom = 1
    const baseScale = Math.max(width / srcW, height / srcH) * zoom;

    ctx.translate(width / 2 + offsetX * (width * 0.4), height / 2 + offsetY * (height * 0.4));
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipX ? -baseScale : baseScale, baseScale);
    ctx.drawImage(
      loadedImg,
      -loadedImg.naturalWidth / 2,
      -loadedImg.naturalHeight / 2,
      loadedImg.naturalWidth,
      loadedImg.naturalHeight
    );
    ctx.restore();

    if (showStamp && stampText.trim()) {
      const label = stampText.trim().slice(0, 32);
      const fontSize = Math.max(18, Math.round(width * 0.028));
      ctx.save();
      ctx.font = `700 ${fontSize}px "Be Vietnam Pro", system-ui, sans-serif`;
      const metrics = ctx.measureText(label);
      const padX = Math.round(fontSize * 0.75);
      const padY = Math.round(fontSize * 0.45);
      const boxW = metrics.width + padX * 2;
      const boxH = fontSize + padY * 2;
      const margin = Math.round(width * 0.03);
      const x = width - boxW - margin;
      const y = height - boxH - margin;

      ctx.fillStyle = 'rgba(18, 21, 24, 0.78)';
      ctx.beginPath();
      ctx.roundRect(x, y, boxW, boxH, 8);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + padX, y + boxH / 2 + 1);
      ctx.restore();
    }
  }, [
    isOpen,
    loadedImg,
    aspect,
    rotation,
    flipX,
    zoom,
    offsetX,
    offsetY,
    brightness,
    contrast,
    saturate,
    showStamp,
    stampText,
  ]);

  if (!isOpen || !sourceUrl) return null;

  const handleReset = () => {
    setAspect('4:3');
    setRotation(0);
    setFlipX(false);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setShowStamp(false);
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setApplying(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      const safeName = filename.replace(/\.[^.]+$/, '') + '_edited.jpg';
      await onApply(dataUrl, safeName);
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Chỉnh sửa hình ảnh sản phẩm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl border border-black/15 shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--theme-surface-alt)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div>
            <h3 className="text-base font-bold">Chỉnh sửa & Cắt ảnh sản phẩm</h3>
            <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
              Kéo ảnh trên khung xem trước để căn góc · Xoay, chỉnh sáng và gắn nhãn cửa hàng
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình sửa ảnh"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-black/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Canvas Preview */}
          <div className="lg:col-span-7 flex flex-col items-center gap-3">
            <div
              className="w-full rounded-xl border overflow-hidden flex items-center justify-center bg-[#18181B] p-3 min-h-[280px] max-h-[420px]"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {loadError ? (
                <div className="text-xs text-white/80 p-6 text-center">{loadError}</div>
              ) : (
                <canvas
                  ref={canvasRef}
                  onPointerDown={(e) => {
                    setDragStart({ x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY });
                  }}
                  onPointerMove={(e) => {
                    if (!dragStart) return;
                    const dx = (e.clientX - dragStart.x) / 180;
                    const dy = (e.clientY - dragStart.y) / 180;
                    setOffsetX(Math.max(-1, Math.min(1, dragStart.ox + dx)));
                    setOffsetY(Math.max(-1, Math.min(1, dragStart.oy + dy)));
                  }}
                  onPointerUp={() => setDragStart(null)}
                  onPointerLeave={() => setDragStart(null)}
                  className="max-w-full max-h-[380px] object-contain rounded cursor-grab active:cursor-grabbing touch-none"
                />
              )}
            </div>

            {/* Aspect Ratio Presets */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  { id: '4:3', label: '4:3 Chuẩn thẻ SP' },
                  { id: '1:1', label: '1:1 Vuông' },
                  { id: '16:9', label: '16:9 Ngang' },
                  { id: 'original', label: 'Tỷ lệ gốc' },
                ] as const
              ).map((preset) => {
                const active = aspect === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAspect(preset.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--theme-accent)',
                            color: 'var(--theme-accent-ink)',
                            borderColor: 'var(--theme-accent)',
                          }
                        : {
                            backgroundColor: 'var(--theme-surface)',
                            color: 'var(--theme-ink)',
                            borderColor: 'var(--theme-border)',
                          }
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-4">
            {/* Transform buttons */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--theme-surface-alt)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="text-xs font-bold uppercase tracking-wider">Xoay & Lật ảnh</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 270) % 360)}
                  className="h-9 px-2.5 rounded-lg bg-white border text-xs font-medium inline-flex items-center justify-center gap-1 cursor-pointer hover:bg-black/5"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-ink)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xoay trái</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="h-9 px-2.5 rounded-lg bg-white border text-xs font-medium inline-flex items-center justify-center gap-1 cursor-pointer hover:bg-black/5"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-ink)' }}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Xoay phải</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFlipX((f) => !f)}
                  className="h-9 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1 cursor-pointer"
                  style={
                    flipX
                      ? {
                          backgroundColor: 'var(--theme-accent)',
                          color: 'var(--theme-accent-ink)',
                          borderColor: 'var(--theme-accent)',
                        }
                      : {
                          backgroundColor: '#FFFFFF',
                          color: 'var(--theme-ink)',
                          borderColor: 'var(--theme-border)',
                        }
                  }
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Lật ngang</span>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium mb-1">
                  <span className="inline-flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5" />
                    Phóng to / Cắt cận
                  </span>
                  <span className="font-mono tabular-nums">{zoom.toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={2.5}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-[var(--theme-accent)]"
                />
              </div>
            </div>

            {/* Color & Light */}
            <div
              className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--theme-surface-alt)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5" />
                <span>Ánh sáng & Màu sắc</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Độ sáng</span>
                  <span className="font-mono tabular-nums">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={145}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-[var(--theme-accent)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Độ tương phản</span>
                  <span className="font-mono tabular-nums">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min={70}
                  max={150}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-[var(--theme-accent)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Độ tươi màu</span>
                  <span className="font-mono tabular-nums">{saturate}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={160}
                  value={saturate}
                  onChange={(e) => setSaturate(Number(e.target.value))}
                  className="w-full accent-[var(--theme-accent)]"
                />
              </div>
            </div>

            {/* Store Watermark Stamp */}
            <div
              className="p-4 rounded-xl border space-y-2.5"
              style={{
                backgroundColor: 'var(--theme-surface-alt)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <label className="flex items-center justify-between gap-2 text-xs font-bold cursor-pointer">
                <span className="inline-flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  <span>Gắn nhãn chữ lên góc ảnh</span>
                </span>
                <input
                  type="checkbox"
                  checked={showStamp}
                  onChange={(e) => setShowStamp(e.target.checked)}
                  className="w-4 h-4 accent-[var(--theme-accent)]"
                />
              </label>
              {showStamp && (
                <input
                  type="text"
                  value={stampText}
                  onChange={(e) => setStampText(e.target.value)}
                  maxLength={32}
                  placeholder="VD: VLXD Huệ Hảo · Chính hãng"
                  className="w-full h-9 px-3 rounded-lg bg-white border text-xs"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-ink)' }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3"
          style={{
            backgroundColor: 'var(--theme-surface-alt)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            className="h-10 px-4 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
            style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-ink)' }}
          >
            Đặt lại mặc định
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg bg-white border text-sm font-medium hover:bg-black/5 cursor-pointer"
              style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-ink)' }}
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={applying || Boolean(loadError)}
              onClick={handleSave}
              className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-accent-ink)',
              }}
            >
              <Check className="w-4 h-4" />
              <span>{applying ? 'Đang lưu ảnh...' : 'Áp dụng ảnh đã sửa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
