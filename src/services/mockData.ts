import { County, UAI } from '../types';

export const mockCounties: County[] = [
  {
    id: '1',
    name: 'Mombasa',
    wards: [
      { id: '101', name: 'Changamwe' },
      { id: '102', name: 'Jomvu' },
      { id: '103', name: 'Kisauni' },
    ],
  },
  {
    id: '2',
    name: 'Kwale',
    wards: [
      { id: '201', name: 'Msambweni' },
      { id: '202', name: 'Lunga Lunga' },
      { id: '203', name: 'Matuga' },
    ],
  },
  {
    id: '3',
    name: 'Kilifi',
    wards: [
      { id: '301', name: 'Kilifi North' },
      { id: '302', name: 'Kilifi South' },
      { id: '303', name: 'Kaloleni' },
    ],
  },
  {
    id: '4',
    name: 'Tana River',
    wards: [
      { id: '401', name: 'Garsen' },
      { id: '402', name: 'Galole' },
      { id: '403', name: 'Bura' },
    ],
  },
  {
    id: '5',
    name: 'Lamu',
    wards: [
      { id: '501', name: 'Lamu East' },
      { id: '502', name: 'Lamu West' },
      { id: '503', name: 'Mpeketoni' },
    ],
  },
  {
    id: '6',
    name: 'Taita-Taveta',
    wards: [
      { id: '601', name: 'Taveta' },
      { id: '602', name: 'Wundanyi' },
      { id: '603', name: 'Mwatate' },
    ],
  },
  {
    id: '7',
    name: 'Garissa',
    wards: [
      { id: '701', name: 'Garissa Township' },
      { id: '702', name: 'Balambala' },
      { id: '703', name: 'Lagdera' },
    ],
  },
  {
    id: '8',
    name: 'Wajir',
    wards: [
      { id: '801', name: 'Wajir North' },
      { id: '802', name: 'Wajir East' },
      { id: '803', name: 'Wajir West' },
    ],
  },
  {
    id: '9',
    name: 'Mandera',
    wards: [
      { id: '901', name: 'Mandera East' },
      { id: '902', name: 'Mandera West' },
      { id: '903', name: 'Mandera North' },
    ],
  },
  {
    id: '10',
    name: 'Marsabit',
    wards: [
      { id: '1001', name: 'North Horr' },
      { id: '1002', name: 'Saku' },
      { id: '1003', name: 'Laisamis' },
    ],
  },
  {
    id: '11',
    name: 'Isiolo',
    wards: [
      { id: '1101', name: 'Isiolo North' },
      { id: '1102', name: 'Isiolo South' },
      { id: '1103', name: 'Garbatulla' },
    ],
  },
  {
    id: '12',
    name: 'Meru',
    wards: [
      { id: '1201', name: 'Igembe North' },
      { id: '1202', name: 'Igembe Central' },
      { id: '1203', name: 'Igembe South' },
    ],
  },
  {
    id: '13',
    name: 'Tharaka-Nithi',
    wards: [
      { id: '1301', name: 'Maara' },
      { id: '1302', name: 'Chuka' },
      { id: '1303', name: 'Tharaka' },
    ],
  },
  {
    id: '14',
    name: 'Embu',
    wards: [
      { id: '1401', name: 'Manyatta' },
      { id: '1402', name: 'Runyenjes' },
      { id: '1403', name: 'Mbeere South' },
    ],
  },
  {
    id: '15',
    name: 'Kitui',
    wards: [
      { id: '1501', name: 'Kitui Central' },
      { id: '1502', name: 'Kitui West' },
      { id: '1503', name: 'Kitui East' },
    ],
  },
  {
    id: '16',
    name: 'Machakos',
    wards: [
      { id: '1601', name: 'Machakos Town' },
      { id: '1602', name: 'Mavoko' },
      { id: '1603', name: 'Kathiani' },
    ],
  },
  {
    id: '17',
    name: 'Makueni',
    wards: [
      { id: '1701', name: 'Makueni' },
      { id: '1702', name: 'Kibwezi West' },
      { id: '1703', name: 'Kibwezi East' },
    ],
  },
  {
    id: '18',
    name: 'Nyandarua',
    wards: [
      { id: '1801', name: 'Kinangop' },
      { id: '1802', name: 'Kipipiri' },
      { id: '1803', name: 'Ndaragwa' },
    ],
  },
  {
    id: '19',
    name: 'Nyeri',
    wards: [
      { id: '1901', name: 'Tetu' },
      { id: '1902', name: 'Kieni East' },
      { id: '1903', name: 'Kieni West' },
    ],
  },
  {
    id: '20',
    name: 'Kirinyaga',
    wards: [
      { id: '2001', name: 'Mwea East' },
      { id: '2002', name: 'Mwea West' },
      { id: '2003', name: 'Kirinyaga Central' },
    ],
  },
  {
    id: '21',
    name: 'Murang\'a',
    wards: [
      { id: '2101', name: 'Kangema' },
      { id: '2102', name: 'Mathioya' },
      { id: '2103', name: 'Kiharu' },
    ],
  },
  {
    id: '22',
    name: 'Kiambu',
    wards: [
      { id: '2201', name: 'Thika Town' },
      { id: '2202', name: 'Ruiru' },
      { id: '2203', name: 'Juja' },
    ],
  },
  {
    id: '23',
    name: 'Turkana',
    wards: [
      { id: '2301', name: 'Turkana North' },
      { id: '2302', name: 'Turkana West' },
      { id: '2303', name: 'Turkana Central' },
    ],
  },
  {
    id: '24',
    name: 'West Pokot',
    wards: [
      { id: '2401', name: 'Kapenguria' },
      { id: '2402', name: 'Sigor' },
      { id: '2403', name: 'Kacheliba' },
    ],
  },
  {
    id: '25',
    name: 'Samburu',
    wards: [
      { id: '2501', name: 'Samburu West' },
      { id: '2502', name: 'Samburu North' },
      { id: '2503', name: 'Samburu East' },
    ],
  },
  {
    id: '26',
    name: 'Trans Nzoia',
    wards: [
      { id: '2601', name: 'Kwanza' },
      { id: '2602', name: 'Endebess' },
      { id: '2603', name: 'Saboti' },
    ],
  },
  {
    id: '27',
    name: 'Uasin Gishu',
    wards: [
      { id: '2701', name: 'Soy' },
      { id: '2702', name: 'Turbo' },
      { id: '2703', name: 'Moiben' },
    ],
  },
  {
    id: '28',
    name: 'Elgeyo-Marakwet',
    wards: [
      { id: '2801', name: 'Marakwet East' },
      { id: '2802', name: 'Marakwet West' },
      { id: '2803', name: 'Keiyo North' },
    ],
  },
  {
    id: '29',
    name: 'Nandi',
    wards: [
      { id: '2901', name: 'Tinderet' },
      { id: '2902', name: 'Aldai' },
      { id: '2903', name: 'Nandi Hills' },
    ],
  },
  {
    id: '30',
    name: 'Baringo',
    wards: [
      { id: '3001', name: 'Baringo Central' },
      { id: '3002', name: 'Baringo North' },
      { id: '3003', name: 'Baringo South' },
    ],
  },
  {
    id: '31',
    name: 'Laikipia',
    wards: [
      { id: '3101', name: 'Laikipia West' },
      { id: '3102', name: 'Laikipia East' },
      { id: '3103', name: 'Laikipia North' },
    ],
  },
  {
    id: '32',
    name: 'Nakuru',
    wards: [
      { id: '3201', name: 'Nakuru Town East' },
      { id: '3202', name: 'Nakuru Town West' },
      { id: '3203', name: 'Naivasha' },
    ],
  },
  {
    id: '33',
    name: 'Narok',
    wards: [
      { id: '3301', name: 'Narok North' },
      { id: '3302', name: 'Narok South' },
      { id: '3303', name: 'Narok East' },
    ],
  },
  {
    id: '34',
    name: 'Kajiado',
    wards: [
      { id: '3401', name: 'Kajiado North' },
      { id: '3402', name: 'Kajiado Central' },
      { id: '3403', name: 'Kajiado East' },
    ],
  },
  {
    id: '35',
    name: 'Kericho',
    wards: [
      { id: '3501', name: 'Ainamoi' },
      { id: '3502', name: 'Belgut' },
      { id: '3503', name: 'Kipkelion East' },
    ],
  },
  {
    id: '36',
    name: 'Bomet',
    wards: [
      { id: '3601', name: 'Bomet Central' },
      { id: '3602', name: 'Bomet East' },
      { id: '3603', name: 'Chepalungu' },
    ],
  },
  {
    id: '37',
    name: 'Kakamega',
    wards: [
      { id: '3701', name: 'Lugari' },
      { id: '3702', name: 'Likuyani' },
      { id: '3703', name: 'Malava' },
    ],
  },
  {
    id: '38',
    name: 'Vihiga',
    wards: [
      { id: '3801', name: 'Vihiga' },
      { id: '3802', name: 'Sabatia' },
      { id: '3803', name: 'Hamisi' },
    ],
  },
  {
    id: '39',
    name: 'Bungoma',
    wards: [
      { id: '3901', name: 'Mt. Elgon' },
      { id: '3902', name: 'Sirisia' },
      { id: '3903', name: 'Kabuchai' },
    ],
  },
  {
    id: '40',
    name: 'Busia',
    wards: [
      { id: '4001', name: 'Teso North' },
      { id: '4002', name: 'Teso South' },
      { id: '4003', name: 'Nambale' },
    ],
  },
  {
    id: '41',
    name: 'Siaya',
    wards: [
      { id: '4101', name: 'Ugenya' },
      { id: '4102', name: 'Ugunja' },
      { id: '4103', name: 'Alego Usonga' },
    ],
  },
  {
    id: '42',
    name: 'Kisumu',
    wards: [
      { id: '4201', name: 'Kisumu East' },
      { id: '4202', name: 'Kisumu West' },
      { id: '4203', name: 'Kisumu Central' },
    ],
  },
  {
    id: '43',
    name: 'Homa Bay',
    wards: [
      { id: '4301', name: 'Kasipul' },
      { id: '4302', name: 'Kabondo Kasipul' },
      { id: '4303', name: 'Karachuonyo' },
    ],
  },
  {
    id: '44',
    name: 'Migori',
    wards: [
      { id: '4401', name: 'Rongo' },
      { id: '4402', name: 'Awendo' },
      { id: '4403', name: 'Suna East' },
    ],
  },
  {
    id: '45',
    name: 'Kisii',
    wards: [
      { id: '4501', name: 'Bonchari' },
      { id: '4502', name: 'South Mugirango' },
      { id: '4503', name: 'Bomachoge Borabu' },
    ],
  },
  {
    id: '46',
    name: 'Nyamira',
    wards: [
      { id: '4601', name: 'Kitutu Masaba' },
      { id: '4602', name: 'West Mugirango' },
      { id: '4603', name: 'North Mugirango' },
    ],
  },
  {
    id: '47',
    name: 'Nairobi',
    wards: [
      { id: '4701', name: 'Westlands' },
      { id: '4702', name: 'Dagoretti North' },
      { id: '4703', name: 'Dagoretti South' },
    ],
  },
];

