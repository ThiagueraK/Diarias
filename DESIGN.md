# DESIGN.md — SGD Diárias + App do Motorista

> Documento de design para humanos **e para agentes de IA** (formato DESIGN.md, ver `voltagent/awesome-design-md`).
> Antes de mexer em tela do SGD (`index.html`, `equipe.html`) ou do App do Motorista (PWA `frontend/motorista_build/index.html`
> no notebook), leia este arquivo e siga os tokens, durações e receitas daqui. Criado em 01/11/2026.

Os dois produtos são **HTML/CSS/JS puro** (sem React, sem build). Bibliotecas React citadas na seção de referências servem
como **inspiração de padrão**: o efeito é reescrito em CSS + JS vanilla.

---

## 1. Atmosfera

| | SGD (painel do Thiago / setor) | App do Motorista (PWA) |
|---|---|---|
| Uso | Mesa, monitor grande, muitas horas por dia, decisão sobre dinheiro público | Celular, na rua, pressa, sinal ruim, usuário resistente a mudança |
| Personalidade de movimento | **Corporate/Premium**: preciso, calmo, nada pula sem motivo | **Corporate/Calm** com toques de **Playful** só em sucesso (diária enviada) |
| Tema | Claro, papel institucional, verde da Saúde | Escuro (`#070a13`), esmeralda + ciano, cara de app nativo |
| Densidade de animação | Baixa no trabalho repetitivo; média em painéis (Equipe, Central de Empenhos) | Baixa; feedback de toque sempre; nada que atrase o envio |

Regra-mãe: **animação explica o que mudou** (entrou, saiu, deu certo, deu erro, está carregando). Se não explica nada, não anima.

---

## 2. Cores e papéis

### SGD (claro) — tokens já existentes em `:root` do `index.html`
| Token | Valor | Papel |
|---|---|---|
| `--bg` | `#f6f7f9` | fundo da página |
| `--surface` / `--card` | `#ffffff` | cards, painéis |
| `--surface2` | `#f1f3f6` | cabeçalho de tabela, campos |
| `--border` / `--border-strong` | `#e3e7ed` / `#d4dae3` | divisórias |
| `--accent` / `--brand-deep` | `#2f7d5d` / `#245f47` | marca (Saúde), botão primário |
| `--accent2` | `#2563eb` | links, informação, 1Doc |
| `--success` + `--ok-soft` | `#1f9d57` + `#e6f6ee` | pago, conferido, ok |
| `--warning` + `--warn-soft` | `#c77d18` + `#fbf2e3` | atenção, revisar |
| `--danger` | `#d64545` | alerta, travado, erro |
| `--text` / `--text-muted` / `--text-dim` | `#1a2230` / `#5b6675` / `#97a1b0` | hierarquia de texto |

### App do Motorista (escuro) — tokens do PWA
| Token | Valor | Papel |
|---|---|---|
| `--bg-canvas` / `--bg-surface` / `--bg-surface-elevated` | `#070a13` / `#111a2e` / `#18243c` | camadas de profundidade |
| `--emerald` (+ `--emerald-glow`) | `#10b981` | ação principal, sucesso |
| `--cyan` | `#0ea5e9` | informação, GPS, progresso |
| `--amber` | `#f59e0b` | atenção |
| `--rose` | `#ef4444` | erro |
| `--blue-onedoc` | `#2563eb` | tudo que vai pro 1Doc |
| `--text-primary` / `--text-secondary` | `#f8fafc` / `#94a3b8` | texto |

Status com cor **sempre** acompanha ícone ou texto (daltonismo, sol no celular).

---

## 3. Tipografia
- **SGD:** IBM Plex Sans (texto), IBM Plex Mono (números de processo, empenho, valores em tabela). Orbitron/Chakra Petch **só** nos painéis "sala de controle" (Equipe de bots, radar) — nunca em formulário.
- **App:** Plus Jakarta Sans (texto), JetBrains Mono (placa, horário, protocolo).
- Números que mudam (contadores, valores) usam `font-variant-numeric: tabular-nums` para não "dançar" durante animação.
- Sem eyebrow em cima de todo título, sem palavra colorida no meio do título, sem CAPS espaçado em excesso (sinais de "cara de IA", ver Hallmark).

