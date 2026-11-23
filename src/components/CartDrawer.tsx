import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { DEFAULT_STORE_PROFILE, formatVND, StoreProfile } from '../data/materials';
import { ResilientImage } from './ResilientImage';

export interface CartItem {
  productId: string;
  productName: string;
  image: string;
  variantId: string;
  variantLabel: string;
  sku: string;
  unit: string;
  price: number;
  weightKg: number;
  quantity: number;
}

export interface OrderConfirmation {
  orderCode: string;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: 'cod' | 'bank';
  note: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  items: CartItem[];
  createdAt: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  lastOrder: OrderConfirmation | null;
  storeProfile?: StoreProfile;
  onUpdateQty: (variantId: string, qty: number) => void;
  onRemoveItem: (variantId: string) => void;
  onSubmitOrder: (order: OrderConfirmation) => void;
  onClearReceipt: () => void;
}

const FREE_SHIPPING_THRESHOLD = 15000000;
const BASE_SHIPPING_FEE = 450000;

export function CartDrawer({
  isOpen,
  onClose,
  items,
  lastOrder,
  storeProfile = DEFAULT_STORE_PROFILE,
  onUpdateQty,
  onRemoveItem,
  onSubmitOrder,
  onClearReceipt,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'receipt'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank'>('cod');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (items.length === 0 && lastOrder) {
      setStep('receipt');
    } else if (step === 'receipt' && items.length > 0) {
      setStep('cart');
    }
  }, [isOpen, items.length, lastOrder, step]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalWeightKg = items.reduce(
    (sum, item) => sum + item.weightKg * item.quantity,
    0
  );
  const discountRate = subtotal >= 50000000 ? 0.1 : subtotal >= 20000000 ? 0.05 : 0;
  const discount = Math.round(subtotal * discountRate);
  const afterDiscount = subtotal - discount;
  const shippingFee =
    items.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD
      ? 0
      : BASE_SHIPPING_FEE;
  const grandTotal = afterDiscount + shippingFee;
  const freeShipRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setFormError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ công trình.');
      return;
    }
    setFormError('');
    const orderCode = `HH-${new Date().getFullYear()}-${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;
    const confirmation: OrderConfirmation = {
      orderCode,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod,
      note: note.trim(),
      subtotal,
      discount,
      shippingFee,
      total: grandTotal,
      items: [...items],
      createdAt: new Date().toLocaleString('vi-VN'),
    };
    onSubmitOrder(confirmation);
    setStep('receipt');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Giỏ hàng và thanh toán"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg h-full shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{
            backgroundColor: 'var(--theme-surface-alt)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-lg font-bold">
              {step === 'cart' && `Giỏ vật tư ${storeProfile.brandShort}`}
              {step === 'checkout' && 'Thông tin giao nhận & Thanh toán'}
              {step === 'receipt' && 'Xác nhận đơn hàng'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng giỏ hàng"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'receipt' && lastOrder ? (
            <div className="space-y-6">
              <div
                className="p-5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--theme-surface-alt)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className="w-6 h-6 shrink-0 mt-0.5"
                    style={{ color: 'var(--theme-success)' }}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-mono text-xs mb-1" style={{ color: 'var(--theme-muted)' }}>
                      Đơn hàng #{lastOrder.orderCode}
                    </div>
                    <h3 className="text-base font-bold mb-1">
                      Đã ghi nhận đơn đặt hàng tại {storeProfile.brandShort}
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--theme-ink-soft)' }}>
                      Cửa hàng sẽ gọi lại qua số {storeProfile.phone1}
                      {storeProfile.phone2 ? ` / ${storeProfile.phone2}` : ''} để xác nhận lịch xe giao tận công trình.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="space-y-2 text-sm border-b pb-4"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--theme-muted)' }}>Người nhận</span>
                  <span className="font-medium text-right">
                    {lastOrder.customerName} · {lastOrder.phone}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--theme-muted)' }}>Địa chỉ giao</span>
                  <span className="font-medium text-right">{lastOrder.address}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'var(--theme-muted)' }}>Thanh toán</span>
                  <span className="font-medium text-right">
                    {lastOrder.paymentMethod === 'cod'
                      ? 'Thanh toán khi nhận hàng (COD)'
                      : 'Chuyển khoản ngân hàng (VAT)'}
                  </span>
                </div>
              </div>

              <div>
                <h4
                  className="text-xs uppercase tracking-wider font-medium mb-3"
                  style={{ color: 'var(--theme-muted)' }}
                >
                  Chi tiết vật tư ({lastOrder.items.length} mục)
                </h4>
                <div
                  className="divide-y border-t border-b"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  {lastOrder.items.map((item) => (
                    <div
                      key={item.variantId}
                      className="py-2.5 flex items-center justify-between gap-4 text-sm"
                    >
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                          {item.variantLabel} × {item.quantity}
                        </div>
                      </div>
                      <span className="font-sans tabular-nums font-semibold">
                        {formatVND(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between" style={{ color: 'var(--theme-muted)' }}>
                  <span>Tạm tính</span>
                  <span className="font-sans tabular-nums">{formatVND(lastOrder.subtotal)}</span>
                </div>
                {lastOrder.discount > 0 && (
                  <div
                    className="flex justify-between font-medium"
                    style={{ color: 'var(--theme-success)' }}
                  >
                    <span>Chiết khấu nhà thầu</span>
                    <span className="font-sans tabular-nums">-{formatVND(lastOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between" style={{ color: 'var(--theme-muted)' }}>
                  <span>Phí xe tải / xe cẩu</span>
                  <span className="font-sans tabular-nums">
                    {lastOrder.shippingFee === 0 ? 'Miễn phí' : formatVND(lastOrder.shippingFee)}
                  </span>
                </div>
                <div
                  className="flex justify-between text-base font-bold pt-2 border-t"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <span>Tổng thanh toán</span>
                  <span className="font-sans tabular-nums font-extrabold tracking-tight">
                    {formatVND(lastOrder.total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClearReceipt();
                  setStep('cart');
                  onClose();
                }}
                className="w-full h-11 rounded-lg text-white text-sm font-semibold transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--theme-brand-bg)' }}
              >
                Tiếp tục chọn vật liệu
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <ShoppingBag
                className="w-10 h-10 stroke-[1.5] mb-3"
                style={{ color: 'var(--theme-muted)' }}
              />
              <h3 className="text-base font-semibold mb-1">Chưa có vật tư nào trong giỏ</h3>
              <p className="text-sm max-w-xs mb-6" style={{ color: 'var(--theme-muted)' }}>
                Chọn vật liệu từ bảng giá hoặc dùng công cụ dự toán để tự động tính khối lượng cần thiết.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors cursor-pointer"
                style={{ backgroundColor: 'var(--theme-brand-bg)' }}
              >
                Xem bảng giá vật liệu
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-5">
              {/* Free crane-truck shipping indicator */}
              <div
                className="p-3.5 rounded-xl border"
                style={{
                  backgroundColor: 'var(--theme-surface-alt)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-center gap-2 text-xs mb-2">
                  <Truck
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--theme-accent)' }}
                    aria-hidden="true"
                  />
                  {freeShipRemaining === 0 ? (
                    <span className="font-medium">
                      Đủ điều kiện miễn phí vận chuyển xe tải tận công trình.
                    </span>
                  ) : (
                    <span>
                      Thêm{' '}
                      <strong className="font-sans tabular-nums font-bold">
                        {formatVND(freeShipRemaining)}
                      </strong>{' '}
                      để được miễn phí vận chuyển xe tải (đơn từ 15 triệu).
                    </span>
                  )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      width: `${Math.min(
                        100,
                        (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                {items.map((item) => (
                  <div key={item.variantId} className="py-4 flex gap-4">
                    <div
                      className="w-20 h-16 rounded-lg overflow-hidden shrink-0"
                      style={{ backgroundColor: 'var(--theme-surface-muted)' }}
                    >
                      <ResilientImage
                        src={item.image}
                        alt={item.productName}
                        fallbackTitle={item.productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold leading-snug">{item.productName}</h3>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.variantId)}
                          aria-label={`Xóa ${item.productName}`}
                          className="p-1 cursor-pointer opacity-60 hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs mt-0.5 mb-2.5" style={{ color: 'var(--theme-muted)' }}>
                        {item.variantLabel}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className="inline-flex items-center border rounded-lg h-8"
                          style={{
                            backgroundColor: 'var(--theme-bg)',
                            borderColor: 'var(--theme-border)',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(item.variantId, Math.max(1, item.quantity - 1))
                            }
                            aria-label="Giảm số lượng"
                            className="w-8 h-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-mono tabular-nums text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.variantId, item.quantity + 1)}
                            aria-label="Tăng số lượng"
                            className="w-8 h-full flex items-center justify-center hover:bg-black/5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right font-sans tabular-nums text-sm font-bold">
                          {formatVND(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg border text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(196, 30, 37, 0.1)',
                    borderColor: 'rgba(196, 30, 37, 0.3)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="co-name" className="block text-xs font-medium mb-1.5">
                  Họ và tên người nhận / Nhà thầu *
                </label>
                <input
                  id="co-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Trí"
                  className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
              </div>

              <div>
                <label htmlFor="co-phone" className="block text-xs font-medium mb-1.5">
                  Số điện thoại liên hệ *
                </label>
                <input
                  id="co-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0908 123 456"
                  className="w-full h-11 px-3.5 rounded-lg border font-mono text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
              </div>

              <div>
                <label htmlFor="co-address" className="block text-xs font-medium mb-1.5">
                  Địa chỉ giao tận công trình *
                </label>
                <input
                  id="co-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                  className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
              </div>

              <div>
                <span className="block text-xs font-medium mb-2">Phương thức thanh toán</span>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    className="flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor:
                        paymentMethod === 'cod' ? 'var(--theme-accent)' : 'var(--theme-border)',
                      backgroundColor:
                        paymentMethod === 'cod'
                          ? 'var(--theme-surface-alt)'
                          : 'var(--theme-surface)',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="accent-[var(--theme-accent)]"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Thanh toán khi nhận hàng (COD)</div>
                      <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                        Kiểm tra quy cách & chứng chỉ CO/CQ tại công trình trước khi thanh toán.
                      </div>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors"
                    style={{
                      borderColor:
                        paymentMethod === 'bank' ? 'var(--theme-accent)' : 'var(--theme-border)',
                      backgroundColor:
                        paymentMethod === 'bank'
                          ? 'var(--theme-surface-alt)'
                          : 'var(--theme-surface)',
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="accent-[var(--theme-accent)]"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Chuyển khoản công ty (Xuất hóa đơn VAT)</div>
                      <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                        Hỗ trợ xuất hóa đơn GTGT điện tử ngay trong ngày.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="co-note" className="block text-xs font-medium mb-1.5">
                  Ghi chú điều xe (giờ giao, hẻm rộng, xe cẩu)
                </label>
                <textarea
                  id="co-note"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Giao lúc 7h30 sáng, đường rộng 6m xe tải 5 tấn vào được"
                  className="w-full p-3 rounded-lg border text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && step !== 'receipt' && (
          <div
            className="px-6 py-4 border-t space-y-3"
            style={{
              backgroundColor: 'var(--theme-surface-alt)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div className="space-y-1 text-sm">
              <div className="flex justify-between" style={{ color: 'var(--theme-muted)' }}>
                <span>
                  Tạm tính (tổng trọng lượng ~{totalWeightKg.toLocaleString('vi-VN')} kg)
                </span>
                <span className="font-sans tabular-nums font-medium" style={{ color: 'var(--theme-ink)' }}>
                  {formatVND(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div
                  className="flex justify-between font-medium"
                  style={{ color: 'var(--theme-success)' }}
                >
                  <span>Chiết khấu tự động ({discountRate * 100}%)</span>
                  <span className="font-sans tabular-nums font-semibold">-{formatVND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ color: 'var(--theme-muted)' }}>
                <span>Phí vận chuyển xe tải</span>
                <span className="font-sans tabular-nums font-medium" style={{ color: 'var(--theme-ink)' }}>
                  {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
                </span>
              </div>
              <div
                className="flex justify-between text-base font-bold pt-2 border-t"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <span>Tổng cộng</span>
                <span className="font-sans tabular-nums font-extrabold tracking-tight">
                  {formatVND(grandTotal)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full h-11 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-ink)',
                }}
              >
                Tiến hành đặt hàng
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="h-11 px-4 rounded-lg border bg-white text-sm font-medium hover:bg-black/5 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  className="flex-1 h-11 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'var(--theme-accent-ink)',
                  }}
                >
                  Xác nhận đặt hàng
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
