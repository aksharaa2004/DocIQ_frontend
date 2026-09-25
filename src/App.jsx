import { useState, useEffect } from "react";

import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Upload from "./components/Upload";

function App() {
  const getCurrentPage = () => {
    const hash = window.location.hash;

    if (hash === "#login") {
      return "login";
    }

    if (hash === "#signup") {
      return "signup";
    }

    if (hash === "#dashboard") {
      return "dashboard";
    }

    if (hash === "#upload") {
      return "upload";
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

      {page === "dashboard" && <Dashboard />}

      {page === "upload" && <Upload />}
    </div>
  );
}

export default App;
