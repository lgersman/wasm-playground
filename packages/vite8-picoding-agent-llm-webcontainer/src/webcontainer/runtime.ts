import { WebContainer } from "@webcontainer/api";

let _instance: Promise<WebContainer> | null = null;

export function getWebContainer(): Promise<WebContainer> {
  if (!_instance) {
    _instance = WebContainer.boot({ workdirName: "app" });
  }
  return _instance;
}
