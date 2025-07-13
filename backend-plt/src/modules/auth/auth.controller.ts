import { Controller, Post, Req, Res, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';

// Services
import { AuthService } from '@/modules/auth/auth.service';
// Guards
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
// Interfaces
import { User, UserFirebase } from '@/interfaces';
// Constants
import { AVATAR_DEFAULT, USER_ROLE } from '@/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('google-verify-token')
  async googleAuth(@Req() req, @Res() res: Response) {
    const userFirebase : UserFirebase = req.user;
    if (!userFirebase) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let userExist = await this.authService.getUserByUsername(userFirebase.email);

    if (!userExist) {
      // Register the user if they do not exist
      const user: User = {
        id: userFirebase.uid,
        email: userFirebase.email,
        username: userFirebase.email,
        avatar: userFirebase.picture || AVATAR_DEFAULT,
        fullname: userFirebase.name || '',

        role: USER_ROLE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await this.authService.register(user);
      } catch (error) {
      }

      // Fetch the newly created user
      userExist = await this.authService.getUserByUsername(userFirebase.email);
    }

    const userEntry = this.authService.login(userExist);

    // Save access token in session or cookie if needed
    res.cookie('access_token', (await userEntry).access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
    });

    return res.json({
      user_info: userExist,
    });
  }

  @Get('logout')
  async logout(@Res() res: Response) {
    // Clear the access token cookie
    res.clearCookie('access_token');

    // Optionally, you can also invalidate the session or perform other logout actions
    return res.json({ message: 'logged_out_success' });
  }
}
