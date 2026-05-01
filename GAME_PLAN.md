# Toy Blaster Kid — Plano de Desenvolvimento Completo

## Visão Geral

Jogo de plataforma 2D para web, gratuito, inspirado em Super Mario Bros. com estética pixel art estilo Minecraft. O personagem principal é um menino com armas de brinquedo que deve passar por 21 níveis derrotando inimigos e chefões. Público-alvo: crianças de 8 anos fãs de Mario e Pokémon.

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Engine de Jogo | **Phaser 3** | Madura, bem documentada, suporte a canvas/WebGL, física, tilemaps |
| Linguagem | **TypeScript** | Tipagem para maior segurança no desenvolvimento |
| Build | **Vite** | Rápido, zero config com Phaser 3 |
| Assets de Tile | **Tiled** (formato JSON) | Padrão de mercado para tilemaps |
| Unit Tests | **Vitest** | Compatível com Vite, rápido |
| Integration Tests | **Vitest + mocks Phaser** | Testa sistemas isolados do jogo |
| E2E Tests | **Playwright** | Testa o jogo rodando no browser |
| CI | **GitHub Actions** | Pipeline automático |

---

## Estrutura do Projeto

```
toy-blaster-kid/
├── src/
│   ├── main.ts                  # Entry point, configura Phaser
│   ├── config/
│   │   ├── GameConfig.ts        # Configuração global do Phaser
│   │   ├── LevelConfig.ts       # Dados de todos os 21 níveis
│   │   └── EnemyConfig.ts       # Stats dos inimigos e chefões
│   ├── scenes/
│   │   ├── BootScene.ts         # Carrega assets iniciais
│   │   ├── PreloadScene.ts      # Barra de carregamento
│   │   ├── MenuScene.ts         # Menu principal
│   │   ├── WorldMapScene.ts     # Mapa entre níveis (estilo Mario World)
│   │   ├── GameScene.ts         # Cena principal de jogo
│   │   ├── BossScene.ts         # Cena de batalha contra chefão
│   │   ├── PauseScene.ts        # Menu de pausa
│   │   ├── GameOverScene.ts     # Tela de game over
│   │   └── VictoryScene.ts      # Tela de vitória
│   ├── entities/
│   │   ├── Player.ts            # Classe do jogador
│   │   ├── enemies/
│   │   │   ├── BaseEnemy.ts     # Classe base de inimigo
│   │   │   ├── Skeleton.ts
│   │   │   ├── Zombie.ts
│   │   │   ├── SpiderGhost.ts
│   │   │   ├── FireGhost.ts
│   │   │   └── MiniEnemy.ts     # Classe genérica para minis
│   │   └── bosses/
│   │       ├── BaseBoss.ts      # Classe base de chefão
│   │       ├── GhostBoss.ts     # Nível 2
│   │       ├── ClownBoss.ts     # Nível 4
│   │       ├── ScarecrowBoss.ts # Nível 6
│   │       ├── TRexBoss.ts      # Nível 9
│   │       ├── VampireBoss.ts   # Nível 11
│   │       ├── FireballBoss.ts  # Nível 13
│   │       ├── OctopusBoss.ts   # Nível 15
│   │       ├── ScorpionBoss.ts  # Nível 19
│   │       └── RobotBoss.ts     # Nível 21 (chefão final)
│   ├── weapons/
│   │   ├── BaseWeapon.ts
│   │   ├── FoamGun.ts           # Arma padrão (espuma)
│   │   ├── WaterGun.ts          # Power-up de água (derrota fantasmas)
│   │   └── Nerf.ts              # Power-up avançado
│   ├── systems/
│   │   ├── CameraSystem.ts      # Scroll da câmera
│   │   ├── CollisionSystem.ts   # Detecção de colisão
│   │   ├── PhysicsSystem.ts     # Gravidade e pulo
│   │   ├── SaveSystem.ts        # Salvar progresso (localStorage)
│   │   ├── SoundSystem.ts       # Gerenciador de áudio
│   │   ├── InputSystem.ts       # Teclado + touch mobile
│   │   └── HUDSystem.ts         # Interface: vida, moedas, tempo
│   ├── ui/
│   │   ├── HealthBar.ts         # Barra de vida (jogador e chefões)
│   │   ├── CoinCounter.ts       # Contador de moedas
│   │   ├── LivesDisplay.ts      # Vidas restantes
│   │   └── TouchControls.ts     # D-pad virtual para mobile
│   ├── utils/
│   │   ├── AssetLoader.ts       # Helpers para carregar sprites
│   │   ├── TilemapBuilder.ts    # Monta fase a partir do JSON do Tiled
│   │   └── AnimationFactory.ts  # Registra todas as animações
│   └── types/
│       ├── GameTypes.ts         # Interfaces e tipos globais
│       └── PhaserExtensions.ts  # Extensões de tipo do Phaser
├── assets/
│   ├── sprites/
│   │   ├── player/              # Spritesheet do menino (idle, run, jump, shoot, die)
│   │   ├── enemies/             # Spritesheets dos inimigos comuns
│   │   ├── bosses/              # Spritesheets dos 9 chefões
│   │   ├── weapons/             # Projéteis: espuma, água, nerf
│   │   └── ui/                  # Ícones de HUD, botões, corações
│   ├── tilesets/
│   │   ├── world1_grass.png     # Tileset mundo 1 (floresta)
│   │   ├── world2_cave.png      # Tileset mundo 2 (caverna)
│   │   ├── world3_city.png      # Tileset mundo 3 (cidade)
│   │   └── world4_castle.png    # Tileset mundo 4 (castelo)
│   ├── tilemaps/
│   │   ├── level_01.json        # ... level_21.json
│   ├── audio/
│   │   ├── music/               # BGM por mundo (.ogg + .mp3)
│   │   └── sfx/                 # Jump, shoot, hit, coin, etc.
│   └── fonts/
│       └── pixel_font.png       # Bitmap font estilo pixel
├── tests/
│   ├── unit/
│   │   ├── entities/
│   │   │   ├── Player.test.ts
│   │   │   ├── BaseEnemy.test.ts
│   │   │   └── BaseBoss.test.ts
│   │   ├── systems/
│   │   │   ├── SaveSystem.test.ts
│   │   │   ├── CollisionSystem.test.ts
│   │   │   └── PhysicsSystem.test.ts
│   │   └── weapons/
│   │       └── FoamGun.test.ts
│   ├── integration/
│   │   ├── PlayerEnemyInteraction.test.ts
│   │   ├── BossFight.test.ts
│   │   ├── LevelProgression.test.ts
│   │   └── SaveLoad.test.ts
│   └── e2e/
│       ├── menu.spec.ts
│       ├── gameplay.spec.ts
│       ├── boss_fight.spec.ts
│       └── progression.spec.ts
├── public/
│   └── index.html
├── playwright.config.ts
├── vitest.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Mecânicas de Jogo

### Personagem Principal — "Toy Blaster Kid"
- **Movimento:** andar (esquerda/direita), agachar
- **Pulo:** pulo simples + pulo duplo (como Mario moderno)
- **Ataque:** disparo de projétil com arma de brinquedo (espuma por padrão)
- **Vida:** 3 corações (cada coração = 2 HP) → 6 HP total
- **Vidas:** começa com 3; ao chegar a 0 → Game Over
- **Invencibilidade temporária:** 1,5s após levar dano (pisca)

### Controles
| Ação | Teclado | Mobile |
|---|---|---|
| Mover | Setas / A-D | D-pad virtual |
| Pular | Espaço / W / Seta cima | Botão A |
| Atirar | Z / J / Ctrl | Botão B |
| Agachar | S / Seta baixo | Seta baixo do D-pad |
| Pausa | Esc / P | Botão Pause |

### Física (estilo Mario)
- Gravidade constante puxando o personagem para baixo
- Pulo com apex variável (segurar = pulo maior, soltar = pulo menor)
- Plataformas sólidas (top), atravessáveis de baixo para cima (tipo "plataformas flutuantes")
- Aceleração e fricção no movimento horizontal
- Velocidade máxima de queda (terminal velocity)

### Power-ups (inspirados em Mario)
| Item | Efeito |
|---|---|
| Estrela de Brinquedo | Invencibilidade temporária (10s) |
| Pistola de Água | Troca a arma para água — eficaz contra fantasmas/vampiro |
| Nerf Rifle | Projéteis mais rápidos e maior dano por 30s |
| Coração Extra | +1 coração (máx 5) |
| Cogumelo de Crescimento | Aumenta o personagem, mais resistente por 20s |
| Moeda de Ouro | +1 ao contador; a cada 100 → vida extra |

---

## Estrutura dos 21 Níveis

### Mundos e Temas (grupos de níveis)
| Mundo | Níveis | Tema Visual | Tileset |
|---|---|---|---|
| 1 — Floresta Encantada | 1–3 | Árvores, grama, flores | `world1_grass` |
| 2 — Caverna Assombrada | 4–6 | Pedras, estalactites, escuridão | `world2_cave` |
| 3 — Cidade Abandonada | 7–12 | Prédios, asfalto, luzes quebradas | `world3_city` |
| 4 — Castelo do Robô | 13–21 | Metal, lasers, engrenagens | `world4_castle` |

### Progressão de Níveis com Chefões
| Nível | Tipo | Chefão | Inimigos Comuns |
|---|---|---|---|
| 1 | Normal | — | Esqueleto, Zumbi |
| 2 | **BOSS** | Fantasma | Mini Fantasma, Monstrinhos |
| 3 | Normal | — | Esqueleto, Zumbi, Fantasma Aranha |
| 4 | **BOSS** | Palhaço | Mini Palhaço, Monstrinhos |
| 5 | Normal | — | Zumbi, Fantasma Aranha |
| 6 | **BOSS** | Espantalho | Mini Espantalho, Corvos |
| 7 | Normal | — | Esqueleto, Fantasma de Fogo |
| 8 | Normal | — | Zumbi, Fantasma Aranha |
| 9 | **BOSS** | T-Rex | Mini T-Rex, Esqueleto |
| 10 | Normal | — | Fantasma de Fogo, Mini T-Rex |
| 11 | **BOSS** | Vampiro | Mini Vampiro, Morcegos |
| 12 | Normal | — | Mini Vampiro, Fantasma de Fogo |
| 13 | **BOSS** | Bola de Fogo | Mini Bola de Fogo |
| 14 | Normal | — | Mini Bola de Fogo, Zumbi |
| 15 | **BOSS** | Polvo | Mini Polvo, Monstrinhos |
| 16 | Normal | — | Mini Polvo, Esqueleto |
| 17 | Normal | — | Todos os minis anteriores |
| 18 | Normal | — | Mistura de inimigos difíceis |
| 19 | **BOSS** | Escorpião | Mini Escorpião, Fantasma Aranha |
| 20 | Normal | — | Mini Robô Aranha, todos os minis |
| 21 | **BOSS FINAL** | Robô do Mal | Mini Robô, Mini Escorpião |

---

## Chefões — Comportamento Detalhado

### Nível 2 — Fantasma
- **HP:** 30 | **Fase:** 1
- Flutua horizontalmente; pode atravessar paredes
- Ataque 1: investida rápida em linha reta
- Ataque 2: invoca 2 mini fantasmas a cada 50% de HP
- **Fraqueza:** Pistola de Água causa dano duplo

### Nível 4 — Palhaço
- **HP:** 50 | **Fases:** 2
- Fase 1: arremessa 3 bolas de malabarismo em arco
- Fase 2 (< 50% HP): velocidade aumenta 40%, risada ativa efeito de confusão na tela (leve distorção visual)
- Padrão: pular para outra plataforma a cada 5s

### Nível 6 — Espantalho
- **HP:** 70 | **Fases:** 2
- Braços se estendem horizontalmente (alcance de 3 tiles)
- Invoca corvos que voam em padrão senoidal
- Fase 2 (< 40% HP): braços giram 360°

### Nível 9 — T-Rex
- **HP:** 120 | **Fases:** 3
- Fase 1: caminha pesadamente, rugido causa trêmulo na câmera
- Fase 2 (< 66% HP): investida em alta velocidade atravessando a arena
- Fase 3 (< 33% HP): pisa forte causando ondas de choque no chão
- **Hitbox grande:** requer ~10 acertos de espuma

### Nível 11 — Vampiro
- **HP:** 100 | **Fases:** 2
- Fase 1: flutua, dispara morcegos teleguiados
- Capacidade lifesteal: cura 5 HP a cada 3 acertos no jogador
- Fase 2 (< 50% HP): transforma-se em morcego gigante, velocidade triplicada
- **Fraqueza:** Pistola de Água cancela lifesteal temporariamente

### Nível 13 — Bola de Fogo
- **HP:** 90 | **Fases:** 2
- Deixa rastro de fogo no chão por 3s
- Explode em área ao colidir com parede (raio de 2 tiles)
- Fase 2 (< 50% HP): divide-se em 2 bolas menores temporariamente

### Nível 15 — Polvo
- **HP:** 140 | **Fases:** 3
- 4 tentáculos atacam de posições diferentes simultaneamente
- Lança tinta que escurece 30% da tela por 4s
- Fase 2 (< 60% HP): 2 tentáculos extras emergem
- Fase 3 (< 30% HP): lança tinta contínua + tentáculos frenéticos

### Nível 19 — Escorpião
- **HP:** 160 | **Fases:** 3
- Veneno (DoT): 1 dano a cada 2s por 8s
- Carapaça: imune a projéteis frontais, ponto fraco na cauda
- Fase 2 (< 50% HP): veneno mais rápido (1 dano/s)
- Fase 3 (< 20% HP): frenesi de ataques com pinças

### Nível 21 — Robô do Mal (Boss Final)
- **HP:** 300 | **Fases:** 4
- Fase 1: mísseis teleguiados, laser horizontal
- Fase 2 (< 75% HP): laser vertical varrendo arena
- Fase 3 (< 50% HP): invoca 3 mini robôs aranha + escudo de energia
- Fase 4 (< 25% HP): todas as habilidades simultâneas, velocidade máxima
- **Cutscene de derrota:** robô explode em pixels estilo Minecraft

---

## Inimigos Comuns

| Inimigo | HP | Dano | Comportamento |
|---|---|---|---|
| Esqueleto | 3 | 1 | Patrulha horizontal, arremessa ossos |
| Zumbi | 5 | 1 | Persegue o jogador lentamente |
| Fantasma Aranha | 4 | 1 | Flutua e descende em fio de teia |
| Fantasma de Fogo | 6 | 2 | Patrulha; deixa rastro de fogo |
| Monstrinhos | 2 | 1 | Saltam aleatoriamente |
| Mini [Boss] | 50% stats do boss | — | Comportamento simplificado do chefão |

---

## Sistema de Progressão e Salvamento

```
SaveData {
  currentLevel: number          // Nível atual
  lives: number                 // Vidas restantes
  coins: number                 // Moedas acumuladas
  levelsCompleted: boolean[]    // Array de 21 posições
  highScore: number             // Pontuação máxima
  unlockedWorlds: number[]      // Mundos desbloqueados
}
```

- Salvo automaticamente ao completar cada nível (`localStorage`)
- Checkpoints visuais dentro de níveis longos (bandeiras como Mario)
- Ao continuar: começa do último checkpoint ou início do nível

---

## HUD (Interface durante o jogo)

```
┌─────────────────────────────────────────┐
│ ❤️❤️❤️  VIDAS: 3   💰 MOEDAS: 042  ⏱️ 400 │
│                                         │
│                  [JOGO]                 │
│                                         │
│ [BOSS HP: ████████░░░░░░░░ 60%]        │
└─────────────────────────────────────────┘
```

- Corações para vida (máx 5)
- Contador de moedas
- Cronômetro regressivo (penalidade de pontos ao esgotar, não game over)
- Barra de HP do chefão (aparece apenas em batalhas de boss)

---

## Visual — Pixel Art Estilo Minecraft

### Paleta de Cores por Mundo
| Mundo | Cores Primárias |
|---|---|
| Floresta | Verde (#5B8A52), Marrom (#8B5E3C), Azul Céu (#87CEEB) |
| Caverna | Cinza (#555), Azul Escuro (#1A1A2E), Laranja de Tocha (#FF6B35) |
| Cidade | Cinza Asfalto (#3D3D3D), Amarelo Neon (#FFE600), Vermelho (#CC2936) |
| Castelo | Prata (#B0B0B0), Vermelho Escuro (#8B0000), Preto (#111) |

### Tamanhos de Sprite
- **Player:** 32×48px (bloco Minecraft = 16px, personagem = 2 blocos)
- **Inimigos comuns:** 32×32px
- **Chefões:** 64×64px a 128×128px (conforme tamanho narrativo)
- **Tiles do mapa:** 16×16px
- **Projéteis:** 8×8px

### Animações Obrigatórias por Entidade

**Player:**
- `idle` (2 frames), `run` (6 frames), `jump` (2 frames)
- `fall` (2 frames), `shoot` (3 frames), `hurt` (2 frames), `die` (5 frames)

**Inimigos:**
- `idle` (2 frames), `walk` (4 frames), `attack` (3 frames), `die` (4 frames)

**Chefões:**
- Todas as do inimigo + `phase_transition` (5 frames) + animação única por habilidade

---

## Sistema de Testes

### Unit Tests (Vitest)

Cobrem lógica pura, sem depender do Phaser rodando.

```
tests/unit/entities/Player.test.ts
  ✓ começa com 6 HP
  ✓ perde HP ao tomar dano
  ✓ não pode ter HP negativo
  ✓ morre quando HP chega a 0
  ✓ período de invencibilidade após dano
  ✓ duplo pulo reseta ao tocar o chão
  ✓ coin collection incrementa contador

