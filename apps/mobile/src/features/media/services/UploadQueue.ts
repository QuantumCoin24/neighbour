export class UploadQueue {
  private readonly queue: (() => Promise<void>)[] = [];
  private running = 0;
  private readonly concurrency = 3;

  enqueue(job: () => Promise<void>): void {
    this.queue.push(job);
    void this.run();
  }

  private async run(): Promise<void> {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();

      if (!job) {
        return;
      }

      this.running++;

      try {
        await job();
      } finally {
        this.running--;
        void this.run();
      }
    }
  }
}

export const mediaUploadQueue = new UploadQueue();
