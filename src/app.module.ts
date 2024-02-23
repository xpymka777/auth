import { Module } from '@nestjs/common';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user/user.entity';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'user',
      entities: [UserEntity],
      synchronize: true, // Синхронизация моделей с базой данных
    }),
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      // Конфигурация модуля JWT для аутентификации и авторизации
      secret: '123321', // Секретный ключ для подписи токенов
      signOptions: { expiresIn: '1h' }, // Время жизни токенов (1 час)
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}
