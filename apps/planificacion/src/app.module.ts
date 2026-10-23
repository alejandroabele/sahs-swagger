import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, opcionesBase } from '@sahs/comun';
import { ENTIDADES_PLANIFICACION } from '@sahs/entidades';
import { Armado } from './armado';
import { Reglas } from './reglas';
import { CONTROLLERS, SERVICES } from './rutas';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBase(ENTIDADES_PLANIFICACION)),
    TypeOrmModule.forFeature(ENTIDADES_PLANIFICACION),
  ],
  controllers: [HealthController, ...CONTROLLERS],
  providers: [Armado, Reglas, ...SERVICES],
})
export class AppModule {}
