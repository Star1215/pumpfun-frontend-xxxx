import { authService } from "../../services";
import Cookies from "js-cookie";
import { retryFunction } from "../../utils/retry";

export const useLogin = () => {
  const login = async (walletAddr) => {
    const user = await retryFunction(async () => {
      await authService.login(walletAddr);
    });
    if (user) {
      Cookies.set("currentUser", JSON.stringify(user));
    }
    return user;
  };

  return { login };
};
