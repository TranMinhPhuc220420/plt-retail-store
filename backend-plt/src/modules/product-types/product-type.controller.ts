import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

// Services
import { ProductTypeService } from './product-type.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateProductTypeData, validateProductTypeUpdateData, validateProductTypeDelete } from '@/utils/validate';
// Interfaces
import { ProductType, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST } from '@/config';

@Controller('product-types')
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  //////////////////////////////////////////////////
  /** Controller methods for admin product types */
  //////////////////////////////////////////////////

  /**
   * [ADMIN] Retrieve all product types.
   * Only accessible to users in ADMINISTRATOR_LIST.
   * @param req - The request object containing user info.
   *    - req.user: The authenticated user.
   * @throws BadRequestException if user is not authorized.
   * @returns Array of all product types.
   */
  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllProductTypes(@Req() req) {
    const user = req.user as User;

    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.productTypeService.getAllProductTypes();
  }

  /**
   * [ADMIN] Retrieve details of a specific product type by its ID.
   * Only accessible to users in ADMINISTRATOR_LIST.
   * @param req - The request object containing user info and route params.
   *    - req.user: The authenticated user.
   *    - req.params.id: The ID of the product type to retrieve.
   * @throws BadRequestException if user is not authorized or product type not found.
   * @returns The product type object.
   */
  @UseGuards(AuthMiddleware)
  @Get('detail/:id')
  async getProductTypeById(@Req() req) {
    const user = req.user as User;
    const id = req.params.id;

    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    const productType = await this.productTypeService.getProductTypeById(id);
    if (!productType) {
      throw new BadRequestException('product_type_not_found');
    }

    return productType;
  }

  /**
   * [ADMIN] Delete a product type by its ID.
   * Only accessible to users in ADMINISTRATOR_LIST.
   * @param req - The request object containing user info.
   *    - req.user: The authenticated user.
   * @param productTypeId - The ID of the product type to delete (from request body).
   * @throws BadRequestException if user is not authorized.
   * @returns The result of the deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete/:id')
  async deleteProductType(@Req() req, @Body('id') productTypeId: string) {
    const user = req.user as User;
    
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    // Validate product type delete
    validateProductTypeDelete(productTypeId, user);
    return this.productTypeService.deleteProductType(productTypeId);
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific product types */
  ////////////////////////////////////////////////////////////

  /**
   * Retrieve all product types owned by the authenticated user.
   * @param req - The request object containing user info.
   *    - req.user: The authenticated user.
   * @returns Array of product types owned by the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-product-types')
  async getMyProductTypes(@Req() req) {
    const user = req.user as User;

    return this.productTypeService.getMyProductTypes(user);
  }

  /**
   * Create a new product type for the authenticated user.
   * The ownerId will be set to the current user's ID.
   * @param req - The request object containing user info.
   *    - req.user: The authenticated user.
   * @param productTypeData - The data for the new product type (from request body).
   * @returns The created product type object.
   */
  @UseGuards(AuthMiddleware)
  @Post('my-product-type')
  async createProductType(@Req() req, @Body() productTypeData: ProductType) {
    const user = req.user as User;

    // Validate product type data
    validateProductTypeData({ ...productTypeData, ownerId: user.id }, user);
    
    return this.productTypeService.createProductType({
      ...productTypeData,
      ownerId: user.id,
    });
  }

  /**
   * Retrieve details of a specific product type owned by the authenticated user.
   * @param req - The request object containing user info and route params.
   *    - req.user: The authenticated user.
   *    - req.params.id: The ID of the product type to retrieve.
   * @returns The product type object if found and owned by the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-product-type/:id')
  async getMyProductTypeById(@Req() req) {
    const user = req.user as User;
    const productTypeId = req.params.id;

    return this.productTypeService.getMyProductTypeById(user, productTypeId);
  }

  /**
   * Update a product type owned by the authenticated user.
   * Only updates if the product type exists and belongs to the user.
   * @param req - The request object containing user info and route params.
   *    - req.user: The authenticated user.
   *    - req.params.id: The ID of the product type to update.
   * @param productTypeData - The new data for the product type (from request body).
   * @throws BadRequestException if product type not found.
   * @returns The updated product type object.
   */
  @UseGuards(AuthMiddleware)
  @Post('update-my-product-type/:id')
  async updateMyProductType(
    @Req() req,
    @Body() productTypeData: ProductType
  ) {
    const user = req.user as User;
    const productTypeId = req.params.id;

    const existingProductType = await this.productTypeService.getMyProductTypeById(user, productTypeId);
    if (!existingProductType) {
      throw new BadRequestException('product_type_not_found');
    }

    // Validate product type update data
    validateProductTypeUpdateData({ ...productTypeData, ownerId: user.id }, user);

    return this.productTypeService.updateProductType(productTypeId, {
      ...productTypeData,
      ownerId: user.id,
    });
  }

  /**
   * Delete a product type owned by the authenticated user.
   * Only deletes if the product type exists and belongs to the user.
   * @param req - The request object containing user info.
   *    - req.user: The authenticated user.
   * @param productTypeId - The ID of the product type to delete (from request body).
   * @throws BadRequestException if product type not found.
   * @returns The result of the deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete-my-product-type/:id')
  async deleteMyProductType(@Req() req, @Body('id') productTypeId: string) {
    const user = req.user as User;

    // Validate product type delete
    validateProductTypeDelete(productTypeId, user);

    const productType = await this.productTypeService.getMyProductTypeById(user, productTypeId);
    if (!productType) {
      throw new BadRequestException('product_type_not_found');
    }

    return this.productTypeService.deleteProductType(productTypeId);
  }
}
