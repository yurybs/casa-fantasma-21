# Toy Blaster Kid — Plano de Desenvolvimento

## Visão Geral

Jogo de plataforma 2D para web, gratuito, inspirado em Super Mario Bros. com estética pixel art estilo Minecraft. O personagem principal é um menino com armas de brinquedo que deve passar por 21 níveis derrotando inimigos e chefões. Público-alvo: crianças de 8 anos fãs de Mario e Pokémon.

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Engine | **Phaser 3** | Madura, canvas/WebGL, física, tilemaps, áudio |
| Linguagem | **TypeScript** | Tipagem estrita, erros em tempo de desenvolvimento |
| Build | **Vite** | Hot reload instantâneo, bundle otimizado |
| Unit/Integration Tests | **Vitest** | Compatível com Vite, mock nativo, rápido |
| E2E Tests | **Playwright** | Chromium headless, automação real de browser |
| CI/CD | **GitHub Actions + GitHub Pages** | Deploy gratuito, automático em push |

> **Nota sobre sprites no Sprint 1:** Os sprites são gerados programaticamente via `Phaser.Graphics` (retângulos coloridos com estilo pixel-art). Isso elimina dependência de arquivos de imagem externos no MVP, permitindo foco total na mecânica.

---

## Estrutura do Projeto

```
toy-blaster-kid/
├── src/
│   ├── main.ts
│   ├── config/
│   │   ├── GameConfig.ts          # Config global do Phaser
│   │   ├── LevelConfig.ts         # Dados dos 21 níveis
│   │   └── EnemyConfig.ts         # Stats de inimigos e chefões
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MenuScene.ts
│   │   ├── WorldMapScene.ts       # Mapa entre níveis (estilo Mario World)
│   │   ├── GameScene.ts           # Cena principal de jogo
│   │   ├── BossScene.ts           # Batalha contra chefão
│   │   ├── BossIntroScene.ts      # Carta estilo Pokédex antes do boss
│   │   ├── PauseScene.ts
│   │   ├── GameOverScene.ts
│   │   └── VictoryScene.ts
│   ├── entities/
│   │   ├── Player.ts
│   │   ├── enemies/
│   │   │   ├── BaseEnemy.ts
│   │   │   ├── Skeleton.ts
│   │   │   ├── Zombie.ts
│   │   │   ├── SpiderGhost.ts
│   │   │   ├── FireGhost.ts
│   │   │   ├── Bat.ts
│   │   │   └── MiniEnemy.ts       # Genérico para minis de boss
│   │   └── bosses/
│   │       ├── BaseBoss.ts
│   │       ├── GhostBoss.ts       # Nível 2
│   │       ├── ClownBoss.ts       # Nível 4
│   │       ├── ScarecrowBoss.ts   # Nível 6
│   │       ├── TRexBoss.ts        # Nível 9
│   │       ├── VampireBoss.ts     # Nível 11
│   │       ├── FireballBoss.ts    # Nível 13
│   │       ├── OctopusBoss.ts     # Nível 15
│   │       ├── ScorpionBoss.ts    # Nível 19
│   │       └── RobotBoss.ts       # Nível 21
│   ├── weapons/
│   │   ├── BaseWeapon.ts
│   │   ├── FoamGun.ts
│   │   ├── WaterGun.ts
│   │   └── NerfRifle.ts
│   ├── systems/
│   │   ├── InputSystem.ts
│   │   ├── PhysicsSystem.ts
│   │   ├── CollisionSystem.ts
│   │   ├── CameraSystem.ts
│   │   ├── DotSystem.ts           # Damage over time (veneno)
│   │   ├── SaveSystem.ts
│   │   ├── SoundSystem.ts
│   │   └── HUDSystem.ts
│   ├── ui/
│   │   ├── HealthBar.ts
│   │   ├── CoinCounter.ts
│   │   ├── LivesDisplay.ts
│   │   ├── PoisonIndicator.ts
│   │   └── TouchControls.ts
│   ├── utils/
│   │   ├── TilemapBuilder.ts
│   │   ├── AnimationFactory.ts
│   │   └── ObjectPool.ts          # Pool de projéteis e partículas
│   └── types/
│       └── GameTypes.ts
├── assets/
│   ├── sprites/                   # Adicionados a partir do Sprint 2 (pixel art final)
│   ├── tilesets/                  # Um por mundo (mundos 2–4 a partir do Sprint 4)
│   ├── tilemaps/                  # level_01.json … level_21.json
│   └── audio/                     # Adicionado no Sprint 2 (Nível 1), expandido nos seguintes
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .github/workflows/ci.yml
├── playwright.config.ts
├── vitest.config.ts
├── vite.config.ts
└── package.json
```

---

## Mecânicas Completas

### Personagem — "Toy Blaster Kid"
| Ação | Teclado | Mobile |
|---|---|---|
| Mover | Setas / A-D | D-pad |
| Pular (simples/duplo) | Espaço / W / ↑ | Botão A |
| Atirar | Z / J | Botão B |
| Agachar | S / ↓ | ↓ no D-pad |
| Pausar | Esc / P | Botão Pause |

