export const ADMIN_PAGE = String.raw`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Attendance Admin</title>
<style>
body{font-family:system-ui,sans-serif;background:#0f1222;color:#eee;margin:0;padding:16px}
input,textarea,button{width:100%;box-sizing:border-box;padding:10px;margin:6px 0;border-radius:8px;border:1px solid #334;background:#1a1f3a;color:#eee;font-size:15px}
button{background:#6d4aff;border:0;font-weight:600}
.row{background:#1a1f3a;border-radius:8px;padding:10px;margin:8px 0;font-size:14px}
.k{font-family:monospace;color:#7dd3fc;margin:4px 0}
small{color:#9aa}
.b{display:inline-block;width:auto;padding:6px 10px;margin:6px 6px 0 0;font-size:13px}
</style></head><body>
<h2>Attendance Admin</h2>
<input id="t" type="password" placeholder="Admin token">
<h3>Naye students ki keys</h3>
<input id="pre" placeholder="Prefix" value="CLG">
<textarea id="st" rows="5" placeholder="roll,name  (har line me ek student)"></textarea>
<button onclick="mk()">Keys banao</button>
<button onclick="ls()">Sab keys dikhao</button>
<button onclick="cp()">List copy karo</button>
<div id="out"></div>
<script>
var last=[];
function api(path,body){
  return fetch(path,{method:"POST",headers:{"content-type":"application/json","x-admin":document.getElementById("t").value},body:JSON.stringify(body||{})}).then(function(r){return r.json()});
}
function btn(t,f){var b=document.createElement("button");b.className="b";b.textContent=t;b.onclick=f;return b}
function act(p,b){api(p,b).then(function(){ls()})}
function show(rows){
  var o=document.getElementById("out");o.innerHTML="";
  rows.forEach(function(x){
    var d=document.createElement("div");d.className="row";
    var h=document.createElement("div");h.textContent=x.roll+" - "+x.name;
    var k=document.createElement("div");k.className="k";k.textContent=x.key;
    d.appendChild(h);d.appendChild(k);
    if(x.hwid!==undefined){
      var s=document.createElement("small");
      s.textContent=(x.hwid?"Device bound":"Unused")+(x.paused?" | PAUSED":"");
      d.appendChild(s);d.appendChild(document.createElement("br"));
      d.appendChild(btn("Reset device",function(){act("/admin/reset",{key:x.key})}));
      d.appendChild(btn(x.paused?"Unpause":"Pause",function(){act("/admin/pause",{key:x.key,paused:!x.paused})}));
      d.appendChild(btn("Delete",function(){if(confirm("Delete?"))act("/admin/delete",{key:x.key})}));
    }
    o.appendChild(d);
  });
}
function mk(){
  var lines=document.getElementById("st").value.split("\n").map(function(s){return s.trim()}).filter(Boolean);
  var students=lines.map(function(l){var i=l.indexOf(",");return i<0?{roll:l,name:l}:{roll:l.slice(0,i).trim(),name:l.slice(i+1).trim()}});
  api("/admin/create",{prefix:document.getElementById("pre").value,students:students}).then(function(d){
    if(d.error){alert(d.error);return}
    last=d;show(d);
  });
}
function ls(){
  api("/admin/list").then(function(d){
    if(d.error){alert(d.error);return}
    last=d.keys;show(d.keys);
  });
}
function cp(){
  var t=last.map(function(x){return x.roll+","+x.name+","+x.key}).join("\n");
  navigator.clipboard.writeText(t).then(function(){alert("Copied")});
}
</script></body></html>`;
