import { useEffect, useState } from "react";
import App from "./App.tsx";
import ArenaWorkspace from "./arena/ArenaWorkspace.tsx";
import TrainingTerraceWorkspace from "./training/TrainingTerraceWorkspace.tsx";

const isArenaHash = (hash: string) => /^#arena(?:\/|$)/i.test(hash);
const isTrainingTerraceHash = (hash: string) => /^#training-terrace\/overview$/i.test(hash);

export default function RootRouter() {
  const [route, setRoute] = useState(() => isTrainingTerraceHash(location.hash) ? "training" : isArenaHash(location.hash) ? "arena" : "product");

  useEffect(() => {
    const onHashChange = () => setRoute(isTrainingTerraceHash(location.hash) ? "training" : isArenaHash(location.hash) ? "arena" : "product");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route === "training" ? <TrainingTerraceWorkspace /> : route === "arena" ? <ArenaWorkspace /> : <App />;
}
