/**
 * Comprehensive Indian Railways Train Catalog & Route Timetable System
 * Maps real-world train routes with intermediate station stops, timings, distances, and classes.
 */

const TRAIN_CATALOG = [
  // ----------------------------------------------------
  // 1. New Delhi - Bhopal / Rani Kamalapati Corridor
  // ----------------------------------------------------
  {
    train_number: '12002',
    train_name: 'Bhopal Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'NDLS',
    dest_code: 'RKMP',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'MTJ',  arr: '07:19', dep: '07:20', dist: 141 },
      { code: 'AGC',  arr: '07:50', dep: '07:55', dist: 188 },
      { code: 'GWL',  arr: '09:23', dep: '09:28', dist: 306 },
      { code: 'VGLJ', arr: '10:45', dep: '10:50', dist: 403 },
      { code: 'BPL',  arr: '14:07', dep: '14:12', dist: 695 },
      { code: 'RKMP', arr: '14:40', dep: '14:40', dist: 701 }
    ]
  },
  {
    train_number: '12001',
    train_name: 'New Delhi Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'RKMP',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'RKMP', arr: '15:15', dep: '15:15', dist: 0 },
      { code: 'BPL',  arr: '15:27', dep: '15:30', dist: 6 },
      { code: 'VGLJ', arr: '18:42', dep: '18:45', dist: 304 },
      { code: 'GWL',  arr: '19:40', dep: '19:45', dist: 401 },
      { code: 'AGC',  arr: '21:10', dep: '21:15', dist: 519 },
      { code: 'MTJ',  arr: '21:48', dep: '21:50', dist: 566 },
      { code: 'NDLS', arr: '23:50', dep: '23:50', dist: 707 }
    ]
  },
  {
    train_number: '12050',
    train_name: 'Gatimaan Express',
    train_type: 'Shatabdi',
    source_code: 'NZM',
    dest_code: 'VGLJ',
    runs_on: 'Mon, Tue, Wed, Thu, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NZM',  arr: '08:10', dep: '08:10', dist: 0 },
      { code: 'AGC',  arr: '09:50', dep: '09:55', dist: 188 },
      { code: 'GWL',  arr: '11:07', dep: '11:09', dist: 306 },
      { code: 'VGLJ', arr: '12:35', dep: '12:35', dist: 403 }
    ]
  },
  {
    train_number: '12049',
    train_name: 'Gatimaan Express (Return)',
    train_type: 'Shatabdi',
    source_code: 'VGLJ',
    dest_code: 'NZM',
    runs_on: 'Mon, Tue, Wed, Thu, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'VGLJ', arr: '15:05', dep: '15:05', dist: 0 },
      { code: 'GWL',  arr: '16:03', dep: '16:05', dist: 97 },
      { code: 'AGC',  arr: '17:40', dep: '17:45', dist: 215 },
      { code: 'NZM',  arr: '19:30', dep: '19:30', dist: 403 }
    ]
  },
  {
    train_number: '22222',
    train_name: 'CSMT Tejas Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NZM',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NZM',  arr: '16:55', dep: '16:55', dist: 0 },
      { code: 'AGC',  arr: '18:45', dep: '18:47', dist: 188 },
      { code: 'GWL',  arr: '20:08', dep: '20:10', dist: 306 },
      { code: 'VGLJ', arr: '21:28', dep: '21:33', dist: 403 },
      { code: 'BPL',  arr: '00:35', dep: '00:40', dist: 695 },
      { code: 'JL',   arr: '05:38', dep: '05:40', dist: 1118 },
      { code: 'BSL',  arr: '06:05', dep: '06:10', dist: 1142 },
      { code: 'NK',   arr: '09:08', dep: '09:10', dist: 1399 },
      { code: 'KYN',  arr: '11:13', dep: '11:15', dist: 1500 },
      { code: 'CSMT', arr: '11:50', dep: '11:50', dist: 1535 }
    ]
  },
  {
    train_number: '22221',
    train_name: 'CSMT Tejas Rajdhani (Return)',
    train_type: 'Rajdhani',
    source_code: 'CSMT',
    dest_code: 'NZM',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'CSMT', arr: '16:00', dep: '16:00', dist: 0 },
      { code: 'KYN',  arr: '16:43', dep: '16:45', dist: 35 },
      { code: 'NK',   arr: '18:47', dep: '18:49', dist: 136 },
      { code: 'BSL',  arr: '21:40', dep: '21:45', dist: 393 },
      { code: 'JL',   arr: '22:08', dep: '22:10', dist: 417 },
      { code: 'BPL',  arr: '03:15', dep: '03:20', dist: 840 },
      { code: 'VGLJ', arr: '06:23', dep: '06:28', dist: 1132 },
      { code: 'GWL',  arr: '07:38', dep: '07:40', dist: 1229 },
      { code: 'AGC',  arr: '09:10', dep: '09:12', dist: 1347 },
      { code: 'NZM',  arr: '11:00', dep: '11:00', dist: 1535 }
    ]
  },
  {
    train_number: '12626',
    train_name: 'Kerala Superfast Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'TVC',
    runs_on: 'Daily',
    classes: ['2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '20:10', dep: '20:10', dist: 0 },
      { code: 'MTJ',  arr: '21:38', dep: '21:40', dist: 141 },
      { code: 'AGC',  arr: '22:20', dep: '22:25', dist: 188 },
      { code: 'GWL',  arr: '23:56', dep: '23:58', dist: 306 },
      { code: 'VGLJ', arr: '01:30', dep: '01:38', dist: 403 },
      { code: 'BPL',  arr: '05:20', dep: '05:25', dist: 695 },
      { code: 'NGP',  arr: '11:45', dep: '11:50', dist: 1085 },
      { code: 'BPQ',  arr: '14:55', dep: '15:00', dist: 1293 },
      { code: 'WL',   arr: '18:18', dep: '18:20', dist: 1536 },
      { code: 'BZA',  arr: '22:00', dep: '22:10', dist: 1743 },
      { code: 'GDR',  arr: '02:08', dep: '02:10', dist: 2037 },
      { code: 'RU',   arr: '03:45', dep: '03:50', dist: 2120 },
      { code: 'KPD',  arr: '05:43', dep: '05:45', dist: 2235 },
      { code: 'SA',   arr: '08:42', dep: '08:45', dist: 2440 },
      { code: 'ED',   arr: '09:45', dep: '09:50', dist: 2500 },
      { code: 'TCR',  arr: '13:02', dep: '13:05', dist: 2736 },
      { code: 'ERN',  arr: '14:18', dep: '14:20', dist: 2807 },
      { code: 'ALLP', arr: '15:22', dep: '15:25', dist: 2864 },
      { code: 'TVC',  arr: '18:00', dep: '18:00', dist: 3026 }
    ]
  },
  {
    train_number: '12625',
    train_name: 'Kerala Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'TVC',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['2A', '3A', 'SL'],
    stops: [
      { code: 'TVC',  arr: '12:30', dep: '12:30', dist: 0 },
      { code: 'ALLP', arr: '14:52', dep: '14:55', dist: 162 },
      { code: 'ERN',  arr: '16:03', dep: '16:05', dist: 219 },
      { code: 'TCR',  arr: '17:15', dep: '17:18', dist: 290 },
      { code: 'ED',   arr: '20:50', dep: '20:55', dist: 526 },
      { code: 'SA',   arr: '21:47', dep: '21:50', dist: 586 },
      { code: 'KPD',  arr: '00:58', dep: '01:00', dist: 791 },
      { code: 'RU',   arr: '02:50', dep: '02:55', dist: 906 },
      { code: 'GDR',  arr: '04:13', dep: '04:15', dist: 989 },
      { code: 'BZA',  arr: '08:35', dep: '08:45', dist: 1283 },
      { code: 'WL',   arr: '11:43', dep: '11:45', dist: 1490 },
      { code: 'BPQ',  arr: '16:15', dep: '16:20', dist: 1733 },
      { code: 'NGP',  arr: '19:25', dep: '19:30', dist: 1941 },
      { code: 'BPL',  arr: '01:50', dep: '01:55', dist: 2331 },
      { code: 'VGLJ', arr: '05:45', dep: '05:53', dist: 2623 },
      { code: 'GWL',  arr: '07:00', dep: '07:02', dist: 2720 },
      { code: 'AGC',  arr: '08:40', dep: '08:45', dist: 2838 },
      { code: 'MTJ',  arr: '09:28', dep: '09:30', dist: 2885 },
      { code: 'NDLS', arr: '12:15', dep: '12:15', dist: 3026 }
    ]
  },
  {
    train_number: '12622',
    train_name: 'Tamil Nadu Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'MAS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '21:05', dep: '21:05', dist: 0 },
      { code: 'AGC',  arr: '23:25', dep: '23:30', dist: 188 },
      { code: 'GWL',  arr: '01:13', dep: '01:15', dist: 306 },
      { code: 'VGLJ', arr: '02:35', dep: '02:43', dist: 403 },
      { code: 'BPL',  arr: '06:45', dep: '06:50', dist: 695 },
      { code: 'ET',   arr: '08:25', dep: '08:30', dist: 787 },
      { code: 'NGP',  arr: '13:05', dep: '13:10', dist: 1085 },
      { code: 'BPQ',  arr: '16:20', dep: '16:25', dist: 1293 },
      { code: 'WL',   arr: '19:28', dep: '19:30', dist: 1536 },
      { code: 'BZA',  arr: '23:05', dep: '23:15', dist: 1743 },
      { code: 'MAS',  arr: '06:15', dep: '06:15', dist: 2174 }
    ]
  },
  {
    train_number: '12621',
    train_name: 'Tamil Nadu Express (Return)',
    train_type: 'Superfast',
    source_code: 'MAS',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'MAS',  arr: '22:00', dep: '22:00', dist: 0 },
      { code: 'BZA',  arr: '04:10', dep: '04:20', dist: 431 },
      { code: 'WL',   arr: '07:18', dep: '07:20', dist: 638 },
      { code: 'BPQ',  arr: '11:55', dep: '12:00', dist: 881 },
      { code: 'NGP',  arr: '15:15', dep: '15:20', dist: 1089 },
      { code: 'ET',   arr: '20:10', dep: '20:15', dist: 1387 },
      { code: 'BPL',  arr: '21:50', dep: '21:55', dist: 1479 },
      { code: 'VGLJ', arr: '01:50', dep: '01:58', dist: 1771 },
      { code: 'GWL',  arr: '03:07', dep: '03:09', dist: 1868 },
      { code: 'AGC',  arr: '04:40', dep: '04:45', dist: 1986 },
      { code: 'NDLS', arr: '07:40', dep: '07:40', dist: 2174 }
    ]
  },
  {
    train_number: '12724',
    train_name: 'Telangana Superfast Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'HYB',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '16:00', dep: '16:00', dist: 0 },
      { code: 'MTJ',  arr: '17:28', dep: '17:30', dist: 141 },
      { code: 'AGC',  arr: '18:05', dep: '18:10', dist: 188 },
      { code: 'GWL',  arr: '19:58', dep: '20:00', dist: 306 },
      { code: 'VGLJ', arr: '21:20', dep: '21:28', dist: 403 },
      { code: 'BPL',  arr: '01:25', dep: '01:30', dist: 695 },
      { code: 'NGP',  arr: '07:10', dep: '07:15', dist: 1085 },
      { code: 'BPQ',  arr: '10:45', dep: '10:50', dist: 1293 },
      { code: 'KZJ',  arr: '14:03', dep: '14:05', dist: 1528 },
      { code: 'SC',   arr: '16:25', dep: '16:30', dist: 1660 },
      { code: 'HYB',  arr: '17:10', dep: '17:10', dist: 1670 }
    ]
  },
  {
    train_number: '12723',
    train_name: 'Telangana Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'HYB',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'HYB',  arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'SC',   arr: '06:20', dep: '06:25', dist: 10 },
      { code: 'KZJ',  arr: '08:18', dep: '08:20', dist: 142 },
      { code: 'BPQ',  arr: '12:05', dep: '12:10', dist: 377 },
      { code: 'NGP',  arr: '15:20', dep: '15:25', dist: 585 },
      { code: 'BPL',  arr: '21:45', dep: '21:50', dist: 975 },
      { code: 'VGLJ', arr: '01:45', dep: '01:53', dist: 1267 },
      { code: 'GWL',  arr: '03:03', dep: '03:05', dist: 1364 },
      { code: 'AGC',  arr: '04:40', dep: '04:45', dist: 1482 },
      { code: 'MTJ',  arr: '05:28', dep: '05:30', dist: 1529 },
      { code: 'NDLS', arr: '07:40', dep: '07:40', dist: 1670 }
    ]
  },
  {
    train_number: '12138',
    train_name: 'Punjab Mail',
    train_type: 'Superfast',
    source_code: 'FZR',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL', '2S'],
    stops: [
      { code: 'FZR',  arr: '21:40', dep: '21:40', dist: 0 },
      { code: 'BTI',  arr: '23:25', dep: '23:50', dist: 88 },
      { code: 'ROK',  arr: '03:11', dep: '03:13', dist: 320 },
      { code: 'DLI',  arr: '04:55', dep: '05:05', dist: 390 },
      { code: 'NDLS', arr: '05:15', dep: '05:20', dist: 393 },
      { code: 'MTJ',  arr: '07:00', dep: '07:02', dist: 534 },
      { code: 'AGC',  arr: '07:45', dep: '07:50', dist: 581 },
      { code: 'GWL',  arr: '09:41', dep: '09:43', dist: 699 },
      { code: 'VGLJ', arr: '11:15', dep: '11:23', dist: 796 },
      { code: 'BPL',  arr: '16:35', dep: '16:40', dist: 1088 },
      { code: 'ET',   arr: '18:40', dep: '18:45', dist: 1180 },
      { code: 'KNW',  arr: '21:43', dep: '21:45', dist: 1363 },
      { code: 'BSL',  arr: '23:30', dep: '23:35', dist: 1487 },
      { code: 'JL',   arr: '00:03', dep: '00:05', dist: 1511 },
      { code: 'MMR',  arr: '02:08', dep: '02:10', dist: 1671 },
      { code: 'NK',   arr: '03:10', dep: '03:15', dist: 1744 },
      { code: 'KYN',  arr: '06:17', dep: '06:20', dist: 1876 },
      { code: 'DR',   arr: '07:02', dep: '07:05', dist: 1918 },
      { code: 'CSMT', arr: '07:35', dep: '07:35', dist: 1927 }
    ]
  },
  {
    train_number: '12137',
    train_name: 'Punjab Mail (Return)',
    train_type: 'Superfast',
    source_code: 'CSMT',
    dest_code: 'FZR',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL', '2S'],
    stops: [
      { code: 'CSMT', arr: '19:35', dep: '19:35', dist: 0 },
      { code: 'DR',   arr: '19:47', dep: '19:50', dist: 9 },
      { code: 'KYN',  arr: '20:32', dep: '20:35', dist: 51 },
      { code: 'NK',   arr: '23:35', dep: '23:40', dist: 183 },
      { code: 'MMR',  arr: '00:38', dep: '00:40', dist: 256 },
      { code: 'JL',   arr: '02:28', dep: '02:30', dist: 416 },
      { code: 'BSL',  arr: '03:00', dep: '03:05', dist: 440 },
      { code: 'KNW',  arr: '05:18', dep: '05:20', dist: 564 },
      { code: 'ET',   arr: '07:55', dep: '08:00', dist: 747 },
      { code: 'BPL',  arr: '09:45', dep: '09:50', dist: 839 },
      { code: 'VGLJ', arr: '14:15', dep: '14:23', dist: 1131 },
      { code: 'GWL',  arr: '15:38', dep: '15:40', dist: 1228 },
      { code: 'AGC',  arr: '17:50', dep: '17:55', dist: 1346 },
      { code: 'MTJ',  arr: '18:43', dep: '18:45', dist: 1393 },
      { code: 'NDLS', arr: '21:25', dep: '21:40', dist: 1534 },
      { code: 'DLI',  arr: '21:55', dep: '22:10', dist: 1537 },
      { code: 'ROK',  arr: '23:34', dep: '23:36', dist: 1607 },
      { code: 'BTI',  arr: '03:10', dep: '03:35', dist: 1839 },
      { code: 'FZR',  arr: '05:10', dep: '05:10', dist: 1927 }
    ]
  },

  // ----------------------------------------------------
  // 2. New Delhi - Kanpur - Prayagraj - Howrah / Eastern Corridor
  // ----------------------------------------------------
  {
    train_number: '12302',
    train_name: 'Howrah Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NDLS',
    dest_code: 'HWH',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NDLS', arr: '16:55', dep: '16:55', dist: 0 },
      { code: 'CNB',  arr: '21:32', dep: '21:37', dist: 440 },
      { code: 'PRYJ', arr: '23:43', dep: '23:45', dist: 634 },
      { code: 'DDU',  arr: '01:42', dep: '01:52', dist: 787 },
      { code: 'GAYA', arr: '03:55', dep: '03:58', dist: 992 },
      { code: 'DHN',  arr: '06:40', dep: '06:45', dist: 1192 },
      { code: 'ASN',  arr: '07:28', dep: '07:30', dist: 1251 },
      { code: 'HWH',  arr: '09:55', dep: '09:55', dist: 1451 }
    ]
  },
  {
    train_number: '12301',
    train_name: 'New Delhi Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'HWH',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'HWH',  arr: '16:50', dep: '16:50', dist: 0 },
      { code: 'ASN',  arr: '18:57', dep: '18:59', dist: 200 },
      { code: 'DHN',  arr: '19:55', dep: '20:00', dist: 259 },
      { code: 'GAYA', arr: '22:34', dep: '22:37', dist: 459 },
      { code: 'DDU',  arr: '00:45', dep: '00:55', dist: 664 },
      { code: 'PRYJ', arr: '02:43', dep: '02:45', dist: 817 },
      { code: 'CNB',  arr: '04:40', dep: '04:45', dist: 1011 },
      { code: 'NDLS', arr: '10:05', dep: '10:05', dist: 1451 }
    ]
  },
  {
    train_number: '12314',
    train_name: 'Sealdah Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NDLS',
    dest_code: 'SDAH',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NDLS', arr: '16:30', dep: '16:30', dist: 0 },
      { code: 'CNB',  arr: '21:12', dep: '21:17', dist: 440 },
      { code: 'DDU',  arr: '01:27', dep: '01:37', dist: 787 },
      { code: 'GAYA', arr: '03:45', dep: '03:48', dist: 992 },
      { code: 'DHN',  arr: '06:18', dep: '06:23', dist: 1192 },
      { code: 'ASN',  arr: '07:09', dep: '07:11', dist: 1251 },
      { code: 'SDAH', arr: '10:10', dep: '10:10', dist: 1458 }
    ]
  },
  {
    train_number: '12313',
    train_name: 'Sealdah Rajdhani Express (Return)',
    train_type: 'Rajdhani',
    source_code: 'SDAH',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'SDAH', arr: '16:50', dep: '16:50', dist: 0 },
      { code: 'ASN',  arr: '18:48', dep: '18:50', dist: 207 },
      { code: 'DHN',  arr: '19:43', dep: '19:48', dist: 266 },
      { code: 'GAYA', arr: '22:19', dep: '22:22', dist: 466 },
      { code: 'DDU',  arr: '00:35', dep: '00:45', dist: 671 },
      { code: 'CNB',  arr: '04:30', dep: '04:35', dist: 1018 },
      { code: 'NDLS', arr: '10:25', dep: '10:25', dist: 1458 }
    ]
  },
  {
    train_number: '22436',
    train_name: 'Vande Bharat Express (BSB)',
    train_type: 'Vande Bharat',
    source_code: 'NDLS',
    dest_code: 'BSB',
    runs_on: 'Mon, Tue, Wed, Fri, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'CNB',  arr: '10:08', dep: '10:10', dist: 440 },
      { code: 'PRYJ', arr: '12:08', dep: '12:10', dist: 634 },
      { code: 'BSB',  arr: '14:00', dep: '14:00', dist: 759 }
    ]
  },
  {
    train_number: '22435',
    train_name: 'Vande Bharat Express (NDLS)',
    train_type: 'Vande Bharat',
    source_code: 'BSB',
    dest_code: 'NDLS',
    runs_on: 'Mon, Tue, Wed, Fri, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'BSB',  arr: '15:00', dep: '15:00', dist: 0 },
      { code: 'PRYJ', arr: '16:30', dep: '16:32', dist: 125 },
      { code: 'CNB',  arr: '18:30', dep: '18:32', dist: 319 },
      { code: 'NDLS', arr: '23:00', dep: '23:00', dist: 759 }
    ]
  },
  {
    train_number: '12004',
    train_name: 'Lucknow Swarna Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'NDLS',
    dest_code: 'LKO',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '06:10', dep: '06:10', dist: 0 },
      { code: 'GZB',  arr: '06:48', dep: '06:50', dist: 25 },
      { code: 'ALJN', arr: '07:49', dep: '07:50', dist: 131 },
      { code: 'TDL',  arr: '08:45', dep: '08:47', dist: 209 },
      { code: 'CNB',  arr: '11:20', dep: '11:25', dist: 440 },
      { code: 'LKO',  arr: '12:40', dep: '12:40', dist: 512 }
    ]
  },
  {
    train_number: '12003',
    train_name: 'New Delhi Swarna Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'LKO',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'LKO',  arr: '15:35', dep: '15:35', dist: 0 },
      { code: 'CNB',  arr: '16:50', dep: '16:55', dist: 72 },
      { code: 'TDL',  arr: '19:20', dep: '19:22', dist: 303 },
      { code: 'ALJN', arr: '20:12', dep: '20:14', dist: 381 },
      { code: 'GZB',  arr: '21:33', dep: '21:35', dist: 487 },
      { code: 'NDLS', arr: '22:15', dep: '22:15', dist: 512 }
    ]
  },
  {
    train_number: '12394',
    train_name: 'Sampoorna Kranti Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'PNBE',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '17:30', dep: '17:30', dist: 0 },
      { code: 'CNB',  arr: '22:22', dep: '22:30', dist: 440 },
      { code: 'PRYJ', arr: '00:30', dep: '00:35', dist: 634 },
      { code: 'DDU',  arr: '02:25', dep: '02:35', dist: 787 },
      { code: 'BXR',  arr: '03:36', dep: '03:38', dist: 881 },
      { code: 'ARA',  arr: '04:25', dep: '04:27', dist: 950 },
      { code: 'PNBE', arr: '06:50', dep: '06:50', dist: 999 }
    ]
  },
  {
    train_number: '12393',
    train_name: 'Sampoorna Kranti Express (Return)',
    train_type: 'Superfast',
    source_code: 'PNBE',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'PNBE', arr: '19:25', dep: '19:25', dist: 0 },
      { code: 'ARA',  arr: '20:00', dep: '20:02', dist: 49 },
      { code: 'BXR',  arr: '20:50', dep: '20:52', dist: 118 },
      { code: 'DDU',  arr: '22:22', dep: '22:32', dist: 212 },
      { code: 'CNB',  arr: '02:25', dep: '02:30', dist: 559 },
      { code: 'NDLS', arr: '07:55', dep: '07:55', dist: 999 }
    ]
  },
  {
    train_number: '12424',
    train_name: 'Dibrugarh Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NDLS',
    dest_code: 'DBRG',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NDLS', arr: '16:20', dep: '16:20', dist: 0 },
      { code: 'CNB',  arr: '21:02', dep: '21:07', dist: 440 },
      { code: 'PRYJ', arr: '23:08', dep: '23:10', dist: 634 },
      { code: 'DDU',  arr: '01:23', dep: '01:33', dist: 787 },
      { code: 'DNR',  arr: '03:48', dep: '03:50', dist: 990 },
      { code: 'PPTA', arr: '04:15', dep: '04:25', dist: 1000 },
      { code: 'BJU',  arr: '06:40', dep: '06:50', dist: 1108 },
      { code: 'NJP',  arr: '12:35', dep: '12:45', dist: 1475 },
      { code: 'DBRG', arr: '07:00', dep: '07:00', dist: 2434 }
    ]
  },
  {
    train_number: '12423',
    train_name: 'Dibrugarh Rajdhani Express (Return)',
    train_type: 'Rajdhani',
    source_code: 'DBRG',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'DBRG', arr: '20:55', dep: '20:55', dist: 0 },
      { code: 'NJP',  arr: '13:15', dep: '13:25', dist: 959 },
      { code: 'BJU',  arr: '19:05', dep: '19:15', dist: 1326 },
      { code: 'PPTA', arr: '21:40', dep: '21:50', dist: 1434 },
      { code: 'DNR',  arr: '22:05', dep: '22:07', dist: 1444 },
      { code: 'DDU',  arr: '00:45', dep: '00:55', dist: 1647 },
      { code: 'PRYJ', arr: '02:53', dep: '02:55', dist: 1800 },
      { code: 'CNB',  arr: '05:00', dep: '05:05', dist: 1994 },
      { code: 'NDLS', arr: '10:30', dep: '10:30', dist: 2434 }
    ]
  },
  {
    train_number: '12878',
    train_name: 'Ranchi Garib Rath Express',
    train_type: 'Garib Rath',
    source_code: 'NDLS',
    dest_code: 'RNC',
    runs_on: 'Tue, Thu, Sun',
    classes: ['3A'],
    stops: [
      { code: 'NDLS', arr: '16:10', dep: '16:10', dist: 0 },
      { code: 'CNB',  arr: '20:52', dep: '20:57', dist: 440 },
      { code: 'PRYJ', arr: '22:58', dep: '23:00', dist: 634 },
      { code: 'DDU',  arr: '01:07', dep: '01:17', dist: 787 },
      { code: 'GHD',  arr: '03:40', dep: '03:45', dist: 998 },
      { code: 'BRWD', arr: '04:30', dep: '04:35', dist: 1056 },
      { code: 'TORI', arr: '05:43', dep: '05:45', dist: 1128 },
      { code: 'RNC',  arr: '08:10', dep: '08:10', dist: 1205 }
    ]
  },
  {
    train_number: '12877',
    train_name: 'Ranchi Garib Rath Express (Return)',
    train_type: 'Garib Rath',
    source_code: 'RNC',
    dest_code: 'NDLS',
    runs_on: 'Mon, Tue, Fri',
    classes: ['3A'],
    stops: [
      { code: 'RNC',  arr: '16:25', dep: '16:25', dist: 0 },
      { code: 'TORI', arr: '18:15', dep: '18:17', dist: 77 },
      { code: 'BRWD', arr: '19:15', dep: '19:20', dist: 149 },
      { code: 'GHD',  arr: '20:15', dep: '20:20', dist: 207 },
      { code: 'DDU',  arr: '23:20', dep: '23:30', dist: 418 },
      { code: 'PRYJ', arr: '01:43', dep: '01:45', dist: 571 },
      { code: 'CNB',  arr: '03:45', dep: '03:50', dist: 765 },
      { code: 'NDLS', arr: '08:45', dep: '08:45', dist: 1205 }
    ]
  },
  {
    train_number: '12802',
    train_name: 'Purushottam Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'PURI',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '22:40', dep: '22:40', dist: 0 },
      { code: 'CNB',  arr: '04:00', dep: '04:05', dist: 440 },
      { code: 'PRYJ', arr: '06:55', dep: '07:00', dist: 634 },
      { code: 'DDU',  arr: '09:50', dep: '10:00', dist: 787 },
      { code: 'BBU',  arr: '10:36', dep: '10:38', dist: 841 },
      { code: 'SSM',  arr: '11:08', dep: '11:10', dist: 889 },
      { code: 'DOS',  arr: '11:24', dep: '11:26', dist: 907 },
      { code: 'GAYA', arr: '13:00', dep: '13:05', dist: 992 },
      { code: 'GMO',  arr: '16:00', dep: '16:05', dist: 1163 },
      { code: 'BKSC', arr: '17:10', dep: '17:15', dist: 1195 },
      { code: 'PRR',  arr: '18:25', dep: '18:30', dist: 1248 },
      { code: 'TATA', arr: '20:00', dep: '20:08', dist: 1337 },
      { code: 'HIJ',  arr: '22:15', dep: '22:20', dist: 1471 },
      { code: 'BLS',  arr: '23:45', dep: '23:50', dist: 1583 },
      { code: 'CTC',  arr: '01:55', dep: '02:00', dist: 1761 },
      { code: 'BBS',  arr: '02:50', dep: '02:55', dist: 1789 },
      { code: 'KUR',  arr: '03:30', dep: '03:35', dist: 1808 },
      { code: 'PURI', arr: '05:25', dep: '05:25', dist: 1852 }
    ]
  },
  {
    train_number: '12801',
    train_name: 'Purushottam Express (Return)',
    train_type: 'Superfast',
    source_code: 'PURI',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'PURI', arr: '21:55', dep: '21:55', dist: 0 },
      { code: 'KUR',  arr: '22:50', dep: '22:55', dist: 44 },
      { code: 'BBS',  arr: '23:25', dep: '23:30', dist: 63 },
      { code: 'CTC',  arr: '00:05', dep: '00:10', dist: 91 },
      { code: 'BLS',  arr: '02:00', dep: '02:05', dist: 269 },
      { code: 'HIJ',  arr: '03:40', dep: '03:45', dist: 381 },
      { code: 'TATA', arr: '06:12', dep: '06:22', dist: 515 },
      { code: 'PRR',  arr: '07:58', dep: '08:00', dist: 604 },
      { code: 'BKSC', arr: '09:20', dep: '09:25', dist: 657 },
      { code: 'GMO',  arr: '10:45', dep: '10:50', dist: 689 },
      { code: 'GAYA', arr: '13:43', dep: '13:48', dist: 860 },
      { code: 'DOS',  arr: '14:48', dep: '14:50', dist: 945 },
      { code: 'SSM',  arr: '15:03', dep: '15:05', dist: 963 },
      { code: 'BBU',  arr: '15:38', dep: '15:40', dist: 1011 },
      { code: 'DDU',  arr: '16:50', dep: '17:00', dist: 1065 },
      { code: 'PRYJ', arr: '19:20', dep: '19:30', dist: 1218 },
      { code: 'CNB',  arr: '21:55', dep: '22:00', dist: 1412 },
      { code: 'NDLS', arr: '04:00', dep: '04:00', dist: 1852 }
    ]
  },
  {
    train_number: '12566',
    train_name: 'Bihar Sampark Kranti Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'DBG',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '13:00', dep: '13:00', dist: 0 },
      { code: 'CNB',  arr: '18:10', dep: '18:15', dist: 440 },
      { code: 'ASH',  arr: '20:00', dep: '20:10', dist: 512 },
      { code: 'BNZ',  arr: '20:30', dep: '20:33', dist: 523 },
      { code: 'GD',   arr: '22:46', dep: '22:48', dist: 637 },
      { code: 'BST',  arr: '23:55', dep: '23:58', dist: 726 },
      { code: 'GKP',  arr: '01:00', dep: '01:10', dist: 790 },
      { code: 'DEOS', arr: '02:01', dep: '02:03', dist: 839 },
      { code: 'SV',   arr: '03:00', dep: '03:05', dist: 909 },
      { code: 'CPR',  arr: '04:40', dep: '04:45', dist: 970 },
      { code: 'SEE',  arr: '05:38', dep: '05:40', dist: 1024 },
      { code: 'HJP',  arr: '05:50', dep: '05:55', dist: 1029 },
      { code: 'MFP',  arr: '07:00', dep: '07:05', dist: 1083 },
      { code: 'SPJ',  arr: '08:15', dep: '08:35', dist: 1135 },
      { code: 'DBG',  arr: '09:30', dep: '09:30', dist: 1172 }
    ]
  },
  {
    train_number: '12565',
    train_name: 'Bihar Sampark Kranti Express (Return)',
    train_type: 'Superfast',
    source_code: 'DBG',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'DBG',  arr: '08:25', dep: '08:25', dist: 0 },
      { code: 'SPJ',  arr: '09:10', dep: '09:35', dist: 37 },
      { code: 'MFP',  arr: '10:20', dep: '10:25', dist: 89 },
      { code: 'HJP',  arr: '11:20', dep: '11:25', dist: 143 },
      { code: 'SEE',  arr: '11:35', dep: '11:37', dist: 148 },
      { code: 'CPR',  arr: '12:50', dep: '12:55', dist: 202 },
      { code: 'SV',   arr: '13:45', dep: '13:50', dist: 263 },
      { code: 'DEOS', arr: '14:41', dep: '14:43', dist: 333 },
      { code: 'GKP',  arr: '15:45', dep: '15:55', dist: 382 },
      { code: 'BST',  arr: '16:50', dep: '16:53', dist: 446 },
      { code: 'GD',   arr: '18:00', dep: '18:02', dist: 535 },
      { code: 'BNZ',  arr: '20:14', dep: '20:17', dist: 649 },
      { code: 'ASH',  arr: '20:45', dep: '20:55', dist: 660 },
      { code: 'CNB',  arr: '22:48', dep: '22:53', dist: 732 },
      { code: 'NDLS', arr: '05:05', dep: '05:05', dist: 1172 }
    ]
  },
  {
    train_number: '12556',
    train_name: 'Gorakhdham Superfast Express',
    train_type: 'Superfast',
    source_code: 'BTI',
    dest_code: 'GKP',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL', '2S'],
    stops: [
      { code: 'BTI',  arr: '14:00', dep: '14:00', dist: 0 },
      { code: 'HSR',  arr: '15:50', dep: '16:00', dist: 116 },
      { code: 'BNW',  arr: '17:00', dep: '17:05', dist: 176 },
      { code: 'ROK',  arr: '18:08', dep: '18:10', dist: 225 },
      { code: 'SSB',  arr: '19:26', dep: '19:28', dist: 285 },
      { code: 'DLI',  arr: '20:00', dep: '20:15', dist: 298 },
      { code: 'GZB',  arr: '21:12', dep: '21:14', dist: 323 },
      { code: 'CNB',  arr: '02:55', dep: '03:00', dist: 738 },
      { code: 'LKO',  arr: '04:50', dep: '05:00', dist: 810 },
      { code: 'GD',   arr: '07:15', dep: '07:20', dist: 928 },
      { code: 'BST',  arr: '08:30', dep: '08:33', dist: 1017 },
      { code: 'GKP',  arr: '09:45', dep: '09:45', dist: 1081 }
    ]
  },
  {
    train_number: '12555',
    train_name: 'Gorakhdham Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'GKP',
    dest_code: 'BTI',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL', '2S'],
    stops: [
      { code: 'GKP',  arr: '16:35', dep: '16:35', dist: 0 },
      { code: 'BST',  arr: '17:34', dep: '17:37', dist: 64 },
      { code: 'GD',   arr: '18:50', dep: '18:55', dist: 153 },
      { code: 'LKO',  arr: '21:20', dep: '21:30', dist: 271 },
      { code: 'CNB',  arr: '23:18', dep: '23:23', dist: 343 },
      { code: 'GZB',  arr: '04:48', dep: '04:50', dist: 758 },
      { code: 'DLI',  arr: '05:30', dep: '05:50', dist: 783 },
      { code: 'SSB',  arr: '06:19', dep: '06:21', dist: 796 },
      { code: 'ROK',  arr: '07:13', dep: '07:15', dist: 856 },
      { code: 'BNW',  arr: '08:10', dep: '08:15', dist: 905 },
      { code: 'HSR',  arr: '09:20', dep: '09:30', dist: 965 },
      { code: 'BTI',  arr: '12:40', dep: '12:40', dist: 1081 }
    ]
  },
  {
    train_number: '12392',
    train_name: 'Shramjeevi Superfast Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'RGD',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '13:10', dep: '13:10', dist: 0 },
      { code: 'GZB',  arr: '13:51', dep: '13:53', dist: 25 },
      { code: 'MB',   arr: '16:02', dep: '16:10', dist: 166 },
      { code: 'BE',   arr: '17:38', dep: '17:40', dist: 256 },
      { code: 'LKO',  arr: '21:20', dep: '21:30', dist: 491 },
      { code: 'SLN',  arr: '23:33', dep: '23:35', dist: 631 },
      { code: 'BSB',  arr: '02:35', dep: '02:45', dist: 774 },
      { code: 'DDU',  arr: '03:33', dep: '03:43', dist: 792 },
      { code: 'BXR',  arr: '04:52', dep: '04:54', dist: 886 },
      { code: 'ARA',  arr: '05:41', dep: '05:43', dist: 955 },
      { code: 'DNR',  arr: '06:23', dep: '06:25', dist: 994 },
      { code: 'PNBE', arr: '07:05', dep: '07:15', dist: 1004 },
      { code: 'PNC',  arr: '07:33', dep: '07:35', dist: 1014 },
      { code: 'BKP',  arr: '08:08', dep: '08:10', dist: 1050 },
      { code: 'BARH', arr: '08:24', dep: '08:26', dist: 1068 },
      { code: 'MKA',  arr: '09:05', dep: '09:07', dist: 1093 },
      { code: 'RGD',  arr: '10:30', dep: '10:30', dist: 1105 }
    ]
  },
  {
    train_number: '12391',
    train_name: 'Shramjeevi Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'RGD',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'RGD',  arr: '08:05', dep: '08:05', dist: 0 },
      { code: 'MKA',  arr: '09:05', dep: '09:07', dist: 12 },
      { code: 'BARH', arr: '09:28', dep: '09:30', dist: 37 },
      { code: 'BKP',  arr: '09:50', dep: '09:52', dist: 55 },
      { code: 'PNC',  arr: '10:18', dep: '10:20', dist: 91 },
      { code: 'PNBE', arr: '10:45', dep: '10:55', dist: 101 },
      { code: 'DNR',  arr: '11:15', dep: '11:17', dist: 111 },
      { code: 'ARA',  arr: '11:43', dep: '11:45', dist: 150 },
      { code: 'BXR',  arr: '12:32', dep: '12:34', dist: 219 },
      { code: 'DDU',  arr: '15:05', dep: '15:15', dist: 313 },
      { code: 'BSB',  arr: '15:55', dep: '16:05', dist: 331 },
      { code: 'SLN',  arr: '18:00', dep: '18:05', dist: 474 },
      { code: 'LKO',  arr: '20:30', dep: '20:40', dist: 614 },
      { code: 'BE',   arr: '00:13', dep: '00:15', dist: 849 },
      { code: 'MB',   arr: '01:50', dep: '01:58', dist: 939 },
      { code: 'GZB',  arr: '04:08', dep: '04:10', dist: 1080 },
      { code: 'NDLS', arr: '04:45', dep: '04:45', dist: 1105 }
    ]
  },

  // ----------------------------------------------------
  // 3. New Delhi - Mumbai - Gujarat Western Corridor
  // ----------------------------------------------------
  {
    train_number: '12952',
    train_name: 'Mumbai Tejas Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NDLS',
    dest_code: 'BCT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NDLS', arr: '16:55', dep: '16:55', dist: 0 },
      { code: 'KOTA', arr: '21:30', dep: '21:40', dist: 466 },
      { code: 'RTM',  arr: '00:48', dep: '00:50', dist: 733 },
      { code: 'BRC',  arr: '04:00', dep: '04:10', dist: 994 },
      { code: 'ST',   arr: '05:33', dep: '05:38', dist: 1123 },
      { code: 'BVI',  arr: '07:58', dep: '08:00', dist: 1357 },
      { code: 'BCT',  arr: '08:35', dep: '08:35', dist: 1386 }
    ]
  },
  {
    train_number: '12951',
    train_name: 'New Delhi Tejas Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'BCT',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'BCT',  arr: '17:00', dep: '17:00', dist: 0 },
      { code: 'BVI',  arr: '17:22', dep: '17:24', dist: 29 },
      { code: 'ST',   arr: '19:43', dep: '19:48', dist: 263 },
      { code: 'BRC',  arr: '21:06', dep: '21:16', dist: 392 },
      { code: 'RTM',  arr: '00:25', dep: '00:28', dist: 653 },
      { code: 'KOTA', arr: '03:15', dep: '03:20', dist: 920 },
      { code: 'NDLS', arr: '08:32', dep: '08:32', dist: 1386 }
    ]
  },
  {
    train_number: '12926',
    train_name: 'Paschim Superfast Express',
    train_type: 'Superfast',
    source_code: 'ASR',
    dest_code: 'BCT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'ASR',  arr: '07:35', dep: '07:35', dist: 0 },
      { code: 'BEAS', arr: '08:08', dep: '08:10', dist: 42 },
      { code: 'JUC',  arr: '08:45', dep: '08:50', dist: 78 },
      { code: 'LDH',  arr: '09:40', dep: '09:50', dist: 135 },
      { code: 'UMB',  arr: '11:45', dep: '11:55', dist: 249 },
      { code: 'NDLS', arr: '16:20', dep: '16:35', dist: 447 },
      { code: 'MTJ',  arr: '18:58', dep: '19:00', dist: 588 },
      { code: 'SWM',  arr: '21:28', dep: '21:30', dist: 798 },
      { code: 'KOTA', arr: '22:50', dep: '23:00', dist: 906 },
      { code: 'RTM',  arr: '03:10', dep: '03:20', dist: 1173 },
      { code: 'BRC',  arr: '07:05', dep: '07:15', dist: 1434 },
      { code: 'ST',   arr: '09:12', dep: '09:17', dist: 1563 },
      { code: 'BVI',  arr: '13:58', dep: '14:02', dist: 1797 },
      { code: 'BCT',  arr: '14:55', dep: '14:55', dist: 1826 }
    ]
  },
  {
    train_number: '12925',
    train_name: 'Paschim Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'BCT',
    dest_code: 'ASR',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'BCT',  arr: '11:25', dep: '11:25', dist: 0 },
      { code: 'BVI',  arr: '11:55', dep: '11:58', dist: 29 },
      { code: 'ST',   arr: '15:47', dep: '15:52', dist: 263 },
      { code: 'BRC',  arr: '17:35', dep: '17:45', dist: 392 },
      { code: 'RTM',  arr: '21:35', dep: '21:45', dist: 653 },
      { code: 'KOTA', arr: '01:50', dep: '02:00', dist: 920 },
      { code: 'SWM',  arr: '03:18', dep: '03:20', dist: 1028 },
      { code: 'MTJ',  arr: '06:40', dep: '06:45', dist: 1238 },
      { code: 'NDLS', arr: '10:40', dep: '11:05', dist: 1379 },
      { code: 'UMB',  arr: '14:40', dep: '14:48', dist: 1577 },
      { code: 'LDH',  arr: '16:26', dep: '16:36', dist: 1691 },
      { code: 'JUC',  arr: '17:35', dep: '17:40', dist: 1748 },
      { code: 'BEAS', arr: '18:13', dep: '18:15', dist: 1784 },
      { code: 'ASR',  arr: '20:10', dep: '20:10', dist: 1826 }
    ]
  },
  {
    train_number: '20901',
    train_name: 'Mumbai - Gandhinagar Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'BCT',
    dest_code: 'ADI',
    runs_on: 'Mon, Tue, Wed, Thu, Fri, Sat',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'BCT',  arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'BVI',  arr: '06:23', dep: '06:25', dist: 29 },
      { code: 'VAPI', arr: '07:56', dep: '07:58', dist: 168 },
      { code: 'ST',   arr: '08:55', dep: '08:58', dist: 263 },
      { code: 'BRC',  arr: '10:13', dep: '10:16', dist: 392 },
      { code: 'ADI',  arr: '11:25', dep: '11:25', dist: 492 }
    ]
  },
  {
    train_number: '20902',
    train_name: 'Gandhinagar - Mumbai Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'ADI',
    dest_code: 'BCT',
    runs_on: 'Mon, Tue, Wed, Thu, Fri, Sat',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'ADI',  arr: '15:00', dep: '15:00', dist: 0 },
      { code: 'BRC',  arr: '15:53', dep: '15:56', dist: 100 },
      { code: 'ST',   arr: '17:10', dep: '17:13', dist: 229 },
      { code: 'VAPI', arr: '18:13', dep: '18:15', dist: 324 },
      { code: 'BVI',  arr: '19:32', dep: '19:34', dist: 463 },
      { code: 'BCT',  arr: '20:25', dep: '20:25', dist: 492 }
    ]
  },
  {
    train_number: '12901',
    train_name: 'Gujarat Mail',
    train_type: 'Superfast',
    source_code: 'BCT',
    dest_code: 'ADI',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'BCT',  arr: '21:40', dep: '21:40', dist: 0 },
      { code: 'BVI',  arr: '22:10', dep: '22:15', dist: 29 },
      { code: 'VAPI', arr: '00:03', dep: '00:05', dist: 168 },
      { code: 'BL',   arr: '00:26', dep: '00:28', dist: 194 },
      { code: 'NVS',  arr: '00:57', dep: '00:59', dist: 233 },
      { code: 'ST',   arr: '01:30', dep: '01:35', dist: 263 },
      { code: 'BH',   arr: '02:18', dep: '02:20', dist: 322 },
      { code: 'BRC',  arr: '03:15', dep: '03:20', dist: 392 },
      { code: 'ANND', arr: '03:52', dep: '03:54', dist: 428 },
      { code: 'ND',   arr: '04:10', dep: '04:12', dist: 446 },
      { code: 'MAN',  arr: '05:15', dep: '05:17', dist: 489 },
      { code: 'ADI',  arr: '05:55', dep: '05:55', dist: 492 }
    ]
  },
  {
    train_number: '12902',
    train_name: 'Gujarat Mail (Return)',
    train_type: 'Superfast',
    source_code: 'ADI',
    dest_code: 'BCT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'ADI',  arr: '22:50', dep: '22:50', dist: 0 },
      { code: 'MAN',  arr: '23:00', dep: '23:02', dist: 3 },
      { code: 'ND',   arr: '23:35', dep: '23:37', dist: 46 },
      { code: 'ANND', arr: '23:51', dep: '23:53', dist: 64 },
      { code: 'BRC',  arr: '00:30', dep: '00:35', dist: 100 },
      { code: 'BH',   arr: '01:23', dep: '01:25', dist: 170 },
      { code: 'ST',   arr: '02:25', dep: '02:30', dist: 229 },
      { code: 'NVS',  arr: '02:58', dep: '03:00', dist: 259 },
      { code: 'BL',   arr: '03:36', dep: '03:38', dist: 298 },
      { code: 'VAPI', arr: '04:00', dep: '04:02', dist: 324 },
      { code: 'BVI',  arr: '05:35', dep: '05:40', dist: 463 },
      { code: 'BCT',  arr: '06:15', dep: '06:15', dist: 492 }
    ]
  },

  // ----------------------------------------------------
  // 4. Mumbai - Pune & Mumbai - Goa Corridors
  // ----------------------------------------------------
  {
    train_number: '12123',
    train_name: 'Deccan Queen Superfast Express',
    train_type: 'Superfast',
    source_code: 'CSMT',
    dest_code: 'PUNE',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'CSMT', arr: '17:10', dep: '17:10', dist: 0 },
      { code: 'DR',   arr: '17:20', dep: '17:22', dist: 9 },
      { code: 'KYN',  arr: '18:08', dep: '18:10', dist: 51 },
      { code: 'KJT',  arr: '18:53', dep: '18:55', dist: 98 },
      { code: 'LNL',  arr: '19:43', dep: '19:45', dist: 126 },
      { code: 'SVJR', arr: '20:09', dep: '20:10', dist: 190 },
      { code: 'PUNE', arr: '20:25', dep: '20:25', dist: 192 }
    ]
  },
  {
    train_number: '12124',
    train_name: 'Deccan Queen Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'PUNE',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'PUNE', arr: '07:15', dep: '07:15', dist: 0 },
      { code: 'SVJR', arr: '07:19', dep: '07:20', dist: 2 },
      { code: 'LNL',  arr: '08:08', dep: '08:10', dist: 66 },
      { code: 'KJT',  arr: '08:58', dep: '09:00', dist: 94 },
      { code: 'KYN',  arr: '09:43', dep: '09:45', dist: 141 },
      { code: 'DR',   arr: '10:13', dep: '10:15', dist: 183 },
      { code: 'CSMT', arr: '10:25', dep: '10:25', dist: 192 }
    ]
  },
  {
    train_number: '12125',
    train_name: 'Pragati Superfast Express',
    train_type: 'Superfast',
    source_code: 'CSMT',
    dest_code: 'PUNE',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'CSMT', arr: '16:25', dep: '16:25', dist: 0 },
      { code: 'DR',   arr: '16:35', dep: '16:38', dist: 9 },
      { code: 'TNA',  arr: '17:02', dep: '17:05', dist: 33 },
      { code: 'PNVL', arr: '17:40', dep: '17:42', dist: 66 },
      { code: 'KJT',  arr: '18:18', dep: '18:20', dist: 98 },
      { code: 'LNL',  arr: '19:08', dep: '19:10', dist: 126 },
      { code: 'SVJR', arr: '19:34', dep: '19:35', dist: 190 },
      { code: 'PUNE', arr: '19:50', dep: '19:50', dist: 192 }
    ]
  },
  {
    train_number: '12126',
    train_name: 'Pragati Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'PUNE',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'PUNE', arr: '07:50', dep: '07:50', dist: 0 },
      { code: 'SVJR', arr: '07:54', dep: '07:55', dist: 2 },
      { code: 'LNL',  arr: '08:43', dep: '08:45', dist: 66 },
      { code: 'KJT',  arr: '09:33', dep: '09:35', dist: 94 },
      { code: 'PNVL', arr: '10:13', dep: '10:15', dist: 126 },
      { code: 'TNA',  arr: '10:48', dep: '10:50', dist: 159 },
      { code: 'DR',   arr: '11:13', dep: '11:15', dist: 183 },
      { code: 'CSMT', arr: '11:30', dep: '11:30', dist: 192 }
    ]
  },
  {
    train_number: '12051',
    train_name: 'Madgaon Jan Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'CSMT',
    dest_code: 'MAO',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'CSMT', arr: '05:10', dep: '05:10', dist: 0 },
      { code: 'DR',   arr: '05:20', dep: '05:22', dist: 9 },
      { code: 'TNA',  arr: '05:43', dep: '05:45', dist: 33 },
      { code: 'PNVL', arr: '06:23', dep: '06:25', dist: 66 },
      { code: 'RN',   arr: '10:40', dep: '10:45', dist: 344 },
      { code: 'KKW',  arr: '12:00', dep: '12:02', dist: 472 },
      { code: 'MAO',  arr: '14:10', dep: '14:10', dist: 571 }
    ]
  },
  {
    train_number: '12052',
    train_name: 'Madgaon Jan Shatabdi Express (Return)',
    train_type: 'Shatabdi',
    source_code: 'MAO',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'MAO',  arr: '15:05', dep: '15:05', dist: 0 },
      { code: 'KKW',  arr: '16:50', dep: '16:52', dist: 99 },
      { code: 'RN',   arr: '18:15', dep: '18:20', dist: 227 },
      { code: 'PNVL', arr: '22:13', dep: '22:15', dist: 505 },
      { code: 'TNA',  arr: '22:48', dep: '22:50', dist: 538 },
      { code: 'DR',   arr: '23:18', dep: '23:20', dist: 562 },
      { code: 'CSMT', arr: '23:45', dep: '23:45', dist: 571 }
    ]
  },

  // ----------------------------------------------------
  // 5. Southern & Eastern Coast Corridors (Bengaluru, Chennai, Kolkata)
  // ----------------------------------------------------
  {
    train_number: '12028',
    train_name: 'KSR Bengaluru - MGR Chennai Shatabdi',
    train_type: 'Shatabdi',
    source_code: 'SBC',
    dest_code: 'MAS',
    runs_on: 'Mon, Wed, Thu, Fri, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'SBC',  arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'BNC',  arr: '06:09', dep: '06:10', dist: 4 },
      { code: 'KJM',  arr: '06:24', dep: '06:25', dist: 14 },
      { code: 'JTJ',  arr: '08:08', dep: '08:10', dist: 145 },
      { code: 'KPD',  arr: '09:08', dep: '09:10', dist: 229 },
      { code: 'AJJ',  arr: '09:58', dep: '10:00', dist: 290 },
      { code: 'MAS',  arr: '11:00', dep: '11:00', dist: 359 }
    ]
  },
  {
    train_number: '12027',
    train_name: 'MGR Chennai - KSR Bengaluru Shatabdi',
    train_type: 'Shatabdi',
    source_code: 'MAS',
    dest_code: 'SBC',
    runs_on: 'Mon, Wed, Thu, Fri, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'MAS',  arr: '17:30', dep: '17:30', dist: 0 },
      { code: 'AJJ',  arr: '18:23', dep: '18:25', dist: 69 },
      { code: 'KPD',  arr: '19:13', dep: '19:15', dist: 130 },
      { code: 'JTJ',  arr: '20:18', dep: '20:20', dist: 214 },
      { code: 'KJM',  arr: '21:54', dep: '21:55', dist: 345 },
      { code: 'BNC',  arr: '22:11', dep: '22:12', dist: 355 },
      { code: 'SBC',  arr: '22:30', dep: '22:30', dist: 359 }
    ]
  },
  {
    train_number: '12608',
    train_name: 'Lalbagh Superfast Express',
    train_type: 'Superfast',
    source_code: 'SBC',
    dest_code: 'MAS',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'SBC',  arr: '06:20', dep: '06:20', dist: 0 },
      { code: 'BNC',  arr: '06:29', dep: '06:30', dist: 4 },
      { code: 'KJM',  arr: '06:44', dep: '06:45', dist: 14 },
      { code: 'JTJ',  arr: '08:58', dep: '09:00', dist: 145 },
      { code: 'KPD',  arr: '10:08', dep: '10:10', dist: 229 },
      { code: 'AJJ',  arr: '11:03', dep: '11:05', dist: 290 },
      { code: 'PER',  arr: '11:53', dep: '11:55', dist: 353 },
      { code: 'MAS',  arr: '12:15', dep: '12:15', dist: 359 }
    ]
  },
  {
    train_number: '12607',
    train_name: 'Lalbagh Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'MAS',
    dest_code: 'SBC',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'MAS',  arr: '15:30', dep: '15:30', dist: 0 },
      { code: 'PER',  arr: '15:43', dep: '15:45', dist: 6 },
      { code: 'AJJ',  arr: '16:33', dep: '16:35', dist: 69 },
      { code: 'KPD',  arr: '17:28', dep: '17:30', dist: 130 },
      { code: 'JTJ',  arr: '18:53', dep: '18:55', dist: 214 },
      { code: 'KJM',  arr: '20:59', dep: '21:00', dist: 345 },
      { code: 'BNC',  arr: '21:19', dep: '21:20', dist: 355 },
      { code: 'SBC',  arr: '21:45', dep: '21:45', dist: 359 }
    ]
  },
  {
    train_number: '12245',
    train_name: 'Howrah - Yesvantpur Duronto Express',
    train_type: 'Duronto',
    source_code: 'HWH',
    dest_code: 'SBC',
    runs_on: 'Tue, Wed, Fri, Sat, Sun',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'HWH',  arr: '10:50', dep: '10:50', dist: 0 },
      { code: 'KGP',  arr: '12:15', dep: '12:20', dist: 115 },
      { code: 'BBS',  arr: '16:15', dep: '16:20', dist: 437 },
      { code: 'VSKP', arr: '22:05', dep: '22:25', dist: 880 },
      { code: 'BZA',  arr: '04:05', dep: '04:15', dist: 1230 },
      { code: 'RU',   arr: '09:55', dep: '10:00', dist: 1605 },
      { code: 'SBC',  arr: '16:00', dep: '16:00', dist: 1946 }
    ]
  },
  {
    train_number: '12246',
    train_name: 'Yesvantpur - Howrah Duronto Express',
    train_type: 'Duronto',
    source_code: 'SBC',
    dest_code: 'HWH',
    runs_on: 'Mon, Tue, Thu, Fri, Sun',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'SBC',  arr: '11:00', dep: '11:00', dist: 0 },
      { code: 'RU',   arr: '16:45', dep: '16:50', dist: 341 },
      { code: 'BZA',  arr: '22:20', dep: '22:30', dist: 716 },
      { code: 'VSKP', arr: '04:10', dep: '04:30', dist: 1066 },
      { code: 'BBS',  arr: '10:25', dep: '10:30', dist: 1509 },
      { code: 'KGP',  arr: '14:20', dep: '14:25', dist: 1831 },
      { code: 'HWH',  arr: '16:15', dep: '16:15', dist: 1946 }
    ]
  },
  {
    train_number: '12841',
    train_name: 'Coromandel Express',
    train_type: 'Superfast',
    source_code: 'HWH',
    dest_code: 'MAS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'HWH',  arr: '15:20', dep: '15:20', dist: 0 },
      { code: 'SRC',  arr: '15:35', dep: '15:37', dist: 7 },
      { code: 'KGP',  arr: '17:00', dep: '17:05', dist: 115 },
      { code: 'BLS',  arr: '18:23', dep: '18:28', dist: 231 },
      { code: 'BHC',  arr: '19:28', dep: '19:30', dist: 294 },
      { code: 'JJKR', arr: '20:01', dep: '20:03', dist: 337 },
      { code: 'CTC',  arr: '20:55', dep: '21:00', dist: 409 },
      { code: 'BBS',  arr: '21:40', dep: '21:45', dist: 437 },
      { code: 'KUR',  arr: '22:15', dep: '22:25', dist: 456 },
      { code: 'BAM',  arr: '00:03', dep: '00:05', dist: 603 },
      { code: 'VSKP', arr: '04:25', dep: '04:45', dist: 880 },
      { code: 'RJY',  arr: '07:23', dep: '07:25', dist: 1081 },
      { code: 'EE',   arr: '08:34', dep: '08:35', dist: 1170 },
      { code: 'BZA',  arr: '09:55', dep: '10:05', dist: 1230 },
      { code: 'MAS',  arr: '17:00', dep: '17:00', dist: 1661 }
    ]
  },
  {
    train_number: '12842',
    train_name: 'Coromandel Express (Return)',
    train_type: 'Superfast',
    source_code: 'MAS',
    dest_code: 'HWH',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'MAS',  arr: '07:00', dep: '07:00', dist: 0 },
      { code: 'BZA',  arr: '12:55', dep: '13:05', dist: 431 },
      { code: 'EE',   arr: '13:54', dep: '13:55', dist: 491 },
      { code: 'RJY',  arr: '15:08', dep: '15:10', dist: 580 },
      { code: 'VSKP', arr: '19:50', dep: '20:10', dist: 781 },
      { code: 'BAM',  arr: '23:35', dep: '23:40', dist: 1058 },
      { code: 'KUR',  arr: '01:50', dep: '02:00', dist: 1205 },
      { code: 'BBS',  arr: '02:25', dep: '02:30', dist: 1224 },
      { code: 'CTC',  arr: '03:10', dep: '03:15', dist: 1252 },
      { code: 'JJKR', arr: '04:08', dep: '04:10', dist: 1324 },
      { code: 'BHC',  arr: '05:08', dep: '05:10', dist: 1367 },
      { code: 'BLS',  arr: '05:50', dep: '05:55', dist: 1430 },
      { code: 'KGP',  arr: '07:45', dep: '07:50', dist: 1546 },
      { code: 'SRC',  arr: '09:28', dep: '09:30', dist: 1654 },
      { code: 'HWH',  arr: '10:40', dep: '10:40', dist: 1661 }
    ]
  },

  // ----------------------------------------------------
  // 6. Howrah - Patna - Bihar Regional Corridors
  // ----------------------------------------------------
  {
    train_number: '12023',
    train_name: 'Howrah - Patna Jan Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'HWH',
    dest_code: 'PNBE',
    runs_on: 'Mon, Tue, Wed, Thu, Fri, Sat',
    classes: ['CC', '2S'],
    stops: [
      { code: 'HWH',  arr: '14:05', dep: '14:05', dist: 0 },
      { code: 'DGR',  arr: '15:58', dep: '16:00', dist: 158 },
      { code: 'ASN',  arr: '16:38', dep: '16:42', dist: 200 },
      { code: 'CRJ',  arr: '17:05', dep: '17:07', dist: 225 },
      { code: 'JMT',  arr: '17:21', dep: '17:22', dist: 240 },
      { code: 'MDP',  arr: '17:51', dep: '17:53', dist: 282 },
      { code: 'JSME', arr: '18:17', dep: '18:19', dist: 311 },
      { code: 'JAJ',  arr: '19:13', dep: '19:15', dist: 355 },
      { code: 'JMU',  arr: '19:33', dep: '19:35', dist: 381 },
      { code: 'KIUL', arr: '20:08', dep: '20:10', dist: 409 },
      { code: 'MKA',  arr: '20:38', dep: '20:40', dist: 443 },
      { code: 'BARH', arr: '20:56', dep: '20:58', dist: 469 },
      { code: 'BKP',  arr: '21:18', dep: '21:20', dist: 487 },
      { code: 'PNC',  arr: '21:49', dep: '21:51', dist: 523 },
      { code: 'PNBE', arr: '22:25', dep: '22:25', dist: 532 }
    ]
  },
  {
    train_number: '12024',
    train_name: 'Patna - Howrah Jan Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'PNBE',
    dest_code: 'HWH',
    runs_on: 'Mon, Tue, Wed, Thu, Fri, Sat',
    classes: ['CC', '2S'],
    stops: [
      { code: 'PNBE', arr: '05:30', dep: '05:30', dist: 0 },
      { code: 'PNC',  arr: '05:43', dep: '05:45', dist: 9 },
      { code: 'BKP',  arr: '06:13', dep: '06:15', dist: 45 },
      { code: 'BARH', arr: '06:28', dep: '06:30', dist: 63 },
      { code: 'MKA',  arr: '06:50', dep: '06:52', dist: 89 },
      { code: 'KIUL', arr: '07:30', dep: '07:32', dist: 123 },
      { code: 'JMU',  arr: '07:56', dep: '07:58', dist: 151 },
      { code: 'JAJ',  arr: '08:35', dep: '08:40', dist: 177 },
      { code: 'JSME', arr: '09:12', dep: '09:14', dist: 221 },
      { code: 'MDP',  arr: '09:39', dep: '09:41', dist: 250 },
      { code: 'JMT',  arr: '10:09', dep: '10:10', dist: 292 },
      { code: 'CRJ',  arr: '10:24', dep: '10:26', dist: 307 },
      { code: 'ASN',  arr: '10:55', dep: '11:00', dist: 332 },
      { code: 'DGR',  arr: '11:31', dep: '11:33', dist: 374 },
      { code: 'HWH',  arr: '13:25', dep: '13:25', dist: 532 }
    ]
  },
  {
    train_number: '22347',
    train_name: 'Howrah - Patna Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'HWH',
    dest_code: 'PNBE',
    runs_on: 'Mon, Tue, Thu, Fri, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'HWH',  arr: '15:50', dep: '15:50', dist: 0 },
      { code: 'ASN',  arr: '17:28', dep: '17:30', dist: 200 },
      { code: 'JMT',  arr: '18:02', dep: '18:04', dist: 240 },
      { code: 'MDP',  arr: '18:32', dep: '18:34', dist: 282 },
      { code: 'JSME', arr: '18:56', dep: '18:58', dist: 311 },
      { code: 'MKA',  arr: '20:50', dep: '20:52', dist: 443 },
      { code: 'PNC',  arr: '21:40', dep: '21:42', dist: 523 },
      { code: 'PNBE', arr: '22:20', dep: '22:20', dist: 532 }
    ]
  },
  {
    train_number: '22348',
    train_name: 'Patna - Howrah Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'PNBE',
    dest_code: 'HWH',
    runs_on: 'Mon, Tue, Thu, Fri, Sat, Sun',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'PNBE', arr: '08:00', dep: '08:00', dist: 0 },
      { code: 'PNC',  arr: '08:12', dep: '08:14', dist: 9 },
      { code: 'MKA',  arr: '09:02', dep: '09:04', dist: 89 },
      { code: 'JSME', arr: '10:53', dep: '10:55', dist: 221 },
      { code: 'MDP',  arr: '11:18', dep: '11:20', dist: 250 },
      { code: 'JMT',  arr: '11:44', dep: '11:46', dist: 292 },
      { code: 'ASN',  arr: '12:15', dep: '12:17', dist: 332 },
      { code: 'HWH',  arr: '14:35', dep: '14:35', dist: 532 }
    ]
  },
  {
    train_number: '12567',
    train_name: 'Rajya Rani Superfast Express',
    train_type: 'Superfast',
    source_code: 'SHC',
    dest_code: 'PNBE',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'SHC',  arr: '07:15', dep: '07:15', dist: 0 },
      { code: 'MNE',  arr: '07:58', dep: '08:00', dist: 45 },
      { code: 'BGS',  arr: '08:31', dep: '08:33', dist: 91 },
      { code: 'BJU',  arr: '08:58', dep: '09:03', dist: 106 },
      { code: 'MKA',  arr: '09:43', dep: '09:45', dist: 128 },
      { code: 'BKP',  arr: '10:18', dep: '10:20', dist: 172 },
      { code: 'PNBE', arr: '11:20', dep: '11:20', dist: 217 }
    ]
  },
  {
    train_number: '12568',
    train_name: 'Rajya Rani Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'PNBE',
    dest_code: 'SHC',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'PNBE', arr: '12:30', dep: '12:30', dist: 0 },
      { code: 'BKP',  arr: '13:13', dep: '13:15', dist: 45 },
      { code: 'MKA',  arr: '13:48', dep: '13:50', dist: 89 },
      { code: 'BJU',  arr: '14:40', dep: '14:45', dist: 111 },
      { code: 'BGS',  arr: '15:03', dep: '15:05', dist: 126 },
      { code: 'MNE',  arr: '15:58', dep: '16:00', dist: 172 },
      { code: 'SHC',  arr: '17:00', dep: '17:00', dist: 217 }
    ]
  },

  // ----------------------------------------------------
  // 17. Delhi - Jaipur - Ajmer - Ahmedabad Corridor
  // ----------------------------------------------------
  {
    train_number: '12015',
    train_name: 'Ajmer Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'NDLS',
    dest_code: 'AII',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '06:10', dep: '06:10', dist: 0 },
      { code: 'DEC',  arr: '06:36', dep: '06:38', dist: 16 },
      { code: 'GGN',  arr: '06:51', dep: '06:53', dist: 32 },
      { code: 'RE',   arr: '07:45', dep: '07:47', dist: 84 },
      { code: 'AWR',  arr: '08:32', dep: '08:35', dist: 158 },
      { code: 'BKI',  arr: '09:28', dep: '09:30', dist: 219 },
      { code: 'GADJ', arr: '10:17', dep: '10:20', dist: 304 },
      { code: 'JP',   arr: '10:40', dep: '10:45', dist: 309 },
      { code: 'KSG',  arr: '12:08', dep: '12:10', dist: 418 },
      { code: 'AII',  arr: '12:55', dep: '12:55', dist: 443 }
    ]
  },
  {
    train_number: '12016',
    train_name: 'New Delhi Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'AII',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'AII',  arr: '15:55', dep: '15:55', dist: 0 },
      { code: 'KSG',  arr: '16:17', dep: '16:19', dist: 25 },
      { code: 'JP',   arr: '17:35', dep: '17:45', dist: 134 },
      { code: 'GADJ', arr: '17:55', dep: '17:58', dist: 139 },
      { code: 'BKI',  arr: '18:48', dep: '18:50', dist: 224 },
      { code: 'AWR',  arr: '19:37', dep: '19:40', dist: 285 },
      { code: 'RE',   arr: '20:40', dep: '20:42', dist: 359 },
      { code: 'GGN',  arr: '21:28', dep: '21:30', dist: 411 },
      { code: 'DEC',  arr: '21:46', dep: '21:48', dist: 427 },
      { code: 'NDLS', arr: '22:30', dep: '22:30', dist: 443 }
    ]
  },
  {
    train_number: '12986',
    train_name: 'Delhi Sarai Rohilla - Jaipur Double Decker',
    train_type: 'Superfast',
    source_code: 'DEE',
    dest_code: 'JP',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'DEE',  arr: '17:35', dep: '17:35', dist: 0 },
      { code: 'DEC',  arr: '17:50', dep: '17:52', dist: 10 },
      { code: 'GGN',  arr: '18:08', dep: '18:10', dist: 27 },
      { code: 'RE',   arr: '19:00', dep: '19:02', dist: 78 },
      { code: 'AWR',  arr: '19:51', dep: '19:54', dist: 153 },
      { code: 'DO',   arr: '20:53', dep: '20:55', dist: 242 },
      { code: 'GADJ', arr: '21:38', dep: '21:41', dist: 298 },
      { code: 'JP',   arr: '22:05', dep: '22:05', dist: 303 }
    ]
  },
  {
    train_number: '12985',
    train_name: 'Jaipur - Delhi Sarai Rohilla Double Decker',
    train_type: 'Superfast',
    source_code: 'JP',
    dest_code: 'DEE',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'JP',   arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'GADJ', arr: '06:09', dep: '06:12', dist: 5 },
      { code: 'DO',   arr: '06:47', dep: '06:49', dist: 61 },
      { code: 'AWR',  arr: '07:42', dep: '07:45', dist: 150 },
      { code: 'RE',   arr: '08:43', dep: '08:45', dist: 225 },
      { code: 'GGN',  arr: '09:36', dep: '09:38', dist: 276 },
      { code: 'DEC',  arr: '09:53', dep: '09:55', dist: 293 },
      { code: 'DEE',  arr: '10:25', dep: '10:25', dist: 303 }
    ]
  },
  {
    train_number: '20978',
    train_name: 'Delhi Cantt - Ajmer Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'DEC',
    dest_code: 'AII',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'DEC',  arr: '18:40', dep: '18:40', dist: 0 },
      { code: 'GGN',  arr: '18:56', dep: '18:58', dist: 17 },
      { code: 'AWR',  arr: '20:17', dep: '20:19', dist: 142 },
      { code: 'JP',   arr: '22:05', dep: '22:10', dist: 293 },
      { code: 'GADJ', arr: '22:20', dep: '22:23', dist: 298 },
      { code: 'AII',  arr: '23:55', dep: '23:55', dist: 428 }
    ]
  },
  {
    train_number: '20977',
    train_name: 'Ajmer - Delhi Cantt Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'AII',
    dest_code: 'DEC',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'AII',  arr: '06:20', dep: '06:20', dist: 0 },
      { code: 'JP',   arr: '07:50', dep: '07:55', dist: 135 },
      { code: 'GADJ', arr: '08:05', dep: '08:08', dist: 140 },
      { code: 'AWR',  arr: '09:40', dep: '09:42', dist: 286 },
      { code: 'GGN',  arr: '11:00', dep: '11:02', dist: 411 },
      { code: 'DEC',  arr: '11:35', dep: '11:35', dist: 428 }
    ]
  },
  {
    train_number: '12958',
    train_name: 'Swarna Jayanti Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NDLS',
    dest_code: 'ADI',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NDLS', arr: '19:55', dep: '19:55', dist: 0 },
      { code: 'DEC',  arr: '20:23', dep: '20:25', dist: 16 },
      { code: 'GGN',  arr: '20:41', dep: '20:43', dist: 32 },
      { code: 'AWR',  arr: '22:15', dep: '22:18', dist: 158 },
      { code: 'JP',   arr: '00:01', dep: '00:10', dist: 309 },
      { code: 'AII',  arr: '01:55', dep: '02:00', dist: 443 },
      { code: 'FA',   arr: '04:10', dep: '04:12', dist: 600 },
      { code: 'ABR',  arr: '05:55', dep: '06:00', dist: 699 },
      { code: 'PNU',  arr: '06:50', dep: '06:52', dist: 752 },
      { code: 'MSH',  arr: '07:40', dep: '07:42', dist: 817 },
      { code: 'ADI',  arr: '08:45', dep: '08:45', dist: 934 }
    ]
  },
  {
    train_number: '12957',
    train_name: 'Swarna Jayanti Rajdhani (Return)',
    train_type: 'Rajdhani',
    source_code: 'ADI',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'ADI',  arr: '17:45', dep: '17:45', dist: 0 },
      { code: 'MSH',  arr: '18:50', dep: '18:52', dist: 117 },
      { code: 'PNU',  arr: '19:50', dep: '19:52', dist: 182 },
      { code: 'ABR',  arr: '20:40', dep: '20:45', dist: 235 },
      { code: 'FA',   arr: '22:08', dep: '22:10', dist: 334 },
      { code: 'AII',  arr: '01:00', dep: '01:05', dist: 491 },
      { code: 'JP',   arr: '02:45', dep: '02:55', dist: 625 },
      { code: 'AWR',  arr: '04:47', dep: '04:50', dist: 776 },
      { code: 'GGN',  arr: '06:24', dep: '06:26', dist: 902 },
      { code: 'DEC',  arr: '06:40', dep: '06:42', dist: 918 },
      { code: 'NDLS', arr: '07:30', dep: '07:30', dist: 934 }
    ]
  },

  // ----------------------------------------------------
  // 18. Delhi - Chandigarh - Kalka / Amritsar Corridor
  // ----------------------------------------------------
  {
    train_number: '12005',
    train_name: 'Kalka Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'NDLS',
    dest_code: 'KLK',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '17:15', dep: '17:15', dist: 0 },
      { code: 'PNP',  arr: '18:18', dep: '18:20', dist: 89 },
      { code: 'KUN',  arr: '18:50', dep: '18:52', dist: 124 },
      { code: 'KKDE', arr: '19:16', dep: '19:18', dist: 157 },
      { code: 'UMB',  arr: '20:06', dep: '20:10', dist: 199 },
      { code: 'CDG',  arr: '20:48', dep: '20:53', dist: 244 },
      { code: 'CNDM', arr: '20:56', dep: '20:58', dist: 254 },
      { code: 'KLK',  arr: '21:15', dep: '21:15', dist: 303 }
    ]
  },
  {
    train_number: '12006',
    train_name: 'Kalka Shatabdi Express (Return)',
    train_type: 'Shatabdi',
    source_code: 'KLK',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'KLK',  arr: '06:15', dep: '06:15', dist: 0 },
      { code: 'CNDM', arr: '06:25', dep: '06:27', dist: 49 },
      { code: 'CDG',  arr: '06:45', dep: '06:53', dist: 59 },
      { code: 'UMB',  arr: '07:33', dep: '07:38', dist: 104 },
      { code: 'KKDE', arr: '08:08', dep: '08:10', dist: 146 },
      { code: 'KUN',  arr: '08:34', dep: '08:36', dist: 179 },
      { code: 'PNP',  arr: '09:05', dep: '09:07', dist: 214 },
      { code: 'NDLS', arr: '10:15', dep: '10:15', dist: 303 }
    ]
  },
  {
    train_number: '12011',
    train_name: 'Kalka New Delhi Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'NDLS',
    dest_code: 'KLK',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '07:40', dep: '07:40', dist: 0 },
      { code: 'PNP',  arr: '08:42', dep: '08:44', dist: 89 },
      { code: 'KUN',  arr: '09:14', dep: '09:16', dist: 124 },
      { code: 'KKDE', arr: '09:40', dep: '09:42', dist: 157 },
      { code: 'UMB',  arr: '10:20', dep: '10:24', dist: 199 },
      { code: 'CDG',  arr: '11:00', dep: '11:05', dist: 244 },
      { code: 'KLK',  arr: '11:45', dep: '11:45', dist: 303 }
    ]
  },
  {
    train_number: '12012',
    train_name: 'Kalka New Delhi Shatabdi (Return)',
    train_type: 'Shatabdi',
    source_code: 'KLK',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'KLK',  arr: '17:45', dep: '17:45', dist: 0 },
      { code: 'CDG',  arr: '18:23', dep: '18:30', dist: 59 },
      { code: 'UMB',  arr: '19:08', dep: '19:12', dist: 104 },
      { code: 'KKDE', arr: '19:38', dep: '19:40', dist: 146 },
      { code: 'KUN',  arr: '20:04', dep: '20:06', dist: 179 },
      { code: 'PNP',  arr: '20:30', dep: '20:32', dist: 214 },
      { code: 'NDLS', arr: '21:55', dep: '21:55', dist: 303 }
    ]
  },
  {
    train_number: '22447',
    train_name: 'Amb Andaura Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'NDLS',
    dest_code: 'AADR',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '05:50', dep: '05:50', dist: 0 },
      { code: 'UMB',  arr: '08:00', dep: '08:02', dist: 199 },
      { code: 'CDG',  arr: '08:38', dep: '08:45', dist: 244 },
      { code: 'SASN', arr: '08:53', dep: '08:55', dist: 256 },
      { code: 'UHL',  arr: '10:34', dep: '10:36', dist: 385 },
      { code: 'AADR', arr: '11:05', dep: '11:05', dist: 412 }
    ]
  },
  {
    train_number: '22448',
    train_name: 'Amb Andaura Vande Bharat (Return)',
    train_type: 'Vande Bharat',
    source_code: 'AADR',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'AADR', arr: '13:00', dep: '13:00', dist: 0 },
      { code: 'UHL',  arr: '13:21', dep: '13:23', dist: 27 },
      { code: 'SASN', arr: '15:01', dep: '15:03', dist: 156 },
      { code: 'CDG',  arr: '15:25', dep: '15:32', dist: 168 },
      { code: 'UMB',  arr: '16:13', dep: '16:15', dist: 213 },
      { code: 'NDLS', arr: '18:25', dep: '18:25', dist: 412 }
    ]
  },
  {
    train_number: '12497',
    train_name: 'Shane Punjab Superfast Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'ASR',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'NDLS', arr: '06:40', dep: '06:40', dist: 0 },
      { code: 'SNP',  arr: '07:20', dep: '07:22', dist: 44 },
      { code: 'PNP',  arr: '07:50', dep: '07:52', dist: 89 },
      { code: 'KUN',  arr: '08:16', dep: '08:18', dist: 124 },
      { code: 'KKDE', arr: '08:40', dep: '08:42', dist: 157 },
      { code: 'UMB',  arr: '09:40', dep: '09:45', dist: 199 },
      { code: 'RPJ',  arr: '10:02', dep: '10:04', dist: 227 },
      { code: 'LDH',  arr: '10:55', dep: '11:00', dist: 313 },
      { code: 'PGW',  arr: '11:24', dep: '11:26', dist: 349 },
      { code: 'JUC',  arr: '11:45', dep: '11:50', dist: 370 },
      { code: 'BEAS', arr: '12:18', dep: '12:20', dist: 406 },
      { code: 'ASR',  arr: '13:00', dep: '13:00', dist: 448 }
    ]
  },
  {
    train_number: '12498',
    train_name: 'Shane Punjab Superfast (Return)',
    train_type: 'Superfast',
    source_code: 'ASR',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'ASR',  arr: '15:10', dep: '15:10', dist: 0 },
      { code: 'BEAS', arr: '15:40', dep: '15:42', dist: 42 },
      { code: 'JUC',  arr: '16:13', dep: '16:18', dist: 78 },
      { code: 'PGW',  arr: '16:36', dep: '16:38', dist: 99 },
      { code: 'LDH',  arr: '17:35', dep: '17:40', dist: 135 },
      { code: 'RPJ',  arr: '18:18', dep: '18:20', dist: 221 },
      { code: 'UMB',  arr: '19:15', dep: '19:25', dist: 249 },
      { code: 'KKDE', arr: '19:46', dep: '19:48', dist: 291 },
      { code: 'KUN',  arr: '20:14', dep: '20:16', dist: 324 },
      { code: 'PNP',  arr: '20:45', dep: '20:47', dist: 359 },
      { code: 'SNP',  arr: '21:18', dep: '21:20', dist: 404 },
      { code: 'NDLS', arr: '22:30', dep: '22:30', dist: 448 }
    ]
  },

  // ----------------------------------------------------
  // 19. Delhi - Jammu Tawi - Katra Corridor
  // ----------------------------------------------------
  {
    train_number: '22439',
    train_name: 'Shri Mata Vaishno Devi Katra Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'NDLS',
    dest_code: 'SVDK',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'UMB',  arr: '08:10', dep: '08:12', dist: 199 },
      { code: 'LDH',  arr: '09:19', dep: '09:21', dist: 313 },
      { code: 'JAT',  arr: '12:38', dep: '12:40', dist: 577 },
      { code: 'SVDK', arr: '14:00', dep: '14:00', dist: 655 }
    ]
  },
  {
    train_number: '22440',
    train_name: 'Shri Mata Vaishno Devi Katra Vande Bharat (Return)',
    train_type: 'Vande Bharat',
    source_code: 'SVDK',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'SVDK', arr: '15:00', dep: '15:00', dist: 0 },
      { code: 'JAT',  arr: '16:08', dep: '16:10', dist: 78 },
      { code: 'LDH',  arr: '19:30', dep: '19:32', dist: 342 },
      { code: 'UMB',  arr: '20:38', dep: '20:40', dist: 456 },
      { code: 'NDLS', arr: '23:00', dep: '23:00', dist: 655 }
    ]
  },
  {
    train_number: '12425',
    train_name: 'New Delhi - Jammu Tawi Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'NDLS',
    dest_code: 'JAT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'NDLS', arr: '20:40', dep: '20:40', dist: 0 },
      { code: 'LDH',  arr: '00:28', dep: '00:38', dist: 313 },
      { code: 'PTKC', arr: '03:08', dep: '03:10', dist: 478 },
      { code: 'JAT',  arr: '05:00', dep: '05:00', dist: 577 }
    ]
  },
  {
    train_number: '12426',
    train_name: 'Jammu Tawi - New Delhi Rajdhani Express',
    train_type: 'Rajdhani',
    source_code: 'JAT',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A'],
    stops: [
      { code: 'JAT',  arr: '19:40', dep: '19:40', dist: 0 },
      { code: 'PTKC', arr: '21:25', dep: '21:27', dist: 99 },
      { code: 'LDH',  arr: '00:05', dep: '00:15', dist: 264 },
      { code: 'NDLS', arr: '04:10', dep: '04:10', dist: 577 }
    ]
  },
  {
    train_number: '12445',
    train_name: 'Uttar Sampark Kranti Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'SVDK',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '20:50', dep: '20:50', dist: 0 },
      { code: 'PNP',  arr: '21:53', dep: '21:55', dist: 89 },
      { code: 'UMB',  arr: '23:30', dep: '23:35', dist: 199 },
      { code: 'LDH',  arr: '01:05', dep: '01:15', dist: 313 },
      { code: 'JUC',  arr: '02:00', dep: '02:05', dist: 370 },
      { code: 'PTKC', arr: '04:00', dep: '04:05', dist: 478 },
      { code: 'JAT',  arr: '06:00', dep: '06:05', dist: 577 },
      { code: 'UHP',  arr: '07:10', dep: '07:12', dist: 630 },
      { code: 'SVDK', arr: '07:55', dep: '07:55', dist: 655 }
    ]
  },
  {
    train_number: '12446',
    train_name: 'Uttar Sampark Kranti Express (Return)',
    train_type: 'Superfast',
    source_code: 'SVDK',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'SVDK', arr: '19:55', dep: '19:55', dist: 0 },
      { code: 'UHP',  arr: '20:40', dep: '20:42', dist: 25 },
      { code: 'JAT',  arr: '21:40', dep: '21:45', dist: 78 },
      { code: 'PTKC', arr: '23:30', dep: '23:35', dist: 177 },
      { code: 'JUC',  arr: '01:20', dep: '01:25', dist: 285 },
      { code: 'LDH',  arr: '02:10', dep: '02:20', dist: 342 },
      { code: 'UMB',  arr: '03:40', dep: '03:45', dist: 456 },
      { code: 'PNP',  arr: '05:15', dep: '05:17', dist: 566 },
      { code: 'NDLS', arr: '06:55', dep: '06:55', dist: 655 }
    ]
  },

  // ----------------------------------------------------
  // 20. Delhi - Dehradun / Haridwar Corridor
  // ----------------------------------------------------
  {
    train_number: '12017',
    train_name: 'Dehradun Shatabdi Express',
    train_type: 'Shatabdi',
    source_code: 'NDLS',
    dest_code: 'DDN',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'NDLS', arr: '06:45', dep: '06:45', dist: 0 },
      { code: 'GZB',  arr: '07:21', dep: '07:23', dist: 25 },
      { code: 'MTC',  arr: '07:55', dep: '07:57', dist: 72 },
      { code: 'MOZ',  arr: '08:33', dep: '08:35', dist: 128 },
      { code: 'SRE',  arr: '09:45', dep: '09:50', dist: 186 },
      { code: 'RK',   arr: '10:16', dep: '10:18', dist: 221 },
      { code: 'HW',   arr: '11:28', dep: '11:33', dist: 262 },
      { code: 'DDN',  arr: '12:55', dep: '12:55', dist: 315 }
    ]
  },
  {
    train_number: '12018',
    train_name: 'Dehradun Shatabdi Express (Return)',
    train_type: 'Shatabdi',
    source_code: 'DDN',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'DDN',  arr: '16:55', dep: '16:55', dist: 0 },
      { code: 'HW',   arr: '18:12', dep: '18:17', dist: 53 },
      { code: 'RK',   arr: '18:58', dep: '19:00', dist: 94 },
      { code: 'SRE',  arr: '19:50', dep: '19:55', dist: 129 },
      { code: 'MOZ',  arr: '20:38', dep: '20:40', dist: 187 },
      { code: 'MTC',  arr: '21:18', dep: '21:20', dist: 243 },
      { code: 'GZB',  arr: '22:02', dep: '22:04', dist: 290 },
      { code: 'NDLS', arr: '22:50', dep: '22:50', dist: 315 }
    ]
  },
  {
    train_number: '22457',
    train_name: 'Anand Vihar - Dehradun Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'ANVT',
    dest_code: 'DDN',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'ANVT', arr: '17:50', dep: '17:50', dist: 0 },
      { code: 'MTC',  arr: '18:34', dep: '18:36', dist: 66 },
      { code: 'MOZ',  arr: '19:08', dep: '19:10', dist: 122 },
      { code: 'RK',   arr: '20:08', dep: '20:10', dist: 208 },
      { code: 'HW',   arr: '20:31', dep: '20:35', dist: 249 },
      { code: 'DDN',  arr: '22:35', dep: '22:35', dist: 302 }
    ]
  },
  {
    train_number: '22458',
    train_name: 'Dehradun - Anand Vihar Vande Bharat (Return)',
    train_type: 'Vande Bharat',
    source_code: 'DDN',
    dest_code: 'ANVT',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'DDN',  arr: '07:00', dep: '07:00', dist: 0 },
      { code: 'HW',   arr: '08:04', dep: '08:08', dist: 53 },
      { code: 'RK',   arr: '08:47', dep: '08:49', dist: 94 },
      { code: 'MOZ',  arr: '09:27', dep: '09:29', dist: 180 },
      { code: 'MTC',  arr: '10:07', dep: '10:09', dist: 236 },
      { code: 'ANVT', arr: '11:45', dep: '11:45', dist: 302 }
    ]
  },

  // ----------------------------------------------------
  // 21. Bengaluru - Hyderabad / Secunderabad Corridor
  // ----------------------------------------------------
  {
    train_number: '12786',
    train_name: 'Kacheguda Superfast Express',
    train_type: 'Superfast',
    source_code: 'SBC',
    dest_code: 'KCG',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'SBC',  arr: '18:20', dep: '18:20', dist: 0 },
      { code: 'YPR',  arr: '18:32', dep: '18:34', dist: 6 },
      { code: 'DMM',  arr: '21:48', dep: '21:50', dist: 175 },
      { code: 'ATP',  arr: '22:19', dep: '22:20', dist: 208 },
      { code: 'DHNE', arr: '00:25', dep: '00:30', dist: 320 },
      { code: 'KRNT', arr: '01:13', dep: '01:15', dist: 374 },
      { code: 'GWD',  arr: '02:19', dep: '02:20', dist: 429 },
      { code: 'MBNR', arr: '03:28', dep: '03:30', dist: 504 },
      { code: 'JCL',  arr: '03:49', dep: '03:50', dist: 522 },
      { code: 'SHNR', arr: '04:19', dep: '04:20', dist: 558 },
      { code: 'KCG',  arr: '05:40', dep: '05:40', dist: 622 }
    ]
  },
  {
    train_number: '12785',
    train_name: 'Kacheguda - KSR Bengaluru Express',
    train_type: 'Superfast',
    source_code: 'KCG',
    dest_code: 'SBC',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'KCG',  arr: '19:05', dep: '19:05', dist: 0 },
      { code: 'SHNR', arr: '19:47', dep: '19:48', dist: 64 },
      { code: 'JCL',  arr: '20:19', dep: '20:20', dist: 100 },
      { code: 'MBNR', arr: '20:38', dep: '20:40', dist: 118 },
      { code: 'GWD',  arr: '21:49', dep: '21:50', dist: 193 },
      { code: 'KRNT', arr: '22:48', dep: '22:50', dist: 248 },
      { code: 'DHNE', arr: '00:05', dep: '00:10', dist: 302 },
      { code: 'ATP',  arr: '01:43', dep: '01:45', dist: 414 },
      { code: 'DMM',  arr: '02:58', dep: '03:00', dist: 447 },
      { code: 'YPR',  arr: '05:40', dep: '05:42', dist: 616 },
      { code: 'SBC',  arr: '06:25', dep: '06:25', dist: 622 }
    ]
  },
  {
    train_number: '20704',
    train_name: 'Kacheguda - Yesvantpur Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'KCG',
    dest_code: 'YPR',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'KCG',  arr: '05:30', dep: '05:30', dist: 0 },
      { code: 'MBNR', arr: '06:30', dep: '06:32', dist: 118 },
      { code: 'KRNT', arr: '08:03', dep: '08:05', dist: 248 },
      { code: 'ATP',  arr: '09:58', dep: '10:00', dist: 414 },
      { code: 'DMM',  arr: '10:48', dep: '10:50', dist: 447 },
      { code: 'YPR',  arr: '14:00', dep: '14:00', dist: 618 }
    ]
  },
  {
    train_number: '20703',
    train_name: 'Yesvantpur - Kacheguda Vande Bharat (Return)',
    train_type: 'Vande Bharat',
    source_code: 'YPR',
    dest_code: 'KCG',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'YPR',  arr: '14:45', dep: '14:45', dist: 0 },
      { code: 'DMM',  arr: '17:28', dep: '17:30', dist: 171 },
      { code: 'ATP',  arr: '18:08', dep: '18:10', dist: 204 },
      { code: 'KRNT', arr: '20:00', dep: '20:02', dist: 370 },
      { code: 'MBNR', arr: '21:30', dep: '21:32', dist: 500 },
      { code: 'KCG',  arr: '23:00', dep: '23:00', dist: 618 }
    ]
  },

  // ----------------------------------------------------
  // 22. Mumbai - Hyderabad / Solapur Corridor
  // ----------------------------------------------------
  {
    train_number: '12701',
    train_name: 'Hussainsagar Superfast Express',
    train_type: 'Superfast',
    source_code: 'CSMT',
    dest_code: 'HYB',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'CSMT', arr: '21:50', dep: '21:50', dist: 0 },
      { code: 'DR',   arr: '22:02', dep: '22:05', dist: 9 },
      { code: 'KYN',  arr: '22:42', dep: '22:45', dist: 54 },
      { code: 'KJT',  arr: '23:23', dep: '23:25', dist: 100 },
      { code: 'PUNE', arr: '01:20', dep: '01:25', dist: 192 },
      { code: 'KWV',  arr: '03:48', dep: '03:50', dist: 377 },
      { code: 'SUR',  arr: '05:00', dep: '05:05', dist: 455 },
      { code: 'GR',   arr: '06:58', dep: '07:00', dist: 568 },
      { code: 'WADI', arr: '07:55', dep: '08:00', dist: 605 },
      { code: 'HYB',  arr: '12:05', dep: '12:05', dist: 789 }
    ]
  },
  {
    train_number: '12702',
    train_name: 'Hussainsagar Superfast (Return)',
    train_type: 'Superfast',
    source_code: 'HYB',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'HYB',  arr: '14:50', dep: '14:50', dist: 0 },
      { code: 'WADI', arr: '18:15', dep: '18:20', dist: 184 },
      { code: 'GR',   arr: '19:07', dep: '19:10', dist: 221 },
      { code: 'SUR',  arr: '20:40', dep: '20:45', dist: 334 },
      { code: 'KWV',  arr: '21:53', dep: '21:55', dist: 412 },
      { code: 'PUNE', arr: '01:00', dep: '01:05', dist: 597 },
      { code: 'KJT',  arr: '02:43', dep: '02:45', dist: 689 },
      { code: 'KYN',  arr: '03:40', dep: '03:43', dist: 735 },
      { code: 'DR',   arr: '04:22', dep: '04:25', dist: 780 },
      { code: 'CSMT', arr: '04:55', dep: '04:55', dist: 789 }
    ]
  },
  {
    train_number: '22225',
    train_name: 'Mumbai CSMT - Solapur Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'CSMT',
    dest_code: 'SUR',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'CSMT', arr: '16:05', dep: '16:05', dist: 0 },
      { code: 'DR',   arr: '16:15', dep: '16:17', dist: 9 },
      { code: 'TNA',  arr: '16:33', dep: '16:35', dist: 34 },
      { code: 'KYN',  arr: '16:53', dep: '16:55', dist: 54 },
      { code: 'PUNE', arr: '19:10', dep: '19:15', dist: 192 },
      { code: 'KWV',  arr: '21:13', dep: '21:15', dist: 377 },
      { code: 'SUR',  arr: '22:40', dep: '22:40', dist: 455 }
    ]
  },
  {
    train_number: '22226',
    train_name: 'Solapur - Mumbai CSMT Vande Bharat (Return)',
    train_type: 'Vande Bharat',
    source_code: 'SUR',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'SUR',  arr: '06:05', dep: '06:05', dist: 0 },
      { code: 'KWV',  arr: '06:53', dep: '06:55', dist: 78 },
      { code: 'PUNE', arr: '09:15', dep: '09:20', dist: 263 },
      { code: 'KYN',  arr: '11:33', dep: '11:35', dist: 401 },
      { code: 'TNA',  arr: '11:53', dep: '11:55', dist: 421 },
      { code: 'DR',   arr: '12:12', dep: '12:15', dist: 446 },
      { code: 'CSMT', arr: '12:35', dep: '12:35', dist: 455 }
    ]
  },

  // ----------------------------------------------------
  // 23. Chennai - Hyderabad Corridor
  // ----------------------------------------------------
  {
    train_number: '12759',
    train_name: 'Charminar Express',
    train_type: 'Superfast',
    source_code: 'MAS',
    dest_code: 'HYB',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'MAS',  arr: '18:10', dep: '18:10', dist: 0 },
      { code: 'SPE',  arr: '19:18', dep: '19:20', dist: 83 },
      { code: 'NYP',  arr: '19:38', dep: '19:40', dist: 110 },
      { code: 'GDR',  arr: '20:08', dep: '20:10', dist: 138 },
      { code: 'NLR',  arr: '20:38', dep: '20:40', dist: 176 },
      { code: 'OGL',  arr: '22:03', dep: '22:05', dist: 293 },
      { code: 'CLX',  arr: '22:43', dep: '22:45', dist: 342 },
      { code: 'TEL',  arr: '23:28', dep: '23:30', dist: 400 },
      { code: 'BZA',  arr: '00:45', dep: '00:55', dist: 431 },
      { code: 'KMT',  arr: '01:59', dep: '02:00', dist: 530 },
      { code: 'WL',   arr: '03:33', dep: '03:35', dist: 638 },
      { code: 'KZJ',  arr: '03:53', dep: '03:55', dist: 648 },
      { code: 'SC',   arr: '06:35', dep: '06:40', dist: 780 },
      { code: 'HYB',  arr: '08:00', dep: '08:00', dist: 790 }
    ]
  },
  {
    train_number: '12760',
    train_name: 'Charminar Express (Return)',
    train_type: 'Superfast',
    source_code: 'HYB',
    dest_code: 'MAS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'HYB',  arr: '18:00', dep: '18:00', dist: 0 },
      { code: 'SC',   arr: '18:20', dep: '18:25', dist: 10 },
      { code: 'KZJ',  arr: '20:13', dep: '20:15', dist: 142 },
      { code: 'WL',   arr: '20:33', dep: '20:35', dist: 152 },
      { code: 'KMT',  arr: '21:54', dep: '21:55', dist: 260 },
      { code: 'BZA',  arr: '23:45', dep: '23:55', dist: 359 },
      { code: 'TEL',  arr: '00:33', dep: '00:35', dist: 390 },
      { code: 'CLX',  arr: '01:13', dep: '01:15', dist: 448 },
      { code: 'OGL',  arr: '01:58', dep: '02:00', dist: 497 },
      { code: 'NLR',  arr: '03:18', dep: '03:20', dist: 614 },
      { code: 'GDR',  arr: '04:18', dep: '04:20', dist: 652 },
      { code: 'NYP',  arr: '04:48', dep: '04:50', dist: 680 },
      { code: 'SPE',  arr: '05:08', dep: '05:10', dist: 707 },
      { code: 'MAS',  arr: '06:45', dep: '06:45', dist: 790 }
    ]
  },

  // ----------------------------------------------------
  // 24. Chennai - Coimbatore Corridor
  // ----------------------------------------------------
  {
    train_number: '12675',
    train_name: 'Kovai Superfast Express',
    train_type: 'Superfast',
    source_code: 'MAS',
    dest_code: 'CBE',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'MAS',  arr: '06:10', dep: '06:10', dist: 0 },
      { code: 'AJJ',  arr: '07:08', dep: '07:10', dist: 69 },
      { code: 'KPD',  arr: '07:58', dep: '08:00', dist: 130 },
      { code: 'JTJ',  arr: '09:13', dep: '09:15', dist: 214 },
      { code: 'SA',   arr: '10:52', dep: '10:55', dist: 335 },
      { code: 'ED',   arr: '11:50', dep: '11:55', dist: 395 },
      { code: 'TUP',  arr: '12:38', dep: '12:40', dist: 445 },
      { code: 'CBE',  arr: '14:05', dep: '14:05', dist: 496 }
    ]
  },
  {
    train_number: '12676',
    train_name: 'Kovai Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'CBE',
    dest_code: 'MAS',
    runs_on: 'Daily',
    classes: ['CC', '2S'],
    stops: [
      { code: 'CBE',  arr: '15:15', dep: '15:15', dist: 0 },
      { code: 'TUP',  arr: '15:58', dep: '16:00', dist: 51 },
      { code: 'ED',   arr: '16:45', dep: '16:50', dist: 101 },
      { code: 'SA',   arr: '17:42', dep: '17:45', dist: 161 },
      { code: 'JTJ',  arr: '19:23', dep: '19:25', dist: 282 },
      { code: 'KPD',  arr: '20:33', dep: '20:35', dist: 366 },
      { code: 'AJJ',  arr: '21:28', dep: '21:30', dist: 427 },
      { code: 'MAS',  arr: '22:50', dep: '22:50', dist: 496 }
    ]
  },
  {
    train_number: '20643',
    train_name: 'Chennai - Coimbatore Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'MAS',
    dest_code: 'CBE',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'MAS',  arr: '14:25', dep: '14:25', dist: 0 },
      { code: 'SA',   arr: '18:18', dep: '18:20', dist: 335 },
      { code: 'ED',   arr: '19:08', dep: '19:10', dist: 395 },
      { code: 'TUP',  arr: '19:53', dep: '19:55', dist: 445 },
      { code: 'CBE',  arr: '20:45', dep: '20:45', dist: 496 }
    ]
  },
  {
    train_number: '20644',
    train_name: 'Coimbatore - Chennai Vande Bharat (Return)',
    train_type: 'Vande Bharat',
    source_code: 'CBE',
    dest_code: 'MAS',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'CBE',  arr: '06:00', dep: '06:00', dist: 0 },
      { code: 'TUP',  arr: '06:35', dep: '06:37', dist: 51 },
      { code: 'ED',   arr: '07:20', dep: '07:22', dist: 101 },
      { code: 'SA',   arr: '08:08', dep: '08:10', dist: 161 },
      { code: 'MAS',  arr: '11:50', dep: '11:50', dist: 496 }
    ]
  },

  // ----------------------------------------------------
  // 25. Ahmedabad - Jaipur Corridor
  // ----------------------------------------------------
  {
    train_number: '12915',
    train_name: 'Ashram Express',
    train_type: 'Superfast',
    source_code: 'ADI',
    dest_code: 'DLI',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'ADI',  arr: '19:15', dep: '19:15', dist: 0 },
      { code: 'MSH',  arr: '20:25', dep: '20:27', dist: 68 },
      { code: 'PNU',  arr: '21:50', dep: '21:52', dist: 133 },
      { code: 'ABR',  arr: '22:40', dep: '22:50', dist: 186 },
      { code: 'FA',   arr: '23:55', dep: '23:57', dist: 284 },
      { code: 'AII',  arr: '02:25', dep: '02:35', dist: 442 },
      { code: 'KSG',  arr: '02:53', dep: '02:55', dist: 467 },
      { code: 'JP',   arr: '04:15', dep: '04:25', dist: 576 },
      { code: 'GADJ', arr: '04:41', dep: '04:44', dist: 581 },
      { code: 'DO',   arr: '05:21', dep: '05:23', dist: 637 },
      { code: 'BKI',  arr: '05:45', dep: '05:47', dist: 666 },
      { code: 'AWR',  arr: '06:40', dep: '06:43', dist: 727 },
      { code: 'RE',   arr: '08:00', dep: '08:02', dist: 801 },
      { code: 'GGN',  arr: '08:46', dep: '08:48', dist: 853 },
      { code: 'DEC',  arr: '09:05', dep: '09:07', dist: 870 },
      { code: 'DLI',  arr: '10:00', dep: '10:00', dist: 884 }
    ]
  },
  {
    train_number: '12916',
    train_name: 'Ashram Express (Return)',
    train_type: 'Superfast',
    source_code: 'DLI',
    dest_code: 'ADI',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'DLI',  arr: '15:20', dep: '15:20', dist: 0 },
      { code: 'DEC',  arr: '15:53', dep: '15:55', dist: 14 },
      { code: 'GGN',  arr: '16:06', dep: '16:08', dist: 31 },
      { code: 'RE',   arr: '17:03', dep: '17:05', dist: 83 },
      { code: 'AWR',  arr: '17:58', dep: '18:01', dist: 157 },
      { code: 'BKI',  arr: '18:58', dep: '19:00', dist: 218 },
      { code: 'DO',   arr: '19:23', dep: '19:25', dist: 247 },
      { code: 'GADJ', arr: '20:00', dep: '20:03', dist: 303 },
      { code: 'JP',   arr: '20:25', dep: '20:35', dist: 308 },
      { code: 'KSG',  arr: '22:08', dep: '22:10', dist: 417 },
      { code: 'AII',  arr: '22:30', dep: '22:40', dist: 442 },
      { code: 'FA',   arr: '00:53', dep: '00:55', dist: 600 },
      { code: 'ABR',  arr: '02:00', dep: '02:10', dist: 698 },
      { code: 'PNU',  arr: '03:10', dep: '03:12', dist: 751 },
      { code: 'MSH',  arr: '04:15', dep: '04:17', dist: 816 },
      { code: 'ADI',  arr: '05:30', dep: '05:30', dist: 884 }
    ]
  },

  // ----------------------------------------------------
  // 26. Gorakhpur - Kolkata Corridor
  // ----------------------------------------------------
  {
    train_number: '15048',
    train_name: 'Purvanchal Express',
    train_type: 'Express',
    source_code: 'GKP',
    dest_code: 'KOAA',
    runs_on: 'Daily',
    classes: ['2A', '3A', 'SL'],
    stops: [
      { code: 'GKP',  arr: '11:20', dep: '11:20', dist: 0 },
      { code: 'DEOS', arr: '12:15', dep: '12:20', dist: 50 },
      { code: 'BTT',  arr: '12:40', dep: '12:42', dist: 71 },
      { code: 'SV',   arr: '13:30', dep: '13:35', dist: 119 },
      { code: 'CPR',  arr: '14:45', dep: '14:50', dist: 180 },
      { code: 'HJP',  arr: '16:10', dep: '16:15', dist: 239 },
      { code: 'MFP',  arr: '17:15', dep: '17:20', dist: 293 },
      { code: 'SPJ',  arr: '18:25', dep: '18:30', dist: 345 },
      { code: 'BJU',  arr: '19:40', dep: '19:50', dist: 396 },
      { code: 'KIUL', arr: '21:00', dep: '21:05', dist: 435 },
      { code: 'JSME', arr: '22:25', dep: '22:30', dist: 531 },
      { code: 'MDP',  arr: '22:52', dep: '22:54', dist: 560 },
      { code: 'CRJ',  arr: '23:18', dep: '23:20', dist: 616 },
      { code: 'ASN',  arr: '23:45', dep: '23:50', dist: 641 },
      { code: 'DGR',  arr: '00:20', dep: '00:22', dist: 684 },
      { code: 'BWN',  arr: '01:25', dep: '01:30', dist: 747 },
      { code: 'KOAA', arr: '03:30', dep: '03:30', dist: 852 }
    ]
  },
  {
    train_number: '15047',
    train_name: 'Purvanchal Express (Return)',
    train_type: 'Express',
    source_code: 'KOAA',
    dest_code: 'GKP',
    runs_on: 'Daily',
    classes: ['2A', '3A', 'SL'],
    stops: [
      { code: 'KOAA', arr: '14:35', dep: '14:35', dist: 0 },
      { code: 'BWN',  arr: '16:03', dep: '16:05', dist: 105 },
      { code: 'DGR',  arr: '17:00', dep: '17:02', dist: 168 },
      { code: 'ASN',  arr: '17:45', dep: '17:50', dist: 211 },
      { code: 'CRJ',  arr: '18:10', dep: '18:12', dist: 236 },
      { code: 'MDP',  arr: '18:38', dep: '18:40', dist: 292 },
      { code: 'JSME', arr: '19:07', dep: '19:12', dist: 321 },
      { code: 'KIUL', arr: '21:18', dep: '21:20', dist: 417 },
      { code: 'BJU',  arr: '22:35', dep: '22:45', dist: 456 },
      { code: 'SPJ',  arr: '23:45', dep: '23:50', dist: 507 },
      { code: 'MFP',  arr: '00:50', dep: '00:55', dist: 559 },
      { code: 'HJP',  arr: '01:50', dep: '01:55', dist: 613 },
      { code: 'CPR',  arr: '03:20', dep: '03:25', dist: 672 },
      { code: 'SV',   arr: '04:15', dep: '04:20', dist: 733 },
      { code: 'BTT',  arr: '05:08', dep: '05:10', dist: 781 },
      { code: 'DEOS', arr: '05:33', dep: '05:35', dist: 802 },
      { code: 'GKP',  arr: '07:15', dep: '07:15', dist: 852 }
    ]
  },

  // ----------------------------------------------------
  // 27. Patna - Ranchi Corridor
  // ----------------------------------------------------
  {
    train_number: '22349',
    train_name: 'Patna - Ranchi Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'PNBE',
    dest_code: 'RNC',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'PNBE', arr: '07:00', dep: '07:00', dist: 0 },
      { code: 'JHD',  arr: '07:34', dep: '07:36', dist: 45 },
      { code: 'GAYA', arr: '08:25', dep: '08:35', dist: 92 },
      { code: 'KQR',  arr: '09:35', dep: '09:37', dist: 170 },
      { code: 'BRHI', arr: '09:58', dep: '10:00', dist: 206 },
      { code: 'BRKA', arr: '11:03', dep: '11:05', dist: 298 },
      { code: 'MESR', arr: '12:20', dep: '12:22', dist: 358 },
      { code: 'RNC',  arr: '13:00', dep: '13:00', dist: 380 }
    ]
  },
  {
    train_number: '22350',
    train_name: 'Ranchi - Patna Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'RNC',
    dest_code: 'PNBE',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'RNC',  arr: '16:15', dep: '16:15', dist: 0 },
      { code: 'MESR', arr: '16:35', dep: '16:37', dist: 22 },
      { code: 'BRKA', arr: '17:35', dep: '17:37', dist: 82 },
      { code: 'BRHI', arr: '18:40', dep: '18:42', dist: 174 },
      { code: 'KQR',  arr: '19:05', dep: '19:07', dist: 210 },
      { code: 'GAYA', arr: '20:40', dep: '20:50', dist: 288 },
      { code: 'JHD',  arr: '21:30', dep: '21:32', dist: 335 },
      { code: 'PNBE', arr: '22:20', dep: '22:20', dist: 380 }
    ]
  },

  // ----------------------------------------------------
  // 28. Mumbai - Goa Corridor
  // ----------------------------------------------------
  {
    train_number: '22229',
    train_name: 'Mumbai CSMT - Madgaon Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'CSMT',
    dest_code: 'MAO',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'CSMT', arr: '05:25', dep: '05:25', dist: 0 },
      { code: 'DR',   arr: '05:38', dep: '05:40', dist: 9 },
      { code: 'TNA',  arr: '05:58', dep: '06:00', dist: 34 },
      { code: 'PNVL', arr: '06:38', dep: '06:40', dist: 69 },
      { code: 'KHED', arr: '08:50', dep: '08:52', dist: 247 },
      { code: 'RN',   arr: '10:35', dep: '10:40', dist: 367 },
      { code: 'KKW',  arr: '11:50', dep: '11:52', dist: 479 },
      { code: 'THVM', arr: '12:40', dep: '12:42', dist: 546 },
      { code: 'MAO',  arr: '13:30', dep: '13:30', dist: 586 }
    ]
  },
  {
    train_number: '22230',
    train_name: 'Madgaon - Mumbai CSMT Vande Bharat Express',
    train_type: 'Vande Bharat',
    source_code: 'MAO',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'MAO',  arr: '14:40', dep: '14:40', dist: 0 },
      { code: 'THVM', arr: '15:30', dep: '15:32', dist: 40 },
      { code: 'KKW',  arr: '16:35', dep: '16:37', dist: 107 },
      { code: 'RN',   arr: '17:50', dep: '17:55', dist: 219 },
      { code: 'KHED', arr: '19:35', dep: '19:37', dist: 339 },
      { code: 'PNVL', arr: '21:40', dep: '21:42', dist: 517 },
      { code: 'TNA',  arr: '22:18', dep: '22:20', dist: 552 },
      { code: 'DR',   arr: '22:38', dep: '22:40', dist: 577 },
      { code: 'CSMT', arr: '23:05', dep: '23:05', dist: 586 }
    ]
  },

  // ----------------------------------------------------
  // 29. Delhi - Ayodhya Corridor
  // ----------------------------------------------------
  {
    train_number: '22426',
    train_name: 'Anand Vihar - Ayodhya Cantt Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'ANVT',
    dest_code: 'AYC',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'ANVT', arr: '06:10', dep: '06:10', dist: 0 },
      { code: 'CNB',  arr: '11:00', dep: '11:05', dist: 428 },
      { code: 'LKO',  arr: '12:25', dep: '12:30', dist: 500 },
      { code: 'AYC',  arr: '14:30', dep: '14:30', dist: 628 }
    ]
  },
  {
    train_number: '22425',
    train_name: 'Ayodhya Cantt - Anand Vihar Vande Bharat',
    train_type: 'Vande Bharat',
    source_code: 'AYC',
    dest_code: 'ANVT',
    runs_on: 'Daily',
    classes: ['CC', 'EC'],
    stops: [
      { code: 'AYC',  arr: '15:20', dep: '15:20', dist: 0 },
      { code: 'LKO',  arr: '17:15', dep: '17:20', dist: 128 },
      { code: 'CNB',  arr: '18:35', dep: '18:40', dist: 200 },
      { code: 'ANVT', arr: '23:40', dep: '23:40', dist: 628 }
    ]
  },

  // ----------------------------------------------------
  // 30. Delhi - Indore Corridor
  // ----------------------------------------------------
  {
    train_number: '12416',
    train_name: 'Intercity Superfast Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'INDB',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '21:50', dep: '21:50', dist: 0 },
      { code: 'MTJ',  arr: '23:35', dep: '23:40', dist: 141 },
      { code: 'BTE',  arr: '00:05', dep: '00:07', dist: 175 },
      { code: 'BXN',  arr: '00:30', dep: '00:32', dist: 217 },
      { code: 'GGC',  arr: '01:10', dep: '01:12', dist: 281 },
      { code: 'SWM',  arr: '01:58', dep: '02:00', dist: 345 },
      { code: 'KOTA', arr: '03:25', dep: '03:35', dist: 453 },
      { code: 'RMA',  arr: '04:18', dep: '04:20', dist: 525 },
      { code: 'BWM',  arr: '04:38', dep: '04:40', dist: 548 },
      { code: 'SGZ',  arr: '05:08', dep: '05:10', dist: 581 },
      { code: 'NAD',  arr: '06:35', dep: '06:37', dist: 673 },
      { code: 'UJN',  arr: '07:45', dep: '07:50', dist: 728 },
      { code: 'DWX',  arr: '08:33', dep: '08:35', dist: 769 },
      { code: 'INDB', arr: '09:30', dep: '09:30', dist: 808 }
    ]
  },
  {
    train_number: '12415',
    train_name: 'Intercity Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'INDB',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'INDB', arr: '17:10', dep: '17:10', dist: 0 },
      { code: 'DWX',  arr: '17:43', dep: '17:45', dist: 39 },
      { code: 'UJN',  arr: '18:30', dep: '18:35', dist: 80 },
      { code: 'NAD',  arr: '19:40', dep: '19:42', dist: 135 },
      { code: 'SGZ',  arr: '20:53', dep: '20:55', dist: 227 },
      { code: 'BWM',  arr: '21:18', dep: '21:20', dist: 260 },
      { code: 'RMA',  arr: '21:38', dep: '21:40', dist: 283 },
      { code: 'KOTA', arr: '22:50', dep: '23:00', dist: 355 },
      { code: 'SWM',  arr: '00:15', dep: '00:17', dist: 463 },
      { code: 'GGC',  arr: '01:08', dep: '01:10', dist: 527 },
      { code: 'BXN',  arr: '01:58', dep: '02:00', dist: 591 },
      { code: 'BTE',  arr: '02:28', dep: '02:30', dist: 633 },
      { code: 'MTJ',  arr: '03:10', dep: '03:15', dist: 667 },
      { code: 'NDLS', arr: '06:20', dep: '06:20', dist: 808 }
    ]
  },

  // ----------------------------------------------------
  // 31. Kolkata - Guwahati Corridor
  // ----------------------------------------------------
  {
    train_number: '12345',
    train_name: 'Saraighat Express',
    train_type: 'Superfast',
    source_code: 'HWH',
    dest_code: 'GHY',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'HWH',  arr: '16:05', dep: '16:05', dist: 0 },
      { code: 'BWN',  arr: '17:12', dep: '17:15', dist: 105 },
      { code: 'BHP',  arr: '17:58', dep: '18:03', dist: 157 },
      { code: 'MLDT', arr: '22:15', dep: '22:25', dist: 395 },
      { code: 'NJP',  arr: '01:25', dep: '01:35', dist: 630 },
      { code: 'NCB',  arr: '03:28', dep: '03:30', dist: 756 },
      { code: 'NOQ',  arr: '03:50', dep: '03:52', dist: 775 },
      { code: 'NBQ',  arr: '06:05', dep: '06:07', dist: 884 },
      { code: 'RNY',  arr: '08:30', dep: '08:32', dist: 994 },
      { code: 'GHY',  arr: '10:05', dep: '10:05', dist: 1001 }
    ]
  },
  {
    train_number: '12346',
    train_name: 'Saraighat Express (Return)',
    train_type: 'Superfast',
    source_code: 'GHY',
    dest_code: 'HWH',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'GHY',  arr: '12:20', dep: '12:20', dist: 0 },
      { code: 'RNY',  arr: '13:00', dep: '13:02', dist: 7 },
      { code: 'NBQ',  arr: '15:20', dep: '15:22', dist: 117 },
      { code: 'NOQ',  arr: '17:05', dep: '17:07', dist: 226 },
      { code: 'NCB',  arr: '17:30', dep: '17:32', dist: 245 },
      { code: 'NJP',  arr: '19:35', dep: '19:45', dist: 371 },
      { code: 'MLDT', arr: '23:30', dep: '23:40', dist: 606 },
      { code: 'BHP',  arr: '02:30', dep: '02:32', dist: 844 },
      { code: 'BWN',  arr: '03:30', dep: '03:32', dist: 896 },
      { code: 'HWH',  arr: '05:15', dep: '05:15', dist: 1001 }
    ]
  },

  // ----------------------------------------------------
  // 32. Lucknow - Mumbai Pushpak Corridor
  // ----------------------------------------------------
  {
    train_number: '12533',
    train_name: 'Pushpak Superfast Express',
    train_type: 'Superfast',
    source_code: 'LJN',
    dest_code: 'CSMT',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'LJN',  arr: '19:30', dep: '19:30', dist: 0 },
      { code: 'CNB',  arr: '21:20', dep: '21:25', dist: 72 },
      { code: 'ORAI', arr: '23:05', dep: '23:07', dist: 178 },
      { code: 'VGLJ', arr: '01:40', dep: '01:48', dist: 292 },
      { code: 'BPL',  arr: '05:40', dep: '05:50', dist: 584 },
      { code: 'BSL',  arr: '11:00', dep: '11:05', dist: 983 },
      { code: 'MMR',  arr: '13:10', dep: '13:12', dist: 1167 },
      { code: 'NK',   arr: '14:10', dep: '14:15', dist: 1240 },
      { code: 'KYN',  arr: '17:07', dep: '17:10', dist: 1374 },
      { code: 'CSMT', arr: '18:15', dep: '18:15', dist: 1426 }
    ]
  },
  {
    train_number: '12534',
    train_name: 'Pushpak Superfast Express (Return)',
    train_type: 'Superfast',
    source_code: 'CSMT',
    dest_code: 'LJN',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'CSMT', arr: '08:25', dep: '08:25', dist: 0 },
      { code: 'KYN',  arr: '09:27', dep: '09:30', dist: 52 },
      { code: 'NK',   arr: '12:20', dep: '12:25', dist: 186 },
      { code: 'MMR',  arr: '13:20', dep: '13:22', dist: 259 },
      { code: 'BSL',  arr: '15:35', dep: '15:40', dist: 443 },
      { code: 'BPL',  arr: '21:20', dep: '21:30', dist: 842 },
      { code: 'VGLJ', arr: '01:50', dep: '01:58', dist: 1134 },
      { code: 'ORAI', arr: '03:15', dep: '03:17', dist: 1248 },
      { code: 'CNB',  arr: '05:45', dep: '05:50', dist: 1354 },
      { code: 'LJN',  arr: '07:10', dep: '07:10', dist: 1426 }
    ]
  },

  // ----------------------------------------------------
  // 33. Delhi - Prayagraj - Varanasi Shiv Ganga Corridor
  // ----------------------------------------------------
  {
    train_number: '12560',
    train_name: 'Shiv Ganga Express',
    train_type: 'Superfast',
    source_code: 'NDLS',
    dest_code: 'BSB',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'NDLS', arr: '20:05', dep: '20:05', dist: 0 },
      { code: 'CNB',  arr: '01:30', dep: '01:35', dist: 440 },
      { code: 'PRYJ', arr: '03:45', dep: '03:55', dist: 635 },
      { code: 'BSB',  arr: '06:10', dep: '06:10', dist: 757 }
    ]
  },
  {
    train_number: '12559',
    train_name: 'Shiv Ganga Express (Return)',
    train_type: 'Superfast',
    source_code: 'BSB',
    dest_code: 'NDLS',
    runs_on: 'Daily',
    classes: ['1A', '2A', '3A', 'SL'],
    stops: [
      { code: 'BSB',  arr: '22:15', dep: '22:15', dist: 0 },
      { code: 'PRYJ', arr: '00:30', dep: '00:35', dist: 122 },
      { code: 'CNB',  arr: '02:45', dep: '02:50', dist: 317 },
      { code: 'NDLS', arr: '08:30', dep: '08:30', dist: 757 }
    ]
  }

];

