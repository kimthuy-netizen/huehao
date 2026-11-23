export type StoreTheme = 'red-cream' | 'blue-gold';

export type PresetCategory =
  | 'all'
  | 'cement'
  | 'steel'
  | 'aggregates'
  | 'tiles'
  | 'paint-plumbing'
  | 'sanitary';

export type MaterialCategory = PresetCategory | (string & {});

export interface ProductVariant {
  id: string;
  label: string;
  sku: string;
  unit: string;
  price: number;
  stockQty: number;
  weightKg: number;
}

export interface MaterialSpec {
  label: string;
  value: string;
}

export interface MaterialProduct {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  brand: string;
  shortDesc: string;
  fullDesc: string;
  image: string;
  extraImages?: string[];
  imageAlt: string;
  availabilityText: string;
  leadTime: string;
  variants: ProductVariant[];
  specs: MaterialSpec[];
  bulkNote: string;
}

export interface CategoryOption {
  id: MaterialCategory;
  label: string;
}

export interface StoreProfile {
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

export function toTelHref(phone: string): string {
  const digits = phone.replace(/[^0-9+]/g, '');
  return digits ? `tel:${digits}` : '#';
}

export function toZaloHref(zaloUrl: string | undefined, fallbackPhone: string): string {
  const trimmed = (zaloUrl ?? '').trim();
  if (trimmed) return trimmed;
  const digits = fallbackPhone.replace(/[^0-9]/g, '');
  return digits ? `https://zalo.me/${digits}` : 'https://zalo.me/0913622702';
}

export const STORE_INFO = {
  brandShort: 'VLXD Huệ Hảo',
  brandFull: 'Vật Liệu Xây Dựng Huệ Hảo',
  address: 'Khu phố Tân Ba, Phường Thái Hòa, TP. Tân Uyên, Tỉnh Bình Dương',
  mergedAddress: 'Phường Tân Đông Hiệp, TP. HCM',
  phones: [
    { display: '0913 622 702', href: 'tel:0913622702' },
    { display: '0913 884 702', href: 'tel:0913884702' },
  ],
  googleMapsUrl: 'https://maps.app.goo.gl/fwkvzw1fnqD9nfcz8',
  // Exact resolved coordinates from https://maps.app.goo.gl/fwkvzw1fnqD9nfcz8
  coordinates: { lat: 10.9680083, lng: 106.7788871 },
  googleMapsEmbedUrl:
    'https://maps.google.com/maps?q=10.9680083,106.7788871(V%E1%BA%ADt%20Li%E1%BB%87u%20X%C3%A2y%20D%E1%BB%B1ng%20Hu%E1%BB%87%20H%E1%BA%A3o)&hl=vi&z=16&output=embed',
  facebookPersonalUrl: 'https://www.facebook.com/profile.php?id=61566811227712',
  fanpageUrl: 'https://www.facebook.com/profile.php?id=100094545100298',
  hours: '06:30 – 17:30 (Thứ 2 – Chủ nhật)',
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'all', label: 'Tất cả sản phẩm' },
  { id: 'cement', label: 'Xi măng' },
  { id: 'steel', label: 'Sắt thép & Hộp kẽm' },
  { id: 'aggregates', label: 'Cát, Đá & Gạch xây' },
  { id: 'tiles', label: 'Gạch ốp lát & Keo Weber' },
  { id: 'paint-plumbing', label: 'Sơn Tison & Ống nhựa' },
  { id: 'sanitary', label: 'TBVS & Bồn nước' },
];

export const HERO_IMAGE = {
  src: '/src/assets/images/hero_building_materials_1795190798157.jpg',
  alt: 'Kho trung bày Vật Liệu Xây Dựng Huệ Hảo với xi măng, thép thanh, đá tự nhiên và gạch xây dựng',
};

export const DEFAULT_STORE_PROFILE: StoreProfile = {
  brandShort: STORE_INFO.brandShort,
  brandFull: STORE_INFO.brandFull,
  address: STORE_INFO.address,
  mergedAddress: STORE_INFO.mergedAddress,
  phone1: STORE_INFO.phones[0].display,
  phone2: STORE_INFO.phones[1].display,
  hours: STORE_INFO.hours,
  zaloUrl: 'https://zalo.me/0913622702',
  googleMapsUrl: STORE_INFO.googleMapsUrl,
  googleMapsEmbedUrl: STORE_INFO.googleMapsEmbedUrl,
  fanpageUrl: STORE_INFO.fanpageUrl,
  facebookPersonalUrl: STORE_INFO.facebookPersonalUrl,
  contactDesc:
    'Quý khách có thể ghé trực tiếp cửa hàng để xem mẫu gạch, thiết bị vệ sinh Luxta, Letton, Toàn Mỹ và bảng màu sơn Tison, hoặc gọi điện để báo giá giao xe tận công trình.',
  heroTitle: 'Vật Liệu Xây Dựng Huệ Hảo — Đủ hàng, đúng chuẩn cho mọi công trình.',
  heroSubtitle: 'Chuyên cung cấp trọn gói từ vật liệu phần thô đến hoàn thiện:',
  heroBullets: [
    'Xi măng Hà Tiên chính hãng, cát đá xi măng, gạch ống, gạch đinh, gạch dán tường, lát nền đủ kích cỡ theo yêu cầu.',
    'Đại lý: Weber khu vực, thiết bị vệ sinh Luxta, American, Inax, Letton, đại lý Toàn Mỹ.',
  ],
  heroImage: HERO_IMAGE.src,
  addressImage: '',
};

