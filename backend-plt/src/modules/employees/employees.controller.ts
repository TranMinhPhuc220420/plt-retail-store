import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards, Param } from '@nestjs/common';

// Services
import { EmployeesService } from '@/modules/employees/employees.service';
// Middleware
import { AuthMiddleware } from '@/modules/auth/auth.service';
// Validation
import { validateEmployeeData, validateEmployeeDelete, validateEmployeeUpdateData } from '@/utils/validate';
// Interfaces
import { Employee, User } from '@/interfaces';
// Constants
import { ADMINISTRATOR_LIST } from '@/config';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees_service: EmployeesService) {}
  
  //////////////////////////////////////////////////
  /** Controller methods for employee administration */
  //////////////////////////////////////////////////

  /**
   * Retrieves all employees for administrators.
   * 
   * This handler checks if the requesting user is an administrator by verifying their user ID
   * against the `ADMINISTRATOR_LIST`. If the user is not authorized, a `BadRequestException`
   * is thrown. Otherwise, it returns the list of all employees.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @throws BadRequestException if the user is not authorized.
   * @returns A promise resolving to the list of all employees.
   */
  @UseGuards(AuthMiddleware)
  @Get('all')
  async getAllEmployees(@Req() req) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.employees_service.getAllEmployees();
  }

  /**
   * Retrieves a specific employee by ID for administrators.
   * 
   * Only users whose ID is in `ADMINISTRATOR_LIST` can access this endpoint.
   * Throws an exception if the user is not authorized or the employee does not exist.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param id - The ID of the employee to retrieve.
   * @throws BadRequestException if the user is not authorized or employee not found.
   * @returns The employee object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('detail/:id')
  async getEmployeeById(@Req() req, @Param('id') id: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    const employee = await this.employees_service.getEmployeeById(id);
    if (!employee) {
      throw new BadRequestException('employee_not_found');
    }

    return employee;
  }

  /**
   * Deletes an employee by ID for administrators.
   * 
   * Only users whose ID is in `ADMINISTRATOR_LIST` can perform this action.
   * Throws an exception if the user is not authorized.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param employeeId - The ID of the employee to delete.
   * @throws BadRequestException if the user is not authorized.
   * @returns The result of the delete operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete/:id')
  async deleteEmployee(@Req() req, @Body('id') employeeId: string) {
    const user = req.user as User;

    // Check if the user is an administrator
    if (!ADMINISTRATOR_LIST.includes(user.id)) {
      throw new BadRequestException('user_not_authorized');
    }

    return this.employees_service.deleteEmployee(employeeId);
  }

  ////////////////////////////////////////////////////////////
  /** Controller methods for user-specific employee management */
  ////////////////////////////////////////////////////////////

  /**
   * Retrieves all employees associated with the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @returns A promise resolving to the list of employees associated with the user.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-employees')
  async getMyEmployees(@Req() req) {
    const user = req.user as User;
    return this.employees_service.getMyEmployees(user);
  }

  /**
   * Creates a new employee record for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param employeeData - The data for the new employee.
   * @returns The created employee object.
   */
  @UseGuards(AuthMiddleware)
  @Post('my-employee')
  async createEmployee(
    @Req() req: any,
    @Body() employeeData: Employee
  ) {
    const user: User = req.user;

    // Validate employee data
    validateEmployeeData(employeeData, user);

    // Create employee
    return this.employees_service.createEmployee({
      ...employeeData,
      userId: user.id, // Ensure the userId is set to the current user's ID
    });
  }

  /**
   * Retrieves a specific employee associated with the authenticated user by employee ID.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param employeeId - The ID of the employee to retrieve.
   * @returns The employee object if found.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-employee/:id')
  async getMyEmployeeById(@Req() req, @Param('id') employeeId: string) {
    const user = req.user as User;

    // Fetch the employee by ID for the authenticated user
    return this.employees_service.getMyEmployeeById(user, employeeId);
  }

  /**
   * Handles updating an employee's information for the authenticated user.
   *
   * @param req - The request object containing user and params information.
   * @param employeeData - The updated employee data.
   * @returns The updated employee information.
   * @throws BadRequestException if the employee is not found.
   */
  @UseGuards(AuthMiddleware)
  @Post('update-my-employee/:id')
  async updateEmployee(
    @Req() req,
    @Body() employeeData: Employee
  ) {
    const user: User = req.user;
    const employeeId = req.params.id;

    // Validate employee data
    validateEmployeeUpdateData(employeeData, user);

    // Fetch the existing employee
    const existingEmployee = await this.employees_service.getMyEmployeeById(user, employeeId);
    if (!existingEmployee) {
      throw new BadRequestException('employee_not_found');
    }

    // Update the employee
    return this.employees_service.updateEmployee(employeeId, {
      ...employeeData,
      userId: user.id, // Ensure the userId is set to the current user's ID
    });
  }

  /**
   * Handles the deletion of an employee associated with the authenticated user.
   * 
   * @param req - The request object containing the authenticated user.
   * @param employeeId - The ID of the employee to be deleted.
   * @returns The result of the employee deletion operation.
   */
  @UseGuards(AuthMiddleware)
  @Post('delete-my-employee/:id')
  async deleteMyEmployee(@Req() req, @Body('id') employeeId: string) {
    const user = req.user as User;

    // Validate employee data
    validateEmployeeDelete(employeeId, user);
    
    // Fetch the employee to ensure it exists
    const employee = await this.employees_service.getMyEmployeeById(user, employeeId);
    if (!employee) {
      throw new BadRequestException('employee_not_found');
    }

    // Delete the employee
    return this.employees_service.deleteEmployee(employeeId);
  }

  /**
   * Retrieves employees by store ID for the authenticated user.
   * 
   * @param req - The incoming request object containing the authenticated user.
   * @param storeId - The ID of the store to get employees for.
   * @returns A promise resolving to the list of employees in the specified store.
   */
  @UseGuards(AuthMiddleware)
  @Get('my-employees/store/:storeId')
  async getMyEmployeesByStore(@Req() req, @Param('storeId') storeId: string) {
    const user = req.user as User;
    return this.employees_service.getMyEmployeesByStore(user, storeId);
  }

  /**
   * Retrieves employees by store ID (public endpoint).
   * 
   * @param storeId - The ID of the store to get employees for.
   * @returns A promise resolving to the list of employees in the specified store.
   */
  @Get('store/:storeId')
  async getEmployeesByStore(@Param('storeId') storeId: string) {
    return this.employees_service.getEmployeesByStore(storeId);
  }
}