- **Vida:** 3 corações × 2 HP = 6 HP. Máx 5 corações com power-ups
- **Vidas:** 3. Chegar a 0 → Game Over
- **Invencibilidade:** 1,5s após dano (personagem pisca)
- **Pulo variável:** segurar = pulo alto, soltar cedo = pulo baixo

### Power-ups
| Item | Efeito | Duração |
|---|---|---|
| Pistola de Água | Dano duplo em Fantasma e Vampiro; cancela lifesteal | 30s |
| Nerf Rifle | Projéteis mais rápidos, +1 dano | 30s |
| Estrela de Brinquedo | Invencibilidade + dano por contato | 10s |
| Coração Extra | +1 coração (máx 5) | Permanente |
| Moeda de Ouro | +1 contador; 100 moedas = vida extra | — |

### Sistema de Progressão e Save
```typescript
interface SaveData {
  currentLevel: number;
  lives: number;
  coins: number;
  levelsCompleted: boolean[];   // [21]
  checkpoints: Record<number, number>; // level → checkpoint index
  unlockedWorlds: number[];
  highScore: number;
}
```
- Salvo no `localStorage` ao completar nível ou atingir checkpoint
- Bandeiras de checkpoint dentro de níveis longos (≥ 4 telas)

---

## Mundos e Níveis

| Mundo | Níveis | Tema | Tileset |
|---|---|---|---|
| 1 — Floresta Encantada | 1–3 | Árvores, grama, flores | `world1_grass` |
| 2 — Caverna Assombrada | 4–6 | Pedras, estalactites | `world2_cave` |
| 3 — Cidade Abandonada | 7–12 | Prédios, asfalto | `world3_city` |
| 4 — Castelo do Robô | 13–21 | Metal, lasers, engrenagens | `world4_castle` |

| Nível | Tipo | Chefão | Inimigos |
|---|---|---|---|
| 1 | Normal | — | Esqueleto, Zumbi |
| **2** | **BOSS** | **Fantasma** | Mini Fantasma, Monstrinhos |
| 3 | Normal | — | Esqueleto, Zumbi, Fantasma Aranha |
| **4** | **BOSS** | **Palhaço** | Mini Palhaço, Monstrinhos |
| 5 | Normal | — | Zumbi, Fantasma Aranha |
| **6** | **BOSS** | **Espantalho** | Mini Espantalho, Corvos |
| 7 | Normal | — | Esqueleto, Fantasma de Fogo |
| 8 | Normal | — | Zumbi, Fantasma Aranha |
| **9** | **BOSS** | **T-Rex** | Mini T-Rex, Esqueleto |
| 10 | Normal | — | Fantasma de Fogo, Mini T-Rex |
| **11** | **BOSS** | **Vampiro** | Mini Vampiro, Morcegos |
| 12 | Normal | — | Mini Vampiro, Fantasma de Fogo |
| **13** | **BOSS** | **Bola de Fogo** | Mini Bola de Fogo |
| 14 | Normal | — | Mini Bola de Fogo, Zumbi |
| **15** | **BOSS** | **Polvo** | Mini Polvo, Monstrinhos |
| 16 | Normal | — | Mini Polvo, Esqueleto |
| 17 | Normal | — | Todos os minis anteriores |
| 18 | Normal | — | Mix de inimigos difíceis |
| **19** | **BOSS** | **Escorpião** | Mini Escorpião, Fantasma Aranha |
| 20 | Normal | — | Mini Robô Aranha, todos os minis |
| **21** | **BOSS FINAL** | **Robô do Mal** | Mini Robô, Mini Escorpião |

---

## Chefões — Comportamento Detalhado

### Nível 2 — Fantasma (HP: 30)
- Flutua; pode atravessar paredes por 2s
- Ataque 1: investida horizontal rápida
- Ataque 2 (≤50% HP): invoca 2 mini-fantasmas
- Fraqueza: Pistola de Água = dano duplo

### Nível 4 — Palhaço (HP: 50, 2 fases)
- Fase 1: arremessa 3 bolas em arco, pula entre plataformas a cada 5s
- Fase 2 (≤50% HP): velocidade +40%, efeito de distorção visual (risada)

### Nível 6 — Espantalho (HP: 70, 2 fases)
- Braços se estendem 3 tiles horizontalmente
- Invoca corvos em padrão senoidal
- Fase 2 (≤40% HP): braços giram 360°

### Nível 9 — T-Rex (HP: 120, 3 fases)
- Fase 1: caminhada pesada, rugido com camera shake
- Fase 2 (≤66% HP): investida atravessando arena
- Fase 3 (≤33% HP): pisada = onda de choque no chão

### Nível 11 — Vampiro (HP: 100, 2 fases)
- Lifesteal: recupera 5 HP a cada 3 acertos no jogador
- Dispara morcegos teleguiados
- Fase 2 (≤50% HP): transforma em morcego gigante, velocidade ×3
- Fraqueza: Pistola de Água cancela lifesteal por 5s

