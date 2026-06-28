import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import { SocketIOProvider } from "y-socket.io";
import * as Y from "yjs";

function App() {
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const editorRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || "";
  });

  const [editorReady, setEditorReady] = useState(false);

  const handleMount = (editor) => {
    editorRef.current = editor;
    setEditorReady(true);
  };

  const handleJoin = (e) => {
    e.preventDefault();

    const name = e.target.username.value.trim();

    if (!name) return;

    setUsername(name);
    window.history.pushState({}, "", `?username=${name}`);
  };

  useEffect(() => {
    if (!username || !editorReady || !editorRef.current) return;

    const provider = new SocketIOProvider(
      "http://localhost:3000",
      "monaco",
      ydoc,
      {
        autoConnect: true,
      }
    );

    providerRef.current = provider;

    bindingRef.current = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    
    provider.awareness.setLocalStateField("user", {
      name: username,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    });

    provider.awareness.on("Change", () => {
      const states = Array.from(provider.awareness.getStates().values())
      setUsers(states.map(state => state.user).filter(user => Boolean(user.username)));
     })

    return () => {
      bindingRef.current?.destroy?.();
      providerRef.current?.destroy();
    };
  }, [username, editorReady, ydoc, yText]);

  if (!username) {
    return (
      <main className="h-screen w-full flex items-center justify-center bg-gray-950">
        <form
          onSubmit={handleJoin}
          className="bg-neutral-900 p-6 rounded-xl flex flex-col gap-4 w-80"
        >
          <h1 className="text-white text-2xl font-bold text-center">
            Join Room
          </h1>

          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            className="p-3 rounded-lg outline-none bg-white text-black"
            required
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen p-2 bg-gray-950 flex gap-4">
      <aside className="w-1/4 bg-neutral-900 rounded-lg p-4 text-white">
        <h2 className="text-xl font-bold">Users</h2>
        <p className="mt-2">👤 {username}</p>
      </aside>

      <section className="w-3/4 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue="// Start coding..."
          theme="vs-dark"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;