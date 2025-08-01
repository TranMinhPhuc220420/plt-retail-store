# Supplier Management UI Usage Guide

## Overview
The Supplier Management UI provides a comprehensive interface for managing suppliers in the retail store system. This guide covers all features and functionality available to users.

## Navigation
Access supplier management through:
1. Admin Dashboard → Warehouse Management → Suppliers
2. Direct URL: `/store/{storeCode}/admin/nha-cung-cap`

## Main Features

### 1. Supplier List View

#### Overview
The supplier list is the main interface for viewing and managing all suppliers in a store.

#### Features
- **Table View**: Display suppliers with key information
- **Search**: Search by supplier name, code, email, or phone
- **Filter**: Filter by supplier status (Active, Inactive, Pending Approval, Blacklisted)
- **Sort**: Sort by any column (name, code, status, created date)
- **Bulk Actions**: Select multiple suppliers for bulk operations
- **Pagination**: Navigate through large lists of suppliers

#### Displayed Information
- **Supplier Code**: Unique identifier for the supplier
- **Name**: Supplier name with description preview
- **Contact**: Email, phone, and contact person information
- **Categories**: Supplier categories (food, beverages, equipment, etc.)
- **Status**: Current supplier status with color coding
- **Created Date**: When the supplier was added to the system

#### Actions Available
- **View Details**: Click eye icon to view complete supplier information
- **Edit**: Click edit icon to modify supplier information
- **Delete**: Remove supplier from the system (soft delete)
- **Bulk Delete**: Select multiple suppliers and delete them at once

### 2. Add/Edit Supplier Form

#### Overview
A comprehensive form for creating new suppliers or editing existing ones, organized in tabs for better usability.

#### Tab 1: Basic Information
- **Supplier Code**: Unique identifier (required, 2-50 characters, alphanumeric)
- **Name**: Supplier name (required, 2-200 characters)
- **Description**: Optional description (max 1000 characters)
- **Status**: Active, Inactive, Pending Approval, or Blacklisted
- **Categories**: Multiple categories can be selected or added
- **Notes**: Additional notes about the supplier (max 2000 characters)

#### Tab 2: Contact Information
**Primary Contact:**
- **Email**: Supplier's main email address
- **Phone**: Primary phone number
- **Mobile**: Mobile phone number
- **Website**: Supplier's website URL

**Contact Person:**
- **Name**: Contact person's name
- **Title**: Job title or position
- **Email**: Contact person's email
- **Phone**: Contact person's phone number

#### Tab 3: Address & Business
**Address Information:**
- **Street Address**: Physical address
- **City**: City name
- **State/Province**: State or province
- **ZIP/Postal Code**: Postal code
- **Country**: Country name

**Business Information:**
- **Business Type**: Individual, Company, Corporation, or Partnership
- **Tax ID**: Tax identification number
- **Registration Number**: Business registration number

#### Tab 4: Payment & Delivery
**Payment Terms:**
- **Credit Days**: Number of days for payment (0-365)
- **Payment Method**: Cash, Bank Transfer, Check, or Credit Card
- **Bank Details**: Bank name, account number, routing number, SWIFT code

**Delivery Information:**
- **Minimum Order Amount**: Minimum order value
- **Delivery Time**: Expected delivery timeframe
- **Delivery Zones**: Areas where supplier delivers
- **Shipping Methods**: Available shipping options

#### Form Validation
- **Real-time validation**: Fields are validated as you type
- **Error messages**: Clear error messages for invalid inputs
- **Required field indicators**: Visual indicators for required fields
- **Format validation**: Email, phone, and URL format validation

### 3. Supplier Detail View

#### Overview
Comprehensive view of a single supplier with all information organized in tabs.

#### Tab 1: Overview
- **Basic Information**: Core supplier details
- **Contact Information**: All contact details with icons
- **Address Information**: Full address details
- **Notes**: Any additional notes about the supplier

#### Tab 2: Business Details
- **Business Information**: Legal and business details
- **Payment Terms**: Payment conditions and bank details
- **Delivery Information**: Delivery zones and shipping methods

#### Tab 3: Performance
- **Overall Rating**: Star rating out of 5
- **Order Statistics**: Total orders and on-time deliveries
- **Performance Scores**: Quality, delivery, and service scores with progress bars
- **Delivery Performance**: Percentage of on-time deliveries

