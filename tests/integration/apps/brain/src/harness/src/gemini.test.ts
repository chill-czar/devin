import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  createOpenAIClient,
  isGeminiActive,
  resolveOpenAIModel,
} from "@harness/openai.js";
import { isSecretExfilShellCommand } from "@harness/trust.js";
import { resolveBrainAgentModel } from "@devin/types";

describe("Gemini integration", () => {
  const origOpenAiKey = process.env.OPENAI_API_KEY;
  const origGeminiKey = process.env.GEMINI_API_KEY;
  const origOpenAiModel = process.env.OPENAI_MODEL;
  const origGeminiModel = process.env.GEMINI_MODEL;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.GEMINI_MODEL;
  });

  afterEach(() => {
    if (origOpenAiKey !== undefined) process.env.OPENAI_API_KEY = origOpenAiKey;
    else delete process.env.OPENAI_API_KEY;
    if (origGeminiKey !== undefined) process.env.GEMINI_API_KEY = origGeminiKey;
    else delete process.env.GEMINI_API_KEY;
    if (origOpenAiModel !== undefined)
      process.env.OPENAI_MODEL = origOpenAiModel;
    else delete process.env.OPENAI_MODEL;
    if (origGeminiModel !== undefined)
      process.env.GEMINI_MODEL = origGeminiModel;
    else delete process.env.GEMINI_MODEL;
  });

  it("detects when Gemini is active", () => {
    expect(isGeminiActive()).toBe(false);
    process.env.GEMINI_API_KEY = "test-gemini-key";
    expect(isGeminiActive()).toBe(true);
    process.env.OPENAI_API_KEY = "test-openai-key";
    expect(isGeminiActive()).toBe(false);
  });

  it("resolves default model to gemini-3.8-flash when GEMINI_API_KEY is present", () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    expect(resolveOpenAIModel()).toBe("gemini-3.8-flash");
  });

  it("respects GEMINI_MODEL override", () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_MODEL = "gemini-3.1-pro-preview";
    expect(resolveOpenAIModel()).toBe("gemini-3.1-pro-preview");
  });

  it("configures OpenAI client with Gemini baseURL when GEMINI_API_KEY is set", () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    const client = createOpenAIClient();
    expect(client.apiKey).toBe("test-gemini-key");
    expect(client.baseURL).toContain("generativelanguage.googleapis.com");
  });

  it("resolves Gemini models in @devin/types", () => {
    expect(resolveBrainAgentModel("gemini-3.8-flash")).toBe("gemini-3.8-flash");
    expect(resolveBrainAgentModel("gemini-3.1-pro-preview")).toBe(
      "gemini-3.1-pro-preview",
    );
    expect(resolveBrainAgentModel("gemini-3.7-flash")).toBe("gemini-3.7-flash");
    expect(resolveBrainAgentModel("gemini-3.5-flash-lite")).toBe(
      "gemini-3.5-flash-lite",
    );
  });

  it("blocks GEMINI_API_KEY shell exfiltration in trust filter", () => {
    expect(isSecretExfilShellCommand("echo $GEMINI_API_KEY")).toBe(true);
    expect(isSecretExfilShellCommand("printenv GEMINI_API_KEY")).toBe(true);
  });
});