tests/unit/entities/BaseEnemy.test.ts
  ✓ patrulha inverte direção na borda de plataforma
  ✓ detecta jogador no range de visão
  ✓ morre quando HP ≤ 0
  ✓ aplica dano correto ao jogador

tests/unit/entities/BaseBoss.test.ts
  ✓ transição de fase ao atingir threshold de HP
  ✓ fase 1 ativa habilidades corretas
  ✓ fase 2 ativa habilidades corretas
  ✓ derrota aciona sequência de morte
  ✓ lifesteal funciona corretamente (Vampiro)
  ✓ veneno aplica DoT corretamente (Escorpião)

tests/unit/systems/SaveSystem.test.ts
  ✓ salva estado no localStorage
  ✓ carrega estado do localStorage
  ✓ fallback para novo jogo quando save corrompido
  ✓ atualiza nível completado corretamente

tests/unit/systems/CollisionSystem.test.ts
  ✓ detecta colisão jogador-plataforma
  ✓ detecta colisão projétil-inimigo
  ✓ detecta colisão inimigo-jogador
  ✓ não detecta colisão fora do range

tests/unit/systems/PhysicsSystem.test.ts
  ✓ aplica gravidade corretamente
  ✓ limita velocidade de queda
  ✓ pulo com hold vs tap
  ✓ duplo pulo disponível após pulo simples

