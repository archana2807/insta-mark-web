// Local stand-in for the Resend API (the sealed test env points RESEND_BASE_URL here).
// Records every email the app tries to send; can be told to fail some of them.
import http from "node:http";
import { TEST_MAIL_PORT } from "./env.js";

/**
 * @typedef {{ from: string, to: string[], subject: string, html?: string, text?: string, reply_to?: string }} SentMail
 */

/**
 * Starts the mock on 127.0.0.1 only.
 * @returns {Promise<{ sent: SentMail[], failWhen: (fn: (mail: SentMail) => boolean) => void, close: () => Promise<void> }>}
 */
export async function startMailMock() {
  const sent = [];
  let shouldFail = () => false;
  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const mail = raw ? JSON.parse(raw) : {};
      mail.to = [].concat(mail.to ?? []);
      sent.push(mail);
      const fail = req.url === "/emails" && shouldFail(mail);
      res.writeHead(fail ? 500 : 200, { "content-type": "application/json" });
      res.end(
        JSON.stringify(
          fail
            ? { statusCode: 500, name: "application_error", message: "mock failure" }
            : { id: `mock-${sent.length}` },
        ),
      );
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(TEST_MAIL_PORT, "127.0.0.1", resolve);
  });
  return {
    sent,
    failWhen: (fn) => {
      shouldFail = fn;
    },
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
