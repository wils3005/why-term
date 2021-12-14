export const createWebSocket = () => {
  const ws = new WebSocket("ws://127.0.0.1:49425/api");

  ws.onopen = (event) => console.debug("WEBSOCKET OPEN", { event });

  ws.onmessage = (event) => {
    console.debug("WEBSOCKET MESSAGE", { event });
    const body = document.querySelector("main");
    const pre = document.createElement("pre");
    pre.textContent = event.data;
    body.append(pre);
    pre.scrollIntoView();
  };

  ws.onerror = (event) => {
    console.debug("WEBSOCKET ERROR", { event });
    event.target.close();
  };

  ws.onclose = (event) => {
    console.debug("WEBSOCKET CLOSE", { event });
    webSocket = createWebSocket();
  };

  return ws;
};

let webSocket = createWebSocket();

document.querySelector("form").onsubmit = (submitEvent) => {
  console.debug("FORM SUBMIT", { submitEvent });
  submitEvent.preventDefault();
  const inputElement = document.querySelector("input");
  webSocket.send(inputElement.value);
  inputElement.value = "";
};

export {};
