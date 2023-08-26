export class BookmarkCounter {
  state: DurableObjectState;

  constructor(state: DurableObjectState, _: Env) {
    this.state = state;
  }

  async fetch(request: Request) {
    let url = new URL(request.url);
    let value: number = (await this.state.storage.get("value")) || 0;

    switch (url.pathname) {
      case "/increment":
        ++value;
        break;
      case "/decrement":
        --value;
        break;
      case "/":
        break;
      default:
        return new Response("Not found", { status: 404 });
    }

    await this.state.storage?.put("value", value);

    return new Response(value.toString());
  }
}
