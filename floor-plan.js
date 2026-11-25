(function(){
  "use strict";
  var WA="https://wa.me/5511947869761";
  var root=document.createElement("div");
  root.id="floorPlanApp";
  root.innerHTML=
    '<button type="button" class="floor-launch" id="floorLaunch"><span class="floor-launch-mark">⌖</span><span>Faça sua planta e envie</span></button>'+
    '<section class="floor-modal" id="floorModal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="floorTitle"><div class="floor-card">'+
    '<header class="floor-head"><div><p>PROARQUI 3D · ESTUDO INICIAL</p><h2 id="floorTitle">Desenhe sua planta</h2><span>Monte um esboço simples para entendermos sua ideia.</span></div><button type="button" class="floor-close" id="floorClose" aria-label="Fechar">×</button></header>'+
    '<div class="floor-tools"><label>Ferramenta<select id="floorTool"><option value="wall">Parede</option><option value="room">Cômodo</option><option value="door">Porta</option><option value="window">Janela</option><option value="furniture">Mobiliário</option><option value="text">Texto</option><option value="erase">Apagar</option></select></label>'+
    '<label id="furniturePickerWrap" class="floor-furniture-picker" hidden>Móvel<select id="furniturePicker"><optgroup label="Sala de estar"><option value="sofa">Sofá</option><option value="armchair">Poltrona</option><option value="tv">Rack / painel de TV</option><option value="coffee">Mesa de centro</option></optgroup><optgroup label="Sala de jantar"><option value="dining">Mesa de jantar</option><option value="sideboard">Aparador</option></optgroup><optgroup label="Cozinha"><option value="kitchen">Bancada</option><option value="sink">Pia</option><option value="stove">Fogão</option><option value="fridge">Geladeira</option></optgroup><optgroup label="Quarto"><option value="bed-double">Cama de casal</option><option value="bed-single">Cama de solteiro</option><option value="wardrobe">Guarda-roupa</option><option value="nightstand">Criado-mudo</option><option value="desk">Escrivaninha</option></optgroup><optgroup label="Banheiro"><option value="toilet">Vaso sanitário</option><option value="bath-sink">Lavatório</option><option value="shower">Box de banho</option></optgroup><optgroup label="Lavanderia"><option value="washer">Máquina de lavar</option><option value="laundry-tank">Tanque</option></optgroup><optgroup label="Escritório"><option value="office-desk">Mesa de trabalho</option><option value="office-chair">Cadeira</option><option value="shelf">Estante</option></optgroup></select></label>'+
    '<button type="button" id="floorUndo">Desfazer</button><button type="button" id="floorClear">Limpar</button><span class="floor-hint">Paredes: clique e arraste · Portas e janelas: clique na parede para inserir; selecione para editar e arraste para reposicionar</span></div>'+
    '<div class="floor-canvas-wrap"><canvas id="floorCanvas" width="1200" height="650" aria-label="Área para desenhar a planta baixa"></canvas></div>'+
    '<section class="floor-inspector" id="floorInspector" hidden><strong>Editar elemento selecionado</strong><label>Largura (m)<input id="editWidth" type="number" min="0.10" step="0.10"></label><label>Altura (m)<input id="editHeight" type="number" min="0.10" step="0.10"></label><label id="editSillWrap">Peitoril (m)<input id="editSill" type="number" min="0" step="0.10"></label><label id="editSwingWrap">Giro da porta<select id="editSwing"><option value="1">Para dentro</option><option value="-1">Para fora</option></select></label><button type="button" id="applyObjectEdit">Aplicar medidas</button><button type="button" id="deleteObject">Excluir elemento</button></section>'+
    '<p class="floor-help">Cada quadrícula representa 0,10 m. As cotas ficam do lado externo das paredes. Para portas e janelas, informe as dimensões quando solicitado e depois arraste o elemento pela parede. Móveis são símbolos 2D leves e esquemáticos.</p>'+
    '<div class="floor-fields"><label>Seu nome<input id="floorName" type="text" placeholder="Nome"></label><label>WhatsApp<input id="floorPhone" type="tel" placeholder="(00) 00000-0000"></label><label>Cidade<input id="floorCity" type="text" placeholder="Sua cidade"></label><label>Tipo de projeto<select id="floorType"><option>Residencial</option><option>Comercial</option><option>Reforma</option><option>Interiores</option><option>Outro</option></select></label><label class="floor-wide">Observações<textarea id="floorNotes" rows="2" placeholder="Conte um pouco sobre o espaço e o que deseja fazer..."></textarea></label></div>'+
    '<footer class="floor-actions"><button type="button" class="floor-secondary" id="floorPng">Baixar planta em PNG</button><button type="button" class="floor-primary" id="floorSend">Continuar pelo WhatsApp</button></footer>'+
    '<p class="floor-disclaimer">Ao continuar, o WhatsApp será aberto com uma mensagem pronta. Anexe manualmente o PNG baixado para enviar seu desenho.</p></div></section>';
  document.body.appendChild(root);
  var modal=root.querySelector("#floorModal"),canvas=root.querySelector("#floorCanvas"),ctx=canvas.getContext("2d");
  var toolSelect=root.querySelector("#floorTool"),furniturePicker=root.querySelector("#furniturePicker"),furnitureWrap=root.querySelector("#furniturePickerWrap"),inspector=root.querySelector("#floorInspector");
  var items=[],start=null,preview=null,dragItem=null,selectedItem=null,tool=toolSelect.value,grid=10,metersPerGrid=.10;
  var furniture={
    "sofa":{label:"Sofá",w:2.0,h:.85},"armchair":{label:"Poltrona",w:.85,h:.85},"tv":{label:"Rack / TV",w:1.8,h:.35},"coffee":{label:"Mesa de centro",w:1.0,h:.6},
    "dining":{label:"Mesa de jantar",w:1.6,h:1.0},"sideboard":{label:"Aparador",w:1.4,h:.4},
    "kitchen":{label:"Bancada",w:1.8,h:.6},"sink":{label:"Pia",w:1.2,h:.6},"stove":{label:"Fogão",w:.6,h:.6},"fridge":{label:"Geladeira",w:.7,h:.7},
    "bed-double":{label:"Cama casal",w:1.9,h:1.4},"bed-single":{label:"Cama solteiro",w:1.9,h:.9},"wardrobe":{label:"Guarda-roupa",w:1.8,h:.6},"nightstand":{label:"Criado-mudo",w:.5,h:.45},"desk":{label:"Escrivaninha",w:1.2,h:.6},
    "toilet":{label:"Vaso sanitário",w:.7,h:.7},"bath-sink":{label:"Lavatório",w:.7,h:.5},"shower":{label:"Box",w:.9,h:.9},
    "washer":{label:"Máquina de lavar",w:.65,h:.65},"laundry-tank":{label:"Tanque",w:.7,h:.55},
    "office-desk":{label:"Mesa de trabalho",w:1.4,h:.7},"office-chair":{label:"Cadeira",w:.55,h:.55},"shelf":{label:"Estante",w:1.2,h:.35}
  };
  function snap(v){return Math.round(v/grid)*grid;}
  function point(e){var r=canvas.getBoundingClientRect();return {x:snap((e.clientX-r.left)*canvas.width/r.width),y:snap((e.clientY-r.top)*canvas.height/r.height)};}
  function measure(it){return Math.hypot(it.x2-it.x1,it.y2-it.y1)/grid*metersPerGrid;}
  function bounds(){var walls=items.filter(function(i){return i.type==="wall";});if(!walls.length)return {cx:canvas.width/2,cy:canvas.height/2};var xs=[],ys=[];walls.forEach(function(w){xs.push(w.x1,w.x2);ys.push(w.y1,w.y2);});return {cx:(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2,cy:(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2};}
  function drawDimension(c,it){
    if(it.type!=="wall")return;
    var dx=it.x2-it.x1,dy=it.y2-it.y1,len=Math.hypot(dx,dy);if(len<grid)return;
    var nx=-dy/len,ny=dx/len,midX=(it.x1+it.x2)/2,midY=(it.y1+it.y2)/2,center=bounds();
    if(nx*(midX-center.cx)+ny*(midY-center.cy)<0){nx=-nx;ny=-ny;}
    var offset=42,ax=it.x1+nx*offset,ay=it.y1+ny*offset,bx=it.x2+nx*offset,by=it.y2+ny*offset;
    c.save();c.strokeStyle="#b18443";c.fillStyle="#76572e";c.lineWidth=1;
    c.setLineDash([3,3]);c.beginPath();c.moveTo(it.x1+nx*7,it.y1+ny*7);c.lineTo(ax,ay);c.moveTo(it.x2+nx*7,it.y2+ny*7);c.lineTo(bx,by);c.stroke();c.setLineDash([]);
    c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();
    var tick=4,tx=-dy/len,ty=dx/len;c.beginPath();c.moveTo(ax-tx*tick,ay-ty*tick);c.lineTo(ax+tx*tick,ay+ty*tick);c.moveTo(bx-tx*tick,by-ty*tick);c.lineTo(bx+tx*tick,by+ty*tick);c.stroke();
    var label=measure(it).toFixed(2).replace(".",",")+" m",mx=(ax+bx)/2,my=(ay+by)/2;
    c.font="11px Arial";var w=c.measureText(label).width+8;c.fillStyle="#fbfaf7";c.fillRect(mx-w/2,my-8,w,16);c.fillStyle="#76572e";c.textAlign="center";c.textBaseline="middle";c.fillText(label,mx,my);c.restore();
  }
  function drawFurniture(c,it){
    var def=furniture[it.kind];if(!def)return;
    var w=it.w||def.w*100,h=it.h||def.h*100,x=it.x-w/2,y=it.y-h/2;
    c.save();c.strokeStyle="#52636a";c.fillStyle="rgba(82,99,106,.035)";c.lineWidth=2;
    function rect(){c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);}
    rect();
    if(it.kind==="sofa"){c.strokeRect(x+5,y+5,w-10,h*.28);c.beginPath();c.moveTo(x+w/2,y+5);c.lineTo(x+w/2,y+h*.28);c.stroke();}
    else if(it.kind==="bed-double"||it.kind==="bed-single"){c.strokeRect(x+5,y+5,w-10,h*.25);c.beginPath();c.moveTo(x+5,y+h*.34);c.lineTo(x+w-5,y+h*.34);c.stroke();}
    else if(it.kind==="dining"){c.beginPath();for(var i=0;i<4;i++){var px=x+(i%2? w-10:10),py=y+(i<2? -8:h+8);c.rect(px-7,py-7,14,14);}c.stroke();}
    else if(it.kind==="toilet"){c.beginPath();c.ellipse(x+w/2,y+h*.62,w*.3,h*.32,0,0,Math.PI*2);c.stroke();c.strokeRect(x+w*.28,y+3,w*.44,h*.2);}
    else if(it.kind==="shower"){c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y+h);c.moveTo(x+w,y);c.lineTo(x,y+h);c.stroke();}
    else if(it.kind==="washer"||it.kind==="stove"){c.beginPath();c.arc(x+w/2,y+h/2,Math.min(w,h)*.28,0,Math.PI*2);c.stroke();}
    else if(it.kind==="armchair"){c.strokeRect(x+6,y+6,w-12,h-12);}
    else if(it.kind==="bath-sink"||it.kind==="sink"){c.beginPath();c.ellipse(x+w/2,y+h/2,w*.34,h*.34,0,0,Math.PI*2);c.stroke();}
    else if(it.kind==="office-chair"){c.beginPath();c.arc(x+w/2,y+h/2,Math.min(w,h)*.28,0,Math.PI*2);c.stroke();}
    else if(it.kind==="fridge"){c.beginPath();c.moveTo(x,y+h*.35);c.lineTo(x+w,y+h*.35);c.stroke();}
    else if(it.kind==="wardrobe"||it.kind==="sideboard"||it.kind==="tv"||it.kind==="kitchen"||it.kind==="desk"||it.kind==="office-desk"||it.kind==="shelf"||it.kind==="nightstand"||it.kind==="coffee"||it.kind==="laundry-tank"){c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.stroke();}
    c.fillStyle="#52636a";c.font="10px Arial";c.textAlign="center";c.textBaseline="middle";c.fillText(def.label,it.x,y+h/2);c.restore();
  }
  function drawOpening(c,it){
    var wall=items[it.wallIndex];if(!wall||wall.type!=="wall")return;
    var dx=wall.x2-wall.x1,dy=wall.y2-wall.y1,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    var half=it.width*100/2,cx=it.cx,cy=it.cy,x1=cx-ux*half,y1=cy-uy*half,x2=cx+ux*half,y2=cy+uy*half;
    c.save();c.lineCap="butt";c.strokeStyle="#fbfaf7";c.lineWidth=13;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
    if(it.type==="window"){c.strokeStyle="#438b9b";c.lineWidth=2;c.beginPath();c.moveTo(x1+nx*4,y1+ny*4);c.lineTo(x2+nx*4,y2+ny*4);c.moveTo(x1-nx*4,y1-ny*4);c.lineTo(x2-nx*4,y2-ny*4);c.stroke();c.strokeStyle="#438b9b";c.lineWidth=1;c.beginPath();c.moveTo(cx+nx*8,cy+ny*8);c.lineTo(cx-nx*8,cy-ny*8);c.stroke();}
    else{c.strokeStyle="#a77b45";c.lineWidth=2;var hingeX=cx-ux*half,hingeY=cy-uy*half,swing=it.swing||1,base=Math.atan2(uy,ux),end=base+swing*Math.PI/2;c.beginPath();c.moveTo(hingeX,hingeY);c.lineTo(hingeX+Math.cos(end)*it.width*100,hingeY+Math.sin(end)*it.width*100);c.stroke();c.beginPath();c.arc(hingeX,it.cy-uy*half,it.width*100,base,end,swing<0);c.stroke();}
    c.fillStyle="#52636a";c.font="10px Arial";c.textAlign="center";c.textBaseline="middle";var note=it.type==="window"?"J "+it.width.toFixed(2).replace(".",",")+" m · P "+it.sill.toFixed(2).replace(".",",")+" m":"P "+it.width.toFixed(2).replace(".",",")+" m";c.fillText(note,cx+nx*19,cy+ny*19);
    c.restore();
  }
  function drawItem(c,it){
    if(it.type==="wall"){c.save();c.strokeStyle="#252521";c.lineWidth=9;c.lineCap="square";c.beginPath();c.moveTo(it.x1,it.y1);c.lineTo(it.x2,it.y2);c.stroke();c.restore();}
    if(it.type==="room"){c.save();c.fillStyle="rgba(201,170,112,.10)";c.strokeStyle="#8c7958";c.lineWidth=3;c.fillRect(it.x1,it.y1,it.x2-it.x1,it.y2-it.y1);c.strokeRect(it.x1,it.y1,it.x2-it.x1,it.y2-it.y1);c.restore();}
    if(it.type==="text"){c.save();c.fillStyle="#33332d";c.font="bold 18px Arial";c.textAlign="left";c.textBaseline="top";c.fillText(it.text||"Texto",it.x1,it.y1);c.restore();}
    if(it.type==="furniture")drawFurniture(c,it);
    if(it.type==="door"||it.type==="window")drawOpening(c,it);
  }
  function render(){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#fbfaf7";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle="#e9e5dc";ctx.lineWidth=1;
    for(var x=0;x<=canvas.width;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
    for(var y=0;y<=canvas.height;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}
    items.forEach(function(it){drawItem(ctx,it);});if(preview)drawItem(ctx,preview);
    items.forEach(function(it){if(it.type==="wall")drawDimension(ctx,it);});
    if(preview&&preview.type==="wall")drawDimension(ctx,preview);
  }
  function nearestWall(p){
    var best=null;
    items.forEach(function(w,i){if(w.type!=="wall")return;var dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)return;var t=Math.max(0,Math.min(1,((p.x-w.x1)*dx+(p.y-w.y1)*dy)/l2)),x=w.x1+t*dx,y=w.y1+t*dy,d=Math.hypot(p.x-x,p.y-y);if(!best||d<best.d)best={index:i,x:x,y:y,t:t,d:d,dx:dx,dy:dy,len:Math.sqrt(l2)};});
    return best;
  }
  function moveOpening(it,p){var w=items[it.wallIndex];if(!w)return;var dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((p.x-w.x1)*dx+(p.y-w.y1)*dy)/l2));it.cx=w.x1+t*dx;it.cy=w.y1+t*dy;it.t=t;}
  function addOpening(type,p){
    var wall=nearestWall(p);if(!wall||wall.d>95){alert("Clique próximo de uma parede para inserir a abertura.");return;}
    var width=parseFloat(prompt(type==="window"?"Largura da janela em metros:":"Largura da porta em metros:",type==="window"?"1.20":"0.80"));
    if(!isFinite(width)||width<=0||width>wall.len/100){alert("Informe uma largura válida para esse trecho de parede.");return;}
    var item={type:type,wallIndex:wall.index,cx:wall.x,cy:wall.y,t:wall.t,width:width,swing:1};
    if(type==="window"){var sill=parseFloat(prompt("Altura do peitoril em metros:", "1.00"));if(!isFinite(sill)||sill<0){alert("Informe um peitoril válido.");return;}item.sill=sill;item.height=parseFloat(prompt("Altura da janela em metros:","1.20"))||1.20;}
    else{item.height=parseFloat(prompt("Altura da porta em metros:","2.10"))||2.10;}
    items.push(item);
  }
  function itemAt(p){for(var i=items.length-1;i>=0;i--){var it=items[i];if(it.type==="door"||it.type==="window"){var wall=items[it.wallIndex],half=it.width*50;if(wall){var dx=wall.x2-wall.x1,dy=wall.y2-wall.y1,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,along=(p.x-it.cx)*ux+(p.y-it.cy)*uy,across=Math.abs((p.x-it.cx)*(-uy)+(p.y-it.cy)*ux);if(Math.abs(along)<=half+12&&across<=24)return i;}if(Math.hypot(p.x-it.cx,p.y-it.cy)<22)return i;}if(it.type==="furniture"){var d=furniture[it.kind],w=(it.w||d.w*100)/2,h=(it.h||d.h*100)/2;if(Math.abs(p.x-it.x)<=w+8&&Math.abs(p.y-it.y)<=h+8)return i;}}return -1;}
  function showInspector(index){selectedItem=index;var it=items[index];if(!it){inspector.hidden=true;return;}inspector.hidden=false;var isOpening=it.type==="door"||it.type==="window",isFurniture=it.type==="furniture";root.querySelector("#editWidth").value=isOpening?it.width:(isFurniture?(it.w/100):"");root.querySelector("#editHeight").value=isOpening?it.height:(isFurniture?(it.h/100):"");root.querySelector("#editSillWrap").hidden=it.type!=="window";root.querySelector("#editSill").value=it.sill||0;root.querySelector("#editSwingWrap").hidden=it.type!=="door";root.querySelector("#editSwing").value=String(it.swing||1);root.querySelector("#editWidth").disabled=!(isOpening||isFurniture);root.querySelector("#editHeight").disabled=!(isOpening||isFurniture);}
  root.querySelector("#applyObjectEdit").addEventListener("click",function(){if(selectedItem===null)return;var it=items[selectedItem],w=parseFloat(root.querySelector("#editWidth").value),h=parseFloat(root.querySelector("#editHeight").value);if(!isFinite(w)||w<=0||!isFinite(h)||h<=0){alert("Informe largura e altura válidas.");return;}if(it.type==="door"||it.type==="window"){var wall=items[it.wallIndex];if(!wall||w>Math.hypot(wall.x2-wall.x1,wall.y2-wall.y1)/100){alert("A largura precisa caber no trecho de parede.");return;}it.width=w;it.height=h;if(it.type==="window"){var sill=parseFloat(root.querySelector("#editSill").value);if(!isFinite(sill)||sill<0){alert("Informe um peitoril válido.");return;}it.sill=sill;}if(it.type==="door")it.swing=parseInt(root.querySelector("#editSwing").value,10);}else if(it.type==="furniture"){it.w=w*100;it.h=h*100;}render();});\n  root.querySelector("#deleteObject").addEventListener("click",function(){if(selectedItem!==null){items.splice(selectedItem,1);selectedItem=null;inspector.hidden=true;render();}});\n  function open(){modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");document.body.classList.add("floor-open");render();}
  function close(){modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");document.body.classList.remove("floor-open");}
  root.querySelector("#floorLaunch").addEventListener("click",open);root.querySelector("#floorClose").addEventListener("click",close);
  modal.addEventListener("click",function(e){if(e.target===modal)close();});document.addEventListener("keydown",function(e){if(e.key==="Escape"&&modal.classList.contains("is-open"))close();});
  toolSelect.addEventListener("change",function(){tool=toolSelect.value;furnitureWrap.hidden=tool!=="furniture";});
  canvas.addEventListener("pointerdown",function(e){
    if(!modal.classList.contains("is-open"))return;var p=point(e);
    var hit=itemAt(p);
    if(tool!=="erase"&&hit>=0&&(items[hit].type==="door"||items[hit].type==="window"||items[hit].type==="furniture")){showInspector(hit);dragItem=hit;canvas.setPointerCapture(e.pointerId);return;}
    if(hit<0){selectedItem=null;inspector.hidden=true;}\n    if(tool==="text"){var label=prompt("Digite o texto para inserir na planta:");if(label&&label.trim())items.push({type:"text",x1:p.x,y1:p.y,text:label.trim()});render();return;}
    if(tool==="door"||tool==="window"){addOpening(tool,p);if(items.length)showInspector(items.length-1);render();return;}
    if(tool==="furniture"){var kind=furniturePicker.value;var def=furniture[kind];items.push({type:"furniture",kind:kind,x:p.x,y:p.y,w:def.w*100,h:def.h*100});showInspector(items.length-1);render();return;}
    start=p;preview={type:tool,x1:p.x,y1:p.y,x2:p.x,y2:p.y};canvas.setPointerCapture(e.pointerId);render();
  });
  canvas.addEventListener("pointermove",function(e){
    var p=point(e);if(dragItem!==null){var it=items[dragItem];if(it.type==="door"||it.type==="window")moveOpening(it,p);else{it.x=p.x;it.y=p.y;}render();return;}
    if(!start||!preview)return;preview.x2=p.x;preview.y2=p.y;render();
  });
  function endDraw(){if(dragItem!==null){dragItem=null;return;}if(!start||!preview)return;var it=preview;preview=null;start=null;if(it.type==="erase"){var cx=(it.x1+it.x2)/2,cy=(it.y1+it.y2)/2,idx=-1,dist=Infinity;items.forEach(function(v,i){var px=v.cx!==undefined?v.cx:(v.x!==undefined?v.x:(v.x1+v.x2)/2),py=v.cy!==undefined?v.cy:(v.y!==undefined?v.y:(v.y1+v.y2)/2),d=Math.hypot(px-cx,py-cy);if(d<dist){dist=d;idx=i;}});if(idx>=0&&dist<85)items.splice(idx,1);}else if(Math.hypot(it.x2-it.x1,it.y2-it.y1)>8)items.push(it);render();}
  canvas.addEventListener("pointerup",endDraw);canvas.addEventListener("pointercancel",endDraw);
  root.querySelector("#floorUndo").addEventListener("click",function(){items.pop();render();});
  root.querySelector("#floorClear").addEventListener("click",function(){if(confirm("Apagar todo o desenho?")){items=[];render();}});
  function exportPng(){render();var out=document.createElement("canvas");out.width=canvas.width;out.height=canvas.height;var c=out.getContext("2d");c.fillStyle="#fff";c.fillRect(0,0,out.width,out.height);c.drawImage(canvas,0,0);c.fillStyle="#222";c.font="18px Arial";c.fillText("Estudo inicial de planta · ProArqui 3D",28,32);return out.toDataURL("image/png");}
  root.querySelector("#floorPng").addEventListener("click",function(){var a=document.createElement("a");a.href=exportPng();a.download="planta-inicial-proarqui.png";a.click();});
  root.querySelector("#floorSend").addEventListener("click",function(){
    if(!items.length){alert("Desenhe pelo menos um elemento na planta antes de continuar.");return;}
    var name=root.querySelector("#floorName").value.trim(),phone=root.querySelector("#floorPhone").value.trim(),city=root.querySelector("#floorCity").value.trim(),type=root.querySelector("#floorType").value,notes=root.querySelector("#floorNotes").value.trim();
    var msg="Olá, ProArqui 3D! Quero enviar meu estudo inicial de planta.\n\nNome: "+(name||"Não informado")+"\nWhatsApp: "+(phone||"Não informado")+"\nCidade: "+(city||"Não informada")+"\nTipo: "+type+"\nObservações: "+(notes||"Não informado")+"\n\nJá baixei a planta em PNG e vou anexá-la nesta conversa.";
    var a=document.createElement("a");a.href=exportPng();a.download="planta-inicial-proarqui.png";a.click();window.open(WA+"?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
  });
  render();
})();