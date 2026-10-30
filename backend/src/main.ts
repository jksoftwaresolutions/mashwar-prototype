import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { loadConfig } from './platform/config'

async function bootstrap() {
  const config = loadConfig() // fail fast before opening any connection
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  await app.listen(config.port)
}

void bootstrap()
