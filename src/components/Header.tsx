import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';

export type AppPage = 'intro' | 'products' | 'estimator' | 'contact';

interface HeaderProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  cartCount: number;
  onOpenCart: () => void;
  storeBrandShort?: string;
  showEstimator?: boolean;
}

export function Header({
  activePage,
  onNavigate,
  cartCount,
  onOpenCart,
  storeBrandShort = 'VLXD Huệ Hảo',
  showEstimator = true,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: AppPage; label: string }> = [
    { id: 'intro', label: 'Giới thiệu' },
    { id: 'products', label: 'Sản phẩm' },
    ...(showEstimator ? [{ id: 'estimator' as AppPage, label: 'Dự toán' }] : []),
    { id: 'contact', label: 'Liên hệ' },
  ];

  const handleSelectPage = (page: AppPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-sm transition-colors duration-200"
      style={{
        backgroundColor: 'var(--theme-brand-bg)',
        borderColor: 'var(--theme-brand-border)',
        color: 'var(--theme-brand-ink)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelectPage('intro')}
          className="font-display text-lg sm:text-[19px] font-bold tracking-[0.01em] text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          {storeBrandShort}
        </button>

        {/* Zone 2: 4 concise single-line nav buttons */}
        <nav
          aria-label="Điều hướng chính"
          className="hidden md:flex items-center gap-8 text-sm font-semibold"
        >
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectPage(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={{
                  color: isActive ? 'var(--theme-highlight)' : 'var(--theme-brand-muted)',
                }}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--theme-highlight)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{
              backgroundColor: 'var(--theme-highlight)',
              color: 'var(--theme-highlight-ink)',
            }}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Giỏ hàng</span>
            <span className="font-mono tabular-nums text-xs bg-black/15 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-white/25 text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t px-4 py-3"
          style={{
            backgroundColor: 'var(--theme-brand-bg-alt)',
            borderColor: 'var(--theme-brand-border)',
          }}
        >
          <nav aria-label="Điều hướng di động" className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectPage(item.id)}
                  className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
                    color: isActive ? 'var(--theme-highlight)' : '#FFFFFF',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
