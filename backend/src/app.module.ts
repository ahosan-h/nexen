import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScanModule } from './scan/scan.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrderModule } from './order/order.module';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsModule } from './analytics/analytics.module';
import { ExpanddmgModule } from './expanddmg/expanddmg.module';

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

    InventoryModule,

    OrderModule,

    AnalyticsModule,

    ExpanddmgModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [AppService],
})
export class AppModule {}