tests/unit/weapons/FoamGun.test.ts
  ✓ dispara projétil na direção correta
  ✓ cooldown entre disparos
  ✓ projétil expira ao sair da tela
  ✓ projétil aplica dano ao colidir com inimigo
```

### Integration Tests (Vitest com mocks de Phaser)

Testam interação entre sistemas, usando mocks do Phaser para evitar necessidade de browser.

```
tests/integration/PlayerEnemyInteraction.test.ts
  ✓ jogador perde HP ao colidir com inimigo
  ✓ inimigo perde HP ao ser atingido por projétil
  ✓ inimigo morre e remove-se da cena
  ✓ power-up é coletado e aplica efeito
  ✓ moeda é coletada e incrementa contador

tests/integration/BossFight.test.ts
  ✓ boss spawna ao entrar na arena de boss
  ✓ barra de HP do boss aparece na HUD
  ✓ boss transita de fase ao atingir threshold
  ✓ derrota do boss aciona cutscene + avança nível
  ✓ mini inimigos spawnam nos momentos corretos

tests/integration/LevelProgression.test.ts
  ✓ completar nível normal → desbloqueia próximo
  ✓ completar nível boss → desbloqueia mundo novo
  ✓ coleta de 100 moedas → vida extra
  ✓ morte com 0 vidas → Game Over
  ✓ continuar após Game Over mantém nível atual

