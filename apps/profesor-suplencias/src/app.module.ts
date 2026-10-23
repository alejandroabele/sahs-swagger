import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, opcionesBase } from '@sahs/comun';
import { ENTIDADES_PROFESOR_SUPLENCIAS } from '@sahs/entidades';
import { Armado } from './armado';
import { CONTROLLERS, SERVICES } from './rutas';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBase(ENTIDADES_PROFESOR_SUPLENCIAS)),
    TypeOrmModule.forFeature(ENTIDADES_PROFESOR_SUPLENCIAS),
  ],
  controllers: [HealthController, ...CONTROLLERS],
  providers: [Armado, ...SERVICES],
})
export class AppModule {}
