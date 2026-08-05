import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create HTTP server from express app
  const server = http.createServer(app);

  // Set up the WebSocket Server attached to the HTTP server
  const wss = new WebSocketServer({ server });

  // In-memory chat message structure
  interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: string;
  }

  const chatHistory: ChatMessage[] = [
    {
      id: "msg-1",
      sender: "Zoning Officer Amara Santos (Zoning Clearance)",
      text: "Drafting the zoning approvals for the Sto. Tomas commercial projects. Please verify setbacks on BP-2025-0005.",
      timestamp: new Date(Date.now() - 4 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: "msg-2",
      sender: "Engr. Ricardo Mercado (Structural Reviewer)",
      text: "On it, Amara. The plans for BP-2025-0005 show adequate setback buffers from the provincial road boundary.",
      timestamp: new Date(Date.now() - 3.5 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: "msg-3",
      sender: "Arch. Sofia Torres (Architectural Evaluator)",
      text: "Has anyone scheduled the inspection for the warehouse project (LC-2025-0001)? The applicant uploaded the revised deed.",
      timestamp: new Date(Date.now() - 2 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
    {
      id: "msg-4",
      sender: "Engr. Antonio V. Cruz (Building Official)",
      text: "Yes Sofia, the site inspection is set for tomorrow morning. Let's make sure the structural safety checklist is ready.",
      timestamp: new Date(Date.now() - 1 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  // Active staff presence set
  const activeStaff = new Set<string>();

  wss.on("connection", (ws) => {
    // Send initial chat history on connection
    ws.send(JSON.stringify({ type: "init", messages: chatHistory, activeStaff: Array.from(activeStaff) }));

    ws.on("message", (rawMessage) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        
        if (data.type === "message") {
          const newMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sender: data.sender || "Unknown Staff",
            text: data.text || "",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          // Store in history
          chatHistory.push(newMessage);
          if (chatHistory.length > 100) {
            chatHistory.shift();
          }

          // Broadcast to all clients
          const payload = JSON.stringify({ type: "message", message: newMessage });
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        } else if (data.type === "presence") {
          if (data.sender) {
            activeStaff.add(data.sender);
          }
          // Broadcast presence list
          const payload = JSON.stringify({ type: "presence", activeStaff: Array.from(activeStaff) });
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        } else if (data.type === "leave") {
          if (data.sender) {
            activeStaff.delete(data.sender);
          }
          // Broadcast presence list
          const payload = JSON.stringify({ type: "presence", activeStaff: Array.from(activeStaff) });
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          });
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      // A standard ws connection closed
    });
  });

  // Serve API routes first
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", activeStaffCount: activeStaff.size });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
