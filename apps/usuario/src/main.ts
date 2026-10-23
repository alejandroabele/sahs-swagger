import 'reflect-metadata';
import { arrancarServicio } from '@sahs/comun';
import { AppModule } from './app.module';
import { INFO_SWAGGER } from './swagger';

arrancarServicio("usuario", AppModule, INFO_SWAGGER);
