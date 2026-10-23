import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, opcionesBase } from '@sahs/comun';
import { ENTIDADES_ORIENTACION } from '@sahs/entidades';
import { Armado } from './armado';
import { CONTROLLERS, SERVICES } from './rutas';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBase(ENTIDADES_ORIENTACION)),
    TypeOrmModule.forFeature(ENTIDADES_ORIENTACION),
  ],
  controllers: [HealthController, ...CONTROLLERS],
  providers: [Armado, ...SERVICES],
})
export class AppModule {}
