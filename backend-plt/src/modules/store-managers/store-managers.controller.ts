import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards, Param } from '@nestjs/common';

// Services
import { StoreManagersService } from '@/modules/store-managers/store-managers.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateStoreManagerData, validateStoreManagerDelete, validateStoreManagerUpdateData } from '@/utils/validate';
// Interfaces
import { StoreManager, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST } from '@/config';

@Controller('store-managers')
export class StoreManagersController {
  constructor(private readonly store_managers_service: StoreManagersService) {}
  
  //////////////////////////////////////////////////
  /** Controller methods for store manager administration */
  //////////////////////////////////////////////////

  /**
   * Retrieves all store managers for administrators.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @throws BadRequestException if the user is not authorized.
   * @returns A promise resolving to the list of all store managers.
   */
  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllStoreManagers(@Req() req) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.store_managers_service.getAllStoreManagers();
  }

  /**
   * Retrieves a specific store manager by ID for administrators.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param id - The ID of the store manager to retrieve.
   * @throws BadRequestException if the user is not authorized or store manager not found.
   * @returns The store manager object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('detail/:id')
  async getStoreManagerById(@Req() req, @Param('id') id: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    const storeManager = await this.store_managers_service.getStoreManagerById(id);
    if (!storeManager) {
      throw new BadRequestException('store_manager_not_found');
    }

    return storeManager;
  }

  /**
   * Deletes a store manager by ID for administrators.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeManagerId - The ID of the store manager to delete.
   * @throws BadRequestException if the user is not authorized.
   * @returns The result of the delete operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete/:id')
  async deleteStoreManager(@Req() req, @Body('id') storeManagerId: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.store_managers_service.deleteStoreManager(storeManagerId);
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific store manager management */
  ////////////////////////////////////////////////////////////

  /**
   * Retrieves all store managers associated with the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @returns A promise resolving to the list of store managers associated with the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-store-managers')
  async getMyStoreManagers(@Req() req) {
    const user = req.user as User;
    return this.store_managers_service.getMyStoreManagers(user);
  }

  /**
   * Creates a new store manager record for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeManagerData - The data for the new store manager.
   * @returns The created store manager object.
   */
  @UseGuards(AuthMiddleware)
  @Post('my-store-manager')
  async createStoreManager(
    @Req() req: any,
    @Body() storeManagerData: StoreManager
  ) {
    const user: User = req.user;

    // Validate store manager data
    validateStoreManagerData(storeManagerData, user);

    // Create store manager
    return this.store_managers_service.createStoreManager({
      ...storeManagerData,
      userId: user.id, // Ensure the userId is set to the current user's ID
    });
  }

  /**
   * Retrieves a specific store manager associated with the authenticated user by ID.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeManagerId - The ID of the store manager to retrieve.
   * @returns The store manager object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-store-manager/:id')
  async getMyStoreManagerById(@Req() req, @Param('id') storeManagerId: string) {
    const user = req.user as User;

    // Fetch the store manager by ID for the authenticated user
    return this.store_managers_service.getMyStoreManagerById(user, storeManagerId);
  }

  /**
   * Handles updating a store manager's information for the authenticated user.
   *
   * @param req - The request object containing user and params information.
   * @param storeManagerData - The updated store manager data.
   * @returns The updated store manager information.
   * @throws BadRequestException if the store manager is not found.
   */
  @UseGuards(AuthMiddleware)
  @Post('update-my-store-manager/:id')
  async updateStoreManager(
    @Req() req,
    @Body() storeManagerData: StoreManager
  ) {
    const user: User = req.user;
    const storeManagerId = req.params.id;

    // Validate store manager data
    validateStoreManagerUpdateData(storeManagerData, user);

    // Fetch the existing store manager
    const existingStoreManager = await this.store_managers_service.getMyStoreManagerById(user, storeManagerId);
    if (!existingStoreManager) {
      throw new BadRequestException('store_manager_not_found');
    }

    // Update the store manager
    return this.store_managers_service.updateStoreManager(storeManagerId, {
      ...storeManagerData,
      userId: user.id, // Ensure the userId is set to the current user's ID
    });
  }

  /**
   * Handles the deletion of a store manager associated with the authenticated user.
   * 
   * @param req - The request object containing the authenticated user.
   * @param storeManagerId - The ID of the store manager to be deleted.
   * @returns The result of the store manager deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete-my-store-manager/:id')
  async deleteMyStoreManager(@Req() req, @Body('id') storeManagerId: string) {
    const user = req.user as User;

    // Validate store manager data
    validateStoreManagerDelete(storeManagerId, user);
    
    // Fetch the store manager to ensure it exists
    const storeManager = await this.store_managers_service.getMyStoreManagerById(user, storeManagerId);
    if (!storeManager) {
      throw new BadRequestException('store_manager_not_found');
    }

    // Delete the store manager
    return this.store_managers_service.deleteStoreManager(storeManagerId);
  }

  /**
   * Retrieves store managers by store ID for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeId - The ID of the store to get store managers for.
   * @returns A promise resolving to the list of store managers in the specified store.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-store-managers/store/:storeId')
  async getMyStoreManagersByStore(@Req() req, @Param('storeId') storeId: string) {
    const user = req.user as User;
    return this.store_managers_service.getMyStoreManagersByStore(user, storeId);
  }

  /**
   * Retrieves store managers by store ID (public endpoint).
   * 
   * @param storeId - The ID of the store to get store managers for.
   * @returns A promise resolving to the list of store managers in the specified store.
   */
  @Get('store/:storeId')
  async getStoreManagersByStore(@Param('storeId') storeId: string) {
    return this.store_managers_service.getStoreManagersByStore(storeId);
  }
}
