import { en } from "../context/language-ctx";
import { message } from "antd";

let counter = 1;

export default class Notification {
  private id = counter++;
  private style = {};
  constructor(position: "default" | "bottom-right" = "default") {
    if (position === "bottom-right") this.style = { position: "fixed", bottom: 0, right: 0 };
  }

  loading(content = en ? "Loading..." : "Chargement...") {
    message.loading({ content, key: this.id, duration: 0, style: this.style });
  }

  success(content = en ? "Success!" : "Succès !") {
    message.success({
      content,
      key: this.id,
      style: this.style,
    });
  }

  /** Notifies user of error and logs error to console */
  error(error: any) {
    console.error(error);
    // Due to Firefox throwing TypeErrors on aborted network requests, we don't show TypeErrors to the user
    if (error instanceof TypeError) return;
    message.error({
      content: "Error: " + error,
      key: this.id,
      duration: 0,
      style: { ...this.style, cursor: "pointer" },
      onClick: () => message.destroy(this.id),
    });
  }

  warning(content: string) {
    message.warning({ content, key: this.id, style: this.style });
  }

  close() {
    message.destroy(this.id);
  }
}