### Nível 13 — Bola de Fogo (HP: 90, 2 fases)
- Deixa rastro de fogo por 3s
- Explode em área (raio 2 tiles) ao colidir com paredes
- Fase 2 (≤50% HP): divide-se em 2 bolas temporariamente

### Nível 15 — Polvo (HP: 140, 3 fases)
- 4 tentáculos atacam posições diferentes
- Lança tinta: escurece 30% da tela por 4s
- Fase 2 (≤60% HP): +2 tentáculos
- Fase 3 (≤30% HP): tinta contínua + tentáculos frenéticos

### Nível 19 — Escorpião (HP: 160, 3 fases)
- Veneno DoT: 1 dano a cada 2s por 8s
- Carapaça frontal: imune a projéteis pela frente; ponto fraco = cauda
- Fase 2 (≤50% HP): veneno mais rápido (1 dano/s)
- Fase 3 (≤20% HP): frenesi de pinças

### Nível 21 — Robô do Mal (HP: 300, 4 fases)
- Fase 1: mísseis teleguiados + laser horizontal
- Fase 2 (≤75% HP): laser vertical varrendo arena
- Fase 3 (≤50% HP): 3 mini-robôs aranha + escudo de energia
- Fase 4 (≤25% HP): todas as habilidades simultâneas
- Derrota: explosão em pixels estilo Minecraft + cutscene vitória

---

## Visual — Pixel Art Estilo Minecraft

| Regra | Detalhe |
|---|---|
| Anti-aliasing | **Desativado** (`antialias: false` no Phaser) |
| Tiles | 16×16px, aspecto quadrado e blocos sólidos |
| Player | 32×48px (2 blocos de altura) |
| Inimigos comuns | 32×32px |
| Chefões | 64×64px a 128×128px |
| Projéteis | 8×8px |

| Mundo | Paleta Principal |
|---|---|
| Floresta | Verde #5B8A52, Marrom #8B5E3C, Céu #87CEEB |
| Caverna | Cinza #555, Azul Escuro #1A1A2E, Tocha #FF6B35 |
| Cidade | Asfalto #3D3D3D, Neon #FFE600, Vermelho #CC2936 |
| Castelo | Prata #B0B0B0, Vermelho Escuro #8B0000, Preto #111 |

---

---

# SPRINTS DE DESENVOLVIMENTO

> **Regra de autorização:** Cada sprint só começa após confirmação explícita do responsável.
> Cada sprint entrega um jogo jogável e uma suite de testes automatizados que passam 100%.

---

## SPRINT 1 — MVP Jogável: Nível 1 com todas as mecânicas ✅ CONCLUÍDO

**Duração estimada:** 1 semana
**Status:** ✅ **CONCLUÍDO** — 111 testes passando (unit + integration + E2E)

### Objetivo
Primeira fase completamente jogável com todas as mecânicas centrais funcionando. Sprites gerados programaticamente (sem dependência de arquivos de imagem externos).

### Entregável
> Jogo rodando no browser. O jogador pode: abrir menu → jogar Nível 1 → mover, pular (duplo pulo), atirar, matar inimigos (Esqueleto, Zumbi), coletar moedas, tomar dano, perder vidas, sofrer Game Over, chegar à bandeira final e ver tela de vitória do nível.

### Escopo Técnico

**Setup:**
- Projeto Vite + Phaser 3 + TypeScript
- Vitest configurado com mocks para Phaser
- Playwright configurado com servidor de dev
- `package.json` com todos os scripts de teste

**Cenas:**
- `BootScene` → `PreloadScene` (barra de carregamento)
- `MenuScene` (título + botão Jogar)
- `GameScene` (nível 1)
- `GameOverScene` + `LevelCompleteScene`

**Player (src/entities/Player.ts):**
- Movimento horizontal com aceleração e fricção
- Pulo simples e duplo pulo (resetado ao tocar o chão)
- Pulo variável (segurar = maior)
- Shoot: projétil de espuma para frente, cooldown 300ms
- 6 HP (3 corações), invencibilidade 1,5s após dano
- 3 vidas; morte → perde vida → respawn ou Game Over
- Animações via `Phaser.Graphics`: idle, run, jump, shoot, hurt, die

**Física (PhysicsSystem):**
- Gravidade 980px/s²
- Terminal velocity de queda: 600px/s
- Plataformas sólidas por cima, passáveis por baixo

**Nível 1 (assets/tilemaps/level_01.json):**
- Tilemap em JSON do Tiled, ~5 telas de largura
- Tiles gerados por `Phaser.Graphics` (sem PNG externo)
- Esqueleto × 4, Zumbi × 3, moedas × 20
- Bandeira de chegada no final

**Inimigos:**
- `Skeleton`: patrulha entre bordas, lança osso a cada 2s
- `Zombie`: detecta jogador em 200px, persegue lentamente

**HUD:**
- Corações (vida), contador de moedas, cronômetro
- Contador de vidas

**Save (básico):**
- Salva `lives` e `coins` no `localStorage` ao completar o nível

### Testes do Sprint 1

