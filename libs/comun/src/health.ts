import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiResponse, ApiSchema, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import type * as C from '@sahs/contratos';
import { noDisponible } from './errores';

@ApiSchema({ name: 'Health' })
export class Health implements C.Health {
  @ApiProperty({ type: 'string', example: 'UP', required: true })
  status!: string;
}

@ApiTags('Health')
@Controller('actuator')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get('health')
  @ApiOperation({ operationId: 'health', summary: 'Estado del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio activo', type: Health })
  async health(): Promise<Health> {
    try {
      await this.ds.query('SELECT 1');
    } catch {
      throw noDisponible('La base de datos no está disponible');
    }
    return { status: 'UP' };
  }
}