tests/integration/SaveLoad.test.ts
  ✓ progresso persiste ao recarregar a página
  ✓ recomeçar do checkpoint após morte
  ✓ níveis completados persistem entre sessões
```

### E2E Tests (Playwright)

Testam o jogo real rodando no browser com Chromium headless.

```
tests/e2e/menu.spec.ts
  ✓ menu principal carrega e exibe título
  ✓ botão "Jogar" inicia o jogo
  ✓ botão "Continuar" aparece se há save
  ✓ botão "Continuar" carrega o save correto
  ✓ música do menu toca (verifica AudioContext ativo)

tests/e2e/gameplay.spec.ts
  ✓ personagem aparece na posição inicial
  ✓ tecla direita move o personagem para a direita
  ✓ tecla espaço faz o personagem pular
  ✓ personagem cai ao pular sem plataforma abaixo
  ✓ personagem aterrissa em plataforma
  ✓ tecla Z dispara projétil visível
  ✓ projétil desaparece ao atingir parede
  ✓ HUD exibe corações, moedas e tempo corretamente
  ✓ pausar com Esc exibe menu de pausa
  ✓ retomar do pause continua de onde parou

tests/e2e/boss_fight.spec.ts
  ✓ transição de cena ao entrar no boss
  ✓ barra de HP do boss visível na tela
  ✓ boss muda de comportamento ao mudar de fase
  ✓ derrota do boss exibe animação de vitória
  ✓ jogador avança para próximo nível após boss

