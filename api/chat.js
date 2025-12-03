let lastUserMsg = "";
let lastOwnerMsg = "";

export default function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { msg, from } = req.body;

      if (from === "owner") {
        lastOwnerMsg = msg;
      } else {
        lastUserMsg = msg;
      }

      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Invalid chat data" });
    }
  }

  if (req.method === "GET") {
    return res.status(200).json({
      user: lastUserMsg,
      owner: lastOwnerMsg
    });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
        }
