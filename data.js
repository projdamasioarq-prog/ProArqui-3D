var APP_DATA = {
  "scenes": [
    {
      "id": "0-lobby",
      "name": "Lobby",
      "levels": [{"tileSize":256,"size":256,"fallbackOnly":true},{"tileSize":512,"size":512},{"tileSize":512,"size":1024},{"tileSize":512,"size":2048}],
      "faceSize": 2048,
      "initialViewParameters": {"yaw":0,"pitch":0,"fov":1.3045929890356736},
      "linkHotspots": [{"yaw":1.351161397145491,"pitch":0.4307484180665142,"rotation":0,"target":"2-servios"}],
      "infoHotspots": [],
      "lobbyHotspots": [
        {"title":"Sobre Nós","action":"about","yaw":-0.45,"pitch":-0.05},
        {"title":"Contato","action":"contact","href":"https://api.whatsapp.com/send/?phone=5511947869761&text&type=phone_number&app_absent=0","yaw":0.368,"pitch":-0.05},
        {"title":"Avaliações","action":"reviews","yaw":-0.75,"pitch":0.40}
      ]
    },
    {
      "id": "1-portiflio",
      "name": "Portfólio",
      "levels": [{"tileSize":256,"size":256,"fallbackOnly":true},{"tileSize":512,"size":512},{"tileSize":512,"size":1024}],
      "faceSize": 1024,
      "initialViewParameters": {"pitch":0,"yaw":0,"fov":1.5707963267948966},
      "linkHotspots": [{"yaw":3.1050856214418543,"pitch":0.49147626854354876,"rotation":0,"target":"0-lobby"}],
      "infoHotspots": [],
      "projectHotspots": [
        {"title":"Residencial Itapema","imageName":"Residencial Itapema","href":"Projetos/Projeto%20Itapema/Projeto%20-%20Itapema.pdf","yaw":-0.424,"pitch":-0.18},
        {"title":"Residencial Vivaci","imageName":"Residencial Vivaci","href":"Projetos/Projeto%20Vivaci/Projeto.pdf","yaw":0.344,"pitch":-0.18},
        {"title":"Chalé Fusion","imageName":"Chalé Fusion","yaw":1.227,"pitch":-0.18},
        {"title":"Colégio CAM","imageName":"Colégio Anhembi","yaw":2.074,"pitch":-0.18},
        {"title":"Clínica Blank","imageName":"Clínica Blank","documents":[{"title":"Clínica | Mobiliário","href":"Projetos/Clinic%20Blank/Clinica%20Mobiliario%20.pdf"},{"title":"Clínica | Projeto Layout","href":"Projetos/Clinic%20Blank/PL%20-%20Clinic%20Blanc.pdf"}],"yaw":-2.034,"pitch":-0.18},
        {"title":"Hostel 197","imageName":"Hostel 197","href":"Projetos/Hostel/Projeto%20Hostel%20197.pdf","yaw":-1.187,"pitch":-0.18}
      ]
    },
    {
      "id": "2-servios",
      "name": "Serviços",
      "levels": [{"tileSize":256,"size":256,"fallbackOnly":true},{"tileSize":512,"size":512},{"tileSize":512,"size":1024},{"tileSize":512,"size":2048}],
      "faceSize": 2048,
      "initialViewParameters": {"pitch":0,"yaw":0,"fov":1.5707963267948966},
      "linkHotspots": [{"yaw":0.30341248141331256,"pitch":0.775389188252479,"rotation":0,"target":"0-lobby"}],
      "infoHotspots": [],
      "serviceHotspots": [
        {"title":"Modelagem 3D","service":"modelagem","color":"red","yaw":-0.012,"pitch":-0.015},
        {"title":"Projeto Arquitetônico","service":"arquitetura","color":"green","yaw":-0.671,"pitch":0.065},
        {"title":"Consultoria","service":"consultoria","color":"yellow","yaw":0.720,"pitch":0.068}
      ]
    }
  ],
  "name": "ProArqui 3D | Tour Virtual",
  "settings": {"mouseViewMode":"drag","autorotateEnabled":true,"fullscreenButton":true,"viewControlButtons":false}
};