#### Actions Available
- **Back to List**: Return to supplier list
- **Edit**: Open edit form with current data
- **Delete**: Remove supplier (with confirmation)

### 4. Search and Filter Features

#### Search Functionality
- **Global Search**: Search across supplier name, code, email, and phone
- **Real-time Results**: Results update as you type
- **Clear Search**: Easy clear button to reset search

#### Status Filter
- **All Status**: Show all suppliers
- **Active**: Show only active suppliers
- **Inactive**: Show inactive suppliers
- **Pending Approval**: Show suppliers awaiting approval
- **Blacklisted**: Show blacklisted suppliers

#### Visual Indicators
- **Status Colors**: 
  - Green: Active
  - Orange: Inactive
  - Blue: Pending Approval
  - Red: Blacklisted

### 5. Bulk Operations

#### Selection
- **Row Selection**: Checkbox at the beginning of each row
- **Select All**: Header checkbox to select all visible rows
- **Selection Count**: Display number of selected items

#### Bulk Actions
- **Bulk Delete**: Delete multiple suppliers at once
- **Confirmation**: Confirmation dialog before bulk operations
- **Progress Feedback**: Loading states during bulk operations

### 6. Responsive Design

#### Mobile Optimization
- **Responsive Table**: Table adapts to smaller screens
- **Touch-Friendly**: Large touch targets for mobile users
- **Collapsible Columns**: Less important columns hidden on small screens

#### Desktop Features
- **Full Table View**: All columns visible
- **Hover Effects**: Interactive hover states
- **Keyboard Navigation**: Full keyboard support

### 7. Data Management

#### Data Validation
- **Client-Side Validation**: Immediate feedback on form fields
- **Server-Side Validation**: Additional validation on the server
- **Error Handling**: User-friendly error messages

#### Data Persistence
- **Auto-Save**: Form data preserved during navigation
- **Undo/Redo**: Not implemented but can be added
- **Data Integrity**: Validation ensures data consistency

### 8. Performance Features

#### Loading States
- **Skeleton Loading**: Placeholder content while loading
- **Spinner Indicators**: Loading spinners for actions
- **Progressive Loading**: Data loads as needed

#### Caching
- **Local Caching**: Frequently used data cached locally
- **Optimistic Updates**: UI updates before server confirmation
- **Background Refresh**: Data refreshed in background

### 9. Accessibility Features

#### Keyboard Navigation
- **Tab Navigation**: Full keyboard navigation support
- **Enter/Space Actions**: Activate buttons with keyboard
- **Escape to Close**: Close modals with escape key

#### Screen Reader Support
- **ARIA Labels**: Proper ARIA labeling for screen readers
- **Semantic HTML**: Proper HTML structure for accessibility
- **Focus Management**: Proper focus management in modals

#### Visual Accessibility
- **High Contrast**: Good color contrast ratios
- **Font Sizing**: Readable font sizes
- **Icon Labels**: Text labels for icons

### 10. Error Handling and Feedback

#### User Feedback
- **Success Messages**: Confirmation of successful actions
- **Error Messages**: Clear error descriptions
- **Warning Messages**: Alerts for potential issues
- **Info Messages**: General information messages

#### Error Recovery
- **Retry Actions**: Option to retry failed operations
- **Form Validation**: Prevent invalid data submission
- **Graceful Degradation**: Fallback for failed features

## Best Practices

### Data Entry
1. **Use Consistent Naming**: Follow consistent naming conventions for supplier codes
2. **Complete Information**: Fill in as much information as possible for better management
3. **Regular Updates**: Keep supplier information up to date
4. **Status Management**: Update supplier status when circumstances change

### Performance Tracking
1. **Monitor Performance**: Regularly check supplier performance metrics
2. **Update Ratings**: Keep performance ratings current
3. **Use Categories**: Categorize suppliers for better organization
4. **Document Issues**: Use notes field to document important information

### Maintenance
1. **Regular Reviews**: Periodically review supplier list for accuracy
2. **Clean Up**: Remove or inactivate suppliers no longer used
3. **Backup Data**: Ensure supplier data is included in backups
4. **Access Control**: Maintain proper user access controls

## Troubleshooting

### Common Issues
1. **Supplier Code Conflicts**: Use unique codes for each supplier
2. **Form Validation Errors**: Check all required fields are filled
3. **Performance Data Missing**: Performance data appears after transactions
4. **Search Not Working**: Check search terms and filters

### Support
For technical issues or feature requests, contact the system administrator or development team.
