import type { Express, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';

export type StorageMode = 'kv' | 'disk' | 'temporary';

export interface StoreProfileState {
  brandShort: string;
  brandFull: string;
  address: string;
  mergedAddress: string;
  phone1: string;
  phone2: string;
  hours: string;
  zaloUrl: string;
  googleMapsUrl: string;
  googleMapsEmbedUrl: string;
  fanpageUrl: string;
  facebookPersonalUrl: string;
  contactDesc: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBullets: string[];
  heroImage: string;
  addressImage: string;
}

export interface CategoryItem {
  id: string;
  label: string;
}

export interface CatalogState {
  updatedAt: string | null;
  theme?: 'red-cream' | 'blue-gold';
  storeProfile?: Partial<StoreProfileState>;
  categories?: CategoryItem[];
  estimatorConfig?: Record<string, unknown>;
  prices: Record<string, number>;
  availability: Record<string, string>;
  deletedProductIds: string[];
  customProducts: unknown[];
  editedProducts: Record<string, unknown>;
  primaryImageOverrides: Record<string, string>;
  extraImagesByProduct: Record<string, string[]>;
}

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), 'data');
const TMP_DATA_DIR = path.join('/tmp', 'vlxd-huehao-data');

const KV_CATALOG_KEY = 'huehao:catalog_state_v1';
const KV_PIN_KEY = 'huehao:owner_pin_v1';
const KV_ORDERS_KEY = 'huehao:orders_v1';
const KV_UPLOAD_PREFIX = 'huehao:upload:';

function getKvConfig(): { url: string; token: string } | null {
  const url = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '');
  const token = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ''
  ).trim();
  if (!url || !token) return null;
  return { url, token };
}

let cachedWritableDir: { dir: string; mode: 'disk' | 'temporary' } | null = null;

function resolveWritableDataDir(): { dir: string; mode: 'disk' | 'temporary' } {
  if (cachedWritableDir) return cachedWritableDir;

  // Test if local ./data is writable (works in AI Studio, Cloud Run, VPS, localhost)
  if (!process.env.VERCEL) {
    try {
      fs.mkdirSync(BUNDLED_DATA_DIR, { recursive: true });
      fs.mkdirSync(path.join(BUNDLED_DATA_DIR, 'uploads'), { recursive: true });
      const probe = path.join(BUNDLED_DATA_DIR, '.write-probe');
      fs.writeFileSync(probe, 'ok', 'utf-8');
      fs.unlinkSync(probe);
      cachedWritableDir = { dir: BUNDLED_DATA_DIR, mode: 'disk' };
      return cachedWritableDir;
    } catch {
      // Fall through to /tmp
    }
  }

  // Serverless / read-only filesystem fallback (/tmp)
  fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(TMP_DATA_DIR, 'uploads'), { recursive: true });

  // Seed from bundled ./data on cold start if available
  const bundledState = path.join(BUNDLED_DATA_DIR, 'catalog-state.json');
  const tmpState = path.join(TMP_DATA_DIR, 'catalog-state.json');
  if (!fs.existsSync(tmpState) && fs.existsSync(bundledState)) {
    try {
      fs.copyFileSync(bundledState, tmpState);
    } catch {
      // Ignore seed error
    }
  }

  cachedWritableDir = { dir: TMP_DATA_DIR, mode: 'temporary' };
  return cachedWritableDir;
}

export function getStorageMode(): StorageMode {
  if (getKvConfig()) return 'kv';
  return resolveWritableDataDir().mode;
}

async function kvGetString(key: string): Promise<string | null> {
  const kv = getKvConfig();
  if (!kv) return null;
  try {
    const res = await fetch(`${kv.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: unknown };
    return typeof data.result === 'string' ? data.result : null;
  } catch {
    return null;
  }
}

async function kvSetString(key: string, value: string): Promise<boolean> {
  const kv = getKvConfig();
  if (!kv) return false;
  try {
    const res = await fetch(`${kv.url}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: value,
    });
    return res.ok;
  } catch {
    return false;
  }
}

