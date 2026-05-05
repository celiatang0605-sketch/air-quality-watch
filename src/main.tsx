import { Buffer } from "buffer";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Solana web3.js needs Buffer in the browser
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
