import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileCheck2,
  Lock,
  MapPin,
  Phone,
  Scale,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { CartDrawer, CartItem, OrderConfirmation } from './components/CartDrawer';
import { CompareModal } from './components/CompareModal';
import { AppPage, Header } from './components/Header';
import { MaterialEstimator } from './components/MaterialEstimator';
import { ManagerTab, PriceManagerModal } from './components/PriceManagerModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuoteModal } from './components/QuoteModal';
import { ResilientImage } from './components/ResilientImage';
import {
  CATEGORY_OPTIONS,
  CategoryOption,
  DEFAULT_STORE_PROFILE,
  EstimatorConfig,
  formatVND,
  HERO_IMAGE,
  MATERIALS_CATALOG,
  MaterialCategory,
  MaterialProduct,
  mergeEstimatorConfig,
  ProductVariant,
  StoreProfile,
  StoreTheme,
  toTelHref,
  toZaloHref,
} from './data/materials';

function ZaloBadgeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.2" />
      <path
        d="M7.2 8.2h5.2l-5.3 6.9h5.6M14.7 10.6c-.9 0-1.6.9-1.6 2.1s.7 2.1 1.6 2.1 1.6-.9 1.6-2.1-.7-2.1-1.6-2.1Zm3.6-2.4v6.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FacebookBadgeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13.6 21v-8.2h2.7l.4-3.2h-3.1V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.5H7.8v3.2h2.7V21h3.1Z" />
    </svg>
  );
}

function DealerBrandLogos() {
  return (
    <span
      className="mt-2.5 flex flex-wrap items-center gap-1.5"
      aria-label="Thương hiệu phân phối: Weber, Luxta, American Standard, Inax, Letton, Toàn Mỹ"
    >
      {/* Weber Saint-Gobain */}
      <span
        title="Keo dán gạch Weber"
        className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-white/95 shadow-xs border border-white/60"
      >
        <svg viewBox="0 0 74 22" className="h-4 w-auto" role="img" aria-label="Weber">
          <rect x="0" y="2" width="14" height="18" rx="2.5" fill="#FFCC00" />
          <path d="M3.2 7.2L5.1 14.8H6.5L7.1 11.2L7.7 14.8H9.1L11 7.2H9.5L8.4 12.2L7.7 8.4H6.5L5.8 12.2L4.7 7.2H3.2Z" fill="#1A1A1A" />
          <text x="18" y="15.5" fill="#1A1A1A" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="13.5" letterSpacing="-0.3">
            weber
          </text>
          <circle cx="68.5" cy="14" r="2" fill="#D91F26" />
        </svg>
      </span>

      {/* Luxta */}
      <span
        title="Thiết bị vệ sinh Luxta"
        className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-white/95 shadow-xs border border-white/60"
      >
        <svg viewBox="0 0 70 22" className="h-4 w-auto" role="img" aria-label="Luxta">
          <path d="M7.5 3.5C7.5 3.5 3 8.9 3 12.2C3 14.8 5 16.8 7.5 16.8C10 16.8 12 14.8 12 12.2C12 8.9 7.5 3.5 7.5 3.5Z" fill="#0EA5E9" />
          <path d="M7.5 6.8C7.5 6.8 5 10.1 5 12.2C5 13.6 6.1 14.7 7.5 14.7C8.9 14.7 10 13.6 10 12.2C10 10.1 7.5 6.8 7.5 6.8Z" fill="#0B4EA2" />
          <text x="15.5" y="15.5" fill="#0B4EA2" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12.5" letterSpacing="0.8">
            LUXTA
          </text>
        </svg>
      </span>

      {/* American Standard */}
      <span
        title="Thiết bị vệ sinh American Standard"
        className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-white/95 shadow-xs border border-white/60"
      >
        <svg viewBox="0 0 92 22" className="h-4 w-auto" role="img" aria-label="American Standard">
          <text x="2" y="12.5" fill="#003B71" fontFamily="Georgia, serif" fontWeight="700" fontStyle="italic" fontSize="12.5">
            American
          </text>
          <rect x="2" y="14.5" width="22" height="1.5" rx="0.75" fill="#C8102E" />
          <text x="27" y="19.5" fill="#475569" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="6.5" letterSpacing="1.1">
            STANDARD
          </text>
        </svg>
      </span>

      {/* INAX */}
      <span
        title="Thiết bị vệ sinh INAX"
        className="inline-flex items-center justify-center h-7 px-2.5 rounded-md bg-white/95 shadow-xs border border-white/60"
      >
        <svg viewBox="0 0 54 22" className="h-4 w-auto" role="img" aria-label="INAX">
          <text x="2" y="16" fill="#0066B3" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="14.5" letterSpacing="1.2">
            INAX
          </text>
        </svg>
      </span>

      {/* Letton */}
      <span
        title="Thiết bị vệ sinh Letton"
        className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-white/95 shadow-xs border border-white/60"
      >
        <svg viewBox="0 0 74 22" className="h-4 w-auto" role="img" aria-label="Letton">
          <rect x="1" y="4.5" width="11" height="13" rx="2" fill="#B91C1C" />
          <path d="M4.5 7.5V14.5H9.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <text x="16" y="15.5" fill="#1E293B" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.7">
            LETTON
          </text>
        </svg>
      </span>

      {/* Toàn Mỹ */}
      <span
        title="Bồn nước & Chậu rửa Toàn Mỹ"
        className="inline-flex items-center justify-center h-7 px-2 rounded-md bg-white/95 shadow-xs border border-white/60"
      >
        <svg viewBox="0 0 82 22" className="h-4 w-auto" role="img" aria-label="Toàn Mỹ">
          <path d="M2 15.5C5.5 11.5 11 10.5 16 11.5C11.5 12.2 7 13.8 4 17.2Z" fill="#DC2626" />
          <text x="15" y="15.5" fill="#004B93" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.3">
            TOÀN MỸ
          </text>
        </svg>
      </span>
    </span>
  );
}

type SortOption = 'default' | 'price-asc' | 'price-desc';

const CART_STORAGE_KEY = 'huehao_cart_v1';
const ORDER_STORAGE_KEY = 'huehao_last_order_v1';
const THEME_STORAGE_KEY = 'huehao_theme_v1';
const PRODUCTS_PER_PAGE = 6;

