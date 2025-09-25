
import { NextResponse } from 'next/server';

// Простое глобальное хранилище статуса (то же самое, что в process/route.ts)
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
  };
  private geminiActivity?: {
    isActive: boolean;
    stream: string;
    currentTask: string;
  };
  private requests: Array<{
    name: string;
    article: string;
    status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped';
    error?: string;
    statusText?: string;
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
      geminiActivity: this.geminiActivity
    };
  }

  stopProcessing() {
    console.log('[STOP API] Processing stopped by user');
    this.isProcessing = false;
    this.completed = true;
    this.stopped = true;
    this.currentItem = undefined;
    this.geminiActivity = undefined;
    
    // Обновляем статусы всех незавершенных запросов
    this.requests = this.requests.map(req => {
      if (req.status === 'pending' || req.status === 'processing') {
        return {
          ...req,
          status: 'stopped' as const,
          statusText: '🟠 Остановлено пользователем'
        };
      }
      return req;
    });
    
    this.updateProgress();
  }

  updateProgress() {
    this.progress = this.totalRequests > 0 ? (this.completedRequests / this.totalRequests) * 100 : 0;
  }

  isStopped() {
    return this.stopped;
  }
}

export async function POST() {
  try {
    const statusService = ProcessingStatusService.getInstance();
    
    if (!statusService.getStatus().isProcessing) {
      return NextResponse.json({
        success: false,
        message: 'No processing in progress to stop'
      });
    }
    
    statusService.stopProcessing();
    
    return NextResponse.json({
      success: true,
      message: 'Processing stopped successfully'
    });
    
  } catch (error) {
    console.error('[STOP API] Error stopping processing:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to stop processing' },
      { status: 500 }
    );
  }
}
