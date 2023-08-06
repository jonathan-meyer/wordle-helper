import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

const App = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const tab = await chrome.tabs
        .query({
          active: true,
          currentWindow: true,
          url: ["*://*.nytimes.com/games/wordle/*"],
        })
        .then((tabs) => tabs.pop())
        .catch((err: Error) => console.error(err));

      tab ? navigate(`/helper/${tab.id}`) : navigate("/not_wordle");
    })();
  }, [navigate]);

  return <Outlet />;
};

export default App;
