import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { Request, Response } from 'express';
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('registration')
  async registration(
    @Body()
    userDto: {
      firstName: string;
      lastName: string;
      login: string;
      password: string;
    },
  ) {
    try {
      //вызовем функцию регистрации из сервиса
      const user = await this.userService.userRegistration(userDto);

      if (user) {
        //выведем сообщение об успешной регистрации
        return { message: 'Регистрация прошла успешно' };
      }
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }
  @Post('login')
  async login(
    @Body()
    loginDto: {
      login: string;
      password: string;
    },
    @Res({ passthrough: true })
    response: Response & {
      cookie: (name: string, value: string, options?: any) => void;
    },
  ) {
    try {
      const userLogin = await this.userService.userLogin(loginDto);
      if (userLogin) {
        const payload = { login: loginDto.login };
        response.cookie('access_token', this.jwtService.sign(payload), {
          httpOnly: true,
          maxAge: 3600000, // 1 час в миллисекундах
          path: '/', // Доступ к кукам по всем путям
        });
        return {
          access_token: this.jwtService.sign(payload),
        };
      } else {
        throw new HttpException('Ошибка входа. Неверные входные данные.', 401);
      }
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }
  @Get('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true })
    response: Response & {
      clearCookie: (name: string, options?: any) => void;
    },
  ) {
    if (request.cookies['access_token']) {
      // Очищаем куки
      response.clearCookie('access_token');
      // Возвращаем сообщение об успешном выходе из системы
      return { message: 'Выход из системы прошел успешно' };
    } else {
      return { message: 'Пользователь уже вышел из системы' };
    }
  }

  @Get('auth-check')
  async check(@Req() request: Request) {
    if (request.cookies['access_token']) {
      // Если куки 'access_token' присутствует, возвращаем данные
      return [123, 456, 789];
    } else {
      // Если куки 'access_token' отсутствует, возвращаем сообщение о необходимости входа в систему
      throw new UnauthorizedException('Пользователь не вошёл в систему');
    }
  }
}