function defaultCatalogState(): CatalogState {
  return {
    updatedAt: null,
    theme: 'red-cream',
    prices: {},
    availability: {},
    deletedProductIds: [],
    customProducts: [],
    editedProducts: {},
    primaryImageOverrides: {},
    extraImagesByProduct: {},
  };
}

function normalizeCatalogState(rawText: string): CatalogState {
  try {
    const parsed = JSON.parse(rawText) as Partial<CatalogState>;
    return {
      updatedAt: parsed.updatedAt ?? null,
      theme: parsed.theme === 'blue-gold' ? 'blue-gold' : 'red-cream',
      storeProfile:
        parsed.storeProfile && typeof parsed.storeProfile === 'object'
          ? parsed.storeProfile
          : undefined,
      categories: Array.isArray(parsed.categories)
        ? parsed.categories
            .filter(
              (c): c is CategoryItem =>
                Boolean(c) &&
                typeof c === 'object' &&
                typeof c.id === 'string' &&
                typeof c.label === 'string' &&
                c.id.trim().length > 0 &&
                c.id.trim() !== 'all' &&
                c.label.trim().length > 0
            )
            .map((c) => ({ id: c.id.trim().slice(0, 60), label: c.label.trim().slice(0, 60) }))
        : undefined,
      estimatorConfig:
        parsed.estimatorConfig && typeof parsed.estimatorConfig === 'object'
          ? parsed.estimatorConfig
          : undefined,
      prices: parsed.prices && typeof parsed.prices === 'object' ? parsed.prices : {},
      availability:
        parsed.availability && typeof parsed.availability === 'object'
          ? parsed.availability
          : {},
      deletedProductIds: Array.isArray(parsed.deletedProductIds)
        ? parsed.deletedProductIds
        : [],
      customProducts: Array.isArray(parsed.customProducts)
        ? parsed.customProducts
        : [],
      editedProducts:
        parsed.editedProducts && typeof parsed.editedProducts === 'object'
          ? parsed.editedProducts
          : {},
      primaryImageOverrides:
        parsed.primaryImageOverrides && typeof parsed.primaryImageOverrides === 'object'
          ? parsed.primaryImageOverrides
          : {},
      extraImagesByProduct:
        parsed.extraImagesByProduct && typeof parsed.extraImagesByProduct === 'object'
          ? parsed.extraImagesByProduct
          : {},
    };
  } catch {
    return defaultCatalogState();
  }
}

async function readCatalogState(): Promise<CatalogState> {
  if (getKvConfig()) {
    const kvRaw = await kvGetString(KV_CATALOG_KEY);
    if (kvRaw) return normalizeCatalogState(kvRaw);
    // Fall back to bundled data/catalog-state.json for initial seed if committed to GitHub
    const bundled = path.join(BUNDLED_DATA_DIR, 'catalog-state.json');
    if (fs.existsSync(bundled)) {
      try {
        return normalizeCatalogState(fs.readFileSync(bundled, 'utf-8'));
      } catch {
        return defaultCatalogState();
      }
    }
    return defaultCatalogState();
  }

  const { dir } = resolveWritableDataDir();
  const stateFile = path.join(dir, 'catalog-state.json');
  if (fs.existsSync(stateFile)) {
    try {
      return normalizeCatalogState(fs.readFileSync(stateFile, 'utf-8'));
    } catch {
      return defaultCatalogState();
    }
  }

  // Legacy migration if present
  const legacyFile = path.join(BUNDLED_DATA_DIR, 'price-overrides.json');
  if (fs.existsSync(legacyFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(legacyFile, 'utf-8')) as {
        updatedAt?: string | null;
        prices?: Record<string, number>;
        availability?: Record<string, string>;
      };
      return {
        ...defaultCatalogState(),
        updatedAt: parsed.updatedAt ?? null,
        prices: parsed.prices ?? {},
        availability: parsed.availability ?? {},
      };
    } catch {
      return defaultCatalogState();
    }
  }

  return defaultCatalogState();
}

