const mongoose = require('mongoose');
const Store = require('../src/models/Store');
const Employee = require('../src/models/Employee');
const { MANAGER_ROLE, STAFF_ROLE } = require('../src/config/constant');

/**
 * Migration script to add Employee model and update Store relationships
 */
async function migrateEmployeeSystem() {
  try {
    console.log('🚀 Starting Employee System Migration...');

    // Connect to MongoDB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plt-retail-store');
      console.log('✅ Connected to MongoDB');
    }

    // Create Employee collection indexes if they don't exist
    console.log('📝 Creating Employee collection indexes...');
    await Employee.createIndexes();
    console.log('✅ Employee indexes created');

    // Update existing stores to ensure they have employees array
    console.log('🏪 Updating existing stores...');
    const storesWithoutEmployeesArray = await Store.find({
      employees: { $exists: false }
    });

    for (const store of storesWithoutEmployeesArray) {
      await Store.findByIdAndUpdate(
        store._id,
        { 
          $set: { 
            employees: [] 
          }
        }
      );
      console.log(`✅ Updated store: ${store.name} (${store.storeCode})`);
    }

    // Create sample employees if no employees exist
    const existingEmployeesCount = await Employee.countDocuments();
    if (existingEmployeesCount === 0) {
      console.log('👥 Creating sample employees...');
      
      const stores = await Store.find({ deleted: false }).limit(3);
      
      for (const store of stores) {
        // Create a manager
        const manager = new Employee({
          firstName: 'Quản lý',
          lastName: 'Mẫu',
          email: `manager.${store.storeCode.toLowerCase()}@example.com`,
          phone: '+84901234567',
          role: MANAGER_ROLE,
          department: 'management',
          storeId: store._id,
          ownerId: store.ownerId,
          salary: {
            amount: 20000000,
            currency: 'VND',
            type: 'monthly'
          },
          contractType: 'full-time',
          hireDate: new Date(),
          isActive: true
        });

        await manager.save();
        
        // Create a few staff members
        const staffMembers = [
          {
            firstName: 'Nhân viên',
            lastName: 'Bán hàng',
            email: `sales.${store.storeCode.toLowerCase()}@example.com`,
            phone: '+84901234568',
            role: STAFF_ROLE,
            department: 'sales',
            managerId: manager._id
          },
          {
            firstName: 'Nhân viên',
            lastName: 'Thu ngân',
            email: `cashier.${store.storeCode.toLowerCase()}@example.com`,
            phone: '+84901234569',
            role: STAFF_ROLE,
            department: 'cashier',
            managerId: manager._id
          }
        ];

        for (const staffData of staffMembers) {
          const staff = new Employee({
            ...staffData,
            storeId: store._id,
            ownerId: store.ownerId,
            salary: {
              amount: 12000000,
              currency: 'VND',
              type: 'monthly'
            },
            contractType: 'full-time',
            hireDate: new Date(),
            isActive: true
          });

          await staff.save();
        }

        // Update store with employee references
        const storeEmployees = await Employee.find({ storeId: store._id });
        await Store.findByIdAndUpdate(
          store._id,
          { 
            $set: { 
              employees: storeEmployees.map(emp => emp._id) 
            }
          }
        );

        console.log(`✅ Created sample employees for store: ${store.name}`);
      }
    }

    // Validate Employee model constraints
    console.log('🔍 Validating Employee data integrity...');
    
    // Check for employees without valid store references
    const employeesWithInvalidStores = await Employee.find({
      deleted: false
    }).populate('storeId');

    const invalidEmployees = employeesWithInvalidStores.filter(emp => !emp.storeId || emp.storeId.deleted);
    
    if (invalidEmployees.length > 0) {
      console.log(`⚠️  Found ${invalidEmployees.length} employees with invalid store references`);
      for (const emp of invalidEmployees) {
        console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.employeeCode})`);
      }
    }

    // Check for staff without managers
    const staffWithoutManagers = await Employee.find({
      role: STAFF_ROLE,
      deleted: false,
      $or: [
        { managerId: { $exists: false } },
        { managerId: null }
      ]
    });

    if (staffWithoutManagers.length > 0) {
      console.log(`⚠️  Found ${staffWithoutManagers.length} staff members without managers`);
      for (const staff of staffWithoutManagers) {
        console.log(`   - ${staff.firstName} ${staff.lastName} (${staff.employeeCode})`);
      }
    }

    // Summary statistics
    const totalEmployees = await Employee.countDocuments({ deleted: false });
    const totalManagers = await Employee.countDocuments({ role: MANAGER_ROLE, deleted: false });
    const totalStaff = await Employee.countDocuments({ role: STAFF_ROLE, deleted: false });
    const activeEmployees = await Employee.countDocuments({ deleted: false, isActive: true });

    console.log('\n📊 Migration Summary:');
    console.log(`   Total Employees: ${totalEmployees}`);
    console.log(`   Managers: ${totalManagers}`);
    console.log(`   Staff: ${totalStaff}`);
    console.log(`   Active: ${activeEmployees}`);
    console.log(`   Inactive: ${totalEmployees - activeEmployees}`);

    console.log('\n✅ Employee System Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for use in other scripts
module.exports = { migrateEmployeeSystem };

// Run migration if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  
  migrateEmployeeSystem()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
