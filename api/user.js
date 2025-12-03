let cache = {};

export default function handler(req, res){
  if(req.method === "POST"){
    cache = req.body;
    return res.status(200).json({ok:true});
  }
  if(req.method === "GET"){
    return res.status(200).json(cache);
  }
}
