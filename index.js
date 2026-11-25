/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

(function() {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');
  var lobbyActionsElement = document.querySelector('#lobbyActions');
  var aboutActionElement = document.querySelector('#aboutAction');
  var aboutPanelElement = document.querySelector('#aboutPanel');
  var aboutCloseElement = document.querySelector('#aboutClose');

  // Ações do Lobby serão criadas como hotspots nativos, ancorados ao panorama.
  // Remove o antigo conjunto de botões fixos no viewport.
  if (lobbyActionsElement) lobbyActionsElement.remove();

  // Toda a interface HTML fica numa camada fixa no viewport.
  // O Marzipano permanece isolado em #pano; nenhum controle de tela é filho dele.
  var screenOverlay = document.getElementById('screenOverlay');
  if (!screenOverlay) {
    screenOverlay = document.createElement('div');
    screenOverlay.id = 'screenOverlay';
  }
  document.documentElement.appendChild(screenOverlay);

  // Visualizador interno de PDF, sobreposto ao tour sem sair do site.
  var projectPdfViewer = null;
  function openProjectPdf(url, title) {
    if (!projectPdfViewer) {
      projectPdfViewer = document.createElement('div');
      projectPdfViewer.id = 'projectPdfViewer';
      projectPdfViewer.innerHTML =
        '<div class="project-pdf-toolbar">' +
          '<span class="project-pdf-title"></span>' +
          '<div class="project-pdf-actions">' +
            '<button type="button" class="project-pdf-close" aria-label="Fechar visualizador">Fechar ×</button>' +
          '</div>' +
        '</div>' +
        '<iframe class="project-pdf-frame" title="Projeto em PDF"></iframe>';
      screenOverlay.appendChild(projectPdfViewer);
      projectPdfViewer.querySelector('.project-pdf-close').addEventListener('click', closeProjectPdf);
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') { closeProjectPdf(); closeProjectChoices(); closeReviewsPanel(); closeServicePanel(); }
      });
    }
    projectPdfViewer.querySelector('.project-pdf-title').textContent = title;
    projectPdfViewer.querySelector('.project-pdf-frame').src = url + (url.indexOf('#') === -1 ? '#zoom=33' : '&zoom=33');
    projectPdfViewer.classList.add('is-open');
    stopAutorotate();
  }

  function closeProjectPdf() {
    if (!projectPdfViewer) return;
    projectPdfViewer.classList.remove('is-open');
    projectPdfViewer.querySelector('.project-pdf-frame').src = 'about:blank';
    startAutorotate();
  }

  // Seletor de documentos para projetos que possuem mais de um PDF.
  var projectChoiceViewer = null;
  function openProjectChoices(title, documents) {
    if (!projectChoiceViewer) {
      projectChoiceViewer = document.createElement('div');
      projectChoiceViewer.id = 'projectChoiceViewer';
      screenOverlay.appendChild(projectChoiceViewer);
    }
    projectChoiceViewer.innerHTML =
      '<div class="project-choice-card">' +
        '<div class="project-choice-heading">' +
          '<span class="project-choice-title"></span>' +
          '<button type="button" class="project-choice-close">Fechar ×</button>' +
        '</div>' +
        '<p class="project-choice-subtitle">Escolha o material que deseja visualizar</p>' +
        '<div class="project-choice-options"></div>' +
      '</div>';
    projectChoiceViewer.querySelector('.project-choice-title').textContent = title;
    projectChoiceViewer.querySelector('.project-choice-close').addEventListener('click', closeProjectChoices);
    var options = projectChoiceViewer.querySelector('.project-choice-options');
    documents.forEach(function(documentInfo) {
      var option = document.createElement('button');
      option.type = 'button';
      option.className = 'project-choice-option';
      option.textContent = documentInfo.title;
      option.addEventListener('click', function() {
        closeProjectChoices();
        openProjectPdf(documentInfo.href, title + ' | ' + documentInfo.title);
      });
      options.appendChild(option);
    });
    projectChoiceViewer.classList.add('is-open');
    stopAutorotate();
  }

  function closeProjectChoices() {
    if (!projectChoiceViewer) return;
    projectChoiceViewer.classList.remove('is-open');
    startAutorotate();
  }

  var fixedInterfaceSelectors = [
    '.site-header',
    '#titleBar',
    '#sceneList',
    '#sceneListToggle',
    '#autorotateToggle',
    '#fullscreenToggle',
    '.bottom-note',
    '#viewUp',
    '#viewDown',
    '#viewLeft',
    '#viewRight',
    '#viewIn',
    '#viewOut',
  ];
  fixedInterfaceSelectors.forEach(function(selector) {
    var element = document.querySelector(selector);
    if (element) screenOverlay.appendChild(element);
  });

  // O painel Sobre Nós permanece na interface fixa; os botões ficam no panorama.
  if (aboutPanelElement) screenOverlay.appendChild(aboutPanelElement);

  if (aboutPanelElement && aboutCloseElement) {
    aboutCloseElement.addEventListener('click', closeAboutPanel);
    aboutPanelElement.addEventListener('click', function(event) {
      if (event.target === aboutPanelElement) closeAboutPanel();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') closeAboutPanel();
    });
  }

  // Os hotspots de projetos são criados dentro da cena 360° e permanecem
  // ancorados às coordenadas do ambiente, sempre voltados para a câmera.

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function() {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia("(max-width: 500px), (max-height: 500px)");
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function() {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Create scenes.
  var scenes = data.scenes.map(function(data) {
    var urlPrefix = "tiles";
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + "/" + data.id + "/{z}/{f}/{y}/{x}.jpg",
      { cubeMapPreviewUrl: urlPrefix + "/" + data.id + "/preview.jpg" });
    var geometry = new Marzipano.CubeGeometry(data.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(data.faceSize, 100*Math.PI/180, 120*Math.PI/180);
    var view = new Marzipano.RectilinearView(data.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Hotspots nativos do Marzipano: ficam ancorados às coordenadas do
    // panorama e acompanham a rotação da câmera, sem flutuar na tela.
    var hotspotContainer = scene.hotspotContainer();

    data.linkHotspots.forEach(function(hotspot) {
      var element = createLinkHotspotElement(hotspot);
      hotspotContainer.createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch
      });
    });

    data.infoHotspots.forEach(function(hotspot) {
      var element = createInfoHotspotElement(hotspot);
      hotspotContainer.createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch
      });
    });

    // Botões Sobre Nós e Contato: pontos ancorados às paredes do Lobby.
    (data.lobbyHotspots || []).forEach(function(hotspot) {
      var element = createLobbyActionHotspotElement(hotspot);
      hotspotContainer.createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch
      });
    });

    // Hotspots coloridos dos serviços, posicionados sobre as marcações da imagem.
    (data.serviceHotspots || []).forEach(function(hotspot) {
      var element = createServiceHotspotElement(hotspot);
      hotspotContainer.createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Hotspots dos projetos são pontos do próprio ambiente 360°.
    // O Marzipano projeta cada coordenada yaw/pitch na tela conforme a câmera
    // gira; assim, o marcador não fica preso ao viewport nem gira com a câmera.
    (data.projectHotspots || []).forEach(function(hotspot) {
      var element = createProjectHotspotElement(hotspot);
      hotspotContainer.createHotspot(element, {
        yaw: hotspot.yaw,
        pitch: hotspot.pitch
      });
    });

    return {
      data: data,
      scene: scene,
      view: view
    };
  });

  // Set up autorotate, if enabled.
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.03,
    targetPitch: 0,
    targetFov: Math.PI/2
  });
  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }

  // Set handler for autorotate toggle.
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function() {
      screenfull.toggle();
    });
    screenfull.on('change', function() {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with the scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Set handler for scene switch.
  scenes.forEach(function(scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    el.addEventListener('click', function() {
      switchScene(scene);
      // On mobile, hide scene list after selecting a scene.
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // DOM elements for view controls.
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  // Dynamic parameters for controls.
  var velocity = 0.7;
  var friction = 3;

  // Associate view controls with elements.
  var controls = viewer.controls();
  controls.registerMethod('upElement',    new Marzipano.ElementPressControlMethod(viewUpElement,     'y', -velocity, friction), true);
  controls.registerMethod('downElement',  new Marzipano.ElementPressControlMethod(viewDownElement,   'y',  velocity, friction), true);
  controls.registerMethod('leftElement',  new Marzipano.ElementPressControlMethod(viewLeftElement,   'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement,  'x',  velocity, friction), true);
  controls.registerMethod('inElement',    new Marzipano.ElementPressControlMethod(viewInElement,  'zoom', -velocity, friction), true);
  controls.registerMethod('outElement',   new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom',  velocity, friction), true);

  function sanitize(s) {
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  }

  function openAboutPanel() {
    if (!aboutPanelElement) return;
    aboutPanelElement.classList.add('is-open');
    aboutPanelElement.setAttribute('aria-hidden', 'false');
    if (aboutCloseElement) aboutCloseElement.focus();
  }

  function closeAboutPanel() {
    if (!aboutPanelElement) return;
    aboutPanelElement.classList.remove('is-open');
    aboutPanelElement.setAttribute('aria-hidden', 'true');
  }

  function switchScene(scene) {
    stopAutorotate();
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo();
    startAutorotate();
    updateSceneName(scene);
    updateSceneList(scene);
    var isLobby = scene.data.id === '0-lobby';
    if (!isLobby) closeAboutPanel();
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  // Histórico de projetos e avaliações fornecidos para o portfólio.
  var reviewsPanel = null;
  var reviewItems = [
    { category: 'Projetos arquitetônicos e executivos', project: 'Projeto arquitetônico e executivo para farmácia', rating: 4.8, text: 'Profissional muito competente, atencioso e dedicado. Fez o projeto no prazo acordado e apresentou várias sugestões interessantes.' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Projeto residencial de dois pavimentos', rating: 5, text: 'Profissional atencioso, dedicado e entregou o trabalho dentro do prazo.' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Planta para apartamento de dois pavimentos', rating: 5, text: 'Daniel foi muito atencioso durante todo o processo. Mesmo com o prazo apertado, se dedicou ao máximo para entregar com as alterações solicitadas. Recomendo!' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Projeto de interiores para apartamento', rating: 5, text: 'Um cara com um profissionalismo ímpar, super atencioso, educado e solícito, com grande conhecimento técnico. Sem dúvida ficarei feliz em retomar os trabalhos. Recomendo!' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Projeto para sala comercial de 45 m²', rating: 5, text: 'Não há comentário visível na imagem.' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Projeto para loja de bijuterias e eletrônicos', rating: 5, text: 'Já está em fase de aprovação e trabalho ficou bom. É um bom profissional e a pessoa certa além de trabalhar bem e é comunicativo e entende o que você quer.' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Planta baixa para shopping de pequeno porte', rating: 5, text: 'Obrigada, Daniel, pela dedicação e por ter entregado o projeto em tempo hábil! Com certeza indicarei seu trabalho, pois o resultado ficou excelente. Obrigada, espero em breve que tenhamos outros trabalhos juntos.' },
    { category: 'Projetos arquitetônicos e executivos', project: 'Planta baixa para apartamento', rating: 5, text: 'Daniel entregou o projeto dentro das especificações solicitadas antes do prazo acordado. Recomendo.' },
    { category: 'Modelagem 3D e imagens', project: 'Renderização de piscina em condomínio', rating: 5, text: 'O Daniel foi muito atencioso durante todo o processo. Mesmo com o prazo apertado, se dedicou ao máximo para entregar com as alterações solicitadas. Recomendo!' },
    { category: 'Modelagem 3D e imagens', project: 'Modelagem 3D de apartamento', rating: 5, text: 'Muito paciente e cordial, atencioso e competente.' },
    { category: 'Modelagem 3D e imagens', project: 'Modelagem 3D de unidade de franquia de lavanderia de autosserviço', rating: 4.8, text: 'Foi conscrito de acordo com o pedido. Trecho do comentário difícil de ler na imagem.' },
    { category: 'Modelagem 3D e imagens', project: 'Câmera de eventos para YouTube', rating: 5, text: 'Você busca por serviços de arquitetura que vão além do convencional? Acabou de encontrar! Sua experiência e paixão pela criação se refletem em cada detalhe dos projetos que realiza. Profissional extremamente atencioso e dedicado, sempre entregando soluções que superam as expectativas.' },
    { category: 'Desenhos técnicos e detalhamento', project: 'Detalhamento executivo em AutoCAD', rating: 5, text: 'Profissional rápido e atencioso, recomendo muito!' },
    { category: 'Desenhos técnicos e detalhamento', project: 'Ilustração em AutoCAD', rating: 5, text: 'Daniel desempenhou sua tarefa com muito profissionalismo e competência, comunicação clara e execução conforme combinado. Recomendo!' },
    { category: 'Desenhos técnicos e detalhamento', project: 'Desenho de cortes, fachadas e volumetria', rating: 5, text: 'Profissional comprometido, cumpriu o prazo mesmo sendo bem curto e apertado. Bom comunicativo, proativo.' },
    { category: 'Desenhos técnicos e detalhamento', project: 'Estudo de fachada para supermercado', rating: 5, text: 'Não há comentário visível na imagem.' },
    { category: 'Desenhos técnicos e detalhamento', project: 'Paginação de projeto', rating: 4.2, text: 'Excelente profissional, respondeu rapidamente às demandas.' },
    { category: 'Desenhos técnicos e detalhamento', project: 'Projeto de design de interiores', rating: 5, text: 'O projeto ficou bom.' }
  ];

  function closeReviewsPanel() {
    if (!reviewsPanel) return;
    reviewsPanel.classList.remove('is-open');
    reviewsPanel.setAttribute('aria-hidden', 'true');
    startAutorotate();
  }

  function openReviewsPanel() {
    if (!reviewsPanel) {
      reviewsPanel = document.createElement('section');
      reviewsPanel.id = 'reviewsPanel';
      reviewsPanel.className = 'reviews-panel';
      reviewsPanel.setAttribute('role', 'dialog');
      reviewsPanel.setAttribute('aria-modal', 'true');
      reviewsPanel.setAttribute('aria-labelledby', 'reviewsPanelTitle');
      reviewsPanel.setAttribute('aria-hidden', 'true');
      screenOverlay.appendChild(reviewsPanel);
    }
    reviewsPanel.innerHTML =
      '<div class="reviews-card">' +
        '<header class="reviews-header"><div><p class="reviews-eyebrow">PROARQUI 3D · EXPERIÊNCIA DE CLIENTES</p><h2 id="reviewsPanelTitle">Histórico de Projetos e Avaliações</h2></div><button type="button" class="reviews-close" aria-label="Fechar avaliações">×</button></header>' +
        '<p class="reviews-caption">Projetos realizados e avaliações recebidas.</p><div class="reviews-list"></div>' +
        '<footer class="reviews-footer"><span>Histórico de projetos e avaliações</span></footer>' +
      '</div>';
    var list = reviewsPanel.querySelector('.reviews-list');
    var currentCategory = '';
    reviewItems.forEach(function(item) {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        var categoryHeading = document.createElement('h3');
        categoryHeading.className = 'review-category';
        categoryHeading.textContent = currentCategory;
        list.appendChild(categoryHeading);
      }
      var card = document.createElement('article');
      card.className = 'review-item';
      var top = document.createElement('div');
      top.className = 'review-item-top';
      var project = document.createElement('h4');
      project.textContent = item.project;
      var rating = document.createElement('span');
      rating.className = 'review-rating';
      rating.setAttribute('aria-label', item.rating.toFixed(1).replace('.', ',') + ' de 5');
      rating.textContent = '★ ' + item.rating.toFixed(1).replace('.', ',') + '/5';
      top.appendChild(project);
      top.appendChild(rating);
      var note = document.createElement('p');
      note.textContent = item.text;
      card.appendChild(top);
      card.appendChild(note);
      list.appendChild(card);
    });
    reviewsPanel.querySelector('.reviews-close').addEventListener('click', closeReviewsPanel);
    reviewsPanel.addEventListener('click', function(event) {
      if (event.target === reviewsPanel) closeReviewsPanel();
    });
    reviewsPanel.classList.add('is-open');
    reviewsPanel.setAttribute('aria-hidden', 'false');
    stopAutorotate();
  }

  function createLobbyActionHotspotElement(hotspot) {
    // Mesmo padrão de hotspot dos projetos: botão HTML dentro do container
    // nativo do Marzipano, ancorado em yaw/pitch e sem vínculo com a câmera.
    var button = document.createElement('button');
    button.type = 'button';
    button.className = hotspot.action === 'karen' ? 'karen-hotspot' : 'project-hotspot lobby-wall-hotspot';
    button.textContent = hotspot.action === 'karen' ? 'K' : hotspot.title;
    button.setAttribute('aria-label', hotspot.title);
    button.setAttribute('title', hotspot.title);

    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (hotspot.action === 'about') {
        openAboutPanel();
      } else if (hotspot.action === 'reviews') {
        openReviewsPanel();
      } else if (hotspot.action === 'karen') {
        window.dispatchEvent(new CustomEvent('openKarenAssistant'));
      } else if (hotspot.href) {
        window.open(hotspot.href, '_blank', 'noopener,noreferrer');
      }
    });
    stopTouchAndScrollEventPropagation(button);
    return button;
  }

  var servicePanel = null;
  var serviceContent = {
    arquitetura: {
      title: 'Projeto arquitetônico',
      intro: 'Do estudo inicial ao desenvolvimento técnico, criamos soluções que equilibram estética, funcionalidade e viabilidade. Cada projeto é desenvolvido a partir das necessidades do cliente e das características do espaço.',
      items: [
        'Estudo preliminar — análise das necessidades, do terreno ou imóvel e das possibilidades de projeto.',
        'Projetos residenciais — desenvolvimento de casas, apartamentos, reformas e ampliações.',
        'Projetos comerciais — soluções para lojas, escritórios, clínicas, restaurantes e ambientes corporativos.',
        'Design de interiores — definição de layout, materiais, acabamentos, iluminação e composição dos ambientes.',
        'Reformas e ampliações — reorganização dos espaços para melhorar circulação, conforto e aproveitamento.',
        'Fachadas — estudo de composição, volumetria, materiais e identidade visual da edificação.',
        'Projeto legal e documentação — elaboração de desenhos e documentos técnicos conforme o escopo contratado e as exigências aplicáveis.'
      ]
    },
    modelagem: {
      title: 'Modelagem 3D',
      intro: 'Transformamos ideias, plantas e desenhos técnicos em modelos tridimensionais detalhados. A visualização 3D ajuda a compreender o projeto, avaliar escolhas e apresentar o resultado antes da execução.',
      items: [
        'Ambientes internos — modelagem de espaços residenciais, comerciais e corporativos.',
        'Fachadas e áreas externas — representação de jardins, varandas, piscinas, áreas de lazer e fachadas.',
        'Conversão de plantas em 3D — criação de modelos tridimensionais a partir de plantas, cortes e desenhos técnicos.',
        'Móveis e objetos personalizados — modelagem de marcenaria, mobiliário sob medida e peças específicas.',
        'Materiais e iluminação — aplicação de revestimentos, texturas, cores e configuração de luzes.',
        'Imagens renderizadas — produção de imagens realistas para apresentação e comunicação do projeto.',
        'Animações e passeios virtuais — vídeos e experiências interativas para explorar os ambientes.',
        'Revisões e ajustes — atualização do modelo conforme as alterações e etapas previstas no escopo.'
      ]
    },
    consultoria: {
      title: 'Consultoria',
      intro: 'Orientação técnica e criativa para quem precisa planejar um ambiente, avaliar possibilidades ou tomar decisões antes de iniciar uma obra. O atendimento é direcionado à necessidade de cada cliente, com recomendações claras e práticas.',
      items: [
        'Consultoria para reformas — avaliação das possibilidades e definição de prioridades para transformar o espaço.',
        'Estudo de layout — sugestões para melhorar organização, circulação e aproveitamento dos ambientes.',
        'Análise de imóvel ou terreno — avaliação inicial do potencial de uso e das necessidades de adaptação.',
        'Materiais e acabamentos — orientação para escolha de revestimentos, cores, louças, metais e especificações.',
        'Consultoria de interiores — recomendações de mobiliário, iluminação, decoração e composição.',
        'Estudo preliminar de viabilidade — análise inicial das possibilidades e limitações do espaço ou terreno.',
        'Espaços comerciais — recomendações para funcionalidade, apresentação do ambiente e experiência dos clientes.',
        'Atendimento remoto ou presencial — reunião e orientação conforme a natureza e a localização da demanda.'
      ]
    }
  };

  function closeServicePanel() {
    if (!servicePanel) return;
    servicePanel.classList.remove('is-open');
    servicePanel.setAttribute('aria-hidden', 'true');
    startAutorotate();
  }

  function openServicePanel(serviceKey) {
    var service = serviceContent[serviceKey];
    if (!service) return;
    if (!servicePanel) {
      servicePanel = document.createElement('section');
      servicePanel.id = 'servicePanel';
      servicePanel.className = 'service-panel';
      servicePanel.setAttribute('role', 'dialog');
      servicePanel.setAttribute('aria-modal', 'true');
      servicePanel.setAttribute('aria-hidden', 'true');
      screenOverlay.appendChild(servicePanel);
    }
    servicePanel.innerHTML = '<div class="service-card"><header class="service-header"><div><p class="service-eyebrow">PROARQUI 3D <span> / </span> SERVIÇOS</p><h2 class="service-title"></h2><p class="service-subtitle">Soluções pensadas para cada projeto.</p></div><button type="button" class="service-close" aria-label="Fechar">×</button></header><div class="service-body"><p class="service-intro"></p><div class="service-section-heading"><span>01</span><h3>O que podemos desenvolver</h3></div><div class="service-items"></div><p class="service-note">Cada trabalho é personalizado e tem seu escopo definido conforme as necessidades do projeto.</p></div></div>';
    servicePanel.querySelector('.service-title').textContent = service.title;
    servicePanel.querySelector('.service-intro').textContent = service.intro;
    var list = servicePanel.querySelector('.service-items');
    service.items.forEach(function(item, index) {
      var parts = item.split(' — ');
      var card = document.createElement('article');
      card.className = 'service-item';
      var number = document.createElement('span');
      number.className = 'service-item-number';
      number.textContent = String(index + 1).padStart(2, '0');
      var heading = document.createElement('h4');
      heading.textContent = parts[0];
      var description = document.createElement('p');
      description.textContent = parts.slice(1).join(' — ');
      card.appendChild(number);
      card.appendChild(heading);
      card.appendChild(description);
      list.appendChild(card);
    });
    servicePanel.querySelector('.service-close').addEventListener('click', closeServicePanel);
    servicePanel.addEventListener('click', function(event) {
      if (event.target === servicePanel) closeServicePanel();
    });
    servicePanel.classList.add('is-open');
    servicePanel.setAttribute('aria-hidden', 'false');
    stopAutorotate();
  }

  function createServiceHotspotElement(hotspot) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-hotspot service-hotspot-label service-hotspot-label--' + hotspot.service;
    button.textContent = hotspot.title;
    button.setAttribute('aria-label', 'Ver serviço: ' + hotspot.title);
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      openServicePanel(hotspot.service);
    });
    stopTouchAndScrollEventPropagation(button);
    return button;
  }

  function createProjectHotspotElement(hotspot) {
    var projectName = hotspot.imageName || hotspot.title;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-hotspot';
    button.setAttribute('aria-label', 'Ver projeto: ' + projectName);
    button.setAttribute('title', projectName);
    button.textContent = 'Ver Projeto';

    // O clique preserva o ponto ancorado no ambiente 360°.
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      if (hotspot.documents && hotspot.documents.length) openProjectChoices(projectName, hotspot.documents);
      else if (hotspot.href) openProjectPdf(hotspot.href, projectName);
    });
    stopTouchAndScrollEventPropagation(button);
    return button;
  }

  function createLinkHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    // Create image element.
    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // Set rotation transform.
    var transformProperties = [ '-ms-transform', '-webkit-transform', 'transform' ];
    for (var i = 0; i < transformProperties.length; i++) {
      var property = transformProperties[i];
      icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    // Add click event handler.
    wrapper.addEventListener('click', function() {
      switchScene(findSceneById(hotspot.target));
    });

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    // Create tooltip element.
    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = findSceneDataById(hotspot.target).name;

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot) {

    // Create wrapper element to hold icon and tooltip.
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('info-hotspot');

    // Create hotspot/tooltip header.
    var header = document.createElement('div');
    header.classList.add('info-hotspot-header');

    // Create image element.
    var iconWrapper = document.createElement('div');
    iconWrapper.classList.add('info-hotspot-icon-wrapper');
    var icon = document.createElement('img');
    icon.src = 'img/info.png';
    icon.classList.add('info-hotspot-icon');
    iconWrapper.appendChild(icon);

    // Create title element.
    var titleWrapper = document.createElement('div');
    titleWrapper.classList.add('info-hotspot-title-wrapper');
    var title = document.createElement('div');
    title.classList.add('info-hotspot-title');
    title.innerHTML = hotspot.title;
    titleWrapper.appendChild(title);

    // Create close element.
    var closeWrapper = document.createElement('div');
    closeWrapper.classList.add('info-hotspot-close-wrapper');
    var closeIcon = document.createElement('img');
    closeIcon.src = 'img/close.png';
    closeIcon.classList.add('info-hotspot-close-icon');
    closeWrapper.appendChild(closeIcon);

    // Construct header element.
    header.appendChild(iconWrapper);
    header.appendChild(titleWrapper);
    header.appendChild(closeWrapper);

    // Create text element.
    var text = document.createElement('div');
    text.classList.add('info-hotspot-text');
    text.innerHTML = hotspot.text;

    // Place header and text into wrapper element.
    wrapper.appendChild(header);
    wrapper.appendChild(text);

    // Create a modal for the hotspot content to appear on mobile mode.
    var modal = document.createElement('div');
    modal.innerHTML = wrapper.innerHTML;
    modal.classList.add('info-hotspot-modal');
    document.body.appendChild(modal);

    var toggle = function() {
      wrapper.classList.toggle('visible');
      modal.classList.toggle('visible');
    };

    // Show content when hotspot is clicked.
    wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

    // Hide content when close icon is clicked.
    modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

    // Prevent touch and scroll events from reaching the parent element.
    // This prevents the view control logic from interfering with the hotspot.
    stopTouchAndScrollEventPropagation(wrapper);

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element, eventList) {
    var eventList = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel',
                      'wheel', 'mousewheel' ];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function(event) {
        event.stopPropagation();
      });
    }
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) {
        return scenes[i];
      }
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) {
        return data.scenes[i];
      }
    }
    return null;
  }

  // Display the initial scene.
  switchScene(scenes[0]);

})();
