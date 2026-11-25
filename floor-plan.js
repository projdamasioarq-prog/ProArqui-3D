(function(){
  "use strict";
  var WA="https://wa.me/5511947869761";
  var root=document.createElement("div");
  root.id="floorPlanApp";
  root.innerHTML=
    '<button type="button" class="floor-launch" id="floorLaunch"><span class="floor-launch-mark">⌖</span><span>Faça sua planta e envie</span></button>'+
    '<section class="floor-modal" id="floorModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="floorTitle">'+
      '<div class="floor-card">'+
        '<header class="floor-head"><div><p>PROARQUI 3D · ESTUDO INICIAL</p><h2 id="floorTitle">Desenhe sua planta</h2><span>Monte um esboço simples para entendermos sua ideia.</span></div><button type="button" class="floor-close" id="floorClose" aria-label="Fechar">×</button></header>'+
        '<div class="floor-tools"><label>Ferramenta<select id="floorTool"><option value="wall">Parede</option><option value="room">Cômodo</option><option value="door">Porta</option><option value="window">Janela</option><option value="erase">Apagar</option></select></label><button type="button" id="floorUndo">Desfazer</button><button type="button" id="floorClear">Limpar</button><span class="floor-hint">Clique e arraste para desenhar</span></div>'+
        '<div class="floor-canvas-wrap"><canvas id="floorCanvas" width="1200" height="650" aria-label="Área para desenhar a planta baixa"></canvas></div>'+
        '<p class="floor-help">Cada quadrícula representa aproximadamente 25 cm. As medidas são estimadas e servem apenas como referência inicial.</p>'+
        '<div class="floor-fields"><label>Seu nome<input id="floorName" type="text" placeholder="Nome"></label><label>WhatsApp<input id="floorPhone" type="tel" placeholder="(00) 00000-0000"></label><label>Cidade<input id="floorCity" type="text" placeholder="Sua cidade"></label><label>Tipo de projeto<select id="floorType"><option>Residencial</option><option>Comercial</option><option>Reforma</option><option>Interiores</option><option>Outro</option></select></label><label class="floor-wide">Observações<textarea id="floorNotes" rows="2" placeholder="Conte um pouco sobre o espaço e o que deseja fazer..."></textarea></label></div>'+
        '<footer class="floor-actions"><button type="button" class="floor-secondary" id="floorPng">Baixar planta em PNG</button><button type="button" class="floor-primary" id="floorSend">Continuar pelo WhatsApp</button></footer>'+
        '<p class="floor-disclaimer">Ao continuar, o WhatsApp será aberto com uma mensagem pronta. Anexe manualmente o PNG baixado para enviar seu desenho.</p>'+
      '</div>'+
    '</section>';
  document.body.appendChild(root);
  var modal=root.querySelector("#floorModal"), canvas=root.querySelector("#floorCanvas"), ctx=canvas.getContext("2d");
  var items=[], start=null, preview=null, tool=root.querySelector("#floorTool").value;
  var grid=25;
  function snap(v){return Math.round(v/grid)*grid;}
  function point(e){var r=canvas.getBoundingClientRect();return {x:snap((e.clientX-r.left)*canvas.width/r.width),y:snap((e.clientY-r.top)*canvas.height/r.height)};}
  function drawItem(c,it){
    c.save();c.lineCap="square";c.lineJoin="miter";
    if(it.type==="wall"){c.strokeStyle="#252521";c.lineWidth=9;c.beginPath();c.moveTo(it.x1,it.y1);c.lineTo(it.x2,it.y2);c.stroke();}
    if(it.type==="room"){c.fillStyle="rgba(201,170,112,.10)";c.strokeStyle="#8c7958";c.lineWidth=4;c.fillRect(it.x1,it.y1,it.x2-it.x1,it.y2-it.y1);c.strokeRect(it.x1,it.y1,it.x2-it.x1,it.y2-it.y1);if(it.label){c.fillStyle="#6c604d";c.font="22px Arial";c.textAlign="center";c.fillText(it.label,(it.x1+it.x2)/2,(it.y1+it.y2)/2);}}
    if(it.type==="door"){c.strokeStyle="#a77b45";c.lineWidth=5;c.beginPath();c.moveTo(it.x1,it.y1);c.lineTo(it.x2,it.y2);c.stroke();c.strokeStyle="#c9aa70";c.lineWidth=2;c.beginPath();c.arc(it.x1,it.y1,Math.hypot(it.x2-it.x1,it.y2-it.y1),0,Math.PI/2);c.stroke();}
    if(it.type==="window"){c.strokeStyle="#438b9b";c.lineWidth=8;c.beginPath();c.moveTo(it.x1,it.y1);c.lineTo(it.x2,it.y2);c.stroke();c.strokeStyle="#e4f4f5";c.lineWidth=2;c.beginPath();c.moveTo(it.x1,it.y1-5);c.lineTo(it.x2,it.y2-5);c.moveTo(it.x1,it.y1+5);c.lineTo(it.x2,it.y2+5);c.stroke();}
    c.restore();
  }
  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#fbfaf7";ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle="#e9e5dc";ctx.lineWidth=1;
    for(var x=0;x<=canvas.width;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
    for(var y=0;y<=canvas.height;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
    items.forEach(function(it){drawItem(ctx,it);});if(preview)drawItem(ctx,preview);
  }
  function open(){modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");document.body.classList.add("floor-open");render();}
  function close(){modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");document.body.classList.remove("floor-open");}
  root.querySelector("#floorLaunch").addEventListener("click",open);
  root.querySelector("#floorClose").addEventListener("click",close);
  modal.addEventListener("click",function(e){if(e.target===modal)close();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&modal.classList.contains("is-open"))close();});
  root.querySelector("#floorTool").addEventListener("change",function(e){tool=e.target.value;});
  canvas.addEventListener("pointerdown",function(e){if(!modal.classList.contains("is-open"))return;canvas.setPointerCapture(e.pointerId);start=point(e);preview={type:tool,x1:start.x,y1:start.y,x2:start.x,y2:start.y};render();});
  canvas.addEventListener("pointermove",function(e){if(!start)return;var p=point(e);preview.x2=p.x;preview.y2=p.y;render();});
  canvas.addEventListener("pointerup",function(){if(!start||!preview)return;var it=preview;preview=null;start=null;if(it.type==="erase"){var cx=(it.x1+it.x2)/2,cy=(it.y1+it.y2)/2;var idx=-1,dist=Infinity;items.forEach(function(v,i){var d=Math.hypot((v.x1+v.x2)/2-cx,(v.y1+v.y2)/2-cy);if(d<dist){dist=d;idx=i;}});if(idx>=0&&dist<70)items.splice(idx,1);}else if(Math.hypot(it.x2-it.x1,it.y2-it.y1)>8){items.push(it);}render();});
  root.querySelector("#floorUndo").addEventListener("click",function(){items.pop();render();});
  root.querySelector("#floorClear").addEventListener("click",function(){if(confirm("Apagar todo o desenho?")){items=[];render();}});
  function exportPng(){var out=document.createElement("canvas");out.width=canvas.width;out.height=canvas.height;var c=out.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,out.width,out.height);c.drawImage(canvas,0,0);c.fillStyle="#222";c.font="18px Arial";c.fillText("Estudo inicial de planta · ProArqui 3D",28,32);return out.toDataURL("image/png");}
  root.querySelector("#floorPng").addEventListener("click",function(){var a=document.createElement("a");a.href=exportPng();a.download="planta-inicial-proarqui.png";a.click();});
  root.querySelector("#floorSend").addEventListener("click",function(){
    if(!items.length){alert("Desenhe pelo menos um elemento na planta antes de continuar.");return;}
    var name=root.querySelector("#floorName").value.trim(),phone=root.querySelector("#floorPhone").value.trim(),city=root.querySelector("#floorCity").value.trim(),type=root.querySelector("#floorType").value,notes=root.querySelector("#floorNotes").value.trim();
    var msg="Olá, ProArqui 3D! Quero enviar meu estudo inicial de planta.\\n\\nNome: "+(name||"Não informado")+"\\nWhatsApp: "+(phone||"Não informado")+"\\nCidade: "+(city||"Não informada")+"\\nTipo: "+type+"\\nObservações: "+(notes||"Não informado")+"\\n\\nJá baixei a planta em PNG e vou anexá-la nesta conversa.";
    var a=document.createElement("a");a.href=exportPng();a.download="planta-inicial-proarqui.png";a.click();
    window.open(WA+"?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
  });
  render();
})();