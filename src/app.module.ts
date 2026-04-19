import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocationModule } from './location/location.module';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './common/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    LocationModule
  ],
  controllers: [AppController],
  providers: [AppService,JwtStrategy],
})
export class AppModule { }