**Unit Tests (Vitest):**
```
tests/unit/entities/Player.test.ts
  ✓ inicia com 6 HP e 3 vidas
  ✓ takeDamage() reduz HP corretamente
  ✓ HP não vai abaixo de 0
  ✓ HP 0 aciona morte e reduz vida
  ✓ invencibilidade ativa por 1,5s após dano
  ✓ não toma dano durante invencibilidade
  ✓ duplo pulo disponível após pulo simples
  ✓ duplo pulo não permite terceiro pulo
  ✓ jumpsAvailable resetado ao tocar o chão
  ✓ collectCoin() incrementa contador
  ✓ 100 moedas concedem 1 vida extra

tests/unit/entities/Skeleton.test.ts
  ✓ inverte direção ao atingir borda de plataforma
  ✓ lança projétil a cada 2s
  ✓ morre quando HP ≤ 0
  ✓ takeDamage() reduz HP

tests/unit/entities/Zombie.test.ts
  ✓ permanece parado se jogador > 200px
  ✓ persegue jogador quando ≤ 200px
  ✓ morre quando HP ≤ 0

tests/unit/systems/PhysicsSystem.test.ts
  ✓ aplica gravidade a cada frame
  ✓ respeita terminal velocity
  ✓ pulo alto com keydown longo
  ✓ pulo baixo com keydown curto

tests/unit/systems/CollisionSystem.test.ts
  ✓ detecta colisão jogador-plataforma (topo)
  ✓ ignora colisão plataforma por baixo
  ✓ detecta colisão projétil-inimigo
  ✓ detecta colisão inimigo-jogador
  ✓ sem colisão fora do range

tests/unit/weapons/FoamGun.test.ts
  ✓ dispara projétil na direção do jogador
  ✓ cooldown impede disparo imediato
  ✓ projétil some ao atingir parede
  ✓ projétil aplica 1 de dano ao inimigo

tests/unit/systems/SaveSystem.test.ts
  ✓ salva SaveData no localStorage
  ✓ carrega SaveData do localStorage
  ✓ retorna novo jogo padrão se save inválido ou ausente
  ✓ markLevelComplete() atualiza levelsCompleted[]
```

**Integration Tests (Vitest):**
```
tests/integration/PlayerEnemyInteraction.test.ts
  ✓ colisão jogador-inimigo reduz HP do jogador
  ✓ projétil atinge inimigo e reduz HP do inimigo
  ✓ inimigo com HP 0 é removido da cena
  ✓ moeda coletada incrementa Player.coins
  ✓ bandeira de chegada aciona LevelComplete

tests/integration/GameFlow.test.ts
  ✓ 0 vidas → dispara evento GameOver
  ✓ completar nível → marca level 1 como completo no save
  ✓ reiniciar após Game Over → lives resetado para 3
```

**E2E Tests (Playwright):**
```
tests/e2e/sprint1.spec.ts
  ✓ página carrega sem erros de console
  ✓ menu exibe título "Toy Blaster Kid"
  ✓ clicar "Jogar" inicia o Nível 1
  ✓ personagem aparece na posição inicial
  ✓ pressionar → move o personagem para a direita
  ✓ pressionar Espaço faz o personagem pular
  ✓ segundo Espaço no ar executa duplo pulo
  ✓ pressionar Z dispara projétil visível
  ✓ projétil desaparece ao atingir parede
  ✓ inimigo some ao ser atingido por projétil (HP = 0)
  ✓ HUD exibe 3 corações, 0 moedas, timer ativo
  ✓ colidir com inimigo reduz corações no HUD
  ✓ alcançar bandeira exibe tela "Nível Completo"
  ✓ pressionar Esc exibe menu de pausa
  ✓ retomar do pause continua o jogo
```

### Critério de Conclusão do Sprint 1
- [x] `npm run test:unit` → 100% passando
- [x] `npm run test:integration` → 100% passando
- [x] `npm run test:e2e` → 100% passando
- [x] `npm run build` → sem erros de TypeScript
- [x] Jogo jogável manualmente pelo responsável

---

## SPRINT 2 — Nível 1 Polido: Prévia da Qualidade Final do Jogo

**Duração estimada:** 1,5 semanas
**Gate:** Aguardando autorização para iniciar

### Objetivo
Transformar o Nível 1 em uma vitrine da qualidade final do jogo completo: áudio, controles mobile, efeitos visuais, partículas, transições suaves, CI/CD e deploy no GitHub Pages — tudo restrito ao Nível 1. O cliente verá exatamente como será o produto final, mas com um único nível.

### Entregável
> URL pública funcionando. O Nível 1 tem sons em todos os eventos, funciona perfeitamente em tablet com D-pad virtual, tem partículas, flash de dano, transições suaves entre cenas, e roda com 60fps estáveis. Push em `main` faz deploy automático via GitHub Actions.

### Escopo Técnico

**Áudio (`SoundSystem`) — restrito ao Nível 1:**
- BGM do Mundo 1 em loop (`.ogg` + `.mp3` fallback)
- SFX para todos os eventos do Nível 1: `jump`, `shoot`, `hit`, `coin`, `die`, `level_clear`, `power_up`
- Controle de volume master e categorias (music/sfx) no menu de pausa
- Web Audio API — iniciado no primeiro input do usuário (política dos browsers)

