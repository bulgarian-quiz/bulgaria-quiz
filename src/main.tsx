import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./atlas.css";
import { initReveal } from "./lib/reveal";

createRoot(document.getElementById("root")!).render(<App />);
initReveal();
