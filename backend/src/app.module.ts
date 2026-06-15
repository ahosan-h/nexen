import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');

        if (!uri) {
          console.log('MONGODB_URI Messing');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),

    UserModule,

    ScanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