**Mobile (`TouchControls`) — Nível 1:**
- D-pad virtual: ←↑→ + botão A (pulo) + botão B (atirar) + botão Pause
- Detecta touch vs mouse: controles touch só aparecem em tela sensível ao toque
- Posicionado no canto inferior sem obscurecer a ação
- Responsivo: 375px (phone) a 1024px (tablet)

**Efeitos Visuais — Nível 1:**
- Partículas de moeda coletada (faíscas douradas via Phaser.Particles)
- Flash branco no personagem ao tomar dano (tint animation)
- Poeira ao pousar de pulo alto (puff de partículas)
- Trail no projétil de espuma
- Explosão de partículas ao matar inimigo (burst colorido)
- Transições de cena: fade in/out 300ms em todas as transições
- Animação de entrada da `MenuScene` (slide + fade)

**Sprites Pixel-Art desenhados (substituindo `Phaser.Graphics`):**
- Player: spritesheet com frames idle, run (4f), jump, shoot, hurt, die em PNG 16-bit pixel art estilo Minecraft
- Skeleton, Zombie: spritesheet walk + attack + die
- Tiles do Mundo 1: ground, platform, background, sky em 16×16px
- Moeda animada (4 frames de rotação), Bandeira (hasteada 3 frames)
- HUD: ícones de coração, moeda, vidas em pixel art

**Pause Menu completo:**
- Retomar / Reiniciar Nível / Sair para o Menu / Volume Music / Volume SFX

**CI/CD (`.github/workflows/ci.yml`):**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npm run build
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Performance — Nível 1:**
- Object pooling para projéteis e partículas (sem GC spikes)
- Sprites fora da câmera têm física desativada
- Audit: `game.loop.delta` < 16ms target

**Acessibilidade infantil:**
- Fonte mínima 16px no HUD
- Botões ≥ 44×44px no mobile
- Contraste AA nas cores do HUD

### Testes do Sprint 2

**Unit Tests (Vitest):**
```
tests/unit/systems/SoundSystem.test.ts
  ✓ play() agenda áudio pelo key correto
  ✓ setMusicVolume() ajusta gain node
  ✓ setSfxVolume() ajusta gain node
  ✓ mute/unmute preserva volumes anteriores
  ✓ não lança erro se AudioContext não disponível

tests/unit/ui/TouchControls.test.ts
  ✓ mapeia touchstart em D-pad ← para ação moveLeft
  ✓ mapeia touchstart em D-pad → para ação moveRight
  ✓ mapeia touchstart em botão A para ação jump
  ✓ mapeia touchstart em botão B para ação shoot
  ✓ touchend limpa a ação correspondente
  ✓ não interfere com teclado quando touch não ativo
```

**Integration Tests (Vitest):**
```
tests/integration/AudioEvents.test.ts
  ✓ collectCoin dispara SFX 'coin'
  ✓ takeDamage dispara SFX 'hit'
  ✓ player jump dispara SFX 'jump'
  ✓ player die dispara SFX 'die'
  ✓ levelComplete dispara SFX 'level_clear'
  ✓ shoot dispara SFX 'shoot'

tests/integration/TouchInputEquivalence.test.ts
  ✓ touch D-pad → gera mesmo InputState que tecla ArrowRight
  ✓ touch botão A → gera mesmo InputState que tecla Space
  ✓ touch botão B → gera mesmo InputState que tecla Z
```

**E2E Tests (Playwright):**
```
tests/e2e/sprint2.spec.ts
  ✓ URL do GitHub Pages carrega o jogo
  ✓ viewport 768px (tablet): D-pad virtual visível
  ✓ toque no botão A faz o personagem pular
  ✓ toque no D-pad → move o personagem para a direita
  ✓ toque no botão B dispara projétil
  ✓ coletar moeda dispara partículas douradas
  ✓ tomar dano exibe flash branco no personagem
  ✓ matar inimigo exibe burst de partículas
  ✓ transição Menu → Jogo tem fade de 300ms
  ✓ transição Jogo → Game Over tem fade de 300ms
  ✓ pause exibe controles de volume
  ✓ build de produção não tem erros de console
  ✓ 60fps estável durante 5s de gameplay (delta < 20ms)
```

### Critério de Conclusão do Sprint 2
- [ ] URL pública do GitHub Pages funcionando com o Nível 1
- [ ] CI passando em `main` (unit + integration + E2E + build)
- [ ] `npm run test:all` → 100% passando
- [ ] D-pad funciona em viewport 375px e 768px
- [ ] Sons tocam em todos os eventos do Nível 1
- [ ] 60fps estável no Chrome
- [ ] TypeScript sem erros (`npm run type-check`)
- [ ] Jogo aprovado visualmente pelo responsável

---

## SPRINT 3 — Mundo 1 Completo (Níveis 1–3 + Boss Fantasma)

**Duração estimada:** 1 semana
**Gate:** Aguardando autorização para iniciar (após Sprint 2)

### Objetivo
Mundo 1 completo com mapa de mundo navegável, batalha de boss (Fantasma), sistema de save com checkpoints e carta estilo Pokédex antes do boss.