---

## 4. Componentes (estados obrigatórios)
Todo componente interativo tem: **normal, hover (só desktop), foco visível (teclado), pressionado, desabilitado, carregando, sucesso/erro** quando aplicável.

| Componente | Notas |
|---|---|
| Botão primário | fundo accent; pressionado = `scale(.97)` 60 ms; carregando = spinner no lugar do ícone, largura fixa (não pula) |
| Card de processo (Caixa) | entra com fade+subida 8 px; hover = sombra `--shadow-md` + `translateY(-1px)`; ao sair (empenhado/removido) colapsa altura depois do fade |
| Badge de status | troca de status = crossfade 150 ms + leve `scale(.9→1)`; "travado pelo Auditor" pulsa 1x ao aparecer, depois parado |
| Toast/aviso | entra da direita (desktop) / de baixo (celular), 250 ms; sai em 180 ms; some sozinho em 5 s (erro fica até fechar) |
| Modal (visualizador de anexos) | fundo escurece 200 ms; caixa `scale(.95→1)`+fade 300 ms; fecha em 200 ms |
| Skeleton | onda clara da esquerda pra direita 1,5 s; nunca spinner sozinho numa tela vazia |
| Campo com erro | borda vermelha 150 ms + mensagem desce 200 ms + 1 tremida de 200 ms (só no envio) |

---

## 5. Layout e espaço
- Escala de espaço: 4 · 8 · 12 · 16 · 24 · 32 · 48 px. Raio: SGD 8–12 px; App `--radius-sm 10` · `md 16` · `lg 22` · `xl 28`.
- SGD: largura útil até ~1400 px; tabelas com cabeçalho grudado (`position: sticky`).
- App: uma coluna, alvo de toque ≥ 44 px, ação principal fixa embaixo (zona do polegar), respeita `env(safe-area-inset-*)`.

## 6. Profundidade
- SGD: `--shadow-sm` (repouso) → `--shadow-md` (hover/elevado). Nada de sombra colorida.
- App: superfícies escuras em 3 camadas + `--shadow-floating` só pro que flutua (barra de ação, modal). Brilho (`--*-glow`) só no elemento em foco/sucesso.

---

## 7. Sistema de movimento (o coração deste documento)
Fonte dos números: LottieFiles `motion-design-skill` (tabelas de timing/easing) + Material 3.

### 7.1 Tokens (colar no `:root` dos dois produtos)
```css
:root{
  /* durações */
  --dur-micro: 100ms;   /* hover, tooltip, feedback de toque */
  --dur-fast: 160ms;    /* botão, toggle, troca de ícone/badge */
  --dur-base: 250ms;    /* card entra/sai, toast */
  --dur-modal: 320ms;   /* modal, painel lateral */
  --dur-page: 450ms;    /* troca de aba/tela */
  --dur-reveal: 800ms;  /* contador de número, gráfico desenhando */
  /* curvas */
  --ease-standard: cubic-bezier(.2,0,0,1);        /* MD3 padrão: movimento na tela */
  --ease-enter: cubic-bezier(.05,.7,.1,1);        /* MD3 enfatizado: entrar */
  --ease-exit: cubic-bezier(.3,0,1,1);            /* MD3 acelerar: sair */
  --ease-settle: cubic-bezier(.175,.885,.32,1.275); /* leve "assentar" — só sucesso */
  --stagger: 50ms;      /* atraso entre itens de lista */
}
@media (max-width: 640px){ :root{ --dur-base:200ms; --dur-modal:260ms; --dur-page:360ms; --stagger:35ms; } } /* celular = 0,8x */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:1ms!important; animation-iteration-count:1!important;
    transition-duration:1ms!important; scroll-behavior:auto!important; }
}
```

