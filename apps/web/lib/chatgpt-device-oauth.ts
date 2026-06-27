import { ChatGptDeviceOAuthClient, readChatGptOAuthEnv } from "@tamsi/ai";

export function createChatGptDeviceOAuthClient() {
  return new ChatGptDeviceOAuthClient(readChatGptOAuthEnv());
}