// Indexed UAI data for faster lookups
const indexedUAIData: Record<string, UAI[]> = {};

// Raw UAI data
export const mockUAIData: UAI[] = [
  // Mombasa County UAIs
  {
    id: 'MomUAI - 01',
    countyId: '1',
    cropType: 'Maize',
    premiumPerAcre: 2600,
    value: 1.3
  },
  {
    id: 'MomUAI - 02',
    countyId: '1',
    cropType: 'Beans',
    premiumPerAcre: 1950,
    value: 1.25
  },
  {
    id: 'MomUAI - 03',
    countyId: '1',
    cropType: 'Maize',
    premiumPerAcre: 2550,
    value: 1.28
  },
  {
    id: 'MomUAI - 04',
    countyId: '1',
    cropType: 'Beans',
    premiumPerAcre: 1900,
    value: 1.2
  },
  {
    id: 'MomUAI - 05',
    countyId: '1',
    cropType: 'Sorghum',
    premiumPerAcre: 2200,
    value: 1.1
  },
  {
    id: 'MomUAI - 06',
    countyId: '1',
    cropType: 'Green grams',
    premiumPerAcre: 2100,
    value: 1.05
  },
  {
    id: 'MomUAI - 07',
    countyId: '1',
    cropType: 'Cowpeas',
    premiumPerAcre: 2000,
    value: 1.0
  },
  {
    id: 'MomUAI - 08',
    countyId: '1',
    cropType: 'Millet',
    premiumPerAcre: 2300,
    value: 1.15
  },
  // Taita-Taveta UAIs
  {
    id: 'TavUAI - 22',
    countyId: '6',
    cropType: 'Maize',
    premiumPerAcre: 2500,
    value: 1.2
  },
  {
    id: 'TavUAI - 21',
    countyId: '6',
    cropType: 'Maize',
    premiumPerAcre: 2400,
    value: 1.1
  },
  {
    id: 'TavUAI - 20',
    countyId: '6',
    cropType: 'Maize',
    premiumPerAcre: 2300,
    value: 1.0
  },
  {
    id: 'TavUAI - 25',
    countyId: '6',
    cropType: 'Beans',
    premiumPerAcre: 1900,
    value: 1.3
  },
  // Kilifi UAIs
  {
    id: 'kilfUAI - 56',
    countyId: '3',
    cropType: 'Maize',
    premiumPerAcre: 2200,
    value: 1.15
  },
  {
    id: 'kilfUAI - 58',
    countyId: '3',
    cropType: 'Maize',
    premiumPerAcre: 2300,
    value: 1.2
  },
  {
    id: 'kilfUAI - 57',
    countyId: '3',
    cropType: 'Beans',
    premiumPerAcre: 1700,
    value: 1.1
  },
  // More Kilifi UAIs
  {
    id: 'kilfUAI - 42',
    countyId: '3',
    cropType: 'Maize',
    premiumPerAcre: 2000,
    value: 1.0
  },
  {
    id: 'kilfUAI - 43',
    countyId: '3',
    cropType: 'Beans',
    premiumPerAcre: 1500,
    value: 0.95
  },
  // Tana River UAIs
  {
    id: 'TanaUAI - 01',
    countyId: '4',
    cropType: 'Maize',
    premiumPerAcre: 2100,
    value: 1.05
  },
  {
    id: 'TanaUAI - 02',
    countyId: '4',
    cropType: 'Beans',
    premiumPerAcre: 1550,
    value: 0.98
  },
  // Lamu UAIs
  {
    id: 'LamuUAI - 01',
    countyId: '5',
    cropType: 'Maize',
    premiumPerAcre: 2300,
    value: 1.15
  },
  {
    id: 'LamuUAI - 02',
    countyId: '5',
    cropType: 'Beans',
    premiumPerAcre: 1650,
    value: 1.05
  },
  // More Taita-Taveta UAIs
  {
    id: 'TavUAI - 33',
    countyId: '6',
    cropType: 'Maize',
    premiumPerAcre: 2250,
    value: 1.12
  },
  {
    id: 'TavUAI - 34',
    countyId: '6',
    cropType: 'Beans',
    premiumPerAcre: 1700,
    value: 1.08
  },
  // Garissa UAIs
  {
    id: 'GarUAI - 01',
    countyId: '7',
    cropType: 'Maize',
    premiumPerAcre: 2400,
    value: 1.2
  },
  {
    id: 'GarUAI - 02',
    countyId: '7',
    cropType: 'Beans',
    premiumPerAcre: 1750,
    value: 1.1
  },
  // Wajir UAIs
  {
    id: 'WajUAI - 01',
    countyId: '8',
    cropType: 'Maize',
    premiumPerAcre: 2350,
    value: 1.18
  },
  {
    id: 'WajUAI - 02',
    countyId: '8',
    cropType: 'Beans',
    premiumPerAcre: 1720,
    value: 1.09
  },
  // Mandera UAIs
  {
    id: 'ManUAI - 01',
    countyId: '9',
    cropType: 'Maize',
    premiumPerAcre: 2320,
    value: 1.16
  },
  {
    id: 'ManUAI - 02',
    countyId: '9',
    cropType: 'Beans',
    premiumPerAcre: 1680,
    value: 1.07
  },
  // Marsabit UAIs
  {
    id: 'MarUAI - 01',
    countyId: '10',
    cropType: 'Maize',
    premiumPerAcre: 2280,
    value: 1.14
  },
  {
    id: 'MarUAI - 02',
    countyId: '10',
    cropType: 'Beans',
    premiumPerAcre: 1640,
    value: 1.04
  },
  // Isiolo UAIs
  {
    id: 'IsiUAI - 01',
    countyId: '11',
    cropType: 'Maize',
    premiumPerAcre: 2180,
    value: 1.09
  },
  {
    id: 'IsiUAI - 02',
    countyId: '11',
    cropType: 'Beans',
    premiumPerAcre: 1580,
    value: 1.0
  },
  // Meru UAIs
  {
    id: 'MerUAI - 01',
    countyId: '12',
    cropType: 'Maize',
    premiumPerAcre: 2150,
    value: 1.08
  },
  {
    id: 'MerUAI - 02',
    countyId: '12',
    cropType: 'Beans',
    premiumPerAcre: 1620,
    value: 1.03
  },
  // Tharaka-Nithi UAIs
  {
    id: 'ThaUAI - 01',
    countyId: '13',
    cropType: 'Maize',
    premiumPerAcre: 2050,
    value: 1.02
  },
  {
    id: 'ThaUAI - 02',
    countyId: '13',
    cropType: 'Beans',
    premiumPerAcre: 1480,
    value: 0.95
  },
  // Embu UAIs
  {
    id: 'EmbUAI - 01',
    countyId: '14',
    cropType: 'Maize',
    premiumPerAcre: 2120,
    value: 1.06
  },
  {
    id: 'EmbUAI - 02',
    countyId: '14',
    cropType: 'Beans',
    premiumPerAcre: 1540,
    value: 0.98
  },
  // Kitui UAIs
  {
    id: 'KitUAI - 01',
    countyId: '15',
    cropType: 'Maize',
    premiumPerAcre: 1980,
    value: 0.99
  },
  {
    id: 'KitUAI - 02',
    countyId: '15',
    cropType: 'Beans',
    premiumPerAcre: 1430,
    value: 0.92
  },
  // Machakos UAIs
  {
    id: 'MacUAI - 01',
    countyId: '16',
    cropType: 'Maize',
    premiumPerAcre: 2080,
    value: 1.04
  },
  {
    id: 'MacUAI - 02',
    countyId: '16',
    cropType: 'Beans',
    premiumPerAcre: 1520,
    value: 0.97
  },
  // Makueni UAIs
  {
    id: 'MakUAI - 01',
    countyId: '17',
    cropType: 'Maize',
    premiumPerAcre: 1950,
    value: 0.98
  },
  {
    id: 'MakUAI - 02',
    countyId: '17',
    cropType: 'Beans',
    premiumPerAcre: 1420,
    value: 0.91
  },
  // Nyandarua UAIs
  {
    id: 'NyaUAI - 01',
    countyId: '18',
    cropType: 'Maize',
    premiumPerAcre: 2380,
    value: 1.19
  },
  {
    id: 'NyaUAI - 02',
    countyId: '18',
    cropType: 'Beans',
    premiumPerAcre: 1730,
    value: 1.09
  },
  // Nyeri UAIs
  {
    id: 'NyeUAI - 01',
    countyId: '19',
    cropType: 'Maize',
    premiumPerAcre: 2420,
    value: 1.21
  },
  {
    id: 'NyeUAI - 02',
    countyId: '19',
    cropType: 'Beans',
    premiumPerAcre: 1760,
    value: 1.11
  },
  // Kirinyaga UAIs
  {
    id: 'KirUAI - 01',
    countyId: '20',
    cropType: 'Maize',
    premiumPerAcre: 2320,
    value: 1.16
  },
  {
    id: 'KirUAI - 02',
    countyId: '20',
    cropType: 'Beans',
    premiumPerAcre: 1690,
    value: 1.07
  },
  // Murang'a UAIs
  {
    id: 'MurUAI - 01',
    countyId: '21',
    cropType: 'Maize',
    premiumPerAcre: 2280,
    value: 1.14
  },
  {
    id: 'MurUAI - 02',
    countyId: '21',
    cropType: 'Beans',
    premiumPerAcre: 1660,
    value: 1.05
  },
  // Kiambu UAIs
  {
    id: 'KiaUAI - 01',
    countyId: '22',
    cropType: 'Maize',
    premiumPerAcre: 2480,
    value: 1.24
  },
  {
    id: 'KiaUAI - 02',
    countyId: '22',
    cropType: 'Beans',
    premiumPerAcre: 1780,
    value: 1.12
  },
  // Turkana UAIs
  {
    id: 'TurUAI - 01',
    countyId: '23',
    cropType: 'Maize',
    premiumPerAcre: 2150,
    value: 1.08
  },
  {
    id: 'TurUAI - 02',
    countyId: '23',
    cropType: 'Beans',
    premiumPerAcre: 1550,
    value: 0.98
  },
  // West Pokot UAIs
  {
    id: 'WPokUAI - 01',
    countyId: '24',
    cropType: 'Maize',
    premiumPerAcre: 2200,
    value: 1.1
  },
  {
    id: 'WPokUAI - 02',
    countyId: '24',
    cropType: 'Beans',
    premiumPerAcre: 1600,
    value: 1.01
  },
  // Samburu UAIs
  {
    id: 'SamUAI - 01',
    countyId: '25',
    cropType: 'Maize',
    premiumPerAcre: 2120,
    value: 1.06
  },
  {
    id: 'SamUAI - 02',
    countyId: '25',
    cropType: 'Beans',
    premiumPerAcre: 1520,
    value: 0.96
  },
  // Trans Nzoia UAIs
  {
    id: 'TNzUAI - 01',
    countyId: '26',
    cropType: 'Maize',
    premiumPerAcre: 2400,
    value: 1.2
  },
  {
    id: 'TNzUAI - 02',
    countyId: '26',
    cropType: 'Beans',
    premiumPerAcre: 1750,
    value: 1.1
  },
  // Uasin Gishu UAIs
  {
    id: 'UGisUAI - 01',
    countyId: '27',
    cropType: 'Maize',
    premiumPerAcre: 2450,
    value: 1.23
  },
  {
    id: 'UGisUAI - 02',
    countyId: '27',
    cropType: 'Beans',
    premiumPerAcre: 1770,
    value: 1.12
  },
  // Elgeyo-Marakwet UAIs
  {
    id: 'EMkUAI - 01',
    countyId: '28',
    cropType: 'Maize',
    premiumPerAcre: 2380,
    value: 1.19
  },
  {
    id: 'EMkUAI - 02',
    countyId: '28',
    cropType: 'Beans',
    premiumPerAcre: 1720,
    value: 1.09
  },
  // Nandi UAIs
  {
    id: 'NanUAI - 01',
    countyId: '29',
    cropType: 'Maize',
    premiumPerAcre: 2420,
    value: 1.21
  },
  {
    id: 'NanUAI - 02',
    countyId: '29',
    cropType: 'Beans',
    premiumPerAcre: 1740,
    value: 1.1
  },
  // Baringo UAIs
  {
    id: 'BarUAI - 01',
    countyId: '30',
    cropType: 'Maize',
    premiumPerAcre: 2350,
    value: 1.18
  },
  {
    id: 'BarUAI - 02',
    countyId: '30',
    cropType: 'Beans',
    premiumPerAcre: 1700,
    value: 1.07
  },
  // Laikipia UAIs
  {
    id: 'LaiUAI - 01',
    countyId: '31',
    cropType: 'Maize',
    premiumPerAcre: 2250,
    value: 1.13
  },
  {
    id: 'LaiUAI - 02',
    countyId: '31',
    cropType: 'Beans',
    premiumPerAcre: 1650,
    value: 1.04
  },
  // Nakuru UAIs
  {
    id: 'NakUAI - 01',
    countyId: '32',
    cropType: 'Maize',
    premiumPerAcre: 2400,
    value: 1.2
  },
  {
    id: 'NakUAI - 02',
    countyId: '32',
    cropType: 'Beans',
    premiumPerAcre: 1750,
    value: 1.1
  },
  // Narok UAIs
  {
    id: 'NarUAI - 01',
    countyId: '33',
    cropType: 'Maize',
    premiumPerAcre: 2350,
    value: 1.18
  },
  {
    id: 'NarUAI - 02',
    countyId: '33',
    cropType: 'Beans',
    premiumPerAcre: 1700,
    value: 1.07
  },
  // Kajiado UAIs
  {
    id: 'KajUAI - 01',
    countyId: '34',
    cropType: 'Maize',
    premiumPerAcre: 2300,
    value: 1.15
  },
  {
    id: 'KajUAI - 02',
    countyId: '34',
    cropType: 'Beans',
    premiumPerAcre: 1680,
    value: 1.06
  },
  // Kericho UAIs
  {
    id: 'KerUAI - 01',
    countyId: '35',
    cropType: 'Maize',
    premiumPerAcre: 2420,
    value: 1.21
  },
  {
    id: 'KerUAI - 02',
    countyId: '35',
    cropType: 'Beans',
    premiumPerAcre: 1760,
    value: 1.11
  },
  // Bomet UAIs
  {
    id: 'BomUAI - 01',
    countyId: '36',
    cropType: 'Maize',
    premiumPerAcre: 2380,
    value: 1.19
  },
  {
    id: 'BomUAI - 02',
    countyId: '36',
    cropType: 'Beans',
    premiumPerAcre: 1730,
    value: 1.09
  },
  // Kakamega UAIs
  {
    id: 'KakUAI - 01',
    countyId: '37',
    cropType: 'Maize',
    premiumPerAcre: 2450,
    value: 1.23
  },
  {
    id: 'KakUAI - 02',
    countyId: '37',
    cropType: 'Beans',
    premiumPerAcre: 1780,
    value: 1.12
  },
  // Vihiga UAIs
  {
    id: 'VihUAI - 01',
    countyId: '38',
    cropType: 'Maize',
    premiumPerAcre: 2400,
    value: 1.2
  },
  {
    id: 'VihUAI - 02',
    countyId: '38',
    cropType: 'Beans',
    premiumPerAcre: 1750,
    value: 1.1
  },
  // Bungoma UAIs
  {
    id: 'BunUAI - 01',
    countyId: '39',
    cropType: 'Maize',
    premiumPerAcre: 2480,
    value: 1.24
  },
  {
    id: 'BunUAI - 02',
    countyId: '39',
    cropType: 'Beans',
    premiumPerAcre: 1800,
    value: 1.13
  },
  // Busia UAIs
  {
    id: 'BusUAI - 01',
    countyId: '40',
    cropType: 'Maize',
    premiumPerAcre: 2420,
    value: 1.21
  },
  {
    id: 'BusUAI - 02',
    countyId: '40',
    cropType: 'Beans',
    premiumPerAcre: 1760,
    value: 1.11
  },
  // Siaya UAIs
  {
    id: 'SiaUAI - 01',
    countyId: '41',
    cropType: 'Maize',
    premiumPerAcre: 2380,
    value: 1.19
  },
  {
    id: 'SiaUAI - 02',
    countyId: '41',
    cropType: 'Beans',
    premiumPerAcre: 1730,
    value: 1.09
  },
  // Kisumu UAIs
  {
    id: 'KisUAI - 01',
    countyId: '42',
    cropType: 'Maize',
    premiumPerAcre: 2450,
    value: 1.23
  },
  {
    id: 'KisUAI - 02',
    countyId: '42',
    cropType: 'Beans',
    premiumPerAcre: 1780,
    value: 1.12
  },
  // Homa Bay UAIs
  {
    id: 'HomUAI - 01',
    countyId: '43',
    cropType: 'Maize',
    premiumPerAcre: 2380,
    value: 1.19
  },
  {
    id: 'HomUAI - 02',
    countyId: '43',
    cropType: 'Beans',
    premiumPerAcre: 1580,
    value: 1.0
  },
  // Migori UAIs
  {
    id: 'MigUAI - 01',
    countyId: '44',
    cropType: 'Maize',
    premiumPerAcre: 2150,
    value: 1.08
  },
  {
    id: 'MigUAI - 02',
    countyId: '44',
    cropType: 'Beans',
    premiumPerAcre: 1550,
    value: 0.98
  },
  // More Kisii UAIs
  {
    id: 'kisUAI - 45',
    countyId: '45',
    cropType: 'Maize',
    premiumPerAcre: 2220,
    value: 1.11
  },
  {
    id: 'kisUAI - 46',
    countyId: '45',
    cropType: 'Beans',
    premiumPerAcre: 1600,
    value: 1.01
  },
  // Nyamira UAIs
  {
    id: 'NyaUAI - 01',
    countyId: '46',
    cropType: 'Maize',
    premiumPerAcre: 2180,
    value: 1.09
  },
  {
    id: 'NyaUAI - 02',
    countyId: '46',
    cropType: 'Beans',
    premiumPerAcre: 1580,
    value: 1.0
  },
  // Nairobi UAIs
  {
    id: 'NaiUAI - 01',
    countyId: '47',
    cropType: 'Maize',
    premiumPerAcre: 2550,
    value: 1.28
  },
  {
    id: 'NaiUAI - 02',
    countyId: '47',
    cropType: 'Beans',
    premiumPerAcre: 1850,
    value: 1.16
  },
];