interface CatalogStatePayload {
  updatedAt: string | null;
  storageMode?: 'kv' | 'disk' | 'temporary';
  theme?: StoreTheme;
  storeProfile?: Partial<StoreProfile>;
  categories?: CategoryOption[];
  estimatorConfig?: Partial<EstimatorConfig>;
  prices: Record<string, number>;
  availability: Record<string, string>;
  deletedProductIds: string[];
  customProducts: MaterialProduct[];
  editedProducts?: Record<string, MaterialProduct>;
  primaryImageOverrides: Record<string, string>;
  extraImagesByProduct: Record<string, string[]>;
}

const DEFAULT_CATALOG_STATE: CatalogStatePayload = {
  updatedAt: null,
  storageMode: 'disk',
  theme: 'red-cream',
  storeProfile: undefined,
  categories: undefined,
  estimatorConfig: undefined,
  prices: {},
  availability: {},
  deletedProductIds: [],
  customProducts: [],
  editedProducts: {},
  primaryImageOverrides: {},
  extraImagesByProduct: {},
};

function pageFromHash(): AppPage {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  if (hash === 'san-pham') return 'products';
  if (hash === 'du-toan') return 'estimator';
  if (hash === 'lien-he') return 'contact';
  return 'intro';
}

function hashFromPage(page: AppPage): string {
  if (page === 'products') return '#san-pham';
  if (page === 'estimator') return '#du-toan';
  if (page === 'contact') return '#lien-he';
  return '#gioi-thieu';
}

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>(() => pageFromHash());
  const [theme, setTheme] = useState<StoreTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === 'blue-gold' ? 'blue-gold' : 'red-cream';
    } catch {
      return 'red-cream';
    }
  });

  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isPriceManagerOpen, setIsPriceManagerOpen] = useState(false);
  const [managerInitialTab, setManagerInitialTab] = useState<ManagerTab>('prices');
  const [managerEditProductId, setManagerEditProductId] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [quickAddedId, setQuickAddedId] = useState<string | null>(null);
  const [isFooterImageOpen, setIsFooterImageOpen] = useState(false);

  const [catalogState, setCatalogState] = useState<CatalogStatePayload>(DEFAULT_CATALOG_STATE);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [lastOrder, setLastOrder] = useState<OrderConfirmation | null>(() => {
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as OrderConfirmation) : null;
    } catch {
      return null;
    }
  });

  // Apply theme attribute to root <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage quota errors
    }
  }, [theme]);

  // Keep hash navigation in sync with browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      setActivePage(pageFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateToPage = (page: AppPage) => {
    setActivePage(page);
    const targetHash = hashFromPage(page);
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    let active = true;
    fetch('/api/catalog-state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Partial<CatalogStatePayload> | null) => {
        if (active && data && typeof data === 'object') {
          setCatalogState({
            updatedAt: data.updatedAt ?? null,
            storageMode: data.storageMode,
            theme: data.theme === 'blue-gold' ? 'blue-gold' : 'red-cream',
            storeProfile:
              data.storeProfile && typeof data.storeProfile === 'object'
                ? data.storeProfile
                : undefined,
            categories: Array.isArray(data.categories) ? data.categories : undefined,
            estimatorConfig:
              data.estimatorConfig && typeof data.estimatorConfig === 'object'
                ? data.estimatorConfig
                : undefined,
            prices: data.prices ?? {},
            availability: data.availability ?? {},
            deletedProductIds: Array.isArray(data.deletedProductIds)
              ? data.deletedProductIds
              : [],
            customProducts: Array.isArray(data.customProducts) ? data.customProducts : [],
            editedProducts:
              data.editedProducts && typeof data.editedProducts === 'object'
                ? data.editedProducts
                : {},
            primaryImageOverrides: data.primaryImageOverrides ?? {},
            extraImagesByProduct: data.extraImagesByProduct ?? {},
          });
          if (data.theme === 'blue-gold' || data.theme === 'red-cream') {
            try {
              if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                setTheme(data.theme);
              }
            } catch {
              setTheme(data.theme);
            }
          }
        }
      })
      .catch(() => {
        // Fallback silently to default catalog
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      if (lastOrder) {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(lastOrder));
      } else {
        localStorage.removeItem(ORDER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }, [lastOrder]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const storeProfile = useMemo<StoreProfile>(() => {
    const saved = catalogState.storeProfile;
    if (!saved) return DEFAULT_STORE_PROFILE;
    return {
      brandShort: saved.brandShort || DEFAULT_STORE_PROFILE.brandShort,
      brandFull: saved.brandFull || DEFAULT_STORE_PROFILE.brandFull,
      address: saved.address || DEFAULT_STORE_PROFILE.address,
      mergedAddress:
        saved.mergedAddress !== undefined
          ? saved.mergedAddress
          : DEFAULT_STORE_PROFILE.mergedAddress,
      phone1: saved.phone1 || DEFAULT_STORE_PROFILE.phone1,
      phone2: saved.phone2 !== undefined ? saved.phone2 : DEFAULT_STORE_PROFILE.phone2,
      hours: saved.hours || DEFAULT_STORE_PROFILE.hours,
      zaloUrl:
        saved.zaloUrl !== undefined ? saved.zaloUrl : DEFAULT_STORE_PROFILE.zaloUrl,
      googleMapsUrl:
        saved.googleMapsUrl !== undefined
          ? saved.googleMapsUrl
          : DEFAULT_STORE_PROFILE.googleMapsUrl,
      googleMapsEmbedUrl:
        saved.googleMapsEmbedUrl || DEFAULT_STORE_PROFILE.googleMapsEmbedUrl,
      fanpageUrl:
        saved.fanpageUrl !== undefined ? saved.fanpageUrl : DEFAULT_STORE_PROFILE.fanpageUrl,
      facebookPersonalUrl:
        saved.facebookPersonalUrl !== undefined
          ? saved.facebookPersonalUrl
          : DEFAULT_STORE_PROFILE.facebookPersonalUrl,
      contactDesc: saved.contactDesc || DEFAULT_STORE_PROFILE.contactDesc,
      heroTitle: saved.heroTitle || DEFAULT_STORE_PROFILE.heroTitle,
      heroSubtitle: saved.heroSubtitle || DEFAULT_STORE_PROFILE.heroSubtitle,
      heroBullets:
        Array.isArray(saved.heroBullets) && saved.heroBullets.length > 0
          ? saved.heroBullets
          : DEFAULT_STORE_PROFILE.heroBullets,
      heroImage: saved.heroImage || DEFAULT_STORE_PROFILE.heroImage,
      addressImage:
        saved.addressImage !== undefined
          ? saved.addressImage
          : DEFAULT_STORE_PROFILE.addressImage,
    };
  }, [catalogState.storeProfile]);

  const estimatorConfig = useMemo<EstimatorConfig>(
    () => mergeEstimatorConfig(catalogState.estimatorConfig),
    [catalogState.estimatorConfig]
  );

  useEffect(() => {
    if (!estimatorConfig.enabled && activePage === 'estimator') {
      setActivePage('intro');
    }
  }, [estimatorConfig.enabled, activePage]);

  // Merge custom products, full product edits, deleted IDs, image overrides, category labels, and price overrides
  const liveCatalog = useMemo<MaterialProduct[]>(() => {
    const deletedSet = new Set(catalogState.deletedProductIds);
    const editedMap = catalogState.editedProducts ?? {};
    const categoryLabelMap = new Map(
      (catalogState.categories ?? []).map((c) => [c.id, c.label])
    );

    const defaultsMerged = MATERIALS_CATALOG.filter((p) => !deletedSet.has(p.id)).map(
      (p) => editedMap[p.id] ?? p
    );

    const combined = [...catalogState.customProducts, ...defaultsMerged];

    return combined.map((product) => ({
      ...product,
      categoryLabel: categoryLabelMap.get(product.category) ?? product.categoryLabel,
      image: catalogState.primaryImageOverrides[product.id] ?? product.image,
      extraImages:
        catalogState.extraImagesByProduct[product.id] ?? product.extraImages ?? [],
      availabilityText:
        catalogState.availability[product.id] ?? product.availabilityText,
      variants: product.variants.map((variant) => ({
        ...variant,
        price:
          typeof catalogState.prices[variant.id] === 'number'
            ? catalogState.prices[variant.id]
            : variant.price,
      })),
    }));
  }, [catalogState]);

  // Use owner-configured category tabs if saved, otherwise default + custom product categories
  const dynamicCategoryTabs = useMemo<CategoryOption[]>(() => {
    const allTab: CategoryOption = { id: 'all', label: 'Tất cả sản phẩm' };
    if (Array.isArray(catalogState.categories)) {
      return [allTab, ...catalogState.categories];
    }
    const base = [...CATEGORY_OPTIONS];
    const seen = new Set(base.map((c) => c.id));
    for (const p of liveCatalog) {
      if (p.category && !seen.has(p.category)) {
        seen.add(p.category);
        base.push({ id: p.category, label: p.categoryLabel || p.category });
      }
    }
    return base;
  }, [catalogState.categories, liveCatalog]);

  useEffect(() => {
    if (
      activeCategory !== 'all' &&
      !dynamicCategoryTabs.some((c) => c.id === activeCategory)
    ) {
      setActiveCategory('all');
    }
  }, [activeCategory, dynamicCategoryTabs]);

  const selectedProduct = useMemo(
    () => liveCatalog.find((p) => p.id === selectedProductId) ?? null,
    [liveCatalog, selectedProductId]
  );

  const comparedProducts = useMemo(
    () =>
      compareIds
        .map((id) => liveCatalog.find((p) => p.id === id))
        .filter((p): p is MaterialProduct => Boolean(p)),
    [compareIds, liveCatalog]
  );

  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleToggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 3) {
        setToastMessage('Chỉ chọn tối đa 3 vật liệu để so sánh cùng lúc.');
        return prev;
      }
      return [...prev, productId];
    });
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = liveCatalog.filter((product) => {
      const matchesCategory =
        activeCategory === 'all' || product.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.categoryLabel.toLowerCase().includes(q) ||
        product.shortDesc.toLowerCase().includes(q) ||
        product.variants.some(
          (v) =>
            v.sku.toLowerCase().includes(q) || v.label.toLowerCase().includes(q)
        )
      );
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.variants[0].price - b.variants[0].price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.variants[0].price - a.variants[0].price);
    }
    return list;
  }, [liveCatalog, activeCategory, searchQuery, sortBy]);

  // Reset pagination when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, sortBy, liveCatalog.length]);

  const totalProductPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalProductPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, safeCurrentPage]);

  const openManager = (
    tab: ManagerTab = 'prices',
    editProductId: string | null = null
  ) => {
    setManagerInitialTab(tab);
    setManagerEditProductId(editProductId);
    setIsPriceManagerOpen(true);
  };

  const handleSaveLivePrices = async (
    pin: string,
    prices: Record<string, number>,
    availability: Record<string, string>
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, prices, availability }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể lưu bảng giá.' };
      }
      setCatalogState(data.state);
      setToastMessage('Đã cập nhật bảng giá mới cho toàn bộ cửa hàng');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi lưu bảng giá.' };
    }
  };

  const handleSaveThemeDefault = async (
    pin: string,
    nextTheme: StoreTheme
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, theme: nextTheme }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể lưu giao diện.' };
      }
      setCatalogState(data.state);
      setTheme(nextTheme);
      setToastMessage('Đã lưu bảng màu mặc định cho cửa hàng');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ.' };
    }
  };

  const handleSaveStoreProfile = async (
    pin: string,
    profile: StoreProfile
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/store-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, profile }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể lưu thông tin cửa hàng.' };
      }
      setCatalogState(data.state);
      setToastMessage('Đã cập nhật Giới thiệu, Địa chỉ & Số điện thoại');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi lưu thông tin cửa hàng.' };
    }
  };

  const handleSaveCategories = async (
    pin: string,
    categories: Array<{ id: string; label: string }> | null
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, categories }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể lưu danh mục.' };
      }
      setCatalogState(data.state);
      setToastMessage(
        categories === null
          ? 'Đã khôi phục danh sách danh mục mặc định'
          : 'Đã cập nhật danh sách danh mục sản phẩm'
      );
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi lưu danh mục.' };
    }
  };

  const handleSaveEstimatorConfig = async (
    pin: string,
    config: EstimatorConfig | null
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/estimator-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, config }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể lưu mục Dự toán.' };
      }
      setCatalogState(data.state);
      setToastMessage(
        config === null
          ? 'Đã khôi phục cài đặt mặc định cho mục Dự toán'
          : 'Đã cập nhật nội dung và định mức mục Dự toán'
      );
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi lưu mục Dự toán.' };
    }
  };

  const handleAddProduct = async (
    pin: string,
    product: MaterialProduct
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, product }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể thêm sản phẩm.' };
      }
      setCatalogState(data.state);
      setToastMessage(`Đã đăng sản phẩm mới: ${product.name}`);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi thêm sản phẩm.' };
    }
  };

  const handleUpdateProduct = async (
    pin: string,
    product: MaterialProduct
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, product }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể cập nhật sản phẩm.' };
      }
      setCatalogState(data.state);
      setToastMessage(`Đã cập nhật sản phẩm: ${product.name}`);
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi cập nhật sản phẩm.' };
    }
  };

  const handleUpdateProductImages = async (
    pin: string,
    productId: string,
    primaryImage: string | undefined,
    extraImages: string[]
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/products/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, productId, primaryImage, extraImages }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể cập nhật ảnh.' };
      }
      setCatalogState(data.state);
      setToastMessage('Đã cập nhật hình ảnh sản phẩm');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi cập nhật ảnh.' };
    }
  };

  const handleDeleteProduct = async (
    pin: string,
    productId: string
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, productId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể xóa sản phẩm.' };
      }
      setCatalogState(data.state);
      setCompareIds((prev) => prev.filter((id) => id !== productId));
      setToastMessage('Đã xóa sản phẩm khỏi danh mục');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi xóa sản phẩm.' };
    }
  };

  const handleRestoreDefaults = async (
    pin: string
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/products/restore-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể khôi phục.' };
      }
      setCatalogState(data.state);
      setToastMessage('Đã khôi phục toàn bộ sản phẩm mặc định');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ.' };
    }
  };

  const handleExportBackup = () => {
    const payload = {
      ...catalogState,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vlxd-huehao-backup-${dateTag}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToastMessage('Đã tải về tệp sao lưu dữ liệu cửa hàng');
  };

  const handleImportBackup = async (
    pin: string,
    backup: unknown
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/catalog-backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, backup }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        state?: CatalogStatePayload;
      };
      if (!res.ok || !data.ok || !data.state) {
        return { ok: false, message: data.message || 'Không thể khôi phục tệp sao lưu.' };
      }
      setCatalogState(data.state);
      if (data.state.theme === 'blue-gold' || data.state.theme === 'red-cream') {
        setTheme(data.state.theme);
      }
      setToastMessage('Đã khôi phục toàn bộ dữ liệu cửa hàng');
      return { ok: true };
    } catch {
      return { ok: false, message: 'Lỗi kết nối máy chủ khi khôi phục.' };
    }
  };

  const handleAddToCart = (
    product: MaterialProduct,
    variant: ProductVariant,
    quantity: number
  ) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.variantId === variant.id);
      if (existing) {
        return prev.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + quantity, price: variant.price }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          image: product.image,
          variantId: variant.id,
          variantLabel: variant.label,
          sku: variant.sku,
          unit: variant.unit,
          price: variant.price,
          weightKg: variant.weightKg,
          quantity,
        },
      ];
    });

    setToastMessage(`Đã thêm ${quantity} ${variant.unit} ${product.name}`);
  };

  const handleAddBundleToCart = (
    items: Array<{ product: MaterialProduct; variant: ProductVariant; quantity: number }>
  ) => {
    setCartItems((prev) => {
      const next = [...prev];
      for (const entry of items) {
        const idx = next.findIndex((i) => i.variantId === entry.variant.id);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + entry.quantity,
            price: entry.variant.price,
          };
        } else {
          next.push({
            productId: entry.product.id,
            productName: entry.product.name,
            image: entry.product.image,
            variantId: entry.variant.id,
            variantLabel: entry.variant.label,
            sku: entry.variant.sku,
            unit: entry.variant.unit,
            price: entry.variant.price,
            weightKg: entry.variant.weightKg,
            quantity: entry.quantity,
          });
        }
      }
      return next;
    });
    setToastMessage(`Đã thêm ${items.length} hạng mục dự toán vào giỏ hàng`);
  };

  const handleQuickAdd = (product: MaterialProduct) => {
    const defaultVariant = product.variants[0];
    handleAddToCart(product, defaultVariant, 1);
    setQuickAddedId(product.id);
    window.setTimeout(() => {
      setQuickAddedId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  };

  const handleUpdateQty = (variantId: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleSubmitOrder = (order: OrderConfirmation) => {
    setLastOrder(order);
    setCartItems([]);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    }).catch(() => {
      // Keep client receipt even if offline
    });
  };

  const renderProductCard = (product: MaterialProduct) => {
    const baseVariant = product.variants[0];
    const isJustAdded = quickAddedId === product.id;

    return (
      <article
        key={product.id}
        className="group rounded-2xl border overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedProductId(product.id)}
          className="aspect-[4/3] w-full overflow-hidden block text-left cursor-pointer"
          style={{ backgroundColor: 'var(--theme-surface-muted)' }}
        >
          <ResilientImage
            src={product.image}
            alt={product.imageAlt}
            fallbackTitle={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
          <div>
            {/* Clean Unboxed Metadata */}
            <div
              className="flex items-center justify-between gap-2 text-xs mb-2"
              style={{ color: 'var(--theme-muted)' }}
            >
              <span className="uppercase tracking-wider font-medium truncate">
                {product.categoryLabel} · {product.brand}
              </span>
              <span className="font-mono shrink-0">{baseVariant.sku}</span>
            </div>

            <h3 className="text-base font-bold leading-snug mb-2">
              <button
                type="button"
                onClick={() => setSelectedProductId(product.id)}
                className="text-left hover:underline cursor-pointer"
              >
                {product.name}
              </button>
            </h3>

            <p
              className="text-sm leading-relaxed line-clamp-2"
              style={{ color: 'var(--theme-ink-soft)' }}
            >
              {product.shortDesc}
            </p>
          </div>

          <div
            className="pt-4 border-t space-y-3"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline flex-wrap gap-x-1">
                <span
                  className="font-sans tabular-nums text-xl font-extrabold tracking-tight"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {formatVND(baseVariant.price)}
                </span>
                <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                  / {baseVariant.unit}
                </span>
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{ color: 'var(--theme-success)' }}
              >
                {product.availabilityText}
                {(product.extraImages?.length ?? 0) > 0 && (
                  <span style={{ color: 'var(--theme-muted)' }} className="font-normal">
                    {' · '}
                    {1 + (product.extraImages?.length ?? 0)} ảnh
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductId(product.id)}
                className="h-10 px-3 rounded-lg border text-xs font-medium hover:bg-black/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                Chi tiết ({product.variants.length})
              </button>
              <button
                type="button"
                onClick={() => handleToggleCompare(product.id)}
                aria-pressed={compareIds.includes(product.id)}
                className="h-10 px-3 rounded-lg border text-xs font-medium transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                style={
                  compareIds.includes(product.id)
                    ? {
                        borderColor: 'var(--theme-accent)',
                        backgroundColor: 'var(--theme-surface-alt)',
                        color: 'var(--theme-accent)',
                      }
                    : {
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-ink-soft)',
                      }
                }
              >
                <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{compareIds.includes(product.id) ? 'Đã chọn' : 'So sánh'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(product)}
                className="flex-1 h-10 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-ink)',
                }}
              >
                {isJustAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Đã thêm</span>
                  </>
                ) : (
                  <span>Thêm vào giỏ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-ink)' }}
    >
      <Header
        activePage={activePage}
        onNavigate={navigateToPage}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        storeBrandShort={storeProfile.brandShort}
        showEstimator={estimatorConfig.enabled}
      />

      <main className="flex-1">
        {/* PAGE 1: GIỚI THIỆU */}
        {activePage === 'intro' && (
          <>
            <section
              id="gioi-thieu"
              className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-14 border-b"
              style={{
                backgroundColor: 'var(--theme-brand-bg)',
                color: 'var(--theme-brand-ink)',
                borderColor: 'var(--theme-brand-border)',
              }}
            >
              {/* Soft faded storefront photo backdrop ("in mờ") */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none select-none overflow-hidden"
              >
                <ResilientImage
                  src={storeProfile.heroImage}
                  fallbackSrc={HERO_IMAGE.src}
                  alt=""
                  fallbackTitle={storeProfile.brandFull}
                  className="w-full h-full object-cover object-center opacity-40 blur-[1.5px] scale-[1.03]"
                />
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: 'var(--theme-brand-bg)', opacity: 0.6 }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/15" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/15" />
              </div>

              <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <p
                    className="text-[11px] sm:text-xs uppercase tracking-[0.14em] font-semibold mb-3 drop-shadow-sm"
                    style={{ color: 'var(--theme-highlight)' }}
                  >
                    Giới thiệu · {storeProfile.address}
                  </p>
                  <h1 className="text-2xl sm:text-[34px] font-bold tracking-[0.005em] text-white leading-[1.35] mb-5 text-balance drop-shadow-sm">
                    {storeProfile.heroTitle}
                  </h1>

                  <div className="rounded-2xl border border-white/15 bg-black/25 backdrop-blur-[3px] p-5 sm:p-6 mb-7">
                    {storeProfile.heroSubtitle && (
                      <p
                        className="mb-3 text-sm sm:text-base font-semibold"
                        style={{ color: 'var(--theme-highlight)' }}
                      >
                        {storeProfile.heroSubtitle}
                      </p>
                    )}
                    <ul className="space-y-2 text-sm sm:text-[15px] text-white/90 leading-relaxed">
                      {storeProfile.heroBullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span
                            className="font-bold shrink-0"
                            style={{ color: 'var(--theme-highlight)' }}
                            aria-hidden="true"
                          >
                            –
                          </span>
                          <span className="flex-1">
                            <span>{bullet}</span>
                            {idx === 1 && <DealerBrandLogos />}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigateToPage('products')}
                        className="inline-flex items-center gap-2 h-11 px-5 rounded-lg text-sm font-bold shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        style={{
                          backgroundColor: 'var(--theme-highlight)',
                          color: 'var(--theme-highlight-ink)',
                        }}
                      >
                        <span>Xem trang Sản phẩm ({liveCatalog.length})</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateToPage('contact')}
                        className="inline-flex items-center gap-2 h-11 px-4 rounded-lg border border-white/25 bg-black/20 hover:bg-white/15 backdrop-blur-[2px] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <MapPin
                          className="w-4 h-4"
                          style={{ color: 'var(--theme-highlight)' }}
                          aria-hidden="true"
                        />
                        <span>Trang Liên hệ & Google Map</span>
                      </button>
                    </div>

                    {/* Direct Zalo & Facebook Links */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <a
                        href={toZaloHref(storeProfile.zaloUrl, storeProfile.phone1)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#0068FF] hover:bg-[#0055D4] text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                      >
                        <ZaloBadgeIcon className="w-3.5 h-3.5" />
                        <span>Chat Zalo: {storeProfile.phone1}</span>
                        <ExternalLink className="w-3 h-3 opacity-80" aria-hidden="true" />
                      </a>
                      {storeProfile.fanpageUrl && (
                        <a
                          href={storeProfile.fanpageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#1877F2] hover:bg-[#1465D1] text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        >
                          <FacebookBadgeIcon className="w-3.5 h-3.5" />
                          <span>Fanpage Facebook</span>
                          <ExternalLink className="w-3 h-3 opacity-80" aria-hidden="true" />
                        </a>
                      )}
                      {storeProfile.facebookPersonalUrl && (
                        <a
                          href={storeProfile.facebookPersonalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-white/95 hover:bg-white text-[#1877F2] text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        >
                          <FacebookBadgeIcon className="w-3.5 h-3.5" />
                          <span>Facebook Chủ Cửa Hàng</span>
                          <ExternalLink className="w-3 h-3 opacity-80" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4-Column Store Highlights */}
                <div className="mt-10 pt-7 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <div
                      className="font-sans tabular-nums text-base sm:text-lg font-bold tracking-tight"
                      style={{ color: 'var(--theme-highlight)' }}
                    >
                      {storeProfile.phone1}
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Tư vấn & Chốt đơn nhanh
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      {storeProfile.phone2
                        ? `Hỗ trợ thêm qua số ${storeProfile.phone2} tất cả các ngày trong tuần.`
                        : `Phục vụ tất cả các ngày trong tuần (${storeProfile.hours}).`}
                    </p>
                  </div>
                  <div>
                    <div className="font-sans tabular-nums text-base sm:text-lg font-bold tracking-tight text-white">
                      100% Chính hãng
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Hà Tiên · Tison · Weber · Toàn Mỹ
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      Đại lý phân phối trực tiếp thiết bị vệ sinh Luxta, Letton và keo Weber.
                    </p>
                  </div>
                  <div>
                    <div className="font-sans tabular-nums text-base sm:text-lg font-bold tracking-tight text-white">
                      Cập nhật giá mỗi ngày
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Đủ hàng · Đúng quy cách
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      Báo giá minh bạch theo công trình, hỗ trợ chiết khấu khi lấy số lượng lớn.
                    </p>
                  </div>
                  <div>
                    <div className="font-sans tabular-nums text-base sm:text-lg font-bold tracking-tight text-white">
                      {storeProfile.brandShort}
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      Giao tận chân công trình
                    </div>
                    <p className="text-xs text-white/80 mt-1">
                      {storeProfile.address}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Compact 3-Card Featured Materials Preview */}
            <section className="py-12" style={{ backgroundColor: 'var(--theme-bg)' }}>
              <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                  <div>
                    <div
                      className="text-xs uppercase tracking-wider font-semibold mb-1"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      Sản phẩm nổi bật tại kho
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                      Một số mặt hàng chủ lực
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToPage('products')}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'var(--theme-accent-ink)',
                    }}
                  >
                    <span>Mở toàn bộ danh mục ({liveCatalog.length} SP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {liveCatalog.slice(0, 3).map(renderProductCard)}
                </div>
              </div>
            </section>
          </>
        )}

        {/* PAGE 2: SẢN PHẨM (CÓ PHÂN TRANG) */}
        {activePage === 'products' && (
          <section
            id="san-pham"
            className="py-10 sm:py-12"
            style={{ backgroundColor: 'var(--theme-bg)' }}
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
                <div>
                  <div
                    className="text-xs uppercase tracking-wider font-semibold mb-1.5"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    Sản phẩm & Bảng giá tham khảo
                    {catalogState.updatedAt && (
                      <>
                        {' · '}
                        <span style={{ color: 'var(--theme-muted)' }}>
                          Cập nhật lúc {new Date(catalogState.updatedAt).toLocaleString('vi-VN')}
                        </span>
                      </>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-snug text-balance">
                    Danh mục {storeProfile.brandFull}
                  </h1>
                </div>

                {/* Search, Sort & Store Manager Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search
                      className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--theme-muted)' }}
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm xi măng, thép, gạch, sơn..."
                      aria-label="Tìm kiếm sản phẩm"
                      className="w-full h-10 pl-10 pr-3.5 rounded-lg border bg-white text-sm focus:outline-none"
                      style={{ borderColor: 'var(--theme-border)' }}
                    />
                  </div>

                  <div className="relative">
                    <SlidersHorizontal
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--theme-muted)' }}
                      aria-hidden="true"
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      aria-label="Sắp xếp theo giá"
                      className="w-full sm:w-auto h-10 pl-9 pr-8 rounded-lg border bg-white text-sm focus:outline-none cursor-pointer"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <option value="default">Mặc định</option>
                      <option value="price-asc">Giá: Thấp đến cao</option>
                      <option value="price-desc">Giá: Cao đến thấp</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div
                role="tablist"
                aria-label="Lọc theo nhóm sản phẩm"
                className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6"
              >
                {dynamicCategoryTabs.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveCategory(cat.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--theme-brand-bg)',
                              color: '#FFFFFF',
                              borderColor: 'var(--theme-brand-bg)',
                            }
                          : {
                              backgroundColor: 'var(--theme-surface)',
                              color: 'var(--theme-ink-soft)',
                              borderColor: 'var(--theme-border)',
                            }
                      }
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Active Comparison Selection Bar */}
              {comparedProducts.length > 0 && (
                <div
                  className="mb-6 p-4 rounded-2xl bg-white border flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold shrink-0">
                      <Scale
                        className="w-4 h-4"
                        style={{ color: 'var(--theme-accent)' }}
                        aria-hidden="true"
                      />
                      <span className="font-mono tabular-nums">
                        Đã chọn so sánh ({comparedProducts.length}/3):
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                      {comparedProducts.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 font-medium"
                        >
                          <span className="truncate max-w-[180px]">{item.name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleCompare(item.id)}
                            aria-label={`Bỏ ${item.name} khỏi so sánh`}
                            className="p-0.5 cursor-pointer opacity-60 hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCompareIds([])}
                      className="h-9 px-3.5 rounded-lg border text-xs font-medium hover:bg-black/5 transition-colors whitespace-nowrap cursor-pointer"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      Xóa chọn
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCompareOpen(true)}
                      disabled={comparedProducts.length < 2}
                      className="h-9 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: 'var(--theme-accent)',
                        color: 'var(--theme-accent-ink)',
                      }}
                    >
                      {comparedProducts.length < 2
                        ? 'Chọn thêm 1 sản phẩm để so sánh'
                        : `So sánh ngay (${comparedProducts.length}/3)`}
                    </button>
                  </div>
                </div>
              )}

              {/* Paginated 3-Column Product Grid */}
              {filteredProducts.length === 0 ? (
                <div
                  className="bg-white rounded-2xl border p-12 text-center"
                  style={{ borderColor: 'var(--theme-border)' }}
                >
                  <p className="text-base font-semibold mb-1">
                    Không tìm thấy sản phẩm phù hợp
                  </p>
                  <p className="text-sm mb-5" style={{ color: 'var(--theme-muted)' }}>
                    Thử tìm từ khóa khác hoặc đặt lại bộ lọc danh mục.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                    }}
                    className="h-10 px-5 rounded-lg text-white text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: 'var(--theme-brand-bg)' }}
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedProducts.map(renderProductCard)}
                  </div>

                  {/* Pagination Controls */}
                  {totalProductPages > 1 && (
                    <div
                      className="mt-8 pt-6 border-t flex flex-wrap items-center justify-between gap-4"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <div className="text-xs font-medium" style={{ color: 'var(--theme-muted)' }}>
                        Trang{' '}
                        <span className="font-mono font-bold">{safeCurrentPage}</span> /{' '}
                        <span className="font-mono font-bold">{totalProductPages}</span> · Hiển thị{' '}
                        {paginatedProducts.length} / {filteredProducts.length} sản phẩm
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={safeCurrentPage <= 1}
                          onClick={() => {
                            setCurrentPage((p) => Math.max(1, p - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="h-9 px-3 rounded-lg border bg-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Trang trước</span>
                        </button>

                        {Array.from({ length: totalProductPages }, (_, i) => i + 1).map(
                          (pageNum) => {
                            const isActive = pageNum === safeCurrentPage;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-9 h-9 rounded-lg border font-mono text-xs font-bold cursor-pointer"
                                style={
                                  isActive
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
                                {pageNum}
                              </button>
                            );
                          }
                        )}

                        <button
                          type="button"
                          disabled={safeCurrentPage >= totalProductPages}
                          onClick={() => {
                            setCurrentPage((p) => Math.min(totalProductPages, p + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="h-9 px-3 rounded-lg border bg-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          <span>Trang sau</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* PAGE 3: DỰ TOÁN VẬT TƯ */}
        {activePage === 'estimator' && estimatorConfig.enabled && (
          <MaterialEstimator
            products={liveCatalog}
            storeProfile={storeProfile}
            estimatorConfig={estimatorConfig}
            onAddBundleToCart={handleAddBundleToCart}
          />
        )}

        {/* PAGE 4: LIÊN HỆ & BẢN ĐỒ */}
        {activePage === 'contact' && (
          <section
            id="lien-he"
            className="py-10 sm:py-14"
            style={{ backgroundColor: 'var(--theme-bg)' }}
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div
                className="rounded-2xl border bg-white p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch"
                style={{ borderColor: 'var(--theme-border)' }}
              >
                {/* Left: Store Contact Details & Social Channels */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-6">
                  <div>
                    <div
                      className="text-xs uppercase tracking-wider font-semibold mb-2"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      Liên hệ & Chỉ đường
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-3 text-balance">
                      {storeProfile.brandFull}
                    </h1>
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      {storeProfile.contactDesc}
                    </p>

                    <dl
                      className="divide-y border-t border-b text-sm"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <div className="py-3.5 flex items-start gap-3">
                        <MapPin
                          className="w-4 h-4 shrink-0 mt-1"
                          style={{ color: 'var(--theme-accent)' }}
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                            Địa chỉ trên Google Maps
                          </dt>
                          <dd className="font-medium mt-0.5">{storeProfile.address}</dd>
                        </div>
                      </div>

                      <div className="py-3.5 flex items-start gap-3">
                        <Phone
                          className="w-4 h-4 shrink-0 mt-1"
                          style={{ color: 'var(--theme-accent)' }}
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                            Số điện thoại đặt hàng
                          </dt>
                          <dd className="font-sans tabular-nums font-bold mt-0.5 flex flex-wrap gap-x-4 gap-y-1">
                            {[storeProfile.phone1, storeProfile.phone2]
                              .filter((p) => p && p.trim().length > 0)
                              .map((phoneText, idx) => (
                                <a
                                  key={idx}
                                  href={toTelHref(phoneText)}
                                  className="hover:underline"
                                  style={{ color: 'var(--theme-accent)' }}
                                >
                                  {phoneText}
                                </a>
                              ))}
                          </dd>
                        </div>
                      </div>

                      <div className="py-3.5 flex items-start gap-3">
                        <Clock
                          className="w-4 h-4 shrink-0 mt-1"
                          style={{ color: 'var(--theme-accent)' }}
                          aria-hidden="true"
                        />
                        <div>
                          <dt className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                            Giờ mở cửa kho bãi
                          </dt>
                          <dd className="font-medium mt-0.5">{storeProfile.hours}</dd>
                        </div>
                      </div>
                    </dl>
                  </div>

                  {/* Action Links & Prominent Zalo / Facebook Channels */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {storeProfile.googleMapsUrl && (
                        <a
                          href={storeProfile.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--theme-accent)',
                            color: 'var(--theme-accent-ink)',
                          }}
                        >
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Mở Google Maps chỉ đường</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => setIsQuoteOpen(true)}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        style={{ backgroundColor: 'var(--theme-brand-bg)' }}
                      >
                        <span>Gửi yêu cầu báo giá công trình</span>
                      </button>
                    </div>

                    <div
                      className="p-4 rounded-xl border space-y-2.5"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider">
                        Nhắn tin trực tiếp qua Zalo & Facebook
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <a
                          href={toZaloHref(storeProfile.zaloUrl, storeProfile.phone1)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-lg bg-[#0068FF] hover:bg-[#0055D4] text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                        >
                          <ZaloBadgeIcon className="w-4 h-4 shrink-0" />
                          <span>Chat Zalo ngay</span>
                        </a>

                        {storeProfile.fanpageUrl && (
                          <a
                            href={storeProfile.fanpageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg bg-[#1877F2] hover:bg-[#1465D1] text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap"
                          >
                            <FacebookBadgeIcon className="w-4 h-4 shrink-0" />
                            <span>Fanpage Facebook</span>
                          </a>
                        )}

                        {storeProfile.facebookPersonalUrl && (
                          <a
                            href={storeProfile.facebookPersonalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg bg-white hover:bg-black/5 border-2 border-[#1877F2] text-[#1877F2] text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            <FacebookBadgeIcon className="w-4 h-4 shrink-0" />
                            <span>Facebook Cá nhân</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Embedded Google Maps (Vietnamese) */}
                <div className="lg:col-span-7">
                  <div
                    className="h-full min-h-[340px] sm:min-h-[420px] rounded-2xl overflow-hidden border relative"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <iframe
                      title={`Bản đồ Google Maps ${storeProfile.brandFull}`}
                      src={storeProfile.googleMapsEmbedUrl}
                      className="w-full h-full min-h-[340px] sm:min-h-[420px] border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Quiet Footer */}
      <footer
        className="py-8 pb-20 sm:pb-8 border-t"
        style={{
          backgroundColor: 'var(--theme-brand-bg)',
          color: 'var(--theme-brand-muted)',
          borderColor: 'var(--theme-brand-border)',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 text-xs">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setIsFooterImageOpen(true)}
              className="group/fimg relative w-24 h-[72px] sm:w-28 sm:h-20 rounded-xl overflow-hidden border border-white/25 bg-black/20 shrink-0 shadow-sm cursor-pointer focus:outline-none"
              title="Nhấn để phóng to ảnh cửa hàng & địa chỉ"
              aria-label="Phóng to ảnh cửa hàng và địa chỉ"
            >
              <ResilientImage
                src={storeProfile.addressImage || storeProfile.heroImage}
                fallbackSrc={HERO_IMAGE.src}
                alt={`Hình ảnh cửa hàng và địa chỉ ${storeProfile.brandFull}`}
                fallbackTitle={storeProfile.brandFull}
                className="w-full h-full object-cover transition-transform duration-200 group-hover/fimg:scale-105"
              />
            </button>

            <div className="space-y-1.5 min-w-0">
              <div className="font-display font-bold text-white text-sm sm:text-base tracking-[0.01em] leading-snug">
                {storeProfile.brandFull}
              </div>
              <div className="flex items-start gap-1.5 leading-relaxed text-white/85">
                <MapPin
                  className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-85"
                  aria-hidden="true"
                />
                <span>{storeProfile.address}</span>
              </div>
              {storeProfile.mergedAddress && (
                <div className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/25 bg-white/10 text-white leading-snug">
                  <span
                    className="font-bold"
                    style={{ color: 'var(--theme-highlight)' }}
                  >
                    Địa chỉ mới sau sáp nhập:
                  </span>
                  <span className="font-semibold text-white">
                    {storeProfile.mergedAddress}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {lastOrder && (
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="inline-flex items-center gap-1.5 text-white hover:underline cursor-pointer mr-1"
              >
                <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Xem đơn #{lastOrder.orderCode}</span>
              </button>
            )}
            <span className="font-sans tabular-nums font-semibold text-white mr-1">
              ĐT: {storeProfile.phone1}
              {storeProfile.phone2 ? ` - ${storeProfile.phone2}` : ''}
            </span>
            <a
              href={toZaloHref(storeProfile.zaloUrl, storeProfile.phone1)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0068FF] hover:bg-[#0055D4] text-white font-bold transition-colors whitespace-nowrap"
            >
              <ZaloBadgeIcon className="w-3.5 h-3.5" />
              <span>Zalo</span>
            </a>
            {storeProfile.fanpageUrl && (
              <a
                href={storeProfile.fanpageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1877F2] hover:bg-[#1465D1] text-white font-bold transition-colors whitespace-nowrap"
              >
                <FacebookBadgeIcon className="w-3.5 h-3.5" />
                <span>Fanpage</span>
              </a>
            )}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-5 pt-3 border-t border-white/10 flex items-center justify-start">
          <button
            type="button"
            onClick={() => openManager('prices', null)}
            className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white/90 transition-colors cursor-pointer"
            title="Quản lý cửa hàng (yêu cầu mã PIN)"
          >
            <Lock className="w-3 h-3" aria-hidden="true" />
            <span>Quản lý</span>
          </button>
        </div>
      </footer>

      {isFooterImageOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Ảnh cửa hàng và địa chỉ mới sau sáp nhập"
          onClick={() => setIsFooterImageOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden border shadow-2xl"
            style={{
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-ink)',
              borderColor: 'var(--theme-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-3.5 border-b flex items-center justify-between gap-3"
              style={{
                backgroundColor: 'var(--theme-surface-alt)',
                borderColor: 'var(--theme-border)',
              }}
            >
              <div className="font-bold text-sm">{storeProfile.brandFull}</div>
              <button
                type="button"
                onClick={() => setIsFooterImageOpen(false)}
                aria-label="Đóng ảnh"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black/5">
              <ResilientImage
                src={storeProfile.addressImage || storeProfile.heroImage}
                fallbackSrc={HERO_IMAGE.src}
                alt={`Hình ảnh cửa hàng ${storeProfile.brandFull}`}
                fallbackTitle={storeProfile.brandFull}
                className="w-full max-h-[65vh] object-contain mx-auto"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-1.5 text-sm">
              <div>
                <span style={{ color: 'var(--theme-muted)' }}>Địa chỉ trên biển hiệu: </span>
                <span className="font-medium">{storeProfile.address}</span>
              </div>
              {storeProfile.mergedAddress && (
                <div>
                  <span className="font-bold" style={{ color: 'var(--theme-accent)' }}>
                    Địa chỉ mới sau sáp nhập:{' '}
                  </span>
                  <span className="font-bold">{storeProfile.mergedAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        isCompared={selectedProduct ? compareIds.includes(selectedProduct.id) : false}
        onToggleCompare={handleToggleCompare}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={handleAddToCart}
      />

      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        products={comparedProducts}
        onRemoveProduct={(id) =>
          setCompareIds((prev) => prev.filter((item) => item !== id))
        }
        onClearAll={() => {
          setCompareIds([]);
          setIsCompareOpen(false);
        }}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        lastOrder={lastOrder}
        storeProfile={storeProfile}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onSubmitOrder={handleSubmitOrder}
        onClearReceipt={() => setLastOrder(null)}
      />

      <QuoteModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        storeProfile={storeProfile}
      />

      <PriceManagerModal
        isOpen={isPriceManagerOpen}
        onClose={() => {
          setIsPriceManagerOpen(false);
          setManagerEditProductId(null);
        }}
        products={liveCatalog}
        categories={dynamicCategoryTabs
          .filter((c) => c.id !== 'all')
          .map((c) => ({ id: String(c.id), label: c.label }))}
        deletedCount={catalogState.deletedProductIds.length}
        updatedAt={catalogState.updatedAt}
        storageMode={catalogState.storageMode}
        currentTheme={theme}
        storeProfile={storeProfile}
        estimatorConfig={estimatorConfig}
        initialTab={managerInitialTab}
        initialEditProductId={managerEditProductId}
        onChangeTheme={setTheme}
        onSaveThemeDefault={handleSaveThemeDefault}
        onSaveStoreProfile={handleSaveStoreProfile}
        onSaveEstimatorConfig={handleSaveEstimatorConfig}
        onSaveCategories={handleSaveCategories}
        onSavePrices={handleSaveLivePrices}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onUpdateProductImages={handleUpdateProductImages}
        onDeleteProduct={handleDeleteProduct}
        onRestoreDefaults={handleRestoreDefaults}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      {/* Compact Floating Quick-Contact Dock (Zalo & Phone) */}
      <div
        aria-label="Liên hệ nhanh Zalo và gọi điện thoại"
        className="fixed bottom-3 right-3 z-30 flex items-center gap-1.5"
      >
        <a
          href={toZaloHref(storeProfile.zaloUrl, storeProfile.phone1)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#0068FF] hover:bg-[#0055D4] text-white text-[11px] font-bold shadow-md border border-white/25 transition-transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          <ZaloBadgeIcon className="w-3.5 h-3.5" />
          <span>Zalo</span>
        </a>
        <a
          href={toTelHref(storeProfile.phone1)}
          aria-label="Gọi điện thoại"
          title="Gọi điện thoại trực tiếp"
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-bold shadow-md border border-white/25 transition-transform hover:-translate-y-0.5 whitespace-nowrap"
        >
          <Phone className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Gọi điện</span>
        </a>
      </div>

      {/* Subtle Add-to-Cart Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-14 right-3 z-40 max-w-sm text-white px-4 py-3 rounded-xl shadow-xl border border-white/15 flex items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--theme-brand-bg)' }}
        >
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => {
              setToastMessage(null);
              setIsCartOpen(true);
            }}
            className="text-xs font-semibold hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            style={{ color: 'var(--theme-highlight)' }}
          >
            Xem giỏ
          </button>
        </div>
      )}
    </div>
  );
}