tests/e2e/progression.spec.ts
  ✓ completar nível 1 desbloqueia nível 2 no mapa
  ✓ mapa do mundo exibe progresso corretamente
  ✓ completar nível 2 (boss) muda visual do mapa
  ✓ Game Over retorna ao menu com opção de continuar
  ✓ salvar e recarregar mantém progresso no mapa
```

---

## Configuração de CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run build
      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Scripts do package.json

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:watch": "vitest --watch tests/unit"
  }
}
```

---

## Ordem de Desenvolvimento Recomendada

### Fase 1 — Fundação
1. Setup do projeto (Vite + Phaser 3 + TypeScript)
2. `GameConfig.ts` e `main.ts`
3. `BootScene` + `PreloadScene` com assets placeholder
4. `Player.ts` — movimento, pulo duplo, física
5. `InputSystem.ts` — teclado + touch
6. `TilemapBuilder.ts` — carregar nível 1 do Tiled
7. Testes unitários do Player e PhysicsSystem

### Fase 2 — Inimigos e Combate
8. `BaseEnemy.ts` + `Skeleton.ts` + `Zombie.ts`
9. `FoamGun.ts` + `CollisionSystem.ts`
10. `HUDSystem.ts` — corações, moedas, tempo
11. Testes unitários dos inimigos e CollisionSystem

