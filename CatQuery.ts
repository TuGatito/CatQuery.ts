type CatQuerySelector = string;
type CatQueryElementType = keyof HTMLElementTagNameMap;

type VoidCallback = (element: HTMLElement) => void;
type NodeCallback = (node: Element) => void;
type EachCallback = (index: number, element: Element) => void;
type CatEventListener = (this: HTMLElement, event: Event) => any;

type CatListener<T> = (newValue: T) => void;

class CatStore<T extends object> {
  private listeners = new Set<CatListener<T>>();
  public state: T;
  private storageKey: string | null;

  constructor(initialState: T, storageKey: string | null = null) {
    this.storageKey = storageKey;
    
    const savedState = storageKey ? localStorage.getItem(storageKey) : null;
    const baseState = savedState ? JSON.parse(savedState) : initialState;

    this.state = new Proxy(baseState, {
      set: (target, key, value) => {
        (target as any)[key] = value;
        
        if (this.storageKey) {
          localStorage.setItem(this.storageKey, JSON.stringify(target));
        }
        
        this.notify();
        return true;
      }
    });
  }

  subscribe(listener: CatListener<T>) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

class CatQuery {
  private createdElement: HTMLElement | null;
  private selectedNodes: NodeListOf<Element> | null;
  private debugging: boolean;

  constructor(selector?: CatQuerySelector ) {
    this.createdElement = null;
    this.selectedNodes = null;
    this.debugging = false;

    if (!selector || typeof selector !== 'string') return;

 
    this.selectedNodes = document.querySelectorAll(selector);
  }

  private onDebugging(message: string): void {
    if (this.debugging) console.log(message);
  }

  private forCreatedElementDo(callback: VoidCallback, debugMessage: string): void {
    if (this.createdElement && this.createdElement instanceof HTMLElement) {
      this.onDebugging(debugMessage);
      callback(this.createdElement);
    }
  }

  private forEachNodeDo(callback: NodeCallback, debugMessage: string): void {
    if (this.selectedNodes) {
      for (let i = 0; i < this.selectedNodes.length; i++) {
        const node = this.selectedNodes[i];
        this.onDebugging(debugMessage)
        callback(node);
      }
    }
  }

  debug(): CatQuery {
    this.debugging = !this.debugging;
    return this;
  }

  addClass(...classTokens: string[]): CatQuery {
    this.forCreatedElementDo(element => {
      element.classList.add(...classTokens);
    }, "Adding css class to your created element.");

      this.forEachNodeDo(node => {
        node.classList.add(...classTokens);
    }, "Adding css class to the selected element");
    
    return this;
  }

  after(node: string | Node): CatQuery {
    this.forCreatedElementDo(element => element.after(node), "After node: " + node + " to your created element.");
    this.forEachNodeDo(currentNode => currentNode.after(node), "After node: " + node + " to the selected element.");
    return this;
  }

  append(node: string | Node): CatQuery {
    this.forCreatedElementDo(element => element.append(node), "Append node: " + node + " to your created element");
    this.forEachNodeDo(currentNode => currentNode.append(node), "Append node: " + node + " to the selected element");
    return this;
  }

  before(node: Node | string): CatQuery {
    this.forCreatedElementDo(element => element.before(node), "Before node: " + node + " to your created element");
    this.forEachNodeDo(currentNode => currentNode.before(node), "Before node: " + node + " to the selected element");
    return this;
  }

  children(): HTMLCollection[] {
    let elements: HTMLCollection[] = [];
    this.forCreatedElementDo(element => elements.push(element.children), "Getting created element children.");
    this.forEachNodeDo(currentNode => elements.push(currentNode.children), "Getting selected nodes children.");
    return elements;
  }

  clone(): Node[] {
    const nodes: Node[] = [];
    this.forCreatedElementDo(element => nodes.push(element.cloneNode(true)), "Cloning created element.");
    this.forEachNodeDo(currentNode => nodes.push(currentNode.cloneNode(true)), "Cloning selected nodes.");
    return nodes;
  }

  closest(selector: CatQueryElementType): HTMLElement[] {
    const closest: HTMLElement[] | any = [];
    this.forCreatedElementDo(element => closest.push(element.closest(selector)), "Getting closest of created element.");
    this.forEachNodeDo(currentNode => closest.push(currentNode.closest(selector)), "Getting closest of selected nodes.")
    return closest;
  }

  create(tagName: CatQueryElementType): CatQuery {
    this.createdElement = document.createElement(tagName);
    return this;
  }
  
  contains(node: Node): boolean {
    let contains: boolean = false;
    this.forCreatedElementDo(element => contains = element.contains(node), "Checking if created element contains");
    this.forEachNodeDo(currentNode => contains = currentNode.contains(node), "Checking if selected ndoes contains");
    return contains;
  }

