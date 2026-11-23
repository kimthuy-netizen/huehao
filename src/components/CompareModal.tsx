import { useEffect, useMemo, useState } from 'react';
import { Check, Scale, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatVND, MaterialProduct, ProductVariant } from '../data/materials';
import { ResilientImage } from './ResilientImage';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MaterialProduct[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onAddToCart: (product: MaterialProduct, variant: ProductVariant, quantity: number) => void;
}

export function CompareModal({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onClearAll,
  onAddToCart,
}: CompareModalProps) {
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedVariantMap((prev) => {
      const next = { ...prev };
      for (const p of products) {
        if (!next[p.id] || !p.variants.some((v) => v.id === next[p.id])) {
          next[p.id] = p.variants[0].id;
        }
      }
      return next;
    });
  }, [isOpen, products]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const activeVariants = useMemo(() => {
    const map: Record<string, ProductVariant> = {};
    for (const p of products) {
      const chosenId = selectedVariantMap[p.id];
      map[p.id] = p.variants.find((v) => v.id === chosenId) ?? p.variants[0];
    }
    return map;
  }, [products, selectedVariantMap]);

  const lowestPrice = useMemo(() => {
    if (products.length < 2) return null;
    return Math.min(...products.map((p) => activeVariants[p.id]?.price ?? Infinity));
  }, [products, activeVariants]);

  const allSpecLabels = useMemo(() => {
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const p of products) {
      for (const spec of p.specs) {
        if (!seen.has(spec.label)) {
          seen.add(spec.label);
          labels.push(spec.label);
        }
      }
    }
    return labels;
  }, [products]);

  if (!isOpen) return null;

  const handleQuickAddFromCompare = (product: MaterialProduct) => {
    const variant = activeVariants[product.id] ?? product.variants[0];
    onAddToCart(product, variant, 1);
    setAddedId(product.id);
    window.setTimeout(() => {
      setAddedId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-ink)',
          borderColor: 'var(--theme-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--theme-surface-alt)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Scale
              className="w-5 h-5 shrink-0"
              style={{ color: 'var(--theme-accent)' }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 id="compare-modal-title" className="text-lg font-bold truncate">
                So sánh thông số & đơn giá vật liệu ({products.length}/3)
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                Có thể đổi từng quy cách bên dưới mỗi sản phẩm để đối chiếu trực tiếp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {products.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="h-9 px-3 rounded-lg border bg-white text-xs font-medium hover:bg-black/5 transition-colors whitespace-nowrap cursor-pointer"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                Xóa tất cả
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bảng so sánh"
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <Scale
              className="w-10 h-10 stroke-[1.5] mx-auto mb-3"
              style={{ color: 'var(--theme-muted)' }}
            />
            <h3 className="text-base font-semibold mb-1">
              Chưa có sản phẩm nào được chọn để so sánh
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--theme-muted)' }}>
              Chọn tối đa 3 vật liệu trong danh mục sản phẩm để xem bảng đối chiếu chi tiết.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-lg text-white text-sm font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--theme-brand-bg)' }}
            >
              Quay lại danh mục
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b align-top" style={{ borderColor: 'var(--theme-border)' }}>
                  <th
                    scope="col"
                    className="w-48 sm:w-56 p-5 text-xs uppercase tracking-wider font-semibold sticky left-0 z-10 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      color: 'var(--theme-muted)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Tiêu chí đối chiếu
                  </th>
                  {products.map((product) => {
                    const activeVar = activeVariants[product.id] ?? product.variants[0];
                    const isAdded = addedId === product.id;

                    return (
                      <th
                        key={product.id}
                        scope="col"
                        className="p-5 font-normal align-top min-w-[220px] border-r last:border-r-0"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div
                            className="aspect-[4/3] w-28 rounded-lg overflow-hidden shrink-0"
                            style={{ backgroundColor: 'var(--theme-surface-muted)' }}
                          >
                            <ResilientImage
                              src={product.image}
                              alt={product.imageAlt}
                              fallbackTitle={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveProduct(product.id)}
                            aria-label={`Bỏ ${product.name} khỏi so sánh`}
                            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div
                          className="text-xs uppercase tracking-wider font-medium mb-1"
                          style={{ color: 'var(--theme-muted)' }}
                        >
                          {product.categoryLabel}
                        </div>
                        <div className="text-sm font-bold leading-snug mb-3">{product.name}</div>

                        {/* Variant selector inside column */}
                        <label className="sr-only" htmlFor={`cmp-var-${product.id}`}>
                          Chọn quy cách cho {product.name}
                        </label>
                        <select
                          id={`cmp-var-${product.id}`}
                          value={activeVar.id}
                          onChange={(e) =>
                            setSelectedVariantMap((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="w-full h-9 px-2.5 rounded-lg border text-xs font-medium mb-3 focus:outline-none"
                          style={{
                            backgroundColor: 'var(--theme-bg)',
                            borderColor: 'var(--theme-border)',
                          }}
                        >
                          {product.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleQuickAddFromCompare(product)}
                          className="w-full h-9 px-3 rounded-lg text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                          style={{
                            backgroundColor: 'var(--theme-accent)',
                            color: 'var(--theme-accent-ink)',
                          }}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Đã thêm</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Thêm vào giỏ</span>
                            </>
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y text-sm" style={{ borderColor: 'var(--theme-border)' }}>
                {/* Price Row */}
                <tr style={{ backgroundColor: 'var(--theme-bg)' }}>
                  <th
                    scope="row"
                    className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Đơn giá hiện tại
                  </th>
                  {products.map((product) => {
                    const activeVar = activeVariants[product.id] ?? product.variants[0];
                    const isLowest = lowestPrice !== null && activeVar.price === lowestPrice;
                    return (
                      <td
                        key={product.id}
                        className="p-4 px-5 border-r last:border-r-0"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <div className="font-sans tabular-nums text-base font-extrabold tracking-tight">
                          {formatVND(activeVar.price)}
                          <span
                            className="text-xs font-normal ml-1"
                            style={{ color: 'var(--theme-muted)' }}
                          >
                            / {activeVar.unit}
                          </span>
                        </div>
                        {isLowest && (
                          <div
                            className="text-xs font-medium mt-0.5"
                            style={{ color: 'var(--theme-success)' }}
                          >
                            Đơn giá thấp nhất trong bảng
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Brand Row */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      color: 'var(--theme-ink-soft)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Thương hiệu / Xuất xứ
                  </th>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 px-5 text-sm font-medium border-r last:border-r-0"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      {product.brand}
                    </td>
                  ))}
                </tr>

                {/* SKU & Unit Row */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      color: 'var(--theme-ink-soft)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Mã SKU & Đơn vị
                  </th>
                  {products.map((product) => {
                    const activeVar = activeVariants[product.id] ?? product.variants[0];
                    return (
                      <td
                        key={product.id}
                        className="p-4 px-5 font-mono tabular-nums text-xs border-r last:border-r-0"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        {activeVar.sku} · {activeVar.unit}
                      </td>
                    );
                  })}
                </tr>

                {/* Stock Status */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      color: 'var(--theme-ink-soft)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Tình trạng kho
                  </th>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 px-5 text-xs font-medium border-r last:border-r-0"
                      style={{
                        color: 'var(--theme-success)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {product.availabilityText}
                    </td>
                  ))}
                </tr>

                {/* Lead Time */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      color: 'var(--theme-ink-soft)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Thời gian giao hàng
                  </th>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 px-5 text-xs border-r last:border-r-0"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      {product.leadTime}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Specifications Rows */}
                {allSpecLabels.map((specLabel) => (
                  <tr key={specLabel}>
                    <th
                      scope="row"
                      className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        color: 'var(--theme-ink-soft)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {specLabel}
                    </th>
                    {products.map((product) => {
                      const match = product.specs.find((s) => s.label === specLabel);
                      return (
                        <td
                          key={product.id}
                          className="p-4 px-5 font-mono tabular-nums text-xs border-r last:border-r-0"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          {match ? match.value : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Bulk Note */}
                <tr>
                  <th
                    scope="row"
                    className="p-4 px-5 text-xs font-semibold sticky left-0 border-r"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      color: 'var(--theme-ink-soft)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    Lưu ý & Chiết khấu
                  </th>
                  {products.map((product) => (
                    <td
                      key={product.id}
                      className="p-4 px-5 text-xs leading-relaxed border-r last:border-r-0"
                      style={{
                        color: 'var(--theme-ink-soft)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {product.bulkNote}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
