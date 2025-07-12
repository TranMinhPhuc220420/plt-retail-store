import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/database/prisma.service';
import * as bcrypt from 'bcryptjs';
import { get } from 'http';

import { User } from '@/interfaces'; // Assuming you have a User interface defined

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async getUserByUsername(username: string) {
    return await this.prisma.user.findUnique({ where: { username } });
  }

  async getUserByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string) {
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail },
          { email: usernameOrEmail },
        ],
      },
    });
  }

  async register(data: User) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        avatar: data.avatar,
        username: data.username,
        password: hashedPassword,
        fullname: data.fullname,
      },
    });
    const { password, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, username: user.username, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
      user_info: user,
    };
  }
}
