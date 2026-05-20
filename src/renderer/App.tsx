import { useEffect, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { PetWindow } from "./PetWindow";
import { SettingsWindow } from "./SettingsWindow";

function getRoute() {
  const route = window.location.hash.replace("#/", "");
  if (route === "chat" || route === "settings" || route === "pet") {
    return route;
  }
  return "pet";
}

export function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route === "chat") {
    return <ChatWindow />;
  }

  if (route === "settings") {
    return <SettingsWindow />;
  }

  return <PetWindow />;
}
