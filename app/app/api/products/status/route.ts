
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
}

export async function GET() {
  try {
    const statusService = ProcessingStatusService.getInstance();
    const status = statusService.getStatus();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('[STATUS API] Error fetching status:', error);
    return NextResponse.json(
      { 
        isProcessing: false,
        progress: 0,
        completed: true,
        requests: [],
        error: 'Failed to fetch status'
      },
      { status: 500 }
    );
  }
}
