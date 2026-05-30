/**
 * Shared India code lookups
 *
 * Single source of truth for:
 *  - Indian state / RTO codes (vehicle registration prefix, e.g. MH, RJ, KA)
 *  - Indian Railway city / station codes (e.g. BCT, JP, SBC)
 *
 * Keys are pre-normalised with {@link normalizeCodeLookupKey} so that callers
 * only need to pass a raw string — spelling variants and extra whitespace are
 * handled automatically.
 */

// ─── Normalizer ──────────────────────────────────────────────────────────────

/**
 * Produce a canonical lookup key from any free-text location string.
 * Applies NFKD normalisation, strips punctuation/symbols, collapses
 * whitespace, and lowercases the result.
 *
 * All keys in {@link INDIAN_STATE_CODES} and
 * {@link INDIAN_RAILWAY_CITY_STATION_CODES} are stored in this form so the
 * same function must be used on both sides of every lookup.
 */
export function normalizeCodeLookupKey(value: unknown): string {
  return (typeof value === 'string' ? value : '')
    .normalize('NFKD')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

// ─── State / RTO codes ───────────────────────────────────────────────────────

/**
 * Maps a (normalised) state name to its official two-letter RTO/vehicle
 * registration prefix.  Common misspellings are included as aliases so that
 * data entered by end-users still resolves correctly.
 *
 * Source: https://www.aptransport.org/html/registration-statecodes.html
 */
export const INDIAN_STATE_CODES: Readonly<Record<string, string>> = {
  // A
  'andaman and nicobar islands': 'AN',
  'andaman nicobar': 'AN',
  'andhra pradesh': 'AP',
  'arunachal pradesh': 'AR',
  assam: 'AS',

  // B
  bihar: 'BR',

  // C
  chandigarh: 'CH',
  chhattisgarh: 'CG',

  // D
  'dadra and nagar haveli': 'DN',
  'dadra and nagar haveli and daman and diu': 'DH',
  'dadra nagar haveli daman diu': 'DH',
  daman: 'DD',
  'daman and diu': 'DD',
  delhi: 'DL',
  'nct of delhi': 'DL',

  // G
  goa: 'GA',
  gujarat: 'GJ',

  // H
  haryana: 'HR',
  'himachal pradesh': 'HP',

  // J
  'jammu and kashmir': 'JK',
  jharkhand: 'JH',

  // K
  karnataka: 'KA',
  karnatak: 'KA', // common misspelling
  karanka: 'KA', // common misspelling
  kerala: 'KL',

  // L
  ladakh: 'LA',
  lakshadweep: 'LD',

  // M
  'madhya pradesh': 'MP',
  maharashtra: 'MH',
  maharastra: 'MH', // common misspelling
  maharahatra: 'MH', // common misspelling
  manipur: 'MN',
  meghalaya: 'ML',
  mizoram: 'MZ',

  // N
  nagaland: 'NL',

  // O
  odisha: 'OD',
  orissa: 'OD', // former name alias

  // P
  puducherry: 'PY',
  pondicherry: 'PY', // former name alias
  punjab: 'PB',

  // R
  rajasthan: 'RJ',
  rajsthan: 'RJ', // common misspelling
  rajdthan: 'RJ', // common misspelling
  rajathan: 'RJ', // common misspelling

  // S
  sikkim: 'SK',

  // T
  'tamil nadu': 'TN',
  tamilnadu: 'TN',
  telangana: 'TS',
  tripura: 'TR',

  // U
  'uttar pradesh': 'UP',
  uttarakhand: 'UK',
  uttaranchal: 'UK', // former name alias

  // W
  'west bengal': 'WB',
} as const;

// ─── Railway city / station codes ────────────────────────────────────────────

/**
 * Maps a (normalised) city name to its Indian Railways station code.
 * Both canonical names and common alternate spellings are included.
 *
 * Source: Indian Railways official station code list
 * https://indianrailways.gov.in/railwayboard/uploads/directorate/coaching/pdf/Station_code.pdf
 */
export const INDIAN_RAILWAY_CITY_STATION_CODES: Readonly<
  Record<string, string>
> = {
  // A
  agartala: 'AGTL',
  agra: 'AGC',
  'agra cantt': 'AGC',
  'agra fort': 'AF',
  ahmadabad: 'ADI',
  ahmedabad: 'ADI',
  ahmadnagar: 'ANG',
  ahmednagar: 'ANG',
  ajmer: 'AII',
  akola: 'AK',
  alappuzha: 'ALLP',
  aligarh: 'ALJN',
  allahabad: 'ALD',
  prayagraj: 'PRYJ',
  alwar: 'AWR',
  ambala: 'UMB',
  amritsar: 'ASR',
  anand: 'ANND',
  anantapur: 'ATP',
  ara: 'ARA',
  asansol: 'ASN',
  aurangabad: 'AWB',
  ayodhya: 'AY',
  azamgarh: 'AMH',

  // B
  bagalkot: 'BGK',
  balaghat: 'BTC',
  balasore: 'BLS',
  ballia: 'BUI',
  banda: 'BNDA',
  bandra: 'BDTS',
  bangalore: 'SBC',
  bengaluru: 'SBC',
  'ksr bengaluru': 'SBC',
  'bangalore city': 'SBC',
  'bangalore cantt': 'BNC',
  'bangalore cantonment': 'BNC',
  bangarapet: 'BWT',
  bankura: 'BQA',
  barabanki: 'BBK',
  baran: 'BAZ',
  barauni: 'BJU',
  barddhaman: 'BWN',
  bareilly: 'BE',
  barmer: 'BME',
  baroda: 'BRC',
  basti: 'BST',
  bathinda: 'BTI',
  beawar: 'BER',
  belagavi: 'BGM',
  belgaum: 'BGM',
  bellary: 'BAY',
  bhadohi: 'BOY',
  bhadrak: 'BHC',
  bhagalpur: 'BGP',
  bharatpur: 'BTE',
  bharuch: 'BH',
  bhavnagar: 'BVC',
  bhilwara: 'BHL',
  bhind: 'BIX',
  bhiwani: 'BNW',
  bhopal: 'BPL',
  bhubaneswar: 'BBS',
  bhuj: 'BHUJ',
  bhusaval: 'BSL',
  bijapur: 'BJP',
  vijayapura: 'BJP',
  bikaner: 'BKN',
  bilaspur: 'BSP',
  bokaro: 'BKSC',
  'bokaro steel city': 'BKSC',
  borivali: 'BVI',
  botad: 'BTD',
  buxar: 'BXR',

  // C
  chandigarh: 'CDG',
  chandrapur: 'CD',
  chennai: 'MAS',
  'chennai central': 'MAS',
  'chennai egmore': 'MS',
  chhapra: 'CPR',
  chhindwara: 'CWA',
  chittoor: 'CTO',
  chittorgarh: 'COR',
  chittaurgarh: 'COR',
  coimbatore: 'CBE',
  cuttack: 'CTC',

  // D
  dadar: 'DR',
  dahod: 'DHD',
  danapur: 'DNR',
  darbhanga: 'DBG',
  davangere: 'DVG',
  dehradun: 'DDN',
  delhi: 'DLI',
  'new delhi': 'NDLS',
  dhanbad: 'DHN',
  dharwad: 'DWR',
  dhaulpur: 'DHO',
  dibrugarh: 'DBRG',
  dimapur: 'DMV',
  dindigul: 'DG',
  durg: 'DURG',
  durgapur: 'DGR',
  dwarka: 'DWK',

  // E
  eluru: 'EE',
  ernakulam: 'ERS',
  erode: 'ED',
  etawah: 'ETW',

  // F
  faizabad: 'FD',
  faridabad: 'FDB',
  farrukhabad: 'FBD',
  fatehpur: 'FTP',
  firozabad: 'FZD',

  // G
  gandhidham: 'GIM',
  gandhinagar: 'GADJ',
  gangapur: 'GGC',
  'gangapur city': 'GGC',
  gaya: 'GAYA',
  ghaziabad: 'GZB',
  godhra: 'GDA',
  gonda: 'GD',
  gondia: 'G',
  gorakhpur: 'GKP',
  gudivada: 'GDV',
  gudur: 'GDR',
  gulbarga: 'GR',
  kalaburagi: 'GR',
  guna: 'GUNA',
  guntakal: 'GTL',
  guntur: 'GNT',
  gurgaon: 'GGN',
  gurugram: 'GGN',
  guwahati: 'GHY',
  gwalior: 'GWL',

  // H
  hajipur: 'HJP',
  haldia: 'HLZ',
  hanumangarh: 'HMH',
  hapa: 'HAPA',
  hapur: 'HPU',
  haridwar: 'HW',
  hatia: 'HTE',
  hisar: 'HSR',
  hosapete: 'HPT',
  hospet: 'HPT',
  hosur: 'HSRA',
  howrah: 'HWH',
  hubballi: 'UBL',
  hubli: 'UBL',
  hyderabad: 'HYB',

  // I
  indore: 'INDB',
  itarsi: 'ET',

  // J
  jabalpur: 'JBP',
  jagdalpur: 'JDB',
  jaipur: 'JP',
  jaisalmer: 'JSM',
  jalandhar: 'JUC',
  'jalandhar city': 'JUC',
  'jalandhar cantt': 'JRC',
  'jalandhar cantonment': 'JRC',
  jalgaon: 'JL',
  jalna: 'J',
  jalor: 'JOR',
  jalore: 'JOR',
  jamalpur: 'JMP',
  jammu: 'JAT',
  'jammu tawi': 'JAT',
  jamnagar: 'JAM',
  jaunpur: 'JNU',
  jhansi: 'JHS',
  jodhpur: 'JU',
  junagadh: 'JND',

  // K
  kacheguda: 'KCG',
  kakinada: 'COA',
  kalka: 'KLK',
  kalyan: 'KYN',
  kanchipuram: 'CJ',
  kannur: 'CAN',
  kanpur: 'CNB',
  'kanpur central': 'CNB',
  karaikal: 'KIK',
  karaikkudi: 'KKDI',
  karnal: 'KUN',
  karur: 'KRR',
  karwar: 'KAWR',
  kasaragod: 'KGQ',
  kasganj: 'KSJ',
  kathgodam: 'KGM',
  katihar: 'KIR',
  katni: 'KTE',
  katpadi: 'KPD',
  kazipet: 'KZJ',
  khagaria: 'KGG',
  khammam: 'KMT',
  khandwa: 'KNW',
  kharagpur: 'KGP',
  kishanganj: 'KNE',
  kishangarh: 'KSG',
  kochi: 'ERS',
  kochuveli: 'KCVL',
  kolhapur: 'KOP',
  kolkata: 'KOAA',
  kollam: 'QLN',
  korba: 'KRBA',
  kota: 'KOTA',
  kottayam: 'KTYM',
  kozhikode: 'CLT',
  krishnanagar: 'KNJ',
  kumbakonam: 'KMU',
  kurnool: 'KRNT',

  // L
  lucknow: 'LKO',
  ludhiana: 'LDH',

  // M
  madgaon: 'MAO',
  madurai: 'MDU',
  malda: 'MLDT',
  mangaluru: 'MAQ',
  mangalore: 'MAQ',
  mathura: 'MTJ',
  meerut: 'MTC',
  moradabad: 'MB',
  motihari: 'MKI',
  mughalsarai: 'MGS',
  'pt deen dayal upadhyaya': 'DDU',
  mumbai: 'BCT',
  'mumbai central': 'BCT',
  'mumbai cst': 'CSTM',
  'mumbai csmt': 'CSMT',
  mysore: 'MYS',
  mysuru: 'MYS',

  // N
  nadiad: 'ND',
  nagpur: 'NGP',
  nanded: 'NED',
  nandurbar: 'NDB',
  nandyal: 'NDL',
  narasapur: 'NS',
  nashik: 'NK',
  nasik: 'NK',
  'nasik road': 'NK',
  nellore: 'NLR',
  nizambad: 'NZB',
  nizamabad: 'NZB',

  // O
  okha: 'OKHA',
  ongole: 'OGL',

  // P
  palakkad: 'PGT',
  palanpur: 'PNU',
  pandharpur: 'PVR',
  panipat: 'PNP',
  panvel: 'PNVL',
  parbhani: 'PBN',
  pathankot: 'PTK',
  patiala: 'PTA',
  patna: 'PNBE',
  phalodi: 'PLC',
  pilibhit: 'PBE',
  porbandar: 'PBR',
  pratapgarh: 'PBH',
  puducherry: 'PDY',
  pune: 'PUNE',

  // R
  raipur: 'R',
  rajahmundry: 'RJY',
  rajkot: 'RJT',
  ranchi: 'RNC',
  ratlam: 'RTM',
  rewari: 'RE',
  rohtak: 'ROK',
  rourkela: 'ROU',

  // S
  saharanpur: 'SRE',
  salem: 'SA',
  sambalpur: 'SBP',
  sangli: 'SLI',
  satara: 'STR',
  sawai: 'SWM',
  'sawai madhopur': 'SWM',
  sealdah: 'SDAH',
  secunderabad: 'SC',
  shahjahanpur: 'SPN',
  sikar: 'SIKR',
  silchar: 'SCL',
  siliguri: 'SGUJ',
  singrauli: 'SGRL',
  sirsa: 'SSA',
  sitapur: 'SPC',
  solapur: 'SUR',
  somnath: 'SMNH',
  surat: 'ST',
  suratgarh: 'SOG',
  surendranagar: 'SUNR',

  // T
  tambaram: 'TBM',
  thane: 'TNA',
  thanjavur: 'TJ',
  tiruchirappalli: 'TPJ',
  tirunelveli: 'TEN',
  tirupati: 'TPTY',
  tiruppur: 'TUP',
  thiruvananthapuram: 'TVC',
  trivandrum: 'TVC',

  // U
  udaipur: 'UDZ',
  'udaipur city': 'UDZ',
  udupi: 'UD',
  ujjain: 'UJN',
  una: 'UNA',
  unnao: 'ON',

  // V
  vadodara: 'BRC',
  valsad: 'BL',
  varanasi: 'BSB',
  vasai: 'BSR',
  'vasai road': 'BSR',
  veraval: 'VRL',
  vidisha: 'BHS',
  vijayawada: 'BZA',
  villupuram: 'VM',
  viramgam: 'VG',
  virudhunagar: 'VPT',
  visakhapatnam: 'VSKP',
  vizag: 'VSKP',
  vizianagaram: 'VZM',

  // W
  wadi: 'WADI',
  warangal: 'WL',
  wardha: 'WR',

  // Y
  yesvantpur: 'YPR',
  yashwanthpur: 'YPR',
} as const;
