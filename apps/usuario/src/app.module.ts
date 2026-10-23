import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController, opcionesBase } from '@sahs/comun';
import { ENTIDADES_USUARIO } from '@sahs/entidades';
import { CONTROLLERS, SERVICES } from './rutas';

@Module({
  imports: [
    TypeOrmModule.forRoot(opcionesBase(ENTIDADES_USUARIO)),
    TypeOrmModule.forFeature(ENTIDADES_USUARIO),
  ],
  controllers: [HealthController, ...CONTROLLERS],
  providers: [...SERVICES],
})
export class AppModule {}
