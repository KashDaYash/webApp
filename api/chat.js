let lastMsg = "";

export default function handler(req, res){
  if(req.method === "POST"){
    lastMsg = req.body.msg;
    return res.json({ok:true});
  }
  if(req.method === "GET"){
    return res.json({msg:lastMsg});
  }
}
