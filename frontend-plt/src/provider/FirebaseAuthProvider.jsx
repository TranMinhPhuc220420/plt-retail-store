import { useEffect, useReducer } from "react";

import AuthContext from "@/provider/FirebaseAuthContext";

import firebaseApp from "@/firebase";

import {
  GoogleAuthProvider, onAuthStateChanged, getAuth, signOut, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from "firebase/auth";
import { addUserEntry, getUserEntryByEmail, getUserEntryById } from "@/database";

const INITIALIZE = "INITIALIZE";
const IS_CHECKING = "IS_CHECKING";
const IS_ERROR = "IS_ERROR";

import { ADMIN_ROLE, AVATAR_DEFAULT, USER_ROLE } from "@/constant";
import { verifyGoogleToken } from "@/request/auth";

const auth = getAuth(firebaseApp);

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,

  is_checking: false, // To handle the initial loading state
  is_error: null, // To handle any errors during authentication
};

const reducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {

    case INITIALIZE:
      const { isAuthenticated, user } = payload;
      return {
        ...state,
        isAuthenticated,
        isInitialized: true,
        user,
      };

    case IS_CHECKING:
      return {
        ...state,
        is_checking: payload.is_checking,
      };

    case IS_ERROR:
      return {
        ...state,
        is_error: payload.is_error,
      };

  }

  return state;
};

function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    
    // Listen for authentication state changes
    onAuthStateChanged(auth, async (user) => {
      // Check if checking state is true initially
      if (state.is_checking) return;

      // Set checking state to true initially
      dispatch({ type: IS_CHECKING, payload: { is_checking: true } });
      
      // Check if page active is login page
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);

      const isLoginPage = path.includes("/dang-nhap");
      const isAdminPage = path.includes("/admin");

      const redirectTo = params.get("redirectTo") || '';
      const isRedirectToAdmin = redirectTo.includes("/admin");
      
      if (user) {
        const idToken = await user.getIdToken();
        const { user_info } = await verifyUserToken(idToken)

        if (user_info) {
          const role = user_info.role || USER_ROLE;

          // Additional user data
          user['uid'] = user.uid;
          user['sub'] = user_info.id;
          user['email'] = user.email;
          user['displayName'] = user.displayName || user_info.fullname || user.email.split('@')[0];
          user['isAdmin'] = (user_info.role === ADMIN_ROLE);
          
          if (!user.photoURL) {
            user['photoURL'] = user_info.avatar || AVATAR_DEFAULT;
          }

          dispatch({
            type: INITIALIZE,
            payload: { isAuthenticated: true, user: { ...user, ...user_info } },
          });

          if (isLoginPage) {
            // Redirect to dashboard if not on login page
            if (role === ADMIN_ROLE) {
              window.location.replace(redirectTo || "/admin/dashboard");
            }
            if (role === USER_ROLE) {
              window.location.replace((!isRedirectToAdmin && redirectTo) ? redirectTo : "/");
            }
          } else {
            if (role === USER_ROLE && isAdminPage) {
              window.location.replace("/");
            }
          }
        } else {
          // If user entry does not exist, redirect to login page
          window.location.replace("/dang-nhap?redirectTo=" + encodeURIComponent(path));
        }

      } else {
        if (!isLoginPage) {
          window.location.replace("/dang-nhap?redirectTo=" + encodeURIComponent(path));
        }
      }

      // Set checking state to false after processing
      dispatch({ type: IS_CHECKING, payload: { is_checking: false } });
    });

  }, []);

  const verifyUserToken = async (token) => {
    try {
      return await verifyGoogleToken(token)
    } catch (error) {
      console.error("Error verifying user token:", error);
      dispatch({ type: IS_ERROR, payload: { is_error: error.message } });
    }
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithUsernamePassword = async ({ username, password }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;

    } catch (error) {
      console.error("Error signing in with username and password:", error);
      dispatch({ type: IS_ERROR, payload: { is_error: error.message } });
      return null;
    }
  };

  const registerWithUsernamePassword = async ({username, password}) => {
    // return await registerUserByUsernamePassword(data);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, username, password);
      const user = userCredential.user;

      // Add user entry to the database
      await addUserEntry({
        id: user.uid,
        email: user.email,
        role: USER_ROLE, // Default role
      });

      // Retrieve the user entry again after adding
      const userEntry = await getUserEntryById(user.uid);
      const userData = { ...user, ...userEntry, isAdmin: (userEntry.role === ADMIN_ROLE) };
      dispatch({
        type: INITIALIZE,
        payload: { isAuthenticated: true, user: userData },
      });
      return userData;
    } catch (error) {
      console.error("Error registering with username and password:", error);
      dispatch({ type: IS_ERROR, payload: { is_error: error.message } });
      return null;
    }
  };

  const _signOut = async () => {
    await signOut(auth);
  };

  const _auth = { ...state.user };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: "firebase",
        user: {
          id: _auth.uid,
          sub: _auth.sub,
          email: _auth.email,
          avatar: _auth.photoURL,
          displayName: _auth.displayName,
          role: "user",
          isAdmin: _auth.isAdmin || false,
        },
        signInWithGoogle,
        signInWithUsernamePassword,
        registerWithUsernamePassword,
        signOut: _signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
