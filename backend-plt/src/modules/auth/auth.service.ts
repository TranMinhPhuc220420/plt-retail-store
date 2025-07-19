import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Cache
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import * as jwt from 'jsonwebtoken';

import { JwtService } from '@nestjs/jwt';

// Entities
import { User } from '@/entities/User';

// Utils
import { generateCacheKey } from '@/utils';
// Interfaces
import { User as UserInterface } from '@/interfaces'; // Assuming you have a User interface defined
// Constants
import { USER_DEV } from '@/config';
import { TIMEOUT_CACHE } from '@/config/cache.config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({ where: { username } });
  
    const { ...result } = user;
    return result;
    
    return null;
  }

  async getUserByUsername(username: string) {
    return await this.userRepository.findOne({ where: { username } });
  }

  async getUserByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string) {
    return await this.userRepository.findOne({
      where: [
        { username: usernameOrEmail },
        { email: usernameOrEmail },
      ],
    });
  }

  async register(data: UserInterface) {
    const user = this.userRepository.create({
      email: data.email,
      avatar: data.avatar as string,
      username: data.username,
      fullname: data.fullname,
      role: data.role as User['role'], // Ensure correct type
      isActive: data.isActive,
    });
    
    const savedUser = await this.userRepository.save(user);
    const { ...result } = savedUser;
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {

    // console.log(`AuthMiddleware: ${req.method} ${req.url}`);
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

      const cacheKey = generateCacheKey('user', sub);
      const cachedUser = await this.cacheManager.get(cacheKey);
      if (cachedUser) {
        console.log(`Cache hit for user ${cacheKey}`);
        req['user'] = cachedUser;
        return next();
      }

      // Attach user information to the request object
      const userEntry = await this.userRepository.findOne({
        where: { id: sub },
      });

      if (!userEntry) {
        throw new UnauthorizedException('User not found');
      }

      req['user'] = userEntry;

      // Store user in cache for 1 hour
      await this.cacheManager.set(cacheKey, userEntry, TIMEOUT_CACHE); // 1 hour
      console.log(`User ${sub} cached with key ${cacheKey}`);

      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
