import { useState, useEffect } from "react";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";

function App() {
  const getCurrentPage = () => {
    const hash = window.location.hash;

    if (hash === "#login") {
      return "login";
    }

    if (hash === "#signup") {
      return "signup";
    }

    return "home";
  };

  const [page, setPage] = useState(getCurrentPage);

  useEffect(() => {
    const handleHashChange = () => {
      setPage(getCurrentPage());
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <div>
      {page === "home" && <Home />}
      {page === "login" && <Login />}
      {page === "signup" && <Signup />}
    </div>
  );
}

export default App;