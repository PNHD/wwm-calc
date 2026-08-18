import { useEffect, useState } from "react";
import App from "./App.tsx";
import ArenaWorkspace from "./arena/ArenaWorkspace.tsx";

const isArenaHash = (hash: string) => /^#arena(?:\/|$)/i.test(hash);

export default function RootRouter() {
  const [arena, setArena] = useState(() => isArenaHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setArena(isArenaHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return arena ? <ArenaWorkspace /> : <App />;
}
