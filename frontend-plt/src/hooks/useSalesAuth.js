import { useContext } from "react";
import SalesAuthContext from "@/provider/SalesAuthContext";

const useSalesAuth = () => {
  const context = useContext(SalesAuthContext);

  if (!context) {
    throw new Error('useSalesAuth must be used within SalesAuthProvider');
  }

  return context;
};

export default useSalesAuth;