  containsText(textContent: string): boolean {
    let contains: boolean | undefined = false;
    this.forCreatedElementDo(element => {
      [...element.childNodes].filter(element => contains = element.textContent?.includes(textContent))
    }, "Cheking if created element contains text.");
    this.forEachNodeDo(currentNode => {
      [...currentNode.childNodes].filter(element => contains = element.textContent?.includes(textContent))
    }, "Cheking if selected nodes contains text.");
    return contains;
  }

  getCreatedElement<ElementType>(): ElementType {
    return this.createdElement as ElementType;
  }

  contents(): Node[] {
    const nodes: Node[] = [];
    this.forCreatedElementDo(element => nodes.push(...[...element.childNodes]), "Getting created element contents.");
    this.forEachNodeDo(currentNode => nodes.push(...[...currentNode.childNodes]), "Getting selected nodes contents.");
    return nodes;
  }

  each(callback: EachCallback): CatQuery {
    if (this.selectedNodes) {
      for (let index = 0; index < this.selectedNodes.length; index++) {
        const node = this.selectedNodes[index];
        callback(index, node);
      }
    }
    return this;
  }

  empty(): CatQuery {
    this.forCreatedElementDo(element => element.replaceChildren(), "Empty created element.");
    this.forEachNodeDo(currentNode => currentNode.replaceChildren(), "Empty selected nodes.");
    return this;
  }

  filter(predicate: (value: Element, index: number, array: Element[]) => Element): Element[] {
    const filtered: Element[] = [];
    if (this.selectedNodes) {
      filtered.push(...[...this.selectedNodes].filter(predicate));
    }
    return filtered;
  }

  find(selector: string): Element[] {
    const elements: Element[] = [];
    this.forEachNodeDo(currentNode => {
      elements.push(...[...currentNode.querySelectorAll(`:scope ${selector}`)]);
    }, "Finding elements in selected nodes");
    return elements;
  }

  attr(qualifiedName: string, value?: string): string[] | CatQuery {
    if (value) {
      this.forCreatedElementDo(element => element.setAttribute(qualifiedName, value), "Setting attribute to created element.");
      this.forEachNodeDo(currentNode => currentNode.setAttribute(qualifiedName, value), "Setting attribute to selected nodes.");
      return this;
    }

    const attributes: string[] = [];
    this.forEachNodeDo(currentNode => {
      const attr = currentNode.getAttribute(qualifiedName);
      if (typeof attr === 'string') attributes.push(attr);
    }, "Getting attribute from selected nodes.");
    return attributes
  }

  height(): number[] {
    const heights: number[] = [];
    this.forEachNodeDo(currentNode => {
      const height = currentNode.getBoundingClientRect().height;
      heights.push(height);
    }, "Getting selected nodes heights.");
    return heights;
  }

  html(htmlText?: string, adding?: boolean): string[] | CatQuery {
    if (htmlText) {
      const parser = new DOMParser();
      const newDoc = parser.parseFromString(htmlText, 'text/html');
      // Usamos childNodes para capturar TODO lo que venga en el string
      const newNodes = Array.from(newDoc.body.childNodes);

      const updateAction = (element: Element) => {
        if (adding) {
          newNodes.forEach(node => element.appendChild(node.cloneNode(true)));
        } else {
          if (element.innerHTML !== htmlText) {
            element.replaceChildren(...newNodes.map(node => node.cloneNode(true)));
          }
        }
      };
      this.forCreatedElementDo(updateAction, "Setting HTML to created element.");
      this.forEachNodeDo(updateAction, "Setting HTML to selected nodes.");
      return this;
    }

    const htmls: string[] = [];

    this.forCreatedElementDo(element => {
      const html = element.innerHTML;
      htmls.push(html);
    }, "Getting created element html");

    this.forEachNodeDo(currentNode => {
      const html = currentNode.innerHTML;
      htmls.push(html);
    }, "Getting selected nodes html.");

    return htmls;
  }

  css(ruleName: keyof CSSStyleDeclaration): any[] {
    const styles: any[] = [];
    this.forEachNodeDo(currentNode => {
      const style = getComputedStyle(currentNode);
      styles.push(style[ruleName]);
    }, "Getting styles from selected nodes.");
    return styles;  
  }

  text(newText?: string): string[] | CatQuery {
    if (newText) {
      this.forCreatedElementDo(element => element.textContent = newText, "Setting text to created element.");
      this.forEachNodeDo(currentNode => currentNode.textContent = newText, "Setting text to selected nodes.");
      return this;
    }

    const allText: string[] = [];
    this.forEachNodeDo(currentNode => allText.push(currentNode.textContent), "Getting selected nodes text.");
    return allText;
  }

  width(): number[] {
    const widths: number[] = [];
    this.forCreatedElementDo(element => widths.push(element.getBoundingClientRect().width), "Getting created element width.");
    this.forEachNodeDo(currentNode => widths.push(currentNode.getBoundingClientRect().width), "Getting selected nodes width.");
    return widths;
  }

