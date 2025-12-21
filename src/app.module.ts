import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { PerformanceReviewsModule } from './performance-reviews/performance-reviews.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    PerformanceReviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