### Entregável
> O jogador pode abrir o mapa do Mundo 1, selecionar qualquer nível já desbloqueado, jogar os Níveis 1, 2 (boss Fantasma) e 3, salvar progresso entre sessões, e passar pelos checkpoints em níveis longos.

### Escopo Técnico
- `WorldMapScene`: nós conectados estilo Mario World, nível desbloqueado acende
- `BossIntroScene`: carta com silhueta + nome + tipo estilo Pokédex (2s antes do boss)
- Nível 2: arena fechada para boss
- `GhostBoss`: flutua, dash attack, invoca 2 mini-fantasmas a 50% HP, fraqueza à água
- `MiniGhost`: versão pequena com comportamento simplificado
- Nível 3: tilemap com `SpiderGhost` (flutua, desce em teia)
- `WaterGun`: power-up no Nível 2, dano duplo em fantasmas
- Bandeiras de checkpoint dentro de níveis
- `SaveSystem` completo: checkpoints + nível completado + estado do mapa

### Testes do Sprint 3
**Unit:** `GhostBoss` (fases, spawn de minis, fraqueza), `SpiderGhost`, `WaterGun`, checkpoint save/load
**Integration:** boss fight fluxo completo, WaterGun + GhostBoss dano duplo, checkpoint persistido após morte
**E2E:** completar nível 1 → mapa → entrar nível 2 → ver carta Pokédex → derrotar Fantasma → nível 3 desbloqueado → save persiste no reload

### Critério de Conclusão
- [ ] Todos os testes passando
- [ ] Mundo 1 jogável do início ao fim
- [ ] Save persiste entre sessões do browser

---

## SPRINT 5 — Mundo 2 (Níveis 4–6 + Palhaço + Espantalho)

**Duração estimada:** 1 semana
**Gate:** Aguardando autorização para iniciar

### Objetivo
Mundo 2 (Caverna Assombrada) com tileset de caverna, 2 novos bosses e inimigos, power-ups de Estrela e Coração Extra.

### Entregável
> O jogador pode acessar e completar o Mundo 2 com seus 3 níveis, enfrentar o Palhaço (com efeito de confusão de tela) e o Espantalho (com corvos e braços giratórios).

### Escopo Técnico
- Tileset `world2_cave.png` aplicado aos níveis 4–6
- `ClownBoss`: bolas de malabarismo, 2 fases (confusão visual na Fase 2)
- `ScarecrowBoss`: extensão de braços 3 tiles, corvos, rotação 360° na Fase 2
- `FireGhost`: patrulha deixando rastro de fogo
- Mini Palhaço, Mini Espantalho, Corvo como inimigos
- Power-ups: Estrela (invencibilidade 10s), Coração Extra
- Efeito de distorção/confusão de tela (shader ou filter Phaser)

### Testes do Sprint 5
**Unit:** `ClownBoss` (2 fases, efeito confusão), `ScarecrowBoss` (alcance braços, spawn corvos), `FireGhost`
**Integration:** confusão de tela ativa e desativa corretamente, corvos seguem padrão senoidal, Estrela cancela dano
**E2E:** Mundo 2 completo, ambos os bosses derrotados, efeito de confusão visível na Fase 2 do Palhaço

---

## SPRINT 6 — Mundo 3 Parte 1 (Níveis 7–9 + T-Rex)

**Duração estimada:** 1 semana
**Status:** ✅ **CONCLUÍDO** (entregue como Sprint 5, branch `sprint/5-world3-trex`)

### Objetivo
Início do Mundo 3 (Cidade Abandonada) com tileset urbano, T-Rex com 3 fases e sistema de camera shake.

### Entregável
> O jogador pode jogar os níveis 7, 8 e 9, enfrentar o T-Rex com suas 3 fases (caminhada pesada, investida, onda de choque) e sentir o tremor de câmera no rugido.

### Escopo Técnico
- Tileset `world3_city.png` aplicado aos níveis 7–9
- `CameraSystem`: camera shake configurável (intensidade, duração)
- `TRexBoss`: 3 fases completas, hitbox grande, rugido = shake
- Fase 3: shockwave no chão (hitbox rastejante)
- `NerfRifle` power-up: projéteis mais rápidos, +1 dano, 30s
- Mini T-Rex como inimigo comum

### Testes do Sprint 6
**Unit:** `TRexBoss` (3 fases, shockwave), `CameraSystem` (shake parametrizado), `NerfRifle`
**Integration:** câmera shake dispara ao rugir, shockwave causa dano ao jogador no chão, fase 2 investida percorre arena inteira
**E2E:** T-Rex 3 fases se comportam corretamente em sequência, NerfRifle aumenta velocidade do projétil visível

---

## SPRINT 7 — Mundo 3 Parte 2 (Níveis 10–12 + Vampiro)

**Duração estimada:** 1 semana
**Status:** ✅ **CONCLUÍDO** (entregue como Sprint 6, branch `sprint/6-world3-vampire`) — VampireBoss 2 fases com lifesteal + bloqueio por água, Bat teleguiado, MiniVampire, barra de HP do boss com indicador de lifesteal, níveis 10–12, mapa com 12 nodes

