
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { VedProductData, COLUMN_MAPPING } from '@/lib/types';
// import OpenAI from 'openai';

interface ProcessingRequest {
  name: string;
  article: string;
}

// Основной мастер-промпт из Google Apps Script
const MASTER_PROMPT = `
Твоя главная задача — с максимальной точностью и полнотой заполнить карточку ВЭД для указанного товара.
**ЗОЛОТЫЕ ПРАВИЛА (обязательны к исполнению):**
1.  **ПОЛНОТА ДАННЫХ:** Все поля в итоговом JSON **должны быть заполнены**. Единственное исключение — технические характеристики, 'Вес, кг' и 'Объем', где можно поставить прочерк '-', если данных объективно нет. Поля, связанные с ВЭД и сертификацией, **не могут быть пустыми**.
2.  **ДОСТОВЕРНОСТЬ ПОШЛИНЫ:** Для поля 'Пошлина' ты **обязан** найти и указать точную ставку из официальных источников таможенных органов РФ/ЕАЭС.

**Шаг 1: Идентификация товара и производителя.**
- Идентифицируй **истинный товар по артикулу**.
- Извлеки из запроса **бренд** и запиши его в поле 'Бренд'.
- Для поля 'Компания производитель' найди официальное **юридическое наименование** компании-производителя.

**Шаг 2: Сбор информации (согласно Золотым правилам).**
- **Вес и Объем**: Найди точные или ориентировочные значения для полей 'Вес, кг' и 'Объем'. Если данных нет, поставь прочерк '-'.
- **Для поля 'Фото'**: Найди ссылку на **веб-страницу с описанием этого товара** на официальном сайте производителя или крупного дистрибьютора.
- **ВЭД**: Найди код ТН ВЭД, ставки пошлины и НДС.
- **Сертификация и Компания-исполнитель**: Найди, какие документы нужны для ввоза в РФ. Затем найди **реальную российскую компанию-сертификатор** с её данными (Название, ИНН, Сайт) и примерной стоимостью услуг.

**Шаг 3: Формат вывода.**
ВЕСЬ РЕЗУЛЬТАТ верни СТРОГО в виде ОДНОГО валидного JSON объекта.
JSON должен содержать только эти ключи: "Наименование", "Бренд", "Артикул", "Вес, кг", "Объем", "ТН ВЭД", "НДС", "Пошлина", "Группа", "Описание", "Электрические параметры", "Максимальное давление", "Рабочая среда", "Номинальный диаметр", "Материал", "Фото", "Марка", "Компания производитель", "Страна происхождения", "Сертификация", "Стоимость сертификации", "Название компании", "ИНН", "Сайт".

**Исходный запрос от пользователя**: "{PRODUCT}"
`;

