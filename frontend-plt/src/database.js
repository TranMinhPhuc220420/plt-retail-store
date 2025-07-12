import { collection, addDoc, setDoc, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore";

import { db } from "@/firebase";

import { EMPLOYEE_COLLECTION } from "@/constant";
import { formatCurrency, getNameBranch, getNameLevel, getNamePosition } from "@/utils";

/**
 * Get the list of employees from the Firestore database.
 * 
 * @function getEmployeeList
 * @async
 * @returns {Promise<Array>} - Returns a promise that resolves to an array of employee objects from the Firestore database.
 * @description Fetches the list of employees from the Firestore database. Each employee object contains the id and data fields.
 */
export const getEmployeeList = async () => {
  try {
    const employeeList = await getDocs(collection(db, EMPLOYEE_COLLECTION));
    const employeeListData = employeeList.docs.map((doc) => {
      let data = doc.data();

      return {
        id: doc.id,
        key: doc.id,
        position_display: getNamePosition(data.position),
        branch_display: getNameBranch(data.branch),
        level_display: getNameLevel(data.level),
        salary_display: formatCurrency(data.salary),
        ...data,
      };
    });

    return employeeListData;
  }
  catch (error) {
    console.error("Error fetching employee list: ", error);
  }

  return false;
};

/**
 * Add an employee to the Firestore database.
 * 
 * @function addEmployee
 * @async
 * @param {object} employee - The employee object to be added to the database
 * @returns {boolean} - Returns true if the employee was added successfully, false otherwise
 * @description Adds an employee to the Firestore database. The employee object should contain the necessary fields.
 */
export const addEmployee = async (employee) => {
  try {
    const docRef = await addDoc(collection(db, EMPLOYEE_COLLECTION), employee);

    return docRef.id;
  }
  catch (error) {
    console.error("Error adding employee: ", error);
  }

  return false;
};

/**
 * Delete an employee from the Firestore database.
 * 
 * @function deleteEmployee
 * @async
 * @param {string} employeeId - The ID of the employee to be deleted
 * @returns {boolean} - Returns true if the employee was deleted successfully, false otherwise
 * @description Deletes an employee from the Firestore database using their ID.
 */
export const deleteEmployee = async (employeeId) => {
  try {
    const docRef = doc(db, EMPLOYEE_COLLECTION, employeeId);
    await deleteDoc(docRef);

    return true;
  }
  catch (error) {
    console.error("Error deleting employee: ", error);
  }

  return false;
}

/**
 * Update an employee in the Firestore database.
 * 
 * @function updateEmployee
 * @async
 * @param {string} employeeId - The ID of the employee to be updated
 * @param {object} employeeData - The updated employee data
 * @returns {boolean} - Returns true if the employee was updated successfully, false otherwise
 * @description Updates an employee in the Firestore database using their ID and the new data.
 */
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const docRef = doc(db, EMPLOYEE_COLLECTION, employeeId);
    await updateDoc(docRef, employeeData);

    return true;
  }
  catch (error) {
    console.error("Error updating employee: ", error);
  }

  return false;
}


// User Entry
/**
 * Add a user entry to the Firestore database.
 * 
 * @function addUserEntry
 * @async
 * @param {object} userEntry - The user entry object to be added to the database
 * @returns {boolean} - Returns true if the user entry was added successfully, false otherwise
 * @description Adds a user entry to the Firestore database. The user entry object should contain the necessary fields.
 */
export const addUserEntry = async (userEntry) => {
  try {
    let docId = userEntry.id;

    // If the user entry does not have an ID, generate a new one
    if (!docId) {
      throw new Error("User entry must have an ID");
    }
    
    const docRef = doc(db, "user_entries", docId);
    await setDoc(docRef, userEntry);

    return docRef.id;
  }
  catch (error) {
    console.error("Error adding user entry: ", error);
  }

  return false;
}

// Get by email
/**
 * Get a user entry by email from the Firestore database.
 * 
 * @function getUserEntryByEmail
 * @async
 * @param {string} email - The email of the user entry to be retrieved
 * @returns {object|null} - Returns the user entry object if found, null otherwise
 * @description Retrieves a user entry from the Firestore database using the user's email.
 */
export const getUserEntryByEmail = async (email) => {
  try {
    const userEntries = await getDocs(collection(db, "user_entries"));
    const userEntry = userEntries.docs.find(doc => doc.data().email === email);

    if (userEntry) {
      return { id: userEntry.id, ...userEntry.data() };
    }
  }
  catch (error) {
    console.error("Error fetching user entry by email: ", error);
  }

  return null;
}

/**
 * Get a user entry by ID from the Firestore database.
 * 
 * @function getUserEntryById
 * @async
 * @param {string} userId - The ID of the user entry to be retrieved
 * @returns {object|null} - Returns the user entry object if found, null otherwise
 * @description Retrieves a user entry from the Firestore database using the user's ID.
 */
export const getUserEntryById = async (userId) => {
  try {
    const docRef = doc(db, "user_entries", userId);
    const userEntry = await getDocs(docRef);

    if (userEntry.exists()) {
      return { id: userEntry.id, ...userEntry.data() };
    }
  }
  catch (error) {
    console.error("Error fetching user entry by ID: ", error);
  }

  return null;
}