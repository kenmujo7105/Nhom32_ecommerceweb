const db = require('./db');
const bcrypt = require('bcryptjs');

// Function to generate safe slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-]+/g, '') // remove all non-word chars
    .replace(/\-\-+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim leading -
    .replace(/-+$/, ''); // trim trailing -
}

async function seed() {
  try {
    console.log('Starting seed process...');

    // Clear existing data
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE order_items');
    await db.query('TRUNCATE TABLE orders');
    await db.query('TRUNCATE TABLE products');
    await db.query('TRUNCATE TABLE categories');
    await db.query('TRUNCATE TABLE users');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Cleared existing data.');

    // 1. Insert Categories
    const categories = [
      { name: 'Điện thoại', slug: 'dien-thoai' },
      { name: 'Laptop', slug: 'laptop' },
      { name: 'Âm thanh', slug: 'am-thanh' },
      { name: 'Phụ kiện', slug: 'phu-kien' }
    ];

    const categoryIdMap = {};
    for (const cat of categories) {
      const [res] = await db.query('INSERT INTO categories (name, slug) VALUES (?, ?)', [cat.name, cat.slug]);
      categoryIdMap[cat.slug] = res.insertId;
      console.log(`Inserted Category: ${cat.name} (ID: ${res.insertId})`);
    }

    // 2. Base Products (original 11 products)
    const baseProducts = [
      {
        category_slug: 'dien-thoai',
        name: 'iPhone 15 Pro Max 256GB',
        description: 'iPhone 15 Pro Max là chiếc iPhone đầu tiên sở hữu thiết kế bằng titan chuẩn vũ trụ nhẹ và bền bỉ. Nút Tác Vụ (Action Button) hoàn toàn mới thay thế công tắc gạt cũ. Camera 48MP Zoom quang học 5x cực đỉnh cùng chip A17 Pro mang lại hiệu năng chiến game đỉnh cao.',
        price: 34990000,
        sale_price: 31990000,
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=60',
        stock: 50
      },
      {
        category_slug: 'dien-thoai',
        name: 'Samsung Galaxy S24 Ultra 256GB',
        description: 'Chào đón kỷ nguyên quyền năng AI cùng Samsung Galaxy S24 Ultra. Thiết kế khung viền Titan sang trọng đi kèm bút S Pen huyền thoại. Sở hữu camera mắt thần bóng đêm 200MP zoom chuẩn studio và hiệu năng Snapdragon 8 Gen 3 for Galaxy mượt mà.',
        price: 31990000,
        sale_price: 28990000,
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=60',
        stock: 45
      },
      {
        category_slug: 'dien-thoai',
        name: 'Xiaomi 14 Ultra 5G',
        description: 'Xiaomi 14 Ultra là tuyệt tác di động hợp tác cùng Leica. Cảm biến chính 1 inch với khẩu độ vô cấp lớn nhất thế giới. Chip Snapdragon 8 Gen 3 mạnh mẽ hàng đầu kết hợp sạc siêu nhanh 90W đem lại trải nghiệm đỉnh cao vô hạn.',
        price: 29990000,
        sale_price: 26990000,
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=60',
        stock: 30
      },
      {
        category_slug: 'laptop',
        name: 'MacBook Pro 14" M3 Max',
        description: 'MacBook Pro 14 inch với chip M3 Max mang lại hiệu năng phi thường cho những tác vụ chuyên nghiệp nặng nhất. Thời lượng pin lên tới 22 giờ vượt trội cùng màn hình Liquid Retina XDR đẹp xuất sắc nhất lịch sử máy tính xách tay.',
        price: 79990000,
        sale_price: 74990000,
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },
      {
        category_slug: 'laptop',
        name: 'Dell XPS 15 9530 Core i9',
        description: 'Dell XPS 15 là chiếc laptop multimedia cao cấp bậc nhất của Dell. Trang ing vi xử lý Intel Core i9 Gen 13 và card đồ họa rời RTX 4060 cực khủng. Thiết kế viền siêu mỏng InfinityEdge đẳng cấp cùng chất liệu sợi carbon tinh tế.',
        price: 45990000,
        sale_price: 42990000,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
        stock: 20
      },
      {
        category_slug: 'laptop',
        name: 'ASUS ROG Zephyrus G14 OLED',
        description: 'Laptop gaming nhỏ gọn 14 inch sở hữu màn hình OLED 120Hz đẹp mắt. Hiệu năng đỉnh cao từ chip AMD Ryzen 9 và GPU NVIDIA RTX 4070. Thiết kế độc đáo, mỏng nhẹ, vừa là máy trạm làm việc vừa là cỗ máy chiến game hoàn hảo.',
        price: 39990000,
        sale_price: 37990000,
        image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60',
        stock: 25
      },
      {
        category_slug: 'am-thanh',
        name: 'Tai nghe chụp tai Sony WH-1000XM5',
        description: 'Tai nghe chống ồn chủ động tốt nhất thế giới với hai bộ xử lý kiểm soát 8 micro. Chất lượng âm thanh chuẩn Hi-Res ấn tượng cùng thời lượng pin 30 giờ. Thiết kế gọn nhẹ, đệm tai da êm ái cho cảm giác đeo thoải mái cả ngày dài.',
        price: 8490000,
        sale_price: 7490000,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
        stock: 60
      },
      {
        category_slug: 'am-thanh',
        name: 'Tai nghe Apple AirPods Pro 2 USB-C',
        description: 'Được tái thiết kế hoàn hảo với chip Apple H2 cho âm thanh sống động và khả năng chống ồn chủ động gấp đôi thế hệ trước. Sạc qua chuẩn kết nối USB-C tiện lợi cùng thời lượng pin dài, chống nước IP54 cực tốt.',
        price: 6190000,
        sale_price: 5690000,
        image_url: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?w=800&auto=format&fit=crop&q=60',
        stock: 80
      },
      {
        category_slug: 'am-thanh',
        name: 'Loa Bluetooth Marshall Stanmore III',
        description: 'Loa không dây gia đình mang thiết kế retro cổ điển đặc trưng của Marshall. Âm trường mở rộng tối đa cùng âm trầm ấm, uy lực. Kết nối Bluetooth 5.2 hiện đại và cổng AUX dễ dàng phối ghép thiết bị.',
        price: 9990000,
        sale_price: 9290000,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=60',
        stock: 20
      },
      {
        category_slug: 'phu-kien',
        name: 'Bàn phím cơ không dây Keychron K2 V2',
        description: 'Bàn phím cơ layout 75% gọn gàng phù hợp cho lập trình viên và người làm văn phòng. Kết nối 3 thiết bị cùng lúc qua Bluetooth ổn định. Thời lượng pin cực trâu cùng đèn nền RGB 18 hiệu ứng cực bắt mắt.',
        price: 1990000,
        sale_price: 1790000,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
        stock: 100
      },
      {
        category_slug: 'phu-kien',
        name: 'Chuột không dây Logitech MX Master 3S',
        description: 'Chuột công thái học hàng đầu cho nhà thiết kế và coder. Cảm biến 8000 DPI siêu nhạy trên mọi mặt phẳng. Nút cuộn điện từ MagSpeed nhanh và cực kỳ êm ái, hỗ trợ kết nối đa thiết bị dễ dàng.',
        price: 2490000,
        sale_price: 2290000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 120
      }
    ];

    // 50 New Products templates
    const newProducts = [
      // --- PHONES (12 items) ---
      {
        category_slug: 'dien-thoai',
        name: 'iPhone 15 128GB Chính Hãng',
        description: 'iPhone 15 có mặt lưng kính pha màu, camera chính 48MP mạnh mẽ với Telephoto 2x và cổng USB-C tiện dụng cùng thiết kế Dynamic Island cuốn hút.',
        price: 22990000,
        sale_price: 19990000,
        image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=60',
        stock: 35
      },
      {
        category_slug: 'dien-thoai',
        name: 'iPhone 14 Pro Max 256GB',
        description: 'Mẫu iPhone cao cấp sở hữu chip A16 Bionic cực mạnh, màn hình Always-On và camera Pro 48MP zoom cực xa rõ nét.',
        price: 27990000,
        sale_price: 24990000,
        image_url: 'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800&auto=format&fit=crop&q=60',
        stock: 22
      },
      {
        category_slug: 'dien-thoai',
        name: 'Google Pixel 8 Pro 128GB',
        description: 'Dòng điện thoại thuần Android tốt nhất với cụm camera AI thông minh, chụp đêm sắc nét và bộ xử lý Google Tensor G3 vượt trội.',
        price: 21990000,
        sale_price: 18990000,
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },
      {
        category_slug: 'dien-thoai',
        name: 'OnePlus 12 5G 256GB',
        description: 'Flagship Killer thế hệ mới sở hữu RAM 16GB, màn hình 2K AMOLED 120Hz mượt mà và sạc siêu tốc SuperVOOC 100W.',
        price: 18990000,
        sale_price: 16990000,
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60',
        stock: 18
      },
      {
        category_slug: 'dien-thoai',
        name: 'Sony Xperia 1 V',
        description: 'Điện thoại dành cho người đam mê nhiếp ảnh chuyên nghiệp. Màn hình OLED 4K HDR tỷ lệ 21:9 cùng cảm biến hình ảnh Exmor T đột phá.',
        price: 29990000,
        sale_price: 27490000,
        image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=60',
        stock: 10
      },
      {
        category_slug: 'dien-thoai',
        name: 'Samsung Galaxy Z Fold5 512GB',
        description: 'Điện thoại màn hình gập cao cấp, mở rộng không gian trải nghiệm như máy tính bảng. Thiết kế bản lề Flex mới không khe hở.',
        price: 40990000,
        sale_price: 36990000,
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=60',
        stock: 12
      },
      {
        category_slug: 'dien-thoai',
        name: 'Samsung Galaxy Z Flip5 256GB',
        description: 'Điện thoại gập vỏ sò thời thượng với màn hình ngoài Flex Window 3.4 inch cực cá tính. Chụp ảnh rảnh tay FlexCam tiện lợi.',
        price: 25990000,
        sale_price: 21990000,
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60',
        stock: 20
      },
      {
        category_slug: 'dien-thoai',
        name: 'Oppo Reno11 Pro 5G',
        description: 'Chuyên gia chân dung thế hệ mới của Oppo. Thiết kế mặt lưng kính vân đá sang trọng và hệ thống camera siêu sắc nét.',
        price: 15990000,
        sale_price: 13990000,
        image_url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=60',
        stock: 30
      },
      {
        category_slug: 'dien-thoai',
        name: 'Xiaomi Redmi Note 13 Pro 5G',
        description: 'Vua phân khúc tầm trung với camera 200MP chống rung OIS, màn hình AMOLED 1.5K 120Hz cùng sạc nhanh 67W ấn tượng.',
        price: 8990000,
        sale_price: 7990000,
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=60',
        stock: 50
      },
      {
        category_slug: 'dien-thoai',
        name: 'Vivo X100 Pro 5G',
        description: 'Điện thoại chụp ảnh hàng đầu sở hữu ống kính Zeiss APO Telephoto vượt trội, chip xử lý hình ảnh V3 và SoC Dimensity 9300.',
        price: 24990000,
        sale_price: 22990000,
        image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=60',
        stock: 14
      },
      {
        category_slug: 'dien-thoai',
        name: 'Realme 12 Pro+ 5G',
        description: 'Thiết kế cao cấp lấy cảm hứng từ đồng hồ xa xỉ, sở hữu camera tiềm vọng zoom quang học 3x ấn tượng trong phân khúc.',
        price: 11990000,
        sale_price: 9990000,
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60',
        stock: 25
      },
      {
        category_slug: 'dien-thoai',
        name: 'Asus ROG Phone 8 Pro 512GB',
        description: 'Mẫu smartphone gaming tối thượng với tản nhiệt AeroActive Cooler, nút trigger AirTrigger siêu nhạy và cấu hình mạnh nhất thế giới.',
        price: 29990000,
        sale_price: 27990000,
        image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },

      // --- LAPTOPS (12 items) ---
      {
        category_slug: 'laptop',
        name: 'MacBook Air 13" M3 8GB/256GB',
        description: 'MacBook Air mỏng nhẹ huyền thoại nay mạnh mẽ vượt trội với chip Apple M3 thế hệ mới. Thời lượng pin cực khủng lên tới 18 tiếng.',
        price: 27990000,
        sale_price: 25990000,
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60',
        stock: 25
      },
      {
        category_slug: 'laptop',
        name: 'Lenovo ThinkPad X1 Carbon Gen 11',
        description: 'Laptop doanh nhân cao cấp bằng sợi carbon siêu bền bỉ. Bàn phím gõ êm ái số một thế giới và tính năng bảo mật tối tân.',
        price: 49990000,
        sale_price: 46990000,
        image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60',
        stock: 10
      },
      {
        category_slug: 'laptop',
        name: 'HP Spectre x360 14" OLED Touch',
        description: 'Laptop xoay gập 360 độ siêu sang trọng, đi kèm bút cảm ứng thông minh và màn hình OLED 2.8K siêu rực rỡ.',
        price: 41990000,
        sale_price: 38990000,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
        stock: 12
      },
      {
        category_slug: 'laptop',
        name: 'ASUS Zenbook 14 OLED UX3405',
        description: 'Laptop siêu mỏng nhẹ thời trang sở hữu chip Intel Core Ultra mới tích hợp AI và màn hình Lumina OLED 120Hz.',
        price: 28990000,
        sale_price: 26490000,
        image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60',
        stock: 20
      },
      {
        category_slug: 'laptop',
        name: 'Acer Swift Edge 16 OLED mỏng nhẹ',
        description: 'Chiếc laptop 16 inch OLED siêu nhẹ chỉ 1.2kg được làm từ hợp kim Magie-Nhôm. Cấu hình mạnh mẽ từ chip AMD Ryzen 7.',
        price: 32990000,
        sale_price: 29990000,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },
      {
        category_slug: 'laptop',
        name: 'MSI Raider GE78 HX Gaming Beast',
        description: 'Quái thú gaming đích thực với CPU Core i9 HX cực khủng, GPU RTX 4080 và thanh đèn LED Mystic Light RGB cực ngầu.',
        price: 68990000,
        sale_price: 64990000,
        image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60',
        stock: 8
      },
      {
        category_slug: 'laptop',
        name: 'Lenovo Legion 5 Pro 16" RTX 4060',
        description: 'Dòng laptop gaming quốc dân được yêu thích nhất nhờ tản nhiệt Legion Coldfront 5.0 tối ưu và màn hình 2K 165Hz tuyệt vời.',
        price: 35990000,
        sale_price: 32990000,
        image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=60',
        stock: 18
      },
      {
        category_slug: 'laptop',
        name: 'Gigabyte AERO 16 OLED Creator',
        description: 'Laptop thiết kế chuyên nghiệp chuyên dành cho Creator. Màn hình 16" OLED đạt chuẩn màu sắc Pantone Validated.',
        price: 47990000,
        sale_price: 43990000,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
        stock: 11
      },
      {
        category_slug: 'laptop',
        name: 'LG Gram 16" 2024 siêu nhẹ',
        description: 'Siêu phẩm laptop văn phòng 16 inch nhưng nhẹ chưa tới 1.2kg. Đạt tiêu chuẩn độ bền quân đội Mỹ MIL-STD-810H.',
        price: 38990000,
        sale_price: 34990000,
        image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60',
        stock: 14
      },
      {
        category_slug: 'laptop',
        name: 'Huawei MateBook X Pro Premium',
        description: 'Laptop ultrabook siêu mỏng nhẹ cao cấp nhất của Huawei, sở hữu vỏ máy bằng kim loại nhám và màn hình cảm ứng 3.1K.',
        price: 39990000,
        sale_price: 36990000,
        image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=60',
        stock: 7
      },
      {
        category_slug: 'laptop',
        name: 'Dell Inspiron 16 5630',
        description: 'Laptop học tập - văn phòng màn hình lớn 16 inch sắc nét, hiệu năng ổn định từ chip Intel Core i5 thế hệ mới.',
        price: 21990000,
        sale_price: 19990000,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
        stock: 25
      },
      {
        category_slug: 'laptop',
        name: 'HP Pavilion 14 x360 Convertible',
        description: 'Laptop xoay gập tiện lợi trong tầm giá, màn hình cảm ứng mượt mà phục vụ tốt cho cả việc học lẫn giải trí.',
        price: 16990000,
        sale_price: 15490000,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=60',
        stock: 30
      },

      // --- AUDIO (12 items) ---
      {
        category_slug: 'am-thanh',
        name: 'Tai nghe Sony WF-1000XM5 ANC',
        description: 'Tai nghe True Wireless chống ồn đỉnh cao nhất thế giới với chip tích hợp V2 và driver Dynamic Driver X độc quyền.',
        price: 5990000,
        sale_price: 5290000,
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60',
        stock: 45
      },
      {
        category_slug: 'am-thanh',
        name: 'Tai nghe Bose QuietComfort Ultra',
        description: 'Mang lại trải nghiệm chống ồn huyền thoại của Bose kết hợp công nghệ âm thanh vòm Immersive Audio đỉnh cao.',
        price: 10990000,
        sale_price: 9990000,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
        stock: 20
      },
      {
        category_slug: 'am-thanh',
        name: 'Sennheiser Momentum 4 Wireless',
        description: 'Chất âm Audiophile trung thực cao kết hợp thời lượng pin siêu khủng lên tới 60 giờ nghe nhạc liên tục.',
        price: 8990000,
        sale_price: 7990000,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
        stock: 25
      },
      {
        category_slug: 'am-thanh',
        name: 'Loa Bluetooth JBL Flip 6 chống nước',
        description: 'Thiết kế di động năng động cùng khả năng chống bụi nước IP67 tuyệt đối. Âm thanh JBL Pro Sound uy lực trong thân hình nhỏ gọn.',
        price: 2990000,
        sale_price: 2690000,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=60',
        stock: 60
      },
      {
        category_slug: 'am-thanh',
        name: 'Loa Bluetooth Marshall Emberton II',
        description: 'Loa cầm tay mang phong cách vintage ấn tượng. Công nghệ True Stereophonic cho âm thanh 360 độ sống động.',
        price: 4990000,
        sale_price: 4490000,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=60',
        stock: 40
      },
      {
        category_slug: 'am-thanh',
        name: 'Loa Apple HomePod 2nd Gen',
        description: 'Loa thông minh gia đình tích hợp trợ lý ảo Siri, chất âm acoustics đỉnh cao và tự động tối ưu âm thanh theo phòng học.',
        price: 7990000,
        sale_price: 7490000,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },
      {
        category_slug: 'am-thanh',
        name: 'Loa Sony SRS-XB100 siêu nhỏ gọn',
        description: 'Loa di động siêu nhỏ gọn bỏ túi với dây đeo tiện lợi, chống nước cực tốt và âm thanh Extra Bass mạnh mẽ.',
        price: 1290000,
        sale_price: 1150000,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=60',
        stock: 80
      },
      {
        category_slug: 'am-thanh',
        name: 'SoundPeats Engine 4 Dual-Driver',
        description: 'Tai nghe bluetooth hi-res audio trang bị driver kép đồng trục cho âm thanh chi tiết, hỗ trợ codec LDAC cao cấp.',
        price: 1590000,
        sale_price: 1290000,
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60',
        stock: 70
      },
      {
        category_slug: 'am-thanh',
        name: 'Tai nghe Anker Soundcore Liberty 4',
        description: 'Tai nghe True Wireless tích hợp cảm biến đo nhịp tim thông minh, chống ồn chủ động thích ứng và âm thanh 3D spatial.',
        price: 2190000,
        sale_price: 1890000,
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60',
        stock: 50
      },
      {
        category_slug: 'am-thanh',
        name: 'Samsung Galaxy Buds2 Pro ANC',
        description: 'Trải nghiệm âm thanh vòm 360 độ và chống ồn chủ động thông minh cực nhạy từ Samsung. Thiết kế công thái học siêu nhẹ.',
        price: 3990000,
        sale_price: 2990000,
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60',
        stock: 35
      },
      {
        category_slug: 'am-thanh',
        name: 'Tai nghe Beats Studio Pro Wireless',
        description: 'Dòng tai nghe chụp tai biểu tượng mới của Beats. Hỗ trợ âm thanh Spatial Audio và kết nối USB-C Lossless.',
        price: 7990000,
        sale_price: 6990000,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
        stock: 22
      },
      {
        category_slug: 'am-thanh',
        name: 'Audio-Technica ATH-M50xBT2',
        description: 'Phiên bản không dây của chiếc tai nghe kiểm âm huyền thoại chuyên nghiệp được giới sản xuất âm nhạc tin dùng.',
        price: 5490000,
        sale_price: 4990000,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
        stock: 19
      },

      // --- ACCESSORIES (14 items) ---
      {
        category_slug: 'phu-kien',
        name: 'Bàn phím cơ Keychron K6 Layout 65%',
        description: 'Bàn phím cơ Bluetooth nhỏ gọn layout 65% hoàn hảo để mang đi làm việc bên ngoài hàng ngày.',
        price: 1890000,
        sale_price: 1690000,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
        stock: 60
      },
      {
        category_slug: 'phu-kien',
        name: 'Bàn phím cơ Keychron Q1 Pro',
        description: 'Bàn phím cơ custom vỏ nhôm CNC nguyên khối cực đầm tay, hỗ trợ hot-swap và kết nối không dây Bluetooth tiện lợi.',
        price: 4490000,
        sale_price: 4190000,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },
      {
        category_slug: 'phu-kien',
        name: 'Bàn phím Logitech MX Keys S',
        description: 'Bàn phím văn phòng cao cấp siêu mỏng, phím bấm thiết kế lõm ngón tay giúp gõ êm, nhanh và chính xác.',
        price: 2990000,
        sale_price: 2790000,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
        stock: 45
      },
      {
        category_slug: 'phu-kien',
        name: 'Chuột Gaming Razer DeathAdder V3 Pro',
        description: 'Mẫu chuột gaming siêu nhẹ chỉ 63g được thiết kế công thái học hoàn hảo bởi các vận động viên Esports.',
        price: 3490000,
        sale_price: 3190000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 35
      },
      {
        category_slug: 'phu-kien',
        name: 'Bàn phím cơ SteelSeries Apex Pro TKL',
        description: 'Bàn phím cơ nhanh nhất thế giới nhờ sử dụng Switch OmniPoint 2.0 có thể điều chỉnh điểm nhận phím linh hoạt.',
        price: 4890000,
        sale_price: 4490000,
        image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60',
        stock: 20
      },
      {
        category_slug: 'phu-kien',
        name: 'Pin sạc dự phòng Anker 737 140W',
        description: 'Sạc dự phòng dung lượng 24000mAh khủng hỗ trợ công nghệ sạc siêu nhanh hai chiều Power Delivery 3.1 lên tới 140W cực mạnh.',
        price: 2990000,
        sale_price: 2590000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 50
      },
      {
        category_slug: 'phu-kien',
        name: 'Micro thu âm HyperX QuadCast S RGB',
        description: 'Microphone thu âm chuyên nghiệp dành cho streamer và podcaster với đèn nền RGB đẹp mắt, chống rung tích hợp.',
        price: 3990000,
        sale_price: 3590000,
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=60',
        stock: 30
      },
      {
        category_slug: 'phu-kien',
        name: 'Ổ cứng SSD di động Samsung T7 Shield 1TB',
        description: 'Ổ cứng SSD di động siêu bền bỉ chống va đập, chống bụi nước chuẩn IP65 cùng tốc độ đọc ghi lên tới 1050 MB/s.',
        price: 2690000,
        sale_price: 2390000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 40
      },
      {
        category_slug: 'phu-kien',
        name: 'Bàn phím điều khiển Elgato Stream Deck MK.2',
        description: 'Công cụ điều khiển tối thượng cho streamer với 15 phím LCD tùy biến hoàn toàn để gán các phím tắt nhanh chóng.',
        price: 3990000,
        sale_price: 3690000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 15
      },
      {
        category_slug: 'phu-kien',
        name: 'Sạc nhanh Ugreen Nexode 100W GaN 4 cổng',
        description: 'Củ sạc công nghệ GaN siêu nhỏ gọn hỗ trợ sạc nhanh đồng thời 4 thiết bị với công suất tối đa lên tới 100W.',
        price: 1290000,
        sale_price: 1090000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 100
      },
      {
        category_slug: 'phu-kien',
        name: 'Chuột Gaming không dây Razer Viper V2 Pro',
        description: 'Mẫu chuột gaming siêu nhẹ chỉ 58g đạt độ chính xác tối đa nhờ cảm biến quang học Focus Pro 30K cực nhạy.',
        price: 3290000,
        sale_price: 2990000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 30
      },
      {
        category_slug: 'phu-kien',
        name: 'Giá đỡ Laptop nhôm cao cấp HyperWork L1',
        description: 'Giá đỡ laptop thiết kế công thái học bằng nhôm nguyên khối bền đẹp giúp nâng máy tản nhiệt và chống mỏi vai gáy.',
        price: 690000,
        sale_price: 590000,
        image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60',
        stock: 150
      },
      {
        category_slug: 'phu-kien',
        name: 'Tay cầm chơi game Sony DualSense PS5',
        description: 'Tay cầm chơi game thế hệ mới tích hợp công nghệ phản hồi rung chạm Haptic Feedback và cò sạc thích ứng Adaptive Triggers.',
        price: 1890000,
        sale_price: 1690000,
        image_url: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&auto=format&fit=crop&q=60',
        stock: 75
      },
      {
        category_slug: 'phu-kien',
        name: 'Màn hình ASUS ProArt PA279CV 27" 4K',
        description: 'Màn hình 27 inch độ phân giải 4K chuyên dụng dành cho đồ họa chuyên nghiệp với độ chính xác màu Delta E < 2.',
        price: 10990000,
        sale_price: 9990000,
        image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60',
        stock: 20
      }
    ];

    // Combine all products
    const allProducts = [...baseProducts, ...newProducts];

    for (const prod of allProducts) {
      const catId = categoryIdMap[prod.category_slug];
      const slug = prod.slug || slugify(prod.name);
      await db.query(
        `INSERT INTO products (category_id, name, slug, description, price, sale_price, image_url, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [catId, prod.name, slug, prod.description, prod.price, prod.sale_price, prod.image_url, prod.stock]
      );
      console.log(`Inserted Product: ${prod.name}`);
    }

    // 3. Insert Users (generate bcrypt hashes)
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const customerHash = await bcrypt.hash('customer123', salt);
    const userHash = await bcrypt.hash('user123', salt);

    const users = [
      {
        name: 'Quản trị viên',
        email: 'admin@ecommerce.com',
        password_hash: adminHash,
        phone: '0987654321',
        address: 'Hà Nội, Việt Nam',
        role: 'admin'
      },
      {
        name: 'Nguyễn Văn A',
        email: 'customer@ecommerce.com',
        password_hash: customerHash,
        phone: '0912345678',
        address: 'TP. Hồ Chí Minh, Việt Nam',
        role: 'customer'
      },
      {
        name: 'Trần Thị B',
        email: 'user@ecommerce.com',
        password_hash: userHash,
        phone: '0923456789',
        address: 'Đà Nẵng, Việt Nam',
        role: 'customer'
      }
    ];

    for (const usr of users) {
      await db.query(
        `INSERT INTO users (name, email, password_hash, phone, address, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [usr.name, usr.email, usr.password_hash, usr.phone, usr.address, usr.role]
      );
      console.log(`Inserted User: ${usr.name} (${usr.role})`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