export const MATERIALS_CATALOG: MaterialProduct[] = [
  {
    id: 'xi-mang-ha-tien-acifa',
    name: 'Xi măng Hà Tiên chính hãng & Xi măng Acifa',
    category: 'cement',
    categoryLabel: 'Xi măng',
    brand: 'Hà Tiên · Acifa',
    shortDesc: 'Xi măng Hà Tiên PCB40/Xây tô và Acifa bao 50kg mới xuất kho mỗi ngày, không vón cục.',
    fullDesc:
      'Cung cấp trực tiếp từ nhà máy xi măng Hà Tiên và Acifa. Bảo quản kho khô ráo trên pallet, đáp ứng cả nhu cầu đổ bê tông móng, cột, dầm sàn (PCB40) và vữa xây trát dẻo mịn (Xây tô).',
    image: '/src/assets/images/product_cement_bag_1795190797774.jpg',
    imageAlt: 'Bao xi măng 50kg đặt cạnh mẫu bê tông kiểm định',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Giao trong 2–4 giờ khu vực Tân Uyên',
    bulkNote: 'Gọi 0913 622 702 để chốt giá tốt khi lấy theo tấn / xe.',
    variants: [
      {
        id: 'xm-hatien-pcb40',
        label: 'Xi măng Hà Tiên Đa Dụng PCB40 · Bao 50kg',
        sku: 'XM-HT-40',
        unit: 'bao 50kg',
        price: 94000,
        stockQty: 1800,
        weightKg: 50,
      },
      {
        id: 'xm-hatien-xayto',
        label: 'Xi măng Hà Tiên Xây Tô · Bao 50kg',
        sku: 'XM-HT-XT',
        unit: 'bao 50kg',
        price: 85000,
        stockQty: 1200,
        weightKg: 50,
      },
      {
        id: 'xm-acifa-pcb40',
        label: 'Xi măng Acifa PCB40 · Bao 50kg',
        sku: 'XM-ACF-40',
        unit: 'bao 50kg',
        price: 83000,
        stockQty: 1400,
        weightKg: 50,
      },
    ],
    specs: [
      { label: 'Thương hiệu phân phối', value: 'Hà Tiên chính hãng · Acifa' },
      { label: 'Tiêu chuẩn chất lượng', value: 'TCVN 6260:2020' },
      { label: 'Quy cách đóng gói', value: '50 kg / bao' },
      { label: 'Ứng dụng chính', value: 'Bê tông kết cấu & Vữa xây tô' },
    ],
  },
  {
    id: 'sat-thep-xay-dung',
    name: 'Sắt thép xây dựng phi 6, 8, 10, 12, 14, 16...',
    category: 'steel',
    categoryLabel: 'Sắt thép & Hộp kẽm',
    brand: 'Hòa Phát · Pomina · Việt Nhật',
    shortDesc: 'Đầy đủ thép cuộn Ø6, Ø8 và thép cây gân Ø10, Ø12, Ø14, Ø16, Ø18, Ø20 chuẩn cây 11,7m.',
    fullDesc:
      'Sắt thép xây dựng chính hãng đủ ký, đủ ly, hỗ trợ giao xe cẩu tận công trình và cắt uốn theo yêu cầu. Đơn giá biến động theo thị trường được cửa hàng cập nhật trực tiếp mỗi ngày.',
    image: '/src/assets/images/product_steel_rebar_1795190797822.jpg',
    imageAlt: 'Bó thép thanh vằn kết cấu nhiều quy cách đường kính',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Xe cẩu giao trong ngày',
    bulkNote: 'Đơn giá thép cập nhật theo ngày, liên hệ chốt đơn công trình.',
    variants: [
      {
        id: 'thep-phi-6',
        label: 'Thép cuộn trơn Phi 6 (Ø6) · Tính theo kg',
        sku: 'TH-P06',
        unit: 'kg',
        price: 16500,
        stockQty: 12000,
        weightKg: 1,
      },
      {
        id: 'thep-phi-8',
        label: 'Thép cuộn trơn/gân Phi 8 (Ø8) · Tính theo kg',
        sku: 'TH-P08',
        unit: 'kg',
        price: 16500,
        stockQty: 15000,
        weightKg: 1,
      },
      {
        id: 'thep-phi-10',
        label: 'Thép cây vằn Phi 10 (Ø10) · Cây 11,7m',
        sku: 'TH-P10',
        unit: 'cây 11,7m',
        price: 118000,
        stockQty: 850,
        weightKg: 7.22,
      },
      {
        id: 'thep-phi-12',
        label: 'Thép cây vằn Phi 12 (Ø12) · Cây 11,7m',
        sku: 'TH-P12',
        unit: 'cây 11,7m',
        price: 170000,
        stockQty: 780,
        weightKg: 10.39,
      },
      {
        id: 'thep-phi-14',
        label: 'Thép cây vằn Phi 14 (Ø14) · Cây 11,7m',
        sku: 'TH-P14',
        unit: 'cây 11,7m',
        price: 232000,
        stockQty: 560,
        weightKg: 14.15,
      },
      {
        id: 'thep-phi-16',
        label: 'Thép cây vằn Phi 16 (Ø16) · Cây 11,7m',
        sku: 'TH-P16',
        unit: 'cây 11,7m',
        price: 304000,
        stockQty: 490,
        weightKg: 18.49,
      },
    ],
    specs: [
      { label: 'Chủng loại', value: 'Cuộn Ø6, Ø8 & Cây Ø10 – Ø20' },
      { label: 'Chiều dài thép cây', value: '11,7 m / cây' },
      { label: 'Mác thép tiêu chuẩn', value: 'CB240-T / CB300-V / CB400-V' },
      { label: 'Hỗ trợ vận chuyển', value: 'Xe tải / Xe cẩu tận bãi' },
    ],
  },
  {
    id: 'thep-hop-vuong-kem',
    name: 'Thép hộp & Thép vuông mạ kẽm các loại',
    category: 'steel',
    categoryLabel: 'Sắt thép & Hộp kẽm',
    brand: 'Hoa Sen · Hòa Phát · Đông Á',
    shortDesc: 'Sắt hộp chữ nhật, vuông kẽm độ dày 1.0 – 2.0mm cho khung kèo mái tôn, cửa sắt, hàng rào.',
    fullDesc:
      'Thép hộp và thép vuông mạ kẽm nhúng nóng bề mặt sáng bóng, chống rỉ sét ngoài trời. Có đủ kích thước thông dụng từ vuông 20×20, 30×30, 40×40, 50×50 đến hộp 20×40, 30×60, 40×80, cây dài 6m.',
    image: '/src/assets/images/product_galvanized_steel_tubes_1795191877989.jpg',
    imageAlt: 'Thép hộp và thép vuông mạ kẽm nhiều kích thước xếp gọn',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Có sẵn đủ độ dày 1.1ly, 1.2ly, 1.4ly, 1.8ly theo nhu cầu.',
    variants: [
      {
        id: 'kem-vuong-20x20',
        label: 'Vuông kẽm 20×20 mm · Dày 1.2ly · Cây 6m',
        sku: 'VK-2020-12',
        unit: 'cây 6m',
        price: 82000,
        stockQty: 420,
        weightKg: 4.3,
      },
      {
        id: 'kem-vuong-30x30',
        label: 'Vuông kẽm 30×30 mm · Dày 1.2ly · Cây 6m',
        sku: 'VK-3030-12',
        unit: 'cây 6m',
        price: 124000,
        stockQty: 380,
        weightKg: 6.6,
      },
      {
        id: 'kem-vuong-40x40',
        label: 'Vuông kẽm 40×40 mm · Dày 1.4ly · Cây 6m',
        sku: 'VK-4040-14',
        unit: 'cây 6m',
        price: 196000,
        stockQty: 310,
        weightKg: 10.3,
      },
      {
        id: 'kem-hop-20x40',
        label: 'Hộp kẽm 20×40 mm · Dày 1.2ly · Cây 6m',
        sku: 'HK-2040-12',
        unit: 'cây 6m',
        price: 126000,
        stockQty: 360,
        weightKg: 6.6,
      },
      {
        id: 'kem-hop-40x80',
        label: 'Hộp kẽm 40×80 mm · Dày 1.4ly · Cây 6m',
        sku: 'HK-4080-14',
        unit: 'cây 6m',
        price: 298000,
        stockQty: 240,
        weightKg: 15.6,
      },
    ],
    specs: [
      { label: 'Chiều dài tiêu chuẩn', value: '6,0 m / cây' },
      { label: 'Lớp phủ bề mặt', value: 'Mạ kẽm Z80 – Z120 chống rỉ' },
      { label: 'Quy cách phổ biến', value: 'Vuông 20–50 · Hộp 20×40 – 50×100' },
      { label: 'Ứng dụng', value: 'Xà gồ mái tôn, khung nhà tiền chế, cửa' },
    ],
  },
  {
    id: 'gach-ong-gach-dinh',
    name: 'Gạch ống, gạch đinh & gạch xây các loại',
    category: 'aggregates',
    categoryLabel: 'Cát, Đá & Gạch xây',
    brand: 'Gạch Tuynel Đồng Nai · Bình Dương',
    shortDesc: 'Gạch ống 4 lỗ, gạch đinh đặc, gạch 6 lỗ nung già lửa, ít vỡ cạnh khi vận chuyển.',
    fullDesc:
      'Gạch đất sét nung lò Tuynel đạt chuẩn xây dựng dân dụng và nhà xưởng. Giao lẻ theo thiên (1.000 viên) hoặc nguyên xe tải ben/xe cẩu bốc xếp gọn tại công trình.',
    image: '/src/assets/images/product_terracotta_bricks_1795190797307.jpg',
    imageAlt: 'Gạch đất nung Tuynel lỗ tròn xếp vuông vức',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Đơn giá tính theo lô 1.000 viên (1 thiên).',
    variants: [
      {
        id: 'gach-ong-4lo',
        label: 'Gạch ống 4 lỗ Tuynel · Lô 1.000 viên',
        sku: 'GX-ONG4-1K',
        unit: '1.000 viên',
        price: 1280000,
        stockQty: 260,
        weightKg: 1350,
      },
      {
        id: 'gach-dinh-dac',
        label: 'Gạch đinh đặc (gạch thẻ) · Lô 1.000 viên',
        sku: 'GX-DINH-1K',
        unit: '1.000 viên',
        price: 1380000,
        stockQty: 180,
        weightKg: 1650,
      },
      {
        id: 'gach-6lo',
        label: 'Gạch ống 6 lỗ · Lô 1.000 viên',
        sku: 'GX-ONG6-1K',
        unit: '1.000 viên',
        price: 1490000,
        stockQty: 140,
        weightKg: 1550,
      },
    ],
    specs: [
      { label: 'Chủng loại', value: 'Gạch ống 4 lỗ · Gạch đinh · Gạch 6 lỗ' },
      { label: 'Kích thước gạch ống', value: '80 × 80 × 180 mm' },
      { label: 'Định mức tường 10', value: '~55 viên / m²' },
      { label: 'Hình thức giao', value: 'Xe tải ben / Xe cẩu bốc pallet' },
    ],
  },
  {
    id: 'cat-song-cat-thuong-da-xay-dung',
    name: 'Cát sông, cát thường & Đá mi bụi, mi sàn, đá 4×6',
    category: 'aggregates',
    categoryLabel: 'Cát, Đá & Gạch xây',
    brand: 'Mỏ đá Tân Uyên · Cát Đồng Nai',
    shortDesc: 'Đủ loại cát sông vàng đổ bê tông, cát xây tô/san lấp, đá mi bụi, đá mi sàng, đá 4×6, đá 1×2.',
    fullDesc:
      'Cung cấp cát đá sạch không lẫn tạp chất theo đúng khối lượng xe ben (2 khối, 3 khối, 5 khối, 10 khối) hoặc đóng bao nhỏ giao hẻm cho công trình sửa chữa.',
    image: '/src/assets/images/product_sand_gravel_aggregates_1795191878821.jpg',
    imageAlt: 'Mẫu cát sông vàng, đá mi bụi sàng và đá 4x6 xây dựng',
    availabilityText: 'Còn hàng tại bãi',
    leadTime: 'Xe ben giao trong 2 giờ',
    bulkNote: 'Giá theo m³ giao xe ben tại khu vực Tân Uyên & lân cận.',
    variants: [
      {
        id: 'cat-song-vang',
        label: 'Cát sông hạt lớn (Đổ bê tông) · Tính theo m³',
        sku: 'CD-CAT-SONG',
        unit: 'm³',
        price: 390000,
        stockQty: 400,
        weightKg: 1450,
      },
      {
        id: 'cat-thuong-xay-to',
        label: 'Cát thường (Xây tô / San lấp) · Tính theo m³',
        sku: 'CD-CAT-THG',
        unit: 'm³',
        price: 295000,
        stockQty: 500,
        weightKg: 1400,
      },
      {
        id: 'da-mi-bui',
        label: 'Đá mi bụi · Tính theo m³',
        sku: 'CD-DA-MIBUI',
        unit: 'm³',
        price: 270000,
        stockQty: 350,
        weightKg: 1500,
      },
      {
        id: 'da-mi-sang',
        label: 'Đá mi sàng (Mi sàn) · Tính theo m³',
        sku: 'CD-DA-MISANG',
        unit: 'm³',
        price: 310000,
        stockQty: 320,
        weightKg: 1520,
      },
      {
        id: 'da-4x6',
        label: 'Đá 4×6 (Làm móng, hạ tầng, đường) · Tính theo m³',
        sku: 'CD-DA-4X6',
        unit: 'm³',
        price: 345000,
        stockQty: 380,
        weightKg: 1550,
      },
      {
        id: 'da-1x2',
        label: 'Đá 1×2 xanh (Đổ bê tông) · Tính theo m³',
        sku: 'CD-DA-1X2',
        unit: 'm³',
        price: 385000,
        stockQty: 340,
        weightKg: 1580,
      },
    ],
    specs: [
      { label: 'Chủng loại cát', value: 'Cát sông vàng · Cát thường xây tô' },
      { label: 'Chủng loại đá', value: 'Đá mi bụi · Mi sàng · Đá 4×6 · Đá 1×2' },
      { label: 'Đơn vị bán', value: 'Xe ben theo m³ hoặc đóng bao' },
      { label: 'Cam kết khối lượng', value: 'Đo thùng xe minh bạch khi giao' },
    ],
  },
  {
    id: 'gach-op-lat-cac-loai',
    name: 'Gạch ốp lát các loại (Lát nền & Ốp tường)',
    category: 'tiles',
    categoryLabel: 'Gạch ốp lát & Keo Weber',
    brand: 'Viglacera · Prime · Đồng Tâm',
    shortDesc: 'Đầy đủ gạch men, gạch đá Porcelain bóng kính & men Matt 40×40, 60×60, 80×80, 30×60.',
    fullDesc:
      'Mẫu mã đa dạng tại showroom VLXD Huệ Hảo cho phòng khách, phòng ngủ, bếp, sân vườn chống trơn và nhà vệ sinh. Có sẵn mẫu thực tế để xem trực tiếp và hỗ trợ đổi trả nguyên hộp dư.',
    image: '/src/assets/images/product_ceramic_tiles_1795190798485.jpg',
    imageAlt: 'Các mẫu gạch ốp lát Porcelain vân đá khổ lớn',
    availabilityText: 'Sẵn mẫu tại cửa hàng',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Đơn giá tính theo m², hỗ trợ bốc xếp lên tầng trệt.',
    variants: [
      {
        id: 'gach-lat-60x60',
        label: 'Gạch lát nền Porcelain 60×60 cm · Tính theo m²',
        sku: 'GL-6060',
        unit: 'm²',
        price: 215000,
        stockQty: 1400,
        weightKg: 20,
      },
      {
        id: 'gach-lat-80x80',
        label: 'Gạch lát nền bóng kính / Matt 80×80 cm · Tính theo m²',
        sku: 'GL-8080',
        unit: 'm²',
        price: 295000,
        stockQty: 950,
        weightKg: 23,
      },
      {
        id: 'gach-op-30x60',
        label: 'Gạch ốp tường 30×60 cm · Tính theo m²',
        sku: 'GO-3060',
        unit: 'm²',
        price: 165000,
        stockQty: 1200,
        weightKg: 17,
      },
      {
        id: 'gach-san-40x40',
        label: 'Gạch sân vườn chống trơn 40×40 cm · Tính theo m²',
        sku: 'GS-4040',
        unit: 'm²',
        price: 135000,
        stockQty: 800,
        weightKg: 18,
      },
    ],
    specs: [
      { label: 'Kích thước phổ biến', value: '40×40 · 30×60 · 60×60 · 80×80 cm' },
      { label: 'Bề mặt', value: 'Bóng kính · Men Matt · Nhám chống trơn' },
      { label: 'Phân loại', value: 'Loại 1 chính hãng' },
      { label: 'Chính sách đổi', value: 'Nhận lại nguyên hộp chưa ngâm nước' },
    ],
  },
  {
    id: 'dai-ly-keo-weber',
    name: 'Đại lý keo dán gạch & chà ron Weber chính hãng',
    category: 'tiles',
    categoryLabel: 'Gạch ốp lát & Keo Weber',
    brand: 'Weber (Saint-Gobain)',
    shortDesc: 'Keo dán gạch Weber.tai fix, tai vis, tai gres chống bong tróc & keo chà ron Webercolor.',
    fullDesc:
      'VLXD Huệ Hảo là đại lý phân phối keo Weber chính hãng từ tập đoàn Saint-Gobain. Giải pháp ốp lát gạch khổ lớn, gạch ít hút nước Porcelain, khu vực ẩm ướt và hồ bơi đạt độ bám dính gấp đôi hồ dầu truyền thống.',
    image: '/src/assets/images/product_tile_adhesive_bag_1795191878061.jpg',
    imageAlt: 'Bao keo dán gạch chuyên dụng cùng bay răng cưa và gạch mẫu',
    availabilityText: 'Đại lý chính hãng',
    leadTime: 'Giao trong 2–4 giờ',
    bulkNote: 'Định mức 1 bao 25kg dán khoảng 5 – 6 m² gạch.',
    variants: [
      {
        id: 'weber-tai-fix-25kg',
        label: 'Keo dán gạch Weber.tai fix (Nội thất) · Bao 25kg',
        sku: 'WB-FIX-25',
        unit: 'bao 25kg',
        price: 225000,
        stockQty: 420,
        weightKg: 25,
      },
      {
        id: 'weber-tai-vis-25kg',
        label: 'Keo dán gạch Weber.tai vis (Ngoại thất/WC) · Bao 25kg',
        sku: 'WB-VIS-25',
        unit: 'bao 25kg',
        price: 265000,
        stockQty: 310,
        weightKg: 25,
      },
      {
        id: 'weber-tai-gres-25kg',
        label: 'Keo dán gạch khổ lớn Weber.tai gres · Bao 25kg',
        sku: 'WB-GRES-25',
        unit: 'bao 25kg',
        price: 460000,
        stockQty: 180,
        weightKg: 25,
      },
      {
        id: 'weber-color-power-1kg',
        label: 'Keo chà ron chống nấm mốc Webercolor Power · Gói 1kg',
        sku: 'WB-RON-1KG',
        unit: 'gói 1kg',
        price: 42000,
        stockQty: 650,
        weightKg: 1,
      },
    ],
    specs: [
      { label: 'Thương hiệu', value: 'Weber · Saint-Gobain chính hãng' },
      { label: 'Định mức dán', value: '~4 – 5 kg / m² (5–6 m²/bao 25kg)' },
      { label: 'Thời gian chỉnh gạch', value: 'Trong vòng 15 phút' },
      { label: 'Ưu điểm', value: 'Chống bong tróc, không co ngót, thi công sạch' },
    ],
  },
  {
    id: 'son-tison-cac-loai',
    name: 'Các sản phẩm sơn Tison chính hãng',
    category: 'paint-plumbing',
    categoryLabel: 'Sơn Tison & Ống nhựa',
    brand: 'Tison Paint',
    shortDesc: 'Đầy đủ sơn nước nội thất, ngoại thất, sơn lót chống kiềm, bột trét và chống thấm Tison.',
    fullDesc:
      'Phân phối đầy đủ các dòng sơn Tison chính hãng giá đại lý: Sơn mịn nội thất, sơn bóng lau chùi hiệu quả, sơn ngoại thất chống rêu mốc và chất chống thấm pha xi măng. Hỗ trợ chọn màu theo bảng màu Tison chuẩn.',
    image: '/src/assets/images/product_waterproof_paint_1795190797968.jpg',
    imageAlt: 'Thùng sơn nước và chống thấm Tison 18 lít cùng dụng cụ thi công',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Có sẵn quy cách lon 5L và thùng 18L, bao bột trét 40kg.',
    variants: [
      {
        id: 'tison-noi-that-18l',
        label: 'Sơn nội thất Tison Unilic / Satin · Thùng 18L',
        sku: 'TS-NT-18L',
        unit: 'thùng 18L',
        price: 1180000,
        stockQty: 140,
        weightKg: 24,
      },
      {
        id: 'tison-ngoai-that-18l',
        label: 'Sơn ngoại thất Tison bền màu · Thùng 18L',
        sku: 'TS-NGT-18L',
        unit: 'thùng 18L',
        price: 1850000,
        stockQty: 110,
        weightKg: 24,
      },
      {
        id: 'tison-lot-kiem-18l',
        label: 'Sơn lót chống kiềm Tison · Thùng 18L',
        sku: 'TS-LOT-18L',
        unit: 'thùng 18L',
        price: 1420000,
        stockQty: 95,
        weightKg: 22,
      },
      {
        id: 'tison-chong-tham-20kg',
        label: 'Chống thấm đa năng Tison CT-11A · Thùng 20kg',
        sku: 'TS-CT-20KG',
        unit: 'thùng 20kg',
        price: 1790000,
        stockQty: 85,
        weightKg: 20,
      },
      {
        id: 'tison-bot-tret-40kg',
        label: 'Bột trét tường Tison nội/ngoại thất · Bao 40kg',
        sku: 'TS-BT-40KG',
        unit: 'bao 40kg',
        price: 315000,
        stockQty: 320,
        weightKg: 40,
      },
    ],
    specs: [
      { label: 'Dòng sản phẩm', value: 'Nội thất · Ngoại thất · Lót kiềm · Chống thấm · Bột trét' },
      { label: 'Độ phủ lý thuyết', value: '10 – 12 m² / lít / lớp' },
      { label: 'Quy cách', value: 'Lon 5L · Thùng 18L · Bao 40kg' },
      { label: 'Nguồn gốc', value: 'Chính hãng Tison 100%' },
    ],
  },
  {
    id: 'ong-nhua-cap-thoat-nuoc',
    name: 'Ống nhựa cấp thoát nước & Phụ kiện (Ø21 – Ø114)',
    category: 'paint-plumbing',
    categoryLabel: 'Sơn Tison & Ống nhựa',
    brand: 'Bình Minh · Hoa Sen · Đệ Nhất',
    shortDesc: 'Ống nhựa PVC, PPR chịu nhiệt và đầy đủ co, tê, lơi, nối giảm, van khóa, keo dán ống.',
    fullDesc:
      'Cung cấp trọn bộ đường ống nước dân dụng từ ống cấp nước Ø21, Ø27, Ø34 đến ống thoát Ø60, Ø90, Ø114, Ø168 kèm đầy đủ phụ kiện khớp nối chính hãng.',
    image: '/src/assets/images/product_pvc_pipes_1795191877835.jpg',
    imageAlt: 'Bó ống nhựa PVC nhiều đường kính cùng phụ kiện co tê',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Chiết khấu cao cho thợ điện nước & công trình lấy nguyên bó.',
    variants: [
      {
        id: 'ong-pvc-21',
        label: 'Ống nhựa uPVC Ø21 · Cây dài 4m',
        sku: 'ON-PVC-21',
        unit: 'cây 4m',
        price: 36000,
        stockQty: 600,
        weightKg: 0.9,
      },
      {
        id: 'ong-pvc-27',
        label: 'Ống nhựa uPVC Ø27 · Cây dài 4m',
        sku: 'ON-PVC-27',
        unit: 'cây 4m',
        price: 49000,
        stockQty: 550,
        weightKg: 1.2,
      },
      {
        id: 'ong-pvc-60',
        label: 'Ống nhựa uPVC Ø60 · Cây dài 4m',
        sku: 'ON-PVC-60',
        unit: 'cây 4m',
        price: 128000,
        stockQty: 420,
        weightKg: 2.9,
      },
      {
        id: 'ong-pvc-90',
        label: 'Ống nhựa uPVC Ø90 · Cây dài 4m',
        sku: 'ON-PVC-90',
        unit: 'cây 4m',
        price: 215000,
        stockQty: 340,
        weightKg: 4.8,
      },
      {
        id: 'ong-pvc-114',
        label: 'Ống nhựa uPVC Ø114 · Cây dài 4m',
        sku: 'ON-PVC-114',
        unit: 'cây 4m',
        price: 315000,
        stockQty: 260,
        weightKg: 7.2,
      },
    ],
    specs: [
      { label: 'Chiều dài cây', value: '4,0 m / cây' },
      { label: 'Đường kính có sẵn', value: 'Ø21 · Ø27 · Ø34 · Ø42 · Ø60 · Ø90 · Ø114' },
      { label: 'Phụ kiện đi kèm', value: 'Co, Tê, Nối, Lơi, Van khóa, Keo dán' },
      { label: 'Tiêu chuẩn', value: 'TCVN 8491 / ISO 1452' },
    ],
  },
  {
    id: 'thiet-bi-ve-sinh-luxta-letton',
    name: 'Thiết bị vệ sinh Luxta & Letton (Bồn cầu, Lavabo, Gương, Sen vòi)',
    category: 'sanitary',
    categoryLabel: 'TBVS & Bồn nước',
    brand: 'Luxta · Letton',
    shortDesc: 'Trọn bộ bồn cầu liền khối, chậu rửa Lavabo, gương phòng tắm và sen vòi Luxta, Letton.',
    fullDesc:
      'Trưng bày và bán sẵn các mẫu thiết bị vệ sinh Luxta, Letton chính hãng: Bồn cầu men nano chống bám bẩn, chậu lavabo đặt bàn/treo tường, gương soi viền hợp kim, vòi sen nóng lạnh đồng thau mạ Crôm/Inox 304.',
    image: '/src/assets/images/product_sanitary_fixture_1795190798090.jpg',
    imageAlt: 'Bộ vòi lavabo và chậu sứ thiết bị vệ sinh cao cấp',
    availabilityText: 'Có sẵn tại cửa hàng',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Mua trọn combo phòng tắm được giảm thêm theo bộ.',
    variants: [
      {
        id: 'letton-bon-cau',
        label: 'Bồn cầu liền khối Letton men Nano xả xoáy',
        sku: 'VS-LT-BC01',
        unit: 'bộ',
        price: 3450000,
        stockQty: 35,
        weightKg: 42,
      },
      {
        id: 'letton-lavabo-guong',
        label: 'Chậu Lavabo sứ Letton + Gương soi phòng tắm',
        sku: 'VS-LT-LVG',
        unit: 'bộ',
        price: 1680000,
        stockQty: 48,
        weightKg: 18,
      },
      {
        id: 'luxta-sen-cay',
        label: 'Bộ sen cây tắm nóng lạnh Luxta Inox 304 / Đồng mạ',
        sku: 'VS-LX-SC01',
        unit: 'bộ',
        price: 2450000,
        stockQty: 40,
        weightKg: 4.5,
      },
      {
        id: 'luxta-voi-lavabo',
        label: 'Vòi Lavabo nóng lạnh Luxta chính hãng',
        sku: 'VS-LX-VL01',
        unit: 'cái',
        price: 890000,
        stockQty: 65,
        weightKg: 1.4,
      },
    ],
    specs: [
      { label: 'Thương hiệu', value: 'Luxta · Letton chính hãng' },
      { label: 'Danh mục', value: 'Bồn cầu · Lavabo · Gương · Vòi sen · Vòi rửa' },
      { label: 'Bảo hành hãng', value: '3 – 5 năm men sứ & lõi van' },
      { label: 'Hỗ trợ', value: 'Kiểm tra hàng tận nơi khi nhận' },
    ],
  },
  {
    id: 'bon-nuoc-bon-rua-chen-toan-my-letton',
    name: 'Bồn nước Toàn Mỹ & Bồn rửa chén Letton, Toàn Mỹ',
    category: 'sanitary',
    categoryLabel: 'TBVS & Bồn nước',
    brand: 'Toàn Mỹ · Letton',
    shortDesc: 'Bồn nước Inox 304 & bồn nhựa Toàn Mỹ 500L–2000L; chậu rửa chén Inox 2 ngăn Letton, Toàn Mỹ.',
    fullDesc:
      'Cung cấp chính hãng bồn nước Inox SUS 304 Toàn Mỹ (dáng đứng & dáng ngang, kèm chân đế thép chịu lực) và chậu rửa chén Inox đúc dày chống ồn thương hiệu Letton, Toàn Mỹ kèm bộ xả chống hôi.',
    image: '/src/assets/images/product_water_tank_sink_1795191877600.jpg',
    imageAlt: 'Bồn nước Inox đứng SUS 304 và bồn rửa chén Inox 304',
    availabilityText: 'Còn hàng tại kho',
    leadTime: 'Giao trong ngày',
    bulkNote: 'Đã bao gồm chân đế theo bồn nước và bộ xi-phông theo chậu rửa.',
    variants: [
      {
        id: 'toanmy-bon-inox-1000l',
        label: 'Bồn nước Inox Toàn Mỹ 1.000 Lít (Đứng / Ngang)',
        sku: 'TM-INOX-1000',
        unit: 'bồn',
        price: 3350000,
        stockQty: 28,
        weightKg: 34,
      },
      {
        id: 'toanmy-bon-inox-1500l',
        label: 'Bồn nước Inox Toàn Mỹ 1.500 Lít (Đứng / Ngang)',
        sku: 'TM-INOX-1500',
        unit: 'bồn',
        price: 4750000,
        stockQty: 18,
        weightKg: 45,
      },
      {
        id: 'toanmy-bon-nhua-1000l',
        label: 'Bồn nhựa Toàn Mỹ 1.000 Lít',
        sku: 'TM-NHUA-1000',
        unit: 'bồn',
        price: 2290000,
        stockQty: 24,
        weightKg: 26,
      },
      {
        id: 'toanmy-chau-chen-2ngan',
        label: 'Bồn rửa chén Inox 2 ngăn Toàn Mỹ (82×45 cm)',
        sku: 'TM-CHAU-8245',
        unit: 'bộ',
        price: 1550000,
        stockQty: 42,
        weightKg: 7.5,
      },
      {
        id: 'letton-chau-chen-duc',
        label: 'Bồn rửa chén Inox 304 đúc Letton (Kèm bộ xả)',
        sku: 'LT-CHAU-304',
        unit: 'bộ',
        price: 2150000,
        stockQty: 32,
        weightKg: 10.2,
      },
    ],
    specs: [
      { label: 'Chất liệu bồn nước', value: 'Inox SUS 304 / Nhựa nguyên sinh' },
      { label: 'Dung tích phổ biến', value: '500L · 1.000L · 1.500L · 2.000L' },
      { label: 'Chậu rửa chén', value: 'Toàn Mỹ · Letton kèm bộ xả chống hôi' },
      { label: 'Bảo hành bồn Inox', value: '12 năm chính hãng Toàn Mỹ' },
    ],
  },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

export interface EstimatorCommitmentItem {
  title: string;
  desc: string;
}

export interface EstimatorLineConfig {
  productId: string;
  variantId: string;
  rate: number;
  note: string;
}

export interface TileSizeSpec {
  id: string;
  label: string;
  widthCm: number;
  lengthCm: number;
  thicknessMm: number;
  defaultWastePct: number;
  preferredVariantId: string;
  adhesiveKgPerM2: number;
  trowelSize: string;
  applicationNote: string;
  recommendedAdhesiveVariantId: string;
}

export const TILE_SIZE_SPECS: TileSizeSpec[] = [
  {
    id: '30x30',
    label: '30 × 30 cm',
    widthCm: 30,
    lengthCm: 30,
    thicknessMm: 8,
    defaultWastePct: 6,
    preferredVariantId: 'gach-san-40x40',
    adhesiveKgPerM2: 4.0,
    trowelSize: 'Bay răng cưa 6 × 6 mm',
    applicationNote: 'Trét keo 1 mặt nền · Định mức NSX ~4,0 kg/m² (~6,2 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-fix-25kg',
  },
  {
    id: '30x60',
    label: '30 × 60 cm (Ốp tường)',
    widthCm: 30,
    lengthCm: 60,
    thicknessMm: 9,
    defaultWastePct: 6,
    preferredVariantId: 'gach-op-30x60',
    adhesiveKgPerM2: 4.5,
    trowelSize: 'Bay răng cưa 6 × 6 mm hoặc 8 × 8 mm',
    applicationNote: 'Trét keo 1 mặt tường/nền · Định mức NSX ~4,5 kg/m² (~5,5 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-fix-25kg',
  },
  {
    id: '40x40',
    label: '40 × 40 cm (Sân / Nền)',
    widthCm: 40,
    lengthCm: 40,
    thicknessMm: 8.5,
    defaultWastePct: 5,
    preferredVariantId: 'gach-san-40x40',
    adhesiveKgPerM2: 4.5,
    trowelSize: 'Bay răng cưa 8 × 8 mm',
    applicationNote: 'Trét keo 1 mặt nền · Định mức NSX ~4,5 kg/m² (~5,5 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-fix-25kg',
  },
  {
    id: '50x50',
    label: '50 × 50 cm',
    widthCm: 50,
    lengthCm: 50,
    thicknessMm: 9,
    defaultWastePct: 5,
    preferredVariantId: 'gach-lat-60x60',
    adhesiveKgPerM2: 5.0,
    trowelSize: 'Bay răng cưa 8 × 8 mm',
    applicationNote: 'Trét keo 1 mặt nền · Định mức NSX ~5,0 kg/m² (~5,0 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-fix-25kg',
  },
  {
    id: '60x60',
    label: '60 × 60 cm (Phổ biến)',
    widthCm: 60,
    lengthCm: 60,
    thicknessMm: 9.5,
    defaultWastePct: 5,
    preferredVariantId: 'gach-lat-60x60',
    adhesiveKgPerM2: 5.0,
    trowelSize: 'Bay răng cưa 8 × 8 mm hoặc 10 × 10 mm',
    applicationNote: 'Trét keo 1 mặt nền (hoặc 2 mặt nếu nền lồi lõm) · ~5,0 kg/m² (~5,0 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-fix-25kg',
  },
  {
    id: '80x80',
    label: '80 × 80 cm (Khổ lớn)',
    widthCm: 80,
    lengthCm: 80,
    thicknessMm: 10,
    defaultWastePct: 7,
    preferredVariantId: 'gach-lat-80x80',
    adhesiveKgPerM2: 6.5,
    trowelSize: 'Bay răng cưa 10 × 10 mm',
    applicationNote: 'NSX khuyến cáo trét keo 2 mặt (nền + lưng gạch) · ~6,5 kg/m² (~3,8 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-gres-25kg',
  },
  {
    id: '60x120',
    label: '60 × 120 cm (Khổ đại)',
    widthCm: 60,
    lengthCm: 120,
    thicknessMm: 10.5,
    defaultWastePct: 8,
    preferredVariantId: 'gach-lat-80x80',
    adhesiveKgPerM2: 7.0,
    trowelSize: 'Bay răng cưa 10 × 10 mm hoặc 12 × 12 mm',
    applicationNote: 'NSX bắt buộc trét keo 2 mặt chống bộp · ~7,0 kg/m² (~3,5 m²/bao 25kg)',
    recommendedAdhesiveVariantId: 'weber-tai-gres-25kg',
  },
];

export interface EstimatorConfig {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  slabTitle: string;
  wallTitle: string;
  tilingTitle: string;
  adhesiveTitle: string;
  paintTitle: string;
  rightEyebrow: string;
  rightTitle: string;
  rightDesc: string;
  commitItems: EstimatorCommitmentItem[];
  slabLines: {
    cement: EstimatorLineConfig;
    steel: EstimatorLineConfig;
    sand: EstimatorLineConfig;
    stone: EstimatorLineConfig;
  };
  wallLines: {
    brick: EstimatorLineConfig;
    cement: EstimatorLineConfig;
    sand: EstimatorLineConfig;
  };
  tilingLines: {
    tile: EstimatorLineConfig;
  };
  adhesiveLines: {
    adhesive: EstimatorLineConfig;
    grout: EstimatorLineConfig;
  };
  paintLines: {
    topcoat: EstimatorLineConfig;
    primer: EstimatorLineConfig;
  };
}

export const DEFAULT_ESTIMATOR_CONFIG: EstimatorConfig = {
  enabled: true,
  eyebrow: 'Công cụ tính nhanh khối lượng',
  title: 'Dự toán vật tư theo giá thực tế tại kho',
  subtitle:
    'Tính riêng từng hạng mục theo định mức xây dựng & khuyến cáo từ nhà sản xuất, đơn giá lấy trực tiếp từ kho.',
  slabTitle: 'Đổ bê tông sàn',
  wallTitle: 'Xây tường gạch',
  tilingTitle: 'Lát gạch',
  adhesiveTitle: 'Keo dán gạch',
  paintTitle: 'Sơn Tison hoàn thiện',
  rightEyebrow: 'Cam kết tại VLXD Huệ Hảo',
  rightTitle: 'Cung ứng trọn gói từ phần thô đến hoàn thiện',
  rightDesc:
    'Khách hàng và nhà thầu có thể đặt trọn bộ từ xi măng, sắt thép, cát đá, gạch xây cho tới gạch lát nền, keo Weber, sơn Tison, ống nhựa và thiết bị vệ sinh tại cùng một đầu mối để tối ưu chi phí vận chuyển.',
  commitItems: [
    {
      title: 'Thương hiệu phân phối chính hãng',
      desc: 'Xi măng Hà Tiên, Acifa · Sơn Tison · Keo dán gạch Weber · Thiết bị vệ sinh Luxta, Letton · Bồn nước & chậu rửa Toàn Mỹ.',
    },
    {
      title: 'Cân đo minh bạch · Giao xe tận công trình',
      desc: 'Xe ben giao cát đá đúng khối, xe tải & xe cẩu hạ hàng sắt thép, gạch, bồn nước tận nơi tại Phường Tân Đông Hiệp, TP. HCM và các khu vực lân cận.',
    },
  ],
  slabLines: {
    cement: {
      productId: 'xi-mang-ha-tien-acifa',
      variantId: 'xm-hatien-pcb40',
      rate: 7,
      note: 'Xi măng PCB40 Mác 200–250 (~7 bao / m³ bê tông)',
    },
    steel: {
      productId: 'sat-thep-xay-dung',
      variantId: 'thep-phi-12',
      rate: 105,
      note: '~105 kg thép sàn 2 lớp / m³ bê tông',
    },
    sand: {
      productId: 'cat-song-cat-thuong-da-xay-dung',
      variantId: 'cat-song-vang',
      rate: 0.5,
      note: 'Cát sông vàng đổ bê tông (~0,5 m³ / m³ bê tông)',
    },
    stone: {
      productId: 'cat-song-cat-thuong-da-xay-dung',
      variantId: 'da-1x2',
      rate: 0.85,
      note: 'Đá 1×2 xanh đổ bê tông (~0,85 m³ / m³ bê tông)',
    },
  },
  wallLines: {
    brick: {
      productId: 'gach-ong-gach-dinh',
      variantId: 'gach-ong-4lo',
      rate: 55,
      note: '~55 viên/m² tường 10 (100mm)',
    },
    cement: {
      productId: 'xi-mang-ha-tien-acifa',
      variantId: 'xm-hatien-xayto',
      rate: 0.22,
      note: 'Xi măng Xây Tô (~0,22 bao/m²)',
    },
    sand: {
      productId: 'cat-song-cat-thuong-da-xay-dung',
      variantId: 'cat-thuong-xay-to',
      rate: 0.03,
      note: 'Cát thường xây tô sạch (~0,03 m³/m²)',
    },
  },
  tilingLines: {
    tile: {
      productId: 'gach-op-lat-cac-loai',
      variantId: 'gach-lat-60x60',
      rate: 1.05,
      note: 'Đã cộng hao hụt cắt gạch góc tường',
    },
  },
  adhesiveLines: {
    adhesive: {
      productId: 'dai-ly-keo-weber',
      variantId: 'weber-tai-fix-25kg',
      rate: 5,
      note: 'Tính theo định mức khuyến cáo NSX Weber (bao 25kg)',
    },
    grout: {
      productId: 'dai-ly-keo-weber',
      variantId: 'weber-color-power-1kg',
      rate: 1,
      note: 'Keo chà ron chống nấm mốc theo kích thước gạch & độ rộng ron',
    },
  },
  paintLines: {
    topcoat: {
      productId: 'son-tison-cac-loai',
      variantId: 'tison-noi-that-18l',
      rate: 65,
      note: 'Sơn Tison nội thất 2 lớp (~65 m² / thùng 18L)',
    },
    primer: {
      productId: 'son-tison-cac-loai',
      variantId: 'tison-lot-kiem-18l',
      rate: 80,
      note: 'Sơn lót chống kiềm Tison 1 lớp (~80 m² / thùng 18L)',
    },
  },
};

function mergeLine(
  saved: Partial<EstimatorLineConfig> | undefined,
  fallback: EstimatorLineConfig
): EstimatorLineConfig {
  if (!saved || typeof saved !== 'object') return { ...fallback };
  const rate =
    typeof saved.rate === 'number' && Number.isFinite(saved.rate) && saved.rate > 0
      ? saved.rate
      : fallback.rate;
  return {
    productId:
      typeof saved.productId === 'string' && saved.productId.trim()
        ? saved.productId.trim()
        : fallback.productId,
    variantId:
      typeof saved.variantId === 'string' && saved.variantId.trim()
        ? saved.variantId.trim()
        : fallback.variantId,
    rate,
    note: typeof saved.note === 'string' ? saved.note : fallback.note,
  };
}

export function mergeEstimatorConfig(
  saved?: Partial<EstimatorConfig> | null
): EstimatorConfig {
  if (!saved || typeof saved !== 'object') {
    return {
      ...DEFAULT_ESTIMATOR_CONFIG,
      commitItems: DEFAULT_ESTIMATOR_CONFIG.commitItems.map((i) => ({ ...i })),
    };
  }

  const cleanCommits = Array.isArray(saved.commitItems)
    ? saved.commitItems
        .filter(
          (i): i is EstimatorCommitmentItem =>
            Boolean(i) &&
            typeof i === 'object' &&
            typeof i.title === 'string' &&
            i.title.trim().length > 0
        )
        .map((i) => ({
          title: i.title.trim(),
          desc: typeof i.desc === 'string' ? i.desc.trim() : '',
        }))
    : null;

  // Backward-compatible fallback if an older saved config stored adhesive inside tilingLines
  const legacyTilingAdhesive = (
    saved.tilingLines as { adhesive?: Partial<EstimatorLineConfig> } | undefined
  )?.adhesive;

  return {
    enabled: saved.enabled !== false,
    eyebrow:
      typeof saved.eyebrow === 'string' && saved.eyebrow.trim()
        ? saved.eyebrow
        : DEFAULT_ESTIMATOR_CONFIG.eyebrow,
    title:
      typeof saved.title === 'string' && saved.title.trim()
        ? saved.title
        : DEFAULT_ESTIMATOR_CONFIG.title,
    subtitle:
      typeof saved.subtitle === 'string' && saved.subtitle.trim()
        ? saved.subtitle
        : DEFAULT_ESTIMATOR_CONFIG.subtitle,
    slabTitle:
      typeof saved.slabTitle === 'string' && saved.slabTitle.trim()
        ? saved.slabTitle
        : DEFAULT_ESTIMATOR_CONFIG.slabTitle,
    wallTitle:
      typeof saved.wallTitle === 'string' && saved.wallTitle.trim()
        ? saved.wallTitle
        : DEFAULT_ESTIMATOR_CONFIG.wallTitle,
    tilingTitle:
      typeof saved.tilingTitle === 'string' && saved.tilingTitle.trim()
        ? saved.tilingTitle === 'Lát gạch & Keo Weber'
          ? DEFAULT_ESTIMATOR_CONFIG.tilingTitle
          : saved.tilingTitle
        : DEFAULT_ESTIMATOR_CONFIG.tilingTitle,
    adhesiveTitle:
      typeof saved.adhesiveTitle === 'string' && saved.adhesiveTitle.trim()
        ? saved.adhesiveTitle
        : DEFAULT_ESTIMATOR_CONFIG.adhesiveTitle,
    paintTitle:
      typeof saved.paintTitle === 'string' && saved.paintTitle.trim()
        ? saved.paintTitle
        : DEFAULT_ESTIMATOR_CONFIG.paintTitle,
    rightEyebrow:
      typeof saved.rightEyebrow === 'string' && saved.rightEyebrow.trim()
        ? saved.rightEyebrow
        : DEFAULT_ESTIMATOR_CONFIG.rightEyebrow,
    rightTitle:
      typeof saved.rightTitle === 'string' && saved.rightTitle.trim()
        ? saved.rightTitle
        : DEFAULT_ESTIMATOR_CONFIG.rightTitle,
    rightDesc:
      typeof saved.rightDesc === 'string' && saved.rightDesc.trim()
        ? saved.rightDesc
        : DEFAULT_ESTIMATOR_CONFIG.rightDesc,
    commitItems:
      cleanCommits && cleanCommits.length > 0
        ? cleanCommits
        : DEFAULT_ESTIMATOR_CONFIG.commitItems.map((i) => ({ ...i })),
    slabLines: {
      cement: mergeLine(saved.slabLines?.cement, DEFAULT_ESTIMATOR_CONFIG.slabLines.cement),
      steel: mergeLine(saved.slabLines?.steel, DEFAULT_ESTIMATOR_CONFIG.slabLines.steel),
      sand: mergeLine(saved.slabLines?.sand, DEFAULT_ESTIMATOR_CONFIG.slabLines.sand),
      stone: mergeLine(saved.slabLines?.stone, DEFAULT_ESTIMATOR_CONFIG.slabLines.stone),
    },
    wallLines: {
      brick: mergeLine(saved.wallLines?.brick, DEFAULT_ESTIMATOR_CONFIG.wallLines.brick),
      cement: mergeLine(saved.wallLines?.cement, DEFAULT_ESTIMATOR_CONFIG.wallLines.cement),
      sand: mergeLine(saved.wallLines?.sand, DEFAULT_ESTIMATOR_CONFIG.wallLines.sand),
    },
    tilingLines: {
      tile: mergeLine(saved.tilingLines?.tile, DEFAULT_ESTIMATOR_CONFIG.tilingLines.tile),
    },
    adhesiveLines: {
      adhesive: mergeLine(
        saved.adhesiveLines?.adhesive ?? legacyTilingAdhesive,
        DEFAULT_ESTIMATOR_CONFIG.adhesiveLines.adhesive
      ),
      grout: mergeLine(
        saved.adhesiveLines?.grout,
        DEFAULT_ESTIMATOR_CONFIG.adhesiveLines.grout
      ),
    },
    paintLines: {
      topcoat: mergeLine(
        saved.paintLines?.topcoat,
        DEFAULT_ESTIMATOR_CONFIG.paintLines.topcoat
      ),
      primer: mergeLine(saved.paintLines?.primer, DEFAULT_ESTIMATOR_CONFIG.paintLines.primer),
    },
  };
}

