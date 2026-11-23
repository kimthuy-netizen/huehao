import { useEffect, useMemo, useState } from 'react';
import { Check, Minus, PencilLine, Plus, Scale, Truck, X } from 'lucide-react';
import { formatVND, MaterialProduct, ProductVariant } from '../data/materials';
import { ResilientImage } from './ResilientImage';

interface ProductDetailModalProps {
  product: MaterialProduct | null;
  isCompared: boolean;
  onToggleCompare: (productId: string) => void;
  onEditProduct?: (productId: string) => void;
  onClose: () => void;
  onAddToCart: (product: MaterialProduct, variant: ProductVariant, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  isCompared,
  onToggleCompare,
  onEditProduct,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [justAdded, setJustAdded] = useState<boolean>(false);

  const allImages = useMemo(() => {
    if (!product) return [];
    const list = [product.image, ...(product.extraImages ?? [])].filter(Boolean);
    return Array.from(new Set(list));
  }, [product]);

  useEffect(() => {
    if (product && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
      setActiveImageIndex(0);
      setQuantity(1);
      setJustAdded(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0];
  const currentImage = allImages[activeImageIndex] ?? product.image;

  const handleAdd = () => {
    onAddToCart(product, activeVariant, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-ink)',
          borderColor: 'var(--theme-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết sản phẩm"
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--theme-surface-alt)',
            color: 'var(--theme-ink)',
          }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Sticky Visual Gallery + Technical Table */}
          <div
            className="lg:col-span-5 p-6 sm:p-8 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r"
            style={{
              backgroundColor: 'var(--theme-surface-alt)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="space-y-3">
              <div
                className="aspect-[4/3] w-full overflow-hidden rounded-xl"
                style={{ backgroundColor: 'var(--theme-surface-muted)' }}
              >
                <ResilientImage
                  src={currentImage}
                  alt={product.imageAlt}
                  fallbackTitle={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={imgUrl + idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Xem hình ${idx + 1} của ${product.name}`}
                      className="w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer"
                      style={{
                        borderColor:
                          idx === activeImageIndex ? 'var(--theme-accent)' : 'transparent',
                        opacity: idx === activeImageIndex ? 1 : 0.7,
                      }}
                    >
                      <ResilientImage
                        src={imgUrl}
                        alt={`${product.name} - hình ${idx + 1}`}
                        fallbackTitle={product.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Thông số kỹ thuật chuẩn</h3>
              <dl
                className="divide-y border-t border-b text-sm"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="py-2.5 flex items-baseline justify-between gap-4"
                  >
                    <dt style={{ color: 'var(--theme-muted)' }}>{spec.label}</dt>
                    <dd className="font-mono tabular-nums text-right font-medium">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <div
                className="flex flex-wrap items-center gap-2 text-xs mb-2"
                style={{ color: 'var(--theme-muted)' }}
              >
                <span className="uppercase tracking-wider font-medium">
                  {product.categoryLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{activeVariant.sku}</span>
              </div>

              <h2
                id="pdp-title"
                className="text-2xl font-bold leading-tight mb-3 text-balance"
              >
                {product.name}
              </h2>

              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--theme-ink-soft)' }}>
                {product.fullDesc}
              </p>

              {/* Price & Availability Row */}
              <div
                className="flex flex-wrap items-baseline justify-between gap-4 pb-5 mb-5 border-b"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <div className="flex items-baseline flex-wrap gap-x-1.5">
                  <span
                    className="font-sans tabular-nums text-2xl sm:text-3xl font-extrabold tracking-tight"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    {formatVND(activeVariant.price)}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--theme-muted)' }}>
                    / {activeVariant.unit}
                  </span>
                </div>
                <div className="text-xs font-medium flex items-center gap-1.5">
                  <Check
                    className="w-4 h-4"
                    style={{ color: 'var(--theme-success)' }}
                    aria-hidden="true"
                  />
                  <span>
                    {product.availabilityText} ({activeVariant.stockQty.toLocaleString('vi-VN')}{' '}
                    {activeVariant.unit})
                  </span>
                </div>
              </div>

              {/* Variant Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2.5">
                  Chọn quy cách vật tư
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {product.variants.map((variant) => {
                    const isSelected = variant.id === activeVariant.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className="w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between gap-4 cursor-pointer"
                        style={
                          isSelected
                            ? {
                                borderColor: 'var(--theme-accent)',
                                backgroundColor: 'var(--theme-surface-alt)',
                                color: 'var(--theme-ink)',
                              }
                            : {
                                borderColor: 'var(--theme-border)',
                                backgroundColor: 'var(--theme-surface)',
                                color: 'var(--theme-ink-soft)',
                              }
                        }
                      >
                        <span className="text-sm font-medium">{variant.label}</span>
                        <span className="font-sans tabular-nums text-sm font-bold tracking-tight shrink-0">
                          {formatVND(variant.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Purchase Controls */}
            <div className="pt-4 border-t space-y-4" style={{ borderColor: 'var(--theme-border)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div
                  className="inline-flex items-center justify-between border rounded-lg h-11 px-1 sm:w-36 shrink-0"
                  style={{
                    backgroundColor: 'var(--theme-surface-alt)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Giảm số lượng"
                    className="w-9 h-9 flex items-center justify-center rounded hover:bg-black/5 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(Number.isFinite(val) && val > 0 ? val : 1);
                    }}
                    aria-label="Số lượng đặt mua"
                    className="w-14 text-center font-mono tabular-nums text-sm font-semibold bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Tăng số lượng"
                    className="w-9 h-9 flex items-center justify-center rounded hover:bg-black/5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 h-11 px-6 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-ink)',
                  }}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>Đã thêm vào giỏ hàng</span>
                    </>
                  ) : (
                    <span>Thêm vào giỏ · {formatVND(activeVariant.price * quantity)}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleCompare(product.id)}
                  className="h-11 px-4 rounded-lg border text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  style={
                    isCompared
                      ? {
                          borderColor: 'var(--theme-accent)',
                          backgroundColor: 'var(--theme-surface-alt)',
                          color: 'var(--theme-accent)',
                        }
                      : {
                          borderColor: 'var(--theme-border)',
                          backgroundColor: 'var(--theme-surface)',
                        }
                  }
                >
                  <Scale className="w-4 h-4" aria-hidden="true" />
                  <span>{isCompared ? 'Đang so sánh' : 'So sánh'}</span>
                </button>
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-2 text-xs"
                style={{ color: 'var(--theme-muted)' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{product.leadTime}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span>{product.bulkNote}</span>
                  {onEditProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = product.id;
                        onClose();
                        onEditProduct(id);
                      }}
                      className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 cursor-pointer"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      <PencilLine className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa SP & Ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
