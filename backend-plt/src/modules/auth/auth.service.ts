import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/database/prisma.service';

import { User } from '@/interfaces'; // Assuming you have a User interface defined
import { USER_DEV } from '@/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
  
    const { ...result } = user;
    return result;
    
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
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        avatar: data.avatar as string,
        username: data.username,
        fullname: data.fullname,
      },
    });
    const { ...result } = user;
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

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {

    console.log(`AuthMiddleware: ${req.method} ${req.url}`);
    // Check if NODE_ENV is set to 'production'
    // if (process.env.NODE_ENV === 'development') {
    //   req['user'] = USER_DEV; // Use the development user
    //   return next();
    // }

    let userToken = '';
    const authHeader = req.headers['authorization'];
    const accessTokenCookie = req.cookies['access_token'];

    if (authHeader) {
      userToken = authHeader.split(' ')[1]; // Bearer token
    } else if (accessTokenCookie) {
      userToken = accessTokenCookie;
    }

    if (!userToken) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decoded = jwt.verify(userToken, process.env.JWT_SECRET || '');
      const { sub, username, email } = decoded as { sub: string; username: string; email: string };

      if (!sub || !username || !email) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Attach user information to the request object
      const userEntry = await this.prisma.user.findUnique({
        where: { id: sub },
      });

      if (!userEntry) {
        throw new UnauthorizedException('User not found');
      }

      req['user'] = userEntry;
      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
