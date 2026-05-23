# Casa Fantasma 2

Plataforma 2D inspirado em Mario / Mega Man, com armas de brinquedo enfrentando criaturas assombradas em três mundos temáticos.

**Jogue agora:** https://yurybs.github.io/casa-fantasma-21/

## Sobre o jogo

Você controla um garoto armado com sua Foam Gun (e, conforme o jogo avança, Water Gun e Nerf Rifle) e atravessa três mundos cheios de inimigos sobrenaturais e chefes únicos:

- **Mundo 1 — Floresta Encantada** (Níveis 1–3): zumbis, esqueletos, e o boss **Fantasma** com fase espectral
- **Mundo 2 — Caverna Assombrada** (Níveis 4–6): aranhas-fantasma, fantasmas-de-fogo, corvos, e dois bosses — **Palhaço** (com efeito de confusão de tela na Fase 2) e **Espantalho** (com braços extensíveis e rotação 360°)
- **Mundo 3 — Cidade Abandonada** (Níveis 7–9): atmosfera urbana com mini T-Rex, culminando no boss **T-Rex de 3 fases** (carga + rugido com tremor de câmera + ondas de choque rastejantes)

### Mecânicas

- Plataforma clássico com pulo duplo, run-and-gun e checkpoints
- 4 power-ups: **Pistola d'água** (2x dano contra fantasmas), **Estrela** (invencibilidade 10s), **Coração Extra** (+1 coração permanente, máx 2), **Nerf Rifle** (projéteis +80% velocidade, +1 dano, 30s)
- Sistema de salvamento automático (localStorage)
- Trilha sonora original sintetizada no Web Audio API — uma trilha por mundo, mais menu/título
- HUD com HP, vidas, moedas, e timer

### Controles

| Ação | Teclado | Toque (mobile) |
|---|---|---|
| Mover | ← / → ou A / D | botões da tela |
| Pular | Espaço | botão pular |
| Atirar | Z | botão atirar |
| Pausar | Esc | — |
| Menu / Mapa | Enter / M (no menu) | toque nos botões |

## Tech stack

- **[Phaser 3](https://phaser.io/)** — engine de jogos 2D para a Web (renderização WebGL/Canvas + física Arcade)
- **TypeScript** — toda a base de código é tipada estaticamente
- **[Vite](https://vitejs.dev/)** — bundler e dev server (HMR, build de produção otimizado)
- **[Vitest](https://vitest.dev/)** — runner para testes unitários e de integração da lógica pura
- **[Playwright](https://playwright.dev/)** — testes E2E (Chromium headless) sobre o jogo rodando real
- **Web Audio API** — geração procedural de SFX e BGM (osciladores square/triangle/sawtooth, sem arquivos de áudio)
- **Sprites procedurais** — todos os personagens, tiles e itens são desenhados em tempo de execução via `Phaser.GameObjects.Graphics` (sem assets externos), o que mantém o bundle pequeno
- **GitHub Actions + GitHub Pages** — CI executa `tsc`, vitest, playwright e build a cada push; deploy automático para Pages na master

### Arquitetura

- `src/entities/` — classes de lógica pura (Player, bosses, inimigos) sem dependência de Phaser, facilitando testes unitários
- `src/scenes/` — cenas Phaser (Menu, WorldMap, GameScene, BossIntroScene, PauseScene, LevelComplete, GameOver)
- `src/systems/` — sistemas reutilizáveis (SaveSystem, SoundSystem, InputSystem, CameraSystem, HUDSystem, ParticleEffects, ScreenConfusion)
- `src/config/LevelConfig.ts` — definição declarativa dos 9 níveis (tiles, inimigos, pickups, bosses)
- `src/utils/SpriteGenerator.ts` — todas as texturas pixel-art geradas via Graphics
- `tests/unit/` — testes da lógica pura (Vitest, ~280 testes)
- `tests/integration/` — testes que combinam várias entidades (~30 testes)
- `tests/e2e/` — testes Playwright do jogo completo no browser (~70 testes)

## Desenvolvimento

```bash
# Instalar dependências
npm ci

# Dev server (http://localhost:5173)
npm run dev

# Type-check
npm run type-check

# Testes
npm run test:unit         # vitest unit
npm run test:integration  # vitest integration
npm run test:e2e          # playwright (precisa instalar browsers: npx playwright install chromium)
npm run test:all          # tudo

# Build de produção (output em dist/)
npm run build

# Preview do build
npm run preview
```

## Histórico de sprints

| Sprint | Entrega | Branch |
|---|---|---|
| 1 | MVP Level 1 com mecânicas core (pulo, tiro, inimigos básicos) | `sprint/1-mvp-level-1` |
| 2 | Level 1 polido (HUD, áudio, partículas, save) | `sprint/2-polish-level-1` |
| 3 | Mundo 1 completo + boss Fantasma + WaterGun | `sprint/3-world1-complete` |
| 4 | Mundo 2 (Caverna) + boss Palhaço + boss Espantalho + Estrela + Coração Extra | `sprint/4-world2-cave` |
| 5 | Mundo 3 (Cidade) + boss T-Rex 3 fases + Camera shake + NerfRifle | `sprint/5-world3-trex` |

## Estado atual

- 9 níveis jogáveis (3 mundos completos)
- 4 chefes únicos com fases e mecânicas próprias
- 4 power-ups diferentes
- ~380 testes automatizados (unit + integration + e2e) rodando em CI
- Deploy contínuo para GitHub Pages
