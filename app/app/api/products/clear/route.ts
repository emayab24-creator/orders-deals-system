
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log('[API] Clearing processed products...');
    
    // Очищаем основной файл с ВЭД данными
    const vedDataFile = path.join(process.cwd(), 'processed-ved-products.json');
    
    // Очищаем старый файл если он есть
    const oldDataFile = path.join(process.cwd(), 'processed-products.json');
    
    if (fs.existsSync(vedDataFile)) {
      fs.unlinkSync(vedDataFile);
      console.log('[API] ВЭД products file cleared');
    }
    
    if (fs.existsSync(oldDataFile)) {
      fs.unlinkSync(oldDataFile);
      console.log('[API] Old products file cleared');
    }
    
    return NextResponse.json({ 
      message: 'Products data cleared successfully',
      success: true 
    });
  } catch (error) {
    console.error('[API] Error clearing products data:', error);
    return NextResponse.json(
      { error: 'Failed to clear products data' },
      { status: 500 }
    );
  }
}