### Objetivo
Encerrar o Mundo 3 com o Vampiro, mecânica de lifesteal visível no HUD e counter via Pistola de Água.

### Entregável
> O jogador pode completar os níveis 10, 11 (boss Vampiro) e 12. O Vampiro rouba vida e se transforma em morcego gigante. A Pistola de Água cancela o lifesteal.

### Escopo Técnico
- `VampireBoss`: 2 fases, morcegos teleguiados, lifesteal 5 HP a cada 3 hits
- Barra de HP do Vampiro mostra recuperação (lifesteal animado)
- Fase 2: sprite de morcego gigante, velocidade ×3
- `Bat`: inimigo morcego teleguiado
- Mini Vampiro como inimigo comum
- WaterGun obtida antes do boss cancela lifesteal por 5s
- Indicador visual de lifesteal na HUD do boss

### Testes do Sprint 7
**Unit:** `VampireBoss` (lifesteal, transformação), `Bat` (pathfinding teleguiado)
**Integration:** lifesteal recupera HP do boss, WaterGun cancela lifesteal, fase 2 transição visual
**E2E:** barra de HP do Vampiro sobe durante lifesteal, WaterGun para lifesteal visivelmente

---

## SPRINT 8 — Mundo 4 Parte 1 (Níveis 13–15 + Bola de Fogo + Polvo)

**Duração estimada:** 1,5 semanas
**Gate:** Aguardando autorização para iniciar

### Objetivo
Início do Mundo 4 (Castelo do Robô) com tileset metálico, dois novos bosses e a mecânica de tinta (escurecimento de tela).

### Entregável
> O jogador entra no Mundo 4, enfrenta a Bola de Fogo (com rastro de fogo e divisão) e o Polvo (com tinta que escurece a tela e múltiplos tentáculos).

### Escopo Técnico
- Tileset `world4_castle.png` aplicado aos níveis 13–15
- `FireballBoss`: rastro de fogo (hitbox persistente 3s), explosão em área, divisão em 2 bolas na Fase 2
- `OctopusBoss`: 4 tentáculos iniciais → 6 na Fase 2; tinta = overlay escuro 30% por 4s
- Efeito de tinta: Phaser overlay semi-transparente com timer
- Mini Bola de Fogo, Mini Polvo como inimigos

### Testes do Sprint 8
**Unit:** `FireballBoss` (divisão, rastro), `OctopusBoss` (tentáculos, tinta timer), efeito ink overlay
**Integration:** rastro de fogo causa dano por contato, tinta escurece tela e dura 4s, divisão cria 2 projéteis
**E2E:** tela escurece visivelmente durante tinta, Bola de Fogo se divide, Polvo tem 6 tentáculos na Fase 2

---

## SPRINT 9 — Mundo 4 Parte 2 (Níveis 16–19 + Escorpião)

**Duração estimada:** 1,5 semanas
**Gate:** Aguardando autorização para iniciar

### Objetivo
Concluir o caminho para o boss final com o Escorpião (veneno DoT + armadura frontal), todos os mini-inimigos e gauntlet dos níveis 17–18.

### Entregável
> O jogador enfrenta o Escorpião sabendo que a frente é invulnerável e que a cauda é o ponto fraco. O envenenamento é visível no HUD. Níveis 17 e 18 funcionam como gauntlet de mini-inimigos.

### Escopo Técnico
- `DotSystem`: engine de dano por tempo (DoT), suporta múltiplos efeitos simultâneos
- `ScorpionBoss`: armadura frontal (projéteis rebatidos), ponto fraco = cauda, veneno DoT 1/2s por 8s
- `PoisonIndicator`: ícone no HUD que pisca enquanto envenenado
- Níveis 17–18: tilemaps com spawn de minis de todos os bosses anteriores
- Mini Escorpião, Mini Robô Aranha como inimigos novos
- Fase 2 veneno 1/1s, Fase 3 frenesi de pinças

### Testes do Sprint 9
**Unit:** `DotSystem` (tick rate, expiração, stack de efeitos), `ScorpionBoss` (armadura frontal, weak point cauda, 3 fases)
**Integration:** projétil na frente é rebatido, projétil na cauda causa dano, DoT tick visível no HUD
**E2E:** PoisonIndicator aparece ao ser envenenado, desaparece ao fim do DoT, Escorpião 3 fases completas

---

## SPRINT 10 — Boss Final + Fim de Jogo Completo (Níveis 20–21)

**Duração estimada:** 2 semanas
**Gate:** Aguardando autorização para iniciar

### Objetivo
Nível 20 como gauntlet final e Nível 21 com o Robô do Mal (4 fases), cutscene de vitória pixel-art e tela de créditos.

### Entregável
> O jogador pode completar o jogo inteiro de ponta a ponta: 21 níveis, 9 bosses, tela de vitória com explosão pixel-art e créditos. O mapa do mundo exibe todos os 21 níveis como completos.