### Fase 3 — Progressão
12. `SaveSystem.ts` + `WorldMapScene.ts`
13. Completar os 21 tilemaps de fase
14. `GameOverScene.ts` + `VictoryScene.ts`
15. Testes de integração de progressão e save

### Fase 4 — Chefões
16. `BaseBoss.ts` + `BossScene.ts`
17. Implementar os 9 chefões um por um (ordem cronológica dos níveis)
18. Testes unitários e de integração de cada boss

### Fase 5 — Polimento
19. Assets de pixel art finais (substituir placeholders)
20. Sistema de áudio (`SoundSystem.ts`)
21. `TouchControls.ts` (D-pad mobile)
22. Power-ups (`WaterGun.ts`, `Nerf.ts`, etc.)
23. Animações e partículas de efeito

### Fase 6 — Testes E2E e Deploy
24. Suite completa de testes Playwright
25. Pipeline GitHub Actions
26. Deploy no GitHub Pages

---

## Estimativa de Assets Necessários

| Tipo | Quantidade |
|---|---|
| Spritesheets de personagem | 1 (player) |
| Spritesheets de inimigos comuns | 5 |
| Spritesheets de chefões | 9 |
| Tilesets | 4 (um por mundo) |
| Tilemaps (JSON) | 21 |
| Músicas de fundo | 5 (4 mundos + menu) |
| Efeitos sonoros | ~15 (jump, shoot, hit, coin, die, boss_intro…) |
| Sprites de projéteis | 3 |
| Sprites de power-ups | 5 |
| Sprites de UI | ~10 (corações, botões, molduras) |

---

## Notas Finais para o Desenvolvedor

- **Pixi de Minecraft:** tiles devem ter aspecto quadrado e blocos sólidos sem anti-aliasing. Desativar `antialias: false` na config do Phaser.
- **Apelo Pokémon:** cada chefão tem uma "ficha" com nome e tipo (ex: Fantasma — Tipo: Espectral), visível antes da batalha como uma Pokédex simplificada.
- **Acessibilidade infantil:** textos grandes, feedback sonoro e visual para cada ação, dificuldade progressiva suave nos primeiros níveis.
- **Performance:** target 60fps. Usar object pooling para projéteis e partículas. Desligar física de objetos fora da câmera.
- **Mobile first:** o jogo deve funcionar bem em tablet. D-pad virtual e botões de ação no canto inferior direito.
