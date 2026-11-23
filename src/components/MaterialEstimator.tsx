import { useMemo, useState } from 'react';
import { Calculator, Check, Info, MapPin, Phone, ShoppingBag } from 'lucide-react';
import {
  DEFAULT_ESTIMATOR_CONFIG,
  DEFAULT_STORE_PROFILE,
  EstimatorConfig,
  EstimatorLineConfig,
  formatVND,
  MaterialProduct,
  mergeEstimatorConfig,
  ProductVariant,
  StoreProfile,
  TILE_SIZE_SPECS,
  TileSizeSpec,
  toTelHref,
} from '../data/materials';

type WorkType = 'slab' | 'wall' | 'tiling' | 'adhesive' | 'paint';
type AdhesiveZone = 'interior' | 'wet' | 'large';
type GroutOption = 'none' | '2mm' | '3mm';

interface MaterialEstimatorProps {
  products: MaterialProduct[];
  storeProfile?: StoreProfile;
  estimatorConfig?: EstimatorConfig;
  onAddBundleToCart: (
    items: Array<{ product: MaterialProduct; variant: ProductVariant; quantity: number }>
  ) => void;
}

interface CalculatedLine {
  key: string;
  product: MaterialProduct;
  variant: ProductVariant;
  quantity: number;
  note: string;
}

function resolveProductAndVariant(
  products: MaterialProduct[],
  lineCfg: EstimatorLineConfig,
  fallbackProductId: string,
  fallbackVariantIndex = 0
): { product: MaterialProduct; variant: ProductVariant } | null {
  if (products.length === 0) return null;
  const product =
    products.find((p) => p.id === lineCfg.productId) ??
    products.find((p) => p.id === fallbackProductId) ??
    products[0];
  if (!product || product.variants.length === 0) return null;
  const variant =
    product.variants.find((v) => v.id === lineCfg.variantId) ??
    product.variants[fallbackVariantIndex] ??
    product.variants[0];
  return { product, variant };
}

function findVariantByIdOrFallback(
  product: MaterialProduct,
  preferredVariantId: string,
  fallbackVariantId: string
): ProductVariant {
  return (
    product.variants.find((v) => v.id === preferredVariantId) ??
    product.variants.find((v) => v.id === fallbackVariantId) ??
    product.variants[0]
  );
}

