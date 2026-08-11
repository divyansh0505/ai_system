import Cookies from "js-cookie";

const cookieStorage = {
  getItem: (name: string) => {
    const value = Cookies.get(name);
    return value;
  },
  setItem: (name: string, value: string) => {
    Cookies.set(name, value, {
      expires: 365,
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
  },
  removeItem: (name: string) => {
    Cookies.remove(name);
  },
};

export default cookieStorage;