### 7.2 Regras
1. **Entrar** = `--ease-enter`; **sair** = `--ease-exit` e dura 65–75% da entrada; **mover na tela** = `--ease-standard`.
2. Animar **só `transform` e `opacity`** (GPU). Evitar animar `box-shadow`, `filter`, `width/height` em lista grande (máx. 3 elementos).
3. **Stagger**: listas entram em ordem de leitura, `--stagger` entre itens, **orçamento total ≤ 400 ms** (do 9º item em diante entram juntos).
4. Com 3+ elementos animando, no máximo 1/3 ao mesmo tempo.
5. Tudo que dispara junto começa dentro de 50 ms; mesma família de curva; varia só o atraso.
6. Hover entra em < 100 ms e sai em 150–200 ms. Toque/clique responde em < 150 ms.
7. **Nada de animação no caminho crítico**: botão "Empenhar", "Enviar diária", "Conferido" respondem na hora; a animação acontece **depois** da ação, nunca antes.
8. `prefers-reduced-motion`: sem deslocamento, só opacidade; sem loop automático. Já existe em partes do SGD — vale pra tudo.
9. Tema escuro (App): intensidade 10–20% menor; nada de flash branco.
10. Mesma ação = mesma animação, sempre. Informação crítica nunca **só** na animação.

### 7.3 Receitas prontas (CSS/JS vanilla)

**Lista/caixa carregando (dashboard load)**
```css
.entra{ opacity:0; transform:translateY(8px); animation: entra var(--dur-base) var(--ease-enter) forwards; animation-delay: calc(min(var(--i),8) * var(--stagger)); }
@keyframes entra{ to{ opacity:1; transform:none; } }
```
```js
lista.querySelectorAll('.proc-card').forEach((el,i)=>{ el.style.setProperty('--i', i); el.classList.add('entra'); });
```
Sequência: skeleton (100 ms) → número principal (250 ms, +100 ms) → cards em cascata → gráfico desenha junto com os cards.

**Card saindo (empenhado / tirado da caixa)**
```js
async function sairCard(el){
  el.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateX(24px)'}],{duration:180,easing:'cubic-bezier(.3,0,1,1)',fill:'forwards'}).finished
  const h = el.offsetHeight
  await el.animate([{height:h+'px',marginBottom:getComputedStyle(el).marginBottom},{height:'0px',marginBottom:'0px'}],{duration:200,easing:'cubic-bezier(.2,0,0,1)'}).finished
  el.remove()
}
```

**Sucesso ("✓ Conferido", diária enviada no App)** — 400–500 ms no total
1. botão/caixa `scale(.9→1)` 200 ms `--ease-settle`; 2. check desenha (stroke-dashoffset) 150 ms, +100 ms;
3. cor vai pro verde 200 ms; 4. (App) brilho `--emerald-glow` 300 ms e apaga.
```css
.check path{ stroke-dasharray:24; stroke-dashoffset:24; animation: risca 150ms 100ms var(--ease-enter) forwards; }
@keyframes risca{ to{ stroke-dashoffset:0; } }
```

**Erro de envio** — tremida ±10 px, 3 ciclos decrescentes, 320 ms, tinta vermelha; rola até o primeiro campo com erro (300 ms).

**Contador de número** (inspirado no Number Ticker da Magic UI) — valores da Central de Empenhos, totais do relatório:
```js
function contar(el, fim, ms=800){ const ini=performance.now(), fmt=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:2});
  (function passo(t){ const p=Math.min(1,(t-ini)/ms), e=1-Math.pow(1-p,3); el.textContent=fmt(fim*e); if(p<1) requestAnimationFrame(passo); })(ini); }
```

**Borda viva em item que precisa de atenção** (inspirado no Border Beam / Shine Border) — só 1 por tela, ex.: card travado pelo Auditor:
```css
.atencao{ position:relative; }
.atencao::before{ content:""; position:absolute; inset:-1px; border-radius:inherit; padding:1px;
  background: conic-gradient(from var(--a), transparent 70%, var(--danger) 85%, transparent 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
  animation: gira 3s linear infinite; }
@property --a{ syntax:'<angle>'; inherits:false; initial-value:0deg; }
@keyframes gira{ to{ --a:360deg; } }
```

**Skeleton** — gradiente varrendo 1,5 s, base 10–20% de opacidade, pico 30–40%.

**Modal** — fundo 200 ms → caixa `scale(.95→1)`+fade 300 ms (+50 ms) → conteúdo 200 ms (+100 ms) → botão fechar por último (150 ms).

**App: confirmação ao fotografar nota** — miniatura voa até a lista de comprovantes (`transform` 300 ms `--ease-standard`), contador "Comprovante 2 de 5" faz `scale(1.1→1)` 160 ms.

