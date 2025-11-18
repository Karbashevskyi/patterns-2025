import { ChatApplication } from './chat-application.js';

async function bootstrap() {
  try {
    const app = new ChatApplication();
    await app.initialize();
    
    window.app = app;
    
    console.log('Application started successfully');
  } catch (error) {
    console.error('Failed to start application:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