async function writeCatalogState(state: CatalogState): Promise<void> {
  const json = JSON.stringify(state, null, 2);
  if (getKvConfig()) {
    const saved = await kvSetString(KV_CATALOG_KEY, json);
    if (!saved) {
      throw new Error('Không thể ghi dữ liệu vào Vercel KV / Upstash Redis.');
    }
    return;
  }
  const { dir } = resolveWritableDataDir();
  fs.writeFileSync(path.join(dir, 'catalog-state.json'), json, 'utf-8');
}

async function getOwnerPin(): Promise<string> {
  if (getKvConfig()) {
    const kvPin = await kvGetString(KV_PIN_KEY);
    if (kvPin && kvPin.trim()) return kvPin.trim();
  }
  const { dir } = resolveWritableDataDir();
  const pinFile = path.join(dir, 'owner-pin.json');
  const bundledPinFile = path.join(BUNDLED_DATA_DIR, 'owner-pin.json');
  const targetFile = fs.existsSync(pinFile)
    ? pinFile
    : fs.existsSync(bundledPinFile)
    ? bundledPinFile
    : null;
  if (!targetFile) {
    return (process.env.OWNER_PIN_DEFAULT || '1234').trim() || '1234';
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(targetFile, 'utf-8')) as { pin?: string };
    return typeof parsed.pin === 'string' && parsed.pin.trim().length > 0
      ? parsed.pin.trim()
      : '1234';
  } catch {
    return '1234';
  }
}

async function setOwnerPin(newPin: string): Promise<void> {
  if (getKvConfig()) {
    await kvSetString(KV_PIN_KEY, newPin);
    return;
  }
  const { dir } = resolveWritableDataDir();
  fs.writeFileSync(
    path.join(dir, 'owner-pin.json'),
    JSON.stringify({ pin: newPin }, null, 2),
    'utf-8'
  );
}

async function isValidPin(submittedPin: unknown): Promise<boolean> {
  if (typeof submittedPin !== 'string') return false;
  const actual = await getOwnerPin();
  return submittedPin.trim() === actual;
}

async function saveUploadedImage(
  fileName: string,
  mime: string,
  buffer: Buffer
): Promise<string> {
  if (getKvConfig()) {
    const payload = JSON.stringify({
      mime,
      b64: buffer.toString('base64'),
    });
    const ok = await kvSetString(`${KV_UPLOAD_PREFIX}${fileName}`, payload);
    if (!ok) {
      throw new Error('Không thể lưu ảnh vào Vercel KV / Upstash Redis.');
    }
    return `/api/uploads/${fileName}`;
  }

  const { dir } = resolveWritableDataDir();
  const uploadsDir = path.join(dir, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, fileName), buffer);
  return `/api/uploads/${fileName}`;
}