/**
 * Standard IRCTC class configuration
 */
const CLASS_CONFIG = {
  '1A': { name: 'AC First Class (1A)', totalSeats: 24, perKmRate: 3.2, minFare: 1650 },
  '2A': { name: 'AC 2 Tier (2A)', totalSeats: 48, perKmRate: 2.1, minFare: 1050 },
  '3A': { name: 'AC 3 Tier (3A)', totalSeats: 64, perKmRate: 1.5, minFare: 750 },
  '3E': { name: 'AC 3 Economy (3E)', totalSeats: 72, perKmRate: 1.35, minFare: 680 },
  'CC': { name: 'AC Chair Car (CC)', totalSeats: 72, perKmRate: 1.25, minFare: 420 },
  'EC': { name: 'Executive Chair Car (EC)', totalSeats: 30, perKmRate: 2.6, minFare: 1250 },
  'SL': { name: 'Sleeper Class (SL)', totalSeats: 72, perKmRate: 0.55, minFare: 220 },
  '2S': { name: 'Second Sitting (2S)', totalSeats: 108, perKmRate: 0.3, minFare: 90 }
};

/**
 * Calculate segment timing, duration, and fare between two stops
 */
function calculateSegmentDetails(train, srcStop, dstStop) {
  const depTime = srcStop.dep;
  const arrTime = dstStop.arr;
  const distance = Math.max(25, dstStop.dist - srcStop.dist);

  // Calculate duration
  const [depH, depM] = depTime.split(':').map(Number);
  const [arrH, arrM] = arrTime.split(':').map(Number);
  let depTotal = depH * 60 + depM;
  let arrTotal = arrH * 60 + arrM;
  if (arrTotal <= depTotal) {
    arrTotal += 24 * 60; // Crosses midnight
  }
  const diffMinutes = arrTotal - depTotal;
  const durH = Math.floor(diffMinutes / 60);
  const durM = diffMinutes % 60;
  const duration = `${durH}h ${durM.toString().padStart(2, '0')}m`;

  // Calculate base fares for configured classes
  const classes = train.classes.map(code => {
    const cfg = CLASS_CONFIG[code] || { name: code, totalSeats: 60, perKmRate: 1.0, minFare: 300 };
    const baseFare = Math.max(cfg.minFare, Math.round(distance * cfg.perKmRate));
    return {
      class_code: code,
      class_name: cfg.name,
      total_seats: cfg.totalSeats,
      base_fare: baseFare
    };
  });

  return {
    departure_time: depTime.length === 5 ? `${depTime}:00` : depTime,
    arrival_time: arrTime.length === 5 ? `${arrTime}:00` : arrTime,
    duration,
    distance,
    classes
  };
}

module.exports = {
  TRAIN_CATALOG,
  CLASS_CONFIG,
  calculateSegmentDetails
};
