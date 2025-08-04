import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: '🎉 Welcome to Hana API! Have a nice day! 🌸',
      author: 'Hana Team',
      timestamp: new Date().toISOString(),
    }
  }
}
