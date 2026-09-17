import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { 
  User, 
  HotelSettings, 
  RoomType, 
  Room, 
  Guest, 
  Reservation, 
  Stay, 
  Folio, 
  Payment, 
  HousekeepingTask, 
  MaintenanceTicket, 
  RestaurantCategory, 
  MenuItem, 
  RestaurantTable, 
  RestaurantOrder, 
  AuditLog, 
  Notification 
} from '../models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hotel_pms';

async function seed() {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    HotelSettings.deleteMany({}),
    RoomType.deleteMany({}),
    Room.deleteMany({}),
    Guest.deleteMany({}),
    Reservation.deleteMany({}),
    Stay.deleteMany({}),
    Folio.deleteMany({}),
    Payment.deleteMany({}),
    HousekeepingTask.deleteMany({}),
    MaintenanceTicket.deleteMany({}),
    RestaurantCategory.deleteMany({}),
    MenuItem.deleteMany({}),
    RestaurantTable.deleteMany({}),
    RestaurantOrder.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({})
  ]);

  console.log('[Seed] Creating Hotel Profile & Configuration...');
  const hotelSettings = await HotelSettings.create({
    hotelName: 'Grand View Hotel & Suites',
    legalName: 'Grand View Hospitality PLC',
    tagline: 'Your stay, thoughtfully made.',
    description: 'A premier luxury destination in the diplomatic heart of Addis Ababa, offering world-class comfort, panoramic mountain skylines, exquisite dining, and genuine Ethiopian hospitality.',
    logo: '/images/hotel-logo.svg',
    address: {
      street: 'Cameroon Street, Bole International Airport Corridor',
      city: 'Addis Ababa',
      subCity: 'Bole',
      country: 'Ethiopia',
      zipCode: '1000'
    },
    contact: {
      phone: '+251 11 667 8000',
      email: 'reservations@grandviewhotel.com',
      website: 'https://grandviewhotel.et',
      supportEmail: 'concierge@grandviewhotel.com'
    },
    operational: {
      checkInTime: '14:00',
      checkOutTime: '11:00',
      bookingPolicy: 'Guaranteed reservations require government-issued photo identification or valid passport upon check-in.',
      cancellationPolicy: 'Free cancellation up to 48 hours before check-in. Late cancellations or no-shows incur 1 night room rate.',
      maxGuestsPerBooking: 6
    },
    finance: {
      currency: 'ETB',
      currencySymbol: 'ETB',
      taxRate: 0.15,
      serviceChargeRate: 0.10,
      acceptedPaymentMethods: ['CASH', 'CREDIT_CARD', 'CHAPA', 'TELEBIRR', 'BANK_TRANSFER'],
      chapaEnabled: true,
      telebirrEnabled: true,
      stripeEnabled: false
    },
    features: [
      'Heated Panoramic Rooftop Pool',
      'Zoma Botanical Wellness & Spa',
      'Abyssinia Fine Dining Restaurant & Terrace',
      '24/7 Diplomatic Executive Lounge',
      'Complimentary Airport Shuttle (Every 30 mins)',
      'High-Speed Enterprise Wi-Fi 6',
      'State-of-the-Art Technogym Fitness Center',
      'Full Banquet & Conference Facilities'
    ]
  });

  console.log('[Seed] Creating Staff Accounts...');
  const users = await User.create([
    {
      name: 'Mulugeta Tadesse',
      email: 'admin@grandviewhotel.com',
      password: 'AdminPass123!',
      role: 'SUPER_ADMIN',
      phone: '+251 91 123 4567'
    },
    {
      name: 'Selamawit Bekele',
      email: 'manager@grandviewhotel.com',
      password: 'ManagerPass123!',
      role: 'HOTEL_MANAGER',
      phone: '+251 91 234 5678'
    },
    {
      name: 'Yared Haile',
      email: 'receptionist@grandviewhotel.com',
      password: 'ReceptionPass123!',
      role: 'RECEPTIONIST',
      phone: '+251 91 345 6789'
    },
    {
      name: 'Almaz Tefera',
      email: 'housekeeping@grandviewhotel.com',
      password: 'HousekeepingPass123!',
      role: 'HOUSEKEEPER',
      phone: '+251 91 456 7890'
    },
    {
      name: 'Dawit Kebede',
      email: 'restaurant@grandviewhotel.com',
      password: 'RestaurantPass123!',
      role: 'RESTAURANT_STAFF',
      phone: '+251 91 567 8901'
    },
    {
      name: 'Kassahun Girma',
      email: 'maintenance@grandviewhotel.com',
      password: 'MaintenancePass123!',
      role: 'MAINTENANCE',
      phone: '+251 91 678 9012'
    },
    {
      name: 'Bethlehem Worku',
      email: 'accountant@grandviewhotel.com',
      password: 'AccountantPass123!',
      role: 'ACCOUNTANT',
      phone: '+251 91 789 0123'
    }
  ]);

  const adminUser = users[0];
  const receptionistUser = users[2];
  const housekeeperUser = users[3];
  const maintenanceUser = users[5];

  console.log('[Seed] Creating Room Types...');
  const roomTypes = await RoomType.create([
    {
      code: 'SGL',
      name: 'Single Classic Room',
      category: 'Single',
      description: 'Ideal for solo business executives and light travelers, offering ergonomic workspace, plush bedding, and high-speed Wi-Fi.',
      shortDescription: 'Comfortable solo stay with dedicated workspace and city views.',
      basePrice: 3500,
      maxAdults: 1,
      maxChildren: 0,
      maxOccupancy: 1,
      bedType: 'Single Bed',
      sizeSquareMeters: 24,
      amenities: ['High-Speed Wi-Fi', '43-inch Smart TV', 'Ergonomic Desk', 'Rain Shower', 'Espresso Machine', 'Mini Bar'],
      features: ['City View', 'Soundproof Windows', 'In-room Safe'],
      mealPlan: 'Breakfast Included',
      cancellationPolicy: 'Free cancellation up to 48 hours prior',
      images: ['https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80'],
      displayOrder: 1
    },
    {
      code: 'DBL',
      name: 'Standard Double Room',
      category: 'Double',
      description: 'Spacious and gracefully furnished with a luxurious queen bed, marble en-suite bathroom, and panoramic floor-to-ceiling windows.',
      shortDescription: 'Ideal for couples or business travelers seeking superior comfort.',
      basePrice: 4800,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 2,
      bedType: 'Queen Bed',
      sizeSquareMeters: 32,
      amenities: ['High-Speed Wi-Fi', '50-inch 4K TV', 'Minibar', 'Bathrobe & Slippers', 'Tea & Coffee Bar', 'Work Desk'],
      features: ['Garden View', 'Deep Soaking Tub', 'Air Conditioning'],
      mealPlan: 'Buffet Breakfast Included',
      cancellationPolicy: 'Free cancellation up to 48 hours prior',
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'],
      displayOrder: 2
    },
    {
      code: 'TWN',
      name: 'Twin Executive Room',
      category: 'Twin',
      description: 'Featuring two premium single beds with orthopaedic mattresses, custom reading lights, and ample workspace for colleagues or traveling companions.',
      shortDescription: 'Two comfortable twin beds, modern en-suite and workspace.',
      basePrice: 5600,
      maxAdults: 2,
      maxChildren: 1,
      maxOccupancy: 2,
      bedType: '2 Twin Beds',
      sizeSquareMeters: 36,
      amenities: ['High-Speed Wi-Fi', 'Dual Workstations', '50-inch 4K TV', 'Rain Shower', 'Electronic Safe', 'Premium Toiletries'],
      features: ['Courtyard View', 'Blackout Curtains', 'Ironing Facilities'],
      mealPlan: 'Buffet Breakfast Included',
      cancellationPolicy: 'Free cancellation up to 48 hours prior',
      images: ['https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80'],
      displayOrder: 3
    },
    {
      code: 'DLX',
      name: 'Deluxe King Suite',
      category: 'Deluxe',
      description: 'The pinnacle of contemporary luxury, featuring an expansive Californian King bed, comfortable lounge area, and breathtaking views of Entoto Mountains.',
      shortDescription: 'Californian King bed, mountain views, and lavish lounge.',
      basePrice: 7500,
      maxAdults: 2,
      maxChildren: 2,
      maxOccupancy: 3,
      bedType: 'King Bed',
      sizeSquareMeters: 48,
      amenities: ['High-Speed Wi-Fi', '55-inch OLED TV', 'Separate Lounge', 'Italian Marble Bath', 'Nespresso Pods', 'Walk-in Closet'],
      features: ['Mountain View', 'Private Balcony', 'Butler Service on Request'],
      mealPlan: 'Full Gourmet Breakfast Included',
      cancellationPolicy: 'Free cancellation up to 48 hours prior',
      images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80'],
      displayOrder: 4
    },
    {
      code: 'JSTE',
      name: 'Junior Diplomatic Suite',
      category: 'Suite',
      description: 'Designed specifically for diplomats, executives, and discerning families, with an adjoining meeting room, executive kitchenette, and VIP club lounge privileges.',
      shortDescription: 'Diplomatic luxury with meeting salon and executive lounge access.',
      basePrice: 12000,
      maxAdults: 3,
      maxChildren: 2,
      maxOccupancy: 4,
      bedType: 'Super King Bed + Sofa Bed',
      sizeSquareMeters: 68,
      amenities: ['Executive Lounge Access', '65-inch Smart TV', 'Dining Table for 4', 'Jacuzzi Bath', 'Complimentary Laundry (2 pcs)', 'Airport Limousine'],
      features: ['High Floor Panoramic View', 'Soundproof Doors', 'Kitchenette'],
      mealPlan: 'Club Lounge Access & Full Breakfast',
      cancellationPolicy: 'Free cancellation up to 24 hours prior',
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80'],
      displayOrder: 5
    },
    {
      code: 'PRSTE',
      name: 'Presidential Horizon Suite',
      category: 'Presidential',
      description: 'The grandest residential suite in the city. Spanning the entire top corner with 180-degree skyline views, private dining salon, master spa bath, and private security detail entrance.',
      shortDescription: 'Ultimate top-floor penthouse with private dining and grand terrace.',
      basePrice: 24000,
      maxAdults: 4,
      maxChildren: 2,
      maxOccupancy: 5,
      bedType: 'Emperor Bed + Master Guest Suite',
      sizeSquareMeters: 140,
      amenities: ['Dedicated 24/7 Private Butler', 'Private Elevator Access', 'Walk-in Wine Cellar', 'Sauna & Jacuzzi', 'Meeting Boardroom for 8', 'Rolls-Royce Transfer'],
      features: ['360 Skyline Terrace', 'Bulletproof Glazing', 'Grand Piano'],
      mealPlan: 'All Meals & Premium Beverages Included',
      cancellationPolicy: 'Free cancellation up to 7 days prior',
      images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'],
      displayOrder: 6
    }
  ]);

  const [rtSgl, rtDbl, rtTwn, rtDlx, rtJste, rtPrste] = roomTypes;

  console.log('[Seed] Creating 32 Rooms across 4 Floors...');
  const roomsData = [
    // Floor 1 (101-108)
    { roomNumber: '101', floor: 1, roomType: rtSgl._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '102', floor: 1, roomType: rtSgl._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '103', floor: 1, roomType: rtDbl._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '104', floor: 1, roomType: rtDbl._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '105', floor: 1, roomType: rtDbl._id, status: 'DIRTY', cleanStatus: 'DIRTY' },
    { roomNumber: '106', floor: 1, roomType: rtTwn._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '107', floor: 1, roomType: rtTwn._id, status: 'RESERVED', cleanStatus: 'CLEAN' },
    { roomNumber: '108', floor: 1, roomType: rtSgl._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },

    // Floor 2 (201-208)
    { roomNumber: '201', floor: 2, roomType: rtDbl._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '202', floor: 2, roomType: rtDbl._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '203', floor: 2, roomType: rtTwn._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '204', floor: 2, roomType: rtTwn._id, status: 'CLEANING', cleanStatus: 'DIRTY' },
    { roomNumber: '205', floor: 2, roomType: rtDlx._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '206', floor: 2, roomType: rtDlx._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '207', floor: 2, roomType: rtDlx._id, status: 'RESERVED', cleanStatus: 'CLEAN' },
    { roomNumber: '208', floor: 2, roomType: rtDbl._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },

    // Floor 3 (301-308)
    { roomNumber: '301', floor: 3, roomType: rtDlx._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '302', floor: 3, roomType: rtDlx._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '303', floor: 3, roomType: rtDlx._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '304', floor: 3, roomType: rtJste._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '305', floor: 3, roomType: rtJste._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '306', floor: 3, roomType: rtJste._id, status: 'RESERVED', cleanStatus: 'CLEAN' },
    { roomNumber: '307', floor: 3, roomType: rtDlx._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '308', floor: 3, roomType: rtDlx._id, status: 'MAINTENANCE', cleanStatus: 'DIRTY', notes: 'AC Freon leak' },

    // Floor 4 (401-408)
    { roomNumber: '401', floor: 4, roomType: rtJste._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '402', floor: 4, roomType: rtJste._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '403', floor: 4, roomType: rtJste._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '404', floor: 4, roomType: rtDlx._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '405', floor: 4, roomType: rtDlx._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '406', floor: 4, roomType: rtDlx._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' },
    { roomNumber: '407', floor: 4, roomType: rtPrste._id, status: 'OCCUPIED', cleanStatus: 'CLEAN' },
    { roomNumber: '408', floor: 4, roomType: rtPrste._id, status: 'AVAILABLE', cleanStatus: 'CLEAN' }
  ];

  const rooms = await Room.create(roomsData);
  const roomMap: Record<string, any> = {};
  rooms.forEach(r => { roomMap[r.roomNumber] = r; });

  console.log('[Seed] Creating 25 Realistic Guests...');
  const guests = await Guest.create([
    { firstName: 'Abebe', lastName: 'Kebede', email: 'abebe.kebede@ethiopian.com', phone: '+251 91 144 2200', nationality: 'Ethiopian', idNumber: 'ET-883921', vipLevel: 'GOLD', totalStays: 4, totalSpend: 34000 },
    { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah.jenkins@unicef.org', phone: '+1 202 555 0184', nationality: 'American', idNumber: 'US-9284102', vipLevel: 'PLATINUM', totalStays: 6, totalSpend: 78000 },
    { firstName: 'Jean-Luc', lastName: 'Dupont', email: 'jl.dupont@totalenergies.fr', phone: '+33 6 12 34 56 78', nationality: 'French', idNumber: 'FR-448201', vipLevel: 'SILVER', totalStays: 2, totalSpend: 15000 },
    { firstName: 'Hiwot', lastName: 'Mengistu', email: 'hiwot.m@telecom.et', phone: '+251 92 333 4455', nationality: 'Ethiopian', idNumber: 'ET-554109', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 9600 },
    { firstName: 'Michael', lastName: 'Chang', email: 'mchang@huawei.cn', phone: '+86 138 0013 8000', nationality: 'Chinese', idNumber: 'CN-8839201', vipLevel: 'GOLD', totalStays: 5, totalSpend: 52000 },
    { firstName: 'Daniel', lastName: 'Tesfaye', email: 'daniel.t@cbe.com.et', phone: '+251 91 777 8899', nationality: 'Ethiopian', idNumber: 'ET-330192', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 7500 },
    { firstName: 'Elena', lastName: 'Rostova', email: 'elena.rostova@undp.org', phone: '+44 7700 900077', nationality: 'British', idNumber: 'UK-772910', vipLevel: 'SILVER', totalStays: 3, totalSpend: 28000 },
    { firstName: 'Samuel', lastName: 'Okoye', email: 's.okoye@afdb.org', phone: '+234 803 123 4567', nationality: 'Nigerian', idNumber: 'NG-192837', vipLevel: 'GOLD', totalStays: 4, totalSpend: 46000 },
    { firstName: 'Fatoumata', lastName: 'Diallo', email: 'f.diallo@au.int', phone: '+221 77 123 4567', nationality: 'Senegalese', idNumber: 'SN-789012', vipLevel: 'PLATINUM', totalStays: 8, totalSpend: 115000 },
    { firstName: 'Jonathan', lastName: 'Davies', email: 'jdavies@standardbank.co.za', phone: '+27 82 123 4567', nationality: 'South African', idNumber: 'ZA-556102', vipLevel: 'SILVER', totalStays: 2, totalSpend: 18000 },
    { firstName: 'Amina', lastName: 'Yusuf', email: 'amina.yusuf@safaricom.et', phone: '+251 97 123 4567', nationality: 'Ethiopian', idNumber: 'ET-990124', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 5600 },
    { firstName: 'Lars', lastName: 'Lindqvist', email: 'lars.l@ericsson.se', phone: '+46 70 123 4567', nationality: 'Swedish', idNumber: 'SE-882194', vipLevel: 'GOLD', totalStays: 3, totalSpend: 36000 },
    { firstName: 'Tewodros', lastName: 'Kassaye', email: 'ted.kassaye@midroc.et', phone: '+251 91 888 9900', nationality: 'Ethiopian', idNumber: 'ET-102938', vipLevel: 'PLATINUM', totalStays: 7, totalSpend: 92000 },
    { firstName: 'Claudia', lastName: 'Schmidt', email: 'c.schmidt@lufthansa.de', phone: '+49 171 1234567', nationality: 'German', idNumber: 'DE-991823', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 4800 },
    { firstName: 'Kofi', lastName: 'Mensah', email: 'kmensah@ecowas.int', phone: '+233 24 123 4567', nationality: 'Ghanaian', idNumber: 'GH-665123', vipLevel: 'SILVER', totalStays: 2, totalSpend: 24000 },
    { firstName: 'Rahel', lastName: 'Girma', email: 'rahel.g@awashbank.com', phone: '+251 91 555 6677', nationality: 'Ethiopian', idNumber: 'ET-443322', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 7500 },
    { firstName: 'Alexander', lastName: 'Weber', email: 'a.weber@giz.de', phone: '+49 160 9876543', nationality: 'German', idNumber: 'DE-332194', vipLevel: 'GOLD', totalStays: 4, totalSpend: 49000 },
    { firstName: 'Bethlehem', lastName: 'Alemu', email: 'betti.alemu@solerebels.com', phone: '+251 91 222 3344', nationality: 'Ethiopian', idNumber: 'ET-887766', vipLevel: 'PLATINUM', totalStays: 6, totalSpend: 84000 },
    { firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.m@wfp.org', phone: '+34 600 123 456', nationality: 'Spanish', idNumber: 'ES-119928', vipLevel: 'SILVER', totalStays: 3, totalSpend: 22500 },
    { firstName: 'Grace', lastName: 'Wanjiku', email: 'g.wanjiku@kcbgroup.com', phone: '+254 712 345678', nationality: 'Kenyan', idNumber: 'KE-778899', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 5600 },
    { firstName: 'Yohannes', lastName: 'Desta', email: 'yohannes@dashenbanksc.com', phone: '+251 91 999 0011', nationality: 'Ethiopian', idNumber: 'ET-551122', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 4800 },
    { firstName: 'Dr. Tariq', lastName: 'Mansoor', email: 'tariq.mansoor@who.int', phone: '+971 50 123 4567', nationality: 'Emirati', idNumber: 'AE-445566', vipLevel: 'PLATINUM', totalStays: 5, totalSpend: 68000 },
    { firstName: 'Meseret', lastName: 'Wolde', email: 'meseret.w@eia.gov.et', phone: '+251 91 333 2211', nationality: 'Ethiopian', idNumber: 'ET-773311', vipLevel: 'SILVER', totalStays: 2, totalSpend: 15000 },
    { firstName: 'Lucas', lastName: 'Silva', email: 'lucas.silva@valeglobal.com', phone: '+55 21 98765 4321', nationality: 'Brazilian', idNumber: 'BR-990011', vipLevel: 'STANDARD', totalStays: 1, totalSpend: 7500 },
    { firstName: 'Birtukan', lastName: 'Shiferaw', email: 'birtukan.s@mfa.gov.et', phone: '+251 91 444 5566', nationality: 'Ethiopian', idNumber: 'ET-228844', vipLevel: 'GOLD', totalStays: 4, totalSpend: 48000 }
  ]);

  console.log('[Seed] Creating Restaurant POS Catalog & Tables...');
  const catTrad = await RestaurantCategory.create({ name: 'Traditional Ethiopian', description: 'Authentic culinary treasures prepared with aromatic clarified butter and berbere.', displayOrder: 1 });
  const catIntl = await RestaurantCategory.create({ name: 'International Mains', description: 'Masterfully prepared continental and global dishes.', displayOrder: 2 });
  const catSteak = await RestaurantCategory.create({ name: 'Prime Steaks & Grills', description: 'Dry-aged prime cuts grilled over acacia charcoal.', displayOrder: 3 });
  const catCoffee = await RestaurantCategory.create({ name: 'Specialty Coffee & Desserts', description: 'Origin Ethiopian Yirgacheffe and Sidama coffees paired with artisan patisserie.', displayOrder: 4 });
  const catBeverages = await RestaurantCategory.create({ name: 'Wines & Signature Cocktails', description: 'Curated international cellar, Rift Valley wines, and artisanal cocktails.', displayOrder: 5 });

  const menuItems = await MenuItem.create([
    // Traditional
    { name: 'Special Doro Wat Deluxe', category: catTrad._id, description: 'Slow-simmered tender organic chicken with rich spiced berbere sauce, boiled egg, and ayib cottage cheese.', price: 650, preparationTimeMinutes: 20, dietaryTags: ['Halal'] },
    { name: 'Shekla Special Tibs', category: catTrad._id, description: 'Sizzling prime tenderloin cubes sautéed with rosemary, red onions, garlic, and fresh green chili served on hot clay.', price: 720, preparationTimeMinutes: 18, dietaryTags: ['Halal'] },
    { name: 'Beyaynetu Royale (Vegan Platter)', category: catTrad._id, description: 'An extravagant colorful spread of yellow split peas, spicy red lentils, collard greens, beetroot, and shiro on teff injera.', price: 520, preparationTimeMinutes: 15, dietaryTags: ['Vegan', 'Vegetarian'] },
    { name: 'Special Shiro Tegabino', category: catTrad._id, description: 'Bubbling organic chickpea and broad bean stew cooked with spiced butter in a volcanic clay pot.', price: 420, preparationTimeMinutes: 15, dietaryTags: ['Vegetarian'] },
    { name: 'Kitfo Special Gourmet', category: catTrad._id, description: 'Hand-chopped lean prime beef warmed in niter kibbeh (clarified spiced butter) and mitmita, served with kocho and ayib.', price: 750, preparationTimeMinutes: 15, dietaryTags: ['Halal'] },

    // International
    { name: 'Pan-Seared Nile Perch', category: catIntl._id, description: 'Fresh Lake Tana perch fillet with lemon butter sauce, wild asparagus, and herb-roasted potato medallions.', price: 850, preparationTimeMinutes: 25, dietaryTags: ['Gluten-Free'] },
    { name: 'Fettuccine Truffle Alfredo', category: catIntl._id, description: 'Handmade fresh pasta ribbons tossed with black truffle essence, aged Parmesan, and garlic cream.', price: 680, preparationTimeMinutes: 20, dietaryTags: ['Vegetarian'] },
    { name: 'Grand View Club Sandwich', category: catIntl._id, description: 'Triple-decker toasted brioche with smoked turkey breast, crispy beef bacon, fried egg, cheddar, and Dijon mayo.', price: 540, preparationTimeMinutes: 15 },
    { name: 'Crispy Calamari & Tiger Prawns', category: catIntl._id, description: 'Golden semolina crusted squid rings and colossal prawns with saffron garlic aioli.', price: 780, preparationTimeMinutes: 18 },

    // Steaks
    { name: 'Charcoal Grilled Ribeye (300g)', category: catSteak._id, description: '28-day aged prime Angus ribeye with roasted garlic butter, red wine jus, and truffle fries.', price: 1250, preparationTimeMinutes: 25, dietaryTags: ['Gluten-Free'] },
    { name: 'Herb-Crusted Lamb Rack', category: catSteak._id, description: 'Debre Birhan highland lamb cutlets crusted with rosemary and thyme, accompanied by mint pea puree.', price: 1150, preparationTimeMinutes: 25 },

    // Coffee & Desserts
    { name: 'Traditional Ethiopian Coffee Ceremony', category: catCoffee._id, description: 'Freshly roasted green beans washed in frankincense smoke, boiled in clay jebena, served with popped corn.', price: 280, preparationTimeMinutes: 15 },
    { name: 'Warm Chocolate Lava Cake', category: catCoffee._id, description: 'Decadent Valrhona dark chocolate cake with molten core, served with Tahitian vanilla bean gelato.', price: 380, preparationTimeMinutes: 15 },
    { name: 'Tiramisu Della Casa', category: catCoffee._id, description: 'Traditional Italian mascarpone cream layered with espresso-soaked ladyfingers and dusting of Dutch cocoa.', price: 350, preparationTimeMinutes: 10 },

    // Beverages
    { name: 'Rift Valley Cabernet Sauvignon (Bottle)', category: catBeverages._id, description: 'Full-bodied Ethiopian vintage from the Ziway shores with notes of ripe blackberry and oak.', price: 1800, preparationTimeMinutes: 5 },
    { name: 'Acacia Sunset Cocktail', category: catBeverages._id, description: 'Aged rum, pomegranate reduction, passion fruit puree, and sparkling tonic over crystal ice.', price: 420, preparationTimeMinutes: 5 },
    { name: 'Fresh Mango & Avocado Sprizz', category: catBeverages._id, description: 'Layers of pure fresh tropical mango and Hass avocado pulp with lime spritz.', price: 220, preparationTimeMinutes: 8, dietaryTags: ['Vegan'] }
  ]);

  const tables = await RestaurantTable.create([
    { tableNumber: 'T-01', capacity: 2, status: 'AVAILABLE' },
    { tableNumber: 'T-02', capacity: 2, status: 'OCCUPIED' },
    { tableNumber: 'T-03', capacity: 4, status: 'AVAILABLE' },
    { tableNumber: 'T-04', capacity: 4, status: 'AVAILABLE' },
    { tableNumber: 'T-05', capacity: 6, status: 'AVAILABLE' },
    { tableNumber: 'T-06', capacity: 6, status: 'AVAILABLE' },
    { tableNumber: 'T-07', capacity: 8, status: 'AVAILABLE' },
    { tableNumber: 'T-08', capacity: 10, status: 'AVAILABLE' }
  ]);

  console.log('[Seed] Creating Active Stays, Reservations, Folios & Payments...');
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // 1. IN-HOUSE GUEST 1: Abebe Kebede in Room 103 (Double)
  const res1CheckIn = new Date(now.getTime() - 2 * dayMs);
  const res1CheckOut = new Date(now.getTime() + 1 * dayMs);
  const res1 = await Reservation.create({
    bookingNumber: 'GVH-10482',
    source: 'WEBSITE', // ONLINE booking
    guest: guests[0]._id,
    roomType: rtDbl._id,
    assignedRoom: roomMap['103']._id,
    checkInDate: res1CheckIn,
    checkOutDate: res1CheckOut,
    nights: 3,
    adults: 2,
    status: 'CHECKED_IN',
    paymentStatus: 'PAID',
    paymentMethod: 'CHAPA',
    pricing: {
      roomRatePerNight: 4800,
      subtotal: 14400,
      tax: 2160,
      serviceCharge: 1440,
      discount: 0,
      total: 18000,
      paidAmount: 18000,
      balance: 0
    },
    specialRequests: 'High floor preferred. Late check-in around 19:00.'
  });

  const folio1 = await Folio.create({
    folioNumber: 'FOL-10482',
    reservation: res1._id,
    guest: guests[0]._id,
    room: roomMap['103']._id,
    items: [
      {
        date: res1CheckIn,
        category: 'ROOM_CHARGE',
        description: 'Standard Double Room - 3 Nights',
        quantity: 3,
        unitPrice: 4800,
        subtotal: 14400,
        tax: 2160,
        serviceCharge: 1440,
        total: 18000
      }
    ],
    subtotal: 14400,
    taxTotal: 2160,
    serviceChargeTotal: 1440,
    discountTotal: 0,
    grandTotal: 18000,
    paidTotal: 18000,
    balance: 0,
    status: 'SETTLED'
  });

  const pmt1 = await Payment.create({
    transactionId: 'TXN-ONLINE-CHAPA-10482',
    folio: folio1._id,
    reservation: res1._id,
    guest: guests[0]._id,
    amount: 18000,
    currency: 'ETB',
    paymentMethod: 'CHAPA',
    status: 'PAID',
    providerReference: 'CHAPA-AUTH-99281',
    paidAt: res1CheckIn
  });
  folio1.payments.push(pmt1._id);
  await folio1.save();

  const stay1 = await Stay.create({
    reservation: res1._id,
    guest: guests[0]._id,
    room: roomMap['103']._id,
    roomType: rtDbl._id,
    checkInTime: res1CheckIn,
    scheduledCheckOut: res1CheckOut,
    folio: folio1._id,
    status: 'IN_HOUSE',
    keyCardsIssued: 2
  });
  res1.stayRef = stay1._id;
  await res1.save();
  folio1.stay = stay1._id;
  await folio1.save();
  roomMap['103'].currentStay = stay1._id;
  roomMap['103'].currentReservation = res1._id;
  await roomMap['103'].save();

  // 2. IN-HOUSE GUEST 2: Sarah Jenkins in Room 304 (Junior Diplomatic Suite)
  const res2CheckIn = new Date(now.getTime() - 1 * dayMs);
  const res2CheckOut = new Date(now.getTime() + 3 * dayMs);
  const res2 = await Reservation.create({
    bookingNumber: 'GVH-20914',
    source: 'CORPORATE',
    guest: guests[1]._id,
    roomType: rtJste._id,
    assignedRoom: roomMap['304']._id,
    checkInDate: res2CheckIn,
    checkOutDate: res2CheckOut,
    nights: 4,
    adults: 2,
    status: 'CHECKED_IN',
    paymentStatus: 'PARTIAL',
    paymentMethod: 'CREDIT_CARD',
    pricing: {
      roomRatePerNight: 12000,
      subtotal: 48000,
      tax: 7200,
      serviceCharge: 4800,
      discount: 0,
      total: 60000,
      paidAmount: 30000,
      balance: 30000
    },
    specialRequests: 'UNICEF corporate rate applied. Needs quiet room.'
  });

  const folio2 = await Folio.create({
    folioNumber: 'FOL-20914',
    reservation: res2._id,
    guest: guests[1]._id,
    room: roomMap['304']._id,
    items: [
      {
        date: res2CheckIn,
        category: 'ROOM_CHARGE',
        description: 'Junior Diplomatic Suite - 4 Nights',
        quantity: 4,
        unitPrice: 12000,
        subtotal: 48000,
        tax: 7200,
        serviceCharge: 4800,
        total: 60000
      },
      {
        date: new Date(now.getTime() - 12 * 3600 * 1000),
        category: 'RESTAURANT',
        description: 'Restaurant Charge (ORD-881201): Shekla Special Tibs, Rift Valley Cabernet',
        quantity: 1,
        unitPrice: 2520,
        subtotal: 2520,
        tax: 378,
        serviceCharge: 252,
        total: 3150,
        referenceId: 'ORD-881201'
      }
    ],
    subtotal: 50520,
    taxTotal: 7578,
    serviceChargeTotal: 5052,
    discountTotal: 0,
    grandTotal: 63150,
    paidTotal: 30000,
    balance: 33150,
    status: 'OPEN'
  });

  const pmt2 = await Payment.create({
    transactionId: 'TXN-CARD-20914',
    folio: folio2._id,
    reservation: res2._id,
    guest: guests[1]._id,
    amount: 30000,
    currency: 'ETB',
    paymentMethod: 'CREDIT_CARD',
    status: 'PAID',
    providerReference: 'VISA-992011',
    paidAt: res2CheckIn
  });
  folio2.payments.push(pmt2._id);
  await folio2.save();

  const stay2 = await Stay.create({
    reservation: res2._id,
    guest: guests[1]._id,
    room: roomMap['304']._id,
    roomType: rtJste._id,
    checkInTime: res2CheckIn,
    scheduledCheckOut: res2CheckOut,
    folio: folio2._id,
    status: 'IN_HOUSE',
    keyCardsIssued: 2
  });
  res2.stayRef = stay2._id;
  await res2.save();
  folio2.stay = stay2._id;
  await folio2.save();
  roomMap['304'].currentStay = stay2._id;
  roomMap['304'].currentReservation = res2._id;
  await roomMap['304'].save();

  // Create restaurant order charged to Room 304
  await RestaurantOrder.create({
    orderNumber: 'ORD-881201',
    orderType: 'ROOM_SERVICE',
    items: [
      { menuItem: menuItems[1]._id, name: 'Shekla Special Tibs', quantity: 1, unitPrice: 720, subtotal: 720 },
      { menuItem: menuItems[14]._id, name: 'Rift Valley Cabernet Sauvignon (Bottle)', quantity: 1, unitPrice: 1800, subtotal: 1800 }
    ],
    subtotal: 2520,
    tax: 378,
    serviceCharge: 252,
    total: 3150,
    status: 'PAID',
    chargedToRoom: true,
    room: roomMap['304']._id,
    stay: stay2._id,
    guest: guests[1]._id,
    folio: folio2._id,
    paymentMethod: 'ROOM_CHARGE',
    paidAt: new Date(now.getTime() - 12 * 3600 * 1000)
  });

  // 3. IN-HOUSE GUEST 3: Fatoumata Diallo in Room 407 (Presidential Suite)
  const res3CheckIn = new Date(now.getTime() - 1 * dayMs);
  const res3CheckOut = new Date(now.getTime() + 2 * dayMs);
  const res3 = await Reservation.create({
    bookingNumber: 'GVH-30119',
    source: 'CORPORATE',
    guest: guests[8]._id,
    roomType: rtPrste._id,
    assignedRoom: roomMap['407']._id,
    checkInDate: res3CheckIn,
    checkOutDate: res3CheckOut,
    nights: 3,
    adults: 2,
    status: 'CHECKED_IN',
    paymentStatus: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    pricing: {
      roomRatePerNight: 24000,
      subtotal: 72000,
      tax: 10800,
      serviceCharge: 7200,
      discount: 0,
      total: 90000,
      paidAmount: 90000,
      balance: 0
    },
    specialRequests: 'VIP Diplomatic reception, airport Rolls-Royce pick-up.'
  });

  const folio3 = await Folio.create({
    folioNumber: 'FOL-30119',
    reservation: res3._id,
    guest: guests[8]._id,
    room: roomMap['407']._id,
    items: [
      {
        date: res3CheckIn,
        category: 'ROOM_CHARGE',
        description: 'Presidential Horizon Suite - 3 Nights',
        quantity: 3,
        unitPrice: 24000,
        subtotal: 72000,
        tax: 10800,
        serviceCharge: 7200,
        total: 90000
      }
    ],
    subtotal: 72000,
    taxTotal: 10800,
    serviceChargeTotal: 7200,
    discountTotal: 0,
    grandTotal: 90000,
    paidTotal: 90000,
    balance: 0,
    status: 'SETTLED'
  });

  const pmt3 = await Payment.create({
    transactionId: 'TXN-BANK-30119',
    folio: folio3._id,
    reservation: res3._id,
    guest: guests[8]._id,
    amount: 90000,
    currency: 'ETB',
    paymentMethod: 'BANK_TRANSFER',
    status: 'PAID',
    providerReference: 'CBE-WIRE-449102',
    paidAt: res3CheckIn
  });
  folio3.payments.push(pmt3._id);
  await folio3.save();

  const stay3 = await Stay.create({
    reservation: res3._id,
    guest: guests[8]._id,
    room: roomMap['407']._id,
    roomType: rtPrste._id,
    checkInTime: res3CheckIn,
    scheduledCheckOut: res3CheckOut,
    folio: folio3._id,
    status: 'IN_HOUSE',
    keyCardsIssued: 3
  });
  res3.stayRef = stay3._id;
  await res3.save();
  folio3.stay = stay3._id;
  await folio3.save();
  roomMap['407'].currentStay = stay3._id;
  roomMap['407'].currentReservation = res3._id;
  await roomMap['407'].save();

  // 4. IN-HOUSE GUESTS in 106, 202, 205, 302, 402, 405
  const inHouseConfigs = [
    { roomNum: '106', rt: rtTwn, guest: guests[4], nights: 2, price: 5600, source: 'WEBSITE' },
    { roomNum: '202', rt: rtDbl, guest: guests[2], nights: 3, price: 4800, source: 'PHONE' },
    { roomNum: '205', rt: rtDlx, guest: guests[3], nights: 2, price: 7500, source: 'WALK_IN' },
    { roomNum: '302', rt: rtDlx, guest: guests[7], nights: 4, price: 7500, source: 'TRAVEL_AGENT' },
    { roomNum: '402', rt: rtJste, guest: guests[11], nights: 3, price: 12000, source: 'CORPORATE' },
    { roomNum: '405', rt: rtDlx, guest: guests[12], nights: 2, price: 7500, source: 'WEBSITE' }
  ];

  for (let i = 0; i < inHouseConfigs.length; i++) {
    const cfg = inHouseConfigs[i];
    const checkIn = new Date(now.getTime() - (i % 2 === 0 ? 1 : 2) * dayMs);
    const checkOut = new Date(checkIn.getTime() + cfg.nights * dayMs);
    const subtotal = cfg.price * cfg.nights;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const sc = Math.round(subtotal * 0.10 * 100) / 100;
    const total = subtotal + tax + sc;

    const bookingNum = `GVH-${40000 + i}`;
    const r = await Reservation.create({
      bookingNumber: bookingNum,
      source: cfg.source,
      guest: cfg.guest._id,
      roomType: cfg.rt._id,
      assignedRoom: roomMap[cfg.roomNum]._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights: cfg.nights,
      adults: 2,
      status: 'CHECKED_IN',
      paymentStatus: 'PAID',
      paymentMethod: cfg.source === 'WEBSITE' ? 'TELEBIRR' : 'CREDIT_CARD',
      pricing: {
        roomRatePerNight: cfg.price,
        subtotal,
        tax,
        serviceCharge: sc,
        discount: 0,
        total,
        paidAmount: total,
        balance: 0
      }
    });

    const fol = await Folio.create({
      folioNumber: `FOL-${40000 + i}`,
      reservation: r._id,
      guest: cfg.guest._id,
      room: roomMap[cfg.roomNum]._id,
      items: [
        {
          date: checkIn,
          category: 'ROOM_CHARGE',
          description: `${cfg.rt.name} - ${cfg.nights} Nights`,
          quantity: cfg.nights,
          unitPrice: cfg.price,
          subtotal,
          tax,
          serviceCharge: sc,
          total
        }
      ],
      subtotal,
      taxTotal: tax,
      serviceChargeTotal: sc,
      discountTotal: 0,
      grandTotal: total,
      paidTotal: total,
      balance: 0,
      status: 'SETTLED'
    });

    const pmt = await Payment.create({
      transactionId: `TXN-${40000 + i}`,
      folio: fol._id,
      reservation: r._id,
      guest: cfg.guest._id,
      amount: total,
      currency: 'ETB',
      paymentMethod: cfg.source === 'WEBSITE' ? 'TELEBIRR' : 'CREDIT_CARD',
      status: 'PAID',
      providerReference: `AUTH-${Date.now() + i}`,
      paidAt: checkIn
    });
    fol.payments.push(pmt._id);
    await fol.save();

    const st = await Stay.create({
      reservation: r._id,
      guest: cfg.guest._id,
      room: roomMap[cfg.roomNum]._id,
      roomType: cfg.rt._id,
      checkInTime: checkIn,
      scheduledCheckOut: checkOut,
      folio: fol._id,
      status: 'IN_HOUSE',
      keyCardsIssued: 2
    });
    r.stayRef = st._id;
    await r.save();
    fol.stay = st._id;
    await fol.save();

    roomMap[cfg.roomNum].currentStay = st._id;
    roomMap[cfg.roomNum].currentReservation = r._id;
    await roomMap[cfg.roomNum].save();
  }

  // 5. TODAY'S & FUTURE CONFIRMED RESERVATIONS (Upcoming Arrivals)
  const upcomingConfigs = [
    { roomNum: '107', rt: rtTwn, guest: guests[5], nights: 3, offsetDays: 0, source: 'WEBSITE' },
    { roomNum: '207', rt: rtDlx, guest: guests[6], nights: 4, offsetDays: 0, source: 'WEBSITE' },
    { roomNum: '306', rt: rtJste, guest: guests[9], nights: 5, offsetDays: 1, source: 'CORPORATE' },
    { roomNum: '101', rt: rtSgl, guest: guests[10], nights: 2, offsetDays: 2, source: 'WEBSITE' },
    { roomNum: '201', rt: rtDbl, guest: guests[13], nights: 3, offsetDays: 2, source: 'PHONE' },
    { roomNum: '301', rt: rtDlx, guest: guests[14], nights: 4, offsetDays: 3, source: 'WEBSITE' },
    { roomNum: '401', rt: rtJste, guest: guests[15], nights: 2, offsetDays: 4, source: 'TRAVEL_AGENT' },
    { roomNum: '408', rt: rtPrste, guest: guests[21], nights: 3, offsetDays: 5, source: 'CORPORATE' }
  ];

  for (let i = 0; i < upcomingConfigs.length; i++) {
    const cfg = upcomingConfigs[i];
    const checkIn = new Date(now.getTime() + cfg.offsetDays * dayMs);
    const checkOut = new Date(checkIn.getTime() + cfg.nights * dayMs);
    const subtotal = cfg.rt.basePrice * cfg.nights;
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const sc = Math.round(subtotal * 0.10 * 100) / 100;
    const total = subtotal + tax + sc;

    const bookingNum = `GVH-${50000 + i}`;
    const r = await Reservation.create({
      bookingNumber: bookingNum,
      source: cfg.source,
      guest: cfg.guest._id,
      roomType: cfg.rt._id,
      assignedRoom: roomMap[cfg.roomNum]._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights: cfg.nights,
      adults: 2,
      status: 'CONFIRMED',
      paymentStatus: cfg.source === 'WEBSITE' ? 'PAID' : 'PENDING',
      paymentMethod: cfg.source === 'WEBSITE' ? 'CHAPA' : 'PAY_AT_HOTEL',
      pricing: {
        roomRatePerNight: cfg.rt.basePrice,
        subtotal,
        tax,
        serviceCharge: sc,
        discount: 0,
        total,
        paidAmount: cfg.source === 'WEBSITE' ? total : 0,
        balance: cfg.source === 'WEBSITE' ? 0 : total
      }
    });

    await Folio.create({
      folioNumber: `FOL-${50000 + i}`,
      reservation: r._id,
      guest: cfg.guest._id,
      room: roomMap[cfg.roomNum]._id,
      items: [
        {
          date: checkIn,
          category: 'ROOM_CHARGE',
          description: `${cfg.rt.name} - ${cfg.nights} Nights`,
          quantity: cfg.nights,
          unitPrice: cfg.rt.basePrice,
          subtotal,
          tax,
          serviceCharge: sc,
          total
        }
      ],
      subtotal,
      taxTotal: tax,
      serviceChargeTotal: sc,
      discountTotal: 0,
      grandTotal: total,
      paidTotal: cfg.source === 'WEBSITE' ? total : 0,
      balance: cfg.source === 'WEBSITE' ? 0 : total,
      status: cfg.source === 'WEBSITE' ? 'SETTLED' : 'OPEN'
    });
  }

  // 6. PAST COMPLETED RESERVATIONS (CHECKED_OUT)
  const pastConfigs = [
    { roomNum: '104', rt: rtDbl, guest: guests[16], nights: 3, pastDays: 7, total: 18000 },
    { roomNum: '206', rt: rtDlx, guest: guests[17], nights: 2, pastDays: 5, total: 18750 },
    { roomNum: '303', rt: rtDlx, guest: guests[18], nights: 4, pastDays: 4, total: 37500 },
    { roomNum: '403', rt: rtJste, guest: guests[19], nights: 3, pastDays: 3, total: 45000 },
    { roomNum: '108', rt: rtSgl, guest: guests[20], nights: 2, pastDays: 6, total: 8750 }
  ];

  for (let i = 0; i < pastConfigs.length; i++) {
    const cfg = pastConfigs[i];
    const checkIn = new Date(now.getTime() - (cfg.pastDays + cfg.nights) * dayMs);
    const checkOut = new Date(now.getTime() - cfg.pastDays * dayMs);

    const bookingNum = `GVH-${60000 + i}`;
    const r = await Reservation.create({
      bookingNumber: bookingNum,
      source: 'WEBSITE',
      guest: cfg.guest._id,
      roomType: cfg.rt._id,
      assignedRoom: roomMap[cfg.roomNum]._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights: cfg.nights,
      adults: 1,
      status: 'CHECKED_OUT',
      paymentStatus: 'PAID',
      paymentMethod: 'CHAPA',
      pricing: {
        roomRatePerNight: cfg.rt.basePrice,
        subtotal: cfg.total * 0.8,
        tax: cfg.total * 0.12,
        serviceCharge: cfg.total * 0.08,
        discount: 0,
        total: cfg.total,
        paidAmount: cfg.total,
        balance: 0
      }
    });

    const fol = await Folio.create({
      folioNumber: `FOL-${60000 + i}`,
      reservation: r._id,
      guest: cfg.guest._id,
      room: roomMap[cfg.roomNum]._id,
      items: [
        {
          date: checkIn,
          category: 'ROOM_CHARGE',
          description: `${cfg.rt.name} - ${cfg.nights} Nights`,
          quantity: cfg.nights,
          unitPrice: cfg.rt.basePrice,
          subtotal: cfg.total * 0.8,
          tax: cfg.total * 0.12,
          serviceCharge: cfg.total * 0.08,
          total: cfg.total
        }
      ],
      subtotal: cfg.total * 0.8,
      taxTotal: cfg.total * 0.12,
      serviceChargeTotal: cfg.total * 0.08,
      discountTotal: 0,
      grandTotal: cfg.total,
      paidTotal: cfg.total,
      balance: 0,
      status: 'SETTLED',
      closedAt: checkOut
    });

    const st = await Stay.create({
      reservation: r._id,
      guest: cfg.guest._id,
      room: roomMap[cfg.roomNum]._id,
      roomType: cfg.rt._id,
      checkInTime: checkIn,
      scheduledCheckOut: checkOut,
      actualCheckOutTime: checkOut,
      folio: fol._id,
      status: 'CHECKED_OUT',
      keyCardsIssued: 1
    });
    r.stayRef = st._id;
    await r.save();
  }

  console.log('[Seed] Creating Housekeeping Tasks & Maintenance Tickets...');
  await HousekeepingTask.create([
    {
      taskNumber: 'HK-10101',
      room: roomMap['105']._id,
      taskType: 'DEPARTURE_CLEAN',
      priority: 'HIGH',
      stage: 'DIRTY',
      notes: 'Guest checked out this morning. Priority for next check-in.'
    },
    {
      taskNumber: 'HK-10102',
      room: roomMap['204']._id,
      taskType: 'STAYOVER_CLEAN',
      priority: 'MEDIUM',
      stage: 'CLEANING',
      assignedStaff: housekeeperUser._id,
      startedAt: new Date(),
      notes: 'Linen refresh and bathroom replenishment requested.'
    },
    {
      taskNumber: 'HK-10103',
      room: roomMap['308']._id,
      taskType: 'DEEP_CLEAN',
      priority: 'LOW',
      stage: 'ASSIGNED',
      assignedStaff: housekeeperUser._id,
      notes: 'Deep clean pending AC repair completion.'
    }
  ]);

  await MaintenanceTicket.create([
    {
      ticketNumber: 'MNT-4001',
      room: roomMap['308']._id,
      issueTitle: 'AC cooling failure / refrigerant recharge required',
      description: 'Air conditioning unit blowing ambient air. Technicians scheduled for compressor inspection.',
      category: 'HVAC',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      blockRoomFromBooking: true,
      reportedBy: receptionistUser._id,
      assignedTo: maintenanceUser._id,
      cost: 3200
    },
    {
      ticketNumber: 'MNT-4002',
      facilityArea: '2nd Floor North Corridor',
      issueTitle: 'Recessed LED panel flickering',
      description: 'Light fixture near room 206 flickers intermittently.',
      category: 'ELECTRICAL',
      priority: 'LOW',
      status: 'OPEN',
      blockRoomFromBooking: false,
      reportedBy: housekeeperUser._id
    }
  ]);

  console.log('[Seed] Creating Initial Audit Logs & Notifications...');
  await AuditLog.create([
    {
      userName: 'Mulugeta Tadesse',
      action: 'SYSTEM_INITIALIZATION',
      resource: 'System',
      details: 'Initialized Grand View Hotel & Suites PMS with 32 operational rooms, 6 room types, and core rate structures.'
    },
    {
      userName: 'Yared Haile',
      action: 'CHECK_IN_GUEST',
      resource: 'Stay',
      details: 'Checked in guest Abebe Kebede to Room 103 (Booking #GVH-10482)'
    },
    {
      userName: 'System / Public',
      action: 'ONLINE_BOOKING',
      resource: 'Reservation',
      details: 'New online booking #GVH-10482 verified with payment confirmation via Chapa'
    },
    {
      userName: 'Dawit Kebede',
      action: 'CHARGE_ORDER_TO_ROOM',
      resource: 'RestaurantOrder',
      details: 'Charged restaurant order #ORD-881201 (ETB 3,150) to Room 304'
    }
  ]);

  await Notification.create([
    {
      title: 'New Online Reservation Confirmed',
      message: 'Booking #GVH-207 arrived from public booking engine for Room 207 (Deluxe King Suite).',
      type: 'NEW_ONLINE_BOOKING',
      targetRoles: ['HOTEL_MANAGER', 'RECEPTIONIST']
    },
    {
      title: 'VIP Diplomatic Arrival Today',
      message: 'H.E. Fatoumata Diallo in-house in Presidential Suite 407. Butler and limousine service active.',
      type: 'UPCOMING_ARRIVAL',
      targetRoles: ['HOTEL_MANAGER', 'RECEPTIONIST']
    },
    {
      title: 'Maintenance Ticket In-Progress',
      message: 'Room 308 AC repair in progress by Kassahun Girma. Room blocked from availability.',
      type: 'MAINTENANCE_ALERT',
      targetRoles: ['HOTEL_MANAGER', 'RECEPTIONIST', 'MAINTENANCE']
    }
  ]);

  console.log('\n======================================================');
  console.log('✅ SEED COMPLETED SUCCESSFULLY!');
  console.log('------------------------------------------------------');
  console.log('Demo Staff Credentials:');
  console.log('  Super Admin:    admin@grandviewhotel.com      / AdminPass123!');
  console.log('  Hotel Manager:  manager@grandviewhotel.com    / ManagerPass123!');
  console.log('  Receptionist:   receptionist@grandviewhotel.com / ReceptionPass123!');
  console.log('  Housekeeper:    housekeeping@grandviewhotel.com / HousekeepingPass123!');
  console.log('  Restaurant:     restaurant@grandviewhotel.com / RestaurantPass123!');
  console.log('  Maintenance:    maintenance@grandviewhotel.com / MaintenancePass123!');
  console.log('  Accountant:     accountant@grandviewhotel.com  / AccountantPass123!');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