### 7.4 Quando usar biblioteca
| Necessidade | Use | Por quê |
|---|---|---|
| Transições simples, hover, entrada de lista | **CSS puro** (`transition`, `@keyframes`) | zero dependência |
| Sequência com `await`, sair de card, FLIP de reordenação | **Web Animations API** (`el.animate()`) | nativo do navegador |
| Coreografia complexa, scroll, molas | **Motion** (`motiondivision/motion`, versão vanilla `animate()`/`stagger()`/`inView()`) via `cdn.jsdelivr.net/npm/motion` | pequena, funciona sem React |
| Timeline longa, SVG desenhando, texto letra a letra | **Anime.js v4** | vanilla, ótima pra SVG |
| Ilustração animada (vazio, sucesso, carregando) | **lottie-web** + JSON da LottieFiles | arte pronta, leve |

Nunca carregar duas libs de animação na mesma página.

---

## 8. Faça / Não faça
**Faça:** animar só o que mudou · feedback em < 150 ms · respeitar reduced-motion · manter números tabulares · testar no celular do motorista (Android barato, 4G ruim) · uma animação "de destaque" por tela no máximo.
**Não faça:** animação que atrasa salvar/enviar · parallax e zoom de tela inteira · loop infinito fora de "precisa de atenção"/carregando · animar sombra em lista · bounce em tela de dinheiro (empenho, pagamento) · confete no SGD (no App, só na diária enviada, e discreto).

## 9. Responsivo
- `< 640 px`: durações 0,8x, stagger 30% menor, só opacidade + transform, uma coisa animando por vez.
- `640–1200 px`: padrão.
- `> 1200 px` (SGD em monitor): coreografia completa, cascata em grade (centro → fora) liberada nos painéis.

---

## 10. Referências (varredura de 01/11/2026)
Legenda: ✅ usar diretamente · 🎨 inspiração (reescrever em vanilla) · 🤖 ferramenta para o agente de IA · ⛔ fora do escopo destas telas.