// Простое глобальное хранилище статуса
class ProcessingStatusService {
  private static instance: ProcessingStatusService;
  private isProcessing = false;
  private progress = 0;
  private completed = false;
  private stopped = false;
  private totalRequests = 0;
  private completedRequests = 0;
  private currentItem?: {
    name: string;
    step: string;
    details: string;
    stepIndex?: number;
    totalSteps?: number;
  };
  private stepProgress?: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
    fieldsProcessing: string[];
  };
  private aiDialog?: {
    isActive: boolean;
    step: string;
    prompt: string;
    response: string;
    processedData: any;
    isComplete: boolean;
  };
  private aiRawResponse?: {
    request: string;
    response: string;
    processedData: any;
  };
  private requests: Array<{
    name: string;
    article: string;
    status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped';
    error?: string;
    statusText?: string;
    currentStep?: string;
    stepProgress?: number;
  }> = [];

  static getInstance(): ProcessingStatusService {
    if (!ProcessingStatusService.instance) {
      ProcessingStatusService.instance = new ProcessingStatusService();
    }
    return ProcessingStatusService.instance;
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      progress: this.progress,
      completed: this.completed,
      stopped: this.stopped,
      requests: this.requests,
      totalRequests: this.totalRequests,
      completedRequests: this.completedRequests,
      currentItem: this.currentItem,
      stepProgress: this.stepProgress,
      aiDialog: this.aiDialog,
      aiRawResponse: this.aiRawResponse
    };
  }

  startProcessing(requests: ProcessingRequest[]) {
    this.isProcessing = true;
    this.progress = 0;
    this.completed = false;
    this.stopped = false;
    this.totalRequests = requests.length;
    this.completedRequests = 0;
    this.requests = requests.map(req => ({ 
      ...req, 
      status: 'pending' as const,
      statusText: 'Ожидает обработки',
      stepProgress: 0
    }));
    this.aiDialog = undefined;
    this.stepProgress = undefined;
    this.aiRawResponse = undefined;
  }

  updateProgress() {
    this.progress = this.totalRequests > 0 ? (this.completedRequests / this.totalRequests) * 100 : 0;
  }

  updateRequestStatus(index: number, status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped', error?: string, statusText?: string) {
    if (this.requests[index]) {
      const previousStatus = this.requests[index].status;
      this.requests[index].status = status;
      
      if (error) {
        this.requests[index].error = error;
      }
      
      if (statusText) {
        this.requests[index].statusText = statusText;
      }
      
      // Обновляем счетчик завершенных запросов
      if (status === 'completed' && previousStatus !== 'completed') {
        this.completedRequests++;
      }
      
      this.updateProgress();
    }
  }

  updateRequestStep(index: number, step: string, stepProgress: number) {
    if (this.requests[index]) {
      this.requests[index].currentStep = step;
      this.requests[index].stepProgress = stepProgress;
    }
  }

  setCurrentItem(name: string, step: string, details: string, stepIndex?: number, totalSteps?: number) {
    this.currentItem = { name, step, details, stepIndex, totalSteps };
  }

  setStepProgress(currentStep: number, totalSteps: number, stepName: string, fieldsProcessing: string[]) {
    this.stepProgress = {
      currentStep,
      totalSteps,
      stepName,
      fieldsProcessing
    };
  }

  setAiDialog(isActive: boolean, step: string = '', prompt: string = '', response: string = '', processedData: any = null, isComplete: boolean = false) {
    this.aiDialog = {
      isActive,
      step,
      prompt,
      response,
      processedData,
      isComplete
    };
  }

  setAiRawResponse(request: string, response: string, processedData: any) {
    this.aiRawResponse = {
      request,
      response,
      processedData
    };
  }

  clearAiRawResponse() {
    this.aiRawResponse = undefined;
  }

  clearCurrentItem() {
    this.currentItem = undefined;
  }

  setCompleted(completed: boolean) {
    this.completed = completed;
    this.isProcessing = !completed;
    if (completed) {
      this.progress = 100;
      this.aiDialog = undefined;
      this.stepProgress = undefined;
      this.aiRawResponse = undefined;
    }
  }

  stop() {
    this.stopped = true;
    this.isProcessing = false;
  }

  isStopped() {
    return this.stopped;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requests } = body;
    
    if (!requests || !Array.isArray(requests)) {
      return NextResponse.json(
        { success: false, message: 'Invalid requests data' },
        { status: 400 }
      );
    }

    console.log('[PROCESS API] Starting staged processing for', requests.length, 'products');
    
    const statusService = ProcessingStatusService.getInstance();
    statusService.startProcessing(requests);
    
    // Запускаем полную обработку в фоне
    processRequestsWithFullPrompt(requests).catch(error => {
      console.error('[PROCESS API] Background processing error:', error);
    });
    
    return NextResponse.json({
      success: true,
      message: 'ВЭД processing started with ChatGPT',
      requestCount: requests.length,
      mode: 'chatgpt_master_prompt'
    });
    
  } catch (error) {
    console.error('[PROCESS API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processRequestsWithFullPrompt(requests: ProcessingRequest[]) {
  console.log('[FULL PROCESS] Starting full processing for', requests.length, 'products');
  
  const statusService = ProcessingStatusService.getInstance();
  
  try {
    // Проверяем наличие API ключа OpenAI
    const abacusApiKey = process.env.ABACUSAI_API_KEY;
    if (!abacusApiKey) {
      console.error('[FULL PROCESS] ABACUSAI_API_KEY not found');
      throw new Error('Abacus AI API key not configured');
    }
    
    for (let i = 0; i < requests.length; i++) {
      // Проверяем, не остановлена ли обработка
      if (statusService.isStopped()) {
        console.log('[FULL PROCESS] Processing stopped by user, breaking loop');
        break;
      }

      const request = requests[i];
      console.log(`[FULL PROCESS] Processing product ${i + 1}/${requests.length}:`, request);
      
      // Обновляем статус
      statusService.updateRequestStatus(i, 'processing', undefined, 'Обрабатываю через ChatGPT...');
      statusService.setCurrentItem(
        request.name, 
        'Полная обработка карточки ВЭД...', 
        'Анализ товара с помощью ChatGPT o1-preview/gpt-4o'
      );
      statusService.clearAiRawResponse(); // Очищаем предыдущие данные

      const productText = `${request.name} ${request.article || ''}`.trim();

      try {
        // Выполняем полную обработку через OpenAI ChatGPT с мастер-промптом
        const result = await processWithOpenAI(productText, statusService);
        
        if (result) {
          // Создаем объект VedProductData из результата
          const vedProductData: Partial<VedProductData> = {
            "№": (i + 1).toString(),
            "Запрос": productText,
            "Наименование": result["Наименование"] || "",
            "Бренд": result["Бренд"] || "",
            "Артикул": result["Артикул"] || "",
            "Кол-во, шт": "",
            "Цена, ю": "",
            "ИТОГО, ю": "",
            "Вес, кг": result["Вес, кг"] || "-",
            "ИТОГО, кг": "",
            "Объем": result["Объем"] || "-", 
            "ИТОГО объем": "",
            "ТН ВЭД": result["ТН ВЭД"] || "",
            "НДС": result["НДС"] || "",
            "Пошлина": result["Пошлина"] || "",
            "Группа": result["Группа"] || "",
            "Описание": result["Описание"] || "",
            "Электрические параметры": result["Электрические параметры"] || "-",
            "Максимальное давление": result["Максимальное давление"] || "-",
            "Рабочая среда": result["Рабочая среда"] || "-",
            "Номинальный диаметр": result["Номинальный диаметр"] || "-",
            "Материал": result["Материал"] || "",
            "Фото": result["Фото"] || "",
            "Марка": result["Марка"] || "",
            "Компания производитель": result["Компания производитель"] || "",
            "Страна происхождения": result["Страна происхождения"] || "",
            "Сертификация": result["Сертификация"] || "",
            "Стоимость сертификации": result["Стоимость сертификации"] || "",
            "Название компании": result["Название компании"] || "",
            "ИНН": result["ИНН"] || "",
            "Сайт": result["Сайт"] || ""
          };

          // Показываем этап сохранения данных
          statusService.setCurrentItem(
            request.name,
            `💾 Сохраняю данные в таблицу...`,
            `Запись товара ${i + 1} из ${requests.length} в таблицу результатов`
          );
          
          // Сохраняем результат
          await saveVedProductData(vedProductData, i);
          
          statusService.updateRequestStatus(i, 'completed', undefined, '✅ Завершено');
          console.log(`[FULL PROCESS] Product ${i + 1}/${requests.length} completed successfully`);
          
          // Показываем что товар добавлен в таблицу
          statusService.setCurrentItem(
            request.name,
            `✅ Товар добавлен в таблицу!`,
            `Данные успешно записаны. Переходим к следующему товару...`
          );
          
          // Пауза чтобы пользователь увидел результат
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Очищаем RAW ответ после сохранения
          statusService.clearAiRawResponse();
        } else {
          throw new Error('ChatGPT не вернул корректный результат');
        }
        
      } catch (error) {
        console.error(`[FULL PROCESS] Error processing product ${i + 1}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        statusService.updateRequestStatus(i, 'error', errorMessage, `❌ Ошибка: ${errorMessage}`);
        
        // Сохраняем базовую структуру при ошибке
        const basicData: Partial<VedProductData> = {
          "№": (i + 1).toString(),
          "Запрос": productText,
          "Наименование": "",
          "Бренд": "",
          "Артикул": ""
        };
        await saveVedProductData(basicData, i);
      }

      // Пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    statusService.clearCurrentItem();
    statusService.setCompleted(true);
    console.log('[FULL PROCESS] All products processed successfully');
    
  } catch (error) {
    console.error('[FULL PROCESS] Error in full processing:', error);
    statusService.setCompleted(true);
  }
}

async function processWithOpenAI(productText: string, statusService: any): Promise<any> {
  console.log(`[OPENAI] Processing full product: "${productText}"`);
  
  const prompt = MASTER_PROMPT.replace('{PRODUCT}', productText);
  
  // Обновляем диалог для OpenAI
  statusService.setAiDialog(true, 'Полная обработка ВЭД карточки через ChatGPT', prompt, '', null, false);
  
  // Используем retry механизм
  const maxRetries = 3;
  let attempt = 0;

  // Инициализируем OpenAI клиент
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY не найден в переменных окружения');
  }
  
  console.log('[OPENAI] API key found:', apiKey.substring(0, 20) + '...');
  
  // const openai = new OpenAI({
  //   apiKey: apiKey,
  // });

  while (attempt < maxRetries) {
    try {
      statusService.setCurrentItem(
        productText.split(' ')[0],
        `🤖 ChatGPT анализирует товар (попытка ${attempt + 1})...`,
        'Обращение к OpenAI GPT-4o API'
      );

      // Используем самую мощную модель o1-mini (быстрее o1-preview, но все еще топ качество)
      let model = 'gpt-4o';
      let systemPrompt = "Ты эксперт по ВЭД (внешнеэкономической деятельности) и таможенному оформлению. Твоя задача - с максимальной точностью заполнить карточку товара для импорта в РФ.";
      
      // Пробуем o1-mini для высокого качества и скорости
      try {
        const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.2,
            max_tokens: 8192,
            response_format: { type: "json_object" }
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const generatedText = data.choices[0]?.message?.content;
        if (!generatedText) {
          throw new Error('Нет ответа от Abacus AI');
        }
        
        console.log(`[OPENAI] o1-mini Raw response:`, generatedText);
        return await processOpenAIResponse(generatedText, productText, statusService, 'o1-mini');
        
      } catch (o1Error) {
        console.log(`[OPENAI] o1-mini недоступен, используем gpt-4o:`, o1Error);
        console.log(`[OPENAI] o1Error details:`, JSON.stringify(o1Error, null, 2));
        
        // Fallback на gpt-4o
        const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4.1-mini',
            messages: [
              {
                role: 'system',
                content: systemPrompt
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.2,
            max_tokens: 8192,
            response_format: { type: "json_object" }
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const generatedText = data.choices[0]?.message?.content;
        if (!generatedText) {
          throw new Error('Нет ответа от Abacus AI gpt-4.1-mini');
        }
        
        console.log(`[OPENAI] gpt-4o Raw response:`, generatedText);
        return await processOpenAIResponse(generatedText, productText, statusService, 'gpt-4o');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      attempt++;
      console.log(`[OPENAI] Error on attempt ${attempt}:`, error);
      
      statusService.setCurrentItem(
        productText.split(' ')[0],
        `⚠️ Ошибка ChatGPT (попытка ${attempt})...`,
        `Ошибка: ${errorMessage}`
      );
      
      if (attempt >= maxRetries) {
        console.error(`[OPENAI] Final error:`, error);
        statusService.setAiDialog(true, 'Полная обработка ВЭД карточки', '', `Ошибка: ${errorMessage}`, null, true);
        throw new Error(`ChatGPT недоступен после ${maxRetries} попыток: ${errorMessage}`);
      }
      
      // Пауза между попытками
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
}

async function processOpenAIResponse(generatedText: string, productText: string, statusService: any, model: string): Promise<any> {
  // Показываем RAW ответ пользователю В РЕАЛЬНОМ ВРЕМЕНИ - с построчным выводом  
  statusService.setCurrentItem(
    productText.split(' ')[0],
    `🎯 ChatGPT ${model} закончил анализ!`,
    'Отображаю полученные данные...'
  );
  
  // Сохраняем RAW ответ для показа пользователю
  statusService.setAiRawResponse(productText, generatedText, null);
  
  // Обновляем диалог с полным ответом для отображения процесса
  statusService.setAiDialog(true, `📝 ChatGPT ${model} пишет результат`, '', generatedText, null, false);
  
  // Пауза чтобы пользователь увидел полный RAW текст от GPT
  await new Promise(resolve => setTimeout(resolve, 4000));
  
  // Теперь обрабатываем и парсим JSON
  statusService.setCurrentItem(
    productText.split(' ')[0],
    `🔧 Извлекаю данные из ответа GPT...`,
    `Парсинг JSON структуры от ChatGPT ${model}`
  );
  
  const startIndex = generatedText.indexOf('{');
  const endIndex = generatedText.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Нет JSON в ответе от ChatGPT. Ответ API: "${generatedText.substring(0, 150)}..."`);
  }
  
  const jsonString = generatedText.substring(startIndex, endIndex + 1);
  let result;
  
  try {
    result = JSON.parse(jsonString);
    console.log(`[OPENAI] Parsed result:`, result);
  } catch (parseError) {
    console.error('[OPENAI] JSON parse error:', parseError);
    throw new Error(`Ошибка парсинга JSON: ${parseError instanceof Error ? parseError.message : 'неизвестная ошибка'}`);
  }
  
  // Обновляем RAW ответ с обработанными данными
  statusService.setAiRawResponse(productText, generatedText, result);
  
  // Показываем что данные готовы к записи
  statusService.setCurrentItem(
    productText.split(' ')[0],
    `✅ Данные обработаны и готовы!`,
    `ChatGPT ${model} успешно проанализировал: ${Object.keys(result).length} полей`
  );
  
  // Финализируем диалог с результатом
  statusService.setAiDialog(true, `✅ Завершена обработка через ChatGPT ${model}`, '', generatedText, result, true);
  
  // Дополнительная пауза чтобы пользователь увидел результат перед записью в таблицу
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return result;
}

async function saveVedProductData(productData: Partial<VedProductData>, index: number) {
  try {
    // Сначала сохраняем в локальный файл как резерв
    const dataFile = path.join(process.cwd(), 'processed-ved-products.json');
    let existingData: Partial<VedProductData>[] = [];
    
    if (fs.existsSync(dataFile)) {
      try {
        existingData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      } catch (error) {
        console.error('[SAVE VED] Error reading existing data, starting fresh:', error);
        existingData = [];
      }
    }
    
    // Ищем существующий товар по запросу и обновляем его, или добавляем новый
    const existingIndex = existingData.findIndex((item: Partial<VedProductData>) => 
      item["Запрос"] === productData["Запрос"]
    );
    
    if (existingIndex >= 0) {
      // Обновляем существующий товар, сохраняя заполненные поля
      existingData[existingIndex] = { ...existingData[existingIndex], ...productData };
      console.log(`[SAVE VED] Updated existing product: ${productData["Запрос"]}`);
    } else {
      // Добавляем новый товар
      existingData.push(productData);
      console.log(`[SAVE VED] Added new product: ${productData["Запрос"]}`);
    }
    
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));
    console.log(`[SAVE VED] Saved ВЭД data for product: ${productData["Запрос"]}`);
    
    console.log('[SAVE VED] Successfully saved product to local file');
    
  } catch (error) {
    console.error('[SAVE VED] Error saving ВЭД product data:', error);
  }
}

// Оставляем старую функцию для совместимости
async function saveProductData(productData: any, index: number) {
  try {
    const dataFile = path.join(process.cwd(), 'processed-products.json');
    let existingData = [];
    
    if (fs.existsSync(dataFile)) {
      try {
        existingData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      } catch (error) {
        console.error('[SAVE] Error reading existing data, starting fresh:', error);
        existingData = [];
      }
    }
    
    // Устанавливаем порядковый номер
    productData['A'] = (existingData.length + 1).toString();
    
    // Ищем существующий товар и обновляем его, или добавляем новый
    const existingIndex = existingData.findIndex((item: any) => item['B'] === productData['B']);
    
    if (existingIndex >= 0) {
      // Обновляем существующий товар, сохраняя заполненные поля
      existingData[existingIndex] = { ...existingData[existingIndex], ...productData };
    } else {
      // Добавляем новый товар
      existingData.push(productData);
    }
    
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));
    console.log(`[SAVE] Updated data for product: ${productData['B']}`);
    
  } catch (error) {
    console.error('[SAVE] Error saving product data:', error);
  }
}
