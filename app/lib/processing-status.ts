
interface ProcessingRequest {
  name: string;
  article: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

class ProcessingStatusService {
  private static instance: ProcessingStatusService;
  private currentProcessing: {
    requests: ProcessingRequest[];
    progress: number;
    completed: boolean;
  } = {
    requests: [],
    progress: 0,
    completed: true
  };

  static getInstance(): ProcessingStatusService {
    if (!ProcessingStatusService.instance) {
      ProcessingStatusService.instance = new ProcessingStatusService();
    }
    return ProcessingStatusService.instance;
  }

  setProcessing(requests: ProcessingRequest[]) {
    this.currentProcessing = {
      requests: requests.map(req => ({ ...req, status: 'pending' as const })),
      progress: 0,
      completed: false
    };
  }

  updateRequestStatus(index: number, status: ProcessingRequest['status']) {
    if (this.currentProcessing.requests[index]) {
      this.currentProcessing.requests[index].status = status;
    }
  }

  updateProgress(progress: number) {
    this.currentProcessing.progress = progress;
  }

  setCompleted(completed: boolean) {
    this.currentProcessing.completed = completed;
  }

  getStatus() {
    return { ...this.currentProcessing };
  }
}

export default ProcessingStatusService;