### Componentes e padrões de UI
| Link | O que é | Uso aqui |
|---|---|---|
| [uiverse.io](https://uiverse.io) | Elementos em HTML/CSS puro (botões, loaders, toggles, checkboxes), código aberto | ✅ copiar loaders/toggles/checks direto, adaptando aos tokens |
| [magicui.design](https://magicui.design) | Componentes animados React/Tailwind/Motion (Number Ticker, Border Beam, Shimmer Button, Animated List, Marquee) | 🎨 contador de números, borda viva, lista animada (receitas §7.3) |
| [ui.aceternity.com](https://ui.aceternity.com) | Componentes animados React/Tailwind/Framer (Spotlight, Bento Grid, cards com brilho) | 🎨 painéis da Central de Empenhos / Equipe (spotlight no card em foco) |
| [reactbits.dev](https://reactbits.dev) | Textos animados, fundos e micro-interações React (CSS ou Tailwind) | 🎨 texto que se revela, fundos sutis do App (com moderação) |
| [21st.dev](https://21st.dev) | Registro da comunidade de componentes React/shadcn | 🎨 catálogo pra achar padrão de tela antes de desenhar |
| [prestigeui.com](https://prestigeui.com) | Blocos animados React/Tailwind/Motion; parte grátis, "All Access" US$ 49 | 🎨 só os gratuitos como referência; não comprar (não é React aqui) |
| [mobbin.com](https://mobbin.com) | Biblioteca de telas reais de apps (pago) | 🎨 referência de fluxo pro App do Motorista (câmera, envio, histórico) |

### Bibliotecas de animação
| Link | O que é | Uso aqui |
|---|---|---|
| [motiondivision/motion](https://github.com/motiondivision/motion) | Motion (ex-Framer Motion), tem API vanilla | ✅ lib principal se precisar de mais que CSS/WAAPI |
| [juliangarnier/anime](https://github.com/juliangarnier/anime) | Anime.js, timelines e SVG vanilla | ✅ alternativa para SVG/check desenhando |
| [airbnb/lottie-web](https://github.com/airbnb/lottie-web) | Player de animações Lottie (JSON) | ✅ estados vazios, sucesso, "lendo nota" no App |
| [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) | Skill de direção de movimento (tabelas de duração/curva, coreografia, acessibilidade) | 🤖 fonte dos números da §7; instalar no agente |

### Skills / ferramentas para o agente de IA
| Link | O que é | Uso aqui |
|---|---|---|
| [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md) | Coleção de DESIGN.md de marcas; define o formato deste arquivo | 🤖 formato adotado aqui |
| [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | Skill que evita "cara de IA" (eyebrow em todo título, caps espaçado, palavra colorida) + `/hallmark redesign` | 🤖 checklist da §3; rodar redesign em tela isolada (ex.: `multa.html`) antes de aplicar no SGD |
| [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills) | 273 skills de design (UX, UI, interação, design system, crítica visual) | 🤖 crítica visual e acessibilidade antes de publicar |
| [alchaincyf/huashu-design](https://github.com/alchaincyf/huashu-design) | Skill de protótipo: gera 3 direções antes de escolher, usa marca real | 🤖 quando for desenhar tela nova (ex.: módulo de Empenho de Contratos) |
| [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | Transforma o código em grafo consultável (não é design) | 🤖 útil pra navegar o `index.html` de 600 KB e o Worker; não é UI |

### Galerias e inspiração (enviadas pelo Thiago em 12/11/2026, para reformular a UI/UX)
Classificadas pela descrição das listas que ele mandou; **ainda não abertas uma a uma**. Antes de redesenhar uma tela, abrir as marcadas ⭐ e anotar aqui o padrão escolhido (link da tela + o que copiar).

| Link | O que é | Uso aqui |
|---|---|---|
| ⭐ [styles.refero.design](https://styles.refero.design) | Estilos de produtos reais (cores, tipografia, componentes) | 🎨 1ª parada para o SGD: painel de trabalho, não landing |
| ⭐ [mobbin.com](https://mobbin.com) | Telas reais de apps (já citado acima) | 🎨 listas, filas, caixas de entrada, filtros, estados vazios |
| ⭐ [jiro.build](https://jiro.build) | 1400+ designs com prompt pronto para IA e código-fonte | 🎨🤖 achar um painel/lista parecido e adaptar o código aos tokens §2 |
| ⭐ [beui.dev](https://beui.dev) | Componentes animados | 🎨 micro-interações dentro das regras §7 (reescrever em vanilla) |
| ⭐ [60fps.design](https://60fps.design) | Animações de UI mobile | 🎨 App do Motorista e equipe.html (celular) |
| [recent.design](https://recent.design) | Galeria de design recente | 🎨 referência geral |
| [on.design](https://on.design) | Comunidade de design | 🎨 referência geral |
| [wonderlist.design](https://wonderlist.design) | Designs em Figma | 🎨 referência geral |
| [navbar.gallery](https://navbar.gallery) | Barras de navegação | 🎨 abas do topo do SGD |
| [cta.gallery](https://cta.gallery) | Botões/chamadas de ação | 🎨 botão principal de cada tela (Empenhar, Passar, Conferido) |
| [iconly.design](https://iconly.design) | Pacote de ícones | ✅/🎨 trocar emojis por ícones coerentes (ver licença antes) |
| [fontinlogo.com](https://fontinlogo.com) | Fontes usadas por marcas | 🎨 só se for revisar a tipografia §3 |
| [modulify.ai](https://modulify.ai) e [modulify.ai/templates](https://modulify.ai/templates) | Ferramenta de "vibecoding" e modelos grátis | 🎨 modelos; o SGD continua HTML/JS puro |
| [motionin.design](https://motionin.design) | Gera site a partir de um prompt | 🤖 protótipo rápido de uma direção, nunca colar direto |
| [paperanimation.ai](https://paperanimation.ai) | Animação estilo papel | ⛔ painel · 💡 vídeo curto de treino |
| [landdding.com](https://landdding.com), [godly.website](https://godly.website) | Landing pages premiadas | ⛔ SGD é ferramenta de trabalho · 💡 página pública, se houver |
| [footer.design](https://footer.design) | Rodapés | ⛔ o SGD não tem rodapé |
| [backgrounds.supply](https://backgrounds.supply) | Fundos | ⛔ SGD (fundo neutro §2) · 💡 tela de login |
| [posts.design](https://posts.design) | Posts de grandes marcas | ⛔ |
| [logotouse.com](https://logotouse.com) | Logos premium | ⛔ |
| [sent.dm](https://sent.dm) | SMS barato | ⛔ não é design · 💡 aviso por SMS a motorista, se um dia precisar |

#### O que se tirou dos ⭐ (abertos em 12/11/2026)
- **styles.refero.design → Linear** (o mais útil para o SGD, lista de trabalho tipo caixa de entrada): separar com **linha fina de 1px em vez de sombra**; **uma só cor de ação por tela** (o botão principal; nada mais colorido); números de processo/empenho em **mono**; densidade compacta (linha ~40 px, espaços 8/12/24); só 3 raios (6 botão, 12 painel, 999 pílula); peso máximo 600, sem negrito pesado; status em etiqueta pequena e discreta, não em pílula colorida grande.
- **jiro.build**: biblioteca de sites/landing com prompt e código — pouco útil para painel; serve para tela pública.
- **beui.dev**: componentes React (Motion + Tailwind); úteis como ideia de "Animated Collapsible", "Sortable List", "Timeline" (reescrever em vanilla, §7.4).
- **60fps.design**: catálogo de animações de apps (filtros por efeito: Stagger, Ticker, Shimmer, Pulse…) — referência para o App do Motorista e equipe.html.
- **mobbin.com**: bloqueou o acesso sem conta (403).
- Aplicação: **caixa = lista agrupada**, o que pede ação aberto em cima e o resto recolhido com contagem; detalhe (último despacho) em 2ª linha cinza; "dias parado" à direita em mono. Propostas A/B/C da seção Caixa de Compras foram montadas com esses princípios.

### Fora do escopo destas telas (anotado para outros usos)
| Link | O que é | Possível uso futuro |
|---|---|---|
| [remotion-dev/remotion](https://github.com/remotion-dev/remotion) + [remotion-dev/skills](https://github.com/remotion-dev/skills) | Vídeo programático em React | ⛔ UI · 💡 vídeo curto ensinando o motorista a fotografar a nota |
| [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | Animação matemática em Python | ⛔ |
| [mrdoob/three.js](https://github.com/mrdoob/three.js), [three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer), [three.quarks](https://github.com/Alchemist0823/three.quarks), [pmndrs/postprocessing](https://github.com/pmndrs/postprocessing), [jrouwe/JoltPhysics](https://github.com/jrouwe/JoltPhysics) | 3D, partículas, física | ⛔ pesado demais para painel de trabalho e celular de motorista |
| [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp), [EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills) | Blender controlado por IA | ⛔ |
| [cocopon/tweakpane](https://github.com/cocopon/tweakpane) | Painel de ajuste de parâmetros | 💡 só em desenvolvimento, pra calibrar durações/curvas ao vivo |
| [comfyanonymous/ComfyUI](https://github.com/comfyanonymous/ComfyUI) | Geração de imagem por nós | ⛔ |
| [FunAudioLLM/CosyVoice](https://github.com/FunAudioLLM/CosyVoice), [librosa](https://github.com/librosa/librosa), [m-bain/whisperX](https://github.com/m-bain/whisperX) | Voz e áudio | ⛔ UI · 💡 WhisperX: transcrever áudio de motorista no bot |
| [obsproject/obs-studio](https://github.com/obsproject/obs-studio), [mifi/lossless-cut](https://github.com/mifi/lossless-cut), [FFmpeg](https://github.com/FFmpeg/FFmpeg) | Gravação/edição de vídeo | ⛔ |

---

## 11. Guia rápido para o agente (Agent Prompt Guide)
- Produto? **SGD** → tema claro, tokens §2 (SGD), personalidade Corporate/Premium. **App** → tema escuro, tokens §2 (App), Corporate/Calm.
- Sempre: tokens de movimento §7.1, regras §7.2, receita pronta §7.3 antes de inventar.
- Animar só `transform`/`opacity`; respeitar `prefers-reduced-motion`; nunca atrasar ação de salvar/enviar/empenhar.
- SGD: subir `header-version` a cada mudança. App: editar no notebook com backup (`*.pre-<algo>-<data>`), não está no git.
- Testar: monitor do Thiago (SGD) e Android barato em 4G (App).
