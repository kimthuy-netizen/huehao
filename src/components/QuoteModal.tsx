import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { DEFAULT_STORE_PROFILE, StoreProfile } from '../data/materials';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeProfile?: StoreProfile;
}

export function QuoteModal({
  isOpen,
  onClose,
  storeProfile = DEFAULT_STORE_PROFILE,
}: QuoteModalProps) {
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [projectScale, setProjectScale] = useState('Nhà phố / Biệt thự (100–350 m²)');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !phone.trim()) return;
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode: `BG-${Date.now()}`,
        type: 'quote',
        company: company.trim(),
        phone: phone.trim(),
        projectScale,
        details: details.trim(),
      }),
    }).catch(() => {
      // Non-blocking fallback
    });
    setSubmitted(true);
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setCompany('');
    setPhone('');
    setDetails('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 sm:p-8 relative"
        style={{
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-ink)',
          borderColor: 'var(--theme-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleResetAndClose}
          aria-label="Đóng biểu mẫu báo giá"
          className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2
              className="w-10 h-10 mx-auto"
              style={{ color: 'var(--theme-success)' }}
              aria-hidden="true"
            />
            <h3 id="quote-modal-title" className="text-xl font-bold">
              {storeProfile.brandShort} đã nhận yêu cầu báo giá
            </h3>
            <p className="text-sm" style={{ color: 'var(--theme-ink-soft)' }}>
              Cửa hàng sẽ liên hệ lại qua số{' '}
              <strong className="font-mono">{phone}</strong> hoặc bạn có thể gọi trực tiếp{' '}
              <strong className="font-mono">{storeProfile.phone1}</strong> để chốt giá nhanh.
            </p>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="h-10 px-6 rounded-lg text-white text-sm font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: 'var(--theme-brand-bg)' }}
            >
              Đóng cửa sổ
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div
                className="text-xs uppercase tracking-wider font-medium mb-1"
                style={{ color: 'var(--theme-muted)' }}
              >
                {storeProfile.brandShort} · Báo giá công trình
              </div>
              <h3 id="quote-modal-title" className="text-xl font-bold">
                Nhận báo giá chi tiết theo thời điểm
              </h3>
            </div>

            <div>
              <label htmlFor="qt-company" className="block text-xs font-medium mb-1.5">
                Tên nhà thầu hoặc chủ đầu tư *
              </label>
              <input
                id="qt-company"
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ví dụ: Công ty Xây dựng An Gia"
                className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                }}
              />
            </div>

            <div>
              <label htmlFor="qt-phone" className="block text-xs font-medium mb-1.5">
                Số điện thoại / Zalo *
              </label>
              <input
                id="qt-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0908 123 456"
                className="w-full h-11 px-3.5 rounded-lg border font-mono text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                }}
              />
            </div>

            <div>
              <label htmlFor="qt-scale" className="block text-xs font-medium mb-1.5">
                Quy mô công trình
              </label>
              <select
                id="qt-scale"
                value={projectScale}
                onChange={(e) => setProjectScale(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <option>Nhà phố / Biệt thự (100–350 m²)</option>
                <option>Khách sạn / Văn phòng (350–1.500 m²)</option>
                <option>Nhà xưởng / Dự án công nghiệp (&gt; 1.500 m²)</option>
              </select>
            </div>

            <div>
              <label htmlFor="qt-details" className="block text-xs font-medium mb-1.5">
                Danh mục vật tư cần báo giá (tùy chọn)
              </label>
              <textarea
                id="qt-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ví dụ: 12 tấn thép D12-D16, 400 bao xi măng PCB40, 280 m² gạch Porcelain..."
                className="w-full p-3 rounded-lg border text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--theme-bg)',
                  borderColor: 'var(--theme-border)',
                }}
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'var(--theme-accent-ink)',
              }}
            >
              Gửi yêu cầu báo giá
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
