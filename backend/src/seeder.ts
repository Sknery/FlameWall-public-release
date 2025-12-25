



import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder/seeder.module';
import { SeederService } from './seeder/seeder.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(SeederModule);
  const logger = new Logger('Seeder');

  try {
    const seeder = appContext.get(SeederService);
    await seeder.seed();
    logger.log('Seeding complete!');
  } catch (error) {
    logger.error('Seeding failed!');
    throw error;
  } finally {
    await appContext.close();
  }
}

bootstrap().catch(err => {
  console.error("Error during seeding process:", err);
  process.exit(1);
});