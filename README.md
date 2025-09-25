
# 🚀 База знаний заказов и сделок

Веб-приложение для управления заказами, сделками и поиска товаров по артикулам с поддержкой фильтрации по брендам.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Функции

### 🔍 **Поиск товаров**
- Поиск по артикулам и названиям товаров
- Быстрый поиск с автодополнением
- Фильтрация результатов

### 🏷️ **Фильтрация по брендам**
- Множественный выбор брендов
- Быстрые кнопки популярных брендов (Festo, SMC, Siemens)
- Счетчики товаров по брендам

### 📊 **Кодирование товаров**
- Обработка больших объемов данных
- Автоматическое определение брендов
- Экспорт результатов

### 📁 **Управление данными**
- Загрузка файлов Excel/CSV
- Синхронизация с Google Sheets
- Экспорт в различных форматах

### 🔐 **Аутентификация**
- Система входа/регистрации
- Защищенные маршруты
- Управление сессиями

## 📊 Данные

- **Заказы:** 57,079 записей
- **Сделки:** 8,713 записей  
- **Бренды:** 6,725 записей

## 🛠️ Технологии

- **Framework:** Next.js 14 с App Router
- **Frontend:** React 18, TypeScript
- **Styling:** Tailwind CSS, Shadcn/ui
- **State Management:** Zustand, React Query
- **Authentication:** NextAuth.js
- **Database:** Поддержка PostgreSQL/Prisma
- **Charts:** Chart.js, Recharts

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+ 
- Yarn package manager

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/your-username/orders-deals-system.git
cd orders-deals-system

# Перейти в папку приложения
cd app

# Установить зависимости
yarn install

# Создать .env.local файл (см. .env.example)
cp .env.example .env.local

# Запустить в режиме разработки
yarn dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Переменные окружения

Создайте файл `.env.local` в папке `app/`:

```env
# Google Sheets API (опционально)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# NextAuth (если используется аутентификация)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Abacus AI API (для LLM интеграции)
ABACUSAI_API_KEY=your-api-key
```

## 📁 Структура проекта

```
app/
├── components/          # React компоненты
│   ├── ui/             # Базовые UI компоненты (shadcn/ui)
│   ├── brand-filter.tsx
│   ├── results-table.tsx
│   └── ...
├── app/                # App Router (Next.js 14)
│   ├── api/           # API маршруты
│   ├── (auth)/        # Страницы аутентификации
│   └── page.tsx       # Главная страница
├── lib/               # Утилиты и конфигурация
├── public/            # Статические файлы
│   └── data/         # JSON файлы данных
├── styles/           # CSS файлы
└── types/            # TypeScript типы
```

## 📚 API

### Основные эндпоинты:

- `GET /api/orders` - Получить заказы
- `GET /api/deals` - Получить сделки  
- `GET /api/brands/stats` - Статистика по брендам
- `POST /api/products/process` - Обработка товаров
- `GET /api/export` - Экспорт данных

### Поиск и фильтрация:

```javascript
// Поиск товаров
const response = await fetch('/api/orders?search=артикул&brands=festo,smc');
const data = await response.json();
```

## 🎨 UI компоненты

Приложение использует современные UI компоненты:

- **shadcn/ui** - Базовые компоненты
- **Radix UI** - Примитивы доступности
- **Lucide React** - Иконки
- **Tailwind CSS** - Стилизация

## 📈 Возможности

### Поиск и фильтрация
- Интеллектуальный поиск по артикулам
- Фильтрация по множественным брендам
- Сортировка результатов
- Пагинация больших наборов данных

### Обработка данных
- Импорт Excel/CSV файлов
- Автоматическое сопоставление брендов
- Валидация данных
- Экспорт в различных форматах

### Интеграции
- Google Sheets API
- Abacus AI для обработки
- NextAuth для аутентификации

## 🛡️ Безопасность

- CSP (Content Security Policy)
- Валидация входных данных
- Защищенные API маршруты
- Безопасное хранение токенов

## 📦 Сборка и развертывание

```bash
# Сборка для продакшена
yarn build

# Запуск продакшен версии
yarn start

# Экспорт статических файлов
yarn export
```

### Варианты развертывания:

- **Vercel** (рекомендуется для Next.js)
- **Railway**
- **DigitalOcean App Platform**
- **Docker** (см. Dockerfile)

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Запуште в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для деталей.

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Abacus AI](https://abacus.ai/) - AI/ML platform

---

**Создано с ❤️ с использованием современных веб-технологий**