  index(): number[] {
    const i: number[] = [];
    this.forCreatedElementDo(element => {
      const children = element.parentNode?.children;
      if (children) {
        const index = [...children].indexOf(element);
        i.push(index);
      }
    }, "Getting index of created element.");
    this.forEachNodeDo(currentNode => {
      const children = currentNode.parentNode?.children;
      if (children) {
        const index = [...children].indexOf(currentNode);
        i.push(index);
      }
    }, "Getting index of seleted elements.");
    return i;
  }

  innerHeight(): number[] {
    const heights: number[] = [];
    this.forEachNodeDo((currentNode) => {
      const height = currentNode.clientHeight;
      heights.push(height);
    }, "Getting innerHEights of seleted nodes.");
    return heights;
  } 

  innerWidth(): number[] {
    const widths: number[] = [];
    this.forEachNodeDo((currentNode) => {
      const height = currentNode.clientWidth;
      widths.push(height);
    }, "Getting innerWidths of seleted nodes.");
    return widths;
  } 

  siblings(): Element[] {
    const elements: Element[] = [];
    this.forEachNodeDo(currentNode => {
      const childrens: Element[] = [...currentNode.children].filter(child => child !== currentNode);
      elements.push(...childrens);
    }, "Getting selected nodes siblings.");
    return elements;
  }

  //-------------------------------------- Events -------------------------------------------------------
  click(listener: EventListenerOrEventListenerObject): CatQuery {
    this.forCreatedElementDo(element => {
      element.addEventListener("click", listener);
    }, "Adding click event to created element.");

    this.forEachNodeDo(currentNode => {
      currentNode.addEventListener("click", listener);
    }, "Adding click event to selected nodes.");
    return this;
  }

  off(type: keyof HTMLElementEventMap, listener: CatEventListener): CatQuery {
    this.forCreatedElementDo(element => {
      element.removeEventListener(type, listener);
    }, "Removing event to created element.");

    this.forEachNodeDo(currentNode => {
      currentNode.removeEventListener(type, listener);
    }, "Removing event to selected nodes.");
    return this;
  }

  on(type: keyof HTMLElementEventMap, listener: CatEventListener): CatQuery {
    this.forCreatedElementDo(element => {
      element.addEventListener(type, listener);
    }, "Adding event to created element.");

    this.forEachNodeDo(currentNode => {
      currentNode.addEventListener(type, listener);
    }, "Adding event to selected nodes.");
    return this;
  }

  trigger(eventName: string, data?: Object): CatQuery {
    this.forCreatedElementDo(elment => {
      const customEvent = new CustomEvent(eventName, data);
      elment.dispatchEvent(customEvent);
    }, "Triggering custom event on created element.");
    this.forEachNodeDo(currentNode => {
      const customEvent = new CustomEvent(eventName, data);
      currentNode.dispatchEvent(customEvent);
    }, "Triggering custom event on selected nodes.");
    return this;
  }

  // --------------------------------- Fetch ---------------------------------
  async getJSON(url: string, callback: (data: any) => void): Promise<CatQuery> {
    const response = await fetch(url);
    await response.json().then(data => callback(data));

    return this;
  }

  async load(url: string,): Promise<CatQuery> {
    const response = await fetch(url);
    await response.text().then(html => {
      this.forCreatedElementDo(element => element.innerHTML = html, "Loading html to created element.");
      this.forEachNodeDo(currentNode => currentNode.innerHTML = html, "Loading html to selected nodes.");
    });
    return this;
  }

  async post(url: string, data: Object): Promise<CatQuery> {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
      });
    return this;
  }

  async get(url: string, success: (resp: Response) => void, error: () => void): Promise<CatQuery> {
    const response = await fetch(url);
    if (!response.ok) {
      error();
    }
    success(response);
    return this;
  }

  // ------------------ WEBUI ------------------
  async initWebUI(callback?: () => void): Promise<CatQuery> {
    if (document.querySelector('script[src="webui.js"]')) {
      this.onDebugging("WebUI script already exists.");
      return this;
    }
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'webui.js';
      script.onload = () => {
        if (callback) callback();
          resolve(this);
        };
      document.head.appendChild(script);
    });
  }

  bridgeToWebUI(name: string, callback: (...args: any[]) => void): CatQuery {
    // Registramos en el objeto global para que C pueda 'verlo'
    (window as any)[name] = (...args: any[]) => {
        this.onDebugging(`C called JS function: ${name}`);
        return callback(...args);
    };
    return this;
  }
  async callWebUI(funcName: string, ...args: any[]): Promise<any> {
    if ((window as any).webui) {
        return await (window as any).webui.call(funcName, ...args);
    }
    console.error("WebUI no está disponible.");
  }

  // -------------------- Components --------------------
  bind<T extends object>(store: CatStore<T>, renderFn: (state: T) => string): CatQuery {
    store.subscribe((state) => {
        const newHTML = renderFn(state);
    this.html(newHTML); 
    });
    return this;
  }
}

export function cq(need?: CatQuerySelector): CatQuery {
  return new CatQuery(need);
}