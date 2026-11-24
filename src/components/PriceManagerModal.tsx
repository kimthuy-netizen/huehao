import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Check,
  Crop,
  Download,
  FolderCog,
  ImagePlus,
  KeyRound,
  Lock,
  MapPin,
  Palette,
  Pencil,
  PencilLine,
  Percent,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CATEGORY_OPTIONS,
  DEFAULT_ESTIMATOR_CONFIG,
  DEFAULT_STORE_PROFILE,
  EstimatorConfig,
  EstimatorLineConfig,
  formatVND,
  MaterialCategory,
  MaterialProduct,
  MaterialSpec,
  mergeEstimatorConfig,
  ProductVariant,
  StoreProfile,
  StoreTheme,
} from '../data/materials';
import { ImageEditorModal } from './ImageEditorModal';
import { ResilientImage } from './ResilientImage';

export type ManagerTab =
  | 'prices'
  | 'categories'
  | 'add'
  | 'media-delete'
  | 'store-info'
  | 'estimator';

interface PriceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: MaterialProduct[];
  categories: Array<{ id: string; label: string }>;
  deletedCount: number;
  updatedAt: string | null;
  storageMode?: 'kv' | 'disk' | 'temporary';
  currentTheme: StoreTheme;
  storeProfile: StoreProfile;
  estimatorConfig: EstimatorConfig;
  initialTab?: ManagerTab;
  initialEditProductId?: string | null;
  onChangeTheme: (theme: StoreTheme) => void;
  onSaveThemeDefault: (
    pin: string,
    theme: StoreTheme
  ) => Promise<{ ok: boolean; message?: string }>;
  onSaveStoreProfile: (
    pin: string,
    profile: StoreProfile
  ) => Promise<{ ok: boolean; message?: string }>;
  onSaveEstimatorConfig: (
    pin: string,
    config: EstimatorConfig | null
  ) => Promise<{ ok: boolean; message?: string }>;
  onSaveCategories: (
    pin: string,
    categories: Array<{ id: string; label: string }> | null
  ) => Promise<{ ok: boolean; message?: string }>;
  onSavePrices: (
    pin: string,
    prices: Record<string, number>,
    availability: Record<string, string>
  ) => Promise<{ ok: boolean; message?: string }>;
  onAddProduct: (
    pin: string,
    product: MaterialProduct
  ) => Promise<{ ok: boolean; message?: string }>;
  onUpdateProduct: (
    pin: string,
    product: MaterialProduct
  ) => Promise<{ ok: boolean; message?: string }>;
  onUpdateProductImages: (
    pin: string,
    productId: string,
    primaryImage: string | undefined,
    extraImages: string[]
  ) => Promise<{ ok: boolean; message?: string }>;
  onDeleteProduct: (
    pin: string,
    productId: string
  ) => Promise<{ ok: boolean; message?: string }>;
  onRestoreDefaults: (pin: string) => Promise<{ ok: boolean; message?: string }>;
  onExportBackup: () => void;
  onImportBackup: (
    pin: string,
    backup: unknown
  ) => Promise<{ ok: boolean; message?: string }>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
    reader.readAsDataURL(file);
  });
}

async function compressImageFileToDataUrl(file: File): Promise<string> {
  const rawUrl = await readFileAsDataUrl(file);
  if (file.size <= 450 * 1024) return rawUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 1400;
      let w = img.naturalWidth || 1200;
      let h = img.naturalHeight || 900;
      if (w > maxDim || h > maxDim) {
        const scale = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = () => resolve(rawUrl);
    img.src = rawUrl;
  });
}

async function uploadDataUrlToServer(
  pin: string,
  dataUrl: string,
  filename: string
): Promise<string> {
  const res = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, filename, dataUrl }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    url?: string;
    message?: string;
  };
  if (!res.ok || !data.ok || !data.url) {
    throw new Error(data.message || 'Tải ảnh lên thất bại.');
  }
  return data.url;
}

async function uploadImageToServer(pin: string, file: File): Promise<string> {
  const dataUrl = await compressImageFileToDataUrl(file);
  return uploadDataUrlToServer(pin, dataUrl, file.name);
}

function slugifyCategory(label: string): string {
  return (
    'cat-' +
    label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 28)
  );
}

