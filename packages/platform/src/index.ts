// Capabilities that differ between the web and the future desktop shell.
// Each shell provides its own implementation and injects it into @hopback/app.
export interface Platform {
  openExternal(url: string): void;
  notify(title: string, body?: string): void;
}
