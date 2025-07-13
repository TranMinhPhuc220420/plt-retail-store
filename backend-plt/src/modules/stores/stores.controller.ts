import { Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Express } from 'express';

// Services
import { StoresService } from '@/modules/stores/stores.service';
import { StoreFileInterceptor } from '@/modules/upload/upload.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateStoreData } from '@/utils/validate';
// Interfaces
import { Store, User } from '@/interfaces';
// Constants
import { STORE_URL_TEMP } from '@/config';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores_service: StoresService) {}

  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllStores() {
    return this.stores_service.getAllStores();
  }

  @UseGuards(AuthMiddleware)
  @Get(':id')
  async getStoreById(id: string) {
    return this.stores_service.getStoreById(id);
  }

  @UseGuards(AuthMiddleware)
  @UseInterceptors(StoreFileInterceptor)
  @Post('create')
  async createStore(
    @Req() req: any,
    @Body() storeData: Store,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const user: User = req.user;

    // If a file is uploaded, set the imageUrl in storeData
    if (file) {
      storeData.imageUrl = STORE_URL_TEMP.replace('{filename}', file.filename);
    }

    // Validate store data
    validateStoreData(storeData, user);

    // Create store
    return this.stores_service.createStore({
      ...storeData,
      ownerId: user.id, // Ensure the ownerId is set to the current user's ID
    });
  }
}
