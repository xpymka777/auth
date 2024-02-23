import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { HttpException } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async userRegistration(userDto: {
    firstName: string;
    lastName: string;
    login: string;
    password: string;
  }): Promise<UserEntity> {
    //проверка на наличие пользователя с таким логином
    const findUser = await this.userRepository.findOne({
      where: { login: userDto.login },
    });

    //валидация фамилия(только кириллица и - для двойных фамилий)
    const firstNameCyrillic = /[а-яё]+([-—][а-яё]+)?/i.test(userDto.firstName);
    //от 8 до 16 символов
    const firstNameLength = /^.{8,16}$/.test(userDto.firstName);

    //валидация имени(только кириллица)
    const lastNameCyrillic = /[а-яё]/i.test(userDto.lastName);
    //от 8 до 16 символов
    const lastNameLength = /^.{8,16}$/.test(userDto.lastName);

    //логин - только латиница
    const loginCheck = /[a-z]/i.test(userDto.login);
    //от 8 до 16 символов
    const loginLength = /^.{8,16}$/.test(userDto.login);

    //придумай валидацию пароля
    //минимум латинские буквы(верхний и нижний), цифры и спец символы(@$!%*?&)
    const passCheck = /^[a-zA-Z\d@$!%*?&]+$/.test(userDto.password);
    //от 8 до 25 символов
    const passwordLength = /^.{8,25}$/.test(userDto.password);

    //проверка на занятость логина
    if (findUser) {
      throw new HttpException('Данный логин уже занят', 401);
    }

    //проверка фамилии на кириллицу
    if (!firstNameCyrillic) {
      throw new HttpException(
        'В поле фамилия допускается только кириллица.',
        401,
      );
    }
    //проверка на длину фамилии
    if (!firstNameLength) {
      throw new HttpException('От 8 до 16 символов.', 401);
    }

    //проверка имени на кириллицу
    if (!lastNameCyrillic) {
      throw new HttpException('В поле имя допускается только кириллица.', 401);
    }
    //проверка на длину имени
    if (!lastNameLength) {
      throw new HttpException('Длина имени от 8 до 16 символов.', 401);
    }

    //проверка логина на латиницу
    if (!loginCheck) {
      throw new HttpException('Логин может содержать только латиницу.', 401);
    }
    //проверка на длину имени
    if (!loginLength) {
      throw new HttpException('Длина логина от 8 до 16 символов.', 401);
    }

    //проверка логина на латиницу
    if (!passCheck) {
      throw new HttpException(
        'Пароль может содержать только латиницу, цифры и спецсимволы(@$!%*?&).',
        401,
      );
    }
    //проверка на длину пароля
    if (!passwordLength) {
      throw new HttpException('Длина пароля от 8 до 25 символов.', 401);
    }

    //потом хешировать пароль
    const hashPassword = await bcrypt.hash(userDto.password, 15);

    //в конце создаём пользователя, если всё прошло успешно
    const user = new UserEntity();
    //присвоим полям их полученные значения
    user.firstName = userDto.firstName;
    user.lastName = userDto.lastName;
    user.login = userDto.login;
    //сохраняем хеш пароля
    user.password = hashPassword;

    return await this.userRepository.save(user); //сохраним пользователя
  }
  async userLogin(loginDto: {
    login: string;
    password: string;
  }): Promise<UserEntity> {
    // проверка на наличие пользователя с таким логином
    const findUser = await this.userRepository.findOne({
      where: { login: loginDto.login },
    });
    // проверка логина на латиницу
    const userLoginCheck = /[a-z]/i.test(loginDto.login);
    // проверка логина на длину
    const userLoginLengthCheck = /^.{8,16}$/.test(loginDto.login);
    if (!userLoginCheck) {
      throw new HttpException('В поле логин допускается только латиница', 401);
    }
    if (!userLoginLengthCheck) {
      throw new HttpException('Длина логина от 8 до 16 символов', 401);
    }
    //проверка пароля на латиницу, цифры и спецсимволы
    const userPassCheck = /^[a-zA-Z\d@$!%*?&]+$/.test(loginDto.password);
    //проверка длины пароля
    const userPassLengthCheck = /^.{8,25}$/.test(loginDto.password);
    if (!userPassCheck) {
      throw new HttpException(
        'Пароль может содержать только латиницу, цифры и спецсимволы(@$!%*?&)',
        401,
      );
    }
    if (!userPassLengthCheck) {
      throw new HttpException('Длина пароля от 8 до 25 символов', 401);
    }
    if (findUser) {
      const comparePassword = await bcrypt.compare(
        loginDto.password,
        findUser.password,
      );
      if (comparePassword) {
        return findUser; // возвращаем найденного пользователя
      } else {
        //выдадим ошибку если один из параметров не проходит проверку
        throw new HttpException('Неверная пара логин|пароль', 401);
      }
    } else {
      //выдадим ошибку если один из параметров не проходит проверку
      throw new HttpException('Неверная пара логин|пароль', 401);
    }
  }
}