function mimeFromExt(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function readUploadedImage(
  fileName: string
): Promise<{ mime: string; buffer: Buffer } | null> {
  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) return null;

  // Check KV first if configured
  if (getKvConfig()) {
    const raw = await kvGetString(`${KV_UPLOAD_PREFIX}${fileName}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { mime?: string; b64?: string };
        if (typeof parsed.b64 === 'string') {
          return {
            mime: parsed.mime || mimeFromExt(fileName),
            buffer: Buffer.from(parsed.b64, 'base64'),
          };
        }
      } catch {
        // Ignore malformed KV record
      }
    }
  }

  // Check writable dir (/data or /tmp) and bundled ./data/uploads
  const { dir } = resolveWritableDataDir();
  const candidates = [
    path.join(dir, 'uploads', fileName),
    path.join(BUNDLED_DATA_DIR, 'uploads', fileName),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      try {
        return {
          mime: mimeFromExt(fileName),
          buffer: fs.readFileSync(filePath),
        };
      } catch {
        // Try next candidate
      }
    }
  }
  return null;
}

export function attachStoreApiRoutes(app: Express): void {
  const serveUpload = async (req: Request, res: Response) => {
    const fileName = String(req.params.filename || '').trim();
    const found = await readUploadedImage(fileName);
    if (!found) {
      res.status(404).send('Not found');
      return;
    }
    res.setHeader('Content-Type', found.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(found.buffer);
  };

  app.get('/api/uploads/:filename', serveUpload);
  app.get('/uploads/:filename', serveUpload);

  app.get('/api/catalog-state', async (_req, res) => {
    const state = await readCatalogState();
    res.json({ ...state, storageMode: getStorageMode() });
  });

  app.get('/api/prices', async (_req, res) => {
    const state = await readCatalogState();
    res.json({
      updatedAt: state.updatedAt,
      prices: state.prices,
      availability: state.availability,
    });
  });

  app.post('/api/owner/verify', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Mã PIN không đúng.' });
      return;
    }
    res.json({ ok: true, storageMode: getStorageMode() });
  });

  app.post('/api/owner/change-pin', async (req, res) => {
    if (!(await isValidPin(req.body?.currentPin))) {
      res.status(401).json({ ok: false, message: 'Mã PIN hiện tại không đúng.' });
      return;
    }
    const nextPin = typeof req.body?.newPin === 'string' ? req.body.newPin.trim() : '';
    if (nextPin.length < 4 || nextPin.length > 12) {
      res
        .status(400)
        .json({ ok: false, message: 'Mã PIN mới cần dài từ 4 đến 12 ký tự.' });
      return;
    }
    await setOwnerPin(nextPin);
    res.json({ ok: true });
  });

  app.post('/api/prices', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const state = await readCatalogState();
    const incomingPrices = req.body?.prices;
    const incomingAvailability = req.body?.availability;
    const cleanPrices: Record<string, number> = { ...state.prices };
    const cleanAvailability: Record<string, string> = { ...state.availability };

    if (incomingPrices && typeof incomingPrices === 'object') {
      for (const [skuId, val] of Object.entries(incomingPrices)) {
        const num = Number(val);
        if (Number.isFinite(num) && num >= 0 && num <= 1000000000) {
          cleanPrices[skuId] = Math.round(num);
        }
      }
    }

    if (incomingAvailability && typeof incomingAvailability === 'object') {
      for (const [productId, status] of Object.entries(incomingAvailability)) {
        if (typeof status === 'string' && status.trim().length > 0) {
          cleanAvailability[productId] = status.trim().slice(0, 60);
        }
      }
    }

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      prices: cleanPrices,
      availability: cleanAvailability,
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/upload-image', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      dataUrl
    );
    if (!match) {
      res.status(400).json({
        ok: false,
        message: 'Định dạng ảnh không hợp lệ. Chỉ hỗ trợ JPG, PNG hoặc WebP.',
      });
      return;
    }

    const mime = match[1];
    const base64Data = match[2];
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const rawName =
      typeof req.body?.filename === 'string' ? req.body.filename : 'product';
    const safeStem =
      rawName
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 32) || 'material';
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeStem}.${ext}`;

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.byteLength > 4 * 1024 * 1024) {
      res.status(400).json({
        ok: false,
        message: 'Dung lượng ảnh tối đa 4MB mỗi ảnh.',
      });
      return;
    }

    const url = await saveUploadedImage(fileName, mime, buffer);
    res.json({ ok: true, url });
  });

  app.post('/api/products/add', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const product = req.body?.product;
    if (
      !product ||
      typeof product !== 'object' ||
      typeof product.id !== 'string' ||
      typeof product.name !== 'string' ||
      !Array.isArray(product.variants) ||
      product.variants.length === 0
    ) {
      res.status(400).json({ ok: false, message: 'Thông tin sản phẩm chưa đầy đủ.' });
      return;
    }

    const state = await readCatalogState();
    let nextCategories = state.categories;
    const prodCatId = typeof product.category === 'string' ? product.category.trim() : '';
    const prodCatLabel =
      typeof product.categoryLabel === 'string' ? product.categoryLabel.trim() : prodCatId;
    if (
      Array.isArray(nextCategories) &&
      prodCatId &&
      prodCatId !== 'all' &&
      !nextCategories.some((c) => c.id === prodCatId)
    ) {
      nextCategories = [
        ...nextCategories,
        { id: prodCatId.slice(0, 60), label: (prodCatLabel || prodCatId).slice(0, 60) },
      ];
    }

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      categories: nextCategories,
      customProducts: [product, ...state.customProducts],
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/products/update', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const product = req.body?.product as
      | (Record<string, unknown> & {
          id?: string;
          name?: string;
          variants?: Array<{ id?: string; price?: number }>;
        })
      | undefined;
    if (
      !product ||
      typeof product !== 'object' ||
      typeof product.id !== 'string' ||
      typeof product.name !== 'string' ||
      !Array.isArray(product.variants) ||
      product.variants.length === 0
    ) {
      res.status(400).json({ ok: false, message: 'Thông tin sản phẩm chưa đầy đủ.' });
      return;
    }

    const productId = product.id;
    const state = await readCatalogState();
    const nextCustomProducts = [...state.customProducts] as Array<Record<string, unknown>>;
    const customIdx = nextCustomProducts.findIndex((p) => p.id === productId);

    const nextEdited = { ...state.editedProducts };
    const nextPrices = { ...state.prices };
    const nextAvailability = { ...state.availability };
    const nextPrimaryOverrides = { ...state.primaryImageOverrides };
    const nextExtraMap = { ...state.extraImagesByProduct };

    if (typeof product.availabilityText === 'string') {
      nextAvailability[productId] = product.availabilityText;
    }
    for (const v of product.variants) {
      if (v && typeof v.id === 'string' && typeof v.price === 'number') {
        nextPrices[v.id] = Math.round(v.price);
      }
    }
    if (typeof product.image === 'string' && product.image.trim()) {
      nextPrimaryOverrides[productId] = product.image.trim();
    }
    if (Array.isArray(product.extraImages)) {
      nextExtraMap[productId] = product.extraImages.filter(
        (u): u is string => typeof u === 'string'
      );
    }

    if (customIdx >= 0) {
      nextCustomProducts[customIdx] = product;
    } else {
      nextEdited[productId] = product;
    }

    let nextCategories = state.categories;
    const prodCatId = typeof product.category === 'string' ? product.category.trim() : '';
    const prodCatLabel =
      typeof product.categoryLabel === 'string' ? product.categoryLabel.trim() : prodCatId;
    if (
      Array.isArray(nextCategories) &&
      prodCatId &&
      prodCatId !== 'all' &&
      !nextCategories.some((c) => c.id === prodCatId)
    ) {
      nextCategories = [
        ...nextCategories,
        { id: prodCatId.slice(0, 60), label: (prodCatLabel || prodCatId).slice(0, 60) },
      ];
    }

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      categories: nextCategories,
      prices: nextPrices,
      availability: nextAvailability,
      customProducts: nextCustomProducts,
      editedProducts: nextEdited,
      primaryImageOverrides: nextPrimaryOverrides,
      extraImagesByProduct: nextExtraMap,
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/theme', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }
    const theme = req.body?.theme === 'blue-gold' ? 'blue-gold' : 'red-cream';
    const state = await readCatalogState();
    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      theme,
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/categories', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const rawCategories = req.body?.categories;
    const state = await readCatalogState();

    if (rawCategories === null) {
      const nextState: CatalogState = {
        ...state,
        updatedAt: new Date().toISOString(),
      };
      delete nextState.categories;
      await writeCatalogState(nextState);
      res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
      return;
    }

    if (!Array.isArray(rawCategories)) {
      res.status(400).json({ ok: false, message: 'Danh sách danh mục không hợp lệ.' });
      return;
    }

    const seen = new Set<string>();
    const cleanCategories: CategoryItem[] = [];
    for (const item of rawCategories) {
      if (!item || typeof item !== 'object') continue;
      const rawId = typeof (item as CategoryItem).id === 'string' ? (item as CategoryItem).id.trim().slice(0, 60) : '';
      const rawLabel = typeof (item as CategoryItem).label === 'string' ? (item as CategoryItem).label.trim().slice(0, 60) : '';
      if (!rawId || rawId === 'all' || !rawLabel || seen.has(rawId)) continue;
      seen.add(rawId);
      cleanCategories.push({ id: rawId, label: rawLabel });
    }

    const labelById = new Map(cleanCategories.map((c) => [c.id, c.label]));
    const nextCustomProducts = (state.customProducts as Array<Record<string, unknown>>).map((p) => {
      const cat = typeof p.category === 'string' ? p.category : '';
      const updatedLabel = labelById.get(cat);
      return updatedLabel ? { ...p, categoryLabel: updatedLabel } : p;
    });

    const nextEditedProducts: Record<string, unknown> = {};
    for (const [id, prod] of Object.entries(state.editedProducts)) {
      if (prod && typeof prod === 'object') {
        const rec = prod as Record<string, unknown>;
        const cat = typeof rec.category === 'string' ? rec.category : '';
        const updatedLabel = labelById.get(cat);
        nextEditedProducts[id] = updatedLabel ? { ...rec, categoryLabel: updatedLabel } : rec;
      } else {
        nextEditedProducts[id] = prod;
      }
    }

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      categories: cleanCategories,
      customProducts: nextCustomProducts,
      editedProducts: nextEditedProducts,
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/store-profile', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }
    const raw = req.body?.profile as Record<string, unknown> | undefined;
    if (!raw || typeof raw !== 'object') {
      res.status(400).json({ ok: false, message: 'Thiếu dữ liệu thông tin cửa hàng.' });
      return;
    }

    const cleanText = (val: unknown, maxLen: number): string | undefined => {
      if (typeof val !== 'string') return undefined;
      return val.trim().slice(0, maxLen);
    };

    const cleanHttpUrl = (val: unknown): string | undefined => {
      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim().slice(0, 800);
      if (!trimmed) return '';
      if (/^https?:\/\//i.test(trimmed)) return trimmed;
      return undefined;
    };

    const cleanImageUrl = (val: unknown): string | undefined => {
      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim().slice(0, 800);
      if (!trimmed) return '';
      if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) return trimmed;
      return undefined;
    };

    const rawBullets = Array.isArray(raw.heroBullets)
      ? raw.heroBullets
          .filter((b): b is string => typeof b === 'string')
          .map((b) => b.trim().slice(0, 300))
          .filter((b) => b.length > 0)
          .slice(0, 12)
      : undefined;

    const cleanProfile: Partial<StoreProfileState> = {};
    const textFields: Array<
      [
        keyof Omit<
          StoreProfileState,
          | 'heroBullets'
          | 'zaloUrl'
          | 'googleMapsUrl'
          | 'googleMapsEmbedUrl'
          | 'fanpageUrl'
          | 'facebookPersonalUrl'
          | 'heroImage'
          | 'addressImage'
        >,
        number,
      ]
    > = [
      ['brandShort', 60],
      ['brandFull', 120],
      ['address', 240],
      ['mergedAddress', 240],
      ['phone1', 40],
      ['phone2', 40],
      ['hours', 100],
      ['contactDesc', 600],
      ['heroTitle', 220],
      ['heroSubtitle', 260],
    ];

    for (const [key, maxLen] of textFields) {
      const val = cleanText(raw[key], maxLen);
      if (val !== undefined) cleanProfile[key] = val;
    }

    const urlFields: Array<
      | 'zaloUrl'
      | 'googleMapsUrl'
      | 'googleMapsEmbedUrl'
      | 'fanpageUrl'
      | 'facebookPersonalUrl'
    > = ['zaloUrl', 'googleMapsUrl', 'googleMapsEmbedUrl', 'fanpageUrl', 'facebookPersonalUrl'];
    for (const key of urlFields) {
      const val = cleanHttpUrl(raw[key]);
      if (val !== undefined) cleanProfile[key] = val;
    }

    const imgVal = cleanImageUrl(raw.heroImage);
    if (imgVal !== undefined) cleanProfile.heroImage = imgVal;
    const addressImgVal = cleanImageUrl(raw.addressImage);
    if (addressImgVal !== undefined) cleanProfile.addressImage = addressImgVal;
    if (rawBullets !== undefined) cleanProfile.heroBullets = rawBullets;

    if (!cleanProfile.address || !cleanProfile.phone1) {
      res.status(400).json({
        ok: false,
        message: 'Địa chỉ và Số điện thoại chính không được để trống.',
      });
      return;
    }

    const state = await readCatalogState();
    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      storeProfile: {
        ...(state.storeProfile ?? {}),
        ...cleanProfile,
      },
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/estimator-config', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const rawConfig = req.body?.config;
    const state = await readCatalogState();

    if (rawConfig === null) {
      const nextState: CatalogState = {
        ...state,
        updatedAt: new Date().toISOString(),
      };
      delete nextState.estimatorConfig;
      await writeCatalogState(nextState);
      res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
      return;
    }

    if (!rawConfig || typeof rawConfig !== 'object') {
      res.status(400).json({ ok: false, message: 'Dữ liệu mục Dự toán không hợp lệ.' });
      return;
    }

    const rec = rawConfig as Record<string, unknown>;
    const cleanStr = (val: unknown, maxLen: number): string | undefined =>
      typeof val === 'string' ? val.trim().slice(0, maxLen) : undefined;

    const cleanLine = (val: unknown): Record<string, unknown> | undefined => {
      if (!val || typeof val !== 'object') return undefined;
      const line = val as Record<string, unknown>;
      const numRate = Number(line.rate);
      return {
        productId: cleanStr(line.productId, 120) || '',
        variantId: cleanStr(line.variantId, 120) || '',
        rate: Number.isFinite(numRate) && numRate > 0 && numRate <= 100000 ? numRate : 1,
        note: cleanStr(line.note, 260) || '',
      };
    };

    const cleanLineGroup = (
      val: unknown,
      keys: string[]
    ): Record<string, unknown> | undefined => {
      if (!val || typeof val !== 'object') return undefined;
      const group = val as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of keys) {
        const cleaned = cleanLine(group[k]);
        if (cleaned) out[k] = cleaned;
      }
      return out;
    };

    const cleanCommits = Array.isArray(rec.commitItems)
      ? rec.commitItems
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item) => ({
            title: cleanStr(item.title, 160) || '',
            desc: cleanStr(item.desc, 600) || '',
          }))
          .filter((item) => item.title.length > 0)
          .slice(0, 8)
      : undefined;

    const sanitizedConfig: Record<string, unknown> = {
      enabled: rec.enabled !== false,
      eyebrow: cleanStr(rec.eyebrow, 160) || '',
      title: cleanStr(rec.title, 220) || '',
      subtitle: cleanStr(rec.subtitle, 400) || '',
      slabTitle: cleanStr(rec.slabTitle, 80) || '',
      wallTitle: cleanStr(rec.wallTitle, 80) || '',
      tilingTitle: cleanStr(rec.tilingTitle, 80) || '',
      adhesiveTitle: cleanStr(rec.adhesiveTitle, 80) || '',
      paintTitle: cleanStr(rec.paintTitle, 80) || '',
      rightEyebrow: cleanStr(rec.rightEyebrow, 160) || '',
      rightTitle: cleanStr(rec.rightTitle, 220) || '',
      rightDesc: cleanStr(rec.rightDesc, 800) || '',
      commitItems: cleanCommits ?? [],
      slabLines: cleanLineGroup(rec.slabLines, ['cement', 'steel', 'sand', 'stone']) ?? {},
      wallLines: cleanLineGroup(rec.wallLines, ['brick', 'cement', 'sand']) ?? {},
      tilingLines: cleanLineGroup(rec.tilingLines, ['tile']) ?? {},
      adhesiveLines: cleanLineGroup(rec.adhesiveLines, ['adhesive', 'grout']) ?? {},
      paintLines: cleanLineGroup(rec.paintLines, ['topcoat', 'primer']) ?? {},
    };

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      estimatorConfig: sanitizedConfig,
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/products/images', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const productId =
      typeof req.body?.productId === 'string' ? req.body.productId.trim() : '';
    if (!productId) {
      res.status(400).json({ ok: false, message: 'Thiếu mã sản phẩm.' });
      return;
    }

    const primaryImage =
      typeof req.body?.primaryImage === 'string' ? req.body.primaryImage.trim() : '';
    const extraImages = Array.isArray(req.body?.extraImages)
      ? req.body.extraImages.filter((u: unknown): u is string => typeof u === 'string')
      : undefined;

    const state = await readCatalogState();
    const nextCustomProducts = [...state.customProducts] as Array<
      Record<string, unknown>
    >;
    const customIdx = nextCustomProducts.findIndex((p) => p.id === productId);

    const nextPrimaryOverrides = { ...state.primaryImageOverrides };
    const nextExtraMap = { ...state.extraImagesByProduct };

    if (customIdx >= 0) {
      const target = { ...nextCustomProducts[customIdx] };
      if (primaryImage) target.image = primaryImage;
      if (extraImages) target.extraImages = extraImages;
      nextCustomProducts[customIdx] = target;
    } else {
      if (primaryImage) {
        nextPrimaryOverrides[productId] = primaryImage;
      }
      if (extraImages) {
        nextExtraMap[productId] = extraImages;
      }
    }

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      customProducts: nextCustomProducts,
      primaryImageOverrides: nextPrimaryOverrides,
      extraImagesByProduct: nextExtraMap,
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/products/delete', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }

    const productId =
      typeof req.body?.productId === 'string' ? req.body.productId.trim() : '';
    if (!productId) {
      res.status(400).json({ ok: false, message: 'Thiếu mã sản phẩm cần xóa.' });
      return;
    }

    const state = await readCatalogState();
    const isCustom = (state.customProducts as Array<{ id?: string }>).some(
      (p) => p.id === productId
    );

    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      customProducts: isCustom
        ? (state.customProducts as Array<{ id?: string }>).filter(
            (p) => p.id !== productId
          )
        : state.customProducts,
      deletedProductIds: isCustom
        ? state.deletedProductIds
        : Array.from(new Set([...state.deletedProductIds, productId])),
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/products/restore-defaults', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }
    const state = await readCatalogState();
    const nextState: CatalogState = {
      ...state,
      updatedAt: new Date().toISOString(),
      deletedProductIds: [],
    };
    await writeCatalogState(nextState);
    res.json({ ok: true, state: { ...nextState, storageMode: getStorageMode() } });
  });

  app.post('/api/catalog-backup/import', async (req, res) => {
    if (!(await isValidPin(req.body?.pin))) {
      res.status(401).json({ ok: false, message: 'Sai mã PIN chủ cửa hàng.' });
      return;
    }
    const backup = req.body?.backup;
    if (!backup || typeof backup !== 'object') {
      res.status(400).json({ ok: false, message: 'Tệp sao lưu không hợp lệ.' });
      return;
    }
    const normalized = normalizeCatalogState(JSON.stringify(backup));
    normalized.updatedAt = new Date().toISOString();
    await writeCatalogState(normalized);
    res.json({ ok: true, state: { ...normalized, storageMode: getStorageMode() } });
  });

  app.post('/api/orders', async (req, res) => {
    const order = req.body;
    if (!order || typeof order !== 'object' || !order.orderCode) {
      res.status(400).json({ ok: false });
      return;
    }
    try {
      const entry = { ...order, savedAt: new Date().toISOString() };
      if (getKvConfig()) {
        const raw = await kvGetString(KV_ORDERS_KEY);
        const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
        existing.unshift(entry);
        await kvSetString(KV_ORDERS_KEY, JSON.stringify(existing.slice(0, 200)));
        res.json({ ok: true });
        return;
      }
      const { dir } = resolveWritableDataDir();
      const ordersFile = path.join(dir, 'orders.json');
      let existing: unknown[] = [];
      if (fs.existsSync(ordersFile)) {
        existing = JSON.parse(fs.readFileSync(ordersFile, 'utf-8')) as unknown[];
      }
      existing.unshift(entry);
      fs.writeFileSync(
        ordersFile,
        JSON.stringify(existing.slice(0, 200), null, 2),
        'utf-8'
      );
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false });
    }
  });
}
