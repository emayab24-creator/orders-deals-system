
interface GeminiResponse {
  'ТН ВЭД': string;
  'НДС': string;
  'Пошлина': string;
  'Группа': string;
  'Описание (сфера применения, назначение, принцип работы)': string;
  'Электрические параметры (A V W)': string;
  'Максимальное давление': string;
  'Рабочая среда': string;
  'Номинальный диаметр': string;
  'Материал': string;
  'Фото': string;
  'Марка': string;
  'Страна происхождения': string;
  'Сертификация': string;
  'Стоимость сертификации': string;
  'Название компании': string;
  'ИНН': string;
  'Сайт': string;
  'Вес, кг': string;
  'Объем': string;
}

class GeminiService {
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
  }

  async generateProductInfo(prompt: string): Promise<GeminiResponse> {
    try {
      const requiredKeys = [
        'ТН ВЭД', 'НДС', 'Пошлина', 'Группа',
        'Описание (сфера применения, назначение, принцип работы)',
        'Электрические параметры (A V W)', 'Максимальное давление',
        'Рабочая среда', 'Номинальный диаметр', 'Материал', 'Фото',
        'Марка', 'Страна происхождения', 'Сертификация',
        'Стоимость сертификации', 'Название компании', 'ИНН', 'Сайт',
        'Вес, кг', 'Объем'
      ].join('", "');

      const masterPromptText = `
        Твоя главная задача — с максимальной точностью и полнотой заполнить карточку ВЭД для указанного товара.
        **ЗОЛОТЫЕ ПРАВИЛА (обязательны к исполнению):**
        1.  **ПОЛНОТА ДАННЫХ:** Все поля в итоговом JSON **должны быть заполнены**. Единственное исключение — технические характеристики, 'Вес, кг' и 'Объем', где можно поставить прочерк '-', если данных объективно нет. Поля, связанные с ВЭД и сертификацией, **не могут быть пустыми**.
        2.  **ДОСТОВЕРНОСТЬ ПОШЛИНЫ:** Для поля 'Пошлина' ты **обязан** найти и указать точную ставку из официальных источников таможенных органов РФ/ЕАЭС.
        
        **Шаг 1: Идентификация товара и производителя.**
        - Идентифицируй **истинный товар по артикулу**.
        - Извлеки из запроса **бренд** и запиши его в поле 'Марка'.
        - Для поля 'Название компании' найди официальное **юридическое наименование** компании-производителя.
        
        **Шаг 2: Сбор информации (согласно Золотым правилам).**
        - **Вес, кг и Объем**: Найди точные или ориентировочные значения для полей 'Вес, кг' и 'Объем'. Если данных нет, поставь прочерк '-'.
        - **Для поля 'Фото'**: Найди ссылку на **веб-страницу с описанием этого товара** на официальном сайте производителя или крупного дистрибьютора.
        - **ВЭД**: Найди код ТН ВЭД, ставки пошлины и НДС.
        - **Сертификация и Компания-исполнитель**: Найди, какие документы нужны для ввоза в РФ. Затем найди **реальную российскую компанию-сертификатор** с её данными (Название компании, ИНН, Сайт) и примерной стоимостью услуг.
        
        **Шаг 3: Формат вывода.**
        ВЕСЬ РЕЗУЛЬТАТ верни СТРОГО в виде ОДНОГО валидного JSON объекта.
        JSON должен содержать только эти ключи: "${requiredKeys}".
        
        **Исходный запрос от пользователя**: "${prompt}"
      `;

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: masterPromptText
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Извлекаем JSON из ответа
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const result = JSON.parse(jsonMatch[0]);
      return result as GeminiResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw error;
    }
  }

  async processMultipleRequests(requests: { name: string; article: string }[]): Promise<GeminiResponse[]> {
    const results: GeminiResponse[] = [];
    
    for (const request of requests) {
      try {
        const prompt = `${request.name} ${request.article}`;
        const result = await this.generateProductInfo(prompt);
        results.push(result);
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing request for ${request.name}:`, error);
        // Добавляем пустой результат в случае ошибки
        results.push({} as GeminiResponse);
      }
    }
    
    return results;
  }
}

export default GeminiService;