export function PriceManagerModal({
  isOpen,
  onClose,
  products,
  categories,
  deletedCount,
  updatedAt,
  storageMode = 'disk',
  currentTheme,
  storeProfile,
  estimatorConfig,
  initialTab,
  initialEditProductId,
  onChangeTheme,
  onSaveThemeDefault,
  onSaveStoreProfile,
  onSaveEstimatorConfig,
  onSaveCategories,
  onSavePrices,
  onAddProduct,
  onUpdateProduct,
  onUpdateProductImages,
  onDeleteProduct,
  onRestoreDefaults,
  onExportBackup,
  onImportBackup,
}: PriceManagerModalProps) {
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<ManagerTab>('prices');

  // Tab 1: Prices & Availability
  const [draftPrices, setDraftPrices] = useState<Record<string, number>>({});
  const [draftAvailability, setDraftAvailability] = useState<Record<string, string>>({});
  const [filterCat, setFilterCat] = useState<MaterialCategory>('all');
  const [bulkCategory, setBulkCategory] = useState<string>('steel');
  const [bulkPercent, setBulkPercent] = useState<number>(2);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // PIN change
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  // Tab 2: Add or Edit Full Product Form
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('cement');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formLeadTime, setFormLeadTime] = useState('Giao trong ngày');
  const [formBulkNote, setFormBulkNote] = useState(
    'Liên hệ 0913 622 702 để chốt giá số lượng lớn.'
  );
  const [formPrimaryImage, setFormPrimaryImage] = useState('');
  const [formExtraImages, setFormExtraImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<
    Array<{ id?: string; label: string; sku?: string; unit: string; price: number }>
  >([{ label: '', unit: 'cái', price: 100000 }]);
  const [formSpecs, setFormSpecs] = useState<MaterialSpec[]>([
    { label: 'Xuất xứ / Hãng', value: 'Chính hãng 100%' },
  ]);
  const [uploadingFormImg, setUploadingFormImg] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Tab 3: Media & Delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadingForId, setUploadingForId] = useState<string | null>(null);

  // Tab 4: Store Info & Intro
  const [draftProfile, setDraftProfile] = useState<StoreProfile>(storeProfile);
  const [savingProfile, setSavingProfile] = useState(false);

  // Tab 5: Category CRUD
  const [draftCategories, setDraftCategories] =
    useState<Array<{ id: string; label: string }>>(categories);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [savingCategories, setSavingCategories] = useState(false);

  // Tab 6: Estimator Config
  const [draftEstimator, setDraftEstimator] = useState<EstimatorConfig>(() =>
    mergeEstimatorConfig(estimatorConfig)
  );
  const [savingEstimator, setSavingEstimator] = useState(false);

  // In-browser Image Editor state
  const [editorConfig, setEditorConfig] = useState<{
    sourceUrl: string;
    filename: string;
    onDone: (editedDataUrl: string, filename: string) => Promise<void>;
  } | null>(null);

  const allCategories =
    categories.length > 0
      ? categories
      : CATEGORY_OPTIONS.filter((c) => c.id !== 'all').map((c) => ({
          id: String(c.id),
          label: c.label,
        }));

  const resetProductForm = () => {
    setEditingProductId(null);
    setFormName('');
    setFormCategory(allCategories[0]?.id ?? 'cement');
    setCustomCategoryName('');
    setFormBrand('');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormLeadTime('Giao trong ngày');
    setFormBulkNote('Liên hệ 0913 622 702 để chốt giá số lượng lớn.');
    setFormPrimaryImage('');
    setFormExtraImages([]);
    setFormVariants([{ label: '', unit: 'cái', price: 100000 }]);
    setFormSpecs([{ label: 'Xuất xứ / Hãng', value: 'Chính hãng 100%' }]);
  };

  const loadProductIntoForm = (product: MaterialProduct) => {
    setEditingProductId(product.id);
    setFormName(product.name);
    const hasCat = allCategories.some((c) => c.id === product.category);
    if (hasCat) {
      setFormCategory(product.category);
      setCustomCategoryName('');
    } else {
      setFormCategory('__custom__');
      setCustomCategoryName(product.categoryLabel);
    }
    setFormBrand(product.brand);
    setFormShortDesc(product.shortDesc);
    setFormFullDesc(product.fullDesc);
    setFormLeadTime(product.leadTime);
    setFormBulkNote(product.bulkNote);
    setFormPrimaryImage(product.image);
    setFormExtraImages(product.extraImages ?? []);
    setFormVariants(
      product.variants.map((v) => ({
        id: v.id,
        label: v.label,
        sku: v.sku,
        unit: v.unit,
        price: v.price,
      }))
    );
    setFormSpecs(
      product.specs.length > 0
        ? product.specs.map((s) => ({ ...s }))
        : [{ label: 'Thương hiệu', value: product.brand }]
    );
    setActiveTab('add');
    setFeedback(`Đang chỉnh sửa sản phẩm: "${product.name}"`);
  };

  useEffect(() => {
    if (!isOpen) return;
    const priceMap: Record<string, number> = {};
    const availMap: Record<string, string> = {};
    for (const product of products) {
      availMap[product.id] = product.availabilityText;
      for (const v of product.variants) {
        priceMap[v.id] = v.price;
      }
    }
    setDraftPrices(priceMap);
    setDraftAvailability(availMap);
    setDraftProfile({
      ...storeProfile,
      heroBullets: [...storeProfile.heroBullets],
    });
    setDraftEstimator(mergeEstimatorConfig(estimatorConfig));
    setDraftCategories(categories.map((c) => ({ ...c })));
    setNewCategoryLabel('');
    setFeedback(null);
    setPinChangeMsg(null);
    setConfirmDeleteId(null);

    if (initialEditProductId) {
      const target = products.find((p) => p.id === initialEditProductId);
      if (target) {
        loadProductIntoForm(target);
      }
    } else if (initialTab) {
      setActiveTab(initialTab);
      if (initialTab !== 'add') {
        resetProductForm();
      }
    }
  }, [isOpen, products, categories, storeProfile, estimatorConfig, initialTab, initialEditProductId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !editorConfig) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, editorConfig]);

  if (!isOpen) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/owner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setPinError(data.message || 'Mã PIN không chính xác.');
        return;
      }
      setUnlockedPin(pinInput.trim());
      setPinInput('');
    } catch {
      setPinError('Không thể kết nối máy chủ để xác thực PIN.');
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyBulkPercent = () => {
    if (!Number.isFinite(bulkPercent) || bulkPercent === 0) return;
    setDraftPrices((prev) => {
      const next = { ...prev };
      for (const product of products) {
        if (product.category === bulkCategory) {
          for (const v of product.variants) {
            const current = next[v.id] ?? v.price;
            const adjusted = Math.round((current * (1 + bulkPercent / 100)) / 500) * 500;
            next[v.id] = Math.max(1000, adjusted);
          }
        }
      }
      return next;
    });
    setFeedback(
      `Đã điều chỉnh tạm ${bulkPercent > 0 ? '+' : ''}${bulkPercent}% cho nhóm đã chọn. Nhấn "Lưu & Đăng bảng giá mới" để áp dụng.`
    );
  };

  const handleSavePrices = async () => {
    if (!unlockedPin) return;
    setSaving(true);
    setFeedback(null);
    const result = await onSavePrices(unlockedPin, draftPrices, draftAvailability);
    setSaving(false);
    setFeedback(
      result.ok
        ? 'Đã lưu bảng giá mới lên hệ thống. Tất cả khách xem web đều thấy giá mới ngay.'
        : result.message || 'Lưu bảng giá thất bại.'
    );
  };

  const handleSaveThemeToServer = async (theme: StoreTheme) => {
    onChangeTheme(theme);
    if (!unlockedPin) return;
    const res = await onSaveThemeDefault(unlockedPin, theme);
    if (res.ok) {
      setFeedback(
        `Đã đặt giao diện mặc định cho cửa hàng: ${
          theme === 'red-cream' ? 'Đỏ · Kem · Trắng' : 'Xanh dương · Vàng'
        }`
      );
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin) return;
    setPinChangeMsg(null);
    try {
      const res = await fetch('/api/owner/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: unlockedPin, newPin: newPin.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setPinChangeMsg(data.message || 'Không thể đổi mã PIN.');
        return;
      }
      setUnlockedPin(newPin.trim());
      setNewPin('');
      setPinChangeMsg('Đã đổi mã PIN thành công.');
      setShowChangePin(false);
    } catch {
      setPinChangeMsg('Lỗi kết nối khi đổi mã PIN.');
    }
  };

  const handlePickPrimaryAndEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!unlockedPin || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    e.target.value = '';
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditorConfig({
        sourceUrl: dataUrl,
        filename: file.name,
        onDone: async (editedDataUrl, fname) => {
          setUploadingFormImg(true);
          try {
            const url = await uploadDataUrlToServer(unlockedPin, editedDataUrl, fname);
            setFormPrimaryImage(url);
            setEditorConfig(null);
            setFeedback('Đã chỉnh sửa và lưu ảnh đại diện sản phẩm.');
          } catch (err) {
            setFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh.');
          } finally {
            setUploadingFormImg(false);
          }
        },
      });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Không đọc được tệp ảnh.');
    }
  };

  const handleOpenEditorForUrl = (
    url: string,
    onSaved: (newUploadedUrl: string) => Promise<void> | void
  ) => {
    if (!unlockedPin) return;
    setEditorConfig({
      sourceUrl: url,
      filename: 'product_photo.jpg',
      onDone: async (editedDataUrl, fname) => {
        setUploadingFormImg(true);
        try {
          const uploadedUrl = await uploadDataUrlToServer(unlockedPin, editedDataUrl, fname);
          await onSaved(uploadedUrl);
          setEditorConfig(null);
        } catch (err) {
          setFeedback(err instanceof Error ? err.message : 'Lỗi lưu ảnh đã chỉnh sửa.');
        } finally {
          setUploadingFormImg(false);
        }
      },
    });
  };

  const handleUploadNewExtras = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!unlockedPin || !e.target.files?.length) return;
    setUploadingFormImg(true);
    setFeedback(null);
    try {
      const files = Array.from(e.target.files).slice(0, 6);
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const url = await uploadImageToServer(unlockedPin, file);
        uploadedUrls.push(url);
      }
      setFormExtraImages((prev) => [...prev, ...uploadedUrls]);
      setFeedback(`Đã tải thêm ${uploadedUrls.length} hình ảnh bổ sung.`);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh.');
    } finally {
      setUploadingFormImg(false);
      e.target.value = '';
    }
  };

  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin) return;
    if (!formName.trim()) {
      setFeedback('Vui lòng nhập tên sản phẩm.');
      return;
    }

    let finalCategoryId = formCategory;
    let finalCategoryLabel =
      allCategories.find((c) => c.id === formCategory)?.label ?? 'Vật liệu xây dựng';

    if (formCategory === '__custom__') {
      if (!customCategoryName.trim()) {
        setFeedback('Vui lòng nhập tên nhóm danh mục mới.');
        return;
      }
      finalCategoryLabel = customCategoryName.trim();
      finalCategoryId = slugifyCategory(finalCategoryLabel);
    }

    const baseId = editingProductId || `sp-${Date.now()}`;
    const existingTarget = editingProductId
      ? products.find((p) => p.id === editingProductId)
      : null;

    const validVariants: ProductVariant[] = formVariants
      .filter((v) => v.label.trim() && v.price >= 0)
      .map((v, idx) => ({
        id: v.id || `${baseId}-v${idx + 1}-${Date.now().toString().slice(-3)}`,
        label: v.label.trim(),
        sku: v.sku || `HH-${String(Date.now()).slice(-4)}-${idx + 1}`,
        unit: v.unit.trim() || 'cái',
        price: Math.round(Number(v.price) || 0),
        stockQty: 100,
        weightKg: 10,
      }));

    if (validVariants.length === 0) {
      setFeedback('Cần ít nhất 1 quy cách và đơn giá hợp lệ.');
      return;
    }

    const cleanSpecs = formSpecs
      .filter((s) => s.label.trim() && s.value.trim())
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }));

    const fallbackImage = '/src/assets/images/hero_building_materials_1795190798157.jpg';
    const payload: MaterialProduct = {
      id: baseId,
      name: formName.trim(),
      category: finalCategoryId,
      categoryLabel: finalCategoryLabel,
      brand: formBrand.trim() || 'VLXD Huệ Hảo',
      shortDesc:
        formShortDesc.trim() ||
        'Sản phẩm phân phối tại cửa hàng Vật Liệu Xây Dựng Huệ Hảo.',
      fullDesc:
        formFullDesc.trim() ||
        formShortDesc.trim() ||
        'Sản phẩm chính hãng có sẵn tại VLXD Huệ Hảo, hỗ trợ giao hàng tận công trình.',
      image: formPrimaryImage || formExtraImages[0] || existingTarget?.image || fallbackImage,
      extraImages: formExtraImages,
      imageAlt: formName.trim(),
      availabilityText: existingTarget?.availabilityText || 'Còn hàng tại kho',
      leadTime: formLeadTime.trim() || 'Giao trong ngày',
      bulkNote:
        formBulkNote.trim() || 'Liên hệ 0913 622 702 để báo giá số lượng lớn.',
      variants: validVariants,
      specs:
        cleanSpecs.length > 0
          ? cleanSpecs
          : [
              { label: 'Thương hiệu', value: formBrand.trim() || 'Chính hãng' },
              { label: 'Quy cách có sẵn', value: `${validVariants.length} loại` },
            ],
    };

    setSubmittingProduct(true);
    const result = editingProductId
      ? await onUpdateProduct(unlockedPin, payload)
      : await onAddProduct(unlockedPin, payload);
    setSubmittingProduct(false);

    if (result.ok) {
      resetProductForm();
      setFeedback(
        editingProductId
          ? `Đã cập nhật toàn bộ thông tin "${payload.name}".`
          : `Đã thêm sản phẩm "${payload.name}" vào danh mục.`
      );
      setActiveTab('media-delete');
    } else {
      setFeedback(result.message || 'Không thể lưu sản phẩm.');
    }
  };

  const handleUploadExtraForExisting = async (
    product: MaterialProduct,
    files: FileList | null,
    asPrimary = false
  ) => {
    if (!unlockedPin || !files?.length) return;
    setUploadingForId(product.id);
    setFeedback(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files).slice(0, 5)) {
        const url = await uploadImageToServer(unlockedPin, file);
        uploadedUrls.push(url);
      }

      const currentExtras = product.extraImages ?? [];
      const nextPrimary = asPrimary ? uploadedUrls[0] : undefined;
      const nextExtras = asPrimary
        ? [...currentExtras, ...uploadedUrls.slice(1)]
        : [...currentExtras, ...uploadedUrls];

      const res = await onUpdateProductImages(
        unlockedPin,
        product.id,
        nextPrimary,
        nextExtras
      );
      setFeedback(
        res.ok
          ? `Đã cập nhật hình ảnh cho "${product.name}".`
          : res.message || 'Cập nhật hình ảnh thất bại.'
      );
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh lên.');
    } finally {
      setUploadingForId(null);
    }
  };

  const handleRemoveExtraImage = async (product: MaterialProduct, imgUrl: string) => {
    if (!unlockedPin) return;
    const nextExtras = (product.extraImages ?? []).filter((u) => u !== imgUrl);
    const res = await onUpdateProductImages(unlockedPin, product.id, undefined, nextExtras);
    if (res.ok) {
      setFeedback(`Đã xóa 1 ảnh bổ sung khỏi "${product.name}".`);
    }
  };

  const handleConfirmDelete = async (productId: string, productName: string) => {
    if (!unlockedPin) return;
    const res = await onDeleteProduct(unlockedPin, productId);
    setConfirmDeleteId(null);
    setFeedback(
      res.ok
        ? `Đã xóa sản phẩm "${productName}" khỏi cửa hàng.`
        : res.message || 'Không thể xóa sản phẩm.'
    );
  };

  const handlePickHeroImageAndEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!unlockedPin || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    e.target.value = '';
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditorConfig({
        sourceUrl: dataUrl,
        filename: file.name,
        onDone: async (editedDataUrl, fname) => {
          setUploadingFormImg(true);
          try {
            const url = await uploadDataUrlToServer(unlockedPin, editedDataUrl, fname);
            setDraftProfile((prev) => ({ ...prev, heroImage: url }));
            setEditorConfig(null);
            setFeedback('Đã chỉnh sửa ảnh bìa Giới thiệu. Nhấn "Lưu Giới thiệu & Địa chỉ" để áp dụng.');
          } catch (err) {
            setFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh.');
          } finally {
            setUploadingFormImg(false);
          }
        },
      });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Không đọc được tệp ảnh.');
    }
  };

  const handlePickAddressImageAndEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!unlockedPin || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    e.target.value = '';
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setEditorConfig({
        sourceUrl: dataUrl,
        filename: file.name,
        onDone: async (editedDataUrl, fname) => {
          setUploadingFormImg(true);
          try {
            const url = await uploadDataUrlToServer(unlockedPin, editedDataUrl, fname);
            setDraftProfile((prev) => ({ ...prev, addressImage: url }));
            setEditorConfig(null);
            setFeedback('Đã chỉnh sửa ảnh địa chỉ ở chân trang. Nhấn "Lưu Giới thiệu & Địa chỉ" để áp dụng.');
          } catch (err) {
            setFeedback(err instanceof Error ? err.message : 'Lỗi tải ảnh.');
          } finally {
            setUploadingFormImg(false);
          }
        },
      });
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Không đọc được tệp ảnh.');
    }
  };

  const handleSubmitStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin) return;
    if (!draftProfile.address.trim() || !draftProfile.phone1.trim()) {
      setFeedback('Vui lòng nhập đầy đủ Địa chỉ và Số điện thoại chính.');
      return;
    }
    const cleanBullets = draftProfile.heroBullets.map((b) => b.trim()).filter(Boolean);
    const payload: StoreProfile = {
      ...draftProfile,
      brandShort: draftProfile.brandShort.trim() || DEFAULT_STORE_PROFILE.brandShort,
      brandFull: draftProfile.brandFull.trim() || DEFAULT_STORE_PROFILE.brandFull,
      address: draftProfile.address.trim(),
      mergedAddress: draftProfile.mergedAddress.trim(),
      phone1: draftProfile.phone1.trim(),
      phone2: draftProfile.phone2.trim(),
      hours: draftProfile.hours.trim() || DEFAULT_STORE_PROFILE.hours,
      heroTitle: draftProfile.heroTitle.trim() || DEFAULT_STORE_PROFILE.heroTitle,
      heroSubtitle: draftProfile.heroSubtitle.trim() || DEFAULT_STORE_PROFILE.heroSubtitle,
      heroBullets:
        cleanBullets.length > 0 ? cleanBullets : DEFAULT_STORE_PROFILE.heroBullets,
    };

    setSavingProfile(true);
    setFeedback(null);
    const res = await onSaveStoreProfile(unlockedPin, payload);
    setSavingProfile(false);
    setFeedback(
      res.ok
        ? 'Đã lưu thông tin Giới thiệu, Địa chỉ & Số điện thoại mới cho website.'
        : res.message || 'Không thể lưu thông tin cửa hàng.'
    );
  };

  const handleAddDraftCategory = () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    if (draftCategories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      setFeedback(`Danh mục "${label}" đã tồn tại.`);
      return;
    }
    let candidateId = slugifyCategory(label) || `cat-${Date.now()}`;
    if (draftCategories.some((c) => c.id === candidateId)) {
      candidateId = `${candidateId}-${Date.now().toString().slice(-4)}`;
    }
    setDraftCategories((prev) => [...prev, { id: candidateId, label }]);
    setNewCategoryLabel('');
    setFeedback(
      `Đã thêm danh mục "${label}" vào danh sách nháp. Nhấn "Lưu danh mục" để áp dụng lên web.`
    );
  };

  const handleMoveDraftCategory = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= draftCategories.length) return;
    setDraftCategories((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIdx, 0, moved);
      return copy;
    });
  };

  const handleSaveCategoriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin) return;
    const cleaned = draftCategories
      .map((c) => ({ id: c.id.trim(), label: c.label.trim() }))
      .filter((c) => c.id && c.label);
    if (cleaned.length === 0) {
      setFeedback('Cần giữ lại ít nhất 1 danh mục sản phẩm.');
      return;
    }
    setSavingCategories(true);
    setFeedback(null);
    const res = await onSaveCategories(unlockedPin, cleaned);
    setSavingCategories(false);
    setFeedback(
      res.ok
        ? 'Đã lưu danh sách danh mục (thêm, đổi tên, bớt/xóa) lên trang Sản phẩm.'
        : res.message || 'Không thể lưu danh mục.'
    );
  };

  const handleRestoreDefaultCategories = async () => {
    if (!unlockedPin) return;
    setSavingCategories(true);
    setFeedback(null);
    const res = await onSaveCategories(unlockedPin, null);
    setSavingCategories(false);
    if (res.ok) {
      setDraftCategories(
        CATEGORY_OPTIONS.filter((c) => c.id !== 'all').map((c) => ({
          id: String(c.id),
          label: c.label,
        }))
      );
      setFeedback('Đã khôi phục toàn bộ danh mục mặc định ban đầu.');
    } else {
      setFeedback(res.message || 'Không thể khôi phục danh mục.');
    }
  };

  const handleSubmitEstimator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin) return;
    setSavingEstimator(true);
    setFeedback(null);
    const res = await onSaveEstimatorConfig(unlockedPin, draftEstimator);
    setSavingEstimator(false);
    setFeedback(
      res.ok
        ? 'Đã lưu cài đặt mục Dự toán (tiêu đề, định mức, sản phẩm áp giá & cam kết).'
        : res.message || 'Không thể lưu mục Dự toán.'
    );
  };

  const handleRestoreDefaultEstimator = async () => {
    if (!unlockedPin) return;
    setSavingEstimator(true);
    setFeedback(null);
    const res = await onSaveEstimatorConfig(unlockedPin, null);
    setSavingEstimator(false);
    if (res.ok) {
      setDraftEstimator(mergeEstimatorConfig(DEFAULT_ESTIMATOR_CONFIG));
      setFeedback('Đã khôi phục mục Dự toán về mặc định ban đầu.');
    } else {
      setFeedback(res.message || 'Không thể khôi phục mục Dự toán.');
    }
  };

  const renderEstimatorLineEditor = (
    title: string,
    rateLabel: string,
    line: EstimatorLineConfig,
    onChange: (next: EstimatorLineConfig) => void
  ) => {
    const selectedProduct =
      products.find((p) => p.id === line.productId) ?? products[0];
    const variants = selectedProduct?.variants ?? [];
    const selectedVariantId = variants.some((v) => v.id === line.variantId)
      ? line.variantId
      : variants[0]?.id ?? '';

    return (
      <div
        className="p-3.5 rounded-lg border bg-white space-y-2.5"
        style={{ borderColor: 'var(--theme-border)' }}
      >
        <div className="text-xs font-bold">{title}</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-4">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--theme-muted)' }}>
              Sản phẩm lấy giá
            </label>
            <select
              value={selectedProduct?.id ?? ''}
              onChange={(e) => {
                const nextProd = products.find((p) => p.id === e.target.value);
                onChange({
                  ...line,
                  productId: e.target.value,
                  variantId: nextProd?.variants[0]?.id ?? '',
                });
              }}
              className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs focus:outline-none"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--theme-muted)' }}>
              Quy cách & Đơn giá
            </label>
            <select
              value={selectedVariantId}
              onChange={(e) => onChange({ ...line, variantId: e.target.value })}
              className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs focus:outline-none"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} ({formatVND(v.price)} / {v.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--theme-muted)' }}>
              {rateLabel}
            </label>
            <input
              type="number"
              step="any"
              min={0.001}
              required
              value={line.rate}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                onChange({ ...line, rate: Number.isFinite(v) && v > 0 ? v : 1 });
              }}
              className="w-full h-9 px-2.5 rounded-lg border bg-white font-sans tabular-nums text-xs font-semibold focus:outline-none"
              style={{ borderColor: 'var(--theme-border)' }}
            />
          </div>

          <div className="md:col-span-12">
            <input
              type="text"
              value={line.note}
              onChange={(e) => onChange({ ...line, note: e.target.value })}
              placeholder="Ghi chú hiển thị dưới dòng vật tư..."
              className="w-full h-9 px-2.5 rounded-lg border text-xs focus:outline-none"
              style={{
                backgroundColor: 'var(--theme-bg)',
                borderColor: 'var(--theme-border)',
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  const visibleProducts = products.filter(
    (p) => filterCat === 'all' || p.category === filterCat
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-mgr-title"
        onClick={onClose}
      >
        <div
          className="w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
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
            <div>
              <h2 id="price-mgr-title" className="text-lg font-bold">
                Quản lý cửa hàng VLXD Huệ Hảo
              </h2>
              <p className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                {updatedAt
                  ? `Cập nhật gần nhất: ${new Date(updatedAt).toLocaleString('vi-VN')}`
                  : 'Chỉnh giá, tự thêm/sửa sản phẩm, cắt chỉnh ảnh và đổi màu giao diện'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng quản lý cửa hàng"
              className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-black/5 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!unlockedPin ? (
            <form onSubmit={handleUnlock} className="p-8 max-w-md mx-auto w-full space-y-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--theme-surface-alt)' }}
              >
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Xác nhận quyền chủ cửa hàng Huệ Hảo</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--theme-ink-soft)' }}>
                  Nhập mã PIN để thêm hoặc chỉnh sửa sản phẩm theo ý muốn, cắt chỉnh hình ảnh và cập nhật bảng giá mới nhất.
                </p>
              </div>

              {pinError && (
                <div
                  className="p-3 rounded-lg border text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(196, 30, 37, 0.1)',
                    borderColor: 'rgba(196, 30, 37, 0.3)',
                    color: 'var(--theme-accent)',
                  }}
                >
                  {pinError}
                </div>
              )}

              <div>
                <label htmlFor="owner-pin-input" className="block text-xs font-medium mb-1.5">
                  Nhập mật khẩu
                </label>
                <input
                  id="owner-pin-input"
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Nhập mã PIN..."
                  autoFocus
                  className="w-full h-11 px-3.5 rounded-lg border font-mono text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full h-11 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-ink)',
                }}
              >
                {verifying ? 'Đang kiểm tra...' : 'Mở trình quản lý'}
              </button>
            </form>
          ) : (
            <>
              {/* Navigation Tabs inside Store Manager */}
              <div
                className="px-6 pt-3 pb-3 border-b flex flex-wrap items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--theme-surface)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div
                  className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl"
                  style={{ backgroundColor: 'var(--theme-surface-alt)' }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('prices');
                      setFeedback(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                    style={
                      activeTab === 'prices'
                        ? {
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    <PencilLine className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Bảng giá & Màu sắc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('categories');
                      setFeedback(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                    style={
                      activeTab === 'categories'
                        ? {
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    <FolderCog className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Danh mục ({categories.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetProductForm();
                      setActiveTab('add');
                      setFeedback(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                    style={
                      activeTab === 'add'
                        ? {
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {editingProductId ? 'Đang sửa sản phẩm' : 'Tự thêm sản phẩm mới'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('media-delete');
                      setFeedback(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                    style={
                      activeTab === 'media-delete'
                        ? {
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sửa SP, Chỉnh ảnh & Xóa ({products.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('store-info');
                      setFeedback(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                    style={
                      activeTab === 'store-info'
                        ? {
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Giới thiệu & Địa chỉ, SĐT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('estimator');
                      setFeedback(null);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                    style={
                      activeTab === 'estimator'
                        ? {
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mục Dự toán</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="h-9 px-3 rounded-lg border text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    style={{ borderColor: 'var(--theme-border)' }}
                    title="Tải về file sao lưu toàn bộ bảng giá, sản phẩm và thông tin cửa hàng"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sao lưu</span>
                  </button>
                  <label
                    className="h-9 px-3 rounded-lg border text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    style={{ borderColor: 'var(--theme-border)' }}
                    title="Khôi phục dữ liệu từ file sao lưu .json"
                  >
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Khôi phục</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file || !unlockedPin) return;
                        try {
                          const text = await file.text();
                          const parsed = JSON.parse(text) as unknown;
                          const res = await onImportBackup(unlockedPin, parsed);
                          setFeedback(
                            res.ok
                              ? 'Đã khôi phục toàn bộ dữ liệu cửa hàng từ tệp sao lưu.'
                              : res.message || 'Khôi phục thất bại.'
                          );
                        } catch {
                          setFeedback('Tệp sao lưu JSON không hợp lệ.');
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChangePin((v) => !v)}
                    className="h-9 px-3 rounded-lg border text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Đổi mã PIN</span>
                  </button>
                </div>
              </div>

              {storageMode === 'temporary' && (
                <div
                  className="mx-6 mt-4 p-3 rounded-lg border text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'rgba(250, 204, 21, 0.14)',
                    borderColor: 'rgba(202, 138, 4, 0.35)',
                    color: 'var(--theme-ink)',
                  }}
                >
                  <strong>Lưu ý lưu trữ trên Vercel:</strong> Hiện chưa gắn{' '}
                  <span className="font-mono">Upstash Redis / Vercel KV</span> nên dữ liệu mới sửa chỉ lưu tạm thời. Để lưu vĩnh viễn cho mọi khách hàng, bạn hãy thêm <strong>Upstash Redis</strong> (miễn phí) trong mục Storage của Vercel hoặc nhấn nút <strong>Sao lưu</strong> để tải tệp lưu về máy.
                </div>
              )}

              {showChangePin && (
                <form
                  onSubmit={handleChangePin}
                  className="px-6 py-3 border-b flex flex-wrap items-center gap-2"
                  style={{
                    backgroundColor: 'var(--theme-surface-alt)',
                    borderColor: 'var(--theme-border)',
                  }}
                >
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Mã PIN mới (4-12 ký tự)"
                    required
                    minLength={4}
                    maxLength={12}
                    className="h-9 px-3 rounded-lg border bg-white font-mono text-xs"
                    style={{ borderColor: 'var(--theme-border)' }}
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--theme-accent)',
                      color: 'var(--theme-accent-ink)',
                    }}
                  >
                    Lưu PIN mới
                  </button>
                  {pinChangeMsg && <span className="text-xs font-medium ml-2">{pinChangeMsg}</span>}
                </form>
              )}

              {feedback && (
                <div
                  className="mx-6 mt-4 p-3 rounded-lg border text-xs font-medium flex items-center gap-2"
                  style={{
                    backgroundColor: 'rgba(24, 106, 66, 0.1)',
                    borderColor: 'rgba(24, 106, 66, 0.25)',
                    color: 'var(--theme-success)',
                  }}
                >
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{feedback}</span>
                </div>
              )}

              {/* TAB 1: PRICES & THEME */}
              {activeTab === 'prices' && (
                <>
                  {/* Theme Chooser Strip */}
                  <div
                    className="px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="inline-flex items-center gap-2 text-xs font-bold">
                      <Palette className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
                      <span>Lưu bảng màu mặc định của website:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveThemeToServer('red-cream')}
                        className="h-9 px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                        style={
                          currentTheme === 'red-cream'
                            ? {
                                backgroundColor: '#8E151B',
                                color: '#FFFFFF',
                                borderColor: '#8E151B',
                              }
                            : {
                                backgroundColor: '#FFFFFF',
                                color: '#1B1414',
                                borderColor: 'var(--theme-border)',
                              }
                        }
                      >
                        <span className="w-3 h-3 rounded-full bg-[#C41E25] border border-white/60" />
                        <span>Đỏ · Kem · Trắng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveThemeToServer('blue-gold')}
                        className="h-9 px-3.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                        style={
                          currentTheme === 'blue-gold'
                            ? {
                                backgroundColor: '#0D2E66',
                                color: '#FDE047',
                                borderColor: '#0D2E66',
                              }
                            : {
                                backgroundColor: '#FFFFFF',
                                color: '#0D1B36',
                                borderColor: 'var(--theme-border)',
                              }
                        }
                      >
                        <span className="w-3 h-3 rounded-full bg-[#FACC15] border border-[#0D2E66]" />
                        <span>Xanh dương · Vàng</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick % tool & filter */}
                  <div
                    className="px-6 py-3 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    style={{ borderColor: 'var(--theme-border)' }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <Percent
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--theme-accent)' }}
                          aria-hidden="true"
                        />
                        <span>Tăng/giảm nhanh theo nhóm:</span>
                      </span>
                      <select
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="h-9 px-2.5 rounded-lg border text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        {allCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.5"
                        value={bulkPercent}
                        onChange={(e) => setBulkPercent(Number(e.target.value))}
                        aria-label="Phần trăm điều chỉnh"
                        className="w-20 h-9 px-2.5 rounded-lg border font-mono tabular-nums text-xs font-semibold"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      />
                      <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                        %
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyBulkPercent}
                        className="h-9 px-3 rounded-lg text-xs font-medium cursor-pointer"
                        style={{
                          backgroundColor: 'var(--theme-brand-bg)',
                          color: '#FFFFFF',
                        }}
                      >
                        Áp dụng tạm
                      </button>
                    </div>

                    <select
                      value={filterCat}
                      onChange={(e) => setFilterCat(e.target.value)}
                      aria-label="Lọc nhóm sản phẩm cần sửa"
                      className="h-9 px-3 rounded-lg border text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <option value="all">Tất cả sản phẩm</option>
                      {allCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {visibleProducts.map((product) => (
                      <div
                        key={product.id}
                        className="border rounded-xl overflow-hidden"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <div
                          className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3"
                          style={{
                            backgroundColor: 'var(--theme-surface-alt)',
                            borderColor: 'var(--theme-border)',
                          }}
                        >
                          <div>
                            <div
                              className="text-xs uppercase tracking-wider font-medium"
                              style={{ color: 'var(--theme-muted)' }}
                            >
                              {product.categoryLabel} · {product.brand}
                            </div>
                            <h3 className="text-sm font-bold">{product.name}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                              Trạng thái:
                            </label>
                            <select
                              value={draftAvailability[product.id] ?? product.availabilityText}
                              onChange={(e) =>
                                setDraftAvailability((prev) => ({
                                  ...prev,
                                  [product.id]: e.target.value,
                                }))
                              }
                              className="h-8 px-2.5 rounded-lg border bg-white text-xs font-medium"
                              style={{ borderColor: 'var(--theme-border)' }}
                            >
                              <option value="Còn hàng tại kho">Còn hàng tại kho</option>
                              <option value="Sẵn mẫu tại cửa hàng">Sẵn mẫu tại cửa hàng</option>
                              <option value="Đặt trước 1–2 ngày">Đặt trước 1–2 ngày</option>
                              <option value="Tạm hết hàng">Tạm hết hàng</option>
                            </select>
                          </div>
                        </div>

                        <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                          {product.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                            >
                              <div className="min-w-0">
                                <div className="font-medium">{variant.label}</div>
                                <div
                                  className="text-xs font-mono"
                                  style={{ color: 'var(--theme-muted)' }}
                                >
                                  SKU: {variant.sku} · Đang hiển thị: {formatVND(variant.price)} /{' '}
                                  {variant.unit}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  step={500}
                                  value={draftPrices[variant.id] ?? variant.price}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setDraftPrices((prev) => ({
                                      ...prev,
                                      [variant.id]: Number.isFinite(val) && val >= 0 ? val : 0,
                                    }));
                                  }}
                                  aria-label={`Giá mới cho ${variant.label}`}
                                  className="w-36 h-9 px-3 rounded-lg border font-mono tabular-nums text-sm font-semibold text-right focus:outline-none"
                                  style={{
                                    backgroundColor: 'var(--theme-bg)',
                                    borderColor: 'var(--theme-border)',
                                  }}
                                />
                                <span
                                  className="text-xs w-16"
                                  style={{ color: 'var(--theme-muted)' }}
                                >
                                  ₫ / {variant.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const resetMap: Record<string, number> = {};
                        for (const p of products) {
                          for (const v of p.variants) {
                            resetMap[v.id] = v.price;
                          }
                        }
                        setDraftPrices(resetMap);
                        setFeedback('Đã khôi phục số liệu đang hiển thị.');
                      }}
                      className="h-10 px-4 rounded-lg border bg-white text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Hoàn tác</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-lg border bg-white text-sm font-medium hover:bg-black/5 cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSavePrices}
                        className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: 'var(--theme-accent-ink)',
                        }}
                      >
                        <Save className="w-4 h-4" aria-hidden="true" />
                        <span>{saving ? 'Đang lưu...' : 'Lưu & Đăng bảng giá mới'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: ADD OR EDIT CUSTOM PRODUCT */}
              {activeTab === 'add' && (
                <form
                  onSubmit={handleSubmitProductForm}
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
                >
                  {editingProductId && (
                    <div
                      className="p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <span className="font-semibold">
                        Đang sửa sản phẩm: <span className="underline">{formName}</span>
                      </span>
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="px-3 py-1 rounded-lg bg-white border font-medium cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        Chuyển sang tạo sản phẩm mới
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Tên sản phẩm *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ví dụ: Tôn lạnh Hoa Sen 4.5 dem"
                        className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Nhóm danh mục *
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        {allCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                        <option value="__custom__">+ Tự tạo danh mục mới theo ý muốn...</option>
                      </select>
                      {formCategory === '__custom__' && (
                        <input
                          type="text"
                          required
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          placeholder="Nhập tên nhóm mới (VD: Tôn & Xà gồ, Cửa cuốn...)"
                          className="mt-2 w-full h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-accent)' }}
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Thương hiệu / Nhà sản xuất
                      </label>
                      <input
                        type="text"
                        value={formBrand}
                        onChange={(e) => setFormBrand(e.target.value)}
                        placeholder="Ví dụ: Hoa Sen, Hà Tiên, Toàn Mỹ..."
                        className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Thời gian giao hàng
                      </label>
                      <input
                        type="text"
                        value={formLeadTime}
                        onChange={(e) => setFormLeadTime(e.target.value)}
                        placeholder="VD: Giao trong ngày / Xe cẩu tận nơi"
                        className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1.5">
                        Mô tả ngắn hiển thị ngoài thẻ sản phẩm
                      </label>
                      <input
                        type="text"
                        value={formShortDesc}
                        onChange={(e) => setFormShortDesc(e.target.value)}
                        placeholder="Mô tả quy cách, công dụng nổi bật..."
                        className="w-full h-11 px-3.5 rounded-lg border text-sm focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1.5">
                        Mô tả chi tiết (hiển thị khi bấm vào sản phẩm)
                      </label>
                      <textarea
                        rows={2}
                        value={formFullDesc}
                        onChange={(e) => setFormFullDesc(e.target.value)}
                        placeholder="Thông tin chi tiết về chất lượng, chính sách đổi trả, giao hàng..."
                        className="w-full p-3 rounded-lg border text-sm focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Variants builder */}
                  <div
                    className="p-4 rounded-xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Quy cách & Đơn giá bán *
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormVariants((prev) => [
                            ...prev,
                            { label: '', unit: 'cái', price: 100000 },
                          ])
                        }
                        className="h-8 px-3 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        style={{
                          backgroundColor: 'var(--theme-brand-bg)',
                          color: '#FFFFFF',
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Thêm quy cách</span>
                      </button>
                    </div>

                    {formVariants.map((v, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <input
                          type="text"
                          required
                          value={v.label}
                          onChange={(e) =>
                            setFormVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, label: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Tên quy cách (VD: Khổ 1,07m · 4.5 dem)"
                          className="sm:col-span-6 h-10 px-3 rounded-lg border bg-white text-xs"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                        <input
                          type="text"
                          required
                          value={v.unit}
                          onChange={(e) =>
                            setFormVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, unit: e.target.value } : item
                              )
                            )
                          }
                          placeholder="Đơn vị"
                          className="sm:col-span-2 h-10 px-3 rounded-lg border bg-white text-xs"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                        <input
                          type="number"
                          min={0}
                          step={500}
                          required
                          value={v.price}
                          onChange={(e) =>
                            setFormVariants((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, price: Number(e.target.value) || 0 }
                                  : item
                              )
                            )
                          }
                          placeholder="Đơn giá ₫"
                          className="sm:col-span-3 h-10 px-3 rounded-lg border bg-white font-mono tabular-nums text-xs font-semibold"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                        <button
                          type="button"
                          disabled={formVariants.length <= 1}
                          onClick={() =>
                            setFormVariants((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Xóa quy cách này"
                          className="sm:col-span-1 h-10 rounded-lg border bg-white hover:text-[#B03514] disabled:opacity-30 flex items-center justify-center cursor-pointer"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Specs builder */}
                  <div
                    className="p-4 rounded-xl border space-y-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Thông số kỹ thuật (hiện khi xem chi tiết & so sánh)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormSpecs((prev) => [...prev, { label: '', value: '' }])
                        }
                        className="h-8 px-3 rounded-lg bg-white border text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Thêm thông số</span>
                      </button>
                    </div>
                    {formSpecs.map((spec, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={spec.label}
                          onChange={(e) =>
                            setFormSpecs((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, label: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Tên thông số (VD: Độ dày)"
                          className="sm:col-span-5 h-9 px-3 rounded-lg border bg-white text-xs"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) =>
                            setFormSpecs((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, value: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Giá trị (VD: 4.5 dem · AZ100)"
                          className="sm:col-span-6 h-9 px-3 rounded-lg border bg-white text-xs"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormSpecs((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Xóa thông số"
                          className="sm:col-span-1 h-9 rounded-lg border bg-white flex items-center justify-center cursor-pointer"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Upload & Edit Primary & Extra Images */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className="p-4 rounded-xl border space-y-3"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-bold">
                        Ảnh đại diện sản phẩm (Có sẵn cắt/xoay/chỉnh sáng)
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          <ImagePlus
                            className="w-4 h-4"
                            style={{ color: 'var(--theme-accent)' }}
                            aria-hidden="true"
                          />
                          <span>{uploadingFormImg ? 'Đang xử lý...' : 'Chọn & sửa ảnh từ máy'}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePickPrimaryAndEdit}
                            className="sr-only"
                          />
                        </label>
                        {formPrimaryImage && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditorForUrl(formPrimaryImage, (url) =>
                                setFormPrimaryImage(url)
                              )
                            }
                            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <Crop className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                            <span>Chỉnh sửa ảnh này</span>
                          </button>
                        )}
                      </div>
                      {formPrimaryImage && (
                        <div className="w-36 aspect-[4/3] rounded-lg overflow-hidden border border-black/10">
                          <ResilientImage
                            src={formPrimaryImage}
                            alt="Ảnh đại diện mới"
                            fallbackTitle="Ảnh xem trước"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div
                      className="p-4 rounded-xl border space-y-3"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-bold">
                        Up thêm nhiều hình ảnh chi tiết (tối đa 6 ảnh)
                      </div>
                      <label
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <ImagePlus
                          className="w-4 h-4"
                          style={{ color: 'var(--theme-accent)' }}
                          aria-hidden="true"
                        />
                        <span>{uploadingFormImg ? 'Đang tải...' : 'Chọn nhiều ảnh bổ sung'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleUploadNewExtras}
                          className="sr-only"
                        />
                      </label>
                      {formExtraImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formExtraImages.map((url, idx) => (
                            <div
                              key={url + idx}
                              className="relative w-20 aspect-[4/3] rounded-lg overflow-hidden border border-black/10"
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditorForUrl(url, (newUrl) =>
                                    setFormExtraImages((prev) =>
                                      prev.map((item, i) => (i === idx ? newUrl : item))
                                    )
                                  )
                                }
                                aria-label="Chỉnh sửa ảnh này"
                                title="Chỉnh sửa ảnh"
                                className="absolute bottom-0.5 left-0.5 w-5 h-5 rounded bg-black/75 text-white flex items-center justify-center cursor-pointer"
                              >
                                <Crop className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormExtraImages((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                aria-label="Xóa ảnh này"
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/75 text-white flex items-center justify-center cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-11 px-5 rounded-lg border bg-white text-sm font-medium cursor-pointer"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={submittingProduct || uploadingFormImg}
                      className="h-11 px-6 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      style={{
                        backgroundColor: 'var(--theme-accent)',
                        color: 'var(--theme-accent-ink)',
                      }}
                    >
                      <Save className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {submittingProduct
                          ? 'Đang lưu...'
                          : editingProductId
                          ? 'Lưu thay đổi sản phẩm'
                          : 'Đăng sản phẩm mới'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: EDIT PRODUCT, EDIT/UPLOAD IMAGES & DELETE */}
              {activeTab === 'media-delete' && (
                <>
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {products.map((product) => {
                      const extras = product.extraImages ?? [];
                      const isUploading = uploadingForId === product.id;
                      const isConfirmingDel = confirmDeleteId === product.id;

                      return (
                        <div
                          key={product.id}
                          className="p-4 rounded-xl border bg-white flex flex-col gap-4"
                          style={{ borderColor: 'var(--theme-border)' }}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div
                                className="w-20 aspect-[4/3] rounded-lg overflow-hidden shrink-0"
                                style={{ backgroundColor: 'var(--theme-surface-muted)' }}
                              >
                                <ResilientImage
                                  src={product.image}
                                  alt={product.name}
                                  fallbackTitle={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div
                                  className="text-xs uppercase font-medium"
                                  style={{ color: 'var(--theme-muted)' }}
                                >
                                  {product.categoryLabel} · {product.brand}
                                </div>
                                <h3 className="text-sm font-bold truncate">{product.name}</h3>
                                <div className="text-xs mt-0.5" style={{ color: 'var(--theme-muted)' }}>
                                  {1 + extras.length} hình ảnh · {product.variants.length} quy cách
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => loadProductIntoForm(product)}
                                className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--theme-brand-bg)',
                                  color: '#FFFFFF',
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Sửa thông tin SP</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditorForUrl(product.image, async (newUrl) => {
                                    const res = await onUpdateProductImages(
                                      unlockedPin,
                                      product.id,
                                      newUrl,
                                      extras
                                    );
                                    if (res.ok) {
                                      setFeedback(`Đã chỉnh sửa ảnh bìa cho "${product.name}".`);
                                    }
                                  })
                                }
                                className="h-9 px-3 rounded-lg border text-xs font-semibold hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--theme-surface-alt)',
                                  borderColor: 'var(--theme-border)',
                                }}
                              >
                                <Crop
                                  className="w-3.5 h-3.5"
                                  style={{ color: 'var(--theme-accent)' }}
                                  aria-hidden="true"
                                />
                                <span>Chỉnh ảnh bìa</span>
                              </button>

                              <label
                                className="h-9 px-3 rounded-lg border text-xs font-semibold hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--theme-surface-alt)',
                                  borderColor: 'var(--theme-border)',
                                }}
                              >
                                <ImagePlus
                                  className="w-3.5 h-3.5"
                                  style={{ color: 'var(--theme-accent)' }}
                                  aria-hidden="true"
                                />
                                <span>{isUploading ? 'Đang tải...' : 'Đổi ảnh mới'}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => {
                                    handleUploadExtraForExisting(product, e.target.files, true);
                                    e.target.value = '';
                                  }}
                                  className="sr-only"
                                />
                              </label>

                              <label
                                className="h-9 px-3 rounded-lg border text-xs font-semibold hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                                style={{
                                  backgroundColor: 'var(--theme-surface-alt)',
                                  borderColor: 'var(--theme-border)',
                                }}
                              >
                                <Plus
                                  className="w-3.5 h-3.5"
                                  style={{ color: 'var(--theme-accent)' }}
                                  aria-hidden="true"
                                />
                                <span>Up thêm hình</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/jpeg,image/png,image/webp"
                                  onChange={(e) => {
                                    handleUploadExtraForExisting(product, e.target.files, false);
                                    e.target.value = '';
                                  }}
                                  className="sr-only"
                                />
                              </label>

                              {isConfirmingDel ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelete(product.id, product.name)}
                                    className="h-9 px-3 rounded-lg text-white text-xs font-semibold cursor-pointer"
                                    style={{ backgroundColor: 'var(--theme-accent)' }}
                                  >
                                    Xác nhận xóa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="h-9 px-2.5 rounded-lg border text-xs cursor-pointer"
                                    style={{ borderColor: 'var(--theme-border)' }}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(product.id)}
                                  className="h-9 px-3 rounded-lg border text-xs font-semibold hover:bg-black/5 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  style={{
                                    borderColor: 'rgba(196, 30, 37, 0.35)',
                                    color: 'var(--theme-accent)',
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Xóa</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {extras.length > 0 && (
                            <div
                              className="pt-3 border-t flex flex-wrap items-center gap-2"
                              style={{ borderColor: 'var(--theme-border)' }}
                            >
                              <span className="text-xs mr-1" style={{ color: 'var(--theme-muted)' }}>
                                Hình ảnh bổ sung:
                              </span>
                              {extras.map((url, idx) => (
                                <div
                                  key={url + idx}
                                  className="relative w-20 aspect-[4/3] rounded-lg overflow-hidden border border-black/10"
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenEditorForUrl(url, async (newUrl) => {
                                        const nextExtras = extras.map((u, i) =>
                                          i === idx ? newUrl : u
                                        );
                                        const res = await onUpdateProductImages(
                                          unlockedPin,
                                          product.id,
                                          undefined,
                                          nextExtras
                                        );
                                        if (res.ok) {
                                          setFeedback(`Đã chỉnh sửa ảnh phụ cho "${product.name}".`);
                                        }
                                      })
                                    }
                                    aria-label="Chỉnh sửa ảnh bổ sung"
                                    title="Chỉnh sửa ảnh"
                                    className="absolute bottom-0.5 left-0.5 w-5 h-5 rounded bg-black/75 text-white flex items-center justify-center cursor-pointer"
                                  >
                                    <Crop className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExtraImage(product, url)}
                                    aria-label="Xóa ảnh bổ sung"
                                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded bg-black/75 text-white flex items-center justify-center cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    {deletedCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => unlockedPin && onRestoreDefaults(unlockedPin)}
                        className="h-10 px-4 rounded-lg border bg-white text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Khôi phục {deletedCount} sản phẩm gốc đã xóa</span>
                      </button>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                        Bạn có thể sửa toàn bộ thông tin, cắt chỉnh ánh sáng ảnh hoặc xóa sản phẩm.
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-5 rounded-lg text-sm font-medium cursor-pointer"
                      style={{
                        backgroundColor: 'var(--theme-brand-bg)',
                        color: '#FFFFFF',
                      }}
                    >
                      Xong
                    </button>
                  </div>
                </>
              )}

              {/* TAB 5: CATEGORY MANAGEMENT (ADD, RENAME, REORDER, DELETE) */}
              {activeTab === 'categories' && (
                <form
                  onSubmit={handleSaveCategoriesSubmit}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    <div
                      className="p-4 sm:p-5 rounded-xl border space-y-3"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider">
                        Thêm danh mục sản phẩm mới
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          value={newCategoryLabel}
                          onChange={(e) => setNewCategoryLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDraftCategory();
                            }
                          }}
                          placeholder="Nhập tên danh mục mới (VD: Tôn & Xà gồ, Ngói lợp, Đá hoa cương...)"
                          className="flex-1 h-10 px-3.5 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddDraftCategory}
                          className="h-10 px-4 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          style={{
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm vào danh sách</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-bold uppercase tracking-wider">
                          Danh sách danh mục hiển thị ({draftCategories.length})
                        </div>
                        <span className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                          Sửa trực tiếp tên danh mục, bấm mũi tên để đổi thứ tự hoặc bấm xóa để ẩn bớt.
                        </span>
                      </div>

                      <div
                        className="divide-y rounded-xl border bg-white overflow-hidden"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        {draftCategories.map((cat, idx) => {
                          const prodCount = products.filter(
                            (p) => p.category === cat.id
                          ).length;
                          return (
                            <div
                              key={cat.id}
                              className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center gap-2.5"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span
                                  className="font-mono text-xs font-bold w-6 text-center shrink-0"
                                  style={{ color: 'var(--theme-muted)' }}
                                >
                                  {idx + 1}.
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={cat.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftCategories((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, label: val } : item
                                      )
                                    );
                                  }}
                                  aria-label={`Tên danh mục ${cat.label}`}
                                  className="flex-1 h-10 px-3 rounded-lg border text-sm font-medium focus:outline-none"
                                  style={{
                                    backgroundColor: 'var(--theme-bg)',
                                    borderColor: 'var(--theme-border)',
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-8 sm:pl-0">
                                <span
                                  className="text-xs font-mono px-2 py-1 rounded bg-black/5 whitespace-nowrap"
                                  style={{ color: 'var(--theme-ink-soft)' }}
                                >
                                  {prodCount} sản phẩm
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveDraftCategory(idx, -1)}
                                    title="Đưa lên trước"
                                    aria-label="Đưa danh mục lên trước"
                                    className="w-9 h-9 rounded-lg border bg-white hover:bg-black/5 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                    style={{ borderColor: 'var(--theme-border)' }}
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === draftCategories.length - 1}
                                    onClick={() => handleMoveDraftCategory(idx, 1)}
                                    title="Đưa xuống sau"
                                    aria-label="Đưa danh mục xuống sau"
                                    className="w-9 h-9 rounded-lg border bg-white hover:bg-black/5 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                                    style={{ borderColor: 'var(--theme-border)' }}
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={draftCategories.length <= 1}
                                    onClick={() => {
                                      setDraftCategories((prev) =>
                                        prev.filter((_, i) => i !== idx)
                                      );
                                      setFeedback(
                                        `Đã xóa "${cat.label}" khỏi danh sách nháp. Nhấn "Lưu danh mục" để áp dụng (sản phẩm cũ vẫn xem được ở mục Tất cả sản phẩm).`
                                      );
                                    }}
                                    title="Xóa danh mục này"
                                    aria-label={`Xóa danh mục ${cat.label}`}
                                    className="h-9 px-2.5 rounded-lg border bg-white text-[#B03514] hover:bg-[#B03514]/10 disabled:opacity-30 inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                    style={{ borderColor: 'rgba(176,53,20,0.3)' }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div
                    className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <button
                      type="button"
                      disabled={savingCategories}
                      onClick={handleRestoreDefaultCategories}
                      className="h-10 px-4 rounded-lg border bg-white text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Khôi phục danh mục gốc</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-lg border bg-white text-sm font-medium hover:bg-black/5 cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={savingCategories}
                        className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: 'var(--theme-accent-ink)',
                        }}
                      >
                        <Save className="w-4 h-4" aria-hidden="true" />
                        <span>{savingCategories ? 'Đang lưu...' : 'Lưu danh mục'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 4: EDIT INTRO, ADDRESS, PHONES & LINKS */}
              {activeTab === 'store-info' && (
                <form
                  onSubmit={handleSubmitStoreProfile}
                  className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
                >
                  {/* Block 1: Contact, Address, Phones */}
                  <div
                    className="p-4 sm:p-5 rounded-xl border space-y-4"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">
                      1. Thông tin cửa hàng, Địa chỉ & Số điện thoại
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Tên ngắn trên thanh menu *
                        </label>
                        <input
                          type="text"
                          required
                          value={draftProfile.brandShort}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              brandShort: e.target.value,
                            }))
                          }
                          placeholder="VD: VLXD Huệ Hảo"
                          className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Tên đầy đủ cửa hàng *
                        </label>
                        <input
                          type="text"
                          required
                          value={draftProfile.brandFull}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              brandFull: e.target.value,
                            }))
                          }
                          placeholder="VD: Vật Liệu Xây Dựng Huệ Hảo"
                          className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <label className="text-xs font-semibold">
                            Địa chỉ cửa hàng *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const addr = draftProfile.address.trim();
                              if (!addr) return;
                              setDraftProfile((prev) => ({
                                ...prev,
                                googleMapsEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(
                                  addr
                                )}&hl=vi&z=16&output=embed`,
                              }));
                              setFeedback(
                                'Đã cập nhật khung bản đồ theo địa chỉ mới. Nhấn "Lưu Giới thiệu & Địa chỉ" để lưu.'
                              );
                            }}
                            className="text-[11px] font-semibold underline cursor-pointer"
                            style={{ color: 'var(--theme-accent)' }}
                          >
                            Cập nhật bản đồ theo địa chỉ này
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={draftProfile.address}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder="Số nhà, đường, khu phố, phường/xã, tỉnh..."
                          className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold mb-1.5">
                          Địa chỉ mới sau sáp nhập (hiển thị tại chân trang)
                        </label>
                        <input
                          type="text"
                          value={draftProfile.mergedAddress}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              mergedAddress: e.target.value,
                            }))
                          }
                          placeholder="VD: Phường Tân Đông Hiệp, TP. HCM"
                          className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Số điện thoại chính (Hotline 1) *
                        </label>
                        <input
                          type="text"
                          required
                          value={draftProfile.phone1}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({ ...prev, phone1: e.target.value }))
                          }
                          placeholder="VD: 0913 622 702"
                          className="w-full h-10 px-3 rounded-lg border bg-white font-mono text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Số điện thoại phụ (Hotline 2 - tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={draftProfile.phone2}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({ ...prev, phone2: e.target.value }))
                          }
                          placeholder="VD: 0913 884 702"
                          className="w-full h-10 px-3 rounded-lg border bg-white font-mono text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold mb-1.5">
                          Giờ mở cửa
                        </label>
                        <input
                          type="text"
                          value={draftProfile.hours}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({ ...prev, hours: e.target.value }))
                          }
                          placeholder="VD: 06:30 – 17:30 (Thứ 2 – Chủ nhật)"
                          className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold mb-1.5">
                          Lời mời liên hệ ở trang Liên hệ
                        </label>
                        <textarea
                          rows={2}
                          value={draftProfile.contactDesc}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              contactDesc: e.target.value,
                            }))
                          }
                          className="w-full p-3 rounded-lg border bg-white text-sm focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Link Zalo đặt hàng / tư vấn
                        </label>
                        <input
                          type="url"
                          value={draftProfile.zaloUrl}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              zaloUrl: e.target.value,
                            }))
                          }
                          placeholder="https://zalo.me/0913622702"
                          className="w-full h-10 px-3 rounded-lg border bg-white text-xs font-mono focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Link Google Maps chỉ đường
                        </label>
                        <input
                          type="url"
                          value={draftProfile.googleMapsUrl}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              googleMapsUrl: e.target.value,
                            }))
                          }
                          placeholder="https://maps.app.goo.gl/..."
                          className="w-full h-10 px-3 rounded-lg border bg-white text-xs font-mono focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Link Fanpage Facebook
                        </label>
                        <input
                          type="url"
                          value={draftProfile.fanpageUrl}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              fanpageUrl: e.target.value,
                            }))
                          }
                          placeholder="https://www.facebook.com/..."
                          className="w-full h-10 px-3 rounded-lg border bg-white text-xs font-mono focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1.5">
                          Link Facebook cá nhân chủ cửa hàng
                        </label>
                        <input
                          type="url"
                          value={draftProfile.facebookPersonalUrl}
                          onChange={(e) =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              facebookPersonalUrl: e.target.value,
                            }))
                          }
                          placeholder="https://www.facebook.com/..."
                          className="w-full h-10 px-3 rounded-lg border bg-white text-xs font-mono focus:outline-none"
                          style={{ borderColor: 'var(--theme-border)' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Intro Page Content & Hero Image */}
                  <div
                    className="p-4 sm:p-5 rounded-xl border space-y-4"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">
                      2. Nội dung & Ảnh trang Giới thiệu
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Tiêu đề lớn trang Giới thiệu *
                      </label>
                      <input
                        type="text"
                        required
                        value={draftProfile.heroTitle}
                        onChange={(e) =>
                          setDraftProfile((prev) => ({
                            ...prev,
                            heroTitle: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-semibold focus:outline-none"
                        style={{ borderColor: 'var(--theme-border)' }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Dòng mở đầu danh sách mặt hàng
                      </label>
                      <input
                        type="text"
                        value={draftProfile.heroSubtitle}
                        onChange={(e) =>
                          setDraftProfile((prev) => ({
                            ...prev,
                            heroSubtitle: e.target.value,
                          }))
                        }
                        className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                        style={{ borderColor: 'var(--theme-border)' }}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold">
                          Các gạch đầu dòng giới thiệu (nhấn + để thêm dòng mới)
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftProfile((prev) => ({
                              ...prev,
                              heroBullets: [...prev.heroBullets, ''],
                            }))
                          }
                          className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          style={{
                            backgroundColor: 'var(--theme-brand-bg)',
                            color: '#FFFFFF',
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm dòng</span>
                        </button>
                      </div>

                      {draftProfile.heroBullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold w-5 text-center">
                            –
                          </span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) =>
                              setDraftProfile((prev) => ({
                                ...prev,
                                heroBullets: prev.heroBullets.map((b, i) =>
                                  i === idx ? e.target.value : b
                                ),
                              }))
                            }
                            placeholder={`Gạch đầu dòng ${idx + 1}...`}
                            className="flex-1 h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                          <button
                            type="button"
                            disabled={draftProfile.heroBullets.length <= 1}
                            onClick={() =>
                              setDraftProfile((prev) => ({
                                ...prev,
                                heroBullets: prev.heroBullets.filter((_, i) => i !== idx),
                              }))
                            }
                            aria-label="Xóa dòng này"
                            className="h-10 w-10 rounded-lg border bg-white flex items-center justify-center cursor-pointer disabled:opacity-35"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Hero Image Picker + Editor */}
                    <div className="pt-2 space-y-2.5">
                      <div className="text-xs font-semibold">
                        Ảnh bìa trang Giới thiệu
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-36 aspect-[4/3] rounded-lg overflow-hidden border border-black/15 bg-black/5">
                          <ResilientImage
                            src={draftProfile.heroImage}
                            alt="Ảnh bìa Giới thiệu"
                            fallbackTitle={draftProfile.brandFull}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <ImagePlus
                              className="w-4 h-4"
                              style={{ color: 'var(--theme-accent)' }}
                            />
                            <span>{uploadingFormImg ? 'Đang xử lý...' : 'Chọn & sửa ảnh từ máy'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handlePickHeroImageAndEdit}
                              className="sr-only"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditorForUrl(draftProfile.heroImage, (newUrl) => {
                                setDraftProfile((prev) => ({ ...prev, heroImage: newUrl }));
                                setFeedback(
                                  'Đã chỉnh sửa ảnh bìa Giới thiệu. Nhấn "Lưu Giới thiệu & Địa chỉ" để lưu.'
                                );
                              })
                            }
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <Crop className="w-3.5 h-3.5" style={{ color: 'var(--theme-accent)' }} />
                            <span>Chỉnh sửa ảnh hiện tại</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer Address Image Picker + Editor */}
                    <div className="pt-3 space-y-2.5 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                      <div className="text-xs font-semibold">
                        Ảnh cửa hàng & địa chỉ ở chân trang (mặc định dùng chung ảnh bìa phía trên)
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-36 aspect-[4/3] rounded-lg overflow-hidden border border-black/15 bg-black/5">
                          <ResilientImage
                            src={draftProfile.addressImage || draftProfile.heroImage}
                            alt="Ảnh địa chỉ cửa hàng"
                            fallbackTitle={draftProfile.brandFull}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <label
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <ImagePlus
                              className="w-4 h-4"
                              style={{ color: 'var(--theme-accent)' }}
                            />
                            <span>{uploadingFormImg ? 'Đang xử lý...' : 'Chọn ảnh địa chỉ riêng'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handlePickAddressImageAndEdit}
                              className="sr-only"
                            />
                          </label>
                          {draftProfile.addressImage && (
                            <button
                              type="button"
                              onClick={() => {
                                setDraftProfile((prev) => ({ ...prev, addressImage: '' }));
                                setFeedback(
                                  'Đã chuyển ảnh chân trang về dùng chung Ảnh bìa Giới thiệu. Nhấn "Lưu Giới thiệu & Địa chỉ" để áp dụng.'
                                );
                              }}
                              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-white border text-xs font-semibold hover:bg-black/5 cursor-pointer"
                              style={{ borderColor: 'var(--theme-border)' }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Dùng lại ảnh bìa Giới thiệu</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftProfile({
                          ...DEFAULT_STORE_PROFILE,
                          heroBullets: [...DEFAULT_STORE_PROFILE.heroBullets],
                        });
                        setFeedback(
                          'Đã đưa về thông tin mặc định ban đầu. Nhấn "Lưu Giới thiệu & Địa chỉ" để áp dụng.'
                        );
                      }}
                      className="h-10 px-4 rounded-lg border bg-white text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục thông tin gốc</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-lg border bg-white text-sm font-medium cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile || uploadingFormImg}
                        className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: 'var(--theme-accent-ink)',
                        }}
                      >
                        <Save className="w-4 h-4" />
                        <span>{savingProfile ? 'Đang lưu...' : 'Lưu Giới thiệu & Địa chỉ'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 6: ESTIMATOR CONFIG */}
              {activeTab === 'estimator' && (
                <form
                  onSubmit={handleSubmitEstimator}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Block 1: Visibility & Headings */}
                    <div
                      className="p-4 sm:p-5 rounded-xl border space-y-4"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs font-bold uppercase tracking-wider">
                          1. Hiển thị & Tiêu đề trang Dự toán
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftEstimator.enabled}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                enabled: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 accent-[#B03514] cursor-pointer"
                          />
                          <span>Hiển thị mục "Dự toán" trên thanh menu website</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">
                            Dòng nhãn phụ phía trên
                          </label>
                          <input
                            type="text"
                            value={draftEstimator.eyebrow}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                eyebrow: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">
                            Tiêu đề chính trang Dự toán *
                          </label>
                          <input
                            type="text"
                            required
                            value={draftEstimator.title}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-semibold focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold mb-1.5">
                            Mô tả ngắn dưới tiêu đề
                          </label>
                          <input
                            type="text"
                            value={draftEstimator.subtitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                subtitle: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Tên tab 1
                          </label>
                          <input
                            type="text"
                            required
                            value={draftEstimator.slabTitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                slabTitle: e.target.value,
                              }))
                            }
                            className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs font-medium"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Tên tab 2
                          </label>
                          <input
                            type="text"
                            required
                            value={draftEstimator.wallTitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                wallTitle: e.target.value,
                              }))
                            }
                            className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs font-medium"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Tên tab 3
                          </label>
                          <input
                            type="text"
                            required
                            value={draftEstimator.tilingTitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                tilingTitle: e.target.value,
                              }))
                            }
                            className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs font-medium"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Tên tab 4
                          </label>
                          <input
                            type="text"
                            required
                            value={draftEstimator.adhesiveTitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                adhesiveTitle: e.target.value,
                              }))
                            }
                            className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs font-medium"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">
                            Tên tab 5
                          </label>
                          <input
                            type="text"
                            required
                            value={draftEstimator.paintTitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                paintTitle: e.target.value,
                              }))
                            }
                            className="w-full h-9 px-2.5 rounded-lg border bg-white text-xs font-medium"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Material Lines & Rates */}
                    <div
                      className="p-4 sm:p-5 rounded-xl border space-y-4"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider">
                        2. Chọn vật tư áp giá & Định mức tiêu hao
                      </div>

                      <div className="space-y-2.5">
                        <div className="text-xs font-semibold" style={{ color: 'var(--theme-accent)' }}>
                          Hạng mục 1: {draftEstimator.slabTitle}
                        </div>
                        {renderEstimatorLineEditor(
                          'Xi măng đổ bê tông',
                          'Định mức (bao / m³)',
                          draftEstimator.slabLines.cement,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              slabLines: { ...prev.slabLines, cement: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Sắt thép sàn',
                          'Định mức (kg / m³)',
                          draftEstimator.slabLines.steel,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              slabLines: { ...prev.slabLines, steel: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Cát đổ bê tông',
                          'Định mức (m³ / m³)',
                          draftEstimator.slabLines.sand,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              slabLines: { ...prev.slabLines, sand: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Đá đổ bê tông',
                          'Định mức (m³ / m³)',
                          draftEstimator.slabLines.stone,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              slabLines: { ...prev.slabLines, stone: next },
                            }))
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                        <div className="text-xs font-semibold" style={{ color: 'var(--theme-accent)' }}>
                          Hạng mục 2: {draftEstimator.wallTitle}
                        </div>
                        {renderEstimatorLineEditor(
                          'Gạch xây tường',
                          'Định mức (viên / m²)',
                          draftEstimator.wallLines.brick,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              wallLines: { ...prev.wallLines, brick: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Xi măng xây tô',
                          'Định mức (bao / m²)',
                          draftEstimator.wallLines.cement,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              wallLines: { ...prev.wallLines, cement: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Cát xây tô',
                          'Định mức (m³ / m²)',
                          draftEstimator.wallLines.sand,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              wallLines: { ...prev.wallLines, sand: next },
                            }))
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                        <div className="text-xs font-semibold" style={{ color: 'var(--theme-accent)' }}>
                          Hạng mục 3: {draftEstimator.tilingTitle}
                        </div>
                        {renderEstimatorLineEditor(
                          'Gạch ốp lát mặc định',
                          'Hệ số hao hụt mặc định (1.05 = +5%)',
                          draftEstimator.tilingLines.tile,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              tilingLines: { ...prev.tilingLines, tile: next },
                            }))
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                        <div className="text-xs font-semibold" style={{ color: 'var(--theme-accent)' }}>
                          Hạng mục 4: {draftEstimator.adhesiveTitle}
                        </div>
                        {renderEstimatorLineEditor(
                          'Keo dán gạch mặc định',
                          'Định mức tham khảo (kg / m²)',
                          draftEstimator.adhesiveLines.adhesive,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              adhesiveLines: { ...prev.adhesiveLines, adhesive: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Keo chà ron mặc định',
                          'Hệ số ron (1 = chuẩn NSX)',
                          draftEstimator.adhesiveLines.grout,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              adhesiveLines: { ...prev.adhesiveLines, grout: next },
                            }))
                        )}
                      </div>

                      <div className="space-y-2.5 pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                        <div className="text-xs font-semibold" style={{ color: 'var(--theme-accent)' }}>
                          Hạng mục 5: {draftEstimator.paintTitle}
                        </div>
                        {renderEstimatorLineEditor(
                          'Sơn phủ hoàn thiện',
                          'Độ phủ (m² / thùng)',
                          draftEstimator.paintLines.topcoat,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              paintLines: { ...prev.paintLines, topcoat: next },
                            }))
                        )}
                        {renderEstimatorLineEditor(
                          'Sơn lót chống kiềm',
                          'Độ phủ (m² / thùng)',
                          draftEstimator.paintLines.primer,
                          (next) =>
                            setDraftEstimator((prev) => ({
                              ...prev,
                              paintLines: { ...prev.paintLines, primer: next },
                            }))
                        )}
                      </div>
                    </div>

                    {/* Block 3: Right Column Commitment Copy */}
                    <div
                      className="p-4 sm:p-5 rounded-xl border space-y-4"
                      style={{
                        backgroundColor: 'var(--theme-surface-alt)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <div className="text-xs font-bold uppercase tracking-wider">
                        3. Nội dung Cam kết bên phải trang Dự toán
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">
                            Nhãn phụ cam kết
                          </label>
                          <input
                            type="text"
                            value={draftEstimator.rightEyebrow}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                rightEyebrow: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 rounded-lg border bg-white text-sm focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1.5">
                            Tiêu đề khối cam kết
                          </label>
                          <input
                            type="text"
                            value={draftEstimator.rightTitle}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                rightTitle: e.target.value,
                              }))
                            }
                            className="w-full h-10 px-3 rounded-lg border bg-white text-sm font-semibold focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold mb-1.5">
                            Đoạn giới thiệu cung ứng
                          </label>
                          <textarea
                            rows={2}
                            value={draftEstimator.rightDesc}
                            onChange={(e) =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                rightDesc: e.target.value,
                              }))
                            }
                            className="w-full p-3 rounded-lg border bg-white text-sm focus:outline-none"
                            style={{ borderColor: 'var(--theme-border)' }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">Các mục cam kết chi tiết</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftEstimator((prev) => ({
                                ...prev,
                                commitItems: [...prev.commitItems, { title: '', desc: '' }],
                              }))
                            }
                            className="h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            style={{
                              backgroundColor: 'var(--theme-brand-bg)',
                              color: '#FFFFFF',
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Thêm mục</span>
                          </button>
                        </div>

                        {draftEstimator.commitItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border bg-white space-y-2"
                            style={{ borderColor: 'var(--theme-border)' }}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                required
                                value={item.title}
                                onChange={(e) =>
                                  setDraftEstimator((prev) => ({
                                    ...prev,
                                    commitItems: prev.commitItems.map((c, i) =>
                                      i === idx ? { ...c, title: e.target.value } : c
                                    ),
                                  }))
                                }
                                placeholder="Tiêu đề cam kết..."
                                className="flex-1 h-9 px-3 rounded-lg border text-xs font-semibold focus:outline-none"
                                style={{ borderColor: 'var(--theme-border)' }}
                              />
                              <button
                                type="button"
                                disabled={draftEstimator.commitItems.length <= 1}
                                onClick={() =>
                                  setDraftEstimator((prev) => ({
                                    ...prev,
                                    commitItems: prev.commitItems.filter((_, i) => i !== idx),
                                  }))
                                }
                                aria-label="Xóa mục cam kết"
                                className="h-9 w-9 rounded-lg border bg-white flex items-center justify-center cursor-pointer disabled:opacity-35"
                                style={{ borderColor: 'var(--theme-border)' }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={item.desc}
                              onChange={(e) =>
                                setDraftEstimator((prev) => ({
                                  ...prev,
                                  commitItems: prev.commitItems.map((c, i) =>
                                    i === idx ? { ...c, desc: e.target.value } : c
                                  ),
                                }))
                              }
                              placeholder="Nội dung chi tiết..."
                              className="w-full p-2.5 rounded-lg border text-xs focus:outline-none"
                              style={{ borderColor: 'var(--theme-border)' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--theme-surface-alt)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <button
                      type="button"
                      disabled={savingEstimator}
                      onClick={handleRestoreDefaultEstimator}
                      className="h-10 px-4 rounded-lg border bg-white text-xs font-medium hover:bg-black/5 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      style={{ borderColor: 'var(--theme-border)' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Khôi phục mặc định</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-10 px-4 rounded-lg border bg-white text-sm font-medium hover:bg-black/5 cursor-pointer"
                        style={{ borderColor: 'var(--theme-border)' }}
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={savingEstimator}
                        className="h-10 px-5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60"
                        style={{
                          backgroundColor: 'var(--theme-accent)',
                          color: 'var(--theme-accent-ink)',
                        }}
                      >
                        <Save className="w-4 h-4" aria-hidden="true" />
                        <span>{savingEstimator ? 'Đang lưu...' : 'Lưu mục Dự toán'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* In-browser Image Editor */}
      <ImageEditorModal
        isOpen={Boolean(editorConfig)}
        sourceUrl={editorConfig?.sourceUrl ?? null}
        filename={editorConfig?.filename}
        onClose={() => setEditorConfig(null)}
        onApply={async (dataUrl, fname) => {
          if (editorConfig) {
            await editorConfig.onDone(dataUrl, fname);
          }
        }}
      />
    </>
  );
}