### Escopo Técnico
- `RobotBoss`: 4 fases completas
  - Fase 1: mísseis teleguiados + laser horizontal
  - Fase 2: laser vertical varrendo
  - Fase 3: escudo de energia (bloqueia projéteis) + 3 mini-robôs aranha
  - Fase 4: todas as habilidades simultâneas
- `ShieldSystem`: escudo que bloqueia projéteis e expira após X acertos
- Cutscene de vitória: explosão do Robô em partículas de pixel (Phaser particles)
- `VictoryScene`: animação + mensagem + botão para créditos
- `CreditsScene`: lista de créditos em scroll
- Nível 20: gauntlet com Mini Robô Aranha e todos os minis anteriores

### Testes do Sprint 10
**Unit:** `RobotBoss` (4 fases), `ShieldSystem` (bloqueia projéteis, expira), laser hitbox
**Integration:** escudo bloqueia projétil e decrementa, Fase 3 spawna mini-robôs, Fase 4 todas as habilidades ativas
**E2E Regressão Completa:**
```
tests/e2e/regression.spec.ts
  ✓ Menu carrega e inicia jogo
  ✓ Nível 1 completo do início ao fim
  ✓ Boss Fantasma (Nível 2) derrotado com mecânica de fraqueza
  ✓ Boss Palhaço (Nível 4) — efeito confusão na Fase 2
  ✓ Boss T-Rex (Nível 9) — 3 fases e camera shake
  ✓ Boss Vampiro (Nível 11) — lifesteal + counter WaterGun
  ✓ Boss Polvo (Nível 15) — tinta escurece tela
  ✓ Boss Escorpião (Nível 19) — armadura frontal, cauda é weak point
  ✓ Boss Robô do Mal (Nível 21) — 4 fases, vitória, créditos
  ✓ Save persiste entre reloads
  ✓ D-pad funciona em viewport 768px
  ✓ Jogo funciona em Firefox e WebKit
```

### Critério de Conclusão Final
- [ ] Jogo completo jogável de ponta a ponta (nível 1 ao 21)
- [ ] Todos os testes passando
- [ ] Cutscene de vitória exibe corretamente
- [ ] `npm run test:all` → 100% passando (unit + integration + e2e)
- [ ] TypeScript sem erros (`npm run type-check`)

---

## Resumo dos Sprints

| Sprint | Entregável de Valor | Níveis | Bosses | Status |
|---|---|---|---|---|
| **1** | MVP jogável: Nível 1 com todas as mecânicas | 1 | — | ✅ **CONCLUÍDO** (111 testes) |
| **2** | Nível 1 polido + Áudio + Mobile + CI/CD + GitHub Pages | 1 | — | ✅ **CONCLUÍDO** (170 testes) |
| **3** | Mundo 1 completo + Boss Fantasma + Mapa de Mundo | 1–3 | Fantasma | ✅ **CONCLUÍDO** (247 testes) |
| **4** | Mundo 2 + Palhaço + Espantalho + Caverna | 1–6 | Palhaço, Espantalho | ✅ **CONCLUÍDO** (Sprint 4) |
| **5** | Mundo 3 início + T-Rex 3 fases + Camera Shake | 1–9 | T-Rex | ✅ **CONCLUÍDO** |
| **6** | Mundo 3 completo + Vampiro + Lifesteal | 1–12 | Vampiro | ✅ **CONCLUÍDO** (436 testes) |
| **7** | Mundo 4 início + Bola de Fogo + Polvo + Tinta | 1–15 | Bola de Fogo, Polvo | Aguardando Sprint 6 |
| **8** | Mundo 4 parte 2 + Escorpião + DoT + Armadura | 1–19 | Escorpião | Aguardando Sprint 7 |
| **9** | Jogo completo + Robô Final 4 fases + Cutscene + QA | 1–21 | Robô do Mal | Aguardando Sprint 8 |

---

## Scripts npm

```json
{
  "scripts": {
    "dev":              "vite",
    "build":            "tsc && vite build",
    "preview":          "vite preview",
    "type-check":       "tsc --noEmit",
    "test:unit":        "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e":         "playwright test",
    "test:all":         "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:watch":       "vitest --watch tests/unit"
  }
}
```

---

## Notas Arquiteturais

- **Phaser sem anti-aliasing:** `antialias: false` garante look pixel-art blocky estilo Minecraft
- **Object pool:** `ObjectPool.ts` para projéteis e partículas evita GC spikes em 60fps
- **Sprites Sprint 1:** gerados via `Phaser.Graphics` — zero dependência de PNG externo no MVP
- **Mocks Phaser em Vitest:** `Phaser.Scene`, `Phaser.GameObjects.Sprite` etc. são mockados para unit/integration tests rodarem fora do browser
- **Carta Pokédex:** `BossIntroScene` exibe por 2s com nome, tipo e silhueta antes de cada boss — inspira familiaridade para fãs de Pokémon
- **DoT genérico:** `DotSystem` suporta múltiplos efeitos simultâneos (veneno + fogo), base para expansão futura
- **Performance mobile:** tilemaps carregados lazy por mundo, câmera desativa física de sprites fora do viewport
