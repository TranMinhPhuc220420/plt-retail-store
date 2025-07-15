import { BadRequestException, Body, Controller, Get, Inject, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Express } from 'express';

// Services
import { StoresService } from '@/modules/stores/stores.service';
import { StoreFileInterceptor } from '@/modules/upload/upload.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateStoreCode, validateStoreData, validateStoreDelete, validateStoreUpdateData } from '@/utils/validate';
// Interfaces
import { Store, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST, STORE_URL_TEMP } from '@/config';

@Controller('stores')
export class StoresController {
  constructor(
    private readonly stores_service: StoresService,
  ) {}
  
  //////////////////////////////////////////////////
  /** Controller methods for store administration */
  //////////////////////////////////////////////////

  /**
   * Retrieves all stores associated with the authenticated user.
   * 
   * This handler checks if the requesting user is an administrator by verifying their user ID
   * against the `ADMINISTRATOR_LIST`. If the user is not authorized, a `BadRequestException`
   * is thrown. Otherwise, it returns the list of stores managed by the user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @throws BadRequestException if the user is not authorized.
   * @returns A promise resolving to the list of stores for the authorized user.
   */
  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllStores(@Req() req,) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.stores_service.getMyStores(user);
  }

  /**
   * Retrieves a specific store by ID for administrators.
   * 
   * Only users whose ID is in `ADMINISTRATOR_LIST` can access this endpoint.
   * Throws an exception if the user is not authorized or the store does not exist.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param id - The ID of the store to retrieve.
   * @throws BadRequestException if the user is not authorized or store not found.
   * @returns The store object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('detail/:id')
  async getStoreById(@Req() req, id: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    const store = await this.stores_service.getStoreById(id);
    if (!store) {
      throw new BadRequestException('store_not_found');
    }

    return store;
  }

  /**
   * Deletes a store by ID for administrators.
   * 
   * Only users whose ID is in `ADMINISTRATOR_LIST` can perform this action.
   * Throws an exception if the user is not authorized.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeId - The ID of the store to delete.
   * @throws BadRequestException if the user is not authorized.
   * @returns The result of the delete operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete/:id')
  async deleteStore(@Req() req, @Body('id') storeId: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    // Fetch the store to ensure it exists
    const store = await this.stores_service.getStoreById(storeId);
    if (!store) {
      throw new BadRequestException('store_not_found');
    }

    // Delete the store
    return this.stores_service.deleteMyStore(user, storeId);
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific store management */
  ////////////////////////////////////////////////////////////

  /**
   * Retrieves all stores owned by the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @returns A promise resolving to the list of stores owned by the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-stores')
  async getMyStores(@Req() req) {
    const user = req.user as User;
    return this.stores_service.getMyStores(user, true);
  }

  /**
   * Creates a new store for the authenticated user.
   * 
   * Accepts store data and an optional image file. Validates the input and associates the new store with the user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeData - The data for the new store.
   * @param file - Optional uploaded image file.
   * @returns The created store object.
   */
  @UseGuards(AuthMiddleware)
  @UseInterceptors(StoreFileInterceptor)
  @Post('my-store')
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

    if (storeData.storeCode) {
      // Ensure storeCode is in lowercase and trimmed
      storeData.storeCode = storeData.storeCode.toLowerCase().trim();
    }

    // Validate store data
    validateStoreData(storeData, user);

    // Check if the store code is valid
    let paramsSearch = {
      storeCode: storeData.storeCode,
      phone: storeData.phone,
      email: storeData.email,
    }
    const storesExist = await this.stores_service.searchStores(paramsSearch);
    if (storesExist.length > 0) {
      let store = storesExist[0];
      if (store.storeCode === storeData.storeCode) {
        throw new BadRequestException('store_code_already_exists');
      } else if (store.phone === storeData.phone) {
        throw new BadRequestException('store_phone_already_exists');
      } else if (store.email === storeData.email) {
        throw new BadRequestException('store_email_already_exists');
      }
      throw new BadRequestException('store_already_exists');
    }

    // Create store
    return this.stores_service.createMyStore(user, {
      ...storeData,
      ownerId: user.id, // Ensure the ownerId is set to the current user's ID
    });
  }

  /**
   * Retrieves a specific store owned by the authenticated user by store ID.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeId - The ID of the store to retrieve.
   * @returns The store object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-store/:id')
  async getMyStoreById(@Req() req) {
    const user = req.user as User;
    const storeId = req.query.id;

    // Fetch the store by ID for the authenticated user
    return this.stores_service.getMyStoreById(user, storeId);
  }

  @UseGuards(AuthMiddleware)
  @Get('my-store-by-code')
  async getMyStoreByCode(@Req() req) {
    const user = req.user as User;
    const storeCode = req.query.storeCode;

    if (!user || !user.id) {
      throw new BadRequestException('user_not_authenticated');
    }
    console.log(storeCode);
    
    if (!storeCode) {
      throw new BadRequestException('store_code_required');
    }

    // Fetch the store by ID for the authenticated user
    return this.stores_service.getMyStoreByStoreCode(user, storeCode);
  }

  @UseGuards(AuthMiddleware)
  @Post('validate-store-code')
  async validateStoreCode(@Req() req, @Body('storeCode') storeCode: string) {
    const user = req.user as User;

    // Validate the store code format
    validateStoreCode(storeCode);

    // Validate the store code
    const store = await this.stores_service.getMyStoreByStoreCode(user, storeCode);
    return { valid: !!store, store };
  }

  /**
   * Handles updating a store's information for the authenticated user.
   *
   * - Receives updated store data and an optional image file from the client.
   * - If a new image file is provided, updates the `imageUrl` field in `storeData`.
   * - Validates the update data based on the user's permissions.
   * - Checks if the store exists for the current user and the given store ID.
   * - If valid, updates the store information with the new data and ensures the `ownerId` is set to the current user.
   *
   * @param req - The request object containing user and params information.
   * @param storeData - The updated store data.
   * @param file - The new store image file, if provided.
   * @returns The updated store information.
   * @throws BadRequestException if the store is not found.
   */
  @UseGuards(AuthMiddleware)
  @UseInterceptors(StoreFileInterceptor)
  @Post('update-my-store/:id')
  async updateStore(
    @Req() req,
    @Body() storeData: Store,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const user: User = req.user;
    const storeId = req.params.id;

    // If a file is uploaded, set the imageUrl in storeData
    if (file) {
      storeData.imageUrl = STORE_URL_TEMP.replace('{filename}', file.filename);
    }

    // Validate store data
    validateStoreUpdateData(storeData, user);

    // Fetch the existing store
    const storeEditing = await this.stores_service.getMyStoreById(user, storeId);
    if (!storeEditing) {
      throw new BadRequestException('store_not_found');
    }

    // Check if the store code is valid
    let paramsSearch = {
      storeCode: storeData.storeCode,
      phone: storeData.phone,
      email: storeData.email,
    }
    const storesExist = await this.stores_service.searchStores(paramsSearch);
    if (storesExist.length > 0 && storesExist[0].id !== storeId) {
      let store = storesExist[0];
      if (store.storeCode === storeData.storeCode) {
        throw new BadRequestException('store_code_already_exists');
      } else if (store.phone === storeData.phone) {
        throw new BadRequestException('store_phone_already_exists');
      } else if (store.email === storeData.email) {
        throw new BadRequestException('store_email_already_exists');
      }
      throw new BadRequestException('store_already_exists');
    }

    // Update the store
    return this.stores_service.updateMyStore(user, storeId, {
      ...storeData,
      ownerId: user.id, // Ensure the ownerId is set to the current user's ID
    });
  }

  /**
   * Handles the deletion of a store owned by the authenticated user.
   * 
   * This endpoint validates the user's permission and the existence of the store before proceeding with deletion.
   * Throws a BadRequestException if the store does not exist.
   * 
   * @param req - The request object containing the authenticated user.
   * @param storeId - The ID of the store to be deleted, provided in the request body.
   * @returns The result of the store deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete-my-store/:id')
  async deleteMyStore(@Req() req, @Body('id') storeId: string) {
    const user = req.user as User;

    // Validate store data
    validateStoreDelete(storeId, user);
    
    // Fetch the store to ensure it exists
    const store = await this.stores_service.getMyStoreById(user, storeId);
    if (!store) {
      throw new BadRequestException('store_not_found');
    }

    // Delete the store
    return this.stores_service.deleteMyStore(user, storeId);
  }
}
