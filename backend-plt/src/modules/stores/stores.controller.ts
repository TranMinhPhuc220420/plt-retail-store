import { BadRequestException, Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Express } from 'express';

// Services
import { StoresService } from '@/modules/stores/stores.service';
import { StoreFileInterceptor } from '@/modules/upload/upload.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateStoreData, validateStoreDelete, validateStoreUpdateData } from '@/utils/validate';
// Interfaces
import { Store, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST, STORE_URL_TEMP } from '@/config';

@Controller('stores')
export class StoresController {
  constructor(private readonly stores_service: StoresService) {}
  
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
    // const store = await this.stores_service.getStoreById(storeId);
    // if (!store) {
    //   throw new BadRequestException('store_not_found');
    // }

    // Delete the store
    return this.stores_service.deleteStore(storeId);
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
    return this.stores_service.getMyStores(user);
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

    // Validate store data
    validateStoreData(storeData, user);

    // Create store
    return this.stores_service.createStore({
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
  async getMyStoreById(@Req() req, @Body('id') storeId: string) {
    const user = req.user as User;

    // Fetch the store by ID for the authenticated user
    return this.stores_service.getMyStoreById(user, storeId);
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
    const existingStore = await this.stores_service.getMyStoreById(user, storeId);
    if (!existingStore) {
      throw new BadRequestException('store_not_found');
    }

    // Update the store
    return this.stores_service.updateStore(storeId, {
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
    return this.stores_service.deleteStore(storeId);
  }
}
