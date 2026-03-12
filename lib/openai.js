import OpenAI from "openai";

let _openai;

export function getOpenAI() {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY muss als Environment Variable gesetzt sein");
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}
