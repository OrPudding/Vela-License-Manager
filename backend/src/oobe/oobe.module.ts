import { Module } from '@nestjs/common';
import { OobeController } from './oobe.controller';
import { OobeService } from './oobe.service';
import { CryptoModule } from '../crypto/crypto.module';

@Module({
  imports: [CryptoModule],
  controllers: [OobeController],
  providers: [OobeService],
})
export class OobeModule {}
