

// Типы для данных заказов и сделок

export interface OrderData {
  "Order Name": string;
  "Yuan Rate": number;
  "Dollar Rate": number;
  "Article/Name": string;
  "Quantity": number;
  "Price per unit": number;
  "Weight": number;
  "Source File": string;
  "Бренд": string;
}

export interface DealData {
  "№": number;
  "Наименование сделки": string;
  "Статус": string;
  "Дата создания сделки": string;
  "Даты первой оплаты сделки": string | null;
  "Контрагент": string;
  "Наименование товара": string | null;
  "Артикул товара": string | null;
  "Категория товара": string | null;
  "Цена товара, ю": number | null;
  "ВХОД. ю": number | null;
  "ВХОД. $": number | null;
  "Менеджер по продажам": string;
  "Снабженец": string;
}

export interface CombinedData extends OrderData {
  dealData?: DealData;
  dealStatus?: string;
  dealCreationDate?: string;
  dealFirstPaymentDate?: string | null;
  contractor?: string;
  entranceYuan?: number | null;
  entranceDollar?: number | null;
  salesManager?: string;
  supplier?: string;
  // Новое поле для бренда из Excel файла
  detectedBrand?: string;
  // Бренд из поля "Бренд" в заказе для третьей колонки
  dealBrand?: string;
}

// Новые типы для системы обработки ВЭД карточек товаров
export interface VedProductData {
  "№": string;                              // A - Номер
  "Запрос": string;                         // B - Запрос пользователя  
  "Наименование": string;                   // C - Полное наименование товара
  "Бренд": string;                          // D - Бренд/производитель
  "Артикул": string;                        // E - Артикул товара
  "Кол-во, шт": number | string;            // F - Количество (если нужно)
  "Цена, ю": number | string;               // G - Цена в юанях (если нужно) 
  "ИТОГО, ю": number | string;              // H - Итого в юанях (если нужно)
  "Вес, кг": string;                        // I - Вес товара
  "ИТОГО, кг": number | string;             // J - Общий вес (если нужно)
  "Объем": string;                          // K - Объем товара
  "ИТОГО объем": number | string;           // L - Общий объем (если нужно)
  "ТН ВЭД": string;                         // M - Код ТН ВЭД (10 цифр)
  "НДС": string;                            // N - Ставка НДС
  "Пошлина": string;                        // O - Ставка пошлины
  "Группа": string;                         // P - Группа/категория товара
  "Описание": string;                       // Q - Описание (сфера применения, назначение, принцип работы)
  "Электрические параметры": string;        // R - Электрические параметры (A V W)
  "Максимальное давление": string;          // S - Максимальное давление
  "Рабочая среда": string;                  // T - Рабочая среда
  "Номинальный диаметр": string;            // U - Номинальный диаметр
  "Материал": string;                       // V - Материал изготовления
  "Фото": string;                           // W - Ссылка на фото/страницу товара
  "Марка": string;                          // X - Марка/серия товара
  "Компания производитель": string;         // Y - Компания производитель
  "Страна происхождения": string;           // Z - Страна происхождения
  "Сертификация": string;                   // AA - Тип сертификации
  "Стоимость сертификации": string;         // AB - Стоимость сертификации
  "Название компании": string;              // AC - Название компании-сертификатора
  "ИНН": string;                            // AD - ИНН сертификатора
  "Сайт": string;                           // AE - Сайт производителя
}

// Маппинг колонок Excel для ВЭД системы
export const COLUMN_MAPPING = {
  "№": 1,                              // A
  "Запрос": 2,                         // B
  "Наименование": 3,                   // C
  "Бренд": 4,                          // D
  "Артикул": 5,                        // E
  "Кол-во, шт": 6,                     // F
  "Цена, ю": 7,                        // G
  "ИТОГО, ю": 8,                       // H
  "Вес, кг": 9,                        // I
  "ИТОГО, кг": 10,                     // J
  "Объем": 11,                         // K
  "ИТОГО объем": 12,                   // L
  "ТН ВЭД": 13,                        // M
  "НДС": 14,                           // N
  "Пошлина": 15,                       // O
  "Группа": 16,                        // P
  "Описание": 17,                      // Q
  "Электрические параметры": 18,       // R
  "Максимальное давление": 19,         // S
  "Рабочая среда": 20,                 // T
  "Номинальный диаметр": 21,           // U
  "Материал": 22,                      // V
  "Фото": 23,                          // W
  "Марка": 24,                         // X
  "Компания производитель": 25,        // Y
  "Страна происхождения": 26,          // Z
  "Сертификация": 27,                  // AA
  "Стоимость сертификации": 28,        // AB
  "Название компании": 29,             // AC
  "ИНН": 30,                           // AD
  "Сайт": 31                           // AE
};

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  status?: string;
  contractor?: string;
  manager?: string;
  supplier?: string;
}

export interface MetricsData {
  totalOrders: number;
  totalValue: number;
  totalQuantity: number;
  uniqueArticles: number;
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'employee';
  name?: string;
  createdAt: string;
  isActive: boolean;
}

export interface UserSession {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'employee';
  name?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'user' | 'employee';
  name?: string;
}

