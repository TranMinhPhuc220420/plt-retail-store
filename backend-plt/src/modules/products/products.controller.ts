import { BadRequestException, Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors, Param } from '@nestjs/common';
import { Express } from 'express';

// Services
import { ProductsService } from '@/modules/products/products.service';
import { StoreFileInterceptor } from '@/modules/upload/upload.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateProductData, validateProductDelete, validateProductUpdateData } from '@/utils/validate';
// Interfaces
import { Product, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST, PRODUCT_URL_TEMP } from '@/config';

@Controller('products')
export class ProductsController {
  constructor(private readonly products_service: ProductsService) {}
  
  //////////////////////////////////////////////////
  /** Controller methods for product administration */
  //////////////////////////////////////////////////

  /**
   * Retrieves all products for administrators.
   * 
   * This handler checks if the requesting user is an administrator by verifying their user ID
   * against the `ADMINISTRATOR_LIST`. If the user is not authorized, a `BadRequestException`
   * is thrown. Otherwise, it returns the list of all products.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @throws BadRequestException if the user is not authorized.
   * @returns A promise resolving to the list of all products.
   */
  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllProducts(@Req() req) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.products_service.getAllProducts();
  }

  /**
   * Retrieves a specific product by ID for administrators.
   * 
   * Only users whose ID is in `ADMINISTRATOR_LIST` can access this endpoint.
   * Throws an exception if the user is not authorized or the product does not exist.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param id - The ID of the product to retrieve.
   * @throws BadRequestException if the user is not authorized or product not found.
   * @returns The product object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('detail/:id')
  async getProductById(@Req() req, @Param('id') id: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    const product = await this.products_service.getProductById(id);
    if (!product) {
      throw new BadRequestException('product_not_found');
    }

    return product;
  }

  /**
   * Deletes a product by ID for administrators.
   * 
   * Only users whose ID is in `ADMINISTRATOR_LIST` can perform this action.
   * Throws an exception if the user is not authorized.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param productId - The ID of the product to delete.
   * @throws BadRequestException if the user is not authorized.
   * @returns The result of the delete operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete/:id')
  async deleteProduct(@Req() req, @Body('id') productId: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.products_service.deleteProduct(productId);
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific product management */
  ////////////////////////////////////////////////////////////

  /**
   * Retrieves all products owned by the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @returns A promise resolving to the list of products owned by the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-products')
  async getMyProducts(@Req() req) {
    const user = req.user as User;
    return this.products_service.getMyProducts(user);
  }

  /**
   * Creates a new product for the authenticated user.
   * 
   * Accepts product data and an optional image file. Validates the input and associates the new product with the user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param productData - The data for the new product.
   * @param file - Optional uploaded image file.
   * @returns The created product object.
   */
  @UseGuards(AuthMiddleware)
  @UseInterceptors(StoreFileInterceptor)
  @Post('my-product')
  async createProduct(
    @Req() req: any,
    @Body() productData: Product,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const user: User = req.user;

    // If a file is uploaded, set the imageUrl in productData
    if (file) {
      productData.imageUrl = PRODUCT_URL_TEMP.replace('{filename}', file.filename);
    }

    // Validate product data
    validateProductData(productData, user);

    // Create product
    return this.products_service.createProduct({
      ...productData,
      ownerId: user.id, // Ensure the ownerId is set to the current user's ID
    });
  }

  /**
   * Retrieves a specific product owned by the authenticated user by product ID.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param productId - The ID of the product to retrieve.
   * @returns The product object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-product/:id')
  async getMyProductById(@Req() req, @Param('id') productId: string) {
    const user = req.user as User;

    // Fetch the product by ID for the authenticated user
    return this.products_service.getMyProductById(user, productId);
  }

  /**
   * Handles updating a product's information for the authenticated user.
   *
   * - Receives updated product data and an optional image file from the client.
   * - If a new image file is provided, updates the `imageUrl` field in `productData`.
   * - Validates the update data based on the user's permissions.
   * - Checks if the product exists for the current user and the given product ID.
   * - If valid, updates the product information with the new data and ensures the `ownerId` is set to the current user.
   *
   * @param req - The request object containing user and params information.
   * @param productData - The updated product data.
   * @param file - The new product image file, if provided.
   * @returns The updated product information.
   * @throws BadRequestException if the product is not found.
   */
  @UseGuards(AuthMiddleware)
  @UseInterceptors(StoreFileInterceptor)
  @Post('update-my-product/:id')
  async updateProduct(
    @Req() req,
    @Body() productData: Product,
    @UploadedFile() file?: Express.Multer.File
  ) {
    const user: User = req.user;
    const productId = req.params.id;

    // If a file is uploaded, set the imageUrl in productData
    if (file) {
      productData.imageUrl = PRODUCT_URL_TEMP.replace('{filename}', file.filename);
    }

    // Validate product data
    validateProductUpdateData(productData, user);

    // Fetch the existing product
    const existingProduct = await this.products_service.getMyProductById(user, productId);
    if (!existingProduct) {
      throw new BadRequestException('product_not_found');
    }

    // Update the product
    return this.products_service.updateProduct(productId, {
      ...productData,
      ownerId: user.id, // Ensure the ownerId is set to the current user's ID
    });
  }

  /**
   * Handles the deletion of a product owned by the authenticated user.
   * 
   * This endpoint validates the user's permission and the existence of the product before proceeding with deletion.
   * Throws a BadRequestException if the product does not exist.
   * 
   * @param req - The request object containing the authenticated user.
   * @param productId - The ID of the product to be deleted, provided in the request body.
   * @returns The result of the product deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete-my-product/:id')
  async deleteMyProduct(@Req() req, @Body('id') productId: string) {
    const user = req.user as User;

    // Validate product data
    validateProductDelete(productId, user);
    
    // Fetch the product to ensure it exists
    const product = await this.products_service.getMyProductById(user, productId);
    if (!product) {
      throw new BadRequestException('product_not_found');
    }

    // Delete the product
    return this.products_service.deleteProduct(productId);
  }

  /**
   * Retrieves products by store ID for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeId - The ID of the store to get products for.
   * @returns A promise resolving to the list of products in the specified store.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-products/store/:storeId')
  async getMyProductsByStore(@Req() req, @Param('storeId') storeId: string) {
    const user = req.user as User;
    return this.products_service.getMyProductsByStore(user, storeId);
  }

  /**
   * Retrieves products by store ID (public endpoint).
   * 
   * @param storeId - The ID of the store to get products for.
   * @returns A promise resolving to the list of products in the specified store.
   */
  @Get('store/:storeId')
  async getProductsByStore(@Param('storeId') storeId: string) {
    return this.products_service.getProductsByStore(storeId);
  }
}
