import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, opcionesBase } from '@sahs/comun';
import { ENTIDADES_HORARIOS } from '@sahs/entidades';
import { CONTROLLERS, SERVICES } from './rutas';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBase(ENTIDADES_HORARIOS)),
    TypeOrmModule.forFeature(ENTIDADES_HORARIOS),
  ],
  controllers: [HealthController, ...CONTROLLERS],
  providers: [...SERVICES],
})
export class AppModule {}
