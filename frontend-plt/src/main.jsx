import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { RouterProvider, Route } from "react-router";

import FirebaseAuthProvider from "@/provider/FirebaseAuthProvider";

import router from '@/routes';

// Styles
import './index.css'

// I18n
import '@/locales'

// Firebase
import '@/firebase';

// Redux
import { store } from '@/store'
import { Provider } from 'react-redux'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>

      <FirebaseAuthProvider>
        <RouterProvider router={router} />
      </FirebaseAuthProvider>

    </Provider>
  </StrictMode>,
)
