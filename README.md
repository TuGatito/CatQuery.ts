# 🐱 CatQuery.ts

**CatQuery** is an ultra-lightweight, modern TypeScript library specifically designed for applications using **WebUI** and **C**. It provides a jQuery-like developer experience powered by **Reactive Stores**, a native **WebUI Bridge**, and flicker-free DOM manipulation.



## ✨ Key Features

* **Featherweight**: A single `.ts` file with zero external dependencies.
* **jQuery-like Syntax**: Effortless element selection, creation, and styling via method chaining (`.addClass()`, `.append()`, `.on()`, etc.).
* **Reactive CatStore**: Bind your application state to DOM elements. When the state changes, the UI updates automatically.
* **WebUI Native Bridge**: Built-in methods to communicate between TypeScript and your C backend transparently.
* **Flicker-Free DOM**: Intelligent HTML updates using `DOMParser` and node comparison to prevent unnecessary re-renders.

## 🚀 Installation

Simply download the `CatQuery.ts` file and import it into your project:

```typescript
import { cq, CatStore } from './CatQuery';

```

## 🛠️ Usage Examples

### 1. DOM Manipulation

```typescript
cq("#my-button")
  .addClass("btn-primary")
  .text("Click Me!")
  .click(() => console.log("Meow!"));

```

### 2. Reactivity with CatStore

```typescript
const MyStore = new CatStore({ count: 0 });

// The UI will update automatically whenever 'count' changes
cq("#counter").bind(MyStore, (state) => `
  <div>Current count: ${state.count}</div>
`);

```

### 3. C & WebUI Integration

```typescript
// Inject the webui.js script automatically
cq().initWebUI();

// Expose a function for C to call from the backend
cq().bridgeToWebUI("update_status", (msg: string) => {
    console.log("C says:", msg);
});

// Call a function defined in your C code
cq().callWebUI("save_settings", { theme: "dark" });

```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