export function MaterialEstimator({
  products,
  storeProfile = DEFAULT_STORE_PROFILE,
  estimatorConfig,
  onAddBundleToCart,
}: MaterialEstimatorProps) {
  const [workType, setWorkType] = useState<WorkType>('slab');
  const [areaM2, setAreaM2] = useState<number>(80);
  const [thicknessCm, setThicknessCm] = useState<number>(12);

  // Separate Tiling controls
  const [tileSizeId, setTileSizeId] = useState<string>('60x60');
  const [tileWastePct, setTileWastePct] = useState<number>(5);
  const [customTileVariantId, setCustomTileVariantId] = useState<string>('auto');

  // Separate Adhesive controls (according to Weber Saint-Gobain guidelines)
  const [adhTileSizeId, setAdhTileSizeId] = useState<string>('60x60');
  const [adhZone, setAdhZone] = useState<AdhesiveZone>('interior');
  const [groutOption, setGroutOption] = useState<GroutOption>('2mm');

  const [bundleAdded, setBundleAdded] = useState<boolean>(false);

  const config = useMemo(
    () => mergeEstimatorConfig(estimatorConfig ?? DEFAULT_ESTIMATOR_CONFIG),
    [estimatorConfig]
  );

  const workOptions: Array<{ id: WorkType; label: string }> = [
    { id: 'slab', label: config.slabTitle },
    { id: 'wall', label: config.wallTitle },
    { id: 'tiling', label: config.tilingTitle },
    { id: 'adhesive', label: config.adhesiveTitle },
    { id: 'paint', label: config.paintTitle },
  ];

  const selectedTileSpec = useMemo<TileSizeSpec>(
    () => TILE_SIZE_SPECS.find((s) => s.id === tileSizeId) ?? TILE_SIZE_SPECS[4],
    [tileSizeId]
  );

  const selectedAdhTileSpec = useMemo<TileSizeSpec>(
    () => TILE_SIZE_SPECS.find((s) => s.id === adhTileSizeId) ?? TILE_SIZE_SPECS[4],
    [adhTileSizeId]
  );

  const tileProduct = useMemo(
    () =>
      products.find((p) => p.id === config.tilingLines.tile.productId) ??
      products.find((p) => p.id === 'gach-op-lat-cac-loai') ??
      products[0],
    [products, config.tilingLines.tile.productId]
  );

  const adhesiveRecommendations = useMemo(() => {
    const isLargeTile =
      selectedAdhTileSpec.widthCm >= 80 || selectedAdhTileSpec.lengthCm >= 100;
    const kgPerM2 = selectedAdhTileSpec.adhesiveKgPerM2;
    const coveragePer25Kg = Number((25 / kgPerM2).toFixed(1));

    let recommendedVariantId = config.adhesiveLines.adhesive.variantId;
    let zoneLabel = 'Nội thất khô ráo (Weber.tai fix)';
    if (adhZone === 'large' || isLargeTile) {
      recommendedVariantId = 'weber-tai-gres-25kg';
      zoneLabel = isLargeTile
        ? 'Gạch khổ lớn / Ít hút nước (NSX khuyến cáo Weber.tai gres)'
        : 'Gạch khổ lớn / Hồ bơi / Porcelain (Weber.tai gres)';
    } else if (adhZone === 'wet') {
      recommendedVariantId = 'weber-tai-vis-25kg';
      zoneLabel = 'Nhà vệ sinh / Ban công / Ngoài trời (Weber.tai vis)';
    } else {
      recommendedVariantId = 'weber-tai-fix-25kg';
    }

    return {
      isLargeTile,
      kgPerM2,
      coveragePer25Kg,
      recommendedVariantId,
      zoneLabel,
    };
  }, [selectedAdhTileSpec, adhZone, config.adhesiveLines.adhesive.variantId]);

  const calculatedLines = useMemo<CalculatedLine[]>(() => {
    if (products.length === 0) return [];
    const safeArea = Math.max(1, areaM2);

    if (workType === 'slab') {
      const volumeM3 = safeArea * (Math.max(8, thicknessCm) / 100);
      const lines: CalculatedLine[] = [];

      const cementRes = resolveProductAndVariant(
        products,
        config.slabLines.cement,
        'xi-mang-ha-tien-acifa',
        0
      );
      if (cementRes) {
        lines.push({
          key: 'slab-cement',
          ...cementRes,
          quantity: Math.max(1, Math.ceil(volumeM3 * config.slabLines.cement.rate)),
          note: `${config.slabLines.cement.note} (${volumeM3.toFixed(1)} m³ bê tông)`,
        });
      }

      const steelRes = resolveProductAndVariant(
        products,
        config.slabLines.steel,
        'sat-thep-xay-dung',
        3
      );
      if (steelRes) {
        const isPerKg = steelRes.variant.unit.toLowerCase().trim() === 'kg';
        const kgWeight = isPerKg ? 1 : Math.max(1, steelRes.variant.weightKg || 1);
        lines.push({
          key: 'slab-steel',
          ...steelRes,
          quantity: Math.max(1, Math.ceil((volumeM3 * config.slabLines.steel.rate) / kgWeight)),
          note: config.slabLines.steel.note,
        });
      }

      const sandRes = resolveProductAndVariant(
        products,
        config.slabLines.sand,
        'cat-song-cat-thuong-da-xay-dung',
        0
      );
      if (sandRes) {
        lines.push({
          key: 'slab-sand',
          ...sandRes,
          quantity: Math.max(1, Math.ceil(volumeM3 * config.slabLines.sand.rate)),
          note: config.slabLines.sand.note,
        });
      }

      const stoneRes = resolveProductAndVariant(
        products,
        config.slabLines.stone,
        'cat-song-cat-thuong-da-xay-dung',
        5
      );
      if (stoneRes) {
        lines.push({
          key: 'slab-stone',
          ...stoneRes,
          quantity: Math.max(1, Math.ceil(volumeM3 * config.slabLines.stone.rate)),
          note: config.slabLines.stone.note,
        });
      }

      return lines;
    }

    if (workType === 'wall') {
      const lines: CalculatedLine[] = [];

      const brickRes = resolveProductAndVariant(
        products,
        config.wallLines.brick,
        'gach-ong-gach-dinh',
        0
      );
      if (brickRes) {
        const totalBricks = Math.ceil(safeArea * config.wallLines.brick.rate);
        const perThousand = /1\.?000/.test(brickRes.variant.unit);
        const qty = perThousand ? Math.max(1, Math.ceil(totalBricks / 1000)) : Math.max(1, totalBricks);
        lines.push({
          key: 'wall-brick',
          ...brickRes,
          quantity: qty,
          note: `${config.wallLines.brick.note} (${totalBricks.toLocaleString('vi-VN')} viên ước tính)`,
        });
      }

      const cementRes = resolveProductAndVariant(
        products,
        config.wallLines.cement,
        'xi-mang-ha-tien-acifa',
        1
      );
      if (cementRes) {
        lines.push({
          key: 'wall-cement',
          ...cementRes,
          quantity: Math.max(1, Math.ceil(safeArea * config.wallLines.cement.rate)),
          note: config.wallLines.cement.note,
        });
      }

      const sandRes = resolveProductAndVariant(
        products,
        config.wallLines.sand,
        'cat-song-cat-thuong-da-xay-dung',
        1
      );
      if (sandRes) {
        lines.push({
          key: 'wall-sand',
          ...sandRes,
          quantity: Math.max(1, Math.ceil(safeArea * config.wallLines.sand.rate)),
          note: config.wallLines.sand.note,
        });
      }

      return lines;
    }

    if (workType === 'tiling') {
      const tileRes = resolveProductAndVariant(
        products,
        config.tilingLines.tile,
        'gach-op-lat-cac-loai',
        0
      );
      if (!tileRes) return [];

      const chosenVariant =
        customTileVariantId !== 'auto'
          ? findVariantByIdOrFallback(
              tileRes.product,
              customTileVariantId,
              tileRes.variant.id
            )
          : findVariantByIdOrFallback(
              tileRes.product,
              selectedTileSpec.preferredVariantId,
              tileRes.variant.id
            );

      const wasteMultiplier = 1 + Math.max(0, tileWastePct) / 100;
      const totalTileM2 = Math.max(1, Math.ceil(safeArea * wasteMultiplier));
      const oneTileAreaM2 =
        (selectedTileSpec.widthCm / 100) * (selectedTileSpec.lengthCm / 100);
      const estimatedPieces = Math.ceil(totalTileM2 / Math.max(0.01, oneTileAreaM2));

      return [
        {
          key: `tiling-only-${selectedTileSpec.id}`,
          product: tileRes.product,
          variant: chosenVariant,
          quantity: totalTileM2,
          note: `Gạch khổ ${selectedTileSpec.label} · Gồm +${tileWastePct}% hao hụt cắt góc (~${estimatedPieces.toLocaleString('vi-VN')} viên)`,
        },
      ];
    }

    if (workType === 'adhesive') {
      const lines: CalculatedLine[] = [];
      const adhRes = resolveProductAndVariant(
        products,
        config.adhesiveLines.adhesive,
        'dai-ly-keo-weber',
        0
      );
      if (adhRes) {
        const chosenAdhVariant = findVariantByIdOrFallback(
          adhRes.product,
          adhesiveRecommendations.recommendedVariantId,
          adhRes.variant.id
        );
        const totalAdhKg = safeArea * adhesiveRecommendations.kgPerM2;
        const bagWeight = Math.max(1, chosenAdhVariant.weightKg || 25);
        const bags = Math.max(1, Math.ceil(totalAdhKg / bagWeight));

        lines.push({
          key: `adhesive-weber-${chosenAdhVariant.id}`,
          product: adhRes.product,
          variant: chosenAdhVariant,
          quantity: bags,
          note: `Cần ~${Math.ceil(totalAdhKg)} kg (${adhesiveRecommendations.kgPerM2.toFixed(1)} kg/m² · ~${adhesiveRecommendations.coveragePer25Kg} m²/bao 25kg · ${selectedAdhTileSpec.trowelSize})`,
        });
      }

      if (groutOption !== 'none') {
        const groutRes = resolveProductAndVariant(
          products,
          config.adhesiveLines.grout,
          'dai-ly-keo-weber',
          3
        );
        if (groutRes) {
          const jointWidthMm = groutOption === '3mm' ? 3 : 2;
          const lengthMm = selectedAdhTileSpec.lengthCm * 10;
          const widthMm = selectedAdhTileSpec.widthCm * 10;
          const thicknessMm = selectedAdhTileSpec.thicknessMm;
          // Official Weber Saint-Gobain grout consumption formula (kg/m2) with +10% safety factor
          const groutKgPerM2 =
            ((lengthMm + widthMm) / (lengthMm * widthMm)) *
            thicknessMm *
            jointWidthMm *
            1.5 *
            1.1;
          const totalGroutKg = safeArea * groutKgPerM2;
          const packWeight = Math.max(1, groutRes.variant.weightKg || 1);
          const packs = Math.max(1, Math.ceil(totalGroutKg / packWeight));

          lines.push({
            key: `grout-weber-${groutOption}`,
            product: groutRes.product,
            variant: groutRes.variant,
            quantity: packs,
            note: `Theo công thức NSX Weber cho ron ${jointWidthMm} mm, gạch ${selectedAdhTileSpec.label} (~${groutKgPerM2.toFixed(2)} kg/m²)`,
          });
        }
      }

      return lines;
    }

    const lines: CalculatedLine[] = [];
    const topcoatRes = resolveProductAndVariant(
      products,
      config.paintLines.topcoat,
      'son-tison-cac-loai',
      0
    );
    if (topcoatRes) {
      lines.push({
        key: 'paint-topcoat',
        ...topcoatRes,
        quantity: Math.max(
          1,
          Math.ceil(safeArea / Math.max(0.1, config.paintLines.topcoat.rate))
        ),
        note: config.paintLines.topcoat.note,
      });
    }

    const primerRes = resolveProductAndVariant(
      products,
      config.paintLines.primer,
      'son-tison-cac-loai',
      2
    );
    if (primerRes) {
      lines.push({
        key: 'paint-primer',
        ...primerRes,
        quantity: Math.max(
          1,
          Math.ceil(safeArea / Math.max(0.1, config.paintLines.primer.rate))
        ),
        note: config.paintLines.primer.note,
      });
    }

    return lines;
  }, [
    workType,
    areaM2,
    thicknessCm,
    products,
    config,
    selectedTileSpec,
    tileWastePct,
    customTileVariantId,
    selectedAdhTileSpec,
    adhesiveRecommendations,
    groutOption,
  ]);

  const estimatedTotal = useMemo(
    () =>
      calculatedLines.reduce(
        (sum, line) => sum + line.variant.price * line.quantity,
        0
      ),
    [calculatedLines]
  );

  const handleAddBundle = () => {
    if (calculatedLines.length === 0) return;
    onAddBundleToCart(
      calculatedLines.map((line) => ({
        product: line.product,
        variant: line.variant,
        quantity: line.quantity,
      }))
    );
    setBundleAdded(true);
    window.setTimeout(() => setBundleAdded(false), 1800);
  };

  return (
    <section
      id="du-toan"
      className="py-10 sm:py-14"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-ink)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left: Interactive Material Estimator */}
          <div
            className="lg:col-span-7 rounded-2xl border p-6 sm:p-8"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
            }}
          >
            <div
              className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold mb-2"
              style={{ color: 'var(--theme-accent)' }}
            >
              <Calculator className="w-4 h-4" aria-hidden="true" />
              <span>{config.eyebrow}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-balance">
              {config.title}
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--theme-ink-soft)' }}>
              {config.subtitle}
            </p>

            {/* Work Type Segmented Buttons (5 separate categories) */}
            <div
              className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl mb-6"
              style={{ backgroundColor: 'var(--theme-surface-alt)' }}
            >
              {workOptions.map((option) => {
                const active = workType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setWorkType(option.id)}
                    className="px-2.5 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--theme-accent)',
                            color: 'var(--theme-accent-ink)',
                          }
                        : { color: 'var(--theme-ink-soft)' }
                    }
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* Numeric & Specialized Inputs per Work Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  htmlFor="estimator-area"
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: 'var(--theme-ink-soft)' }}
                >
                  Diện tích thi công (m²)
                </label>
                <input
                  id="estimator-area"
                  type="number"
                  min={5}
                  max={5000}
                  value={areaM2}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAreaM2(Number.isFinite(val) && val > 0 ? val : 10);
                  }}
                  className="w-full h-11 px-3.5 rounded-lg border font-sans tabular-nums text-sm font-semibold focus:outline-none"
                  style={{
                    backgroundColor: 'var(--theme-bg)',
                    borderColor: 'var(--theme-border)',
                  }}
                />
              </div>

              {workType === 'slab' && (
                <div>
                  <label
                    htmlFor="estimator-thickness"
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: 'var(--theme-ink-soft)' }}
                  >
                    Độ dày sàn bê tông (cm)
                  </label>
                  <select
                    id="estimator-thickness"
                    value={thicknessCm}
                    onChange={(e) => setThicknessCm(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-lg border font-sans tabular-nums text-sm font-semibold focus:outline-none"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                    }}
                  >
                    <option value={10}>10 cm (Sàn mái / sân)</option>
                    <option value={12}>12 cm (Sàn nhà dân dụng)</option>
                    <option value={15}>15 cm (Sàn chịu tải lớn)</option>
                    <option value={20}>20 cm (Sàn công nghiệp)</option>
                  </select>
                </div>
              )}

              {workType === 'wall' && (
                <div className="flex flex-col justify-end">
                  <div
                    className="h-11 px-3.5 rounded-lg border flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-muted)',
                    }}
                  >
                    <span>Quy chuẩn tường xây</span>
                    <span
                      className="font-sans tabular-nums font-semibold"
                      style={{ color: 'var(--theme-ink)' }}
                    >
                      Tường 10 (100mm)
                    </span>
                  </div>
                </div>
              )}

              {workType === 'paint' && (
                <div className="flex flex-col justify-end">
                  <div
                    className="h-11 px-3.5 rounded-lg border flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: 'var(--theme-bg)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-muted)',
                    }}
                  >
                    <span>Quy chuẩn số lớp sơn</span>
                    <span
                      className="font-sans tabular-nums font-semibold"
                      style={{ color: 'var(--theme-ink)' }}
                    >
                      1 lớp lót + 2 lớp phủ
                    </span>
                  </div>
                </div>
              )}

              {workType === 'tiling' && (
                <>
                  <div>
                    <label
                      htmlFor="estimator-tile-size"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      Kích thước gạch tùy chọn
                    </label>
                    <select
                      id="estimator-tile-size"
                      value={tileSizeId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setTileSizeId(nextId);
                        const spec = TILE_SIZE_SPECS.find((s) => s.id === nextId);
                        if (spec) setTileWastePct(spec.defaultWastePct);
                      }}
                      className="w-full h-11 px-3.5 rounded-lg border font-sans text-sm font-semibold focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {TILE_SIZE_SPECS.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="estimator-tile-waste"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      Hao hụt cắt gạch góc tường
                    </label>
                    <select
                      id="estimator-tile-waste"
                      value={tileWastePct}
                      onChange={(e) => setTileWastePct(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-lg border font-sans tabular-nums text-sm font-semibold focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <option value={5}>+5% (Phòng vuông vức)</option>
                      <option value={6}>+6% (Tiêu chuẩn gạch tường/nhỏ)</option>
                      <option value={7}>+7% (Gạch khổ lớn 80×80)</option>
                      <option value={8}>+8% (Gạch 60×120 / Nhiều góc)</option>
                      <option value={10}>+10% (Lát xéo / Cắt nhiều)</option>
                    </select>
                  </div>

                  {tileProduct && tileProduct.variants.length > 1 && (
                    <div>
                      <label
                        htmlFor="estimator-tile-variant"
                        className="block text-xs font-medium mb-1.5"
                        style={{ color: 'var(--theme-ink-soft)' }}
                      >
                        Mức giá gạch áp dụng
                      </label>
                      <select
                        id="estimator-tile-variant"
                        value={customTileVariantId}
                        onChange={(e) => setCustomTileVariantId(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-lg border font-sans text-xs font-semibold focus:outline-none"
                        style={{
                          backgroundColor: 'var(--theme-bg)',
                          borderColor: 'var(--theme-border)',
                        }}
                      >
                        <option value="auto">
                          Tự động theo khổ gạch ({selectedTileSpec.label})
                        </option>
                        {tileProduct.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label} ({formatVND(v.price)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {workType === 'adhesive' && (
                <>
                  <div>
                    <label
                      htmlFor="estimator-adh-tile-size"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      Kích thước gạch cần dán
                    </label>
                    <select
                      id="estimator-adh-tile-size"
                      value={adhTileSizeId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setAdhTileSizeId(nextId);
                        const spec = TILE_SIZE_SPECS.find((s) => s.id === nextId);
                        if (spec && (spec.widthCm >= 80 || spec.lengthCm >= 100)) {
                          setAdhZone('large');
                        }
                      }}
                      className="w-full h-11 px-3.5 rounded-lg border font-sans text-sm font-semibold focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      {TILE_SIZE_SPECS.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.label} ({spec.adhesiveKgPerM2.toFixed(1)} kg/m²)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="estimator-adh-zone"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      Khu vực dán & Dòng keo NSX khuyến cáo
                    </label>
                    <select
                      id="estimator-adh-zone"
                      value={adhZone}
                      onChange={(e) => setAdhZone(e.target.value as AdhesiveZone)}
                      className="w-full h-11 px-3.5 rounded-lg border font-sans text-xs font-semibold focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <option value="interior">
                        Nội thất khô ráo → Weber.tai fix
                      </option>
                      <option value="wet">
                        Nhà vệ sinh / Ngoài trời → Weber.tai vis
                      </option>
                      <option value="large">
                        Gạch khổ lớn / Porcelain / Hồ bơi → Weber.tai gres
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="estimator-grout-option"
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      Keo chà ron (Webercolor · Theo NSX)
                    </label>
                    <select
                      id="estimator-grout-option"
                      value={groutOption}
                      onChange={(e) => setGroutOption(e.target.value as GroutOption)}
                      className="w-full h-11 px-3.5 rounded-lg border font-sans text-xs font-semibold focus:outline-none"
                      style={{
                        backgroundColor: 'var(--theme-bg)',
                        borderColor: 'var(--theme-border)',
                      }}
                    >
                      <option value="2mm">Có · Đường ron 2 mm (tiêu chuẩn)</option>
                      <option value="3mm">Có · Đường ron 3 mm (gạch sân/lớn)</option>
                      <option value="none">Không tính keo chà ron</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Manufacturer Guideline Strip for Adhesive Tab */}
            {workType === 'adhesive' && (
              <div
                className="mb-5 p-3.5 rounded-xl border text-xs space-y-1"
                style={{
                  backgroundColor: 'var(--theme-surface-alt)',
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="font-bold" style={{ color: 'var(--theme-accent)' }}>
                  Khuyến cáo kỹ thuật từ NSX Weber (Saint-Gobain):
                </div>
                <div style={{ color: 'var(--theme-ink)' }}>
                  • <strong>{selectedAdhTileSpec.trowelSize}</strong> —{' '}
                  {selectedAdhTileSpec.applicationNote}
                </div>
                <div style={{ color: 'var(--theme-ink-soft)' }}>
                  • Dòng keo phù hợp: <strong>{adhesiveRecommendations.zoneLabel}</strong>
                </div>
              </div>
            )}

            {/* Calculated Breakdown Table */}
            <div
              className="border-t border-b divide-y mb-5"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {calculatedLines.map((line) => (
                <div
                  key={line.key}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-semibold">{line.variant.label}</div>
                    <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                      {line.note}
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <div className="font-sans tabular-nums text-sm font-bold">
                      {line.quantity.toLocaleString('vi-VN')} {line.variant.unit}
                    </div>
                    <div
                      className="font-sans tabular-nums text-xs font-medium"
                      style={{ color: 'var(--theme-muted)' }}
                    >
                      {formatVND(line.variant.price * line.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs" style={{ color: 'var(--theme-muted)' }}>
                  Chi phí vật tư ước tính
                </div>
                <div
                  className="font-sans tabular-nums text-2xl font-extrabold tracking-tight"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {formatVND(estimatedTotal)}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddBundle}
                disabled={calculatedLines.length === 0}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--theme-accent)',
                  color: 'var(--theme-accent-ink)',
                }}
              >
                {bundleAdded ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Đã thêm bộ vật tư vào giỏ</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                    <span>Thêm bộ vật tư vào giỏ</span>
                  </>
                )}
              </button>
            </div>

            {/* Honest Accuracy Note */}
            <div
              className="mt-5 pt-4 border-t flex items-start gap-2 text-xs leading-relaxed"
              style={{
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-muted)',
              }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Dự toán tính theo định mức xây dựng phổ thông & khuyến cáo NSX để tham khảo kinh phí ban đầu. Thực tế có thể chênh lệch 5–10% tùy độ phẳng cốt nền, kết cấu bản vẽ và hao hụt thi công.
              </span>
            </div>
          </div>

          {/* Right: Direct Storefront Commitment & Brands */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div>
              <div
                className="text-xs uppercase tracking-wider font-semibold mb-2"
                style={{ color: 'var(--theme-accent)' }}
              >
                {config.rightEyebrow}
              </div>
              <h2 className="text-2xl font-bold mb-2 text-balance">
                {config.rightTitle}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-ink-soft)' }}>
                {config.rightDesc}
              </p>
            </div>

            <div
              className="divide-y border-t border-b"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              {config.commitItems.map((item, idx) => (
                <div key={idx} className="py-4">
                  <div className="text-sm font-semibold">{item.title}</div>
                  {item.desc && (
                    <p
                      className="text-xs mt-1 leading-relaxed"
                      style={{ color: 'var(--theme-ink-soft)' }}
                    >
                      {item.desc}
                    </p>
                  )}
                </div>
              ))}
              <div className="py-4 flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: 'var(--theme-accent)' }}
                    aria-hidden="true"
                  />
                  <span>{storeProfile.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--theme-accent)' }}
                    aria-hidden="true"
                  />
                  <span className="font-sans tabular-nums font-semibold">
                    <a href={toTelHref(storeProfile.phone1)} className="hover:underline">
                      {storeProfile.phone1}
                    </a>
                    {storeProfile.phone2 && (
                      <>
                        {' – '}
                        <a href={toTelHref(storeProfile.phone2)} className="hover:underline">
                          {storeProfile.phone2}
                        </a>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
