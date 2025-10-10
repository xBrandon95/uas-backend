import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { SemillerasModule } from './modules/semilleras/semilleras.module';
import { CooperadoresModule } from './modules/cooperadores/cooperadores.module';
import { ConductoresModule } from './modules/conductores/conductores.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { SemillasModule } from './modules/semillas/semillas.module';
import { VariedadesModule } from './modules/variedades/variedades.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { OrdenesIngresoModule } from './modules/ordenes-ingreso/ordenes-ingreso.module';
import { LotesProduccionModule } from './modules/lotes-produccion/lotes-produccion.module';
import { OrdenesSalidaModule } from './modules/ordenes-salidas/ordenes-salida.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        timezone: 'Z',
        charset: 'utf8mb4',
      }),
    }),

    // Módulos
    AuthModule,
    UsuariosModule,
    UnidadesModule,
    SemillerasModule,
    CooperadoresModule,
    ConductoresModule,
    VehiculosModule,
    SemillasModule,
    VariedadesModule,
    CategoriasModule,
    ClientesModule,
    OrdenesIngresoModule,
    LotesProduccionModule,
    OrdenesSalidaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
