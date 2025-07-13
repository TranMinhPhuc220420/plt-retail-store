import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards, Param } from '@nestjs/common';

// Services
import { CustomersService } from '@/modules/customers/customers.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateCustomerData, validateCustomerDelete, validateCustomerUpdateData } from '@/utils/validate';
// Interfaces
import { Customer, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST } from '@/config';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customers_service: CustomersService) {}
  
  //////////////////////////////////////////////////
  /** Controller methods for customer administration */
  //////////////////////////////////////////////////

  /**
   * Retrieves all customers for administrators.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @throws BadRequestException if the user is not authorized.
   * @returns A promise resolving to the list of all customers.
   */
  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllCustomers(@Req() req) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.customers_service.getAllCustomers();
  }

  /**
   * Retrieves a specific customer by ID for administrators.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param id - The ID of the customer to retrieve.
   * @throws BadRequestException if the user is not authorized or customer not found.
   * @returns The customer object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('detail/:id')
  async getCustomerById(@Req() req, @Param('id') id: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    const customer = await this.customers_service.getCustomerById(id);
    if (!customer) {
      throw new BadRequestException('customer_not_found');
    }

    return customer;
  }

  /**
   * Deletes a customer by ID for administrators.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param customerId - The ID of the customer to delete.
   * @throws BadRequestException if the user is not authorized.
   * @returns The result of the delete operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete/:id')
  async deleteCustomer(@Req() req, @Body('id') customerId: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.customers_service.deleteCustomer(customerId);
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific customer management */
  ////////////////////////////////////////////////////////////

  /**
   * Retrieves all customers associated with the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @returns A promise resolving to the list of customers associated with the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-customers')
  async getMyCustomers(@Req() req) {
    const user = req.user as User;
    return this.customers_service.getMyCustomers(user);
  }

  /**
   * Creates a new customer record for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param customerData - The data for the new customer.
   * @returns The created customer object.
   */
  @UseGuards(AuthMiddleware)
  @Post('my-customer')
  async createCustomer(
    @Req() req: any,
    @Body() customerData: Customer
  ) {
    const user: User = req.user;

    // Validate customer data
    validateCustomerData(customerData, user);

    // Create customer
    return this.customers_service.createCustomer({
      ...customerData,
      userId: user.id, // Ensure the userId is set to the current user's ID
    });
  }

  /**
   * Retrieves a specific customer associated with the authenticated user by ID.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param customerId - The ID of the customer to retrieve.
   * @returns The customer object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-customer/:id')
  async getMyCustomerById(@Req() req, @Param('id') customerId: string) {
    const user = req.user as User;

    // Fetch the customer by ID for the authenticated user
    return this.customers_service.getMyCustomerById(user, customerId);
  }

  /**
   * Handles updating a customer's information for the authenticated user.
   *
   * @param req - The request object containing user and params information.
   * @param customerData - The updated customer data.
   * @returns The updated customer information.
   * @throws BadRequestException if the customer is not found.
   */
  @UseGuards(AuthMiddleware)
  @Post('update-my-customer/:id')
  async updateCustomer(
    @Req() req,
    @Body() customerData: Customer
  ) {
    const user: User = req.user;
    const customerId = req.params.id;

    // Validate customer data
    validateCustomerUpdateData(customerData, user);

    // Fetch the existing customer
    const existingCustomer = await this.customers_service.getMyCustomerById(user, customerId);
    if (!existingCustomer) {
      throw new BadRequestException('customer_not_found');
    }

    // Update the customer
    return this.customers_service.updateCustomer(customerId, {
      ...customerData,
      userId: user.id, // Ensure the userId is set to the current user's ID
    });
  }

  /**
   * Handles the deletion of a customer associated with the authenticated user.
   * 
   * @param req - The request object containing the authenticated user.
   * @param customerId - The ID of the customer to be deleted.
   * @returns The result of the customer deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete-my-customer/:id')
  async deleteMyCustomer(@Req() req, @Body('id') customerId: string) {
    const user = req.user as User;

    // Validate customer data
    validateCustomerDelete(customerId, user);
    
    // Fetch the customer to ensure it exists
    const customer = await this.customers_service.getMyCustomerById(user, customerId);
    if (!customer) {
      throw new BadRequestException('customer_not_found');
    }

    // Delete the customer
    return this.customers_service.deleteCustomer(customerId);
  }

  /**
   * Retrieves customers by store ID for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeId - The ID of the store to get customers for.
   * @returns A promise resolving to the list of customers in the specified store.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-customers/store/:storeId')
  async getMyCustomersByStore(@Req() req, @Param('storeId') storeId: string) {
    const user = req.user as User;
    return this.customers_service.getMyCustomersByStore(user, storeId);
  }

  /**
   * Retrieves customers by store ID (public endpoint).
   * 
   * @param storeId - The ID of the store to get customers for.
   * @returns A promise resolving to the list of customers in the specified store.
   */
  @Get('store/:storeId')
  async getCustomersByStore(@Param('storeId') storeId: string) {
    return this.customers_service.getCustomersByStore(storeId);
  }
}
