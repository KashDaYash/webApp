let cache = {
  id: null,
  username: null,
  first_name: null,
  last_name: null,
  photo_url: null,
  language_code: "en",
  is_premium: false,
  coins: 0
};

export default function handler(req, res) {
  if (req.method === "POST") {
    try {
      cache = {
        ...cache,
        ...req.body
      };
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Invalid user data" });
    }
  }

  if (req.method === "GET") {
    return res.status(200).json(cache);
  }

  return res.status(405).json({ error: "Method Not Allowed" });
    }
